"use client";

import Link from "next/link";
import { Suspense, useDeferredValue, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import {
  ArrowRight,
  BookOpen,
  CheckCircle2,
  Clock3,
  Eye,
  PenLine,
  Search,
  SlidersHorizontal,
} from "lucide-react";
import { EmptyState } from "@/components/empty-state";
import { LoadingPanel } from "@/components/loading-panel";
import { api } from "@/lib/api";
import { formatDate } from "@/lib/format";

const typeOptions = [
  ["", "Tất cả loại bài"],
  ["guide", "Hướng dẫn"],
  ["introduction", "Giới thiệu"],
  ["review", "Chia sẻ / đánh giá"],
  ["comparison", "So sánh"],
  ["tutorial", "Thực hành"],
] as const;

export default function WikiIndexPage() {
  return (
    <Suspense fallback={<LoadingPanel label="Đang mở Wiki" />}>
      <WikiIndexContent />
    </Suspense>
  );
}

function WikiIndexContent() {
  const searchParams = useSearchParams();
  const [query, setQuery] = useState("");
  const [articleType, setArticleType] = useState("");
  const [language, setLanguage] = useState("");
  const [tag, setTag] = useState(searchParams.get("tag") ?? "");
  const [sort, setSort] = useState("newest");
  const [page, setPage] = useState(1);
  const deferredQuery = useDeferredValue(query.trim());
  const articles = useQuery({
    queryKey: [
      "wiki",
      "articles",
      deferredQuery,
      articleType,
      language,
      tag,
      sort,
      page,
    ],
    queryFn: () =>
      api.listWikiArticles({
        page,
        pageSize: 12,
        q: deferredQuery || undefined,
        article_type: articleType || undefined,
        language_code: language || undefined,
        tag: tag || undefined,
        sort,
      }),
  });
  const visibleTags = useMemo(
    () =>
      Array.from(
        new Set((articles.data?.data ?? []).flatMap((article) => article.tags)),
      ).slice(0, 12),
    [articles.data?.data],
  );

  function updateFilter(action: () => void) {
    setPage(1);
    action();
  }

  return (
    <div className="mx-auto flex w-full max-w-7xl flex-col gap-6 px-4 py-6 sm:px-6 lg:px-8">
      {searchParams.get("submitted") ? (
        <div className="flex items-start gap-3 rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-900">
          <CheckCircle2 size={18} className="mt-0.5 shrink-0" />
          <div>
            <strong>Đã gửi đóng góp.</strong> Bài viết đang trong hàng đợi kiểm
            duyệt và sẽ xuất hiện khi được duyệt.
          </div>
        </div>
      ) : null}

      <header className="flex flex-col gap-5 border-b border-slate-200 pb-6 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-blue-700">
            Kiến thức cộng đồng
          </p>
          <h1 className="mt-2 text-3xl font-semibold tracking-tight text-slate-950">
            SpecHub Wiki
          </h1>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600">
            Bài giới thiệu, hướng dẫn và trải nghiệm có lịch sử chỉnh sửa, nguồn
            tham khảo rõ ràng và kiểm duyệt cộng đồng.
          </p>
        </div>
        <Link
          href="/wiki/new"
          className="inline-flex h-11 shrink-0 items-center justify-center gap-2 rounded-lg bg-blue-600 px-4 text-sm font-semibold text-white transition hover:bg-blue-700"
        >
          <PenLine size={16} />
          Viết bài mới
        </Link>
      </header>

      <section className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
        <div className="grid gap-3 lg:grid-cols-[minmax(260px,1fr)_180px_150px_160px]">
          <label className="relative block">
            <span className="sr-only">Tìm bài viết</span>
            <Search
              size={17}
              className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
            />
            <input
              value={query}
              onChange={(event) =>
                updateFilter(() => setQuery(event.target.value))
              }
              placeholder="Tìm chủ đề, thiết bị hoặc nội dung…"
              className="form-control pl-10"
            />
          </label>
          <select
            aria-label="Loại bài viết"
            value={articleType}
            onChange={(event) =>
              updateFilter(() => setArticleType(event.target.value))
            }
            className="form-control"
          >
            {typeOptions.map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
          <select
            aria-label="Ngôn ngữ"
            value={language}
            onChange={(event) =>
              updateFilter(() => setLanguage(event.target.value))
            }
            className="form-control"
          >
            <option value="">Mọi ngôn ngữ</option>
            <option value="vi">Tiếng Việt</option>
            <option value="en">English</option>
          </select>
          <select
            aria-label="Sắp xếp"
            value={sort}
            onChange={(event) =>
              updateFilter(() => setSort(event.target.value))
            }
            className="form-control"
          >
            <option value="newest">Mới xuất bản</option>
            <option value="updated">Mới cập nhật</option>
            <option value="popular">Đọc nhiều</option>
            <option value="oldest">Cũ nhất</option>
          </select>
        </div>
        {visibleTags.length ? (
          <div className="mt-3 flex flex-wrap items-center gap-2 border-t border-slate-100 pt-3">
            <span className="inline-flex items-center gap-1 text-xs font-medium text-slate-500">
              <SlidersHorizontal size={13} /> Chủ đề
            </span>
            <button
              type="button"
              onClick={() => updateFilter(() => setTag(""))}
              className={`rounded-full px-2.5 py-1 text-xs ${!tag ? "bg-slate-950 text-white" : "bg-slate-100 text-slate-600"}`}
            >
              Tất cả
            </button>
            {visibleTags.map((item) => (
              <button
                key={item}
                type="button"
                onClick={() => updateFilter(() => setTag(item))}
                className={`rounded-full px-2.5 py-1 text-xs ${tag === item ? "bg-slate-950 text-white" : "bg-slate-100 text-slate-600 hover:bg-slate-200"}`}
              >
                #{item}
              </button>
            ))}
          </div>
        ) : null}
      </section>

      {articles.isLoading ? <LoadingPanel label="Đang tải Wiki" /> : null}
      {articles.isError ? (
        <EmptyState
          icon={<BookOpen size={20} />}
          title="Không thể tải Wiki"
          description="Hãy thử tải lại sau ít phút."
        />
      ) : null}
      {articles.data?.data.length ? (
        <>
          <div className="grid gap-x-6 gap-y-4 md:grid-cols-2 xl:grid-cols-3">
            {articles.data.data.map((article) => (
              <article
                key={article.id}
                className="group flex min-h-56 flex-col border-b border-slate-200 py-4"
              >
                <div className="flex items-center justify-between gap-3 text-xs text-slate-500">
                  <span className="font-medium text-blue-700">
                    {articleTypeLabel(article.article_type)}
                  </span>
                  <span>{article.language.name}</span>
                </div>
                <h2 className="mt-3 line-clamp-2 text-lg font-semibold leading-7 text-slate-950 group-hover:text-blue-700">
                  {article.title}
                </h2>
                <p className="mt-2 line-clamp-3 text-sm leading-6 text-slate-600">
                  {article.summary ||
                    "Bài viết kiến thức được cộng đồng SpecHub biên tập."}
                </p>
                <div className="mt-3 flex flex-wrap gap-1.5">
                  {article.tags.slice(0, 3).map((item) => (
                    <span
                      key={item}
                      className="rounded-full bg-slate-100 px-2 py-0.5 text-[11px] text-slate-500"
                    >
                      #{item}
                    </span>
                  ))}
                </div>
                <div className="mt-auto flex items-end justify-between gap-3 pt-5">
                  <div className="flex items-center gap-3 text-[11px] text-slate-500">
                    <span className="inline-flex items-center gap-1">
                      <Clock3 size={12} />
                      {article.reading_time_minutes} phút
                    </span>
                    <span className="inline-flex items-center gap-1">
                      <Eye size={12} />
                      {Number(article.view_count).toLocaleString("vi")}
                    </span>
                    <span>
                      {formatDate(article.published_at ?? article.updated_at)}
                    </span>
                  </div>
                  <Link
                    href={`/wiki/${article.slug}?language=${encodeURIComponent(article.language.code)}`}
                    className="inline-flex shrink-0 items-center gap-1 text-sm font-semibold text-blue-700"
                  >
                    Đọc <ArrowRight size={14} />
                  </Link>
                </div>
              </article>
            ))}
          </div>
          <div className="flex items-center justify-between border-t border-slate-200 pt-4">
            <span className="text-xs text-slate-500">
              Trang {articles.data.meta.page}/{articles.data.meta.totalPages}
            </span>
            <div className="flex gap-2">
              <button
                type="button"
                disabled={page <= 1}
                onClick={() => setPage((value) => value - 1)}
                className="h-9 rounded-lg border border-slate-200 px-3 text-sm disabled:opacity-40"
              >
                Trước
              </button>
              <button
                type="button"
                disabled={page >= articles.data.meta.totalPages}
                onClick={() => setPage((value) => value + 1)}
                className="h-9 rounded-lg border border-slate-200 px-3 text-sm disabled:opacity-40"
              >
                Sau
              </button>
            </div>
          </div>
        </>
      ) : !articles.isLoading && !articles.isError ? (
        <EmptyState
          icon={<BookOpen size={20} />}
          title="Không tìm thấy bài viết"
          description="Thử từ khóa ngắn hơn hoặc xóa bớt bộ lọc."
        />
      ) : null}
    </div>
  );
}

function articleTypeLabel(value: string) {
  return typeOptions.find(([type]) => type === value)?.[1] ?? "Bài viết";
}
