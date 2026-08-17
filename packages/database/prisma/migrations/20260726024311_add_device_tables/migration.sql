-- DropIndex
DROP INDEX "wiki_articles_article_type_published_at_idx";

-- AlterTable
ALTER TABLE "variant_module_scores" ALTER COLUMN "updated_at" DROP DEFAULT;

-- AlterTable
ALTER TABLE "wiki_articles" ALTER COLUMN "article_type" SET DATA TYPE VARCHAR(40),
ALTER COLUMN "tags" DROP DEFAULT;

-- CreateIndex
CREATE INDEX "wiki_articles_article_type_status_idx" ON "wiki_articles"("article_type", "status");

-- CreateIndex
CREATE INDEX "wiki_articles_tags_idx" ON "wiki_articles" USING GIN ("tags");

-- RenameIndex
ALTER INDEX "variant_module_scores_device_variant_id_module_kind_module_id_k" RENAME TO "variant_module_scores_device_variant_id_module_kind_module__key";
