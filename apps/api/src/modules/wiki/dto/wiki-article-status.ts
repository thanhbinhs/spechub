export const WIKI_ARTICLE_STATUSES = [
  "draft",
  "in_review",
  "published",
  "archived",
] as const;

export type WikiArticleStatus = (typeof WIKI_ARTICLE_STATUSES)[number];
