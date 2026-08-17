import Link from "next/link";
import { ArrowRight, GitCompareArrows } from "lucide-react";
import { AiStreamAnswer } from "@/components/ai-stream-answer";
import { CommandBar } from "@/components/command-bar";
import { PageHeader } from "@/components/page-header";
import { Surface, SurfaceHeader } from "@/components/surface";
import { api } from "@/lib/api";

export const dynamic = "force-dynamic";

const examples = [
  "So sánh Galaxy S25 Ultra và iPhone 16 Pro",
  "Snapdragon 8 Elite được dùng trên những thiết bị nào?",
  "Tóm tắt kiến thức nội bộ về màn hình OLED và các benchmark liên quan",
];

export default async function AiPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;
  const q = stringParam(params.q);
  const catalogMatches = q
    ? await api.search({ q, pageSize: 4 }).catch(() => null)
    : null;

  return (
    <div className="app-page mx-auto flex w-full max-w-7xl flex-col gap-6 px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
      <PageHeader
        title="Trợ lý SpecHub"
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

      <CommandBar defaultValue={q} initialMode="ai" />

      {q ? (
        <AiStreamAnswer question={q} catalogMatches={catalogMatches} />
      ) : (
        <Surface>
          <SurfaceHeader title="Thử một câu hỏi" />
          <div className="grid gap-3 p-4 md:grid-cols-3">
            {examples.map((example) => (
              <Link
                key={example}
                href={`/ai?q=${encodeURIComponent(example)}`}
                className="group flex min-h-20 items-center justify-between gap-3 rounded-md border border-slate-200 p-3 text-sm font-medium text-slate-800 transition hover:border-blue-300 hover:bg-blue-50/60"
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
      )}
    </div>
  );
}

function stringParam(value: string | string[] | undefined) {
  return Array.isArray(value) ? (value[0] ?? "") : (value ?? "");
}
