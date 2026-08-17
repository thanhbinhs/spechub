-- Scorecard v3: raw metrics -> category module scores -> overall score.
CREATE TABLE "variant_scorecards" (
    "id" UUID NOT NULL,
    "device_variant_id" UUID NOT NULL,
    "category_slug" VARCHAR(80) NOT NULL,
    "score_version" VARCHAR(80) NOT NULL,
    "overall_score" DECIMAL(5,2) NOT NULL,
    "coverage_percent" DECIMAL(5,2) NOT NULL,
    "score_source" VARCHAR(40) NOT NULL,
    "raw_metric_count" INTEGER NOT NULL DEFAULT 0,
    "rationale" TEXT,
    "factors" JSONB,
    "calculated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "variant_scorecards_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "variant_scorecard_modules" (
    "id" UUID NOT NULL,
    "scorecard_id" UUID NOT NULL,
    "module_key" VARCHAR(60) NOT NULL,
    "module_name" VARCHAR(120) NOT NULL,
    "score" DECIMAL(5,2) NOT NULL,
    "weight_percent" DECIMAL(5,2) NOT NULL,
    "coverage_percent" DECIMAL(5,2) NOT NULL,
    "rationale" TEXT,
    "raw_metrics" JSONB,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "variant_scorecard_modules_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "variant_scorecards_device_variant_id_score_version_key"
ON "variant_scorecards"("device_variant_id", "score_version");

CREATE INDEX "variant_scorecards_category_slug_overall_score_idx"
ON "variant_scorecards"("category_slug", "overall_score");

CREATE INDEX "variant_scorecards_device_variant_id_calculated_at_idx"
ON "variant_scorecards"("device_variant_id", "calculated_at");

CREATE UNIQUE INDEX "variant_scorecard_modules_scorecard_id_module_key_key"
ON "variant_scorecard_modules"("scorecard_id", "module_key");

CREATE INDEX "variant_scorecard_modules_module_key_score_idx"
ON "variant_scorecard_modules"("module_key", "score");

ALTER TABLE "variant_scorecards"
ADD CONSTRAINT "variant_scorecards_device_variant_id_fkey"
FOREIGN KEY ("device_variant_id") REFERENCES "device_variants"("id")
ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "variant_scorecard_modules"
ADD CONSTRAINT "variant_scorecard_modules_scorecard_id_fkey"
FOREIGN KEY ("scorecard_id") REFERENCES "variant_scorecards"("id")
ON DELETE CASCADE ON UPDATE CASCADE;
