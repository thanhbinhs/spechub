-- Optional cover-image metadata keeps existing wiki articles valid while
-- allowing accessible descriptions and visible attribution on new articles.
ALTER TABLE "wiki_articles"
  ADD COLUMN IF NOT EXISTS "cover_image_alt" VARCHAR(300),
  ADD COLUMN IF NOT EXISTS "cover_image_caption" VARCHAR(500),
  ADD COLUMN IF NOT EXISTS "cover_image_credit" VARCHAR(200);
