-- SpecHub catalog platform v3.
-- This migration is additive and keeps legacy text/URL columns readable while
-- all new admin writes use normalized relations and storage object metadata.

ALTER TABLE "media_assets"
    ALTER COLUMN "url" DROP NOT NULL,
    ADD COLUMN "storage_provider" VARCHAR(40),
    ADD COLUMN "storage_bucket" VARCHAR(120),
    ADD COLUMN "object_key" VARCHAR(1024),
    ADD COLUMN "original_filename" VARCHAR(255),
    ADD COLUMN "upload_status" VARCHAR(30) NOT NULL DEFAULT 'ready',
    ADD COLUMN "duration_ms" BIGINT,
    ADD COLUMN "checksum_sha256" VARCHAR(64);

ALTER TABLE "device_models"
    ADD COLUMN "summary" VARCHAR(600);

ALTER TABLE "cpus"
    ADD COLUMN "process_node_id" UUID,
    ADD COLUMN "codename" VARCHAR(120);

ALTER TABLE "gpus"
    ADD COLUMN "process_node_id" UUID;

ALTER TABLE "npus"
    ADD COLUMN "process_node_id" UUID,
    ADD COLUMN "tops_int8" DECIMAL(8,2),
    ADD COLUMN "ai_engine_version" VARCHAR(80);

ALTER TABLE "camera_sensors"
    ADD COLUMN "sensor_width_mm" DECIMAL(6,3),
    ADD COLUMN "sensor_height_mm" DECIMAL(6,3);

ALTER TABLE "camera_modules"
    ADD COLUMN "has_eis" BOOLEAN;

ALTER TABLE "display_units"
    ADD COLUMN "ltpo_version" VARCHAR(40);

CREATE UNIQUE INDEX "media_assets_storage_provider_storage_bucket_object_key_key"
    ON "media_assets"("storage_provider", "storage_bucket", "object_key");
CREATE INDEX "media_assets_upload_status_idx"
    ON "media_assets"("upload_status");
CREATE INDEX "cpus_process_node_id_idx" ON "cpus"("process_node_id");
CREATE INDEX "gpus_process_node_id_idx" ON "gpus"("process_node_id");
CREATE INDEX "npus_process_node_id_idx" ON "npus"("process_node_id");

ALTER TABLE "cpus"
    ADD CONSTRAINT "cpus_process_node_id_fkey"
    FOREIGN KEY ("process_node_id") REFERENCES "process_nodes"("id")
    ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "gpus"
    ADD CONSTRAINT "gpus_process_node_id_fkey"
    FOREIGN KEY ("process_node_id") REFERENCES "process_nodes"("id")
    ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "npus"
    ADD CONSTRAINT "npus_process_node_id_fkey"
    FOREIGN KEY ("process_node_id") REFERENCES "process_nodes"("id")
    ON DELETE SET NULL ON UPDATE CASCADE;

CREATE TABLE "device_model_aliases" (
    "id" UUID NOT NULL,
    "device_model_id" UUID NOT NULL,
    "alias" VARCHAR(180) NOT NULL,
    "alias_type" VARCHAR(30) NOT NULL DEFAULT 'alias',
    "normalized_alias" VARCHAR(180) NOT NULL,
    "region_code" VARCHAR(20) NOT NULL DEFAULT '',
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "device_model_aliases_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "device_model_aliases_device_model_id_normalized_alias_region_key"
    ON "device_model_aliases"("device_model_id", "normalized_alias", "region_code");
CREATE INDEX "device_model_aliases_normalized_alias_idx"
    ON "device_model_aliases"("normalized_alias");
ALTER TABLE "device_model_aliases"
    ADD CONSTRAINT "device_model_aliases_device_model_id_fkey"
    FOREIGN KEY ("device_model_id") REFERENCES "device_models"("id")
    ON DELETE CASCADE ON UPDATE CASCADE;

CREATE TABLE "device_editorial_sections" (
    "id" UUID NOT NULL,
    "device_model_id" UUID NOT NULL,
    "section_key" VARCHAR(40) NOT NULL,
    "title" VARCHAR(160) NOT NULL,
    "body_markdown" TEXT NOT NULL,
    "display_order" INTEGER NOT NULL DEFAULT 0,
    "is_published" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,
    CONSTRAINT "device_editorial_sections_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "device_editorial_sections_device_model_id_section_key_key"
    ON "device_editorial_sections"("device_model_id", "section_key");
CREATE INDEX "device_editorial_sections_device_model_id_is_published_display_idx"
    ON "device_editorial_sections"("device_model_id", "is_published", "display_order");
ALTER TABLE "device_editorial_sections"
    ADD CONSTRAINT "device_editorial_sections_device_model_id_fkey"
    FOREIGN KEY ("device_model_id") REFERENCES "device_models"("id")
    ON DELETE CASCADE ON UPDATE CASCADE;

CREATE TABLE "cpu_capabilities" (
    "id" UUID NOT NULL,
    "code" VARCHAR(80) NOT NULL,
    "name" VARCHAR(120) NOT NULL,
    "capability_type" VARCHAR(30) NOT NULL,
    "description" TEXT,
    CONSTRAINT "cpu_capabilities_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "cpu_capabilities_code_key" ON "cpu_capabilities"("code");
CREATE INDEX "cpu_capabilities_capability_type_idx"
    ON "cpu_capabilities"("capability_type");

CREATE TABLE "cpu_capability_links" (
    "id" UUID NOT NULL,
    "cpu_id" UUID NOT NULL,
    "cpu_capability_id" UUID NOT NULL,
    "version" VARCHAR(40),
    "notes" TEXT,
    CONSTRAINT "cpu_capability_links_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "cpu_capability_links_cpu_id_cpu_capability_id_key"
    ON "cpu_capability_links"("cpu_id", "cpu_capability_id");
CREATE INDEX "cpu_capability_links_cpu_capability_id_idx"
    ON "cpu_capability_links"("cpu_capability_id");
ALTER TABLE "cpu_capability_links"
    ADD CONSTRAINT "cpu_capability_links_cpu_id_fkey"
    FOREIGN KEY ("cpu_id") REFERENCES "cpus"("id")
    ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "cpu_capability_links"
    ADD CONSTRAINT "cpu_capability_links_cpu_capability_id_fkey"
    FOREIGN KEY ("cpu_capability_id") REFERENCES "cpu_capabilities"("id")
    ON DELETE RESTRICT ON UPDATE CASCADE;

CREATE TABLE "gpu_apis" (
    "id" UUID NOT NULL,
    "name" VARCHAR(80) NOT NULL,
    "slug" VARCHAR(100) NOT NULL,
    "api_type" VARCHAR(30) NOT NULL,
    "description" TEXT,
    CONSTRAINT "gpu_apis_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "gpu_apis_slug_key" ON "gpu_apis"("slug");
CREATE INDEX "gpu_apis_api_type_idx" ON "gpu_apis"("api_type");

CREATE TABLE "gpu_api_support" (
    "id" UUID NOT NULL,
    "gpu_id" UUID NOT NULL,
    "gpu_api_id" UUID NOT NULL,
    "version" VARCHAR(40),
    "feature_level" VARCHAR(80),
    "notes" TEXT,
    CONSTRAINT "gpu_api_support_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "gpu_api_support_gpu_id_gpu_api_id_version_key"
    ON "gpu_api_support"("gpu_id", "gpu_api_id", "version");
CREATE INDEX "gpu_api_support_gpu_api_id_idx"
    ON "gpu_api_support"("gpu_api_id");
ALTER TABLE "gpu_api_support"
    ADD CONSTRAINT "gpu_api_support_gpu_id_fkey"
    FOREIGN KEY ("gpu_id") REFERENCES "gpus"("id")
    ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "gpu_api_support"
    ADD CONSTRAINT "gpu_api_support_gpu_api_id_fkey"
    FOREIGN KEY ("gpu_api_id") REFERENCES "gpu_apis"("id")
    ON DELETE RESTRICT ON UPDATE CASCADE;

CREATE TABLE "npu_precision_capabilities" (
    "id" UUID NOT NULL,
    "npu_id" UUID NOT NULL,
    "precision" VARCHAR(20) NOT NULL,
    "tops" DECIMAL(8,2),
    "sparsity_mode" VARCHAR(40),
    "notes" TEXT,
    CONSTRAINT "npu_precision_capabilities_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "npu_precision_capabilities_npu_id_precision_sparsity_key"
    ON "npu_precision_capabilities"("npu_id", "precision", "sparsity_mode");
CREATE INDEX "npu_precision_capabilities_precision_idx"
    ON "npu_precision_capabilities"("precision");
ALTER TABLE "npu_precision_capabilities"
    ADD CONSTRAINT "npu_precision_capabilities_npu_id_fkey"
    FOREIGN KEY ("npu_id") REFERENCES "npus"("id")
    ON DELETE CASCADE ON UPDATE CASCADE;

CREATE TABLE "camera_features" (
    "id" UUID NOT NULL,
    "code" VARCHAR(80) NOT NULL,
    "name" VARCHAR(120) NOT NULL,
    "feature_category" VARCHAR(40) NOT NULL,
    "description" TEXT,
    CONSTRAINT "camera_features_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "camera_features_code_key" ON "camera_features"("code");
CREATE INDEX "camera_features_feature_category_idx"
    ON "camera_features"("feature_category");

CREATE TABLE "camera_module_feature_links" (
    "id" UUID NOT NULL,
    "camera_module_id" UUID NOT NULL,
    "camera_feature_id" UUID NOT NULL,
    "notes" TEXT,
    CONSTRAINT "camera_module_feature_links_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "camera_module_feature_links_camera_module_id_feature_id_key"
    ON "camera_module_feature_links"("camera_module_id", "camera_feature_id");
CREATE INDEX "camera_module_feature_links_camera_feature_id_idx"
    ON "camera_module_feature_links"("camera_feature_id");
ALTER TABLE "camera_module_feature_links"
    ADD CONSTRAINT "camera_module_feature_links_camera_module_id_fkey"
    FOREIGN KEY ("camera_module_id") REFERENCES "camera_modules"("id")
    ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "camera_module_feature_links"
    ADD CONSTRAINT "camera_module_feature_links_camera_feature_id_fkey"
    FOREIGN KEY ("camera_feature_id") REFERENCES "camera_features"("id")
    ON DELETE RESTRICT ON UPDATE CASCADE;

CREATE TABLE "camera_video_modes" (
    "id" UUID NOT NULL,
    "name" VARCHAR(120) NOT NULL,
    "slug" VARCHAR(140) NOT NULL,
    "resolution_width" INTEGER NOT NULL,
    "resolution_height" INTEGER NOT NULL,
    "frame_rate_fps" INTEGER NOT NULL,
    "mode_type" VARCHAR(30) NOT NULL DEFAULT 'standard',
    "hdr_standard" VARCHAR(80),
    "codec" VARCHAR(40),
    "bit_depth" INTEGER,
    "description" TEXT,
    CONSTRAINT "camera_video_modes_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "camera_video_modes_slug_key" ON "camera_video_modes"("slug");
CREATE INDEX "camera_video_modes_resolution_fps_idx"
    ON "camera_video_modes"("resolution_width", "resolution_height", "frame_rate_fps");

CREATE TABLE "camera_module_video_modes" (
    "id" UUID NOT NULL,
    "camera_module_id" UUID NOT NULL,
    "camera_video_mode_id" UUID NOT NULL,
    "has_stabilization" BOOLEAN,
    "notes" TEXT,
    CONSTRAINT "camera_module_video_modes_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "camera_module_video_modes_camera_module_id_video_mode_id_key"
    ON "camera_module_video_modes"("camera_module_id", "camera_video_mode_id");
CREATE INDEX "camera_module_video_modes_camera_video_mode_id_idx"
    ON "camera_module_video_modes"("camera_video_mode_id");
ALTER TABLE "camera_module_video_modes"
    ADD CONSTRAINT "camera_module_video_modes_camera_module_id_fkey"
    FOREIGN KEY ("camera_module_id") REFERENCES "camera_modules"("id")
    ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "camera_module_video_modes"
    ADD CONSTRAINT "camera_module_video_modes_camera_video_mode_id_fkey"
    FOREIGN KEY ("camera_video_mode_id") REFERENCES "camera_video_modes"("id")
    ON DELETE RESTRICT ON UPDATE CASCADE;

CREATE TABLE "hdr_standards" (
    "id" UUID NOT NULL,
    "name" VARCHAR(80) NOT NULL,
    "slug" VARCHAR(100) NOT NULL,
    "description" TEXT,
    CONSTRAINT "hdr_standards_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "hdr_standards_name_key" ON "hdr_standards"("name");
CREATE UNIQUE INDEX "hdr_standards_slug_key" ON "hdr_standards"("slug");

CREATE TABLE "display_hdr_support" (
    "id" UUID NOT NULL,
    "display_unit_id" UUID NOT NULL,
    "hdr_standard_id" UUID NOT NULL,
    "certification" VARCHAR(120),
    "notes" TEXT,
    CONSTRAINT "display_hdr_support_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "display_hdr_support_display_unit_id_hdr_standard_id_key"
    ON "display_hdr_support"("display_unit_id", "hdr_standard_id");
CREATE INDEX "display_hdr_support_hdr_standard_id_idx"
    ON "display_hdr_support"("hdr_standard_id");
ALTER TABLE "display_hdr_support"
    ADD CONSTRAINT "display_hdr_support_display_unit_id_fkey"
    FOREIGN KEY ("display_unit_id") REFERENCES "display_units"("id")
    ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "display_hdr_support"
    ADD CONSTRAINT "display_hdr_support_hdr_standard_id_fkey"
    FOREIGN KEY ("hdr_standard_id") REFERENCES "hdr_standards"("id")
    ON DELETE RESTRICT ON UPDATE CASCADE;

CREATE TABLE "color_gamuts" (
    "id" UUID NOT NULL,
    "name" VARCHAR(80) NOT NULL,
    "slug" VARCHAR(100) NOT NULL,
    "description" TEXT,
    CONSTRAINT "color_gamuts_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "color_gamuts_name_key" ON "color_gamuts"("name");
CREATE UNIQUE INDEX "color_gamuts_slug_key" ON "color_gamuts"("slug");

CREATE TABLE "display_color_gamut_support" (
    "id" UUID NOT NULL,
    "display_unit_id" UUID NOT NULL,
    "color_gamut_id" UUID NOT NULL,
    "coverage_percent" DECIMAL(5,2),
    "volume_percent" DECIMAL(5,2),
    "notes" TEXT,
    CONSTRAINT "display_color_gamut_support_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "display_color_gamut_support_display_unit_id_gamut_id_key"
    ON "display_color_gamut_support"("display_unit_id", "color_gamut_id");
CREATE INDEX "display_color_gamut_support_color_gamut_id_idx"
    ON "display_color_gamut_support"("color_gamut_id");
ALTER TABLE "display_color_gamut_support"
    ADD CONSTRAINT "display_color_gamut_support_display_unit_id_fkey"
    FOREIGN KEY ("display_unit_id") REFERENCES "display_units"("id")
    ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "display_color_gamut_support"
    ADD CONSTRAINT "display_color_gamut_support_color_gamut_id_fkey"
    FOREIGN KEY ("color_gamut_id") REFERENCES "color_gamuts"("id")
    ON DELETE RESTRICT ON UPDATE CASCADE;

CREATE TABLE "charging_protocols" (
    "id" UUID NOT NULL,
    "name" VARCHAR(100) NOT NULL,
    "slug" VARCHAR(120) NOT NULL,
    "protocol_type" VARCHAR(30) NOT NULL,
    "version" VARCHAR(40),
    "max_power_w" DECIMAL(7,2),
    "description" TEXT,
    CONSTRAINT "charging_protocols_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "charging_protocols_slug_key" ON "charging_protocols"("slug");
CREATE INDEX "charging_protocols_protocol_type_idx"
    ON "charging_protocols"("protocol_type");

CREATE TABLE "battery_charging_protocols" (
    "id" UUID NOT NULL,
    "battery_unit_id" UUID NOT NULL,
    "charging_protocol_id" UUID NOT NULL,
    "max_power_w" DECIMAL(7,2),
    "is_reverse" BOOLEAN NOT NULL DEFAULT false,
    "notes" TEXT,
    CONSTRAINT "battery_charging_protocols_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "battery_charging_protocols_battery_protocol_reverse_key"
    ON "battery_charging_protocols"("battery_unit_id", "charging_protocol_id", "is_reverse");
CREATE INDEX "battery_charging_protocols_charging_protocol_id_idx"
    ON "battery_charging_protocols"("charging_protocol_id");
ALTER TABLE "battery_charging_protocols"
    ADD CONSTRAINT "battery_charging_protocols_battery_unit_id_fkey"
    FOREIGN KEY ("battery_unit_id") REFERENCES "battery_units"("id")
    ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "battery_charging_protocols"
    ADD CONSTRAINT "battery_charging_protocols_charging_protocol_id_fkey"
    FOREIGN KEY ("charging_protocol_id") REFERENCES "charging_protocols"("id")
    ON DELETE RESTRICT ON UPDATE CASCADE;

CREATE TABLE "connectivity_features" (
    "id" UUID NOT NULL,
    "code" VARCHAR(80) NOT NULL,
    "name" VARCHAR(120) NOT NULL,
    "feature_category" VARCHAR(40) NOT NULL,
    "description" TEXT,
    CONSTRAINT "connectivity_features_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "connectivity_features_code_key"
    ON "connectivity_features"("code");
CREATE INDEX "connectivity_features_feature_category_idx"
    ON "connectivity_features"("feature_category");

CREATE TABLE "variant_connectivity_support" (
    "id" UUID NOT NULL,
    "device_variant_id" UUID NOT NULL,
    "connectivity_feature_id" UUID NOT NULL,
    "version" VARCHAR(40),
    "is_supported" BOOLEAN NOT NULL DEFAULT true,
    "notes" TEXT,
    CONSTRAINT "variant_connectivity_support_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "variant_connectivity_support_variant_feature_key"
    ON "variant_connectivity_support"("device_variant_id", "connectivity_feature_id");
CREATE INDEX "variant_connectivity_support_feature_supported_idx"
    ON "variant_connectivity_support"("connectivity_feature_id", "is_supported");
ALTER TABLE "variant_connectivity_support"
    ADD CONSTRAINT "variant_connectivity_support_device_variant_id_fkey"
    FOREIGN KEY ("device_variant_id") REFERENCES "device_variants"("id")
    ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "variant_connectivity_support"
    ADD CONSTRAINT "variant_connectivity_support_connectivity_feature_id_fkey"
    FOREIGN KEY ("connectivity_feature_id") REFERENCES "connectivity_features"("id")
    ON DELETE RESTRICT ON UPDATE CASCADE;

CREATE TABLE "variant_software_profiles" (
    "device_variant_id" UUID NOT NULL,
    "launch_os_version_id" UUID,
    "current_os_version_id" UUID,
    "highest_official_version_id" UUID,
    "ui_layer_version_id" UUID,
    "security_patch_date" DATE,
    "promised_major_updates" INTEGER,
    "promised_security_years" INTEGER,
    "bootloader_status" VARCHAR(30),
    "root_status" VARCHAR(30),
    "last_verified_at" TIMESTAMPTZ(6),
    "notes" TEXT,
    CONSTRAINT "variant_software_profiles_pkey" PRIMARY KEY ("device_variant_id")
);
CREATE INDEX "variant_software_profiles_launch_os_version_id_idx"
    ON "variant_software_profiles"("launch_os_version_id");
CREATE INDEX "variant_software_profiles_current_os_version_id_idx"
    ON "variant_software_profiles"("current_os_version_id");
CREATE INDEX "variant_software_profiles_highest_official_version_id_idx"
    ON "variant_software_profiles"("highest_official_version_id");
ALTER TABLE "variant_software_profiles"
    ADD CONSTRAINT "variant_software_profiles_device_variant_id_fkey"
    FOREIGN KEY ("device_variant_id") REFERENCES "device_variants"("id")
    ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "variant_software_profiles"
    ADD CONSTRAINT "variant_software_profiles_launch_os_version_id_fkey"
    FOREIGN KEY ("launch_os_version_id") REFERENCES "os_versions"("id")
    ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "variant_software_profiles"
    ADD CONSTRAINT "variant_software_profiles_current_os_version_id_fkey"
    FOREIGN KEY ("current_os_version_id") REFERENCES "os_versions"("id")
    ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "variant_software_profiles"
    ADD CONSTRAINT "variant_software_profiles_highest_official_version_id_fkey"
    FOREIGN KEY ("highest_official_version_id") REFERENCES "os_versions"("id")
    ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "variant_software_profiles"
    ADD CONSTRAINT "variant_software_profiles_ui_layer_version_id_fkey"
    FOREIGN KEY ("ui_layer_version_id") REFERENCES "os_ui_layer_versions"("id")
    ON DELETE RESTRICT ON UPDATE CASCADE;

CREATE TABLE "scoring_profiles" (
    "id" UUID NOT NULL,
    "device_category_id" UUID NOT NULL,
    "name" VARCHAR(120) NOT NULL,
    "version" INTEGER NOT NULL DEFAULT 1,
    "status" VARCHAR(30) NOT NULL DEFAULT 'draft',
    "effective_from" TIMESTAMPTZ(6),
    "created_by_user_id" UUID,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,
    CONSTRAINT "scoring_profiles_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "scoring_profiles_version_check" CHECK ("version" > 0)
);
CREATE UNIQUE INDEX "scoring_profiles_device_category_id_version_key"
    ON "scoring_profiles"("device_category_id", "version");
CREATE INDEX "scoring_profiles_category_status_effective_idx"
    ON "scoring_profiles"("device_category_id", "status", "effective_from");
ALTER TABLE "scoring_profiles"
    ADD CONSTRAINT "scoring_profiles_device_category_id_fkey"
    FOREIGN KEY ("device_category_id") REFERENCES "device_categories"("id")
    ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "scoring_profiles"
    ADD CONSTRAINT "scoring_profiles_created_by_user_id_fkey"
    FOREIGN KEY ("created_by_user_id") REFERENCES "users"("id")
    ON DELETE SET NULL ON UPDATE CASCADE;

CREATE TABLE "scoring_profile_modules" (
    "id" UUID NOT NULL,
    "scoring_profile_id" UUID NOT NULL,
    "module_key" VARCHAR(60) NOT NULL,
    "label" VARCHAR(120) NOT NULL,
    "description" TEXT,
    "weight_percent" DECIMAL(5,2) NOT NULL,
    "display_order" INTEGER NOT NULL DEFAULT 0,
    CONSTRAINT "scoring_profile_modules_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "scoring_profile_modules_weight_check"
        CHECK ("weight_percent" >= 0 AND "weight_percent" <= 100)
);
CREATE UNIQUE INDEX "scoring_profile_modules_profile_id_module_key_key"
    ON "scoring_profile_modules"("scoring_profile_id", "module_key");
CREATE INDEX "scoring_profile_modules_profile_id_display_order_idx"
    ON "scoring_profile_modules"("scoring_profile_id", "display_order");
ALTER TABLE "scoring_profile_modules"
    ADD CONSTRAINT "scoring_profile_modules_scoring_profile_id_fkey"
    FOREIGN KEY ("scoring_profile_id") REFERENCES "scoring_profiles"("id")
    ON DELETE CASCADE ON UPDATE CASCADE;

CREATE TABLE "scoring_profile_metrics" (
    "id" UUID NOT NULL,
    "scoring_profile_module_id" UUID NOT NULL,
    "metric_key" VARCHAR(80) NOT NULL,
    "label" VARCHAR(120) NOT NULL,
    "weight_percent" DECIMAL(5,2) NOT NULL,
    "min_value" DECIMAL(14,4) NOT NULL,
    "max_value" DECIMAL(14,4) NOT NULL,
    "direction" VARCHAR(20) NOT NULL DEFAULT 'higher',
    "scale" VARCHAR(20) NOT NULL DEFAULT 'linear',
    "unit" VARCHAR(40),
    "display_order" INTEGER NOT NULL DEFAULT 0,
    CONSTRAINT "scoring_profile_metrics_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "scoring_profile_metrics_weight_check"
        CHECK ("weight_percent" >= 0 AND "weight_percent" <= 100),
    CONSTRAINT "scoring_profile_metrics_range_check"
        CHECK ("max_value" > "min_value")
);
CREATE UNIQUE INDEX "scoring_profile_metrics_module_id_metric_key_key"
    ON "scoring_profile_metrics"("scoring_profile_module_id", "metric_key");
CREATE INDEX "scoring_profile_metrics_module_id_display_order_idx"
    ON "scoring_profile_metrics"("scoring_profile_module_id", "display_order");
ALTER TABLE "scoring_profile_metrics"
    ADD CONSTRAINT "scoring_profile_metrics_scoring_profile_module_id_fkey"
    FOREIGN KEY ("scoring_profile_module_id") REFERENCES "scoring_profile_modules"("id")
    ON DELETE CASCADE ON UPDATE CASCADE;

CREATE TABLE "catalog_drafts" (
    "id" UUID NOT NULL,
    "draft_type" VARCHAR(40) NOT NULL,
    "entity_table" VARCHAR(80),
    "entity_id" VARCHAR(64),
    "owner_user_id" UUID NOT NULL,
    "title" VARCHAR(200) NOT NULL,
    "step_key" VARCHAR(40) NOT NULL DEFAULT 'general',
    "status" VARCHAR(30) NOT NULL DEFAULT 'draft',
    "revision" INTEGER NOT NULL DEFAULT 1,
    "payload" JSONB NOT NULL,
    "validation_errors" JSONB,
    "last_autosaved_at" TIMESTAMPTZ(6),
    "published_at" TIMESTAMPTZ(6),
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,
    CONSTRAINT "catalog_drafts_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "catalog_drafts_revision_check" CHECK ("revision" > 0)
);
CREATE INDEX "catalog_drafts_owner_status_updated_at_idx"
    ON "catalog_drafts"("owner_user_id", "status", "updated_at");
CREATE INDEX "catalog_drafts_entity_table_entity_id_idx"
    ON "catalog_drafts"("entity_table", "entity_id");
ALTER TABLE "catalog_drafts"
    ADD CONSTRAINT "catalog_drafts_owner_user_id_fkey"
    FOREIGN KEY ("owner_user_id") REFERENCES "users"("id")
    ON DELETE RESTRICT ON UPDATE CASCADE;

CREATE TABLE "catalog_draft_versions" (
    "id" UUID NOT NULL,
    "catalog_draft_id" UUID NOT NULL,
    "revision" INTEGER NOT NULL,
    "actor_user_id" UUID,
    "payload" JSONB NOT NULL,
    "change_summary" VARCHAR(300),
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "catalog_draft_versions_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "catalog_draft_versions_draft_id_revision_key"
    ON "catalog_draft_versions"("catalog_draft_id", "revision");
CREATE INDEX "catalog_draft_versions_actor_user_id_created_at_idx"
    ON "catalog_draft_versions"("actor_user_id", "created_at");
ALTER TABLE "catalog_draft_versions"
    ADD CONSTRAINT "catalog_draft_versions_catalog_draft_id_fkey"
    FOREIGN KEY ("catalog_draft_id") REFERENCES "catalog_drafts"("id")
    ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "catalog_draft_versions"
    ADD CONSTRAINT "catalog_draft_versions_actor_user_id_fkey"
    FOREIGN KEY ("actor_user_id") REFERENCES "users"("id")
    ON DELETE SET NULL ON UPDATE CASCADE;

CREATE TABLE "catalog_entity_versions" (
    "id" UUID NOT NULL,
    "entity_table" VARCHAR(80) NOT NULL,
    "entity_id" VARCHAR(64) NOT NULL,
    "version" INTEGER NOT NULL,
    "actor_user_id" UUID,
    "action" VARCHAR(30) NOT NULL,
    "snapshot" JSONB NOT NULL,
    "change_set" JSONB,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "catalog_entity_versions_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "catalog_entity_versions_table_entity_version_key"
    ON "catalog_entity_versions"("entity_table", "entity_id", "version");
CREATE INDEX "catalog_entity_versions_table_entity_created_at_idx"
    ON "catalog_entity_versions"("entity_table", "entity_id", "created_at");
CREATE INDEX "catalog_entity_versions_actor_created_at_idx"
    ON "catalog_entity_versions"("actor_user_id", "created_at");
ALTER TABLE "catalog_entity_versions"
    ADD CONSTRAINT "catalog_entity_versions_actor_user_id_fkey"
    FOREIGN KEY ("actor_user_id") REFERENCES "users"("id")
    ON DELETE SET NULL ON UPDATE CASCADE;
