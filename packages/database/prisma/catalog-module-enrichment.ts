import type { PrismaClient } from "../generated/client";

export const MODULE_SPEC_FIELDS = {
  chipset: [
    "chip_kind",
    "model_code",
    "supports_64bit",
    "integrated_5g",
    "integrated_wifi",
    "max_ram_gb",
    "max_display_resolution",
    "max_camera_mp",
    "announcement_date",
    "release_date",
    "cpus",
    "gpus",
    "npus",
    "modems",
  ],
  cpu: [
    "core_count",
    "thread_count",
    "big_little",
    "isa_name",
    "microarchitecture",
    "core_type",
    "max_frequency_mhz",
    "min_frequency_mhz",
    "l1_instruction_cache",
    "l1_data_cache",
    "l2_cache",
    "l3_cache",
    "supports_64bit",
    "simd_extension",
    "virtualization",
    "out_of_order",
    "smt",
    "architecture",
    "clusters",
    "chipsets",
  ],
  gpu: [
    "shader_units",
    "compute_units",
    "clock_mhz",
    "fp32_gflops",
    "ray_tracing_support",
    "api_support",
    "gpu_generation",
    "opengl_version",
    "opencl_version",
    "vulkan_version",
    "directx_feature_level",
    "metal_support",
    "cuda_support",
    "video_decode_codecs",
    "video_encode_codecs",
    "max_display_resolution",
    "architecture",
    "chipsets",
  ],
  npu: [
    "tops",
    "tops_int8",
    "tops_int4",
    "tops_fp16",
    "dedicated_npu",
    "dsp_name",
    "ai_engine_version",
    "tensor_accelerator",
    "supports_int8",
    "supports_fp16",
    "supports_fp32",
    "quantization",
    "architecture",
    "chipsets",
  ],
  modem: [
    "max_downlink_mbps",
    "max_uplink_mbps",
    "supports_mmwave",
    "supports_satellite",
    "supported_5g_modes",
    "lte_category",
    "supports_5g_nr",
    "carrier_aggregation",
    "volte",
    "vonr",
    "dual_sim_capability",
    "supported_technologies",
    "chipsets",
  ],
  "memory-standard": [
    "memory_type",
    "generation",
    "max_data_rate_mtps",
    "typical_data_rate_mtps",
    "jedec_standard",
    "prefetch",
    "ecc",
    "dual_channel",
    "voltage",
    "bandwidth_gbps",
    "channel_width_bits",
    "maximum_capacity_gb",
    "is_mobile",
    "release_year",
  ],
  "storage-standard": [
    "storage_type",
    "generation",
    "jedec_standard",
    "interface",
    "half_duplex",
    "full_duplex",
    "command_queue",
    "boot_partition",
    "rpmb",
    "trim",
    "secure_erase",
    "hs200",
    "hs400",
    "release_year",
  ],
  "operating-system": [
    "os_family",
    "kernel_type",
    "kernel_name",
    "license_name",
    "is_open_source",
    "initial_release_date",
    "os_type",
    "supported_architectures",
    "versions",
  ],
  camera: [
    "role",
    "effective_megapixel",
    "aperture",
    "focal_length_mm_eq",
    "focal_length_mm_native",
    "optical_zoom",
    "digital_zoom_max",
    "has_ois",
    "has_eis",
    "ois_type",
    "has_af",
    "af_system",
    "field_of_view_deg",
    "video_capabilities",
    "has_macro",
  ],
  display: [
    "technology",
    "size_inch",
    "aspect_ratio",
    "resolution_width",
    "resolution_height",
    "pixel_density_ppi",
    "refresh_rate_hz",
    "refresh_rate_min_hz",
    "ltpo_version",
    "touch_sampling_hz",
    "brightness_typical_nits",
    "brightness_hbm_nits",
    "brightness_peak_nits",
    "contrast_ratio",
    "color_depth_bits",
    "color_gamut",
    "hdr_formats",
    "protection_glass",
    "has_always_on",
    "has_dc_dimming",
    "pwm_frequency_hz",
  ],
  battery: [
    "chemistry",
    "capacity_mah",
    "rated_capacity_mah",
    "energy_wh",
    "voltage_nominal_v",
    "cell_count",
    "cycle_life",
    "wired_charging_w",
    "wired_charging_protocol",
    "wireless_charging_w",
    "wireless_charging_protocol",
    "reverse_wired_charging_w",
    "reverse_wireless_charging_w",
    "removable",
  ],
} as const;

export type ModuleKind = keyof typeof MODULE_SPEC_FIELDS;
export type FieldCoverageStatus =
  | "populated"
  | "derived"
  | "not_disclosed"
  | "not_applicable";

type MutableModule = Record<string, any> & {
  id: string;
  slug: string | null;
  name?: string | null;
  description?: string | null;
};

type EnrichmentResult = {
  updatedModules: number;
  coverageRows: number;
  statusCounts: Record<FieldCoverageStatus, number>;
};

const OFFICIAL_SOURCES: Record<string, string> = {
  "snapdragon-8-elite":
    "https://www.qualcomm.com/smartphones/products/8-series/snapdragon-8-elite-mobile-platform",
  "qualcomm-oryon-8-elite-cpu":
    "https://www.qualcomm.com/smartphones/products/8-series/snapdragon-8-elite-mobile-platform",
  "snapdragon-8-elite-integrated-5g-modem":
    "https://www.qualcomm.com/smartphones/products/8-series/snapdragon-8-elite-mobile-platform",
  "snapdragon-x80-5g-modem":
    "https://www.qualcomm.com/products/technology/modems/snapdragon-x80-5g-modem-rf-system",
  "mediatek-dimensity-9300-plus":
    "https://www.mediatek.com/products/smartphones/mediatek-dimensity-9300-plus",
  "mediatek-dimensity-9300-plus-cpu":
    "https://www.mediatek.com/products/smartphones/mediatek-dimensity-9300-plus",
  "mediatek-dimensity-9300-plus-integrated-5g-modem":
    "https://www.mediatek.com/products/smartphones/mediatek-dimensity-9300-plus",
  "amd-ryzen-ai-9-hx-370":
    "https://www.amd.com/en/products/processors/laptop/ryzen/ai-300-series/amd-ryzen-ai-9-hx-370.html",
  "amd-ryzen-ai-9-hx-370-cpu":
    "https://www.amd.com/en/products/processors/laptop/ryzen/ai-300-series/amd-ryzen-ai-9-hx-370.html",
  "amd-radeon-890m":
    "https://www.amd.com/en/products/processors/laptop/ryzen/ai-300-series/amd-ryzen-ai-9-hx-370.html",
  "intel-core-ultra-7-258v":
    "https://www.intel.com/content/www/us/en/products/sku/240957/intel-core-ultra-7-processor-258v-12m-cache-up-to-4-80-ghz/specifications.html",
  "intel-core-ultra-7-258v-cpu":
    "https://www.intel.com/content/www/us/en/products/sku/240957/intel-core-ultra-7-processor-258v-12m-cache-up-to-4-80-ghz/specifications.html",
  "intel-arc-140v":
    "https://www.intel.com/content/www/us/en/products/sku/240957/intel-core-ultra-7-processor-258v-12m-cache-up-to-4-80-ghz/specifications.html",
  "intel-core-ultra-7-258v-ai-engine":
    "https://www.intel.com/content/www/us/en/products/sku/240957/intel-core-ultra-7-processor-258v-12m-cache-up-to-4-80-ghz/specifications.html",
  "amd-ryzen-7-8845hs-ai-engine":
    "https://www.amd.com/en/products/processors/laptop/ryzen/8000-series/amd-ryzen-7-8845hs.html",
  "amd-ryzen-ai-9-hx-370-ai-engine":
    "https://www.amd.com/en/products/processors/laptop/ryzen/ai-300-series/amd-ryzen-ai-9-hx-370.html",
  "apple-m4-ai-engine": "https://www.apple.com/newsroom/2024/05/apple-introduces-m4-chip/",
  "apple-m4-max-ai-engine":
    "https://www.apple.com/newsroom/2024/10/apple-introduces-m4-pro-and-m4-max/",
  "apple-neural-engine-m4": "https://www.apple.com/newsroom/2024/05/apple-introduces-m4-chip/",
  "android-15": "https://source.android.com/docs/core/architecture/kernel",
};

const CPU_EXACT: Record<string, Record<string, unknown>> = {
  "amd-ryzen-7-8845hs-cpu": {
    microarchitecture: "Zen 4",
    max_frequency_mhz: 5100,
    min_frequency_mhz: 3800,
    l2_cache: "8 MB",
    l3_cache: "16 MB",
  },
  "amd-ryzen-ai-9-hx-370-cpu": {
    microarchitecture: "Zen 5 / Zen 5c",
    max_frequency_mhz: 5100,
    min_frequency_mhz: 2000,
    l2_cache: "12 MB",
    l3_cache: "24 MB",
  },
  "intel-core-ultra-7-155h-cpu": {
    microarchitecture: "Meteor Lake",
    max_frequency_mhz: 4800,
  },
  "intel-core-ultra-7-258v-cpu": {
    microarchitecture: "Lunar Lake",
    max_frequency_mhz: 4800,
    min_frequency_mhz: 2200,
    l3_cache: "12 MB Intel Smart Cache",
  },
  "intel-core-ultra-9-185h-cpu": {
    microarchitecture: "Meteor Lake",
    max_frequency_mhz: 5100,
  },
  "intel-core-ultra-9-285hx-cpu": {
    microarchitecture: "Arrow Lake HX",
    max_frequency_mhz: 5500,
  },
  "qualcomm-oryon-8-elite-cpu": {
    microarchitecture: "Qualcomm Oryon",
    max_frequency_mhz: 4470,
  },
  "qualcomm-oryon-x-elite-cpu": {
    microarchitecture: "Qualcomm Oryon",
    max_frequency_mhz: 4000,
  },
  "mediatek-dimensity-9300-plus-cpu": {
    microarchitecture: "Arm Cortex-X4 / Cortex-A720",
    max_frequency_mhz: 3400,
  },
};

const GPU_EXACT: Record<string, Record<string, unknown>> = {
  "amd-radeon-890m": {
    compute_units: 16,
    clock_mhz: 2900,
    gpu_generation: "RDNA 3.5",
  },
  "intel-arc-140v": {
    compute_units: 8,
    clock_mhz: 1950,
    gpu_generation: "Xe2-LPG",
    max_display_resolution: "7680 × 4320 @ 60 Hz",
  },
  "nvidia-geforce-rtx-4060-laptop": {
    shader_units: 3072,
    compute_units: 24,
    gpu_generation: "Ada Lovelace",
  },
  "nvidia-rtx-4070-laptop": {
    shader_units: 4608,
    compute_units: 36,
    gpu_generation: "Ada Lovelace",
  },
  "nvidia-rtx-5080-laptop": {
    shader_units: 7680,
    compute_units: 60,
    gpu_generation: "Blackwell",
  },
  "apple-gpu-a16": { compute_units: 5, gpu_generation: "A16" },
  "apple-gpu-a18": { compute_units: 5, gpu_generation: "A18" },
  "apple-gpu-a18-pro": { compute_units: 6, gpu_generation: "A18 Pro" },
  "apple-m2-gpu": { compute_units: 9, gpu_generation: "M2" },
  "apple-m4-gpu": { compute_units: 10, gpu_generation: "M4" },
  "apple-m4-pro-gpu": { compute_units: 16, gpu_generation: "M4 Pro" },
  "apple-m4-max-gpu": { compute_units: 40, gpu_generation: "M4 Max" },
};

const NPU_EXACT: Record<string, Record<string, unknown>> = {
  "amd-ryzen-7-8845hs-ai-engine": { tops: 16, ai_engine_version: "XDNA" },
  "amd-ryzen-ai-9-hx-370-ai-engine": {
    tops: 50,
    ai_engine_version: "XDNA 2",
  },
  "intel-core-ultra-7-258v-ai-engine": { tops: 47, ai_engine_version: "Intel AI Boost" },
  "apple-m4-ai-engine": { tops: 38, ai_engine_version: "16-core Neural Engine" },
  "apple-m4-max-ai-engine": { tops: 38, ai_engine_version: "16-core Neural Engine" },
  "apple-neural-engine-m4": { tops: 38, ai_engine_version: "16-core Neural Engine" },
};

const MODEM_EXACT: Record<string, Record<string, unknown>> = {
  "snapdragon-8-elite-integrated-5g-modem": {
    max_downlink_mbps: 10000,
    max_uplink_mbps: 3500,
    supports_mmwave: true,
    dual_sim_capability: "Multi-SIM, DSDA",
  },
  "snapdragon-x80-5g-modem": {
    max_downlink_mbps: 10000,
    max_uplink_mbps: 3500,
    supports_mmwave: true,
    dual_sim_capability: "Multi-SIM, DSDA",
  },
  "mediatek-dimensity-9300-plus-integrated-5g-modem": {
    max_downlink_mbps: 7000,
    supports_mmwave: false,
    dual_sim_capability: "Dual 5G SIM, DSDA",
  },
};

const MEMORY_PROFILES: Record<string, Record<string, unknown>> = {
  lpddr4x: {
    memory_type: "LPDDR",
    generation: "LPDDR4X",
    max_data_rate_mtps: 4266,
    typical_data_rate_mtps: 3200,
    jedec_standard: "JESD209-4",
    prefetch: "16n",
    dual_channel: true,
    voltage: 0.6,
    channel_width_bits: 32,
    maximum_capacity_gb: 32,
    is_mobile: true,
    release_year: 2017,
  },
  lpddr5x: {
    memory_type: "LPDDR",
    generation: "LPDDR5X",
    max_data_rate_mtps: 9600,
    typical_data_rate_mtps: 8533,
    jedec_standard: "JESD209-5",
    prefetch: "16n",
    dual_channel: true,
    voltage: 0.5,
    channel_width_bits: 32,
    maximum_capacity_gb: 64,
    is_mobile: true,
    release_year: 2021,
  },
  ddr5: {
    memory_type: "DDR SDRAM",
    generation: "DDR5",
    max_data_rate_mtps: 6400,
    typical_data_rate_mtps: 5600,
    jedec_standard: "JESD79-5",
    prefetch: "16n",
    dual_channel: true,
    voltage: 1.1,
    channel_width_bits: 64,
    maximum_capacity_gb: 256,
    is_mobile: false,
    release_year: 2020,
  },
  "apple-unified-memory": {
    memory_type: "Unified memory",
    generation: "Apple silicon unified memory architecture",
    dual_channel: true,
    is_mobile: false,
    release_year: 2020,
  },
};

const STORAGE_PROFILES: Record<string, Record<string, unknown>> = {
  "ufs-3-1": {
    storage_type: "UFS",
    generation: "3.1",
    jedec_standard: "JESD220E",
    interface: "M-PHY 4.1 / UniPro 1.8",
    half_duplex: false,
    full_duplex: true,
    command_queue: true,
    boot_partition: true,
    rpmb: true,
    trim: true,
    secure_erase: true,
    hs200: false,
    hs400: false,
    release_year: 2020,
  },
  "ufs-4-0": {
    storage_type: "UFS",
    generation: "4.0",
    jedec_standard: "JESD220F",
    interface: "M-PHY 5.0 / UniPro 2.0",
    half_duplex: false,
    full_duplex: true,
    command_queue: true,
    boot_partition: true,
    rpmb: true,
    trim: true,
    secure_erase: true,
    hs200: false,
    hs400: false,
    release_year: 2022,
  },
  "pcie-4-nvme": {
    storage_type: "NVMe SSD",
    generation: "PCIe 4.0",
    jedec_standard: "NVM Express",
    interface: "PCI Express 4.0 / NVMe",
    half_duplex: false,
    full_duplex: true,
    command_queue: true,
    boot_partition: false,
    trim: true,
    secure_erase: true,
    hs200: false,
    hs400: false,
    release_year: 2019,
  },
  "apple-nvme": {
    storage_type: "NVMe SSD",
    generation: "Apple silicon storage controller",
    interface: "PCI Express / NVMe",
    half_duplex: false,
    full_duplex: true,
    command_queue: true,
    boot_partition: false,
    trim: true,
    secure_erase: true,
    hs200: false,
    hs400: false,
    release_year: 2020,
  },
};

const OS_PROFILES: Record<string, Record<string, unknown>> = {
  "android-15": {
    os_family: "Android",
    kernel_type: "Monolithic modular kernel",
    kernel_name: "Linux / Android Common Kernel (GKI)",
    license_name: "Apache License 2.0; Linux kernel GPLv2",
    is_open_source: true,
    initial_release_date: new Date("2008-09-23"),
    os_type: "Mobile and tablet operating system",
    supported_architectures: "ARM64, x86-64",
  },
  "ios-18": {
    os_family: "iOS",
    kernel_type: "Hybrid kernel",
    kernel_name: "XNU / Darwin",
    license_name: "Proprietary; Darwin components are open source",
    is_open_source: false,
    initial_release_date: new Date("2007-06-29"),
    os_type: "Mobile operating system",
    supported_architectures: "ARM64",
  },
  "ipados-17": {
    os_family: "iPadOS",
    kernel_type: "Hybrid kernel",
    kernel_name: "XNU / Darwin",
    license_name: "Proprietary; Darwin components are open source",
    is_open_source: false,
    initial_release_date: new Date("2019-09-24"),
    os_type: "Tablet operating system",
    supported_architectures: "ARM64",
  },
  "macos-15": {
    os_family: "macOS",
    kernel_type: "Hybrid kernel",
    kernel_name: "XNU / Darwin",
    license_name: "Proprietary; Darwin components are open source",
    is_open_source: false,
    initial_release_date: new Date("2001-03-24"),
    os_type: "Desktop operating system",
    supported_architectures: "ARM64, x86-64",
  },
  "windows-11": {
    os_family: "Windows NT",
    kernel_type: "Hybrid kernel",
    kernel_name: "Windows NT kernel",
    license_name: "Microsoft proprietary software license",
    is_open_source: false,
    initial_release_date: new Date("2021-10-05"),
    os_type: "Desktop operating system",
    supported_architectures: "x86-64, ARM64",
  },
  "wear-os-5": {
    os_family: "Wear OS",
    kernel_type: "Monolithic modular kernel",
    kernel_name: "Linux / Android kernel",
    license_name: "Proprietary Google services over Android open-source base",
    is_open_source: false,
    initial_release_date: new Date("2014-06-25"),
    os_type: "Wearable operating system",
    supported_architectures: "ARM, ARM64",
  },
  harmonyos: {
    os_family: "HarmonyOS",
    kernel_type: "Distributed, version-dependent kernel architecture",
    kernel_name: "HarmonyOS kernel; implementation varies by version",
    license_name: "Huawei proprietary; distinct from OpenHarmony",
    is_open_source: false,
    initial_release_date: new Date("2019-08-09"),
    os_type: "Distributed mobile and smart-device operating system",
    supported_architectures: "ARM64",
  },
  "airpods-firmware": {
    os_family: "AirPods Firmware",
    kernel_type: "Embedded firmware",
    kernel_name: "Not disclosed by Apple",
    license_name: "Apple proprietary software license",
    is_open_source: false,
    os_type: "Embedded audio-device firmware",
    supported_architectures: "Apple audio silicon",
  },
};

function present(value: unknown): boolean {
  if (value === null || value === undefined || value === "") return false;
  if (Array.isArray(value)) return value.length > 0;
  return true;
}

function setIfMissing(
  row: MutableModule,
  data: Record<string, unknown>,
  derived: Set<string>,
  kind: ModuleKind,
  markDerived = true,
): Record<string, unknown> {
  const update: Record<string, unknown> = {};
  for (const [field, value] of Object.entries(data)) {
    if (markDerived && present(value)) {
      derived.add(`${kind}:${row.id}:${field}`);
    }
    if (!present(row[field]) && present(value)) {
      update[field] = value;
    }
  }
  return update;
}

function gcd(left: number, right: number): number {
  let a = Math.abs(left);
  let b = Math.abs(right);
  while (b) [a, b] = [b, a % b];
  return a || 1;
}

function displayAspectRatio(width: number, height: number): string {
  const long = Math.max(width, height);
  const short = Math.min(width, height);
  const divisor = gcd(long, short);
  const exactLong = long / divisor;
  const exactShort = short / divisor;
  if (exactLong <= 50 && exactShort <= 50) return `${exactLong}:${exactShort}`;
  return `${((long / short) * 9).toFixed(1).replace(/\.0$/, "")}:9`;
}

function moduleSpecs(kind: ModuleKind, row: MutableModule) {
  switch (kind) {
    case "chipset":
      return {
        ...row,
        cpus: row.chipset_cpu_links,
        gpus: row.chipset_gpu_links,
        npus: row.chipset_npu_links,
        modems: row.chipset_modem_links,
      };
    case "cpu":
      return {
        ...row,
        architecture: row.architecture,
        clusters: row.cpu_clusters,
        chipsets: row.chipset_cpu_links,
      };
    case "gpu":
      return {
        ...row,
        architecture: row.architecture,
        chipsets: row.chipset_gpu_links,
      };
    case "npu":
      return {
        ...row,
        architecture: row.architecture,
        chipsets: row.chipset_npu_links,
      };
    case "modem":
      return { ...row, chipsets: row.chipset_modem_links };
    case "operating-system":
      return { ...row, versions: row.os_versions };
    case "camera":
      return { ...row, role: row.camera_role };
    case "display":
      return { ...row, technology: row.display_technology };
    case "battery":
      return { ...row, chemistry: row.battery_chemistry };
    default:
      return row;
  }
}

function unavailableStatus(
  kind: ModuleKind,
  field: string,
  row: MutableModule,
): FieldCoverageStatus {
  if (kind === "camera") {
    if (field === "ois_type" && row.has_ois === false) return "not_applicable";
    if (field === "af_system" && row.has_af === false) return "not_applicable";
  }
  if (kind === "battery") {
    if (field === "wireless_charging_protocol" && row.wireless_charging_w === 0)
      return "not_applicable";
    if (
      field === "reverse_wireless_charging_w" &&
      row.wireless_charging_w === 0
    )
      return "not_applicable";
  }
  return "not_disclosed";
}

function unavailableNote(status: FieldCoverageStatus): string {
  return status === "not_applicable"
    ? "Thông số này không áp dụng cho module hoặc cấu hình hiện tại."
    : "Chưa có thông số đủ tin cậy từ nhà sản xuất cho đúng module hoặc biến thể này.";
}

async function architectureId(
  prisma: PrismaClient,
  slug: string,
  name: string,
  description: string,
) {
  const existing = await prisma.architectures.findFirst({
    where: { OR: [{ slug }, { name }] },
  });
  if (existing) return existing.id;
  const created = await prisma.architectures.create({
    data: {
      slug,
      name,
      architecture_type: "instruction_set",
      description,
    },
  });
  return created.id;
}

export async function enrichCatalogModules(
  prisma: PrismaClient,
): Promise<EnrichmentResult> {
  const variants = await prisma.device_variants.findMany({
    where: { deleted_at: null, device_model: { deleted_at: null } },
    select: {
      variant_chipsets: { select: { chipset_id: true } },
      variant_cpus: { select: { cpu_id: true } },
      variant_gpus: { select: { gpu_id: true } },
      variant_npus: { select: { npu_id: true } },
      variant_modems: { select: { modem_id: true } },
      variant_memory_configs: { select: { memory_standard_id: true } },
      variant_storage_configs: { select: { storage_standard_id: true } },
      variant_operating_systems: {
        select: { os_version: { select: { operating_system_id: true } } },
      },
      variant_camera_modules: { select: { camera_module_id: true } },
      variant_displays: { select: { display_unit_id: true } },
      variant_batteries: { select: { battery_unit_id: true } },
    },
  });

  const ids = {
    chipset: new Set(variants.flatMap((v) => v.variant_chipsets.map((x) => x.chipset_id))),
    cpu: new Set(variants.flatMap((v) => v.variant_cpus.map((x) => x.cpu_id))),
    gpu: new Set(variants.flatMap((v) => v.variant_gpus.map((x) => x.gpu_id))),
    npu: new Set(variants.flatMap((v) => v.variant_npus.map((x) => x.npu_id))),
    modem: new Set(variants.flatMap((v) => v.variant_modems.map((x) => x.modem_id))),
    memory: new Set(
      variants.flatMap((v) =>
        v.variant_memory_configs.map((x) => x.memory_standard_id),
      ),
    ),
    storage: new Set(
      variants.flatMap((v) =>
        v.variant_storage_configs.map((x) => x.storage_standard_id),
      ),
    ),
    os: new Set(
      variants.flatMap((v) =>
        v.variant_operating_systems.map((x) => x.os_version.operating_system_id),
      ),
    ),
    camera: new Set(
      variants.flatMap((v) =>
        v.variant_camera_modules.map((x) => x.camera_module_id),
      ),
    ),
    display: new Set(variants.flatMap((v) => v.variant_displays.map((x) => x.display_unit_id))),
    battery: new Set(variants.flatMap((v) => v.variant_batteries.map((x) => x.battery_unit_id))),
  };

  const derived = new Set<string>();
  let updatedModules = 0;
  const armArchitectureId = await architectureId(
    prisma,
    "arm-64-bit-isa",
    "Arm 64-bit instruction set",
    "Kiến trúc tập lệnh 64-bit dùng cho các CPU Arm hiện đại; vi kiến trúc lõi cụ thể được lưu riêng khi nhà sản xuất công bố.",
  );
  const x86ArchitectureId = await architectureId(
    prisma,
    "x86-64-isa",
    "x86-64 instruction set",
    "Kiến trúc tập lệnh 64-bit dùng trên CPU AMD và Intel; vi kiến trúc cụ thể được lưu riêng theo từng module.",
  );

  const cpus = await prisma.cpus.findMany({ where: { id: { in: [...ids.cpu] } } });
  for (const cpu of cpus as MutableModule[]) {
    const isa = String(cpu.isa_name ?? "").toLowerCase();
    const isX86 = isa.includes("x86-64");
    const isArm64 = isa.includes("arm64") || isa.includes("armv9");
    const modernGeneralPurpose = isX86 || isArm64;
    const generic: Record<string, unknown> = {
      supports_64bit: modernGeneralPurpose,
      simd_extension: isX86 ? "SSE4.2, AVX2" : isArm64 ? "Arm NEON" : undefined,
      virtualization: modernGeneralPurpose ? true : undefined,
      out_of_order: modernGeneralPurpose ? true : undefined,
      smt:
        cpu.thread_count && cpu.core_count
          ? cpu.thread_count > cpu.core_count
          : undefined,
      core_type: cpu.big_little
        ? "Heterogeneous performance and efficiency cores"
        : modernGeneralPurpose
          ? "General-purpose multi-core"
          : undefined,
      architecture_id: isX86
        ? x86ArchitectureId
        : isArm64
          ? armArchitectureId
          : undefined,
    };
    if (/intel-core-ultra/i.test(cpu.slug ?? "")) generic.big_little = true;
    const update = setIfMissing(
      cpu,
      generic,
      derived,
      "cpu",
    );
    Object.assign(
      update,
      setIfMissing(
        cpu,
        CPU_EXACT[cpu.slug ?? ""] ?? {},
        derived,
        "cpu",
        false,
      ),
    );
    if (generic.architecture_id) derived.add(`cpu:${cpu.id}:architecture`);
    if (Object.keys(update).length) {
      await prisma.cpus.update({ where: { id: cpu.id }, data: update });
      updatedModules += 1;
    }
  }

  const gpus = await prisma.gpus.findMany({ where: { id: { in: [...ids.gpu] } } });
  for (const gpu of gpus as MutableModule[]) {
    const name = `${gpu.name ?? ""} ${gpu.slug ?? ""}`.toLowerCase();
    const isApple = name.includes("apple");
    const isNvidia = name.includes("nvidia") || name.includes("rtx");
    const isPc = isNvidia || name.includes("intel") || name.includes("radeon");
    const isLegacyAdreno = name.includes("adreno 330");
    const isMobile = /adreno|mali|immortalis|xclipse|maleoon|powervr/.test(name);
    const generic: Record<string, unknown> = {
      api_support: isApple
        ? "Metal"
        : isPc
          ? "DirectX, Vulkan, OpenGL, OpenCL"
          : isMobile
            ? "Vulkan, OpenGL ES, OpenCL"
            : undefined,
      opengl_version: isPc
        ? "4.6"
        : isMobile
          ? isLegacyAdreno
            ? "OpenGL ES 3.0"
            : "OpenGL ES 3.2"
          : undefined,
      opencl_version: isPc ? "3.0" : isMobile ? "2.0" : undefined,
      vulkan_version: isPc || (isMobile && !isLegacyAdreno) ? "1.3" : undefined,
      directx_feature_level: isPc ? "DirectX 12" : undefined,
      metal_support: isApple,
      cuda_support: isNvidia,
      video_decode_codecs: isPc
        ? "H.264, H.265/HEVC, VP9, AV1 (generation-dependent)"
        : isApple || isMobile
          ? "H.264, H.265/HEVC, VP9; AV1 where supported by generation"
          : undefined,
      video_encode_codecs: isPc || isApple || isMobile ? "H.264, H.265/HEVC" : undefined,
    };
    const update = setIfMissing(
      gpu,
      generic,
      derived,
      "gpu",
    );
    Object.assign(
      update,
      setIfMissing(
        gpu,
        GPU_EXACT[gpu.slug ?? ""] ?? {},
        derived,
        "gpu",
        false,
      ),
    );
    if (Object.keys(update).length) {
      await prisma.gpus.update({ where: { id: gpu.id }, data: update });
      updatedModules += 1;
    }
  }

  const npus = await prisma.npus.findMany({ where: { id: { in: [...ids.npu] } } });
  for (const npu of npus as MutableModule[]) {
    const vendorEngine = String(npu.name ?? "").split(" AI Engine")[0];
    const update = setIfMissing(
      npu,
      {
        supports_int8: true,
        supports_fp16: true,
        tensor_accelerator: `${vendorEngine} matrix/tensor acceleration engine`,
        quantization: "INT8 and mixed-precision inference; exact modes vary by SDK",
      },
      derived,
      "npu",
    );
    const exactNpu = NPU_EXACT[npu.slug ?? ""] ?? {};
    for (const [field, value] of Object.entries(exactNpu)) {
      if (
        !present(npu[field]) ||
        (field === "ai_engine_version" && npu[field] === "Catalog profile v1")
      ) {
        update[field] = value;
      }
    }
    if (Object.keys(update).length) {
      await prisma.npus.update({ where: { id: npu.id }, data: update });
      updatedModules += 1;
    }
  }

  const modems = await prisma.modems.findMany({ where: { id: { in: [...ids.modem] } } });
  for (const modem of modems as MutableModule[]) {
    const is5g = /5g|x80|exynos-5400|apple-c1/.test(
      `${modem.slug ?? ""} ${modem.name ?? ""}`.toLowerCase(),
    );
    const update = setIfMissing(
      modem,
      {
        supports_5g_nr: is5g,
        supported_5g_modes: is5g ? "5G NR SA and NSA" : undefined,
        carrier_aggregation: true,
        volte: true,
        vonr: is5g ? true : undefined,
        supported_technologies: is5g
          ? "5G NR, LTE, WCDMA; bands depend on device region"
          : "LTE, WCDMA; bands depend on device region",
      },
      derived,
      "modem",
    );
    Object.assign(
      update,
      setIfMissing(
        modem,
        MODEM_EXACT[modem.slug ?? ""] ?? {},
        derived,
        "modem",
        false,
      ),
    );
    if (Object.keys(update).length) {
      await prisma.modems.update({ where: { id: modem.id }, data: update });
      updatedModules += 1;
    }
  }

  const memories = await prisma.memory_standards.findMany({
    where: { id: { in: [...ids.memory] } },
  });
  for (const memory of memories as MutableModule[]) {
    const memoryProfile = MEMORY_PROFILES[memory.slug ?? ""] ?? {};
    const update = setIfMissing(
      memory,
      {
        ...memoryProfile,
        description:
          `${memory.name ?? "Chuẩn bộ nhớ"} là module chuẩn hóa thông số RAM dùng trong danh mục thiết bị. ` +
          "Tốc độ, điện áp, độ rộng kênh và giới hạn dung lượng được tách khỏi cấu hình RAM thực tế của từng phiên bản.",
      },
      derived,
      "memory-standard",
      false,
    );
    if (Object.keys(update).length) {
      await prisma.memory_standards.update({ where: { id: memory.id }, data: update });
      updatedModules += 1;
    }
  }

  const storages = await prisma.storage_standards.findMany({
    where: { id: { in: [...ids.storage] } },
  });
  for (const storage of storages as MutableModule[]) {
    const storageProfile = STORAGE_PROFILES[storage.slug ?? ""] ?? {};
    const update = setIfMissing(
      storage,
      {
        ...storageProfile,
        description:
          `${storage.name ?? "Chuẩn lưu trữ"} mô tả giao tiếp và các khả năng của chuẩn lưu trữ trong danh mục. ` +
          "Dung lượng, khả năng mở rộng và số module vật lý được lưu riêng theo từng phiên bản thiết bị.",
      },
      derived,
      "storage-standard",
      false,
    );
    if (Object.keys(update).length) {
      await prisma.storage_standards.update({ where: { id: storage.id }, data: update });
      updatedModules += 1;
    }
  }

  const systems = await prisma.operating_systems.findMany({
    where: { id: { in: [...ids.os] } },
  });
  for (const system of systems as MutableModule[]) {
    const osProfile = OS_PROFILES[system.slug ?? ""] ?? {};
    const update = setIfMissing(
      system,
      {
        ...osProfile,
        description:
          `${system.name ?? "Hệ điều hành"} là nền tảng phần mềm được liên kết với các phiên bản thiết bị tương thích. ` +
          "Kernel, giấy phép, kiến trúc hỗ trợ và từng bản phát hành được lưu thành các trường có thể kiểm chứng độc lập.",
      },
      derived,
      "operating-system",
      false,
    );
    if (Object.keys(update).length) {
      await prisma.operating_systems.update({ where: { id: system.id }, data: update });
      updatedModules += 1;
    }
  }

  const displays = await prisma.display_units.findMany({
    where: { id: { in: [...ids.display] } },
  });
  for (const display of displays as MutableModule[]) {
    const width = Number(display.resolution_width ?? 0);
    const height = Number(display.resolution_height ?? 0);
    const size = Number(display.size_inch ?? 0);
    const calculated: Record<string, unknown> = {};
    if (width && height) calculated.aspect_ratio = displayAspectRatio(width, height);
    if (width && height && size) {
      calculated.pixel_density_ppi = Math.round(Math.sqrt(width ** 2 + height ** 2) / size);
    }
    const update = setIfMissing(display, calculated, derived, "display");
    if (Object.keys(update).length) {
      await prisma.display_units.update({ where: { id: display.id }, data: update });
      updatedModules += 1;
    }
  }

  const batteries = await prisma.battery_units.findMany({
    where: { id: { in: [...ids.battery] } },
  });
  for (const battery of batteries as MutableModule[]) {
    const capacity = Number(battery.capacity_mah ?? 0);
    const energy = Number(battery.energy_wh ?? 0);
    const calculated: Record<string, unknown> = {};
    if (capacity && energy) {
      calculated.voltage_nominal_v = Number(((energy * 1000) / capacity).toFixed(2));
    }
    const update = setIfMissing(battery, calculated, derived, "battery");
    if (Object.keys(update).length) {
      await prisma.battery_units.update({ where: { id: battery.id }, data: update });
      updatedModules += 1;
    }
  }

  const cameras = await prisma.camera_modules.findMany({
    where: { id: { in: [...ids.camera] } },
  });
  for (const camera of cameras as MutableModule[]) {
    const isFront = /front camera|webcam/i.test(camera.name ?? "");
    const update = setIfMissing(
      camera,
      {
        optical_zoom: 1,
        has_ois: isFront ? false : undefined,
        has_macro: isFront ? false : undefined,
        af_system: camera.has_af ? "Autofocus; mechanism not disclosed" : undefined,
        ois_type: camera.has_ois
          ? "Optical; type not disclosed"
          : undefined,
      },
      derived,
      "camera",
    );
    if (Object.keys(update).length) {
      await prisma.camera_modules.update({ where: { id: camera.id }, data: update });
      updatedModules += 1;
    }
  }

  const moduleRows: Array<{ kind: ModuleKind; rows: MutableModule[] }> = [
    {
      kind: "chipset",
      rows: (await prisma.chipsets.findMany({
        where: { id: { in: [...ids.chipset] } },
        include: {
          chipset_cpu_links: true,
          chipset_gpu_links: true,
          chipset_npu_links: true,
          chipset_modem_links: true,
        },
      })) as MutableModule[],
    },
    {
      kind: "cpu",
      rows: (await prisma.cpus.findMany({
        where: { id: { in: [...ids.cpu] } },
        include: { architecture: true, cpu_clusters: true, chipset_cpu_links: true },
      })) as MutableModule[],
    },
    {
      kind: "gpu",
      rows: (await prisma.gpus.findMany({
        where: { id: { in: [...ids.gpu] } },
        include: { architecture: true, chipset_gpu_links: true },
      })) as MutableModule[],
    },
    {
      kind: "npu",
      rows: (await prisma.npus.findMany({
        where: { id: { in: [...ids.npu] } },
        include: { architecture: true, chipset_npu_links: true },
      })) as MutableModule[],
    },
    {
      kind: "modem",
      rows: (await prisma.modems.findMany({
        where: { id: { in: [...ids.modem] } },
        include: { chipset_modem_links: true },
      })) as MutableModule[],
    },
    {
      kind: "memory-standard",
      rows: (await prisma.memory_standards.findMany({
        where: { id: { in: [...ids.memory] } },
      })) as MutableModule[],
    },
    {
      kind: "storage-standard",
      rows: (await prisma.storage_standards.findMany({
        where: { id: { in: [...ids.storage] } },
      })) as MutableModule[],
    },
    {
      kind: "operating-system",
      rows: (await prisma.operating_systems.findMany({
        where: { id: { in: [...ids.os] } },
        include: { os_versions: true },
      })) as MutableModule[],
    },
    {
      kind: "camera",
      rows: (await prisma.camera_modules.findMany({
        where: { id: { in: [...ids.camera] } },
        include: { camera_role: true },
      })) as MutableModule[],
    },
    {
      kind: "display",
      rows: (await prisma.display_units.findMany({
        where: { id: { in: [...ids.display] } },
        include: { display_technology: true },
      })) as MutableModule[],
    },
    {
      kind: "battery",
      rows: (await prisma.battery_units.findMany({
        where: { id: { in: [...ids.battery] } },
        include: { battery_chemistry: true },
      })) as MutableModule[],
    },
  ];

  await prisma.module_field_coverage.deleteMany({});
  const coverageRows: Array<{
    module_kind: string;
    module_id: string;
    field_key: string;
    status: FieldCoverageStatus;
    source_url: string | null;
    notes: string | null;
  }> = [];
  const statusCounts: Record<FieldCoverageStatus, number> = {
    populated: 0,
    derived: 0,
    not_disclosed: 0,
    not_applicable: 0,
  };

  for (const { kind, rows } of moduleRows) {
    for (const row of rows) {
      const specs = moduleSpecs(kind, row);
      for (const field of MODULE_SPEC_FIELDS[kind]) {
        const derivedKey = `${kind}:${row.id}:${field}`;
        const value = specs[field];
        const status: FieldCoverageStatus = present(value)
          ? derived.has(derivedKey)
            ? "derived"
            : "populated"
          : unavailableStatus(kind, field, row);
        statusCounts[status] += 1;
        coverageRows.push({
          module_kind: kind,
          module_id: row.id,
          field_key: field,
          status,
          source_url: OFFICIAL_SOURCES[row.slug ?? ""] ?? null,
          notes:
            status === "derived"
              ? "Giá trị được suy ra từ các thông số đã lưu hoặc đặc tính chuẩn của module; không phải benchmark."
              : status === "populated"
                ? null
                : unavailableNote(status),
        });
      }
    }
  }

  for (let index = 0; index < coverageRows.length; index += 500) {
    await prisma.module_field_coverage.createMany({
      data: coverageRows.slice(index, index + 500),
    });
  }

  return {
    updatedModules,
    coverageRows: coverageRows.length,
    statusCounts,
  };
}
