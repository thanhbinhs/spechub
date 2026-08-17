CREATE TABLE "variant_module_scores" (
  "id" UUID NOT NULL,
  "device_variant_id" UUID NOT NULL,
  "module_kind" VARCHAR(40) NOT NULL,
  "module_id" UUID NOT NULL,
  "score" DECIMAL(5, 2) NOT NULL,
  "score_source" VARCHAR(40) NOT NULL,
  "score_version" VARCHAR(80) NOT NULL,
  "rationale" TEXT,
  "factors" JSONB,
  "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "variant_module_scores_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "variant_module_scores_score_check"
    CHECK ("score" >= 0 AND "score" <= 100)
);

CREATE UNIQUE INDEX "variant_module_scores_device_variant_id_module_kind_module_id_key"
  ON "variant_module_scores"("device_variant_id", "module_kind", "module_id");

CREATE INDEX "variant_module_scores_module_kind_module_id_idx"
  ON "variant_module_scores"("module_kind", "module_id");

CREATE INDEX "variant_module_scores_device_variant_id_idx"
  ON "variant_module_scores"("device_variant_id");

ALTER TABLE "variant_module_scores"
  ADD CONSTRAINT "variant_module_scores_device_variant_id_fkey"
  FOREIGN KEY ("device_variant_id") REFERENCES "device_variants"("id")
  ON DELETE CASCADE ON UPDATE CASCADE;
