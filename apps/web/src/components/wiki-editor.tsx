"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useMutation, useQuery } from "@tanstack/react-query";
import {
  Bold,
  Check,
  Code2,
  Eye,
  Heading2,
  ImageIcon,
  Italic,
  Link2,
  List,
  ListOrdered,
  LoaderCircle,
  Minus,
  Quote,
  Redo2,
  Send,
  Table2,
  Undo2,
  X,
} from "lucide-react";
import type {
  Citation,
  WikiArticle,
  WikiArticleStatus,
} from "@spechub/api-client";
import { useAuth } from "@/components/auth-provider";
import { MarkdownContent } from "@/components/markdown-content";
import { api } from "@/lib/api";

type ArticleType = WikiArticle["article_type"];

const articleTypes: Array<{ value: ArticleType; label: string }> = [
  { value: "guide", label: "Hướng dẫn" },
  { value: "introduction", label: "Giới thiệu" },
  { value: "review", label: "Chia sẻ / đánh giá" },
  { value: "comparison", label: "So sánh" },
  { value: "tutorial", label: "Bài thực hành" },
];

const outline = `## Tổng quan

Giới thiệu ngắn gọn chủ đề, đối tượng độc giả và lý do bài viết hữu ích.

## Thông tin chính

Trình bày dữ kiện theo từng ý rõ ràng. Phân biệt thông tin đã kiểm chứng và trải nghiệm cá nhân.

## Trải nghiệm và lưu ý

Nêu bối cảnh sử dụng, ưu điểm, hạn chế và những trường hợp không phù hợp.

## Kết luận

Tóm tắt điều người đọc nên ghi nhớ và gợi ý bước tiếp theo.
`;

export function WikiEditor({ article }: { article?: WikiArticle }) {
  const router = useRouter();
  const { user, tokens, isLoading } = useAuth();
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const [title, setTitle] = useState(article?.title ?? "");
  const [slug, setSlug] = useState(article?.slug ?? "");
  const [slugTouched, setSlugTouched] = useState(Boolean(article));
  const [summary, setSummary] = useState(article?.summary ?? "");
  const [body, setBody] = useState(article?.body_markdown ?? "");
  const [articleType, setArticleType] = useState<ArticleType>(
    article?.article_type ?? "guide",
  );
  const [languageCode, setLanguageCode] = useState(
    article?.language.code ?? "vi",
  );
  const [tags, setTags] = useState(article?.tags.join(", ") ?? "");
  const [coverImageUrl, setCoverImageUrl] = useState(
    article?.cover_image_url ?? "",
  );
  const [changeSummary, setChangeSummary] = useState("");
  const [preview, setPreview] = useState(false);
  const [selectedCitationIds, setSelectedCitationIds] = useState<string[]>(
    article?.citations.map((item) => item.citation.id) ?? [],
  );
  const [citationQuery, setCitationQuery] = useState("");

  useEffect(() => {
    if (!slugTouched) setSlug(toSlug(title));
  }, [slugTouched, title]);

  const citations = useQuery({
    queryKey: ["wiki-editor-citations", citationQuery],
    queryFn: () =>
      api.listCitations({
        page: 1,
        pageSize: 20,
        q: citationQuery || undefined,
      }),
    enabled: Boolean(user),
  });

  const checks = useMemo(
    () => [
      {
        label: "Tiêu đề rõ nghĩa (tối thiểu 10 ký tự)",
        valid: title.trim().length >= 10,
      },
      {
        label: "Tóm tắt đủ ngữ cảnh (tối thiểu 40 ký tự)",
        valid: summary.trim().length >= 40,
      },
      {
        label: "Nội dung tối thiểu 300 ký tự",
        valid: body.trim().length >= 300,
      },
      {
        label: "Có ít nhất hai đề mục để dễ đọc",
        valid: (body.match(/^##?\s/gm) ?? []).length >= 2,
      },
      {
        label: "Có mô tả mục đích thay đổi",
        valid: changeSummary.trim().length >= 10,
      },
    ],
    [body, changeSummary, summary, title],
  );
  const canSubmit =
    checks.slice(0, 3).every((check) => check.valid) && checks[4]!.valid;
  const wordCount = body.trim() ? body.trim().split(/\s+/).length : 0;

  const save = useMutation({
    mutationFn: async () => {
      if (!tokens?.access_token)
        throw new Error("Bạn cần đăng nhập để gửi bài.");
      if (article) {
        return api.submitWikiRevision(
          article.id,
          { title, body_markdown: body, change_summary: changeSummary },
          tokens.access_token,
        );
      }
      return api.createWikiArticle(
        {
          entity_table: "community_articles",
          entity_id: crypto.randomUUID(),
          language_code: languageCode,
          title: title.trim(),
          slug,
          summary: summary.trim(),
          body_markdown: body.trim(),
          article_type: articleType,
          tags: parseTags(tags),
          cover_image_url: coverImageUrl.trim() || undefined,
          status: "in_review" as WikiArticleStatus,
          change_summary: changeSummary.trim(),
          citations: selectedCitationIds.map((citationId, index) => ({
            citation_id: citationId,
            anchor_key: `ref-${index + 1}`,
          })),
        },
        tokens.access_token,
      );
    },
    onSuccess: () => router.push("/wiki?submitted=1"),
  });

  if (isLoading) {
    return (
      <div className="p-10 text-center text-sm text-slate-500">
        Đang kiểm tra tài khoản…
      </div>
    );
  }
  if (!user) {
    return (
      <div className="mx-auto max-w-xl rounded-xl border border-slate-200 bg-white p-8 text-center shadow-sm">
        <h1 className="text-xl font-semibold text-slate-950">
          Đăng nhập để đóng góp Wiki
        </h1>
        <p className="mt-2 text-sm leading-6 text-slate-600">
          Mọi tài khoản SpecHub đều có thể tạo bài và đề xuất chỉnh sửa. Nội
          dung sẽ được duyệt trước khi công khai.
        </p>
        <Link
          href="/login"
          className="mt-5 inline-flex h-10 items-center rounded-lg bg-blue-600 px-4 text-sm font-semibold text-white"
        >
          Đăng nhập
        </Link>
      </div>
    );
  }

  return (
    <form
      className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_320px]"
      onSubmit={(event) => {
        event.preventDefault();
        if (canSubmit) save.mutate();
      }}
    >
      <div className="min-w-0 space-y-5">
        <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="grid gap-4 md:grid-cols-2">
            <Field label="Tiêu đề" className="md:col-span-2">
              <input
                value={title}
                onChange={(event) => setTitle(event.target.value)}
                maxLength={300}
                placeholder="Một tiêu đề cụ thể, cho biết người đọc sẽ nhận được gì"
                className="form-control"
                required
              />
            </Field>
            {!article ? (
              <>
                <Field label="Đường dẫn">
                  <input
                    value={slug}
                    onChange={(event) => {
                      setSlugTouched(true);
                      setSlug(toSlug(event.target.value));
                    }}
                    className="form-control"
                    required
                  />
                </Field>
                <Field label="Loại bài viết">
                  <select
                    value={articleType}
                    onChange={(event) =>
                      setArticleType(event.target.value as ArticleType)
                    }
                    className="form-control"
                  >
                    {articleTypes.map((item) => (
                      <option key={item.value} value={item.value}>
                        {item.label}
                      </option>
                    ))}
                  </select>
                </Field>
                <Field label="Ngôn ngữ">
                  <select
                    value={languageCode}
                    onChange={(event) => setLanguageCode(event.target.value)}
                    className="form-control"
                  >
                    <option value="vi">Tiếng Việt</option>
                    <option value="en">English</option>
                  </select>
                </Field>
                <Field
                  label="Thẻ chủ đề"
                  hint="Tối đa 8 thẻ, phân cách bằng dấu phẩy"
                >
                  <input
                    value={tags}
                    onChange={(event) => setTags(event.target.value)}
                    placeholder="smartphone, camera, kinh-nghiem"
                    className="form-control"
                  />
                </Field>
                <Field
                  label="Ảnh bìa"
                  className="md:col-span-2"
                  hint="URL ảnh có quyền sử dụng"
                >
                  <div className="relative">
                    <ImageIcon
                      className="absolute left-3 top-3 text-slate-400"
                      size={16}
                    />
                    <input
                      type="url"
                      value={coverImageUrl}
                      onChange={(event) => setCoverImageUrl(event.target.value)}
                      placeholder="https://..."
                      className="form-control pl-9"
                    />
                  </div>
                </Field>
                <Field
                  label="Tóm tắt"
                  className="md:col-span-2"
                  hint={`${summary.length}/500 ký tự`}
                >
                  <textarea
                    value={summary}
                    onChange={(event) => setSummary(event.target.value)}
                    rows={3}
                    maxLength={500}
                    className="form-control min-h-24 py-3"
                    placeholder="Nêu chủ đề, phạm vi và đối tượng độc giả trong 2–3 câu."
                    required
                  />
                </Field>
              </>
            ) : null}
          </div>
        </section>

        <section className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
          <div className="flex flex-wrap items-center gap-1 border-b border-slate-200 bg-slate-50 px-3 py-2">
            <ToolbarButton
              label="Hoàn tác"
              onClick={() => document.execCommand("undo")}
            >
              <Undo2 size={15} />
            </ToolbarButton>
            <ToolbarButton
              label="Làm lại"
              onClick={() => document.execCommand("redo")}
            >
              <Redo2 size={15} />
            </ToolbarButton>
            <span className="mx-1 h-5 w-px bg-slate-200" />
            <ToolbarButton
              label="Tiêu đề"
              onClick={() => insert("## ", "", "Tiêu đề mục")}
            >
              <Heading2 size={15} />
            </ToolbarButton>
            <ToolbarButton
              label="Đậm"
              onClick={() => insert("**", "**", "nội dung đậm")}
            >
              <Bold size={15} />
            </ToolbarButton>
            <ToolbarButton
              label="Nghiêng"
              onClick={() => insert("_", "_", "nội dung nghiêng")}
            >
              <Italic size={15} />
            </ToolbarButton>
            <ToolbarButton
              label="Liên kết"
              onClick={() => insert("[", "](https://)", "tên liên kết")}
            >
              <Link2 size={15} />
            </ToolbarButton>
            <ToolbarButton
              label="Trích dẫn"
              onClick={() => insert("> ", "", "trích dẫn")}
            >
              <Quote size={15} />
            </ToolbarButton>
            <ToolbarButton
              label="Danh sách"
              onClick={() => insert("- ", "", "mục danh sách")}
            >
              <List size={15} />
            </ToolbarButton>
            <ToolbarButton
              label="Danh sách số"
              onClick={() => insert("1. ", "", "mục danh sách")}
            >
              <ListOrdered size={15} />
            </ToolbarButton>
            <ToolbarButton
              label="Mã"
              onClick={() => insert("```\n", "\n```", "mã nguồn")}
            >
              <Code2 size={15} />
            </ToolbarButton>
            <ToolbarButton
              label="Bảng"
              onClick={() =>
                insert(
                  "",
                  "",
                  "| Cột 1 | Cột 2 |\n| --- | --- |\n| Dữ liệu | Dữ liệu |\n",
                )
              }
            >
              <Table2 size={15} />
            </ToolbarButton>
            <ToolbarButton
              label="Đường phân cách"
              onClick={() => insert("\n---\n", "", "")}
            >
              <Minus size={15} />
            </ToolbarButton>
            <button
              type="button"
              onClick={() => setPreview((value) => !value)}
              className="ml-auto inline-flex h-8 items-center gap-1.5 rounded-md px-2 text-xs font-medium text-blue-700 hover:bg-blue-50"
            >
              <Eye size={14} />
              {preview ? "Soạn thảo" : "Xem trước"}
            </button>
          </div>
          {preview ? (
            <div className="min-h-[520px] p-5 sm:p-7">
              {body ? (
                <MarkdownContent markdown={body} />
              ) : (
                <p className="text-sm text-slate-400">
                  Chưa có nội dung để xem trước.
                </p>
              )}
            </div>
          ) : (
            <textarea
              ref={textareaRef}
              value={body}
              onChange={(event) => setBody(event.target.value)}
              className="min-h-[520px] w-full resize-y px-5 py-4 font-mono text-sm leading-7 text-slate-800 outline-none"
              placeholder="Viết nội dung bằng Markdown…"
              required
            />
          )}
          <div className="flex flex-wrap items-center justify-between gap-2 border-t border-slate-100 bg-slate-50 px-4 py-2 text-xs text-slate-500">
            <span>
              {wordCount} từ · khoảng {Math.max(1, Math.ceil(wordCount / 220))}{" "}
              phút đọc
            </span>
            {!article && !body ? (
              <button
                type="button"
                onClick={() => setBody(outline)}
                className="font-medium text-blue-700 hover:underline"
              >
                Dùng dàn ý bài chia sẻ chuẩn
              </button>
            ) : null}
          </div>
        </section>

        {!article ? (
          <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
            <h2 className="text-sm font-semibold text-slate-950">
              Nguồn tham khảo
            </h2>
            <p className="mt-1 text-xs leading-5 text-slate-500">
              Chọn nguồn có sẵn để các nhận định quan trọng có thể kiểm chứng.
            </p>
            <input
              value={citationQuery}
              onChange={(event) => setCitationQuery(event.target.value)}
              placeholder="Tìm nguồn theo tiêu đề hoặc nhà xuất bản…"
              className="form-control mt-3"
            />
            <div className="mt-3 grid max-h-60 gap-2 overflow-y-auto sm:grid-cols-2">
              {(citations.data?.data ?? []).map((citation: Citation) => {
                const selected = selectedCitationIds.includes(citation.id);
                return (
                  <button
                    key={citation.id}
                    type="button"
                    onClick={() =>
                      setSelectedCitationIds((current) =>
                        selected
                          ? current.filter((id) => id !== citation.id)
                          : [...current, citation.id],
                      )
                    }
                    className={`rounded-lg border p-3 text-left text-xs transition ${selected ? "border-blue-300 bg-blue-50" : "border-slate-200 hover:border-slate-300"}`}
                  >
                    <span className="line-clamp-1 font-semibold text-slate-900">
                      {citation.title ??
                        citation.source?.name ??
                        "Nguồn tham khảo"}
                    </span>
                    <span className="mt-1 block text-slate-500">
                      {citation.source?.name}
                    </span>
                  </button>
                );
              })}
            </div>
          </section>
        ) : null}

        <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <Field
            label={article ? "Nội dung đã thay đổi" : "Mục đích bài viết"}
            hint="Giúp người duyệt hiểu nhanh đóng góp của bạn"
          >
            <textarea
              value={changeSummary}
              onChange={(event) => setChangeSummary(event.target.value)}
              rows={3}
              maxLength={300}
              className="form-control min-h-24 py-3"
              required
            />
          </Field>
        </section>
      </div>

      <aside className="space-y-4 xl:sticky xl:top-24 xl:self-start">
        <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <h2 className="text-sm font-semibold text-slate-950">
            Kiểm tra trước khi gửi
          </h2>
          <div className="mt-4 space-y-3">
            {checks.map((check) => (
              <div key={check.label} className="flex gap-2 text-xs leading-5">
                <span
                  className={`mt-0.5 grid h-4 w-4 shrink-0 place-items-center rounded-full ${check.valid ? "bg-emerald-100 text-emerald-700" : "bg-slate-100 text-slate-400"}`}
                >
                  {check.valid ? <Check size={11} /> : <X size={10} />}
                </span>
                <span
                  className={check.valid ? "text-slate-700" : "text-slate-500"}
                >
                  {check.label}
                </span>
              </div>
            ))}
          </div>
        </section>
        <section className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-xs leading-6 text-amber-900">
          <strong>Quy tắc cộng đồng</strong>
          <p className="mt-1">
            Viết trung lập, nêu rõ trải nghiệm cá nhân, không sao chép, không
            quảng cáo trá hình và gắn nguồn cho số liệu hoặc tuyên bố kỹ thuật.
          </p>
        </section>
        {save.error ? (
          <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-xs leading-5 text-red-700">
            {save.error instanceof Error
              ? save.error.message
              : "Không thể gửi bài."}
          </div>
        ) : null}
        <button
          type="submit"
          disabled={!canSubmit || save.isPending}
          className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-lg bg-blue-600 px-4 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {save.isPending ? (
            <LoaderCircle size={16} className="animate-spin" />
          ) : (
            <Send size={16} />
          )}
          {article ? "Gửi đề xuất chỉnh sửa" : "Gửi bài để duyệt"}
        </button>
      </aside>
    </form>
  );

  function insert(before: string, after: string, fallback: string) {
    const textarea = textareaRef.current;
    if (!textarea) return;
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selected = body.slice(start, end) || fallback;
    const next = `${body.slice(0, start)}${before}${selected}${after}${body.slice(end)}`;
    setBody(next);
    requestAnimationFrame(() => {
      textarea.focus();
      textarea.setSelectionRange(
        start + before.length,
        start + before.length + selected.length,
      );
    });
  }
}

function Field({
  label,
  hint,
  className,
  children,
}: {
  label: string;
  hint?: string;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <label className={className}>
      <span className="mb-1.5 flex items-center justify-between gap-3 text-xs font-semibold text-slate-700">
        {label}
        {hint ? (
          <span className="font-normal text-slate-400">{hint}</span>
        ) : null}
      </span>
      {children}
    </label>
  );
}

function ToolbarButton({
  label,
  onClick,
  children,
}: {
  label: string;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      title={label}
      aria-label={label}
      onClick={onClick}
      className="grid h-8 w-8 place-items-center rounded-md text-slate-600 hover:bg-white hover:text-slate-950"
    >
      {children}
    </button>
  );
}

function toSlug(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/đ/g, "d")
    .replace(/Đ/g, "d")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 320);
}

function parseTags(value: string) {
  return Array.from(
    new Set(
      value
        .split(",")
        .map((tag) => toSlug(tag))
        .filter(Boolean),
    ),
  ).slice(0, 8);
}
