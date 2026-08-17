CREATE TABLE "module_field_coverage" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "module_kind" VARCHAR(40) NOT NULL,
    "module_id" UUID NOT NULL,
    "field_key" VARCHAR(100) NOT NULL,
    "status" VARCHAR(30) NOT NULL,
    "source_url" TEXT,
    "notes" TEXT,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "module_field_coverage_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "module_field_coverage_module_kind_module_id_field_key_key"
ON "module_field_coverage"("module_kind", "module_id", "field_key");

CREATE INDEX "module_field_coverage_module_kind_module_id_idx"
ON "module_field_coverage"("module_kind", "module_id");

CREATE INDEX "module_field_coverage_status_idx"
ON "module_field_coverage"("status");
