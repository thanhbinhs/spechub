/*
  Warnings:

  - The primary key for the `currencies` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - You are about to drop the column `decimal_places` on the `currencies` table. All the data in the column will be lost.
  - You are about to alter the column `symbol` on the `currencies` table. The data in that column could be lost. The data in that column will be cast from `VarChar(10)` to `VarChar(8)`.
  - You are about to drop the column `currency_code` on the `device_variants` table. All the data in the column will be lost.
  - You are about to drop the column `embedding_json` on the `embeddings` table. All the data in the column will be lost.
  - You are about to alter the column `status` on the `raw_pages` table. The data in that column could be lost. The data in that column will be cast from `Text` to `VarChar(20)`.
  - You are about to alter the column `status` on the `subscriptions` table. The data in that column could be lost. The data in that column will be cast from `Text` to `VarChar(30)`.
  - You are about to drop the column `email_verified` on the `users` table. All the data in the column will be lost.
  - You are about to drop the column `name` on the `users` table. All the data in the column will be lost.
  - You are about to alter the column `email` on the `users` table. The data in that column could be lost. The data in that column will be cast from `VarChar(255)` to `VarChar(200)`.
  - A unique constraint covering the columns `[code]` on the table `currencies` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[slug]` on the table `data_sources` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[stripe_customer_id]` on the table `subscriptions` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[stripe_sub_id]` on the table `subscriptions` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `chip_kind` to the `chipsets` table without a default value. This is not possible if the table is not empty.
  - Added the required column `updated_at` to the `chipsets` table without a default value. This is not possible if the table is not empty.
  - Added the required column `slug` to the `data_sources` table without a default value. This is not possible if the table is not empty.
  - Added the required column `updated_at` to the `data_sources` table without a default value. This is not possible if the table is not empty.
  - Added the required column `updated_at` to the `device_categories` table without a default value. This is not possible if the table is not empty.
  - Added the required column `embedding` to the `embeddings` table without a default value. This is not possible if the table is not empty.
  - Added the required column `region_code` to the `price_alerts` table without a default value. This is not possible if the table is not empty.
  - Added the required column `updated_at` to the `subscriptions` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "affiliate_links" ADD COLUMN     "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

-- AlterTable
ALTER TABLE "affiliate_partners" ADD COLUMN     "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

-- AlterTable
ALTER TABLE "chipsets" ADD COLUMN     "announcement_date" DATE,
ADD COLUMN     "chip_kind" VARCHAR(30) NOT NULL,
ADD COLUMN     "deleted_at" TIMESTAMPTZ(6),
ADD COLUMN     "integrated_5g" BOOLEAN,
ADD COLUMN     "integrated_wifi" BOOLEAN,
ADD COLUMN     "max_camera_mp" INTEGER,
ADD COLUMN     "max_display_resolution" VARCHAR(40),
ADD COLUMN     "max_ram_gb" INTEGER,
ADD COLUMN     "model_code" VARCHAR(100),
ADD COLUMN     "process_node_id" UUID,
ADD COLUMN     "release_date" DATE,
ADD COLUMN     "supports_64bit" BOOLEAN,
ADD COLUMN     "technology_family_id" UUID,
ADD COLUMN     "updated_at" TIMESTAMPTZ(6) NOT NULL;

-- AlterTable
ALTER TABLE "currencies" DROP CONSTRAINT "currencies_pkey",
DROP COLUMN "decimal_places",
ADD COLUMN     "decimal_digits" INTEGER NOT NULL DEFAULT 2,
ADD COLUMN     "id" SERIAL NOT NULL,
ALTER COLUMN "symbol" DROP NOT NULL,
ALTER COLUMN "symbol" SET DATA TYPE VARCHAR(8),
ADD CONSTRAINT "currencies_pkey" PRIMARY KEY ("id");

-- AlterTable
ALTER TABLE "data_sources" ADD COLUMN     "slug" VARCHAR(120) NOT NULL,
ADD COLUMN     "updated_at" TIMESTAMP(3) NOT NULL;

-- AlterTable
ALTER TABLE "device_categories" ADD COLUMN     "deleted_at" TIMESTAMPTZ(6),
ADD COLUMN     "updated_at" TIMESTAMPTZ(6) NOT NULL;

-- AlterTable
ALTER TABLE "device_models" ADD COLUMN     "end_of_sale_date" DATE,
ADD COLUMN     "end_of_support_date" DATE,
ADD COLUMN     "generation_label" VARCHAR(40),
ALTER COLUMN "view_count" SET DATA TYPE BIGINT;

-- AlterTable
ALTER TABLE "device_variants" DROP COLUMN "currency_code",
ADD COLUMN     "color_hex" VARCHAR(7),
ADD COLUMN     "currency_id" INTEGER,
ADD COLUMN     "deleted_at" TIMESTAMPTZ(6),
ADD COLUMN     "end_of_sale_date" DATE,
ADD COLUMN     "market_name" VARCHAR(160),
ADD COLUMN     "notes" TEXT;

-- AlterTable
ALTER TABLE "embeddings" DROP COLUMN "embedding_json",
ADD COLUMN     "embedding" vector(1536) NOT NULL,
ALTER COLUMN "entity_id" SET DATA TYPE VARCHAR(64);

-- AlterTable
ALTER TABLE "organizations" ADD COLUMN     "legal_name" VARCHAR(200);

-- AlterTable
ALTER TABLE "price_alerts" ADD COLUMN     "region_code" VARCHAR(2) NOT NULL;

-- AlterTable
ALTER TABLE "product_families" ADD COLUMN     "deleted_at" TIMESTAMPTZ(6),
ADD COLUMN     "last_release_year" INTEGER;

-- AlterTable
ALTER TABLE "raw_pages" ADD COLUMN     "attempts" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "error_message" TEXT,
ALTER COLUMN "status" SET DATA TYPE VARCHAR(20);

-- AlterTable
ALTER TABLE "search_logs" ADD COLUMN     "clicked_id" UUID,
ADD COLUMN     "clicked_type" VARCHAR(50),
ADD COLUMN     "ip_address" INET,
ADD COLUMN     "user_agent" TEXT;

-- AlterTable
ALTER TABLE "subscription_plans" ADD COLUMN     "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "description" TEXT;

-- AlterTable
ALTER TABLE "subscriptions" ADD COLUMN     "cancel_at_period_end" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "stripe_customer_id" TEXT,
ADD COLUMN     "stripe_sub_id" TEXT,
ADD COLUMN     "updated_at" TIMESTAMP(3) NOT NULL,
ALTER COLUMN "status" SET DATA TYPE VARCHAR(30);

-- AlterTable
ALTER TABLE "users" DROP COLUMN "email_verified",
DROP COLUMN "name",
ADD COLUMN     "display_name" VARCHAR(120),
ADD COLUMN     "email_verified_at" TIMESTAMP(3),
ALTER COLUMN "email" SET DATA TYPE VARCHAR(200),
ALTER COLUMN "role" SET DATA TYPE VARCHAR(30),
ALTER COLUMN "deleted_at" SET DATA TYPE TIMESTAMPTZ(6);

-- CreateTable
CREATE TABLE "languages" (
    "id" SERIAL NOT NULL,
    "code" VARCHAR(10) NOT NULL,
    "name" VARCHAR(60) NOT NULL,
    "is_default" BOOLEAN NOT NULL DEFAULT false,
    "is_active" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "languages_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "translations" (
    "id" UUID NOT NULL,
    "entity_table" VARCHAR(80) NOT NULL,
    "entity_id" VARCHAR(64) NOT NULL,
    "field_key" VARCHAR(60) NOT NULL,
    "language_id" INTEGER NOT NULL,
    "value_text" TEXT NOT NULL,

    CONSTRAINT "translations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sources" (
    "id" UUID NOT NULL,
    "name" VARCHAR(160) NOT NULL,
    "slug" VARCHAR(180) NOT NULL,
    "source_type" VARCHAR(40) NOT NULL,
    "base_url" TEXT,
    "trust_level" INTEGER NOT NULL DEFAULT 3,
    "description" TEXT,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "sources_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "citations" (
    "id" UUID NOT NULL,
    "source_id" UUID NOT NULL,
    "url" TEXT,
    "title" VARCHAR(300),
    "author" VARCHAR(200),
    "published_at" DATE,
    "retrieved_at" DATE,
    "excerpt" TEXT,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "citations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "media_assets" (
    "id" UUID NOT NULL,
    "asset_type" VARCHAR(30) NOT NULL,
    "url" TEXT NOT NULL,
    "cdn_url" TEXT,
    "mime_type" VARCHAR(80),
    "width_px" INTEGER,
    "height_px" INTEGER,
    "file_size_bytes" BIGINT,
    "alt_text" TEXT,
    "caption" TEXT,
    "copyright_holder" VARCHAR(200),
    "license" VARCHAR(80),
    "source_id" UUID,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "media_assets_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "entity_media" (
    "id" UUID NOT NULL,
    "entity_table" VARCHAR(80) NOT NULL,
    "entity_id" VARCHAR(64) NOT NULL,
    "media_asset_id" UUID NOT NULL,
    "role" VARCHAR(40) NOT NULL,
    "display_order" INTEGER NOT NULL DEFAULT 0,
    "is_primary" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "entity_media_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tags" (
    "id" UUID NOT NULL,
    "name" VARCHAR(80) NOT NULL,
    "slug" VARCHAR(100) NOT NULL,
    "tag_group" VARCHAR(40),
    "description" TEXT,

    CONSTRAINT "tags_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "entity_tags" (
    "id" UUID NOT NULL,
    "entity_table" VARCHAR(80) NOT NULL,
    "entity_id" VARCHAR(64) NOT NULL,
    "tag_id" UUID NOT NULL,

    CONSTRAINT "entity_tags_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "units" (
    "id" UUID NOT NULL,
    "symbol" VARCHAR(20) NOT NULL,
    "name" VARCHAR(60) NOT NULL,
    "quantity_type" VARCHAR(40) NOT NULL,
    "base_unit_id" UUID,
    "conversion_factor" DECIMAL(20,10),

    CONSTRAINT "units_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "organization_roles" (
    "id" SERIAL NOT NULL,
    "code" VARCHAR(50) NOT NULL,
    "name" VARCHAR(100) NOT NULL,

    CONSTRAINT "organization_roles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "organization_role_assignments" (
    "id" UUID NOT NULL,
    "organization_id" UUID NOT NULL,
    "role_id" INTEGER NOT NULL,
    "start_year" INTEGER,
    "end_year" INTEGER,
    "notes" TEXT,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "organization_role_assignments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "regions" (
    "id" UUID NOT NULL,
    "code" VARCHAR(20) NOT NULL,
    "name" VARCHAR(120) NOT NULL,
    "description" TEXT,

    CONSTRAINT "regions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "variant_price_history" (
    "id" UUID NOT NULL,
    "device_variant_id" UUID NOT NULL,
    "region_id" UUID,
    "price_type" VARCHAR(30) NOT NULL,
    "price" DECIMAL(12,2) NOT NULL,
    "currency_id" INTEGER NOT NULL,
    "effective_date" DATE NOT NULL,
    "source_id" UUID,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "variant_price_history_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "variant_physical_specs" (
    "device_variant_id" UUID NOT NULL,
    "height_mm" DECIMAL(7,2),
    "width_mm" DECIMAL(7,2),
    "thickness_mm" DECIMAL(7,2),
    "thickness_min_mm" DECIMAL(7,2),
    "thickness_max_mm" DECIMAL(7,2),
    "weight_g" DECIMAL(7,2),
    "volume_cm3" DECIMAL(8,2),
    "frame_material" VARCHAR(120),
    "back_material" VARCHAR(120),
    "front_glass" VARCHAR(120),
    "ingress_protection" VARCHAR(40),
    "notes" TEXT,

    CONSTRAINT "variant_physical_specs_pkey" PRIMARY KEY ("device_variant_id")
);

-- CreateTable
CREATE TABLE "variant_io_specs" (
    "device_variant_id" UUID NOT NULL,
    "sim_slots" INTEGER,
    "sim_type" VARCHAR(40),
    "esim_supported" BOOLEAN,
    "esim_count" INTEGER,
    "stereo_speakers" BOOLEAN,
    "speaker_count" INTEGER,
    "audio_brand_tuning" VARCHAR(80),
    "headphone_jack" BOOLEAN,
    "headphone_jack_size_mm" DECIMAL(3,1),
    "has_microsd_slot" BOOLEAN,
    "microsd_max_capacity_gb" INTEGER,
    "has_ir_blaster" BOOLEAN,
    "has_notification_led" BOOLEAN,
    "notes" TEXT,

    CONSTRAINT "variant_io_specs_pkey" PRIMARY KEY ("device_variant_id")
);

-- CreateTable
CREATE TABLE "variant_thermal_specs" (
    "device_variant_id" UUID NOT NULL,
    "cooling_type" VARCHAR(80),
    "vc_area_mm2" INTEGER,
    "has_active_cooling" BOOLEAN,
    "notes" TEXT,

    CONSTRAINT "variant_thermal_specs_pkey" PRIMARY KEY ("device_variant_id")
);

-- CreateTable
CREATE TABLE "model_lineage" (
    "id" UUID NOT NULL,
    "predecessor_model_id" UUID NOT NULL,
    "successor_model_id" UUID NOT NULL,
    "relation_type" VARCHAR(30) NOT NULL DEFAULT 'successor',
    "relation_note" TEXT,

    CONSTRAINT "model_lineage_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "model_similarity" (
    "id" UUID NOT NULL,
    "model_a_id" UUID NOT NULL,
    "model_b_id" UUID NOT NULL,
    "similarity_score" DECIMAL(5,2) NOT NULL,
    "chipset_score" DECIMAL(5,2),
    "camera_score" DECIMAL(5,2),
    "display_score" DECIMAL(5,2),
    "battery_score" DECIMAL(5,2),
    "memory_storage_score" DECIMAL(5,2),
    "design_score" DECIMAL(5,2),
    "software_score" DECIMAL(5,2),
    "reason" TEXT,
    "computed_at" TIMESTAMP(3),

    CONSTRAINT "model_similarity_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "technology_families" (
    "id" UUID NOT NULL,
    "name" VARCHAR(120) NOT NULL,
    "slug" VARCHAR(140) NOT NULL,
    "family_type" VARCHAR(50) NOT NULL,
    "parent_family_id" UUID,
    "vendor_org_id" UUID,
    "description" TEXT,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "technology_families_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "architectures" (
    "id" UUID NOT NULL,
    "name" VARCHAR(120) NOT NULL,
    "slug" VARCHAR(140) NOT NULL,
    "architecture_type" VARCHAR(40) NOT NULL,
    "vendor_org_id" UUID,
    "release_year" INTEGER,
    "description" TEXT,

    CONSTRAINT "architectures_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "process_nodes" (
    "id" UUID NOT NULL,
    "name" VARCHAR(80) NOT NULL,
    "slug" VARCHAR(120) NOT NULL,
    "marketing_name" VARCHAR(50),
    "node_nm" DECIMAL(4,1),
    "foundry_org_id" UUID NOT NULL,
    "generation" VARCHAR(50),
    "transistor_density_million_per_mm2" INTEGER,
    "power_efficiency_improvement_percent" DECIMAL(5,2),
    "performance_improvement_percent" DECIMAL(5,2),
    "release_year" INTEGER,
    "description" TEXT,

    CONSTRAINT "process_nodes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "camera_roles" (
    "id" UUID NOT NULL,
    "code" VARCHAR(40) NOT NULL,
    "name" VARCHAR(60) NOT NULL,
    "description" TEXT,

    CONSTRAINT "camera_roles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "display_technologies" (
    "id" UUID NOT NULL,
    "name" VARCHAR(80) NOT NULL,
    "slug" VARCHAR(100) NOT NULL,
    "parent_tech_id" UUID,
    "description" TEXT,

    CONSTRAINT "display_technologies_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "battery_chemistries" (
    "id" UUID NOT NULL,
    "name" VARCHAR(80) NOT NULL,
    "slug" VARCHAR(100) NOT NULL,
    "description" TEXT,

    CONSTRAINT "battery_chemistries_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "network_generations" (
    "id" UUID NOT NULL,
    "name" VARCHAR(30) NOT NULL,
    "slug" VARCHAR(50) NOT NULL,
    "generation_type" VARCHAR(30) NOT NULL,
    "release_year" INTEGER,
    "description" TEXT,

    CONSTRAINT "network_generations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "cpus" (
    "id" UUID NOT NULL,
    "manufacturer_org_id" UUID,
    "architecture_id" UUID,
    "technology_family_id" UUID,
    "name" VARCHAR(160) NOT NULL,
    "slug" VARCHAR(180) NOT NULL,
    "core_count" INTEGER,
    "thread_count" INTEGER,
    "big_little" BOOLEAN,
    "isa_name" VARCHAR(80),
    "description" TEXT,

    CONSTRAINT "cpus_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "cpu_clusters" (
    "id" UUID NOT NULL,
    "cpu_id" UUID NOT NULL,
    "cluster_name" VARCHAR(120),
    "core_microarchitecture" VARCHAR(120),
    "core_count" INTEGER NOT NULL,
    "clock_ghz" DECIMAL(4,2),
    "l1_cache_kb" INTEGER,
    "l2_cache_kb" INTEGER,
    "cluster_order" INTEGER,

    CONSTRAINT "cpu_clusters_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "gpus" (
    "id" UUID NOT NULL,
    "manufacturer_org_id" UUID,
    "architecture_id" UUID,
    "technology_family_id" UUID,
    "name" VARCHAR(160) NOT NULL,
    "slug" VARCHAR(180) NOT NULL,
    "shader_units" INTEGER,
    "compute_units" INTEGER,
    "clock_mhz" INTEGER,
    "fp32_gflops" DECIMAL(10,2),
    "ray_tracing_support" BOOLEAN,
    "api_support" VARCHAR(200),
    "description" TEXT,

    CONSTRAINT "gpus_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "npus" (
    "id" UUID NOT NULL,
    "manufacturer_org_id" UUID,
    "architecture_id" UUID,
    "technology_family_id" UUID,
    "name" VARCHAR(160) NOT NULL,
    "slug" VARCHAR(180) NOT NULL,
    "tops" DECIMAL(8,2),
    "tops_int4" DECIMAL(8,2),
    "tops_fp16" DECIMAL(8,2),
    "description" TEXT,

    CONSTRAINT "npus_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "modems" (
    "id" UUID NOT NULL,
    "manufacturer_org_id" UUID,
    "technology_family_id" UUID,
    "name" VARCHAR(160) NOT NULL,
    "slug" VARCHAR(180) NOT NULL,
    "max_downlink_mbps" INTEGER,
    "max_uplink_mbps" INTEGER,
    "supports_mmwave" BOOLEAN,
    "supports_satellite" BOOLEAN,
    "supported_5g_modes" VARCHAR(80),
    "description" TEXT,

    CONSTRAINT "modems_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "camera_sensors" (
    "id" UUID NOT NULL,
    "manufacturer_org_id" UUID NOT NULL,
    "technology_family_id" UUID,
    "name" VARCHAR(160) NOT NULL,
    "slug" VARCHAR(180) NOT NULL,
    "sensor_format" VARCHAR(40),
    "optical_format" VARCHAR(40),
    "resolution_mp" DECIMAL(6,2),
    "pixel_size_um" DECIMAL(5,2),
    "sensor_type" VARCHAR(80),
    "supports_stacked" BOOLEAN,
    "supports_dual_pixel" BOOLEAN,
    "supports_quad_pixel" BOOLEAN,
    "supports_hdr" BOOLEAN,
    "iso_range" VARCHAR(100),
    "max_video_resolution" VARCHAR(40),
    "max_video_fps" INTEGER,
    "release_year" INTEGER,
    "description" TEXT,

    CONSTRAINT "camera_sensors_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "camera_modules" (
    "id" UUID NOT NULL,
    "manufacturer_org_id" UUID,
    "camera_role_id" UUID NOT NULL,
    "name" VARCHAR(160),
    "slug" VARCHAR(180),
    "effective_megapixel" DECIMAL(6,2),
    "aperture" VARCHAR(20),
    "focal_length_mm_eq" DECIMAL(5,1),
    "focal_length_mm_native" DECIMAL(5,2),
    "optical_zoom" DECIMAL(4,2),
    "digital_zoom_max" DECIMAL(4,2),
    "has_ois" BOOLEAN,
    "ois_type" VARCHAR(40),
    "has_af" BOOLEAN,
    "af_system" VARCHAR(80),
    "field_of_view_deg" DECIMAL(5,2),
    "video_capabilities" TEXT,
    "has_macro" BOOLEAN,
    "description" TEXT,

    CONSTRAINT "camera_modules_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "display_units" (
    "id" UUID NOT NULL,
    "manufacturer_org_id" UUID,
    "display_technology_id" UUID NOT NULL,
    "name" VARCHAR(160),
    "slug" VARCHAR(180),
    "size_inch" DECIMAL(4,2),
    "aspect_ratio" VARCHAR(20),
    "resolution_width" INTEGER,
    "resolution_height" INTEGER,
    "pixel_density_ppi" INTEGER,
    "refresh_rate_hz" INTEGER,
    "refresh_rate_min_hz" INTEGER,
    "touch_sampling_hz" INTEGER,
    "brightness_typical_nits" INTEGER,
    "brightness_hbm_nits" INTEGER,
    "brightness_peak_nits" INTEGER,
    "contrast_ratio" VARCHAR(40),
    "color_depth_bits" INTEGER,
    "color_gamut" VARCHAR(80),
    "hdr_formats" VARCHAR(120),
    "protection_glass" VARCHAR(120),
    "has_always_on" BOOLEAN,
    "has_dc_dimming" BOOLEAN,
    "pwm_frequency_hz" INTEGER,
    "description" TEXT,

    CONSTRAINT "display_units_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "battery_units" (
    "id" UUID NOT NULL,
    "manufacturer_org_id" UUID,
    "battery_chemistry_id" UUID,
    "name" VARCHAR(160),
    "slug" VARCHAR(180),
    "capacity_mah" INTEGER NOT NULL,
    "rated_capacity_mah" INTEGER,
    "energy_wh" DECIMAL(7,2),
    "voltage_nominal_v" DECIMAL(4,2),
    "cell_count" INTEGER,
    "cycle_life" INTEGER,
    "wired_charging_w" INTEGER,
    "wired_charging_protocol" VARCHAR(120),
    "wireless_charging_w" INTEGER,
    "wireless_charging_protocol" VARCHAR(120),
    "reverse_wired_charging_w" INTEGER,
    "reverse_wireless_charging_w" INTEGER,
    "removable" BOOLEAN NOT NULL DEFAULT false,
    "description" TEXT,

    CONSTRAINT "battery_units_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "memory_standards" (
    "id" UUID NOT NULL,
    "organization_id" UUID,
    "technology_family_id" UUID,
    "name" VARCHAR(80) NOT NULL,
    "slug" VARCHAR(100) NOT NULL,
    "memory_type" VARCHAR(40),
    "generation" VARCHAR(40),
    "max_data_rate_mtps" INTEGER,
    "typical_data_rate_mtps" INTEGER,
    "voltage" DECIMAL(4,2),
    "bandwidth_gbps" DECIMAL(6,2),
    "channel_width_bits" INTEGER,
    "is_mobile" BOOLEAN DEFAULT true,
    "release_year" INTEGER,
    "description" TEXT,

    CONSTRAINT "memory_standards_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "storage_standards" (
    "id" UUID NOT NULL,
    "organization_id" UUID,
    "technology_family_id" UUID,
    "name" VARCHAR(80) NOT NULL,
    "slug" VARCHAR(100) NOT NULL,
    "storage_type" VARCHAR(40),
    "generation" VARCHAR(40),
    "sequential_read_mbps" INTEGER,
    "sequential_write_mbps" INTEGER,
    "random_read_iops" INTEGER,
    "random_write_iops" INTEGER,
    "release_year" INTEGER,
    "description" TEXT,

    CONSTRAINT "storage_standards_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "wireless_standards" (
    "id" UUID NOT NULL,
    "organization_id" UUID,
    "network_generation_id" UUID,
    "name" VARCHAR(100) NOT NULL,
    "slug" VARCHAR(120) NOT NULL,
    "wireless_type" VARCHAR(40) NOT NULL,
    "max_speed_mbps" INTEGER,
    "description" TEXT,

    CONSTRAINT "wireless_standards_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "port_standards" (
    "id" UUID NOT NULL,
    "organization_id" UUID,
    "name" VARCHAR(100) NOT NULL,
    "slug" VARCHAR(120) NOT NULL,
    "port_type" VARCHAR(40) NOT NULL,
    "data_speed_gbps" DECIMAL(6,2),
    "power_delivery_w" INTEGER,
    "alt_modes" VARCHAR(120),
    "description" TEXT,

    CONSTRAINT "port_standards_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "operating_systems" (
    "id" UUID NOT NULL,
    "vendor_org_id" UUID,
    "name" VARCHAR(120) NOT NULL,
    "slug" VARCHAR(140) NOT NULL,
    "os_family" VARCHAR(60) NOT NULL,
    "kernel_type" VARCHAR(60),
    "is_open_source" BOOLEAN,
    "description" TEXT,

    CONSTRAINT "operating_systems_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "os_versions" (
    "id" UUID NOT NULL,
    "operating_system_id" UUID NOT NULL,
    "version_name" VARCHAR(40) NOT NULL,
    "codename" VARCHAR(50),
    "release_date" DATE,
    "end_of_support_date" DATE,
    "api_level" INTEGER,
    "kernel_version" VARCHAR(100),
    "is_lts" BOOLEAN,
    "notes" TEXT,

    CONSTRAINT "os_versions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "os_ui_layers" (
    "id" UUID NOT NULL,
    "name" VARCHAR(120) NOT NULL,
    "slug" VARCHAR(140) NOT NULL,
    "vendor_org_id" UUID,
    "base_os_id" UUID,
    "description" TEXT,

    CONSTRAINT "os_ui_layers_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "os_ui_layer_versions" (
    "id" UUID NOT NULL,
    "ui_layer_id" UUID NOT NULL,
    "version_name" VARCHAR(40) NOT NULL,
    "base_os_version_id" UUID,
    "release_date" DATE,
    "notes" TEXT,

    CONSTRAINT "os_ui_layer_versions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "hardware_sensors" (
    "id" UUID NOT NULL,
    "manufacturer_org_id" UUID,
    "name" VARCHAR(100) NOT NULL,
    "slug" VARCHAR(120) NOT NULL,
    "sensor_category" VARCHAR(60) NOT NULL,
    "description" TEXT,

    CONSTRAINT "hardware_sensors_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "cellular_bands" (
    "id" UUID NOT NULL,
    "network_generation_id" UUID NOT NULL,
    "name" VARCHAR(50) NOT NULL,
    "band_type" VARCHAR(20),
    "frequency_range" VARCHAR(80),
    "is_mmwave" BOOLEAN DEFAULT false,
    "description" TEXT,

    CONSTRAINT "cellular_bands_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "wifi_bands" (
    "id" UUID NOT NULL,
    "name" VARCHAR(40) NOT NULL,
    "frequency_range" VARCHAR(80),
    "description" TEXT,

    CONSTRAINT "wifi_bands_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "certifications" (
    "id" UUID NOT NULL,
    "name" VARCHAR(120) NOT NULL,
    "slug" VARCHAR(140) NOT NULL,
    "certification_type" VARCHAR(40) NOT NULL,
    "authority_org_id" UUID,
    "description" TEXT,

    CONSTRAINT "certifications_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "chipset_cpu_links" (
    "id" UUID NOT NULL,
    "chipset_id" UUID NOT NULL,
    "cpu_id" UUID NOT NULL,
    "is_primary" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "chipset_cpu_links_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "chipset_gpu_links" (
    "id" UUID NOT NULL,
    "chipset_id" UUID NOT NULL,
    "gpu_id" UUID NOT NULL,
    "is_primary" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "chipset_gpu_links_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "chipset_npu_links" (
    "id" UUID NOT NULL,
    "chipset_id" UUID NOT NULL,
    "npu_id" UUID NOT NULL,
    "is_primary" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "chipset_npu_links_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "chipset_modem_links" (
    "id" UUID NOT NULL,
    "chipset_id" UUID NOT NULL,
    "modem_id" UUID NOT NULL,
    "is_primary" BOOLEAN NOT NULL DEFAULT true,
    "is_integrated" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "chipset_modem_links_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "camera_module_sensor_links" (
    "id" UUID NOT NULL,
    "camera_module_id" UUID NOT NULL,
    "camera_sensor_id" UUID NOT NULL,
    "is_primary" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "camera_module_sensor_links_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "variant_chipsets" (
    "id" UUID NOT NULL,
    "device_variant_id" UUID NOT NULL,
    "chipset_id" UUID NOT NULL,
    "chip_role" VARCHAR(40) NOT NULL,
    "is_primary" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "variant_chipsets_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "variant_cpus" (
    "id" UUID NOT NULL,
    "device_variant_id" UUID NOT NULL,
    "cpu_id" UUID NOT NULL,
    "cpu_role" VARCHAR(40) NOT NULL,
    "is_primary" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "variant_cpus_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "variant_gpus" (
    "id" UUID NOT NULL,
    "device_variant_id" UUID NOT NULL,
    "gpu_id" UUID NOT NULL,
    "gpu_role" VARCHAR(40) NOT NULL,
    "is_primary" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "variant_gpus_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "variant_npus" (
    "id" UUID NOT NULL,
    "device_variant_id" UUID NOT NULL,
    "npu_id" UUID NOT NULL,
    "npu_role" VARCHAR(40) NOT NULL,
    "is_primary" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "variant_npus_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "variant_modems" (
    "id" UUID NOT NULL,
    "device_variant_id" UUID NOT NULL,
    "modem_id" UUID NOT NULL,
    "modem_role" VARCHAR(40) NOT NULL,
    "is_primary" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "variant_modems_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "variant_displays" (
    "id" UUID NOT NULL,
    "device_variant_id" UUID NOT NULL,
    "display_unit_id" UUID NOT NULL,
    "display_role" VARCHAR(40) NOT NULL,
    "display_order" INTEGER NOT NULL DEFAULT 1,

    CONSTRAINT "variant_displays_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "variant_batteries" (
    "id" UUID NOT NULL,
    "device_variant_id" UUID NOT NULL,
    "battery_unit_id" UUID NOT NULL,
    "battery_role" VARCHAR(40) NOT NULL,
    "is_primary" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "variant_batteries_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "variant_camera_systems" (
    "id" UUID NOT NULL,
    "device_variant_id" UUID NOT NULL,
    "position" VARCHAR(20) NOT NULL,
    "system_name" VARCHAR(120),
    "notes" TEXT,

    CONSTRAINT "variant_camera_systems_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "variant_camera_modules" (
    "id" UUID NOT NULL,
    "device_variant_id" UUID NOT NULL,
    "camera_system_id" UUID,
    "camera_module_id" UUID NOT NULL,
    "position" VARCHAR(20) NOT NULL,
    "role" VARCHAR(40) NOT NULL,
    "module_order" INTEGER NOT NULL DEFAULT 1,
    "is_primary" BOOLEAN DEFAULT false,
    "is_active" BOOLEAN DEFAULT true,
    "usage_type" VARCHAR(40),
    "notes" TEXT,

    CONSTRAINT "variant_camera_modules_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "variant_memory_configs" (
    "id" UUID NOT NULL,
    "device_variant_id" UUID NOT NULL,
    "memory_standard_id" UUID NOT NULL,
    "capacity_gb" INTEGER NOT NULL,
    "speed_mhz" INTEGER,
    "bandwidth_gbps" DECIMAL(6,2),
    "channel_count" INTEGER,
    "is_primary" BOOLEAN DEFAULT true,
    "notes" TEXT,

    CONSTRAINT "variant_memory_configs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "variant_storage_configs" (
    "id" UUID NOT NULL,
    "device_variant_id" UUID NOT NULL,
    "storage_standard_id" UUID NOT NULL,
    "total_capacity_gb" INTEGER NOT NULL,
    "module_count" INTEGER,
    "is_expandable" BOOLEAN NOT NULL DEFAULT false,
    "expansion_max_gb" INTEGER,

    CONSTRAINT "variant_storage_configs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "variant_ports" (
    "id" UUID NOT NULL,
    "device_variant_id" UUID NOT NULL,
    "port_standard_id" UUID NOT NULL,
    "port_count" INTEGER NOT NULL DEFAULT 1,
    "notes" TEXT,

    CONSTRAINT "variant_ports_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "variant_wireless_support" (
    "id" UUID NOT NULL,
    "device_variant_id" UUID NOT NULL,
    "wireless_standard_id" UUID NOT NULL,
    "notes" TEXT,

    CONSTRAINT "variant_wireless_support_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "variant_wifi_bands" (
    "id" UUID NOT NULL,
    "device_variant_id" UUID NOT NULL,
    "wifi_band_id" UUID NOT NULL,

    CONSTRAINT "variant_wifi_bands_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "variant_operating_systems" (
    "id" UUID NOT NULL,
    "device_variant_id" UUID NOT NULL,
    "os_version_id" UUID NOT NULL,
    "ui_layer_version_id" UUID,
    "is_default" BOOLEAN NOT NULL DEFAULT true,
    "is_upgradable_to" BOOLEAN NOT NULL DEFAULT false,
    "promised_major_updates" INTEGER,
    "promised_security_years" INTEGER,
    "notes" TEXT,

    CONSTRAINT "variant_operating_systems_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "variant_hardware_sensors" (
    "id" UUID NOT NULL,
    "device_variant_id" UUID NOT NULL,
    "hardware_sensor_id" UUID NOT NULL,
    "notes" TEXT,

    CONSTRAINT "variant_hardware_sensors_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "variant_cellular_band_support" (
    "id" UUID NOT NULL,
    "device_variant_id" UUID NOT NULL,
    "cellular_band_id" UUID NOT NULL,

    CONSTRAINT "variant_cellular_band_support_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "variant_certifications" (
    "id" UUID NOT NULL,
    "device_variant_id" UUID NOT NULL,
    "certification_id" UUID NOT NULL,
    "rating_value" VARCHAR(40),
    "certificate_number" VARCHAR(120),
    "issued_date" DATE,
    "source_id" UUID,

    CONSTRAINT "variant_certifications_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "variant_region_availability" (
    "id" UUID NOT NULL,
    "device_variant_id" UUID NOT NULL,
    "region_id" UUID NOT NULL,
    "launch_date" DATE,
    "end_of_sale_date" DATE,
    "availability_status" VARCHAR(30),

    CONSTRAINT "variant_region_availability_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "software_features" (
    "id" UUID NOT NULL,
    "code" VARCHAR(120) NOT NULL,
    "name" VARCHAR(160) NOT NULL,
    "feature_category" VARCHAR(40) NOT NULL,
    "vendor_org_id" UUID,
    "description" TEXT,

    CONSTRAINT "software_features_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "variant_software_features" (
    "id" UUID NOT NULL,
    "device_variant_id" UUID NOT NULL,
    "software_feature_id" UUID NOT NULL,
    "level_or_tier" VARCHAR(80),
    "notes" TEXT,

    CONSTRAINT "variant_software_features_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "feature_definitions" (
    "id" UUID NOT NULL,
    "code" VARCHAR(120) NOT NULL,
    "name" VARCHAR(160) NOT NULL,
    "value_type" VARCHAR(20) NOT NULL,
    "enum_values" TEXT,
    "device_category_id" UUID,
    "unit_id" UUID,
    "feature_group" VARCHAR(60),
    "description" TEXT,

    CONSTRAINT "feature_definitions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "device_variant_features" (
    "id" UUID NOT NULL,
    "device_variant_id" UUID NOT NULL,
    "feature_definition_id" UUID NOT NULL,
    "value_text" TEXT,
    "value_number" DECIMAL(20,6),
    "value_boolean" BOOLEAN,
    "value_date" DATE,
    "source_id" UUID,
    "citation_id" UUID,
    "note" TEXT,

    CONSTRAINT "device_variant_features_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "benchmarks" (
    "id" UUID NOT NULL,
    "name" VARCHAR(120) NOT NULL,
    "slug" VARCHAR(140) NOT NULL,
    "benchmark_type" VARCHAR(40) NOT NULL,
    "target_type" VARCHAR(30) NOT NULL,
    "vendor_org_id" UUID,
    "version" VARCHAR(40),
    "higher_is_better" BOOLEAN NOT NULL DEFAULT true,
    "unit_id" UUID,
    "description" TEXT,

    CONSTRAINT "benchmarks_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "benchmark_runs" (
    "id" UUID NOT NULL,
    "benchmark_id" UUID NOT NULL,
    "source_id" UUID,
    "citation_id" UUID,
    "tested_at" DATE,
    "test_environment_note" TEXT,
    "ambient_temp_c" DECIMAL(4,1),
    "os_version" VARCHAR(80),
    "app_version" VARCHAR(80),
    "driver_version" VARCHAR(80),
    "is_thermal_throttled" BOOLEAN,
    "power_mode" VARCHAR(40),

    CONSTRAINT "benchmark_runs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "device_variant_benchmarks" (
    "id" UUID NOT NULL,
    "benchmark_run_id" UUID,
    "benchmark_id" UUID NOT NULL,
    "device_variant_id" UUID NOT NULL,
    "score" DECIMAL(14,4) NOT NULL,
    "subscore_name" VARCHAR(80),
    "source_id" UUID,
    "tested_at" DATE,

    CONSTRAINT "device_variant_benchmarks_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "chipset_benchmarks" (
    "id" UUID NOT NULL,
    "benchmark_run_id" UUID,
    "benchmark_id" UUID NOT NULL,
    "chipset_id" UUID NOT NULL,
    "score" DECIMAL(14,4) NOT NULL,
    "subscore_name" VARCHAR(80),
    "source_id" UUID,
    "tested_at" DATE,

    CONSTRAINT "chipset_benchmarks_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "cpu_benchmarks" (
    "id" UUID NOT NULL,
    "benchmark_run_id" UUID,
    "benchmark_id" UUID NOT NULL,
    "cpu_id" UUID NOT NULL,
    "score" DECIMAL(14,4) NOT NULL,
    "subscore_name" VARCHAR(80),
    "source_id" UUID,
    "tested_at" DATE,

    CONSTRAINT "cpu_benchmarks_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "gpu_benchmarks" (
    "id" UUID NOT NULL,
    "benchmark_run_id" UUID,
    "benchmark_id" UUID NOT NULL,
    "gpu_id" UUID NOT NULL,
    "score" DECIMAL(14,4) NOT NULL,
    "subscore_name" VARCHAR(80),
    "source_id" UUID,
    "tested_at" DATE,

    CONSTRAINT "gpu_benchmarks_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "npu_benchmarks" (
    "id" UUID NOT NULL,
    "benchmark_run_id" UUID,
    "benchmark_id" UUID NOT NULL,
    "npu_id" UUID NOT NULL,
    "score" DECIMAL(14,4) NOT NULL,
    "subscore_name" VARCHAR(80),
    "source_id" UUID,
    "tested_at" DATE,

    CONSTRAINT "npu_benchmarks_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "wiki_articles" (
    "id" UUID NOT NULL,
    "entity_table" VARCHAR(80) NOT NULL,
    "entity_id" VARCHAR(64) NOT NULL,
    "language_id" INTEGER NOT NULL,
    "title" VARCHAR(300) NOT NULL,
    "slug" VARCHAR(320) NOT NULL,
    "summary" TEXT,
    "body_markdown" TEXT,
    "body_html" TEXT,
    "status" VARCHAR(20) NOT NULL DEFAULT 'draft',
    "current_revision_id" UUID,
    "view_count" BIGINT NOT NULL DEFAULT 0,
    "published_at" TIMESTAMP(3),
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,
    "deleted_at" TIMESTAMPTZ(6),

    CONSTRAINT "wiki_articles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "wiki_revisions" (
    "id" UUID NOT NULL,
    "article_id" UUID NOT NULL,
    "author_user_id" UUID,
    "revision_number" INTEGER NOT NULL,
    "title" VARCHAR(300),
    "body_markdown" TEXT,
    "change_summary" VARCHAR(300),
    "is_published" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "wiki_revisions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "wiki_article_citations" (
    "id" UUID NOT NULL,
    "article_id" UUID NOT NULL,
    "citation_id" UUID NOT NULL,
    "anchor_key" VARCHAR(60),

    CONSTRAINT "wiki_article_citations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "comments" (
    "id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "entity_table" VARCHAR(80) NOT NULL,
    "entity_id" VARCHAR(64) NOT NULL,
    "parent_comment_id" UUID,
    "body_markdown" TEXT NOT NULL,
    "is_hidden" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "comments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "affiliate_price_history" (
    "id" UUID NOT NULL,
    "affiliate_link_id" UUID NOT NULL,
    "price" DECIMAL(12,2) NOT NULL,
    "currency_code" VARCHAR(3) NOT NULL,
    "recorded_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "affiliate_price_history_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "affiliate_clicks" (
    "id" UUID NOT NULL,
    "affiliate_link_id" UUID NOT NULL,
    "user_id" UUID,
    "session_id" UUID,
    "ip_address" INET,
    "user_agent" TEXT,
    "referrer" TEXT,
    "clicked_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "affiliate_clicks_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "wishlist_items" (
    "id" UUID NOT NULL,
    "wishlist_id" UUID NOT NULL,
    "device_variant_id" UUID NOT NULL,
    "notes" TEXT,
    "added_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "wishlist_items_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "languages_code_key" ON "languages"("code");

-- CreateIndex
CREATE INDEX "translations_entity_table_entity_id_idx" ON "translations"("entity_table", "entity_id");

-- CreateIndex
CREATE UNIQUE INDEX "translations_entity_table_entity_id_field_key_language_id_key" ON "translations"("entity_table", "entity_id", "field_key", "language_id");

-- CreateIndex
CREATE UNIQUE INDEX "sources_name_key" ON "sources"("name");

-- CreateIndex
CREATE UNIQUE INDEX "sources_slug_key" ON "sources"("slug");

-- CreateIndex
CREATE INDEX "sources_slug_idx" ON "sources"("slug");

-- CreateIndex
CREATE INDEX "sources_source_type_idx" ON "sources"("source_type");

-- CreateIndex
CREATE INDEX "citations_source_id_idx" ON "citations"("source_id");

-- CreateIndex
CREATE INDEX "citations_published_at_idx" ON "citations"("published_at");

-- CreateIndex
CREATE INDEX "media_assets_asset_type_idx" ON "media_assets"("asset_type");

-- CreateIndex
CREATE INDEX "media_assets_source_id_idx" ON "media_assets"("source_id");

-- CreateIndex
CREATE INDEX "entity_media_entity_table_entity_id_role_display_order_idx" ON "entity_media"("entity_table", "entity_id", "role", "display_order");

-- CreateIndex
CREATE INDEX "entity_media_media_asset_id_idx" ON "entity_media"("media_asset_id");

-- CreateIndex
CREATE UNIQUE INDEX "tags_name_key" ON "tags"("name");

-- CreateIndex
CREATE UNIQUE INDEX "tags_slug_key" ON "tags"("slug");

-- CreateIndex
CREATE INDEX "entity_tags_tag_id_idx" ON "entity_tags"("tag_id");

-- CreateIndex
CREATE UNIQUE INDEX "entity_tags_entity_table_entity_id_tag_id_key" ON "entity_tags"("entity_table", "entity_id", "tag_id");

-- CreateIndex
CREATE UNIQUE INDEX "units_symbol_key" ON "units"("symbol");

-- CreateIndex
CREATE UNIQUE INDEX "organization_roles_code_key" ON "organization_roles"("code");

-- CreateIndex
CREATE UNIQUE INDEX "organization_roles_name_key" ON "organization_roles"("name");

-- CreateIndex
CREATE UNIQUE INDEX "organization_role_assignments_organization_id_role_id_key" ON "organization_role_assignments"("organization_id", "role_id");

-- CreateIndex
CREATE UNIQUE INDEX "regions_code_key" ON "regions"("code");

-- CreateIndex
CREATE UNIQUE INDEX "regions_name_key" ON "regions"("name");

-- CreateIndex
CREATE INDEX "variant_price_history_device_variant_id_region_id_price_typ_idx" ON "variant_price_history"("device_variant_id", "region_id", "price_type", "effective_date");

-- CreateIndex
CREATE INDEX "variant_price_history_effective_date_idx" ON "variant_price_history"("effective_date");

-- CreateIndex
CREATE UNIQUE INDEX "model_lineage_predecessor_model_id_successor_model_id_relat_key" ON "model_lineage"("predecessor_model_id", "successor_model_id", "relation_type");

-- CreateIndex
CREATE INDEX "model_similarity_similarity_score_idx" ON "model_similarity"("similarity_score");

-- CreateIndex
CREATE UNIQUE INDEX "model_similarity_model_a_id_model_b_id_key" ON "model_similarity"("model_a_id", "model_b_id");

-- CreateIndex
CREATE UNIQUE INDEX "technology_families_name_key" ON "technology_families"("name");

-- CreateIndex
CREATE UNIQUE INDEX "technology_families_slug_key" ON "technology_families"("slug");

-- CreateIndex
CREATE INDEX "technology_families_slug_idx" ON "technology_families"("slug");

-- CreateIndex
CREATE INDEX "technology_families_family_type_idx" ON "technology_families"("family_type");

-- CreateIndex
CREATE UNIQUE INDEX "architectures_name_key" ON "architectures"("name");

-- CreateIndex
CREATE UNIQUE INDEX "architectures_slug_key" ON "architectures"("slug");

-- CreateIndex
CREATE INDEX "architectures_slug_idx" ON "architectures"("slug");

-- CreateIndex
CREATE INDEX "architectures_architecture_type_idx" ON "architectures"("architecture_type");

-- CreateIndex
CREATE UNIQUE INDEX "process_nodes_name_key" ON "process_nodes"("name");

-- CreateIndex
CREATE UNIQUE INDEX "process_nodes_slug_key" ON "process_nodes"("slug");

-- CreateIndex
CREATE INDEX "process_nodes_foundry_org_id_idx" ON "process_nodes"("foundry_org_id");

-- CreateIndex
CREATE INDEX "process_nodes_node_nm_idx" ON "process_nodes"("node_nm");

-- CreateIndex
CREATE INDEX "process_nodes_generation_idx" ON "process_nodes"("generation");

-- CreateIndex
CREATE INDEX "process_nodes_slug_idx" ON "process_nodes"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "camera_roles_code_key" ON "camera_roles"("code");

-- CreateIndex
CREATE UNIQUE INDEX "display_technologies_name_key" ON "display_technologies"("name");

-- CreateIndex
CREATE UNIQUE INDEX "display_technologies_slug_key" ON "display_technologies"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "battery_chemistries_name_key" ON "battery_chemistries"("name");

-- CreateIndex
CREATE UNIQUE INDEX "battery_chemistries_slug_key" ON "battery_chemistries"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "network_generations_name_key" ON "network_generations"("name");

-- CreateIndex
CREATE UNIQUE INDEX "network_generations_slug_key" ON "network_generations"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "cpus_name_key" ON "cpus"("name");

-- CreateIndex
CREATE UNIQUE INDEX "cpus_slug_key" ON "cpus"("slug");

-- CreateIndex
CREATE INDEX "cpus_slug_idx" ON "cpus"("slug");

-- CreateIndex
CREATE INDEX "cpus_architecture_id_idx" ON "cpus"("architecture_id");

-- CreateIndex
CREATE UNIQUE INDEX "cpu_clusters_cpu_id_cluster_order_key" ON "cpu_clusters"("cpu_id", "cluster_order");

-- CreateIndex
CREATE UNIQUE INDEX "gpus_name_key" ON "gpus"("name");

-- CreateIndex
CREATE UNIQUE INDEX "gpus_slug_key" ON "gpus"("slug");

-- CreateIndex
CREATE INDEX "gpus_slug_idx" ON "gpus"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "npus_name_key" ON "npus"("name");

-- CreateIndex
CREATE UNIQUE INDEX "npus_slug_key" ON "npus"("slug");

-- CreateIndex
CREATE INDEX "npus_slug_idx" ON "npus"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "modems_name_key" ON "modems"("name");

-- CreateIndex
CREATE UNIQUE INDEX "modems_slug_key" ON "modems"("slug");

-- CreateIndex
CREATE INDEX "modems_slug_idx" ON "modems"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "camera_sensors_name_key" ON "camera_sensors"("name");

-- CreateIndex
CREATE UNIQUE INDEX "camera_sensors_slug_key" ON "camera_sensors"("slug");

-- CreateIndex
CREATE INDEX "camera_sensors_manufacturer_org_id_idx" ON "camera_sensors"("manufacturer_org_id");

-- CreateIndex
CREATE INDEX "camera_sensors_technology_family_id_idx" ON "camera_sensors"("technology_family_id");

-- CreateIndex
CREATE INDEX "camera_sensors_resolution_mp_idx" ON "camera_sensors"("resolution_mp");

-- CreateIndex
CREATE INDEX "camera_sensors_slug_idx" ON "camera_sensors"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "camera_modules_slug_key" ON "camera_modules"("slug");

-- CreateIndex
CREATE INDEX "camera_modules_camera_role_id_idx" ON "camera_modules"("camera_role_id");

-- CreateIndex
CREATE INDEX "camera_modules_slug_idx" ON "camera_modules"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "display_units_slug_key" ON "display_units"("slug");

-- CreateIndex
CREATE INDEX "display_units_display_technology_id_idx" ON "display_units"("display_technology_id");

-- CreateIndex
CREATE INDEX "display_units_slug_idx" ON "display_units"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "battery_units_slug_key" ON "battery_units"("slug");

-- CreateIndex
CREATE INDEX "battery_units_slug_idx" ON "battery_units"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "memory_standards_name_key" ON "memory_standards"("name");

-- CreateIndex
CREATE UNIQUE INDEX "memory_standards_slug_key" ON "memory_standards"("slug");

-- CreateIndex
CREATE INDEX "memory_standards_memory_type_idx" ON "memory_standards"("memory_type");

-- CreateIndex
CREATE INDEX "memory_standards_generation_idx" ON "memory_standards"("generation");

-- CreateIndex
CREATE INDEX "memory_standards_max_data_rate_mtps_idx" ON "memory_standards"("max_data_rate_mtps");

-- CreateIndex
CREATE INDEX "memory_standards_slug_idx" ON "memory_standards"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "storage_standards_name_key" ON "storage_standards"("name");

-- CreateIndex
CREATE UNIQUE INDEX "storage_standards_slug_key" ON "storage_standards"("slug");

-- CreateIndex
CREATE INDEX "storage_standards_storage_type_idx" ON "storage_standards"("storage_type");

-- CreateIndex
CREATE INDEX "storage_standards_slug_idx" ON "storage_standards"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "wireless_standards_name_key" ON "wireless_standards"("name");

-- CreateIndex
CREATE UNIQUE INDEX "wireless_standards_slug_key" ON "wireless_standards"("slug");

-- CreateIndex
CREATE INDEX "wireless_standards_wireless_type_idx" ON "wireless_standards"("wireless_type");

-- CreateIndex
CREATE INDEX "wireless_standards_slug_idx" ON "wireless_standards"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "port_standards_name_key" ON "port_standards"("name");

-- CreateIndex
CREATE UNIQUE INDEX "port_standards_slug_key" ON "port_standards"("slug");

-- CreateIndex
CREATE INDEX "port_standards_slug_idx" ON "port_standards"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "operating_systems_name_key" ON "operating_systems"("name");

-- CreateIndex
CREATE UNIQUE INDEX "operating_systems_slug_key" ON "operating_systems"("slug");

-- CreateIndex
CREATE INDEX "operating_systems_slug_idx" ON "operating_systems"("slug");

-- CreateIndex
CREATE INDEX "os_versions_release_date_idx" ON "os_versions"("release_date");

-- CreateIndex
CREATE UNIQUE INDEX "os_versions_operating_system_id_version_name_key" ON "os_versions"("operating_system_id", "version_name");

-- CreateIndex
CREATE UNIQUE INDEX "os_ui_layers_slug_key" ON "os_ui_layers"("slug");

-- CreateIndex
CREATE INDEX "os_ui_layers_base_os_id_idx" ON "os_ui_layers"("base_os_id");

-- CreateIndex
CREATE UNIQUE INDEX "os_ui_layers_name_vendor_org_id_key" ON "os_ui_layers"("name", "vendor_org_id");

-- CreateIndex
CREATE UNIQUE INDEX "os_ui_layer_versions_ui_layer_id_version_name_key" ON "os_ui_layer_versions"("ui_layer_id", "version_name");

-- CreateIndex
CREATE UNIQUE INDEX "hardware_sensors_name_key" ON "hardware_sensors"("name");

-- CreateIndex
CREATE UNIQUE INDEX "hardware_sensors_slug_key" ON "hardware_sensors"("slug");

-- CreateIndex
CREATE INDEX "hardware_sensors_sensor_category_idx" ON "hardware_sensors"("sensor_category");

-- CreateIndex
CREATE INDEX "hardware_sensors_slug_idx" ON "hardware_sensors"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "cellular_bands_name_key" ON "cellular_bands"("name");

-- CreateIndex
CREATE INDEX "cellular_bands_network_generation_id_idx" ON "cellular_bands"("network_generation_id");

-- CreateIndex
CREATE UNIQUE INDEX "wifi_bands_name_key" ON "wifi_bands"("name");

-- CreateIndex
CREATE UNIQUE INDEX "certifications_name_key" ON "certifications"("name");

-- CreateIndex
CREATE UNIQUE INDEX "certifications_slug_key" ON "certifications"("slug");

-- CreateIndex
CREATE INDEX "certifications_certification_type_idx" ON "certifications"("certification_type");

-- CreateIndex
CREATE UNIQUE INDEX "chipset_cpu_links_chipset_id_cpu_id_key" ON "chipset_cpu_links"("chipset_id", "cpu_id");

-- CreateIndex
CREATE UNIQUE INDEX "chipset_gpu_links_chipset_id_gpu_id_key" ON "chipset_gpu_links"("chipset_id", "gpu_id");

-- CreateIndex
CREATE UNIQUE INDEX "chipset_npu_links_chipset_id_npu_id_key" ON "chipset_npu_links"("chipset_id", "npu_id");

-- CreateIndex
CREATE UNIQUE INDEX "chipset_modem_links_chipset_id_modem_id_key" ON "chipset_modem_links"("chipset_id", "modem_id");

-- CreateIndex
CREATE UNIQUE INDEX "camera_module_sensor_links_camera_module_id_camera_sensor_i_key" ON "camera_module_sensor_links"("camera_module_id", "camera_sensor_id");

-- CreateIndex
CREATE UNIQUE INDEX "variant_chipsets_device_variant_id_chipset_id_chip_role_key" ON "variant_chipsets"("device_variant_id", "chipset_id", "chip_role");

-- CreateIndex
CREATE UNIQUE INDEX "variant_cpus_device_variant_id_cpu_id_cpu_role_key" ON "variant_cpus"("device_variant_id", "cpu_id", "cpu_role");

-- CreateIndex
CREATE UNIQUE INDEX "variant_gpus_device_variant_id_gpu_id_gpu_role_key" ON "variant_gpus"("device_variant_id", "gpu_id", "gpu_role");

-- CreateIndex
CREATE UNIQUE INDEX "variant_npus_device_variant_id_npu_id_npu_role_key" ON "variant_npus"("device_variant_id", "npu_id", "npu_role");

-- CreateIndex
CREATE UNIQUE INDEX "variant_modems_device_variant_id_modem_id_modem_role_key" ON "variant_modems"("device_variant_id", "modem_id", "modem_role");

-- CreateIndex
CREATE UNIQUE INDEX "variant_displays_device_variant_id_display_role_display_ord_key" ON "variant_displays"("device_variant_id", "display_role", "display_order");

-- CreateIndex
CREATE UNIQUE INDEX "variant_batteries_device_variant_id_battery_unit_id_battery_key" ON "variant_batteries"("device_variant_id", "battery_unit_id", "battery_role");

-- CreateIndex
CREATE UNIQUE INDEX "variant_camera_systems_device_variant_id_position_key" ON "variant_camera_systems"("device_variant_id", "position");

-- CreateIndex
CREATE INDEX "variant_camera_modules_device_variant_id_idx" ON "variant_camera_modules"("device_variant_id");

-- CreateIndex
CREATE INDEX "variant_camera_modules_camera_system_id_idx" ON "variant_camera_modules"("camera_system_id");

-- CreateIndex
CREATE UNIQUE INDEX "variant_camera_modules_device_variant_id_position_role_modu_key" ON "variant_camera_modules"("device_variant_id", "position", "role", "module_order");

-- CreateIndex
CREATE INDEX "variant_memory_configs_device_variant_id_idx" ON "variant_memory_configs"("device_variant_id");

-- CreateIndex
CREATE INDEX "variant_memory_configs_memory_standard_id_idx" ON "variant_memory_configs"("memory_standard_id");

-- CreateIndex
CREATE UNIQUE INDEX "variant_memory_configs_device_variant_id_capacity_gb_memory_key" ON "variant_memory_configs"("device_variant_id", "capacity_gb", "memory_standard_id");

-- CreateIndex
CREATE UNIQUE INDEX "variant_storage_configs_device_variant_id_storage_standard__key" ON "variant_storage_configs"("device_variant_id", "storage_standard_id", "total_capacity_gb");

-- CreateIndex
CREATE UNIQUE INDEX "variant_ports_device_variant_id_port_standard_id_key" ON "variant_ports"("device_variant_id", "port_standard_id");

-- CreateIndex
CREATE UNIQUE INDEX "variant_wireless_support_device_variant_id_wireless_standar_key" ON "variant_wireless_support"("device_variant_id", "wireless_standard_id");

-- CreateIndex
CREATE UNIQUE INDEX "variant_wifi_bands_device_variant_id_wifi_band_id_key" ON "variant_wifi_bands"("device_variant_id", "wifi_band_id");

-- CreateIndex
CREATE UNIQUE INDEX "variant_operating_systems_device_variant_id_os_version_id_u_key" ON "variant_operating_systems"("device_variant_id", "os_version_id", "ui_layer_version_id");

-- CreateIndex
CREATE UNIQUE INDEX "variant_hardware_sensors_device_variant_id_hardware_sensor__key" ON "variant_hardware_sensors"("device_variant_id", "hardware_sensor_id");

-- CreateIndex
CREATE UNIQUE INDEX "variant_cellular_band_support_device_variant_id_cellular_ba_key" ON "variant_cellular_band_support"("device_variant_id", "cellular_band_id");

-- CreateIndex
CREATE UNIQUE INDEX "variant_certifications_device_variant_id_certification_id_key" ON "variant_certifications"("device_variant_id", "certification_id");

-- CreateIndex
CREATE UNIQUE INDEX "variant_region_availability_device_variant_id_region_id_key" ON "variant_region_availability"("device_variant_id", "region_id");

-- CreateIndex
CREATE UNIQUE INDEX "software_features_code_key" ON "software_features"("code");

-- CreateIndex
CREATE INDEX "software_features_feature_category_idx" ON "software_features"("feature_category");

-- CreateIndex
CREATE UNIQUE INDEX "variant_software_features_device_variant_id_software_featur_key" ON "variant_software_features"("device_variant_id", "software_feature_id");

-- CreateIndex
CREATE UNIQUE INDEX "feature_definitions_code_key" ON "feature_definitions"("code");

-- CreateIndex
CREATE INDEX "feature_definitions_feature_group_idx" ON "feature_definitions"("feature_group");

-- CreateIndex
CREATE UNIQUE INDEX "device_variant_features_device_variant_id_feature_definitio_key" ON "device_variant_features"("device_variant_id", "feature_definition_id");

-- CreateIndex
CREATE UNIQUE INDEX "benchmarks_slug_key" ON "benchmarks"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "benchmarks_name_version_target_type_key" ON "benchmarks"("name", "version", "target_type");

-- CreateIndex
CREATE INDEX "device_variant_benchmarks_benchmark_id_device_variant_id_su_idx" ON "device_variant_benchmarks"("benchmark_id", "device_variant_id", "subscore_name", "tested_at");

-- CreateIndex
CREATE INDEX "device_variant_benchmarks_device_variant_id_idx" ON "device_variant_benchmarks"("device_variant_id");

-- CreateIndex
CREATE INDEX "chipset_benchmarks_benchmark_id_chipset_id_subscore_name_te_idx" ON "chipset_benchmarks"("benchmark_id", "chipset_id", "subscore_name", "tested_at");

-- CreateIndex
CREATE INDEX "cpu_benchmarks_benchmark_id_cpu_id_subscore_name_tested_at_idx" ON "cpu_benchmarks"("benchmark_id", "cpu_id", "subscore_name", "tested_at");

-- CreateIndex
CREATE INDEX "gpu_benchmarks_benchmark_id_gpu_id_subscore_name_tested_at_idx" ON "gpu_benchmarks"("benchmark_id", "gpu_id", "subscore_name", "tested_at");

-- CreateIndex
CREATE INDEX "npu_benchmarks_benchmark_id_npu_id_subscore_name_tested_at_idx" ON "npu_benchmarks"("benchmark_id", "npu_id", "subscore_name", "tested_at");

-- CreateIndex
CREATE INDEX "wiki_articles_status_idx" ON "wiki_articles"("status");

-- CreateIndex
CREATE UNIQUE INDEX "wiki_articles_entity_table_entity_id_language_id_key" ON "wiki_articles"("entity_table", "entity_id", "language_id");

-- CreateIndex
CREATE UNIQUE INDEX "wiki_articles_slug_language_id_key" ON "wiki_articles"("slug", "language_id");

-- CreateIndex
CREATE UNIQUE INDEX "wiki_revisions_article_id_revision_number_key" ON "wiki_revisions"("article_id", "revision_number");

-- CreateIndex
CREATE UNIQUE INDEX "wiki_article_citations_article_id_citation_id_key" ON "wiki_article_citations"("article_id", "citation_id");

-- CreateIndex
CREATE INDEX "comments_entity_table_entity_id_idx" ON "comments"("entity_table", "entity_id");

-- CreateIndex
CREATE INDEX "comments_user_id_idx" ON "comments"("user_id");

-- CreateIndex
CREATE INDEX "affiliate_price_history_affiliate_link_id_recorded_at_idx" ON "affiliate_price_history"("affiliate_link_id", "recorded_at");

-- CreateIndex
CREATE INDEX "affiliate_clicks_affiliate_link_id_idx" ON "affiliate_clicks"("affiliate_link_id");

-- CreateIndex
CREATE INDEX "affiliate_clicks_clicked_at_idx" ON "affiliate_clicks"("clicked_at");

-- CreateIndex
CREATE UNIQUE INDEX "wishlist_items_wishlist_id_device_variant_id_key" ON "wishlist_items"("wishlist_id", "device_variant_id");

-- CreateIndex
CREATE INDEX "chipsets_manufacturer_org_id_idx" ON "chipsets"("manufacturer_org_id");

-- CreateIndex
CREATE INDEX "chipsets_release_date_idx" ON "chipsets"("release_date");

-- CreateIndex
CREATE UNIQUE INDEX "currencies_code_key" ON "currencies"("code");

-- CreateIndex
CREATE UNIQUE INDEX "data_sources_slug_key" ON "data_sources"("slug");

-- CreateIndex
CREATE INDEX "device_categories_slug_idx" ON "device_categories"("slug");

-- CreateIndex
CREATE INDEX "device_categories_parent_category_id_idx" ON "device_categories"("parent_category_id");

-- CreateIndex
CREATE INDEX "device_models_announcement_date_idx" ON "device_models"("announcement_date");

-- CreateIndex
CREATE INDEX "device_variants_sku_code_idx" ON "device_variants"("sku_code");

-- CreateIndex
CREATE INDEX "device_variants_launch_date_idx" ON "device_variants"("launch_date");

-- CreateIndex
CREATE INDEX "organizations_parent_org_id_idx" ON "organizations"("parent_org_id");

-- CreateIndex
CREATE INDEX "product_families_device_category_id_idx" ON "product_families"("device_category_id");

-- CreateIndex
CREATE INDEX "raw_pages_source_id_idx" ON "raw_pages"("source_id");

-- CreateIndex
CREATE UNIQUE INDEX "subscriptions_stripe_customer_id_key" ON "subscriptions"("stripe_customer_id");

-- CreateIndex
CREATE UNIQUE INDEX "subscriptions_stripe_sub_id_key" ON "subscriptions"("stripe_sub_id");

-- CreateIndex
CREATE INDEX "users_username_idx" ON "users"("username");

-- AddForeignKey
ALTER TABLE "translations" ADD CONSTRAINT "translations_language_id_fkey" FOREIGN KEY ("language_id") REFERENCES "languages"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "citations" ADD CONSTRAINT "citations_source_id_fkey" FOREIGN KEY ("source_id") REFERENCES "sources"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "media_assets" ADD CONSTRAINT "media_assets_source_id_fkey" FOREIGN KEY ("source_id") REFERENCES "sources"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "entity_media" ADD CONSTRAINT "entity_media_media_asset_id_fkey" FOREIGN KEY ("media_asset_id") REFERENCES "media_assets"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "entity_tags" ADD CONSTRAINT "entity_tags_tag_id_fkey" FOREIGN KEY ("tag_id") REFERENCES "tags"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "units" ADD CONSTRAINT "units_base_unit_id_fkey" FOREIGN KEY ("base_unit_id") REFERENCES "units"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "organization_role_assignments" ADD CONSTRAINT "organization_role_assignments_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "organization_role_assignments" ADD CONSTRAINT "organization_role_assignments_role_id_fkey" FOREIGN KEY ("role_id") REFERENCES "organization_roles"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "device_variants" ADD CONSTRAINT "device_variants_currency_id_fkey" FOREIGN KEY ("currency_id") REFERENCES "currencies"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "variant_price_history" ADD CONSTRAINT "variant_price_history_device_variant_id_fkey" FOREIGN KEY ("device_variant_id") REFERENCES "device_variants"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "variant_price_history" ADD CONSTRAINT "variant_price_history_region_id_fkey" FOREIGN KEY ("region_id") REFERENCES "regions"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "variant_price_history" ADD CONSTRAINT "variant_price_history_currency_id_fkey" FOREIGN KEY ("currency_id") REFERENCES "currencies"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "variant_price_history" ADD CONSTRAINT "variant_price_history_source_id_fkey" FOREIGN KEY ("source_id") REFERENCES "sources"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "variant_physical_specs" ADD CONSTRAINT "variant_physical_specs_device_variant_id_fkey" FOREIGN KEY ("device_variant_id") REFERENCES "device_variants"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "variant_io_specs" ADD CONSTRAINT "variant_io_specs_device_variant_id_fkey" FOREIGN KEY ("device_variant_id") REFERENCES "device_variants"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "variant_thermal_specs" ADD CONSTRAINT "variant_thermal_specs_device_variant_id_fkey" FOREIGN KEY ("device_variant_id") REFERENCES "device_variants"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "model_lineage" ADD CONSTRAINT "model_lineage_predecessor_model_id_fkey" FOREIGN KEY ("predecessor_model_id") REFERENCES "device_models"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "model_lineage" ADD CONSTRAINT "model_lineage_successor_model_id_fkey" FOREIGN KEY ("successor_model_id") REFERENCES "device_models"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "model_similarity" ADD CONSTRAINT "model_similarity_model_a_id_fkey" FOREIGN KEY ("model_a_id") REFERENCES "device_models"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "model_similarity" ADD CONSTRAINT "model_similarity_model_b_id_fkey" FOREIGN KEY ("model_b_id") REFERENCES "device_models"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "technology_families" ADD CONSTRAINT "technology_families_parent_family_id_fkey" FOREIGN KEY ("parent_family_id") REFERENCES "technology_families"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "technology_families" ADD CONSTRAINT "technology_families_vendor_org_id_fkey" FOREIGN KEY ("vendor_org_id") REFERENCES "organizations"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "architectures" ADD CONSTRAINT "architectures_vendor_org_id_fkey" FOREIGN KEY ("vendor_org_id") REFERENCES "organizations"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "process_nodes" ADD CONSTRAINT "process_nodes_foundry_org_id_fkey" FOREIGN KEY ("foundry_org_id") REFERENCES "organizations"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "display_technologies" ADD CONSTRAINT "display_technologies_parent_tech_id_fkey" FOREIGN KEY ("parent_tech_id") REFERENCES "display_technologies"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "chipsets" ADD CONSTRAINT "chipsets_technology_family_id_fkey" FOREIGN KEY ("technology_family_id") REFERENCES "technology_families"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "chipsets" ADD CONSTRAINT "chipsets_process_node_id_fkey" FOREIGN KEY ("process_node_id") REFERENCES "process_nodes"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "cpus" ADD CONSTRAINT "cpus_manufacturer_org_id_fkey" FOREIGN KEY ("manufacturer_org_id") REFERENCES "organizations"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "cpus" ADD CONSTRAINT "cpus_architecture_id_fkey" FOREIGN KEY ("architecture_id") REFERENCES "architectures"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "cpus" ADD CONSTRAINT "cpus_technology_family_id_fkey" FOREIGN KEY ("technology_family_id") REFERENCES "technology_families"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "cpu_clusters" ADD CONSTRAINT "cpu_clusters_cpu_id_fkey" FOREIGN KEY ("cpu_id") REFERENCES "cpus"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "gpus" ADD CONSTRAINT "gpus_manufacturer_org_id_fkey" FOREIGN KEY ("manufacturer_org_id") REFERENCES "organizations"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "gpus" ADD CONSTRAINT "gpus_architecture_id_fkey" FOREIGN KEY ("architecture_id") REFERENCES "architectures"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "gpus" ADD CONSTRAINT "gpus_technology_family_id_fkey" FOREIGN KEY ("technology_family_id") REFERENCES "technology_families"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "npus" ADD CONSTRAINT "npus_manufacturer_org_id_fkey" FOREIGN KEY ("manufacturer_org_id") REFERENCES "organizations"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "npus" ADD CONSTRAINT "npus_architecture_id_fkey" FOREIGN KEY ("architecture_id") REFERENCES "architectures"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "npus" ADD CONSTRAINT "npus_technology_family_id_fkey" FOREIGN KEY ("technology_family_id") REFERENCES "technology_families"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "modems" ADD CONSTRAINT "modems_manufacturer_org_id_fkey" FOREIGN KEY ("manufacturer_org_id") REFERENCES "organizations"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "modems" ADD CONSTRAINT "modems_technology_family_id_fkey" FOREIGN KEY ("technology_family_id") REFERENCES "technology_families"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "camera_sensors" ADD CONSTRAINT "camera_sensors_manufacturer_org_id_fkey" FOREIGN KEY ("manufacturer_org_id") REFERENCES "organizations"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "camera_sensors" ADD CONSTRAINT "camera_sensors_technology_family_id_fkey" FOREIGN KEY ("technology_family_id") REFERENCES "technology_families"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "camera_modules" ADD CONSTRAINT "camera_modules_manufacturer_org_id_fkey" FOREIGN KEY ("manufacturer_org_id") REFERENCES "organizations"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "camera_modules" ADD CONSTRAINT "camera_modules_camera_role_id_fkey" FOREIGN KEY ("camera_role_id") REFERENCES "camera_roles"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "display_units" ADD CONSTRAINT "display_units_manufacturer_org_id_fkey" FOREIGN KEY ("manufacturer_org_id") REFERENCES "organizations"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "display_units" ADD CONSTRAINT "display_units_display_technology_id_fkey" FOREIGN KEY ("display_technology_id") REFERENCES "display_technologies"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "battery_units" ADD CONSTRAINT "battery_units_manufacturer_org_id_fkey" FOREIGN KEY ("manufacturer_org_id") REFERENCES "organizations"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "battery_units" ADD CONSTRAINT "battery_units_battery_chemistry_id_fkey" FOREIGN KEY ("battery_chemistry_id") REFERENCES "battery_chemistries"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "memory_standards" ADD CONSTRAINT "memory_standards_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "memory_standards" ADD CONSTRAINT "memory_standards_technology_family_id_fkey" FOREIGN KEY ("technology_family_id") REFERENCES "technology_families"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "storage_standards" ADD CONSTRAINT "storage_standards_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "storage_standards" ADD CONSTRAINT "storage_standards_technology_family_id_fkey" FOREIGN KEY ("technology_family_id") REFERENCES "technology_families"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "wireless_standards" ADD CONSTRAINT "wireless_standards_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "wireless_standards" ADD CONSTRAINT "wireless_standards_network_generation_id_fkey" FOREIGN KEY ("network_generation_id") REFERENCES "network_generations"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "port_standards" ADD CONSTRAINT "port_standards_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "operating_systems" ADD CONSTRAINT "operating_systems_vendor_org_id_fkey" FOREIGN KEY ("vendor_org_id") REFERENCES "organizations"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "os_versions" ADD CONSTRAINT "os_versions_operating_system_id_fkey" FOREIGN KEY ("operating_system_id") REFERENCES "operating_systems"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "os_ui_layers" ADD CONSTRAINT "os_ui_layers_vendor_org_id_fkey" FOREIGN KEY ("vendor_org_id") REFERENCES "organizations"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "os_ui_layers" ADD CONSTRAINT "os_ui_layers_base_os_id_fkey" FOREIGN KEY ("base_os_id") REFERENCES "operating_systems"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "os_ui_layer_versions" ADD CONSTRAINT "os_ui_layer_versions_ui_layer_id_fkey" FOREIGN KEY ("ui_layer_id") REFERENCES "os_ui_layers"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "os_ui_layer_versions" ADD CONSTRAINT "os_ui_layer_versions_base_os_version_id_fkey" FOREIGN KEY ("base_os_version_id") REFERENCES "os_versions"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "hardware_sensors" ADD CONSTRAINT "hardware_sensors_manufacturer_org_id_fkey" FOREIGN KEY ("manufacturer_org_id") REFERENCES "organizations"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "cellular_bands" ADD CONSTRAINT "cellular_bands_network_generation_id_fkey" FOREIGN KEY ("network_generation_id") REFERENCES "network_generations"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "certifications" ADD CONSTRAINT "certifications_authority_org_id_fkey" FOREIGN KEY ("authority_org_id") REFERENCES "organizations"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "chipset_cpu_links" ADD CONSTRAINT "chipset_cpu_links_chipset_id_fkey" FOREIGN KEY ("chipset_id") REFERENCES "chipsets"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "chipset_cpu_links" ADD CONSTRAINT "chipset_cpu_links_cpu_id_fkey" FOREIGN KEY ("cpu_id") REFERENCES "cpus"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "chipset_gpu_links" ADD CONSTRAINT "chipset_gpu_links_chipset_id_fkey" FOREIGN KEY ("chipset_id") REFERENCES "chipsets"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "chipset_gpu_links" ADD CONSTRAINT "chipset_gpu_links_gpu_id_fkey" FOREIGN KEY ("gpu_id") REFERENCES "gpus"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "chipset_npu_links" ADD CONSTRAINT "chipset_npu_links_chipset_id_fkey" FOREIGN KEY ("chipset_id") REFERENCES "chipsets"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "chipset_npu_links" ADD CONSTRAINT "chipset_npu_links_npu_id_fkey" FOREIGN KEY ("npu_id") REFERENCES "npus"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "chipset_modem_links" ADD CONSTRAINT "chipset_modem_links_chipset_id_fkey" FOREIGN KEY ("chipset_id") REFERENCES "chipsets"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "chipset_modem_links" ADD CONSTRAINT "chipset_modem_links_modem_id_fkey" FOREIGN KEY ("modem_id") REFERENCES "modems"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "camera_module_sensor_links" ADD CONSTRAINT "camera_module_sensor_links_camera_module_id_fkey" FOREIGN KEY ("camera_module_id") REFERENCES "camera_modules"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "camera_module_sensor_links" ADD CONSTRAINT "camera_module_sensor_links_camera_sensor_id_fkey" FOREIGN KEY ("camera_sensor_id") REFERENCES "camera_sensors"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "variant_chipsets" ADD CONSTRAINT "variant_chipsets_device_variant_id_fkey" FOREIGN KEY ("device_variant_id") REFERENCES "device_variants"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "variant_chipsets" ADD CONSTRAINT "variant_chipsets_chipset_id_fkey" FOREIGN KEY ("chipset_id") REFERENCES "chipsets"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "variant_cpus" ADD CONSTRAINT "variant_cpus_device_variant_id_fkey" FOREIGN KEY ("device_variant_id") REFERENCES "device_variants"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "variant_cpus" ADD CONSTRAINT "variant_cpus_cpu_id_fkey" FOREIGN KEY ("cpu_id") REFERENCES "cpus"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "variant_gpus" ADD CONSTRAINT "variant_gpus_device_variant_id_fkey" FOREIGN KEY ("device_variant_id") REFERENCES "device_variants"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "variant_gpus" ADD CONSTRAINT "variant_gpus_gpu_id_fkey" FOREIGN KEY ("gpu_id") REFERENCES "gpus"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "variant_npus" ADD CONSTRAINT "variant_npus_device_variant_id_fkey" FOREIGN KEY ("device_variant_id") REFERENCES "device_variants"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "variant_npus" ADD CONSTRAINT "variant_npus_npu_id_fkey" FOREIGN KEY ("npu_id") REFERENCES "npus"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "variant_modems" ADD CONSTRAINT "variant_modems_device_variant_id_fkey" FOREIGN KEY ("device_variant_id") REFERENCES "device_variants"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "variant_modems" ADD CONSTRAINT "variant_modems_modem_id_fkey" FOREIGN KEY ("modem_id") REFERENCES "modems"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "variant_displays" ADD CONSTRAINT "variant_displays_device_variant_id_fkey" FOREIGN KEY ("device_variant_id") REFERENCES "device_variants"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "variant_displays" ADD CONSTRAINT "variant_displays_display_unit_id_fkey" FOREIGN KEY ("display_unit_id") REFERENCES "display_units"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "variant_batteries" ADD CONSTRAINT "variant_batteries_device_variant_id_fkey" FOREIGN KEY ("device_variant_id") REFERENCES "device_variants"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "variant_batteries" ADD CONSTRAINT "variant_batteries_battery_unit_id_fkey" FOREIGN KEY ("battery_unit_id") REFERENCES "battery_units"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "variant_camera_systems" ADD CONSTRAINT "variant_camera_systems_device_variant_id_fkey" FOREIGN KEY ("device_variant_id") REFERENCES "device_variants"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "variant_camera_modules" ADD CONSTRAINT "variant_camera_modules_device_variant_id_fkey" FOREIGN KEY ("device_variant_id") REFERENCES "device_variants"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "variant_camera_modules" ADD CONSTRAINT "variant_camera_modules_camera_system_id_fkey" FOREIGN KEY ("camera_system_id") REFERENCES "variant_camera_systems"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "variant_camera_modules" ADD CONSTRAINT "variant_camera_modules_camera_module_id_fkey" FOREIGN KEY ("camera_module_id") REFERENCES "camera_modules"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "variant_memory_configs" ADD CONSTRAINT "variant_memory_configs_device_variant_id_fkey" FOREIGN KEY ("device_variant_id") REFERENCES "device_variants"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "variant_memory_configs" ADD CONSTRAINT "variant_memory_configs_memory_standard_id_fkey" FOREIGN KEY ("memory_standard_id") REFERENCES "memory_standards"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "variant_storage_configs" ADD CONSTRAINT "variant_storage_configs_device_variant_id_fkey" FOREIGN KEY ("device_variant_id") REFERENCES "device_variants"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "variant_storage_configs" ADD CONSTRAINT "variant_storage_configs_storage_standard_id_fkey" FOREIGN KEY ("storage_standard_id") REFERENCES "storage_standards"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "variant_ports" ADD CONSTRAINT "variant_ports_device_variant_id_fkey" FOREIGN KEY ("device_variant_id") REFERENCES "device_variants"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "variant_ports" ADD CONSTRAINT "variant_ports_port_standard_id_fkey" FOREIGN KEY ("port_standard_id") REFERENCES "port_standards"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "variant_wireless_support" ADD CONSTRAINT "variant_wireless_support_device_variant_id_fkey" FOREIGN KEY ("device_variant_id") REFERENCES "device_variants"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "variant_wireless_support" ADD CONSTRAINT "variant_wireless_support_wireless_standard_id_fkey" FOREIGN KEY ("wireless_standard_id") REFERENCES "wireless_standards"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "variant_wifi_bands" ADD CONSTRAINT "variant_wifi_bands_device_variant_id_fkey" FOREIGN KEY ("device_variant_id") REFERENCES "device_variants"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "variant_wifi_bands" ADD CONSTRAINT "variant_wifi_bands_wifi_band_id_fkey" FOREIGN KEY ("wifi_band_id") REFERENCES "wifi_bands"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "variant_operating_systems" ADD CONSTRAINT "variant_operating_systems_device_variant_id_fkey" FOREIGN KEY ("device_variant_id") REFERENCES "device_variants"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "variant_operating_systems" ADD CONSTRAINT "variant_operating_systems_os_version_id_fkey" FOREIGN KEY ("os_version_id") REFERENCES "os_versions"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "variant_operating_systems" ADD CONSTRAINT "variant_operating_systems_ui_layer_version_id_fkey" FOREIGN KEY ("ui_layer_version_id") REFERENCES "os_ui_layer_versions"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "variant_hardware_sensors" ADD CONSTRAINT "variant_hardware_sensors_device_variant_id_fkey" FOREIGN KEY ("device_variant_id") REFERENCES "device_variants"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "variant_hardware_sensors" ADD CONSTRAINT "variant_hardware_sensors_hardware_sensor_id_fkey" FOREIGN KEY ("hardware_sensor_id") REFERENCES "hardware_sensors"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "variant_cellular_band_support" ADD CONSTRAINT "variant_cellular_band_support_device_variant_id_fkey" FOREIGN KEY ("device_variant_id") REFERENCES "device_variants"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "variant_cellular_band_support" ADD CONSTRAINT "variant_cellular_band_support_cellular_band_id_fkey" FOREIGN KEY ("cellular_band_id") REFERENCES "cellular_bands"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "variant_certifications" ADD CONSTRAINT "variant_certifications_device_variant_id_fkey" FOREIGN KEY ("device_variant_id") REFERENCES "device_variants"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "variant_certifications" ADD CONSTRAINT "variant_certifications_certification_id_fkey" FOREIGN KEY ("certification_id") REFERENCES "certifications"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "variant_certifications" ADD CONSTRAINT "variant_certifications_source_id_fkey" FOREIGN KEY ("source_id") REFERENCES "sources"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "variant_region_availability" ADD CONSTRAINT "variant_region_availability_device_variant_id_fkey" FOREIGN KEY ("device_variant_id") REFERENCES "device_variants"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "variant_region_availability" ADD CONSTRAINT "variant_region_availability_region_id_fkey" FOREIGN KEY ("region_id") REFERENCES "regions"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "software_features" ADD CONSTRAINT "software_features_vendor_org_id_fkey" FOREIGN KEY ("vendor_org_id") REFERENCES "organizations"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "variant_software_features" ADD CONSTRAINT "variant_software_features_device_variant_id_fkey" FOREIGN KEY ("device_variant_id") REFERENCES "device_variants"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "variant_software_features" ADD CONSTRAINT "variant_software_features_software_feature_id_fkey" FOREIGN KEY ("software_feature_id") REFERENCES "software_features"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "feature_definitions" ADD CONSTRAINT "feature_definitions_device_category_id_fkey" FOREIGN KEY ("device_category_id") REFERENCES "device_categories"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "feature_definitions" ADD CONSTRAINT "feature_definitions_unit_id_fkey" FOREIGN KEY ("unit_id") REFERENCES "units"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "device_variant_features" ADD CONSTRAINT "device_variant_features_device_variant_id_fkey" FOREIGN KEY ("device_variant_id") REFERENCES "device_variants"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "device_variant_features" ADD CONSTRAINT "device_variant_features_feature_definition_id_fkey" FOREIGN KEY ("feature_definition_id") REFERENCES "feature_definitions"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "device_variant_features" ADD CONSTRAINT "device_variant_features_source_id_fkey" FOREIGN KEY ("source_id") REFERENCES "sources"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "device_variant_features" ADD CONSTRAINT "device_variant_features_citation_id_fkey" FOREIGN KEY ("citation_id") REFERENCES "citations"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "benchmarks" ADD CONSTRAINT "benchmarks_vendor_org_id_fkey" FOREIGN KEY ("vendor_org_id") REFERENCES "organizations"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "benchmarks" ADD CONSTRAINT "benchmarks_unit_id_fkey" FOREIGN KEY ("unit_id") REFERENCES "units"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "benchmark_runs" ADD CONSTRAINT "benchmark_runs_benchmark_id_fkey" FOREIGN KEY ("benchmark_id") REFERENCES "benchmarks"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "benchmark_runs" ADD CONSTRAINT "benchmark_runs_source_id_fkey" FOREIGN KEY ("source_id") REFERENCES "sources"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "benchmark_runs" ADD CONSTRAINT "benchmark_runs_citation_id_fkey" FOREIGN KEY ("citation_id") REFERENCES "citations"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "device_variant_benchmarks" ADD CONSTRAINT "device_variant_benchmarks_benchmark_run_id_fkey" FOREIGN KEY ("benchmark_run_id") REFERENCES "benchmark_runs"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "device_variant_benchmarks" ADD CONSTRAINT "device_variant_benchmarks_benchmark_id_fkey" FOREIGN KEY ("benchmark_id") REFERENCES "benchmarks"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "device_variant_benchmarks" ADD CONSTRAINT "device_variant_benchmarks_device_variant_id_fkey" FOREIGN KEY ("device_variant_id") REFERENCES "device_variants"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "device_variant_benchmarks" ADD CONSTRAINT "device_variant_benchmarks_source_id_fkey" FOREIGN KEY ("source_id") REFERENCES "sources"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "chipset_benchmarks" ADD CONSTRAINT "chipset_benchmarks_benchmark_run_id_fkey" FOREIGN KEY ("benchmark_run_id") REFERENCES "benchmark_runs"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "chipset_benchmarks" ADD CONSTRAINT "chipset_benchmarks_benchmark_id_fkey" FOREIGN KEY ("benchmark_id") REFERENCES "benchmarks"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "chipset_benchmarks" ADD CONSTRAINT "chipset_benchmarks_chipset_id_fkey" FOREIGN KEY ("chipset_id") REFERENCES "chipsets"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "chipset_benchmarks" ADD CONSTRAINT "chipset_benchmarks_source_id_fkey" FOREIGN KEY ("source_id") REFERENCES "sources"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "cpu_benchmarks" ADD CONSTRAINT "cpu_benchmarks_benchmark_run_id_fkey" FOREIGN KEY ("benchmark_run_id") REFERENCES "benchmark_runs"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "cpu_benchmarks" ADD CONSTRAINT "cpu_benchmarks_benchmark_id_fkey" FOREIGN KEY ("benchmark_id") REFERENCES "benchmarks"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "cpu_benchmarks" ADD CONSTRAINT "cpu_benchmarks_cpu_id_fkey" FOREIGN KEY ("cpu_id") REFERENCES "cpus"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "cpu_benchmarks" ADD CONSTRAINT "cpu_benchmarks_source_id_fkey" FOREIGN KEY ("source_id") REFERENCES "sources"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "gpu_benchmarks" ADD CONSTRAINT "gpu_benchmarks_benchmark_run_id_fkey" FOREIGN KEY ("benchmark_run_id") REFERENCES "benchmark_runs"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "gpu_benchmarks" ADD CONSTRAINT "gpu_benchmarks_benchmark_id_fkey" FOREIGN KEY ("benchmark_id") REFERENCES "benchmarks"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "gpu_benchmarks" ADD CONSTRAINT "gpu_benchmarks_gpu_id_fkey" FOREIGN KEY ("gpu_id") REFERENCES "gpus"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "gpu_benchmarks" ADD CONSTRAINT "gpu_benchmarks_source_id_fkey" FOREIGN KEY ("source_id") REFERENCES "sources"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "npu_benchmarks" ADD CONSTRAINT "npu_benchmarks_benchmark_run_id_fkey" FOREIGN KEY ("benchmark_run_id") REFERENCES "benchmark_runs"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "npu_benchmarks" ADD CONSTRAINT "npu_benchmarks_benchmark_id_fkey" FOREIGN KEY ("benchmark_id") REFERENCES "benchmarks"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "npu_benchmarks" ADD CONSTRAINT "npu_benchmarks_npu_id_fkey" FOREIGN KEY ("npu_id") REFERENCES "npus"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "npu_benchmarks" ADD CONSTRAINT "npu_benchmarks_source_id_fkey" FOREIGN KEY ("source_id") REFERENCES "sources"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "wiki_articles" ADD CONSTRAINT "wiki_articles_language_id_fkey" FOREIGN KEY ("language_id") REFERENCES "languages"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "wiki_revisions" ADD CONSTRAINT "wiki_revisions_article_id_fkey" FOREIGN KEY ("article_id") REFERENCES "wiki_articles"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "wiki_revisions" ADD CONSTRAINT "wiki_revisions_author_user_id_fkey" FOREIGN KEY ("author_user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "wiki_article_citations" ADD CONSTRAINT "wiki_article_citations_article_id_fkey" FOREIGN KEY ("article_id") REFERENCES "wiki_articles"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "wiki_article_citations" ADD CONSTRAINT "wiki_article_citations_citation_id_fkey" FOREIGN KEY ("citation_id") REFERENCES "citations"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "comments" ADD CONSTRAINT "comments_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "comments" ADD CONSTRAINT "comments_parent_comment_id_fkey" FOREIGN KEY ("parent_comment_id") REFERENCES "comments"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "affiliate_price_history" ADD CONSTRAINT "affiliate_price_history_affiliate_link_id_fkey" FOREIGN KEY ("affiliate_link_id") REFERENCES "affiliate_links"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "affiliate_clicks" ADD CONSTRAINT "affiliate_clicks_affiliate_link_id_fkey" FOREIGN KEY ("affiliate_link_id") REFERENCES "affiliate_links"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "wishlist_items" ADD CONSTRAINT "wishlist_items_wishlist_id_fkey" FOREIGN KEY ("wishlist_id") REFERENCES "wishlists"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "wishlist_items" ADD CONSTRAINT "wishlist_items_device_variant_id_fkey" FOREIGN KEY ("device_variant_id") REFERENCES "device_variants"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "price_alerts" ADD CONSTRAINT "price_alerts_device_variant_id_fkey" FOREIGN KEY ("device_variant_id") REFERENCES "device_variants"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
