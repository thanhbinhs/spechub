ALTER TABLE "wiki_articles"
  ADD COLUMN "author_user_id" UUID,
  ADD COLUMN "article_type" VARCHAR(30) NOT NULL DEFAULT 'guide',
  ADD COLUMN "tags" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
  ADD COLUMN "cover_image_url" TEXT,
  ADD COLUMN "reading_time_minutes" INTEGER NOT NULL DEFAULT 1;

ALTER TABLE "wiki_articles"
  ADD CONSTRAINT "wiki_articles_author_user_id_fkey"
  FOREIGN KEY ("author_user_id") REFERENCES "users"("id")
  ON DELETE SET NULL ON UPDATE CASCADE;

CREATE INDEX "wiki_articles_article_type_published_at_idx"
  ON "wiki_articles"("article_type", "published_at");
CREATE INDEX "wiki_articles_author_user_id_idx"
  ON "wiki_articles"("author_user_id");
