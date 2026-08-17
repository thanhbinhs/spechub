ALTER TABLE "organizations"
  ADD CONSTRAINT "organizations_description_quality_check"
  CHECK (CHAR_LENGTH(BTRIM("description")) >= 80);

ALTER TABLE "product_families"
  ADD CONSTRAINT "product_families_description_quality_check"
  CHECK (CHAR_LENGTH(BTRIM("description")) >= 80);

ALTER TABLE "device_models"
  ADD CONSTRAINT "device_models_summary_quality_check"
  CHECK (
    CHAR_LENGTH(BTRIM("summary")) BETWEEN 80 AND 600
  ),
  ADD CONSTRAINT "device_models_description_quality_check"
  CHECK (CHAR_LENGTH(BTRIM("description")) >= 240);
