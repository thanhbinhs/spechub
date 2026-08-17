-- Enrich affiliate partners so trusted retailers can be presented clearly.
ALTER TABLE "affiliate_partners"
  ADD COLUMN "description" VARCHAR(300),
  ADD COLUMN "is_trusted" BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN "display_order" INTEGER NOT NULL DEFAULT 100;

-- Store the latest product snapshot instead of scraping partner pages
-- whenever a public device page is opened.
ALTER TABLE "affiliate_links"
  ADD COLUMN "original_price" DECIMAL(12,2),
  ADD COLUMN "discount_percent" DECIMAL(5,2),
  ADD COLUMN "product_title" VARCHAR(300),
  ADD COLUMN "image_url" TEXT,
  ADD COLUMN "availability_label" VARCHAR(80),
  ADD COLUMN "last_sync_source" VARCHAR(30),
  ADD COLUMN "sync_status" VARCHAR(20) NOT NULL DEFAULT 'pending',
  ADD COLUMN "sync_error" VARCHAR(500),
  ADD COLUMN "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP;

CREATE INDEX "affiliate_partners_is_active_is_trusted_display_order_idx"
  ON "affiliate_partners"("is_active", "is_trusted", "display_order");

CREATE INDEX "affiliate_links_partner_id_sync_status_last_checked_at_idx"
  ON "affiliate_links"("partner_id", "sync_status", "last_checked_at");

-- The first two trusted Vietnamese retail partners are available immediately
-- after the migration; no separate full seed is required.
INSERT INTO "affiliate_partners" (
  "id",
  "name",
  "slug",
  "base_url",
  "description",
  "commission_rate",
  "is_trusted",
  "is_active",
  "display_order"
)
VALUES
  (
    'c3110000-0000-4000-8000-000000000001',
    'CellphoneS',
    'cellphones',
    'https://cellphones.com.vn',
    'Hệ thống bán lẻ thiết bị công nghệ chính hãng tại Việt Nam.',
    0,
    true,
    true,
    10
  ),
  (
    'f6710000-0000-4000-8000-000000000001',
    'FPT Shop',
    'fpt-shop',
    'https://fptshop.com.vn',
    'Hệ thống bán lẻ công nghệ thuộc FPT Retail.',
    0,
    true,
    true,
    20
  )
ON CONFLICT ("slug") DO UPDATE SET
  "name" = EXCLUDED."name",
  "base_url" = EXCLUDED."base_url",
  "description" = EXCLUDED."description",
  "is_trusted" = EXCLUDED."is_trusted",
  "is_active" = EXCLUDED."is_active",
  "display_order" = EXCLUDED."display_order";
