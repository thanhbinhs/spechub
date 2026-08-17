ALTER TABLE "cpus"
ADD COLUMN "image_url" TEXT,
ADD COLUMN "image_source_url" TEXT;

ALTER TABLE "gpus"
ADD COLUMN "image_url" TEXT,
ADD COLUMN "image_source_url" TEXT;

ALTER TABLE "npus"
ADD COLUMN "image_url" TEXT,
ADD COLUMN "image_source_url" TEXT;

ALTER TABLE "modems"
ADD COLUMN "image_url" TEXT,
ADD COLUMN "image_source_url" TEXT;

ALTER TABLE "memory_standards"
ADD COLUMN "image_url" TEXT,
ADD COLUMN "image_source_url" TEXT;

ALTER TABLE "storage_standards"
ADD COLUMN "image_url" TEXT,
ADD COLUMN "image_source_url" TEXT;

ALTER TABLE "wireless_standards"
ADD COLUMN "image_url" TEXT,
ADD COLUMN "image_source_url" TEXT;

ALTER TABLE "port_standards"
ADD COLUMN "image_url" TEXT,
ADD COLUMN "image_source_url" TEXT;

ALTER TABLE "operating_systems"
ADD COLUMN "image_url" TEXT,
ADD COLUMN "image_source_url" TEXT;

ALTER TABLE "hardware_sensors"
ADD COLUMN "image_url" TEXT,
ADD COLUMN "image_source_url" TEXT;
