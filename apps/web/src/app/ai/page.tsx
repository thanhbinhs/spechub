import Link from "next/link";
import {
  AlertTriangle,
  ArrowRight,
  BrainCircuit,
  Gauge,
  GitCompareArrows,
} from "lucide-react";
import { CommandBar } from "@/components/command-bar";
import { DeviceList } from "@/components/device-list";
import { EmptyState } from "@/components/empty-state";
import { PageHeader } from "@/components/page-header";
import { Surface, SurfaceHeader } from "@/components/surface";
import { api } from "@/lib/api";

export const dynamic = "force-dynamic";

const examples = [
  "So sánh Galaxy S25 Ultra và iPhone 16 Pro",
  "Bản ghi nào trong danh mục có pin lớn nhất?",
  "Liệt kê các thiết bị dùng Snapdragon",
];

export default async function AiPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;
  const q = stringParam(params.q);
  const [stats, answer, semanticMatches, catalogMatches] = await Promise.all([
    api.getAiEmbeddingStats().catch(() => null),
    q ? api.askAi({ question: q, top_k: 5 }).catch(() => null) : null,
    q ? api.searchAi({ q, top_k: 5 }).catch(() => null) : null,
    q ? api.search({ q, pageSize: 4 }).catch(() => null) : null,
  ]);
  const indexedModels = stats?.data.indexed_device_models ?? 0;
  const totalModels = stats?.data.device_models ?? 0;
  const source = answer?.meta.source ?? "catalog_fallback";
  const citationCount = answer?.data.citations.length ?? 0;

  return (
    <div className="mx-auto flex w-full max-w-7xl flex-col gap-5 px-4 py-5 sm:px-6 lg:px-8">
      <PageHeader
        eyebrow="AI"
        title="Tra cứu danh mục"
        description="Câu trả lời dựa trên các bản ghi SpecHub đã lập chỉ mục và có trích dẫn."
        action={
          <Link
            href="/compare"
            className="inline-flex h-10 items-center gap-2 rounded-md border border-slate-200 bg-white px-4 text-sm font-medium text-slate-700 transition hover:border-slate-400 hover:text-slate-950"
          >
            <GitCompareArrows size={16} />
            So sánh
          </Link>
        }
      />

      <section className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_340px]">
        <Surface className="p-3">
          <CommandBar defaultValue={q} initialMode="ai" />
        </Surface>

        <Surface>
          <SurfaceHeader title="Chỉ mục" meta={stats?.meta.embedding_model} />
          <div className="grid grid-cols-2 gap-3 p-4">
            <Metric label="Mẫu máy" value={`${indexedModels}/${totalModels}`} />
            <Metric
              label="Đoạn dữ liệu"
              value={String(stats?.data.total_chunks ?? 0)}
            />
          </div>
        </Surface>
      </section>

      {answer ? (
        <section className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_380px]">
          <div className="space-y-5">
            <Surface>
              <SurfaceHeader
                title="Câu trả lời"
                meta={`${sourceLabel(source)} · ${citationCount} trích dẫn`}
                action={
                  <span className="inline-flex items-center gap-1 rounded-md bg-[#fff7e6] px-2 py-1 text-xs font-medium text-amber-700">
                    <AlertTriangle size={13} />
                    Chỉ dùng danh mục
                  </span>
                }
              />
              <div className="p-5">
                <div className="whitespace-pre-wrap text-sm leading-7 text-slate-800">
                  {answer.data.answer}
                </div>
              </div>
            </Surface>

            {catalogMatches?.data.length ? (
              <Surface>
                <SurfaceHeader
                  title="Bản ghi danh mục liên quan"
                  meta={`${catalogMatches.meta.total} kết quả`}
                  action={
                    <Link
                      href={`/search?q=${encodeURIComponent(q)}`}
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
          </div>

          <aside className="space-y-5 lg:sticky lg:top-32 lg:self-start">
            <Surface>
              <SurfaceHeader title="Nguồn dữ liệu" meta="Trích dẫn" />
              <div className="space-y-3 p-4">
                {answer.data.citations.map((citation) => (
                  <div
                    key={`${citation.entity_id}-${citation.excerpt}`}
                    className="rounded-md border border-slate-200 p-3"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="text-sm font-medium text-slate-950">
                        {citation.title ?? citation.entity_id}
                      </div>
                      {typeof citation.score === "number" ? (
                        <span className="rounded-md bg-slate-100 px-2 py-1 text-xs text-slate-600">
                          {Math.max(0, citation.score * 100).toFixed(0)}%
                        </span>
                      ) : null}
                    </div>
                    <p className="mt-2 text-xs leading-5 text-slate-600">
                      {citation.excerpt}
                    </p>
                    {citation.slug ? (
                      citation.entity_type === "raw_page" &&
                      safeExternalUrl(citation.slug) ? (
                        <a
                          href={citation.slug}
                          target="_blank"
                          rel="noreferrer noopener"
                          className="mt-3 inline-flex items-center gap-1 text-xs font-medium text-slate-800 hover:text-slate-950"
                        >
                          Mở nguồn
                          <ArrowRight size={14} />
                        </a>
                      ) : citation.entity_type === "device_model" ? (
                        <Link
                          href={`/devices/${citation.slug}`}
                          className="mt-3 inline-flex items-center gap-1 text-xs font-medium text-slate-800 hover:text-slate-950"
                        >
                          Mở thiết bị
                          <ArrowRight size={14} />
                        </Link>
                      ) : null
                    ) : null}
                  </div>
                ))}
              </div>
            </Surface>

            {semanticMatches?.data.length ? (
              <Surface>
                <SurfaceHeader
                  title="Đoạn dữ liệu tìm thấy"
                  meta="Khớp ngữ nghĩa"
                />
                <div className="space-y-3 p-4">
                  {semanticMatches.data.map((match) => (
                    <div
                      key={`${match.entityId}-${match.chunkIndex}`}
                      className="rounded-md border border-slate-200 p-3"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="text-sm font-medium text-slate-950">
                          {match.title ?? match.entityId}
                        </div>
                        {typeof match.score === "number" ? (
                          <span className="rounded-md bg-blue-50 px-2 py-1 text-xs text-blue-700">
                            {Math.max(0, match.score * 100).toFixed(0)}%
                          </span>
                        ) : null}
                      </div>
                      <p className="mt-2 line-clamp-3 text-xs leading-5 text-slate-600">
                        {match.excerpt ?? match.chunkText}
                      </p>
                    </div>
                  ))}
                </div>
              </Surface>
            ) : null}
          </aside>
        </section>
      ) : (
        <section className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_340px]">
          <Surface>
            <SurfaceHeader title="Gợi ý câu hỏi" meta="Điểm bắt đầu" />
            <div className="grid gap-3 p-4 md:grid-cols-3">
              {examples.map((example) => (
                <Link
                  key={example}
                  href={`/ai?q=${encodeURIComponent(example)}`}
                  className="group flex min-h-24 items-center justify-between gap-3 rounded-md border border-slate-200 p-3 text-sm font-medium text-slate-800 transition hover:border-blue-300 hover:bg-blue-50/60"
                >
                  {example}
                  <ArrowRight
                    size={16}
                    className="text-slate-400 transition group-hover:translate-x-0.5"
                  />
                </Link>
              ))}
            </div>
          </Surface>

          <EmptyState
            icon={<BrainCircuit size={20} />}
            title="Chưa có câu hỏi"
            description="Bắt đầu với câu hỏi về chipset, pin, màn hình hoặc nhu cầu mua sắm."
          />
        </section>
      )}
    </div>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-md border border-blue-100 bg-blue-50/60 p-3">
      <div className="flex items-center gap-2 text-xs font-medium text-slate-500">
        <Gauge size={14} />
        {label}
      </div>
      <div className="mt-1 text-lg font-semibold text-slate-950">{value}</div>
    </div>
  );
}

function sourceLabel(source: string) {
  if (source === "vector") return "Tra cứu Vector RAG";
  if (source === "cache") return "Bộ nhớ đệm";
  return "Dự phòng từ danh mục";
}

function safeExternalUrl(value: string) {
  try {
    const url = new URL(value);
    return url.protocol === "https:" || url.protocol === "http:";
  } catch {
    return false;
  }
}

function stringParam(value: string | string[] | undefined) {
  return Array.isArray(value) ? (value[0] ?? "") : (value ?? "");
}
