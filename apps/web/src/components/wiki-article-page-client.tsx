"use client";

import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { ArrowLeft, BookOpen } from "lucide-react";
import type { WikiArticle } from "@spechub/api-client";
import { EmptyState } from "@/components/empty-state";
import { LoadingPanel } from "@/components/loading-panel";
import { WikiArticleReader } from "@/components/wiki-article-reader";
import { api } from "@/lib/api";

export function WikiArticlePageClient({
  slug,
  languageCode,
  initialArticle,
}: {
  slug: string;
  languageCode?: string;
  initialArticle?: WikiArticle;
}) {
  const article = useQuery({
    queryKey: ["wiki", "article", slug, languageCode],
    queryFn: () => api.getWikiArticle(slug, languageCode),
    initialData: initialArticle ? { data: initialArticle } : undefined,
    staleTime: 60_000,
    enabled: Boolean(slug),
  });

  if (article.isLoading) return <LoadingPanel label="Đang tải bài viết" />;
  if (article.isError || !article.data?.data) {
    return (
      <div className="app-page mx-auto w-full max-w-4xl px-4 py-8 sm:px-6 lg:px-8">
        <EmptyState
          icon={<BookOpen size={20} />}
          title="Không tìm thấy bài viết"
          description="Bài viết có thể chưa được xuất bản hoặc đã được lưu trữ."
          action={
            <Link href="/wiki" className="app-button-primary">
              <ArrowLeft size={16} />
              Về Wiki
            </Link>
          }
        />
      </div>
    );
  }

  return <WikiArticleReader article={article.data.data} />;
}
