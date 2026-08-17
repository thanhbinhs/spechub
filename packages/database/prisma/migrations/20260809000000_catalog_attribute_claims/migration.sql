CREATE TABLE "catalog_attribute_claims" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "catalog_draft_id" UUID,
    "entity_table" VARCHAR(80),
    "entity_id" UUID,
    "field_path" VARCHAR(180) NOT NULL,
    "value_json" JSONB NOT NULL,
    "display_value" VARCHAR(1000),
    "claim_kind" VARCHAR(30) NOT NULL,
    "source_id" UUID NOT NULL,
    "citation_id" UUID,
    "scope_region" VARCHAR(20),
    "scope_sku" VARCHAR(100),
    "methodology" TEXT,
    "tested_at" DATE,
    "retrieved_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "evidence_excerpt" TEXT,
    "confidence" DECIMAL(3,2),
    "status" VARCHAR(20) NOT NULL DEFAULT 'candidate',
    "resolution_note" VARCHAR(1000),
    "created_by_user_id" UUID,
    "reviewed_by_user_id" UUID,
    "reviewed_at" TIMESTAMPTZ(6),
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "catalog_attribute_claims_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "catalog_attribute_claims_catalog_draft_id_field_path_status_idx"
ON "catalog_attribute_claims"("catalog_draft_id", "field_path", "status");

CREATE INDEX "catalog_attribute_claims_entity_table_entity_id_field_path_status_idx"
ON "catalog_attribute_claims"("entity_table", "entity_id", "field_path", "status");

CREATE INDEX "catalog_attribute_claims_status_created_at_idx"
ON "catalog_attribute_claims"("status", "created_at");

CREATE INDEX "catalog_attribute_claims_source_id_retrieved_at_idx"
ON "catalog_attribute_claims"("source_id", "retrieved_at");

ALTER TABLE "catalog_attribute_claims"
ADD CONSTRAINT "catalog_attribute_claims_catalog_draft_id_fkey"
FOREIGN KEY ("catalog_draft_id") REFERENCES "catalog_drafts"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "catalog_attribute_claims"
ADD CONSTRAINT "catalog_attribute_claims_source_id_fkey"
FOREIGN KEY ("source_id") REFERENCES "sources"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "catalog_attribute_claims"
ADD CONSTRAINT "catalog_attribute_claims_citation_id_fkey"
FOREIGN KEY ("citation_id") REFERENCES "citations"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "catalog_attribute_claims"
ADD CONSTRAINT "catalog_attribute_claims_created_by_user_id_fkey"
FOREIGN KEY ("created_by_user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "catalog_attribute_claims"
ADD CONSTRAINT "catalog_attribute_claims_reviewed_by_user_id_fkey"
FOREIGN KEY ("reviewed_by_user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
