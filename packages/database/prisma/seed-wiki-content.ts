import type { PrismaClient } from "../generated/client";
import { WIKI_SEED_ARTICLES } from "./wiki-content";

function readingTime(markdown: string) {
  const words = markdown.trim().split(/\s+/).filter(Boolean).length;
  return Math.max(1, Math.ceil(words / 220));
}

export async function seedWikiContent(prisma: PrismaClient) {
  const language = await prisma.languages.findUnique({
    where: { code: "vi" },
    select: { id: true },
  });

  if (!language) {
    throw new Error("Cần seed ngôn ngữ Tiếng Việt trước khi tạo Wiki.");
  }

  const author = await prisma.users.findUnique({
    where: { email: "admin@spechub.io" },
    select: { id: true },
  });

  for (const item of WIKI_SEED_ARTICLES) {
    const publishedAt = new Date(item.publishedAt);
    const article = await prisma.wiki_articles.upsert({
      where: {
        entity_table_entity_id_language_id: {
          entity_table: "wiki_topics",
          entity_id: item.slug,
          language_id: language.id,
        },
      },
      update: {
        title: item.title,
        slug: item.slug,
        article_type: item.articleType,
        tags: item.tags,
        cover_image_url: item.coverImageUrl ?? null,
        cover_image_alt: item.coverImageUrl
          ? `Ảnh minh họa cho bài ${item.title}`
          : null,
        cover_image_caption: item.coverImageUrl ? item.title : null,
        cover_image_credit: item.coverImageUrl ? "SpecHub" : null,
        summary: item.summary,
        body_markdown: item.bodyMarkdown,
        status: "published",
        reading_time_minutes: readingTime(item.bodyMarkdown),
        published_at: publishedAt,
        deleted_at: null,
        ...(author && { author_user_id: author.id }),
      },
      create: {
        entity_table: "wiki_topics",
        entity_id: item.slug,
        language_id: language.id,
        author_user_id: author?.id,
        title: item.title,
        slug: item.slug,
        article_type: item.articleType,
        tags: item.tags,
        cover_image_url: item.coverImageUrl,
        cover_image_alt: item.coverImageUrl
          ? `Ảnh minh họa cho bài ${item.title}`
          : undefined,
        cover_image_caption: item.coverImageUrl ? item.title : undefined,
        cover_image_credit: item.coverImageUrl ? "SpecHub" : undefined,
        summary: item.summary,
        body_markdown: item.bodyMarkdown,
        status: "published",
        reading_time_minutes: readingTime(item.bodyMarkdown),
        published_at: publishedAt,
        view_count: BigInt(item.initialViews),
      },
      select: { id: true },
    });

    const revision = await prisma.wiki_revisions.upsert({
      where: {
        article_id_revision_number: {
          article_id: article.id,
          revision_number: 1,
        },
      },
      update: {
        title: item.title,
        body_markdown: item.bodyMarkdown,
        change_summary: "Bài hướng dẫn nền tảng do SpecHub biên soạn",
        is_published: true,
        ...(author && { author_user_id: author.id }),
      },
      create: {
        article_id: article.id,
        author_user_id: author?.id,
        revision_number: 1,
        title: item.title,
        body_markdown: item.bodyMarkdown,
        change_summary: "Bài hướng dẫn nền tảng do SpecHub biên soạn",
        is_published: true,
      },
      select: { id: true },
    });

    await prisma.wiki_articles.update({
      where: { id: article.id },
      data: { current_revision_id: revision.id },
    });
  }

  return WIKI_SEED_ARTICLES.length;
}
