-- CPU specification metadata
ALTER TABLE "cpus"
  ADD COLUMN "microarchitecture" VARCHAR(120),
  ADD COLUMN "core_type" VARCHAR(60),
  ADD COLUMN "max_frequency_mhz" INTEGER,
  ADD COLUMN "min_frequency_mhz" INTEGER,
  ADD COLUMN "l1_instruction_cache" VARCHAR(80),
  ADD COLUMN "l1_data_cache" VARCHAR(80),
  ADD COLUMN "l2_cache" VARCHAR(80),
  ADD COLUMN "l3_cache" VARCHAR(80),
  ADD COLUMN "supports_64bit" BOOLEAN,
  ADD COLUMN "simd_extension" VARCHAR(120),
  ADD COLUMN "virtualization" BOOLEAN,
  ADD COLUMN "out_of_order" BOOLEAN,
  ADD COLUMN "smt" BOOLEAN;

ALTER TABLE "cpus"
  ADD CONSTRAINT "cpus_frequency_range_check"
  CHECK (
    "min_frequency_mhz" IS NULL
    OR "max_frequency_mhz" IS NULL
    OR "min_frequency_mhz" <= "max_frequency_mhz"
  );

-- GPU architecture, API, media, and display capabilities
ALTER TABLE "gpus"
  ADD COLUMN "gpu_generation" VARCHAR(80),
  ADD COLUMN "opengl_version" VARCHAR(40),
  ADD COLUMN "opencl_version" VARCHAR(40),
  ADD COLUMN "vulkan_version" VARCHAR(40),
  ADD COLUMN "directx_feature_level" VARCHAR(80),
  ADD COLUMN "metal_support" BOOLEAN,
  ADD COLUMN "cuda_support" BOOLEAN,
  ADD COLUMN "video_decode_codecs" TEXT,
  ADD COLUMN "video_encode_codecs" TEXT,
  ADD COLUMN "max_display_resolution" VARCHAR(40);

-- NPU identity and precision capabilities
ALTER TABLE "npus"
  ADD COLUMN "dedicated_npu" BOOLEAN NOT NULL DEFAULT true,
  ADD COLUMN "dsp_name" VARCHAR(120),
  ADD COLUMN "tensor_accelerator" VARCHAR(120),
  ADD COLUMN "supports_int8" BOOLEAN,
  ADD COLUMN "supports_fp16" BOOLEAN,
  ADD COLUMN "supports_fp32" BOOLEAN,
  ADD COLUMN "quantization" VARCHAR(160);

ALTER TABLE "npus"
  ADD CONSTRAINT "npus_dedicated_tops_check"
  CHECK (
    "dedicated_npu"
    OR (
      "tops" IS NULL
      AND "tops_int8" IS NULL
      AND "tops_int4" IS NULL
      AND "tops_fp16" IS NULL
    )
  );

-- Modem radio and telephony capabilities
ALTER TABLE "modems"
  ADD COLUMN "lte_category" VARCHAR(50),
  ADD COLUMN "supports_5g_nr" BOOLEAN,
  ADD COLUMN "carrier_aggregation" BOOLEAN,
  ADD COLUMN "volte" BOOLEAN,
  ADD COLUMN "vonr" BOOLEAN,
  ADD COLUMN "dual_sim_capability" VARCHAR(120),
  ADD COLUMN "supported_technologies" VARCHAR(300);

-- Reusable memory standard metadata
ALTER TABLE "memory_standards"
  ADD COLUMN "jedec_standard" VARCHAR(80),
  ADD COLUMN "prefetch" VARCHAR(40),
  ADD COLUMN "ecc" BOOLEAN,
  ADD COLUMN "dual_channel" BOOLEAN,
  ADD COLUMN "maximum_capacity_gb" INTEGER;

COMMENT ON COLUMN "variant_memory_configs"."speed_mhz" IS
  'Legacy device-level value. New records use the data-rate declared by memory_standards.';

-- Storage protocol capabilities. Historical performance columns remain read-only
-- until their values have been migrated to sourced benchmark records.
ALTER TABLE "storage_standards"
  ADD COLUMN "jedec_standard" VARCHAR(80),
  ADD COLUMN "interface" VARCHAR(100),
  ADD COLUMN "half_duplex" BOOLEAN,
  ADD COLUMN "full_duplex" BOOLEAN,
  ADD COLUMN "command_queue" BOOLEAN,
  ADD COLUMN "boot_partition" BOOLEAN,
  ADD COLUMN "rpmb" BOOLEAN,
  ADD COLUMN "trim" BOOLEAN,
  ADD COLUMN "secure_erase" BOOLEAN,
  ADD COLUMN "hs200" BOOLEAN,
  ADD COLUMN "hs400" BOOLEAN;

COMMENT ON COLUMN "storage_standards"."sequential_read_mbps" IS
  'Legacy unsourced performance value. New measurements belong in the benchmark module.';
COMMENT ON COLUMN "storage_standards"."sequential_write_mbps" IS
  'Legacy unsourced performance value. New measurements belong in the benchmark module.';
COMMENT ON COLUMN "storage_standards"."random_read_iops" IS
  'Legacy unsourced performance value. New measurements belong in the benchmark module.';
COMMENT ON COLUMN "storage_standards"."random_write_iops" IS
  'Legacy unsourced performance value. New measurements belong in the benchmark module.';

-- Wi-Fi and Bluetooth standard capabilities
ALTER TABLE "wireless_standards"
  ADD COLUMN "ieee_standard" VARCHAR(80),
  ADD COLUMN "marketing_name" VARCHAR(100),
  ADD COLUMN "frequency_bands" VARCHAR(120),
  ADD COLUMN "channel_width_mhz" INTEGER,
  ADD COLUMN "mu_mimo" BOOLEAN,
  ADD COLUMN "ofdma" BOOLEAN,
  ADD COLUMN "beamforming" BOOLEAN,
  ADD COLUMN "max_spatial_streams" INTEGER,
  ADD COLUMN "max_theoretical_throughput_mbps" INTEGER,
  ADD COLUMN "bluetooth_version" VARCHAR(40),
  ADD COLUMN "ble" BOOLEAN,
  ADD COLUMN "edr" BOOLEAN,
  ADD COLUMN "aptx" BOOLEAN,
  ADD COLUMN "aptx_hd" BOOLEAN,
  ADD COLUMN "aptx_adaptive" BOOLEAN,
  ADD COLUMN "ldac" BOOLEAN,
  ADD COLUMN "aac" BOOLEAN,
  ADD COLUMN "sbc" BOOLEAN,
  ADD COLUMN "lhdc" BOOLEAN;

UPDATE "wireless_standards"
SET "max_theoretical_throughput_mbps" = "max_speed_mbps"
WHERE "max_theoretical_throughput_mbps" IS NULL;

COMMENT ON COLUMN "wireless_standards"."max_speed_mbps" IS
  'Legacy alias. New records use max_theoretical_throughput_mbps.';

-- Connector and transport protocol capabilities
ALTER TABLE "port_standards"
  ADD COLUMN "usb_generation" VARCHAR(50),
  ADD COLUMN "connector_type" VARCHAR(60),
  ADD COLUMN "usb_pd" BOOLEAN,
  ADD COLUMN "usb_otg" BOOLEAN,
  ADD COLUMN "displayport_alt_mode" BOOLEAN,
  ADD COLUMN "hdmi_alt_mode" BOOLEAN,
  ADD COLUMN "thunderbolt" BOOLEAN,
  ADD COLUMN "usb4" BOOLEAN,
  ADD COLUMN "reversible_connector" BOOLEAN;

-- Operating-system family metadata; concrete releases stay in os_versions.
ALTER TABLE "operating_systems"
  ADD COLUMN "kernel_name" VARCHAR(100),
  ADD COLUMN "license_name" VARCHAR(120),
  ADD COLUMN "initial_release_date" DATE,
  ADD COLUMN "os_type" VARCHAR(60),
  ADD COLUMN "supported_architectures" VARCHAR(240);

-- Reusable sensor characteristics
ALTER TABLE "hardware_sensors"
  ADD COLUMN "measurement_unit" VARCHAR(40),
  ADD COLUMN "number_of_axes" INTEGER,
  ADD COLUMN "mems" BOOLEAN,
  ADD COLUMN "low_power" BOOLEAN,
  ADD COLUMN "typical_sampling_rate_hz" INTEGER,
  ADD COLUMN "typical_use_cases" TEXT;
