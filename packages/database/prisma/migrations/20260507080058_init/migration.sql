-- CreateExtension
CREATE EXTENSION IF NOT EXISTS "pg_trgm";

-- CreateExtension
CREATE EXTENSION IF NOT EXISTS "unaccent";

-- CreateExtension
CREATE EXTENSION IF NOT EXISTS "vector";

-- CreateTable
CREATE TABLE "release_statuses" (
    "id" SERIAL NOT NULL,
    "code" VARCHAR(30) NOT NULL,
    "name" VARCHAR(60) NOT NULL,
    "sort_order" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "release_statuses_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "currencies" (
    "code" VARCHAR(3) NOT NULL,
    "name" VARCHAR(60) NOT NULL,
    "symbol" VARCHAR(10) NOT NULL,
    "decimal_places" INTEGER NOT NULL DEFAULT 2,

    CONSTRAINT "currencies_pkey" PRIMARY KEY ("code")
);

-- CreateTable
CREATE TABLE "organizations" (
    "id" UUID NOT NULL,
    "name" VARCHAR(160) NOT NULL,
    "slug" VARCHAR(180) NOT NULL,
    "short_name" VARCHAR(80),
    "country_code" VARCHAR(2),
    "founded_year" INTEGER,
    "website_url" TEXT,
    "logo_url" TEXT,
    "description" TEXT,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "parent_org_id" UUID,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,
    "deleted_at" TIMESTAMPTZ(6),

    CONSTRAINT "organizations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "device_categories" (
    "id" UUID NOT NULL,
    "name" VARCHAR(60) NOT NULL,
    "slug" VARCHAR(80) NOT NULL,
    "description" TEXT,
    "icon_url" TEXT,
    "parent_category_id" UUID,
    "display_order" INTEGER NOT NULL DEFAULT 0,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "device_categories_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "product_families" (
    "id" UUID NOT NULL,
    "brand_org_id" UUID NOT NULL,
    "device_category_id" UUID NOT NULL,
    "name" VARCHAR(120) NOT NULL,
    "slug" VARCHAR(160) NOT NULL,
    "description" TEXT,
    "cover_image_url" TEXT,
    "first_release_year" INTEGER,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "product_families_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "device_models" (
    "id" UUID NOT NULL,
    "product_family_id" UUID NOT NULL,
    "name" VARCHAR(160) NOT NULL,
    "slug" VARCHAR(200) NOT NULL,
    "internal_codename" VARCHAR(80),
    "release_status_id" INTEGER NOT NULL,
    "announcement_date" DATE,
    "release_date" DATE,
    "description" TEXT,
    "cover_image_url" TEXT,
    "view_count" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,
    "deleted_at" TIMESTAMPTZ(6),

    CONSTRAINT "device_models_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "device_variants" (
    "id" UUID NOT NULL,
    "device_model_id" UUID NOT NULL,
    "variant_name" VARCHAR(160) NOT NULL,
    "sku_code" VARCHAR(100),
    "color_name" VARCHAR(80),
    "release_status_id" INTEGER NOT NULL,
    "launch_date" DATE,
    "launch_price" DECIMAL(12,2),
    "currency_code" VARCHAR(3),
    "is_default" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "device_variants_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "chipsets" (
    "id" UUID NOT NULL,
    "manufacturer_org_id" UUID NOT NULL,
    "name" VARCHAR(160) NOT NULL,
    "slug" VARCHAR(180) NOT NULL,
    "description" TEXT,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "chipsets_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "users" (
    "id" UUID NOT NULL,
    "email" VARCHAR(255) NOT NULL,
    "email_verified" BOOLEAN NOT NULL DEFAULT false,
    "password_hash" TEXT,
    "name" VARCHAR(120),
    "username" VARCHAR(60),
    "avatar_url" TEXT,
    "role" VARCHAR(20) NOT NULL DEFAULT 'reader',
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "last_login_at" TIMESTAMP(3),
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "embeddings" (
    "id" UUID NOT NULL,
    "entity_type" VARCHAR(50) NOT NULL,
    "entity_id" UUID NOT NULL,
    "chunk_text" TEXT NOT NULL,
    "chunk_index" INTEGER NOT NULL DEFAULT 0,
    "embedding_json" JSONB NOT NULL,
    "model_name" VARCHAR(50) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "embeddings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ai_query_cache" (
    "id" UUID NOT NULL,
    "query_hash" VARCHAR(64) NOT NULL,
    "query_text" TEXT NOT NULL,
    "answer_text" TEXT NOT NULL,
    "citations" JSONB NOT NULL,
    "model_name" VARCHAR(50) NOT NULL,
    "hit_count" INTEGER NOT NULL DEFAULT 1,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expires_at" TIMESTAMP(3),

    CONSTRAINT "ai_query_cache_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "search_logs" (
    "id" UUID NOT NULL,
    "user_id" UUID,
    "query" TEXT NOT NULL,
    "query_type" VARCHAR(20) NOT NULL,
    "result_count" INTEGER NOT NULL DEFAULT 0,
    "session_id" UUID,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "search_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "data_sources" (
    "id" UUID NOT NULL,
    "name" VARCHAR(100) NOT NULL,
    "base_url" TEXT NOT NULL,
    "reliability" INTEGER NOT NULL DEFAULT 50,
    "last_crawled_at" TIMESTAMP(3),
    "crawl_config" JSONB NOT NULL,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "data_sources_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "raw_pages" (
    "id" UUID NOT NULL,
    "source_id" UUID NOT NULL,
    "url" TEXT NOT NULL,
    "raw_html" TEXT,
    "raw_text" TEXT,
    "parsed_data" JSONB,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "device_model_id" UUID,
    "crawled_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "parsed_at" TIMESTAMP(3),

    CONSTRAINT "raw_pages_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "affiliate_partners" (
    "id" UUID NOT NULL,
    "name" VARCHAR(100) NOT NULL,
    "slug" VARCHAR(120) NOT NULL,
    "base_url" TEXT NOT NULL,
    "logo_url" TEXT,
    "commission_rate" DECIMAL(5,2) NOT NULL,
    "is_active" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "affiliate_partners_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "affiliate_links" (
    "id" UUID NOT NULL,
    "partner_id" UUID NOT NULL,
    "device_variant_id" UUID NOT NULL,
    "region_code" VARCHAR(2) NOT NULL,
    "product_url" TEXT NOT NULL,
    "current_price" DECIMAL(12,2),
    "currency_code" VARCHAR(3) NOT NULL,
    "in_stock" BOOLEAN NOT NULL DEFAULT true,
    "last_checked_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "affiliate_links_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "subscription_plans" (
    "id" UUID NOT NULL,
    "code" VARCHAR(30) NOT NULL,
    "name" VARCHAR(100) NOT NULL,
    "price_monthly" DECIMAL(8,2) NOT NULL,
    "price_yearly" DECIMAL(8,2) NOT NULL,
    "currency_code" VARCHAR(3) NOT NULL,
    "features" JSONB NOT NULL,
    "is_active" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "subscription_plans_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "subscriptions" (
    "id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "plan_id" UUID NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'active',
    "billing_cycle" VARCHAR(20) NOT NULL,
    "current_period_end" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "subscriptions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "wishlists" (
    "id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "name" VARCHAR(100) NOT NULL DEFAULT 'Default',
    "is_public" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "wishlists_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "price_alerts" (
    "id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "device_variant_id" UUID NOT NULL,
    "target_price" DECIMAL(12,2) NOT NULL,
    "currency_code" VARCHAR(3) NOT NULL,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "triggered_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "price_alerts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "notifications" (
    "id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "type" VARCHAR(50) NOT NULL,
    "title" VARCHAR(200) NOT NULL,
    "body" TEXT,
    "data" JSONB,
    "read_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "notifications_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "release_statuses_code_key" ON "release_statuses"("code");

-- CreateIndex
CREATE UNIQUE INDEX "organizations_name_key" ON "organizations"("name");

-- CreateIndex
CREATE UNIQUE INDEX "organizations_slug_key" ON "organizations"("slug");

-- CreateIndex
CREATE INDEX "organizations_slug_idx" ON "organizations"("slug");

-- CreateIndex
CREATE INDEX "organizations_country_code_idx" ON "organizations"("country_code");

-- CreateIndex
CREATE UNIQUE INDEX "device_categories_name_key" ON "device_categories"("name");

-- CreateIndex
CREATE UNIQUE INDEX "device_categories_slug_key" ON "device_categories"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "product_families_slug_key" ON "product_families"("slug");

-- CreateIndex
CREATE INDEX "product_families_slug_idx" ON "product_families"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "product_families_brand_org_id_name_key" ON "product_families"("brand_org_id", "name");

-- CreateIndex
CREATE UNIQUE INDEX "device_models_slug_key" ON "device_models"("slug");

-- CreateIndex
CREATE INDEX "device_models_slug_idx" ON "device_models"("slug");

-- CreateIndex
CREATE INDEX "device_models_release_date_idx" ON "device_models"("release_date");

-- CreateIndex
CREATE UNIQUE INDEX "device_models_product_family_id_name_key" ON "device_models"("product_family_id", "name");

-- CreateIndex
CREATE UNIQUE INDEX "device_variants_device_model_id_variant_name_key" ON "device_variants"("device_model_id", "variant_name");

-- CreateIndex
CREATE UNIQUE INDEX "chipsets_name_key" ON "chipsets"("name");

-- CreateIndex
CREATE UNIQUE INDEX "chipsets_slug_key" ON "chipsets"("slug");

-- CreateIndex
CREATE INDEX "chipsets_slug_idx" ON "chipsets"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE UNIQUE INDEX "users_username_key" ON "users"("username");

-- CreateIndex
CREATE INDEX "users_email_idx" ON "users"("email");

-- CreateIndex
CREATE INDEX "embeddings_entity_type_entity_id_idx" ON "embeddings"("entity_type", "entity_id");

-- CreateIndex
CREATE UNIQUE INDEX "ai_query_cache_query_hash_key" ON "ai_query_cache"("query_hash");

-- CreateIndex
CREATE INDEX "ai_query_cache_expires_at_idx" ON "ai_query_cache"("expires_at");

-- CreateIndex
CREATE INDEX "search_logs_user_id_idx" ON "search_logs"("user_id");

-- CreateIndex
CREATE INDEX "search_logs_created_at_idx" ON "search_logs"("created_at");

-- CreateIndex
CREATE UNIQUE INDEX "data_sources_name_key" ON "data_sources"("name");

-- CreateIndex
CREATE UNIQUE INDEX "raw_pages_url_key" ON "raw_pages"("url");

-- CreateIndex
CREATE INDEX "raw_pages_status_idx" ON "raw_pages"("status");

-- CreateIndex
CREATE UNIQUE INDEX "affiliate_partners_name_key" ON "affiliate_partners"("name");

-- CreateIndex
CREATE UNIQUE INDEX "affiliate_partners_slug_key" ON "affiliate_partners"("slug");

-- CreateIndex
CREATE INDEX "affiliate_links_device_variant_id_region_code_idx" ON "affiliate_links"("device_variant_id", "region_code");

-- CreateIndex
CREATE UNIQUE INDEX "subscription_plans_code_key" ON "subscription_plans"("code");

-- CreateIndex
CREATE UNIQUE INDEX "subscriptions_user_id_key" ON "subscriptions"("user_id");

-- CreateIndex
CREATE INDEX "price_alerts_device_variant_id_is_active_idx" ON "price_alerts"("device_variant_id", "is_active");

-- CreateIndex
CREATE INDEX "notifications_user_id_read_at_idx" ON "notifications"("user_id", "read_at");

-- AddForeignKey
ALTER TABLE "organizations" ADD CONSTRAINT "organizations_parent_org_id_fkey" FOREIGN KEY ("parent_org_id") REFERENCES "organizations"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "device_categories" ADD CONSTRAINT "device_categories_parent_category_id_fkey" FOREIGN KEY ("parent_category_id") REFERENCES "device_categories"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "product_families" ADD CONSTRAINT "product_families_brand_org_id_fkey" FOREIGN KEY ("brand_org_id") REFERENCES "organizations"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "product_families" ADD CONSTRAINT "product_families_device_category_id_fkey" FOREIGN KEY ("device_category_id") REFERENCES "device_categories"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "device_models" ADD CONSTRAINT "device_models_product_family_id_fkey" FOREIGN KEY ("product_family_id") REFERENCES "product_families"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "device_models" ADD CONSTRAINT "device_models_release_status_id_fkey" FOREIGN KEY ("release_status_id") REFERENCES "release_statuses"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "device_variants" ADD CONSTRAINT "device_variants_device_model_id_fkey" FOREIGN KEY ("device_model_id") REFERENCES "device_models"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "device_variants" ADD CONSTRAINT "device_variants_release_status_id_fkey" FOREIGN KEY ("release_status_id") REFERENCES "release_statuses"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "chipsets" ADD CONSTRAINT "chipsets_manufacturer_org_id_fkey" FOREIGN KEY ("manufacturer_org_id") REFERENCES "organizations"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "search_logs" ADD CONSTRAINT "search_logs_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "raw_pages" ADD CONSTRAINT "raw_pages_source_id_fkey" FOREIGN KEY ("source_id") REFERENCES "data_sources"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "raw_pages" ADD CONSTRAINT "raw_pages_device_model_id_fkey" FOREIGN KEY ("device_model_id") REFERENCES "device_models"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "affiliate_links" ADD CONSTRAINT "affiliate_links_partner_id_fkey" FOREIGN KEY ("partner_id") REFERENCES "affiliate_partners"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "affiliate_links" ADD CONSTRAINT "affiliate_links_device_variant_id_fkey" FOREIGN KEY ("device_variant_id") REFERENCES "device_variants"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "subscriptions" ADD CONSTRAINT "subscriptions_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "subscriptions" ADD CONSTRAINT "subscriptions_plan_id_fkey" FOREIGN KEY ("plan_id") REFERENCES "subscription_plans"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "wishlists" ADD CONSTRAINT "wishlists_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "price_alerts" ADD CONSTRAINT "price_alerts_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
