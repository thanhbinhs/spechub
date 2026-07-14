"use client";

import Link from "next/link";
import { useDeferredValue, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { ArrowRight, BookOpen, Search } from "lucide-react";
import { EmptyState } from "@/components/empty-state";
import { LoadingPanel } from "@/components/loading-panel";
import { PageHeader } from "@/components/page-header";
import { api } from "@/lib/api";
import { formatDate } from "@/lib/format";

export default function WikiIndexPage() {
  const [query, setQuery] = useState("");
  const deferredQuery = useDeferredValue(query.trim());
  const articles = useQuery({
    queryKey: ["wiki", "articles", deferredQuery],
    queryFn: () =>
      api.listWikiArticles({
        page: 1,
        pageSize: 24,
        q: deferredQuery || undefined,
      }),
  });

  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-5 px-4 py-6 sm:px-6 lg:px-8">
      <PageHeader
        eyebrow="Knowledge base"
        title="SpecHub Wiki"
        description="Các bài tổng hợp có phiên bản, được biên tập và gắn nguồn dẫn rõ ràng."
      />

      <label className="relative block max-w-xl">
        <span className="sr-only">Tìm bài viết Wiki</span>
        <Search
          size={17}
          className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
        />
        <input
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Tìm thiết bị, chủ đề hoặc nội dung..."
          className="h-11 w-full rounded-md border border-slate-300 bg-white pl-10 pr-3 text-sm outline-none transition focus:border-blue-500"
        />
      </label>

      {articles.isLoading ? <LoadingPanel label="Đang tải Wiki" /> : null}
      {articles.isError ? (
        <EmptyState
          icon={<BookOpen size={20} />}
          title="Không thể tải Wiki"
          description="Hãy thử tải lại sau ít phút."
        />
      ) : null}
      {articles.data?.data.length ? (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {articles.data.data.map((article) => (
            <article
              key={article.id}
              className="flex min-h-52 flex-col rounded-lg border border-slate-200 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:border-blue-200 hover:shadow-md"
            >
              <div className="flex items-center justify-between gap-3 text-xs font-medium text-slate-500">
                <span className="truncate">{article.language.name}</span>
                <span>{article._count?.revisions ?? 0} phiên bản</span>
              </div>
              <h2 className="mt-3 line-clamp-2 text-lg font-semibold tracking-tight text-slate-950">
                {article.title}
              </h2>
              <p className="mt-2 line-clamp-3 text-sm leading-6 text-slate-600">
                {article.summary || "Bài viết kiến thức được cộng đồng SpecHub biên tập."}
              </p>
              <div className="mt-auto flex items-end justify-between gap-3 pt-5">
                <span className="text-xs text-slate-500">
                  {formatDate(article.published_at ?? article.updated_at)}
                </span>
                <Link
                  href={`/wiki/${article.slug}?language=${encodeURIComponent(article.language.code)}`}
                  className="inline-flex items-center gap-1.5 text-sm font-semibold text-blue-700 hover:text-blue-800"
                >
                  Đọc bài
                  <ArrowRight size={15} />
                </Link>
              </div>
            </article>
          ))}
        </div>
      ) : !articles.isLoading && !articles.isError ? (
        <EmptyState
          icon={<BookOpen size={20} />}
          title={deferredQuery ? "Không tìm thấy bài viết" : "Wiki đang được biên tập"}
          description={
            deferredQuery
              ? "Thử dùng từ khóa ngắn hơn hoặc chủ đề khác."
              : "Các bài viết đã xuất bản sẽ xuất hiện tại đây."
          }
        />
      ) : null}
    </div>
  );
}
