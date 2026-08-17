"use client";

import Link from "next/link";
import { Suspense, useDeferredValue, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import type { LucideIcon } from "lucide-react";
import {
  ArrowRight,
  BatteryCharging,
  BookOpen,
  BookText,
  Camera,
  CheckCircle2,
  ChevronRight,
  Clock3,
  Cpu,
  Eye,
  Headphones,
  Laptop,
  Monitor,
  PenLine,
  RotateCcw,
  Search,
  SlidersHorizontal,
  Sparkles,
  Wifi,
} from "lucide-react";
import { EmptyState } from "@/components/empty-state";
import { LoadingPanel } from "@/components/loading-panel";
import { SearchableSelect } from "@/components/searchable-select";
import { api } from "@/lib/api";
import { formatDate } from "@/lib/format";
import { localizeLanguage } from "@/lib/localize";

const typeOptions = [
  ["", "Tất cả loại bài"],
  ["guide", "Hướng dẫn"],
  ["introduction", "Giải thích"],
  ["review", "Chia sẻ / đánh giá"],
  ["comparison", "So sánh"],
  ["tutorial", "Thực hành"],
] as const;

const topicOptions: Array<{
  tag: string;
  label: string;
  description: string;
  icon: LucideIcon;
  accent: string;
}> = [
  {
    tag: "hieu-nang",
    label: "Hiệu năng",
    description: "CPU, GPU, NPU và benchmark",
    icon: Cpu,
    accent: "bg-amber-50 text-amber-700",
  },
  {
    tag: "man-hinh",
    label: "Màn hình",
    description: "OLED, HDR, màu sắc và tần số quét",
    icon: Monitor,
    accent: "bg-violet-50 text-violet-700",
  },
  {
    tag: "camera",
    label: "Camera",
    description: "Phần cứng, tiêu cự và video",
    icon: Camera,
    accent: "bg-rose-50 text-rose-700",
  },
  {
    tag: "pin-sac",
    label: "Pin & sạc",
    description: "Thời lượng, sạc nhanh và tuổi thọ",
    icon: BatteryCharging,
    accent: "bg-emerald-50 text-emerald-700",
  },
  {
    tag: "laptop",
    label: "Laptop",
    description: "RAM, SSD, cổng và tản nhiệt",
    icon: Laptop,
    accent: "bg-sky-50 text-sky-700",
  },
  {
    tag: "ket-noi",
    label: "Kết nối",
    description: "Wi‑Fi, Bluetooth, NFC và eSIM",
    icon: Wifi,
    accent: "bg-cyan-50 text-cyan-700",
  },
  {
    tag: "am-thanh",
    label: "Âm thanh",
    description: "Tai nghe, codec, ANC và micro",
    icon: Headphones,
    accent: "bg-indigo-50 text-indigo-700",
  },
  {
    tag: "mua-sam",
    label: "Chọn mua",
    description: "Quy trình, checklist và so sánh",
    icon: SlidersHorizontal,
    accent: "bg-orange-50 text-orange-700",
  },
];

const searchSuggestions = [
  "Cách đọc benchmark",
  "Chọn laptop",
  "Thời lượng pin",
  "Camera điện thoại",
];

export default function WikiIndexPage() {
  return (
    <Suspense fallback={<LoadingPanel label="Đang mở Wiki" />}>
      <WikiIndexContent />
    </Suspense>
  );
}

function WikiIndexContent() {
  const searchParams = useSearchParams();
  const [query, setQuery] = useState(searchParams.get("q") ?? "");
  const [articleType, setArticleType] = useState(
    searchParams.get("type") ?? "",
  );
  const [language, setLanguage] = useState(
    searchParams.get("language") ?? "vi",
  );
  const [tag, setTag] = useState(searchParams.get("tag") ?? "");
  const [sort, setSort] = useState(searchParams.get("sort") ?? "newest");
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
        pageSize: 15,
        q: deferredQuery || undefined,
        article_type: articleType || undefined,
        language_code: language || undefined,
        tag: tag || undefined,
        sort,
      }),
  });

  const catalog = useQuery({
    queryKey: ["wiki", "catalog", language],
    queryFn: () =>
      api.listWikiArticles({
        pageSize: 100,
        language_code: language || undefined,
        sort: "popular",
      }),
  });

  const tagCounts = useMemo(() => {
    const counts = new Map<string, number>();
    for (const article of catalog.data?.data ?? []) {
      for (const item of article.tags) {
        counts.set(item, (counts.get(item) ?? 0) + 1);
      }
    }
    return counts;
  }, [catalog.data?.data]);

  const visibleTags = useMemo(
    () =>
      [...tagCounts.entries()]
        .sort((left, right) => right[1] - left[1])
        .slice(0, 14),
    [tagCounts],
  );

  const featuredArticles = (catalog.data?.data ?? []).slice(0, 3);
  const hasFilters = Boolean(deferredQuery || articleType || tag);

  function updateFilter(action: () => void) {
    setPage(1);
    action();
  }

  function clearFilters() {
    setQuery("");
    setArticleType("");
    setTag("");
    setSort("newest");
    setPage(1);
  }

  return (
    <div className="app-page mx-auto flex w-full max-w-7xl flex-col gap-7 px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
      {searchParams.get("submitted") ? (
        <div className="flex items-start gap-3 rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-900">
          <CheckCircle2 size={18} className="mt-0.5 shrink-0" />
          <div>
            <strong>Đã gửi đóng góp.</strong> Bài viết đang trong hàng đợi kiểm
            duyệt và sẽ xuất hiện khi được duyệt.
          </div>
        </div>
      ) : null}

      <header className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="grid gap-6 px-5 py-7 sm:px-8 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-end lg:px-10 lg:py-9">
          <div>
            <h1 className="text-3xl font-semibold tracking-tight text-slate-950 sm:text-4xl">
              Wiki công nghệ
            </h1>
          </div>
          <Link href="/wiki/new" className="app-button-primary">
            <PenLine size={16} />
            Viết bài mới
          </Link>
        </div>

        <div className="border-t border-slate-200 bg-slate-50/80 px-5 py-5 sm:px-8 lg:px-10">
          <label className="relative block">
            <span className="sr-only">Tìm bài viết</span>
            <Search
              size={19}
              className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
            />
            <input
              value={query}
              onChange={(event) =>
                updateFilter(() => setQuery(event.target.value))
              }
              placeholder="Bạn muốn tìm hiểu điều gì? Ví dụ: pin, OLED, Geekbench…"
              className="h-12 w-full rounded-xl border border-slate-300 bg-white py-3 pl-12 pr-4 text-sm text-slate-950 shadow-sm outline-none transition placeholder:text-slate-400 hover:border-slate-400 focus:border-blue-500 focus:ring-4 focus:ring-blue-100 sm:text-base"
            />
          </label>
          <div className="mt-3 flex flex-wrap items-center gap-2">
            <span className="text-xs font-medium text-slate-500">
              Tìm nhanh:
            </span>
            {searchSuggestions.map((item) => (
              <button
                key={item}
                type="button"
                onClick={() => updateFilter(() => setQuery(item))}
                className="rounded-full border border-slate-200 bg-white px-3 py-1.5 text-xs text-slate-600 transition hover:border-blue-200 hover:text-blue-700"
              >
                {item}
              </button>
            ))}
          </div>
        </div>
      </header>

      <section aria-labelledby="wiki-topics">
        <div className="flex items-end justify-between gap-4">
          <div>
            <h2
              id="wiki-topics"
              className="text-xl font-semibold text-slate-950"
            >
              Chủ đề
            </h2>
          </div>
          <span className="hidden text-sm text-slate-500 sm:block">
            {catalog.data?.meta.total ?? 0} bài đã xuất bản
          </span>
        </div>
        <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {topicOptions.map((topic) => {
            const Icon = topic.icon;
            const active = tag === topic.tag;
            return (
              <button
                key={topic.tag}
                type="button"
                onClick={() =>
                  updateFilter(() => setTag(active ? "" : topic.tag))
                }
                className={`group flex min-h-28 items-start gap-3 rounded-xl border p-4 text-left transition ${
                  active
                    ? "border-blue-300 bg-blue-50/70 shadow-sm"
                    : "border-slate-200 bg-white hover:-translate-y-0.5 hover:border-blue-200 hover:shadow-sm"
                }`}
              >
                <span
                  className={`grid h-10 w-10 shrink-0 place-items-center rounded-lg ${topic.accent}`}
                >
                  <Icon size={19} />
                </span>
                <span className="min-w-0">
                  <span className="flex items-center gap-1.5 font-semibold text-slate-900">
                    {topic.label}
                    <ChevronRight
                      size={14}
                      className="text-slate-400 transition group-hover:translate-x-0.5"
                    />
                  </span>
                  <span className="mt-1 block text-xs leading-5 text-slate-500">
                    {topic.description}
                  </span>
                  <span className="mt-1.5 block text-[11px] font-medium text-blue-700">
                    {tagCounts.get(topic.tag) ?? 0} bài
                  </span>
                </span>
              </button>
            );
          })}
        </div>
      </section>

      {!hasFilters && featuredArticles.length ? (
        <section className="rounded-2xl bg-slate-950 p-5 text-white sm:p-7">
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.13em] text-blue-300">
            <Sparkles size={15} />
            Nên đọc trước
          </div>
          <div className="mt-5 grid gap-3 lg:grid-cols-3">
            {featuredArticles.map((article, index) => (
              <Link
                key={article.id}
                href={`/wiki/${article.slug}?language=${encodeURIComponent(article.language.code)}`}
                className="group overflow-hidden rounded-xl border border-white/10 bg-white/5 transition hover:border-white/20 hover:bg-white/10"
              >
                {article.cover_image_url ? (
                  <div className="aspect-[16/8] overflow-hidden border-b border-white/10 bg-white">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={article.cover_image_url}
                      alt=""
                      className="h-full w-full object-contain p-3 transition group-hover:scale-[1.03]"
                    />
                  </div>
                ) : null}
                <div className="p-4">
                  <span className="text-xs font-medium text-blue-300">
                    0{index + 1} · {articleTypeLabel(article.article_type)}
                  </span>
                  <h3 className="mt-2 line-clamp-2 font-semibold leading-6">
                    {article.title}
                  </h3>
                  <span className="mt-4 inline-flex items-center gap-1 text-xs text-slate-300">
                    Đọc {article.reading_time_minutes} phút
                    <ArrowRight
                      size={13}
                      className="transition group-hover:translate-x-0.5"
                    />
                  </span>
                </div>
              </Link>
            ))}
          </div>
        </section>
      ) : null}

      <section
        className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm"
        aria-labelledby="wiki-library"
      >
        <div className="border-b border-slate-200 p-4 sm:p-5">
          <div className="grid gap-3 lg:grid-cols-[minmax(0,1fr)_180px_155px_170px]">
            <div className="flex min-w-0 items-center">
              <div>
                <p className="app-section-label">Thư viện Wiki</p>
                <h2
                  id="wiki-library"
                  className="mt-1.5 text-xl font-semibold text-slate-950"
                >
                  {hasFilters ? "Kết quả phù hợp" : "Tất cả bài viết"}
                </h2>
              </div>
              {articles.data ? (
                <span className="ml-3 rounded-full bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-600">
                  {articles.data.meta.total}
                </span>
              ) : null}
            </div>
            <SearchableSelect
              label="Loại bài viết"
              labelClassName="sr-only"
              value={articleType}
              onChange={(value) => updateFilter(() => setArticleType(value))}
              options={typeOptions
                .filter(([value]) => Boolean(value))
                .map(([value, label]) => ({ value, label }))}
              placeholder="Tất cả loại bài"
            />
            <SearchableSelect
              label="Ngôn ngữ"
              labelClassName="sr-only"
              value={language}
              onChange={(value) => updateFilter(() => setLanguage(value))}
              options={[
                { value: "vi", label: "Tiếng Việt" },
                { value: "en", label: "Tiếng Anh" },
              ]}
              placeholder="Mọi ngôn ngữ"
            />
            <SearchableSelect
              label="Sắp xếp"
              labelClassName="sr-only"
              value={sort}
              onChange={(value) => updateFilter(() => setSort(value))}
              options={[
                { value: "newest", label: "Mới xuất bản" },
                { value: "popular", label: "Đọc nhiều nhất" },
                { value: "shortest", label: "Đọc nhanh nhất" },
                { value: "updated", label: "Mới cập nhật" },
                { value: "az", label: "Tên A–Z" },
                { value: "oldest", label: "Cũ nhất" },
              ]}
              clearable={false}
            />
          </div>

          {visibleTags.length ? (
            <div className="mt-4 flex flex-wrap items-center gap-2 border-t border-slate-100 pt-4">
              <span className="inline-flex items-center gap-1 text-xs font-medium text-slate-500">
                <SlidersHorizontal size={13} /> Chủ đề phổ biến
              </span>
              {visibleTags.map(([item, count]) => (
                <button
                  key={item}
                  type="button"
                  onClick={() =>
                    updateFilter(() => setTag(tag === item ? "" : item))
                  }
                  className={`rounded-full px-2.5 py-1.5 text-xs transition ${
                    tag === item
                      ? "bg-slate-950 text-white"
                      : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                  }`}
                >
                  #{item} <span className="opacity-60">{count}</span>
                </button>
              ))}
              {hasFilters ? (
                <button
                  type="button"
                  onClick={clearFilters}
                  className="ml-auto inline-flex items-center gap-1.5 rounded-full px-2.5 py-1.5 text-xs font-semibold text-blue-700 hover:bg-blue-50"
                >
                  <RotateCcw size={12} />
                  Xóa bộ lọc
                </button>
              ) : null}
            </div>
          ) : null}
        </div>

        {articles.isLoading ? (
          <div className="p-5">
            <LoadingPanel label="Đang tìm bài viết" />
          </div>
        ) : null}
        {articles.isError ? (
          <div className="p-5">
            <EmptyState
              icon={<BookOpen size={20} />}
              title="Không thể tải Wiki"
            />
          </div>
        ) : null}
        {articles.data?.data.length ? (
          <>
            <div className="grid divide-y divide-slate-200 md:grid-cols-2 md:divide-x md:[&>*:nth-child(odd)]:border-l-0 xl:grid-cols-3 xl:[&>*:nth-child(3n+1)]:border-l-0">
              {articles.data.data.map((article) => (
                <WikiArticleCard key={article.id} article={article} />
              ))}
            </div>
            <div className="flex items-center justify-between border-t border-slate-200 bg-slate-50/70 px-4 py-4 sm:px-5">
              <span className="text-xs text-slate-500">
                Trang {articles.data.meta.page}/
                {Math.max(articles.data.meta.totalPages, 1)}
              </span>
              <div className="flex gap-2">
                <button
                  type="button"
                  disabled={page <= 1}
                  onClick={() => setPage((value) => value - 1)}
                  className="h-9 rounded-lg border border-slate-200 bg-white px-3 text-sm disabled:opacity-40"
                >
                  Trước
                </button>
                <button
                  type="button"
                  disabled={page >= articles.data.meta.totalPages}
                  onClick={() => setPage((value) => value + 1)}
                  className="h-9 rounded-lg border border-slate-200 bg-white px-3 text-sm disabled:opacity-40"
                >
                  Sau
                </button>
              </div>
            </div>
          </>
        ) : !articles.isLoading && !articles.isError ? (
          <div className="p-5">
            <EmptyState
              icon={<BookOpen size={20} />}
              title="Không tìm thấy bài viết"
              action={
                <button
                  type="button"
                  onClick={clearFilters}
                  className="app-button-secondary"
                >
                  <RotateCcw size={15} />
                  Xóa bộ lọc
                </button>
              }
            />
          </div>
        ) : null}
      </section>
    </div>
  );
}

function WikiArticleCard({
  article,
}: {
  article: Awaited<ReturnType<typeof api.listWikiArticles>>["data"][number];
}) {
  const Icon = articleIcon(article.tags);
  return (
    <article className="group flex min-h-[26rem] flex-col overflow-hidden border-slate-200 transition hover:bg-slate-50/60">
      {article.cover_image_url ? (
        <Link
          href={`/wiki/${article.slug}?language=${encodeURIComponent(article.language.code)}`}
          className="aspect-[16/8] overflow-hidden border-b border-slate-200 bg-[radial-gradient(circle_at_75%_15%,rgba(219,234,254,0.8),transparent_34%),#f8fafc]"
          tabIndex={-1}
          aria-hidden="true"
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={article.cover_image_url}
            alt=""
            loading="lazy"
            className="h-full w-full object-contain p-4 transition duration-300 group-hover:scale-[1.035]"
          />
        </Link>
      ) : (
        <div className="flex aspect-[16/8] items-center justify-center border-b border-slate-200 bg-slate-50">
          <Icon size={26} className="text-slate-300" />
        </div>
      )}
      <div className="flex flex-1 flex-col p-5 sm:p-6">
        <div className="flex items-center justify-between gap-3">
          <span className="inline-flex items-center gap-1.5 text-[11px] font-semibold text-slate-500">
            <Icon size={13} className="text-blue-700" />
            {articleTypeLabel(article.article_type)}
          </span>
          <span className="text-[11px] text-slate-400">
            {formatDate(article.published_at ?? article.updated_at)}
          </span>
        </div>
        <h3 className="mt-3 line-clamp-2 text-lg font-semibold leading-7 text-slate-950 transition group-hover:text-blue-700">
          <Link
            href={`/wiki/${article.slug}?language=${encodeURIComponent(article.language.code)}`}
          >
            {article.title}
          </Link>
        </h3>
        <p className="mt-2 line-clamp-3 text-sm leading-6 text-slate-600">
          {article.summary ||
            "Bài viết kiến thức được cộng đồng SpecHub biên tập."}
        </p>
        <div className="mt-4 flex flex-wrap gap-1.5">
          {article.tags.slice(0, 3).map((item) => (
            <span
              key={item}
              className="rounded-full bg-slate-100 px-2 py-1 text-[11px] text-slate-500"
            >
              #{item}
            </span>
          ))}
        </div>
        <div className="mt-auto flex items-end justify-between gap-3 pt-5">
          <div className="space-y-1.5 text-[11px] text-slate-500">
            <span className="flex items-center gap-3">
              <span className="inline-flex items-center gap-1">
                <Clock3 size={12} />
                {article.reading_time_minutes} phút
              </span>
              <span className="inline-flex items-center gap-1">
                <Eye size={12} />
                {Number(article.view_count).toLocaleString("vi")}
              </span>
            </span>
            <span className="block">{localizeLanguage(article.language)}</span>
          </div>
          <Link
            href={`/wiki/${article.slug}?language=${encodeURIComponent(article.language.code)}`}
            className="inline-flex shrink-0 items-center gap-1 text-sm font-semibold text-blue-700"
          >
            Đọc bài
            <ArrowRight
              size={14}
              className="transition group-hover:translate-x-0.5"
            />
          </Link>
        </div>
      </div>
    </article>
  );
}

function articleTypeLabel(value: string) {
  return typeOptions.find(([type]) => type === value)?.[1] ?? "Bài viết";
}

function articleIcon(tags: string[]) {
  if (tags.includes("hieu-nang") || tags.includes("cpu")) return Cpu;
  if (tags.includes("man-hinh")) return Monitor;
  if (tags.includes("camera")) return Camera;
  if (tags.includes("pin-sac")) return BatteryCharging;
  if (tags.includes("laptop")) return Laptop;
  if (tags.includes("ket-noi")) return Wifi;
  if (tags.includes("am-thanh")) return Headphones;
  if (tags.includes("mua-sam")) return SlidersHorizontal;
  if (tags.includes("bao-mat")) return BookText;
  return BookOpen;
}
