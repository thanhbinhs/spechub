"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import type { WikiArticle } from "@spechub/api-client";
import {
  ArrowLeft,
  ArrowRight,
  BookOpen,
  CalendarDays,
  Check,
  ChevronDown,
  Clock3,
  Copy,
  ExternalLink,
  Eye,
  ListTree,
  PenLine,
  UserRound,
} from "lucide-react";
import { MarkdownContent } from "@/components/markdown-content";
import { api } from "@/lib/api";
import { formatDate } from "@/lib/format";
import { localizeLanguage } from "@/lib/localize";
import { extractWikiHeadings, type WikiHeading } from "@/lib/wiki-markdown";

export function WikiArticleReader({ article }: { article: WikiArticle }) {
  const headings = useMemo(
    () => extractWikiHeadings(article.body_markdown ?? ""),
    [article.body_markdown],
  );
  const [progress, setProgress] = useState(0);
  const [activeHeading, setActiveHeading] = useState(headings[0]?.id ?? "");
  const [copied, setCopied] = useState(false);
  const [coverFailed, setCoverFailed] = useState(false);
  const related = useQuery({
    queryKey: [
      "wiki",
      "related",
      article.slug,
      article.tags[0],
      article.language.code,
    ],
    queryFn: () =>
      api.listWikiArticles({
        pageSize: 4,
        tag: article.tags[0],
        language_code: article.language.code,
        sort: "popular",
      }),
    enabled: Boolean(article.tags[0]),
  });

  useEffect(() => {
    setCoverFailed(false);
  }, [article.cover_image_url]);

  useEffect(() => {
    function updateReadingState() {
      const content = document.getElementById("wiki-article-content");
      if (content) {
        const rect = content.getBoundingClientRect();
        const total = Math.max(
          content.offsetHeight - window.innerHeight * 0.55,
          1,
        );
        const read = Math.min(Math.max(-rect.top + 120, 0), total);
        setProgress(Math.round((read / total) * 100));
      }

      let current = headings[0]?.id ?? "";
      for (const heading of headings) {
        const element = document.getElementById(heading.id);
        if (element && element.getBoundingClientRect().top <= 150) {
          current = heading.id;
        }
      }
      setActiveHeading(current);
    }

    updateReadingState();
    window.addEventListener("scroll", updateReadingState, { passive: true });
    window.addEventListener("resize", updateReadingState);
    return () => {
      window.removeEventListener("scroll", updateReadingState);
      window.removeEventListener("resize", updateReadingState);
    };
  }, [headings]);

  async function copyArticleLink() {
    await navigator.clipboard.writeText(window.location.href);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1800);
  }

  const relatedArticles = (related.data?.data ?? [])
    .filter((item) => item.slug !== article.slug)
    .slice(0, 3);

  return (
    <article className="app-page mx-auto w-full max-w-7xl px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
      <div className="fixed inset-x-0 top-0 z-50 h-0.5 bg-transparent">
        <div
          className="h-full bg-blue-600 transition-[width] duration-150"
          style={{ width: `${progress}%` }}
        />
      </div>

      <Link
        href="/wiki"
        className="inline-flex items-center gap-2 text-sm font-medium text-slate-600 transition hover:text-blue-700"
      >
        <ArrowLeft size={16} />
        Tất cả bài viết
      </Link>

      <header className="mt-5 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="px-5 py-7 sm:px-8 sm:py-9 lg:px-10">
          <div className="flex flex-wrap items-center gap-2">
            <span className="rounded-full bg-blue-50 px-3 py-1 text-xs font-semibold text-blue-700">
              {articleTypeLabel(article.article_type)}
            </span>
            {article.tags.slice(0, 3).map((tag) => (
              <Link
                key={tag}
                href={`/wiki?tag=${encodeURIComponent(tag)}`}
                className="rounded-full bg-slate-100 px-3 py-1 text-xs text-slate-600 transition hover:bg-slate-200"
              >
                #{tag}
              </Link>
            ))}
          </div>
          <h1 className="mt-5 max-w-4xl text-3xl font-semibold leading-tight tracking-tight text-slate-950 sm:text-4xl lg:text-5xl">
            {article.title}
          </h1>
          <p className="mt-4 max-w-3xl text-base leading-7 text-slate-600 sm:text-lg sm:leading-8">
            {article.summary ?? "Bài viết kiến thức từ SpecHub Wiki."}
          </p>
        </div>
        {article.cover_image_url && !coverFailed ? (
          <figure className="border-t border-slate-200 bg-slate-50">
            <div className="mx-auto aspect-[16/7] max-h-[560px] min-h-56 w-full overflow-hidden bg-[radial-gradient(circle_at_75%_15%,rgba(219,234,254,0.9),transparent_36%),linear-gradient(145deg,#fff,#f8fafc)]">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={article.cover_image_url}
                alt={article.cover_image_alt ?? ""}
                onError={() => setCoverFailed(true)}
                className="h-full w-full object-contain px-5 py-6 sm:px-10 sm:py-8"
              />
            </div>
            {article.cover_image_caption || article.cover_image_credit ? (
              <figcaption className="flex flex-wrap gap-x-2 border-t border-slate-200 bg-white px-5 py-2.5 text-xs leading-5 text-slate-500 sm:px-8 lg:px-10">
                {article.cover_image_caption ? (
                  <span>{article.cover_image_caption}</span>
                ) : null}
                {article.cover_image_credit ? (
                  <span className="font-medium text-slate-600">
                    Ảnh: {article.cover_image_credit}
                  </span>
                ) : null}
              </figcaption>
            ) : null}
          </figure>
        ) : null}
        <div className="flex flex-wrap items-center gap-x-5 gap-y-3 border-t border-slate-200 bg-slate-50/80 px-5 py-4 text-xs text-slate-500 sm:px-8 lg:px-10">
          <span>{localizeLanguage(article.language)}</span>
          <span className="inline-flex items-center gap-1.5">
            <CalendarDays size={13} />
            Xuất bản {formatDate(article.published_at)}
          </span>
          {article.updated_at !== article.created_at ? (
            <span>Cập nhật {formatDate(article.updated_at)}</span>
          ) : null}
          <span className="inline-flex items-center gap-1.5">
            <Clock3 size={13} /> {article.reading_time_minutes} phút đọc
          </span>
          <span className="inline-flex items-center gap-1.5">
            <Eye size={13} /> {Number(article.view_count).toLocaleString("vi")}{" "}
            lượt xem
          </span>
          {article.author ? (
            <span>
              Biên soạn bởi{" "}
              {article.author.display_name ??
                article.author.username ??
                "SpecHub"}
            </span>
          ) : null}
          <div className="ml-auto flex items-center gap-2">
            <button
              type="button"
              onClick={copyArticleLink}
              className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 font-semibold text-slate-700 transition hover:border-blue-200 hover:text-blue-700"
            >
              {copied ? <Check size={13} /> : <Copy size={13} />}
              {copied ? "Đã sao chép" : "Sao chép liên kết"}
            </button>
            <Link
              href={`/wiki/${article.slug}/edit?language=${encodeURIComponent(article.language.code)}`}
              className="inline-flex h-9 items-center gap-1.5 rounded-lg bg-slate-950 px-3 font-semibold text-white transition hover:bg-slate-800"
            >
              <PenLine size={13} />
              Đề xuất sửa
            </Link>
          </div>
        </div>
      </header>

      {headings.length ? (
        <details className="mt-5 rounded-xl border border-slate-200 bg-white lg:hidden">
          <summary className="flex cursor-pointer items-center justify-between gap-3 p-4 text-sm font-semibold text-slate-900">
            <span className="inline-flex items-center gap-2">
              <ListTree size={16} className="text-blue-700" />
              Mục lục bài viết
            </span>
            <ChevronDown size={16} />
          </summary>
          <TableOfContents
            headings={headings}
            activeHeading={activeHeading}
            className="border-t border-slate-100 px-4 py-3"
          />
        </details>
      ) : null}

      <div className="mt-6 grid items-start gap-6 lg:grid-cols-[250px_minmax(0,1fr)]">
        <aside className="sticky top-24 hidden space-y-4 lg:block">
          <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
            <div className="flex items-center justify-between text-xs font-semibold text-slate-600">
              <span>Tiến độ đọc</span>
              <span className="tabular-nums text-blue-700">{progress}%</span>
            </div>
            <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-slate-100">
              <div
                className="h-full rounded-full bg-blue-600 transition-[width]"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>
          {headings.length ? (
            <nav
              aria-label="Mục lục bài viết"
              className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm"
            >
              <p className="inline-flex items-center gap-2 text-sm font-semibold text-slate-950">
                <ListTree size={16} className="text-blue-700" />
                Mục lục
              </p>
              <TableOfContents
                headings={headings}
                activeHeading={activeHeading}
                className="mt-3"
              />
            </nav>
          ) : null}
        </aside>

        <main
          id="wiki-article-content"
          className="min-w-0 rounded-2xl border border-slate-200 bg-white px-5 py-2 shadow-sm sm:px-8 lg:px-10"
        >
          {article.body_markdown ? (
            <div className="break-words text-[15px] sm:text-base">
              <MarkdownContent markdown={article.body_markdown} />
            </div>
          ) : (
            <p className="my-8 text-sm text-slate-500">
              Bài viết này chưa có nội dung chi tiết.
            </p>
          )}

          <section className="my-9 flex items-start gap-3 rounded-xl border border-slate-200 bg-slate-50 p-4 sm:p-5">
            <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-slate-900 text-white">
              <UserRound size={18} />
            </span>
            <div className="min-w-0">
              <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
                Biên soạn bởi
              </p>
              <p className="mt-0.5 font-semibold text-slate-950">
                {article.author?.display_name ??
                  article.author?.username ??
                  "Ban biên tập SpecHub"}
              </p>
              <p className="mt-1 text-xs leading-5 text-slate-500">
                Nội dung tập trung vào trải nghiệm sử dụng, dữ kiện có thể kiểm
                chứng và các đánh đổi khi chọn thiết bị.
              </p>
            </div>
          </section>

          {article.citations.length ? (
            <section className="mb-8 mt-10 border-t border-slate-200 pt-7">
              <h2 className="text-lg font-semibold text-slate-950">
                Nguồn tham khảo
              </h2>
              <ol className="mt-4 space-y-3">
                {article.citations.map(({ citation, anchor_key }) => (
                  <li
                    key={citation.id}
                    className="rounded-lg bg-slate-50 p-3 text-sm leading-6 text-slate-600"
                  >
                    <span className="font-medium text-slate-800">
                      {citation.source?.name ?? "Nguồn"}
                    </span>
                    {citation.title ? ` — ${citation.title}` : ""}
                    {citation.excerpt ? `: ${citation.excerpt}` : ""}
                    {anchor_key ? (
                      <span className="ml-1 text-xs text-slate-400">
                        #{anchor_key}
                      </span>
                    ) : null}
                    {citation.url ? (
                      <a
                        href={citation.url}
                        target="_blank"
                        rel="noreferrer"
                        className="ml-2 inline-flex items-center gap-1 font-medium text-blue-700 hover:text-blue-800"
                      >
                        Mở nguồn <ExternalLink size={13} />
                      </a>
                    ) : null}
                  </li>
                ))}
              </ol>
            </section>
          ) : null}
        </main>
      </div>

      {relatedArticles.length ? (
        <section className="mt-8 border-t border-slate-200 pt-7">
          <div className="flex items-end justify-between gap-4">
            <div>
              <p className="app-section-label">Đọc tiếp</p>
              <h2 className="mt-2 text-xl font-semibold text-slate-950">
                Bài cùng chủ đề
              </h2>
            </div>
            <Link
              href={`/wiki?tag=${encodeURIComponent(article.tags[0] ?? "")}`}
              className="hidden items-center gap-1 text-sm font-semibold text-blue-700 sm:inline-flex"
            >
              Xem tất cả <ArrowRight size={14} />
            </Link>
          </div>
          <div className="mt-4 grid gap-3 md:grid-cols-3">
            {relatedArticles.map((item) => (
              <Link
                key={item.id}
                href={`/wiki/${item.slug}?language=${encodeURIComponent(item.language.code)}`}
                className="group overflow-hidden rounded-xl border border-slate-200 bg-white transition hover:-translate-y-0.5 hover:border-blue-200 hover:shadow-sm"
              >
                {item.cover_image_url ? (
                  <div className="aspect-[16/9] overflow-hidden border-b border-slate-200 bg-slate-50">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={item.cover_image_url}
                      alt=""
                      loading="lazy"
                      className="h-full w-full object-contain p-3 transition group-hover:scale-[1.03]"
                    />
                  </div>
                ) : null}
                <div className="p-5">
                  <BookOpen size={18} className="text-blue-700" />
                  <h3 className="mt-3 line-clamp-2 font-semibold leading-6 text-slate-950 group-hover:text-blue-700">
                    {item.title}
                  </h3>
                  <span className="mt-4 inline-flex items-center gap-1 text-xs text-slate-500">
                    {item.reading_time_minutes} phút đọc
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
    </article>
  );
}

function TableOfContents({
  headings,
  activeHeading,
  className,
}: {
  headings: WikiHeading[];
  activeHeading: string;
  className?: string;
}) {
  return (
    <ol className={`space-y-1 ${className ?? ""}`}>
      {headings.map((heading) => (
        <li key={`${heading.level}-${heading.id}`}>
          <a
            href={`#${heading.id}`}
            className={`block rounded-md py-1.5 text-xs leading-5 transition ${
              heading.level === 3 ? "pl-3" : ""
            } ${
              activeHeading === heading.id
                ? "bg-blue-50 px-2 font-semibold text-blue-700"
                : "text-slate-500 hover:text-slate-900"
            }`}
          >
            {heading.title}
          </a>
        </li>
      ))}
    </ol>
  );
}

function articleTypeLabel(value: WikiArticle["article_type"]) {
  const labels: Record<WikiArticle["article_type"], string> = {
    guide: "Hướng dẫn",
    introduction: "Giải thích",
    review: "Chia sẻ / đánh giá",
    comparison: "So sánh",
    tutorial: "Thực hành",
  };
  return labels[value];
}
