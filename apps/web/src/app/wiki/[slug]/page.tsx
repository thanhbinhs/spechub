import { cache } from "react";
import type { Metadata } from "next";
import type { WikiArticle } from "@spechub/api-client";
import { WikiArticlePageClient } from "@/components/wiki-article-page-client";
import { api } from "@/lib/api";

const getArticle = cache(async (slug: string, languageCode?: string) => {
  try {
    return (await api.getWikiArticle(slug, languageCode)).data;
  } catch {
    return undefined;
  }
});

export async function generateMetadata({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ language?: string }>;
}): Promise<Metadata> {
  const [{ slug }, query] = await Promise.all([params, searchParams]);
  const article = await getArticle(slug, query.language || undefined);
  if (!article) {
    return {
      title: "Không tìm thấy bài viết | SpecHub Wiki",
      robots: { index: false, follow: false },
    };
  }

  const canonical = absoluteUrl(`/wiki/${article.slug}`);
  const image = article.cover_image_url
    ? absoluteUrl(article.cover_image_url)
    : absoluteUrl("/og.png");

  return {
    title: `${article.title} | SpecHub Wiki`,
    description:
      article.summary ?? "Kiến thức và trải nghiệm công nghệ từ SpecHub Wiki.",
    alternates: { canonical },
    openGraph: {
      type: "article",
      url: canonical,
      title: article.title,
      description: article.summary ?? undefined,
      publishedTime: article.published_at ?? undefined,
      modifiedTime: article.updated_at,
      tags: article.tags,
      images: [{ url: image, alt: article.cover_image_alt ?? article.title }],
    },
    twitter: {
      card: "summary_large_image",
      title: article.title,
      description: article.summary ?? undefined,
      images: [image],
    },
  };
}

export default async function WikiArticlePage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ language?: string }>;
}) {
  const [{ slug }, query] = await Promise.all([params, searchParams]);
  const languageCode = query.language || undefined;
  const article = await getArticle(slug, languageCode);

  return (
    <>
      {article ? <ArticleStructuredData article={article} /> : null}
      <WikiArticlePageClient
        slug={slug}
        languageCode={languageCode}
        initialArticle={article}
      />
    </>
  );
}

function ArticleStructuredData({ article }: { article: WikiArticle }) {
  const data = {
    "@context": "https://schema.org",
    "@type": "TechArticle",
    headline: article.title,
    description: article.summary,
    image: article.cover_image_url
      ? [absoluteUrl(article.cover_image_url)]
      : undefined,
    datePublished: article.published_at,
    dateModified: article.updated_at,
    inLanguage: article.language.code,
    author: {
      "@type": article.author ? "Person" : "Organization",
      name:
        article.author?.display_name ?? article.author?.username ?? "SpecHub",
    },
    publisher: {
      "@type": "Organization",
      name: "SpecHub",
      logo: {
        "@type": "ImageObject",
        url: absoluteUrl("/logo.png"),
      },
    },
    mainEntityOfPage: absoluteUrl(`/wiki/${article.slug}`),
    keywords: article.tags.join(", "),
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{
        __html: JSON.stringify(data).replace(/</g, "\\u003c"),
      }}
    />
  );
}

function absoluteUrl(path: string) {
  if (/^https?:\/\//i.test(path)) return path;
  const origin =
    process.env.NEXT_PUBLIC_WEB_URL?.replace(/\/$/, "") ??
    "http://localhost:3000";
  return `${origin}${path.startsWith("/") ? path : `/${path}`}`;
}
