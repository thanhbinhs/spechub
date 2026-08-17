-- Qualcomm's Snapdragon 800 platform uses Krait 400 CPU cores,
-- Adreno 330 graphics, and the Gobi 9x25 LTE modem.
INSERT INTO "chipset_cpu_links" (
  "id",
  "chipset_id",
  "cpu_id",
  "is_primary"
)
SELECT
  gen_random_uuid(),
  "chipsets"."id",
  "cpus"."id",
  TRUE
FROM "chipsets"
JOIN "cpus" ON "cpus"."slug" = 'qualcomm-krait-400'
WHERE "chipsets"."slug" = 'qualcomm-snapdragon-800'
ON CONFLICT ("chipset_id", "cpu_id")
DO UPDATE SET "is_primary" = EXCLUDED."is_primary";

INSERT INTO "chipset_gpu_links" (
  "id",
  "chipset_id",
  "gpu_id",
  "is_primary"
)
SELECT
  gen_random_uuid(),
  "chipsets"."id",
  "gpus"."id",
  TRUE
FROM "chipsets"
JOIN "gpus" ON "gpus"."slug" = 'qualcomm-adreno-330'
WHERE "chipsets"."slug" = 'qualcomm-snapdragon-800'
ON CONFLICT ("chipset_id", "gpu_id")
DO UPDATE SET "is_primary" = EXCLUDED."is_primary";

INSERT INTO "chipset_modem_links" (
  "id",
  "chipset_id",
  "modem_id",
  "is_primary",
  "is_integrated"
)
SELECT
  gen_random_uuid(),
  "chipsets"."id",
  "modems"."id",
  TRUE,
  TRUE
FROM "chipsets"
JOIN "modems" ON "modems"."slug" = 'qualcomm-gobi-9x25-lte-modem'
WHERE "chipsets"."slug" = 'qualcomm-snapdragon-800'
ON CONFLICT ("chipset_id", "modem_id")
DO UPDATE SET
  "is_primary" = EXCLUDED."is_primary",
  "is_integrated" = EXCLUDED."is_integrated";
