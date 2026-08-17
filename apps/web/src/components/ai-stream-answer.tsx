"use client";

import Link from "next/link";
import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type FormEvent,
} from "react";
import {
  AlertTriangle,
  ArrowRight,
  CheckCircle2,
  LoaderCircle,
  RefreshCw,
  RotateCcw,
  Send,
  Square,
} from "lucide-react";
import type {
  AiAskResponse,
  AiConversationMessage,
  AiStreamEvent,
  DeviceModelSummary,
  PaginatedResult,
} from "@spechub/api-client";
import { api } from "@/lib/api";
import { DeviceList } from "@/components/device-list";
import { MarkdownContent } from "@/components/markdown-content";
import { Surface, SurfaceHeader } from "@/components/surface";

type StreamContext = Extract<AiStreamEvent, { type: "context" }>;

type ActiveAiRequest = {
  question: string;
  history: AiConversationMessage[];
};

type PreviousTurn = {
  question: string;
  answer: string;
};

type PersistedConversation = {
  version: 1;
  rootQuestion: string;
  request: ActiveAiRequest;
  previousTurns: PreviousTurn[];
  answer: string;
  status: string;
  context: StreamContext | null;
  result: AiAskResponse | null;
  savedAt: number;
};

const CONVERSATION_STORAGE_KEY = "spechub-ai-conversation-v1";
const HISTORY_LIMIT = 16;
const CONVERSATION_MAX_AGE_MS = 24 * 60 * 60 * 1_000;

export function AiStreamAnswer({
  question,
  catalogMatches,
}: {
  question: string;
  catalogMatches: PaginatedResult<DeviceModelSummary> | null;
}) {
  const [run, setRun] = useState(0);
  const [request, setRequest] = useState<ActiveAiRequest>({
    question,
    history: [],
  });
  const [previousTurns, setPreviousTurns] = useState<PreviousTurn[]>([]);
  const [followUp, setFollowUp] = useState("");
  const [answer, setAnswer] = useState("");
  const [status, setStatus] = useState("Trợ lý đang trả lời...");
  const [context, setContext] = useState<StreamContext | null>(null);
  const [result, setResult] = useState<AiAskResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isStreaming, setIsStreaming] = useState(true);
  const [isConversationReady, setIsConversationReady] = useState(false);
  const [hasRestoredAnswer, setHasRestoredAnswer] = useState(false);
  const abortRef = useRef<AbortController | null>(null);

  const handleEvent = useCallback((event: AiStreamEvent) => {
    if (event.type === "status") {
      setStatus(event.message);
      return;
    }
    if (event.type === "context") {
      setContext(event);
      return;
    }
    if (event.type === "reset") {
      setAnswer("");
      return;
    }
    if (event.type === "delta") {
      setAnswer((current) => current + event.text);
      return;
    }
    if (event.type === "result") {
      setResult(event.response);
      setAnswer((current) =>
        reconcileStreamingAnswer(current, event.response.data.answer),
      );
      setError(null);
      setIsStreaming(false);
      return;
    }
    setError(event.message);
    setIsStreaming(false);
  }, []);

  useEffect(() => {
    if (!isConversationReady || hasRestoredAnswer) return;

    const abortController = new AbortController();
    abortRef.current?.abort();
    abortRef.current = abortController;
    setAnswer("");
    setContext(null);
    setResult(null);
    setError(null);
    setStatus("Trợ lý đang trả lời...");
    setIsStreaming(true);

    void api
      .streamAi(
        { question: request.question, top_k: 6, history: request.history },
        handleEvent,
        abortController.signal,
      )
      .catch((streamError) => {
        if (abortController.signal.aborted) return;
        setError(
          streamError instanceof Error
            ? streamError.message
            : "Không thể nhận câu trả lời từ AI.",
        );
        setIsStreaming(false);
      });

    return () => abortController.abort();
  }, [handleEvent, hasRestoredAnswer, isConversationReady, request, run]);

  useEffect(() => {
    abortRef.current?.abort();
    setIsConversationReady(false);
    setFollowUp("");
    const savedConversation = readConversation(question);
    if (savedConversation) {
      setRequest(savedConversation.request);
      setPreviousTurns(savedConversation.previousTurns);
      setAnswer(savedConversation.answer);
      setStatus(savedConversation.status || "Đã khôi phục cuộc trò chuyện.");
      setContext(savedConversation.context);
      setResult(savedConversation.result);
      setError(null);
      setIsStreaming(false);
      setHasRestoredAnswer(Boolean(savedConversation.result));
    } else {
      setPreviousTurns([]);
      setRequest({ question, history: [] });
      setAnswer("");
      setStatus("Trợ lý đang trả lời...");
      setContext(null);
      setResult(null);
      setError(null);
      setIsStreaming(true);
      setHasRestoredAnswer(false);
    }
    setRun(0);
    setIsConversationReady(true);
  }, [question]);

  useEffect(() => {
    if (!isConversationReady || isStreaming || !result) return;

    const conversation: PersistedConversation = {
      version: 1,
      rootQuestion: question,
      request,
      previousTurns,
      answer,
      status,
      context,
      result,
      savedAt: Date.now(),
    };
    try {
      window.sessionStorage.setItem(
        CONVERSATION_STORAGE_KEY,
        JSON.stringify(conversation),
      );
    } catch {
      // Storage can be unavailable in private browsing; the live conversation
      // still works normally in that case.
    }
  }, [
    answer,
    context,
    isConversationReady,
    isStreaming,
    previousTurns,
    question,
    request,
    result,
    status,
  ]);

  const beginFollowUp = useCallback(
    (nextQuestion: string) => {
      const normalizedQuestion = nextQuestion.trim();
      if (!normalizedQuestion || isStreaming || !result) return;

      const currentAnswer = result.data.answer.trim();
      if (!currentAnswer) return;
      const history = compactHistoryWithRoot(
        [
          ...request.history,
          { role: "user" as const, content: request.question },
          { role: "assistant" as const, content: currentAnswer },
        ],
        question,
      );
      setPreviousTurns((turns) => [
        ...turns,
        { question: request.question, answer: currentAnswer },
      ]);
      setFollowUp("");
      setAnswer("");
      setContext(null);
      setResult(null);
      setError(null);
      setStatus("Trợ lý đang trả lời...");
      setIsStreaming(true);
      setHasRestoredAnswer(false);
      setRequest({ question: normalizedQuestion, history });
      setRun(0);
    },
    [isStreaming, question, request, result],
  );

  const submitFollowUp = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    beginFollowUp(followUp);
  };

  const restartConversation = useCallback(() => {
    abortRef.current?.abort();
    try {
      window.sessionStorage.removeItem(CONVERSATION_STORAGE_KEY);
    } catch {
      // Nothing else is required when storage is unavailable.
    }
    setPreviousTurns([]);
    setFollowUp("");
    setAnswer("");
    setContext(null);
    setResult(null);
    setError(null);
    setStatus("Trợ lý đang trả lời...");
    setIsStreaming(true);
    setHasRestoredAnswer(false);
    setRequest({ question, history: [] });
    setRun((current) => current + 1);
  }, [question]);

  const retryAnswer = useCallback(() => {
    setHasRestoredAnswer(false);
    setRun((current) => current + 1);
  }, []);

  const citations = result?.data.citations ?? context?.citations ?? [];
  const intent = result?.meta.intent ?? context?.meta.intent;
  const usesConversationContext =
    result?.meta.contextual_follow_up ?? context?.meta.contextual_follow_up;
  const showInitialCatalogMatches =
    !previousTurns.length && request.question === question;

  return (
    <section className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_380px]">
      <div className="space-y-5">
        {previousTurns.length ? (
          <Surface>
            <SurfaceHeader
              title="Ngữ cảnh cuộc trò chuyện"
              meta={`${previousTurns.length} lượt trước`}
            />
            <div className="divide-y divide-slate-100">
              {previousTurns.map((turn, index) => (
                <div key={`${turn.question}-${index}`} className="p-4">
                  <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                    Bạn đã hỏi
                  </p>
                  <p className="mt-1 text-sm font-medium text-slate-900">
                    {turn.question}
                  </p>
                  <div className="mt-3 line-clamp-4 text-sm leading-6 text-slate-600">
                    <MarkdownContent markdown={turn.answer} />
                  </div>
                </div>
              ))}
            </div>
          </Surface>
        ) : null}

        <Surface>
          <SurfaceHeader
            title="Câu trả lời"
            meta={
              isStreaming
                ? "Trợ lý đang trả lời"
                : intent === "conversation"
                  ? undefined
                  : `${citations.length} nguồn`
            }
            action={
              result ? (
                <ConfidenceBadge
                  score={result.meta.confidence}
                  label={result.meta.confidence_label}
                />
              ) : isStreaming ? (
                <button
                  type="button"
                  onClick={() => {
                    abortRef.current?.abort();
                    setIsStreaming(false);
                    setError("Đã dừng câu trả lời theo yêu cầu.");
                  }}
                  className="inline-flex h-8 items-center gap-2 rounded-md border border-slate-200 px-2.5 text-xs font-medium text-slate-600 transition hover:border-slate-400 hover:text-slate-950"
                >
                  <Square size={11} fill="currentColor" />
                  Dừng
                </button>
              ) : null
            }
          />

          <div className="p-5">
            <p className="mb-4 text-sm font-medium text-slate-700">
              {request.question}
            </p>
            {usesConversationContext ? (
              <p className="mb-4 rounded-md bg-blue-50 px-3 py-2 text-xs leading-5 text-blue-800">
                Câu trả lời này đang dùng ngữ cảnh từ lượt hỏi trước.
              </p>
            ) : null}
            {answer ? (
              <div className="relative text-sm [&_h2:first-child]:mt-0 [&_h2]:text-lg [&_h3]:text-base [&_p]:my-3 [&_p]:leading-7">
                <MarkdownContent markdown={answer} />
                {isStreaming ? (
                  <span
                    className="ml-1 inline-block h-4 w-1.5 animate-pulse rounded-sm bg-blue-600 align-middle"
                    aria-label="AI đang viết"
                  />
                ) : null}
              </div>
            ) : (
              <div className="flex min-h-40 flex-col items-center justify-center gap-3 text-center">
                {error ? (
                  <AlertTriangle size={24} className="text-rose-600" />
                ) : (
                  <LoaderCircle
                    size={24}
                    className="animate-spin text-blue-600"
                  />
                )}
                <p className="text-sm font-medium text-slate-800">
                  {error ? "Không thể hoàn tất câu trả lời" : status}
                </p>
                {error ? (
                  <button
                    type="button"
                    onClick={retryAnswer}
                    className="inline-flex h-9 items-center gap-2 rounded-md border border-slate-200 px-3 text-xs font-semibold text-slate-700 transition hover:border-blue-300 hover:text-blue-700"
                  >
                    <RefreshCw size={14} />
                    Thử lại
                  </button>
                ) : null}
              </div>
            )}

            {error && answer ? (
              <div className="mt-4 flex items-start gap-2 rounded-md border border-rose-200 bg-rose-50 px-3 py-2 text-xs leading-5 text-rose-800">
                <AlertTriangle size={14} className="mt-0.5 shrink-0" />
                <span>{error}</span>
                <button
                  type="button"
                  onClick={retryAnswer}
                  className="ml-auto shrink-0 font-semibold underline underline-offset-2"
                >
                  Thử lại
                </button>
              </div>
            ) : null}

            {result?.data.warnings.length ? (
              <div className="mt-5 space-y-2 rounded-lg border border-amber-200 bg-amber-50 p-3">
                {result.data.warnings.map((warning) => (
                  <p
                    key={warning}
                    className="flex items-start gap-2 text-xs leading-5 text-amber-900"
                  >
                    <AlertTriangle size={14} className="mt-0.5 shrink-0" />
                    {warning}
                  </p>
                ))}
              </div>
            ) : null}
          </div>
        </Surface>

        <Surface>
          <SurfaceHeader
            title="Hỏi tiếp trong cùng ngữ cảnh"
            action={
              previousTurns.length || request.history.length ? (
                <button
                  type="button"
                  onClick={restartConversation}
                  className="inline-flex h-8 items-center gap-1.5 rounded-md border border-slate-200 px-2.5 text-xs font-medium text-slate-600 transition hover:border-slate-400 hover:text-slate-950"
                >
                  <RotateCcw size={13} />
                  Làm mới
                </button>
              ) : null
            }
          />
          <form onSubmit={submitFollowUp} className="flex gap-2 p-4">
            <input
              value={followUp}
              onChange={(event) => setFollowUp(event.target.value)}
              placeholder="Ví dụ: Còn pin và sạc thì sao?"
              disabled={isStreaming || !result}
              maxLength={1000}
              className="h-10 min-w-0 flex-1 rounded-md border border-slate-200 bg-white px-3 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 disabled:cursor-not-allowed disabled:bg-slate-50"
            />
            <button
              type="submit"
              disabled={isStreaming || !result || !followUp.trim()}
              className="inline-flex h-10 shrink-0 items-center gap-2 rounded-md bg-slate-950 px-3 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:bg-slate-300"
            >
              <Send size={15} />
              Gửi
            </button>
          </form>
        </Surface>

        {showInitialCatalogMatches && catalogMatches?.data.length ? (
          <Surface>
            <SurfaceHeader
              title="Thiết bị liên quan"
              meta={`${catalogMatches.meta.total} kết quả`}
              action={
                <Link
                  href={`/search?q=${encodeURIComponent(question)}`}
                  className="inline-flex h-9 items-center gap-2 rounded-md border border-slate-200 px-3 text-sm font-medium text-slate-700 transition hover:border-slate-400 hover:text-slate-950"
                >
                  Xem tất cả
                  <ArrowRight size={15} />
                </Link>
              }
            />
            <DeviceList models={catalogMatches.data} />
          </Surface>
        ) : null}

        {result?.data.follow_up_questions.length ? (
          <Surface>
            <SurfaceHeader title="Hỏi tiếp" />
            <div className="grid gap-2 p-4 sm:grid-cols-2">
              {result.data.follow_up_questions.map((followUp) => (
                <button
                  type="button"
                  key={followUp}
                  onClick={() => beginFollowUp(followUp)}
                  disabled={isStreaming}
                  className="group flex items-center justify-between gap-3 rounded-lg border border-slate-200 px-3 py-3 text-left text-sm font-medium text-slate-700 transition hover:border-blue-300 hover:bg-blue-50/60 hover:text-slate-950 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {followUp}
                  <ArrowRight
                    size={15}
                    className="shrink-0 text-slate-400 transition group-hover:translate-x-0.5"
                  />
                </button>
              ))}
            </div>
          </Surface>
        ) : null}
      </div>

      <aside className="space-y-5 lg:sticky lg:top-32 lg:self-start">
        {intent !== "conversation" ? (
          <Surface>
            <SurfaceHeader
              title="Nguồn dữ liệu"
              meta={
                citations.length
                  ? `${citations.length} nguồn`
                  : isStreaming
                    ? "Đang tìm nguồn"
                    : "Không có trích dẫn"
              }
            />
            <div className="space-y-3 p-4">
              {citations.length ? (
                citations.map((citation, index) => (
                  <div
                    key={`${citation.entity_id}-${citation.excerpt}`}
                    className="rounded-md border border-slate-200 p-3"
                  >
                    <div className="flex items-start gap-2 text-sm font-medium text-slate-950">
                      <span className="grid h-5 w-5 shrink-0 place-items-center rounded bg-slate-950 text-[10px] font-semibold text-white">
                        {index + 1}
                      </span>
                      <span>{citation.title ?? citation.entity_id}</span>
                    </div>
                    <p className="mt-2 text-xs leading-5 text-slate-600">
                      {citation.excerpt}
                    </p>
                    <CitationLink
                      entityType={citation.entity_type}
                      slug={citation.slug}
                    />
                  </div>
                ))
              ) : (
                <p className="py-8 text-center text-xs leading-5 text-slate-500">
                  {isStreaming ? "Đang tìm nguồn…" : "Không có nguồn phù hợp."}
                </p>
              )}
            </div>
          </Surface>
        ) : null}
      </aside>
    </section>
  );
}

function readConversation(rootQuestion: string): PersistedConversation | null {
  try {
    const raw = window.sessionStorage.getItem(CONVERSATION_STORAGE_KEY);
    if (!raw) return null;

    const parsed = JSON.parse(raw) as Partial<PersistedConversation>;
    const isCurrentConversation =
      parsed.version === 1 &&
      parsed.rootQuestion === rootQuestion &&
      typeof parsed.savedAt === "number" &&
      Date.now() - parsed.savedAt < CONVERSATION_MAX_AGE_MS &&
      Boolean(parsed.request?.question) &&
      Array.isArray(parsed.request?.history) &&
      Array.isArray(parsed.previousTurns) &&
      Boolean(parsed.result);

    if (!isCurrentConversation) {
      window.sessionStorage.removeItem(CONVERSATION_STORAGE_KEY);
      return null;
    }

    return parsed as PersistedConversation;
  } catch {
    return null;
  }
}

function compactHistoryWithRoot(
  messages: AiConversationMessage[],
  rootQuestion: string,
) {
  const normalizedRoot = rootQuestion.trim();
  if (!normalizedRoot) return messages.slice(-HISTORY_LIMIT);

  const rootIndex = messages.findIndex(
    (message) =>
      message.role === "user" && message.content.trim() === normalizedRoot,
  );
  const rootMessages =
    rootIndex >= 0 && messages[rootIndex + 1]?.role === "assistant"
      ? messages.slice(rootIndex, rootIndex + 2)
      : [{ role: "user" as const, content: normalizedRoot }];
  const rootMessageIndexes = new Set(
    rootIndex >= 0
      ? messages[rootIndex + 1]?.role === "assistant"
        ? [rootIndex, rootIndex + 1]
        : [rootIndex]
      : [],
  );
  const recentMessages = messages.filter(
    (_, index) => !rootMessageIndexes.has(index),
  );
  const recentLimit = HISTORY_LIMIT - rootMessages.length;
  const compactedRecent = recentMessages.slice(-recentLimit);

  // Keep the original question and answer as a pair, then complete recent
  // pairs. This preserves a valid alternating chat transcript for all AI
  // providers while keeping the original comparison anchor.
  // This makes a long comparison stable without exceeding the API's 16-message
  // history contract.
  return [...rootMessages, ...compactedRecent];
}

function reconcileStreamingAnswer(streamed: string, finalized: string) {
  const next = finalized.trim();
  // The server validates/repares streamed content before emitting `result`.
  // Always render that final value: keeping an earlier divergent stream could
  // expose text that the grounding guard explicitly rejected.
  return next || streamed.trim();
}

function CitationLink({
  entityType,
  slug,
}: {
  entityType: string;
  slug?: string | null;
}) {
  if (!slug) return null;
  if (entityType === "raw_page" && safeExternalUrl(slug)) {
    return (
      <a
        href={slug}
        target="_blank"
        rel="noreferrer noopener"
        className="mt-3 inline-flex items-center gap-1 text-xs font-medium text-slate-800 hover:text-slate-950"
      >
        Mở nguồn
        <ArrowRight size={14} />
      </a>
    );
  }
  const href = citationHref(entityType, slug);
  return href ? (
    <Link
      href={href}
      className="mt-3 inline-flex items-center gap-1 text-xs font-medium text-slate-800 hover:text-slate-950"
    >
      Mở bản ghi
      <ArrowRight size={14} />
    </Link>
  ) : null;
}

function ConfidenceBadge({
  score,
  label,
}: {
  score?: number;
  label?: "high" | "medium" | "low";
}) {
  const tone =
    label === "high"
      ? "bg-emerald-50 text-emerald-700"
      : label === "medium"
        ? "bg-amber-50 text-amber-700"
        : "bg-slate-100 text-slate-600";
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-md px-2 py-1 text-xs font-medium ${tone}`}
    >
      <CheckCircle2 size={13} />
      Tin cậy {score ?? 0}%
    </span>
  );
}

function citationHref(entityType: string, slug: string) {
  if (entityType === "device_model") return `/devices/${slug}`;
  if (entityType === "hardware_module") return `/hardware/${slug}`;
  if (entityType === "wiki_article") return `/wiki/${slug}`;
  return null;
}

function safeExternalUrl(value: string) {
  try {
    const url = new URL(value);
    return url.protocol === "https:" || url.protocol === "http:";
  } catch {
    return false;
  }
}
