CREATE TABLE "variant_score_metric_inputs" (
    "id" UUID NOT NULL,
    "device_variant_id" UUID NOT NULL,
    "metric_key" VARCHAR(80) NOT NULL,
    "raw_value" DECIMAL(14,4) NOT NULL,
    "unit" VARCHAR(40),
    "normalized_score" DECIMAL(5,2),
    "source_label" VARCHAR(240),
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "variant_score_metric_inputs_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "variant_score_metric_inputs_device_variant_id_metric_key_key"
ON "variant_score_metric_inputs"("device_variant_id", "metric_key");

CREATE INDEX "variant_score_metric_inputs_metric_key_idx"
ON "variant_score_metric_inputs"("metric_key");

ALTER TABLE "variant_score_metric_inputs"
ADD CONSTRAINT "variant_score_metric_inputs_device_variant_id_fkey"
FOREIGN KEY ("device_variant_id") REFERENCES "device_variants"("id")
ON DELETE CASCADE ON UPDATE CASCADE;
