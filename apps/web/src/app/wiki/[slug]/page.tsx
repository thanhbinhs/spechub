"use client";

import Link from "next/link";
import { useParams, useSearchParams } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import {
  ArrowLeft,
  BookOpen,
  Clock3,
  ExternalLink,
  Eye,
  PenLine,
} from "lucide-react";
import { EmptyState } from "@/components/empty-state";
import { LoadingPanel } from "@/components/loading-panel";
import { PageHeader } from "@/components/page-header";
import { api } from "@/lib/api";
import { formatDate } from "@/lib/format";
import { MarkdownContent } from "@/components/markdown-content";

export default function WikiArticlePage() {
  const params = useParams<{ slug: string }>();
  const searchParams = useSearchParams();
  const slug = params.slug;
  const languageCode = searchParams.get("language") ?? undefined;
  const article = useQuery({
    queryKey: ["wiki", "article", slug, languageCode],
    queryFn: () => api.getWikiArticle(slug, languageCode),
    enabled: Boolean(slug),
  });

  if (article.isLoading) return <LoadingPanel label="Đang tải bài viết" />;
  if (article.isError || !article.data?.data) {
    return (
      <div className="mx-auto w-full max-w-4xl px-4 py-8 sm:px-6 lg:px-8">
        <EmptyState
          icon={<BookOpen size={20} />}
          title="Không tìm thấy bài viết"
          description="Bài viết có thể chưa được xuất bản hoặc đã được lưu trữ."
          action={
            <Link
              href="/wiki"
              className="inline-flex h-10 items-center gap-2 rounded-md bg-blue-600 px-4 text-sm font-medium text-white transition hover:bg-blue-700"
            >
              <ArrowLeft size={16} />
              Về Wiki
            </Link>
          }
        />
      </div>
    );
  }

  const value = article.data.data;
  return (
    <article className="mx-auto w-full max-w-4xl px-4 py-6 sm:px-6 lg:px-8">
      <Link
        href="/wiki"
        className="inline-flex items-center gap-2 text-sm font-medium text-slate-600 transition hover:text-blue-700"
      >
        <ArrowLeft size={16} />
        Tất cả bài viết
      </Link>
      <div className="mt-5 rounded-xl border border-slate-200 bg-white p-5 shadow-sm sm:p-8">
        <PageHeader
          eyebrow={`${value.language.name} · ${value._count?.revisions ?? 0} phiên bản`}
          title={value.title}
          description={value.summary ?? "Bài viết kiến thức từ SpecHub Wiki."}
        />
        <div className="mt-5 flex flex-wrap items-center gap-4 border-y border-slate-100 py-3 text-xs text-slate-500">
          <span>Xuất bản {formatDate(value.published_at)}</span>
          <span className="inline-flex items-center gap-1">
            <Clock3 size={13} /> {value.reading_time_minutes} phút đọc
          </span>
          <span className="inline-flex items-center gap-1">
            <Eye size={13} /> {Number(value.view_count).toLocaleString("vi")}{" "}
            lượt xem
          </span>
          {value.author ? (
            <span>
              Tác giả{" "}
              {value.author.display_name ??
                value.author.username ??
                "Thành viên SpecHub"}
            </span>
          ) : null}
          <Link
            href={`/wiki/${value.slug}/edit?language=${encodeURIComponent(value.language.code)}`}
            className="ml-auto inline-flex items-center gap-1.5 font-semibold text-blue-700"
          >
            <PenLine size={13} /> Đề xuất chỉnh sửa
          </Link>
        </div>
        {value.tags.length ? (
          <div className="mt-4 flex flex-wrap gap-2">
            {value.tags.map((tag) => (
              <Link
                key={tag}
                href={`/wiki?tag=${encodeURIComponent(tag)}`}
                className="rounded-full bg-slate-100 px-2.5 py-1 text-xs text-slate-600"
              >
                #{tag}
              </Link>
            ))}
          </div>
        ) : null}
        {value.body_markdown ? (
          <div className="mt-6 break-words text-[15px]">
            <MarkdownContent markdown={value.body_markdown} />
          </div>
        ) : (
          <p className="mt-8 text-sm text-slate-500">
            Bài viết này chưa có nội dung chi tiết.
          </p>
        )}

        {value.citations.length ? (
          <section className="mt-10 border-t border-slate-200 pt-6">
            <h2 className="text-base font-semibold text-slate-950">
              Nguồn tham khảo
            </h2>
            <ol className="mt-4 space-y-3">
              {value.citations.map(({ citation, anchor_key }) => (
                <li
                  key={citation.id}
                  className="text-sm leading-6 text-slate-600"
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
      </div>
    </article>
  );
}
