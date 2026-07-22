"use client";

import Link from "next/link";
import { useParams, useSearchParams } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { ArrowLeft } from "lucide-react";
import { WikiEditor } from "@/components/wiki-editor";
import { LoadingPanel } from "@/components/loading-panel";
import { api } from "@/lib/api";

export default function EditWikiArticlePage() {
  const { slug } = useParams<{ slug: string }>();
  const searchParams = useSearchParams();
  const language = searchParams.get("language") ?? undefined;
  const article = useQuery({
    queryKey: ["wiki", "edit", slug, language],
    queryFn: () => api.getWikiArticle(slug, language),
  });

  if (article.isLoading) return <LoadingPanel label="Đang mở trình biên tập" />;
  if (!article.data?.data) return null;

  return (
    <div className="mx-auto w-full max-w-[1400px] px-4 py-6 sm:px-6 lg:px-8">
      <Link
        href={`/wiki/${slug}`}
        className="inline-flex items-center gap-2 text-sm font-medium text-slate-600 hover:text-blue-700"
      >
        <ArrowLeft size={15} />
        Quay lại bài viết
      </Link>
      <div className="mb-6 mt-4">
        <p className="text-xs font-semibold uppercase tracking-wide text-blue-700">
          Đề xuất chỉnh sửa
        </p>
        <h1 className="mt-1 text-2xl font-semibold text-slate-950">
          {article.data.data.title}
        </h1>
      </div>
      <WikiEditor article={article.data.data} />
    </div>
  );
}
