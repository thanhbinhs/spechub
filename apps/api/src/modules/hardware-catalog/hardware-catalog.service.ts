import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import { Prisma } from "@spechub/database";
import {
  createPaginationMeta,
  type PaginationMeta,
} from "../../common/dto/pagination.dto";
import { PrismaService } from "../../prisma/prisma.service";
import { HardwareCatalogQueryDto } from "./dto/hardware-catalog-query.dto";
import {
  type AdminHardwareModuleKind,
  ADMIN_HARDWARE_MODULE_KINDS,
  type ChipsetBenchmarkResultDto,
  CreateHardwareModuleDto,
} from "./dto/create-hardware-module.dto";
import {
  CreateOperatingSystemVersionDto,
  CreateOsUiLayerVersionDto,
} from "./dto/create-software-catalog.dto";
import { UpdateHardwareModuleDto } from "./dto/update-hardware-module.dto";

const ORGANIZATION_SELECT = {
  id: true,
  name: true,
  slug: true,
  short_name: true,
  logo_url: true,
} as const;

const CPU_SELECT = {
  id: true,
  name: true,
  slug: true,
  core_count: true,
  thread_count: true,
  big_little: true,
  isa_name: true,
  microarchitecture: true,
  core_type: true,
  max_frequency_mhz: true,
  min_frequency_mhz: true,
  l1_instruction_cache: true,
  l1_data_cache: true,
  l2_cache: true,
  l3_cache: true,
  supports_64bit: true,
  simd_extension: true,
  virtualization: true,
  out_of_order: true,
  smt: true,
  description: true,
  image_url: true,
  image_source_url: true,
  cpu_clusters: {
    select: {
      cluster_name: true,
      core_microarchitecture: true,
      core_count: true,
      clock_ghz: true,
      cluster_order: true,
    },
    orderBy: [{ cluster_order: "asc" as const }],
  },
  manufacturer: { select: ORGANIZATION_SELECT },
  architecture: { select: { id: true, name: true, slug: true } },
  _count: { select: { variant_cpus: true, chipset_cpu_links: true } },
} satisfies Prisma.cpusSelect;

const GPU_SELECT = {
  id: true,
  name: true,
  slug: true,
  shader_units: true,
  compute_units: true,
  clock_mhz: true,
  fp32_gflops: true,
  ray_tracing_support: true,
  api_support: true,
  gpu_generation: true,
  opengl_version: true,
  opencl_version: true,
  vulkan_version: true,
  directx_feature_level: true,
  metal_support: true,
  cuda_support: true,
  video_decode_codecs: true,
  video_encode_codecs: true,
  max_display_resolution: true,
  description: true,
  image_url: true,
  image_source_url: true,
  manufacturer: { select: ORGANIZATION_SELECT },
  architecture: { select: { id: true, name: true, slug: true } },
  _count: { select: { variant_gpus: true, chipset_gpu_links: true } },
} satisfies Prisma.gpusSelect;

const NPU_SELECT = {
  id: true,
  name: true,
  slug: true,
  tops: true,
  tops_int8: true,
  tops_int4: true,
  tops_fp16: true,
  ai_engine_version: true,
  dedicated_npu: true,
  dsp_name: true,
  tensor_accelerator: true,
  supports_int8: true,
  supports_fp16: true,
  supports_fp32: true,
  quantization: true,
  description: true,
  image_url: true,
  image_source_url: true,
  manufacturer: { select: ORGANIZATION_SELECT },
  architecture: { select: { id: true, name: true, slug: true } },
  _count: { select: { variant_npus: true, chipset_npu_links: true } },
} satisfies Prisma.npusSelect;

const MODEM_SELECT = {
  id: true,
  name: true,
  slug: true,
  max_downlink_mbps: true,
  max_uplink_mbps: true,
  supports_mmwave: true,
  supports_satellite: true,
  supported_5g_modes: true,
  lte_category: true,
  supports_5g_nr: true,
  carrier_aggregation: true,
  volte: true,
  vonr: true,
  dual_sim_capability: true,
  supported_technologies: true,
  description: true,
  image_url: true,
  image_source_url: true,
  manufacturer: { select: ORGANIZATION_SELECT },
  _count: { select: { variant_modems: true, chipset_modem_links: true } },
} satisfies Prisma.modemsSelect;

const MEMORY_SELECT = {
  id: true,
  name: true,
  slug: true,
  memory_type: true,
  generation: true,
  max_data_rate_mtps: true,
  typical_data_rate_mtps: true,
  jedec_standard: true,
  prefetch: true,
  ecc: true,
  dual_channel: true,
  voltage: true,
  bandwidth_gbps: true,
  channel_width_bits: true,
  maximum_capacity_gb: true,
  is_mobile: true,
  release_year: true,
  description: true,
  image_url: true,
  image_source_url: true,
  organization: { select: ORGANIZATION_SELECT },
  _count: { select: { variant_memory_configs: true } },
} satisfies Prisma.memory_standardsSelect;

const STORAGE_SELECT = {
  id: true,
  name: true,
  slug: true,
  storage_type: true,
  generation: true,
  jedec_standard: true,
  interface: true,
  half_duplex: true,
  full_duplex: true,
  command_queue: true,
  boot_partition: true,
  rpmb: true,
  trim: true,
  secure_erase: true,
  hs200: true,
  hs400: true,
  release_year: true,
  description: true,
  image_url: true,
  image_source_url: true,
  organization: { select: ORGANIZATION_SELECT },
  _count: { select: { variant_storage_configs: true } },
} satisfies Prisma.storage_standardsSelect;

const OS_SELECT = {
  id: true,
  name: true,
  slug: true,
  os_family: true,
  kernel_type: true,
  kernel_name: true,
  license_name: true,
  is_open_source: true,
  initial_release_date: true,
  os_type: true,
  supported_architectures: true,
  description: true,
  image_url: true,
  image_source_url: true,
  vendor: { select: ORGANIZATION_SELECT },
  os_versions: {
    select: {
      id: true,
      version_name: true,
      codename: true,
      release_date: true,
      api_level: true,
    },
    orderBy: [{ release_date: "desc" as const }],
  },
  os_ui_layers: {
    select: {
      id: true,
      name: true,
      slug: true,
      os_ui_layer_versions: {
        select: {
          id: true,
          version_name: true,
          release_date: true,
          base_os_version_id: true,
        },
        orderBy: [{ release_date: "desc" as const }],
      },
    },
    orderBy: [{ name: "asc" as const }],
  },
} satisfies Prisma.operating_systemsSelect;

const OS_VERSION_SELECT = {
  id: true,
  version_name: true,
  codename: true,
  release_date: true,
  api_level: true,
  operating_system: {
    select: {
      id: true,
      name: true,
      slug: true,
      os_family: true,
    },
  },
} satisfies Prisma.os_versionsSelect;

const OS_UI_LAYER_SELECT = {
  id: true,
  name: true,
  slug: true,
  description: true,
  vendor: { select: ORGANIZATION_SELECT },
  base_os: {
    select: { id: true, name: true, slug: true, os_family: true },
  },
} satisfies Prisma.os_ui_layersSelect;

const OS_UI_LAYER_VERSION_SELECT = {
  id: true,
  version_name: true,
  release_date: true,
  ui_layer: {
    select: { id: true, name: true, slug: true },
  },
  base_os_version: {
    select: {
      id: true,
      version_name: true,
      operating_system: {
        select: { id: true, name: true, slug: true },
      },
    },
  },
} satisfies Prisma.os_ui_layer_versionsSelect;

const VARIANT_USAGE_SELECT = {
  id: true,
  variant_name: true,
  market_name: true,
  color_name: true,
  color_hex: true,
  launch_price: true,
  is_default: true,
  currency: { select: { code: true, symbol: true, decimal_digits: true } },
  device_model: {
    select: {
      id: true,
      name: true,
      slug: true,
      cover_image_url: true,
      generation_label: true,
      release_date: true,
      product_family: {
        select: {
          id: true,
          name: true,
          slug: true,
          brand_org: { select: { name: true, short_name: true, slug: true } },
          device_category: { select: { name: true, slug: true } },
        },
      },
    },
  },
} satisfies Prisma.device_variantsSelect;

const CHIPSET_DETAIL_SELECT = {
  id: true,
  name: true,
  slug: true,
  description: true,
  image_url: true,
  image_source_url: true,
  chip_kind: true,
  model_code: true,
  supports_64bit: true,
  integrated_5g: true,
  integrated_wifi: true,
  max_ram_gb: true,
  max_display_resolution: true,
  max_camera_mp: true,
  announcement_date: true,
  release_date: true,
  manufacturer: { select: ORGANIZATION_SELECT },
  chipset_cpu_links: {
    select: {
      is_primary: true,
      cpu: {
        select: {
          id: true,
          name: true,
          slug: true,
          core_count: true,
          thread_count: true,
          microarchitecture: true,
          max_frequency_mhz: true,
        },
      },
    },
  },
  chipset_gpu_links: {
    select: {
      is_primary: true,
      gpu: {
        select: {
          id: true,
          name: true,
          slug: true,
          gpu_generation: true,
          clock_mhz: true,
        },
      },
    },
  },
  chipset_npu_links: {
    select: {
      is_primary: true,
      npu: {
        select: {
          id: true,
          name: true,
          slug: true,
          dedicated_npu: true,
          tops: true,
        },
      },
    },
  },
  chipset_modem_links: {
    select: {
      is_primary: true,
      is_integrated: true,
      modem: {
        select: {
          id: true,
          name: true,
          slug: true,
          supports_5g_nr: true,
          lte_category: true,
        },
      },
    },
  },
  chipset_benchmarks: {
    select: {
      id: true,
      score: true,
      subscore_name: true,
      tested_at: true,
      source_id: true,
      benchmark: {
        select: {
          id: true,
          name: true,
          slug: true,
          benchmark_type: true,
          version: true,
          higher_is_better: true,
          unit: { select: { name: true, symbol: true } },
        },
      },
      benchmark_run: {
        select: {
          id: true,
          test_environment_note: true,
          ambient_temp_c: true,
          os_version: true,
          app_version: true,
          power_mode: true,
          is_thermal_throttled: true,
        },
      },
    },
    orderBy: [{ benchmark: { name: "asc" as const } }],
  },
  variant_chipsets: {
    select: {
      chip_role: true,
      is_primary: true,
      device_variant: { select: VARIANT_USAGE_SELECT },
    },
  },
} satisfies Prisma.chipsetsSelect;

const CPU_DETAIL_SELECT = {
  ...CPU_SELECT,
  cpu_clusters: {
    select: {
      cluster_name: true,
      core_microarchitecture: true,
      core_count: true,
      clock_ghz: true,
      l1_cache_kb: true,
      l2_cache_kb: true,
      cluster_order: true,
    },
    orderBy: [{ cluster_order: "asc" as const }],
  },
  variant_cpus: {
    select: {
      cpu_role: true,
      is_primary: true,
      device_variant: { select: VARIANT_USAGE_SELECT },
    },
  },
  chipset_cpu_links: {
    select: {
      is_primary: true,
      chipset: {
        select: {
          id: true,
          name: true,
          slug: true,
          variant_chipsets: {
            select: {
              chip_role: true,
              is_primary: true,
              device_variant: { select: VARIANT_USAGE_SELECT },
            },
          },
        },
      },
    },
  },
} satisfies Prisma.cpusSelect;

const GPU_DETAIL_SELECT = {
  ...GPU_SELECT,
  variant_gpus: {
    select: {
      gpu_role: true,
      is_primary: true,
      device_variant: { select: VARIANT_USAGE_SELECT },
    },
  },
  chipset_gpu_links: {
    select: {
      is_primary: true,
      chipset: {
        select: {
          id: true,
          name: true,
          slug: true,
          variant_chipsets: {
            select: {
              chip_role: true,
              is_primary: true,
              device_variant: { select: VARIANT_USAGE_SELECT },
            },
          },
        },
      },
    },
  },
} satisfies Prisma.gpusSelect;

const NPU_DETAIL_SELECT = {
  ...NPU_SELECT,
  variant_npus: {
    select: {
      npu_role: true,
      is_primary: true,
      device_variant: { select: VARIANT_USAGE_SELECT },
    },
  },
  chipset_npu_links: {
    select: {
      is_primary: true,
      chipset: {
        select: {
          id: true,
          name: true,
          slug: true,
          variant_chipsets: {
            select: {
              chip_role: true,
              is_primary: true,
              device_variant: { select: VARIANT_USAGE_SELECT },
            },
          },
        },
      },
    },
  },
} satisfies Prisma.npusSelect;

const MODEM_DETAIL_SELECT = {
  ...MODEM_SELECT,
  variant_modems: {
    select: {
      modem_role: true,
      is_primary: true,
      device_variant: { select: VARIANT_USAGE_SELECT },
    },
  },
  chipset_modem_links: {
    select: {
      is_primary: true,
      is_integrated: true,
      chipset: {
        select: {
          id: true,
          name: true,
          slug: true,
          variant_chipsets: {
            select: {
              chip_role: true,
              is_primary: true,
              device_variant: { select: VARIANT_USAGE_SELECT },
            },
          },
        },
      },
    },
  },
} satisfies Prisma.modemsSelect;

const MEMORY_DETAIL_SELECT = {
  ...MEMORY_SELECT,
  variant_memory_configs: {
    select: {
      capacity_gb: true,
      bandwidth_gbps: true,
      channel_count: true,
      device_variant: { select: VARIANT_USAGE_SELECT },
    },
  },
} satisfies Prisma.memory_standardsSelect;

const STORAGE_DETAIL_SELECT = {
  ...STORAGE_SELECT,
  variant_storage_configs: {
    select: {
      total_capacity_gb: true,
      module_count: true,
      is_expandable: true,
      expansion_max_gb: true,
      device_variant: { select: VARIANT_USAGE_SELECT },
    },
  },
} satisfies Prisma.storage_standardsSelect;

const OS_DETAIL_SELECT = {
  ...OS_SELECT,
  os_versions: {
    select: {
      id: true,
      version_name: true,
      codename: true,
      release_date: true,
      api_level: true,
      variant_operating_systems: {
        select: {
          is_default: true,
          is_upgradable_to: true,
          promised_major_updates: true,
          promised_security_years: true,
          device_variant: { select: VARIANT_USAGE_SELECT },
        },
      },
    },
    orderBy: [{ release_date: "desc" as const }],
  },
} satisfies Prisma.operating_systemsSelect;

const CAMERA_DETAIL_SELECT = {
  id: true,
  name: true,
  slug: true,
  effective_megapixel: true,
  aperture: true,
  focal_length_mm_eq: true,
  focal_length_mm_native: true,
  optical_zoom: true,
  digital_zoom_max: true,
  has_ois: true,
  has_eis: true,
  ois_type: true,
  has_af: true,
  af_system: true,
  field_of_view_deg: true,
  video_capabilities: true,
  has_macro: true,
  description: true,
  manufacturer: { select: ORGANIZATION_SELECT },
  camera_role: { select: { id: true, code: true, name: true } },
  variant_camera_modules: {
    select: {
      position: true,
      role: true,
      module_order: true,
      is_primary: true,
      device_variant: { select: VARIANT_USAGE_SELECT },
    },
  },
} satisfies Prisma.camera_modulesSelect;

const DISPLAY_DETAIL_SELECT = {
  id: true,
  name: true,
  slug: true,
  size_inch: true,
  aspect_ratio: true,
  resolution_width: true,
  resolution_height: true,
  pixel_density_ppi: true,
  refresh_rate_hz: true,
  refresh_rate_min_hz: true,
  ltpo_version: true,
  touch_sampling_hz: true,
  brightness_typical_nits: true,
  brightness_hbm_nits: true,
  brightness_peak_nits: true,
  contrast_ratio: true,
  color_depth_bits: true,
  color_gamut: true,
  hdr_formats: true,
  protection_glass: true,
  has_always_on: true,
  has_dc_dimming: true,
  pwm_frequency_hz: true,
  description: true,
  manufacturer: { select: ORGANIZATION_SELECT },
  display_technology: { select: { id: true, name: true, slug: true } },
  variant_displays: {
    select: {
      display_role: true,
      display_order: true,
      device_variant: { select: VARIANT_USAGE_SELECT },
    },
  },
} satisfies Prisma.display_unitsSelect;

const BATTERY_DETAIL_SELECT = {
  id: true,
  name: true,
  slug: true,
  capacity_mah: true,
  rated_capacity_mah: true,
  energy_wh: true,
  voltage_nominal_v: true,
  cell_count: true,
  cycle_life: true,
  wired_charging_w: true,
  wired_charging_protocol: true,
  wireless_charging_w: true,
  wireless_charging_protocol: true,
  reverse_wired_charging_w: true,
  reverse_wireless_charging_w: true,
  removable: true,
  description: true,
  manufacturer: { select: ORGANIZATION_SELECT },
  battery_chemistry: { select: { id: true, name: true, slug: true } },
  variant_batteries: {
    select: {
      battery_role: true,
      is_primary: true,
      device_variant: { select: VARIANT_USAGE_SELECT },
    },
  },
} satisfies Prisma.battery_unitsSelect;

export type HardwareListResult<T> = { data: T[]; meta: PaginationMeta };

export const HARDWARE_MODULE_KINDS = [
  "chipset",
  "cpu",
  "gpu",
  "npu",
  "modem",
  "memory-standard",
  "storage-standard",
  "operating-system",
  "camera",
  "display",
  "battery",
] as const;

export type HardwareModuleKind = (typeof HARDWARE_MODULE_KINDS)[number];

type VariantUsage = Prisma.device_variantsGetPayload<{
  select: typeof VARIANT_USAGE_SELECT;
}>;

export type HardwareDeviceUsage = {
  variant_id: string;
  variant_name: string;
  market_name: string | null;
  color_name: string | null;
  color_hex: string | null;
  launch_price: unknown;
  is_default: boolean;
  currency: VariantUsage["currency"];
  device_model: VariantUsage["device_model"];
  usage_role?: string;
  details?: Record<string, unknown>;
};

export type HardwareProductLineResearch = {
  family: {
    id: string;
    name: string;
    slug: string;
    brand: {
      name: string;
      short_name: string | null;
      slug: string;
    };
    category: {
      name: string;
      slug: string;
    };
  };
  model_count: number;
  variant_count: number;
  market_count: number;
  usage_roles: string[];
  representative_variant_ids: string[];
  models: Array<{
    id: string;
    name: string;
    slug: string;
    generation_label: string | null;
    release_date: Date | null;
    variant_count: number;
    representative_variant_id: string;
  }>;
};

export type HardwareResearchSummary = {
  variant_count: number;
  product_count: number;
  brand_count: number;
  category_count: number;
  priced_variant_count: number;
  spec_field_count: number;
  populated_spec_field_count: number;
  completeness_percent: number;
  missing_specs: string[];
  representative_variant_ids: string[];
  product_lines: HardwareProductLineResearch[];
};

type ProductLineAccumulator = {
  family: HardwareProductLineResearch["family"];
  variantIds: Set<string>;
  markets: Set<string>;
  usageRoles: Set<string>;
  models: Map<
    string,
    {
      id: string;
      name: string;
      slug: string;
      generation_label: string | null;
      release_date: Date | null;
      variantIds: Set<string>;
      representativeVariantId: string;
      hasDefaultVariant: boolean;
    }
  >;
};

export type HardwareModuleDetail = {
  kind: HardwareModuleKind;
  id: string;
  name: string;
  slug: string;
  description: string | null;
  image_url: string | null;
  image_source_url: string | null;
  image_is_module: boolean;
  image_device: {
    name: string;
    slug: string;
  } | null;
  organization: {
    id: string;
    name: string;
    slug: string;
    short_name: string | null;
    logo_url: string | null;
  } | null;
  specs: Record<string, unknown>;
  field_coverage: Record<string, HardwareFieldCoverage>;
  devices: HardwareDeviceUsage[];
  research: HardwareResearchSummary;
};

export type HardwareFieldCoverage = {
  status: "populated" | "derived" | "not_disclosed" | "not_applicable";
  source_url: string | null;
  notes: string | null;
};

type UnavailableHardwareValue = HardwareFieldCoverage & {
  availability_status: "not_disclosed" | "not_applicable";
  label: string;
};

export type CreatedHardwareModule = {
  id: string;
  kind: AdminHardwareModuleKind;
  name: string;
  slug: string;
  description: string | null;
  image_url?: string | null;
  image_source_url?: string | null;
};

@Injectable()
export class HardwareCatalogService {
  constructor(private readonly prisma: PrismaService) {}

  async listBenchmarks(targetType: string) {
    if (!new Set(["chipset", "cpu", "gpu", "npu"]).has(targetType)) {
      throw new BadRequestException("Unsupported hardware benchmark target");
    }

    return this.prisma.benchmarks.findMany({
      where: { target_type: targetType },
      select: {
        id: true,
        name: true,
        slug: true,
        benchmark_type: true,
        target_type: true,
        version: true,
        higher_is_better: true,
        unit: { select: { name: true, symbol: true } },
      },
      orderBy: [{ benchmark_type: "asc" }, { name: "asc" }],
    });
  }

  async createModule(
    dto: CreateHardwareModuleDto,
  ): Promise<CreatedHardwareModule> {
    this.validateNormalizedModuleInput(dto);
    const name = dto.name.trim();
    const slug = dto.slug.trim().toLowerCase();
    const description = dto.description?.trim() || null;
    const organizationId = await this.resolveOrganizationId(
      dto.organization_id,
    );
    const category = dto.category?.trim();
    const image = {
      image_url: dto.image_url,
      image_source_url: dto.image_source_url,
    };

    await this.validateChipsetBenchmarks(dto.kind, dto.benchmark_results);

    switch (dto.kind) {
      case "chipset": {
        if (!organizationId) {
          throw new BadRequestException("Chipsets require a manufacturer");
        }
        if (!category) {
          throw new BadRequestException("Chipsets require a chip kind");
        }
        if (
          (!dto.cpu && !dto.cpu_id) ||
          (!dto.gpu && !dto.gpu_id) ||
          (!dto.npu && !dto.npu_id)
        ) {
          throw new BadRequestException(
            "Chipsets require CPU, GPU and NPU component information",
          );
        }
        const item = await this.prisma.$transaction(async (tx) => {
          const cpuId = dto.cpu
            ? await this.resolveInlineChipsetCpu(tx, dto.cpu, organizationId)
            : dto.cpu_id!;
          const gpuId = dto.gpu
            ? await this.resolveInlineChipsetGpu(tx, dto.gpu, organizationId)
            : dto.gpu_id!;
          const npuId = dto.npu
            ? await this.resolveInlineChipsetNpu(tx, dto.npu, organizationId)
            : dto.npu_id!;
          const chipset = await tx.chipsets.create({
            data: {
              ...image,
              manufacturer_org_id: organizationId,
              chip_kind: category,
              name,
              slug,
              description,
              model_code: dto.model_code,
              supports_64bit: dto.supports_64bit,
              integrated_5g: dto.integrated_5g,
              integrated_wifi: dto.integrated_wifi,
              max_ram_gb: dto.max_ram_gb,
              max_display_resolution: dto.max_display_resolution,
              max_camera_mp: dto.max_camera_mp,
              announcement_date: dto.announcement_date,
              release_date: dto.release_date,
              chipset_cpu_links: {
                create: { cpu_id: cpuId, is_primary: true },
              },
              chipset_gpu_links: {
                create: { gpu_id: gpuId, is_primary: true },
              },
              chipset_npu_links: {
                create: { npu_id: npuId, is_primary: true },
              },
              ...(dto.modem_id && {
                chipset_modem_links: {
                  create: {
                    modem_id: dto.modem_id,
                    is_primary: true,
                    is_integrated: dto.modem_is_integrated ?? true,
                  },
                },
              }),
            },
            select: { id: true, name: true, slug: true, description: true },
          });
          await this.replaceChipsetBenchmarks(
            tx,
            chipset.id,
            dto.benchmark_results ?? [],
            false,
          );
          return chipset;
        });
        return this.createdModule(dto.kind, item);
      }
      case "cpu": {
        const item = await this.prisma.cpus.create({
          data: {
            ...image,
            manufacturer_org_id: organizationId,
            name,
            slug,
            description,
            core_count: dto.core_count,
            thread_count: dto.thread_count,
            big_little: dto.big_little,
            isa_name: dto.isa_name,
            microarchitecture: dto.microarchitecture,
            core_type: dto.core_type,
            max_frequency_mhz: dto.max_frequency_mhz,
            min_frequency_mhz: dto.min_frequency_mhz,
            l1_instruction_cache: dto.l1_instruction_cache,
            l1_data_cache: dto.l1_data_cache,
            l2_cache: dto.l2_cache,
            l3_cache: dto.l3_cache,
            supports_64bit: dto.supports_64bit,
            simd_extension: dto.simd_extension,
            virtualization: dto.virtualization,
            out_of_order: dto.out_of_order,
            smt: dto.smt,
            ...(dto.clusters?.length && {
              cpu_clusters: {
                create: this.cpuClusterCreateData(dto.clusters),
              },
            }),
          },
          select: { id: true, name: true, slug: true, description: true },
        });
        return this.createdModule(dto.kind, item);
      }
      case "gpu": {
        const item = await this.prisma.gpus.create({
          data: {
            ...image,
            manufacturer_org_id: organizationId,
            name,
            slug,
            description,
            shader_units: dto.shader_units,
            compute_units: dto.compute_units,
            clock_mhz: dto.clock_mhz,
            fp32_gflops: dto.fp32_gflops,
            ray_tracing_support: dto.ray_tracing_support,
            api_support: dto.api_support,
            gpu_generation: dto.gpu_generation,
            opengl_version: dto.opengl_version,
            opencl_version: dto.opencl_version,
            vulkan_version: dto.vulkan_version,
            directx_feature_level: dto.directx_feature_level,
            metal_support: dto.metal_support,
            cuda_support: dto.cuda_support,
            video_decode_codecs: dto.video_decode_codecs,
            video_encode_codecs: dto.video_encode_codecs,
            max_display_resolution: dto.max_display_resolution,
          },
          select: { id: true, name: true, slug: true, description: true },
        });
        return this.createdModule(dto.kind, item);
      }
      case "npu": {
        const item = await this.prisma.npus.create({
          data: {
            ...image,
            manufacturer_org_id: organizationId,
            name,
            slug,
            description,
            dedicated_npu: dto.dedicated_npu ?? true,
            tops: dto.dedicated_npu === false ? null : dto.tops,
            tops_int8: dto.dedicated_npu === false ? null : dto.tops_int8,
            tops_int4: dto.dedicated_npu === false ? null : dto.tops_int4,
            tops_fp16: dto.dedicated_npu === false ? null : dto.tops_fp16,
            dsp_name: dto.dsp_name,
            ai_engine_version: dto.ai_engine_version,
            tensor_accelerator: dto.tensor_accelerator,
            supports_int8: dto.supports_int8,
            supports_fp16: dto.supports_fp16,
            supports_fp32: dto.supports_fp32,
            quantization: dto.quantization,
          },
          select: { id: true, name: true, slug: true, description: true },
        });
        return this.createdModule(dto.kind, item);
      }
      case "modem": {
        const item = await this.prisma.modems.create({
          data: {
            ...image,
            manufacturer_org_id: organizationId,
            name,
            slug,
            description,
            max_downlink_mbps: dto.max_downlink_mbps,
            max_uplink_mbps: dto.max_uplink_mbps,
            supports_mmwave: dto.supports_mmwave,
            supports_satellite: dto.supports_satellite,
            supported_5g_modes: dto.supported_5g_modes,
            lte_category: dto.lte_category,
            supports_5g_nr: dto.supports_5g_nr,
            carrier_aggregation: dto.carrier_aggregation,
            volte: dto.volte,
            vonr: dto.vonr,
            dual_sim_capability: dto.dual_sim_capability,
            supported_technologies: dto.supported_technologies,
          },
          select: { id: true, name: true, slug: true, description: true },
        });
        return this.createdModule(dto.kind, item);
      }
      case "memory-standard": {
        const item = await this.prisma.memory_standards.create({
          data: {
            ...image,
            organization_id: organizationId,
            memory_type: category || null,
            name,
            slug,
            description,
            generation: dto.generation,
            max_data_rate_mtps: dto.max_data_rate_mtps,
            typical_data_rate_mtps: dto.typical_data_rate_mtps,
            jedec_standard: dto.jedec_standard,
            prefetch: dto.prefetch,
            ecc: dto.ecc,
            dual_channel: dto.dual_channel,
            voltage: dto.voltage,
            bandwidth_gbps: dto.bandwidth_gbps,
            channel_width_bits: dto.channel_width_bits,
            maximum_capacity_gb: dto.maximum_capacity_gb,
            is_mobile: dto.is_mobile,
            release_year: dto.release_year,
          },
          select: { id: true, name: true, slug: true, description: true },
        });
        return this.createdModule(dto.kind, item);
      }
      case "storage-standard": {
        const item = await this.prisma.storage_standards.create({
          data: {
            ...image,
            organization_id: organizationId,
            storage_type: category || null,
            name,
            slug,
            description,
            generation: dto.generation,
            jedec_standard: dto.jedec_standard,
            interface: dto.interface,
            half_duplex: dto.half_duplex,
            full_duplex: dto.full_duplex,
            command_queue: dto.command_queue,
            boot_partition: dto.boot_partition,
            rpmb: dto.rpmb,
            trim: dto.trim,
            secure_erase: dto.secure_erase,
            hs200: dto.hs200,
            hs400: dto.hs400,
            release_year: dto.release_year,
          },
          select: { id: true, name: true, slug: true, description: true },
        });
        return this.createdModule(dto.kind, item);
      }
      case "operating-system": {
        if (!category) {
          throw new BadRequestException(
            "Operating systems require an OS family",
          );
        }
        const item = await this.prisma.operating_systems.create({
          data: {
            ...image,
            vendor_org_id: organizationId,
            os_family: category,
            name,
            slug,
            description,
            kernel_type: dto.kernel_type,
            kernel_name: dto.kernel_name,
            license_name: dto.license_name,
            is_open_source: dto.is_open_source,
            initial_release_date: dto.initial_release_date,
            os_type: dto.os_type,
            supported_architectures: dto.supported_architectures,
            os_versions: {
              create: {
                version_name: this.operatingSystemVersionName(name),
                release_date: dto.initial_release_date,
              },
            },
          },
          select: { id: true, name: true, slug: true, description: true },
        });
        return this.createdModule(dto.kind, item);
      }
    }
  }

  async updateModule(
    kind: string,
    id: string,
    dto: UpdateHardwareModuleDto,
  ): Promise<CreatedHardwareModule> {
    const moduleKind = this.assertAdminModuleKind(kind);
    this.validateNormalizedModuleInput({ ...dto, kind: moduleKind });
    await this.validateChipsetBenchmarks(moduleKind, dto.benchmark_results);
    const common = {
      ...(dto.name !== undefined && { name: dto.name.trim() }),
      ...(dto.slug !== undefined && {
        slug: dto.slug.trim().toLowerCase(),
      }),
      ...(dto.description !== undefined && {
        description: dto.description.trim() || null,
      }),
      ...(dto.image_url !== undefined && { image_url: dto.image_url }),
      ...(dto.image_source_url !== undefined && {
        image_source_url: dto.image_source_url,
      }),
    };
    const organizationId =
      dto.organization_id === undefined
        ? undefined
        : await this.resolveOrganizationId(dto.organization_id);
    const category = dto.category?.trim();

    switch (moduleKind) {
      case "chipset": {
        const item = await this.prisma.$transaction(async (tx) => {
          const chipset = await tx.chipsets.update({
            where: { id },
            data: {
              ...common,
              ...(organizationId !== undefined && {
                manufacturer_org_id: organizationId,
              }),
              ...(category !== undefined && { chip_kind: category }),
              model_code: dto.model_code,
              supports_64bit: dto.supports_64bit,
              integrated_5g: dto.integrated_5g,
              integrated_wifi: dto.integrated_wifi,
              max_ram_gb: dto.max_ram_gb,
              max_display_resolution: dto.max_display_resolution,
              max_camera_mp: dto.max_camera_mp,
              announcement_date: dto.announcement_date,
              release_date: dto.release_date,
              ...(dto.cpu_id !== undefined && {
                chipset_cpu_links: {
                  deleteMany: {},
                  ...(dto.cpu_id && {
                    create: { cpu_id: dto.cpu_id, is_primary: true },
                  }),
                },
              }),
              ...(dto.gpu_id !== undefined && {
                chipset_gpu_links: {
                  deleteMany: {},
                  ...(dto.gpu_id && {
                    create: { gpu_id: dto.gpu_id, is_primary: true },
                  }),
                },
              }),
              ...(dto.npu_id !== undefined && {
                chipset_npu_links: {
                  deleteMany: {},
                  ...(dto.npu_id && {
                    create: { npu_id: dto.npu_id, is_primary: true },
                  }),
                },
              }),
              ...(dto.modem_id !== undefined && {
                chipset_modem_links: {
                  deleteMany: {},
                  ...(dto.modem_id && {
                    create: {
                      modem_id: dto.modem_id,
                      is_primary: true,
                      is_integrated: dto.modem_is_integrated ?? true,
                    },
                  }),
                },
              }),
            },
            select: { id: true, name: true, slug: true, description: true },
          });
          if (dto.benchmark_results !== undefined) {
            await this.replaceChipsetBenchmarks(
              tx,
              chipset.id,
              dto.benchmark_results,
              true,
            );
          }
          return chipset;
        });
        return this.createdModule(moduleKind, item);
      }
      case "cpu": {
        const item = await this.prisma.cpus.update({
          where: { id },
          data: {
            ...common,
            ...(organizationId !== undefined && {
              manufacturer_org_id: organizationId,
            }),
            core_count: dto.core_count,
            thread_count: dto.thread_count,
            big_little: dto.big_little,
            isa_name: dto.isa_name,
            microarchitecture: dto.microarchitecture,
            core_type: dto.core_type,
            max_frequency_mhz: dto.max_frequency_mhz,
            min_frequency_mhz: dto.min_frequency_mhz,
            l1_instruction_cache: dto.l1_instruction_cache,
            l1_data_cache: dto.l1_data_cache,
            l2_cache: dto.l2_cache,
            l3_cache: dto.l3_cache,
            supports_64bit: dto.supports_64bit,
            simd_extension: dto.simd_extension,
            virtualization: dto.virtualization,
            out_of_order: dto.out_of_order,
            smt: dto.smt,
            ...(dto.clusters !== undefined && {
              cpu_clusters: {
                deleteMany: {},
                ...(dto.clusters.length && {
                  create: this.cpuClusterCreateData(dto.clusters),
                }),
              },
            }),
          },
          select: { id: true, name: true, slug: true, description: true },
        });
        return this.createdModule(moduleKind, item);
      }
      case "gpu": {
        const item = await this.prisma.gpus.update({
          where: { id },
          data: {
            ...common,
            ...(organizationId !== undefined && {
              manufacturer_org_id: organizationId,
            }),
            shader_units: dto.shader_units,
            compute_units: dto.compute_units,
            clock_mhz: dto.clock_mhz,
            fp32_gflops: dto.fp32_gflops,
            ray_tracing_support: dto.ray_tracing_support,
            api_support: dto.api_support,
            gpu_generation: dto.gpu_generation,
            opengl_version: dto.opengl_version,
            opencl_version: dto.opencl_version,
            vulkan_version: dto.vulkan_version,
            directx_feature_level: dto.directx_feature_level,
            metal_support: dto.metal_support,
            cuda_support: dto.cuda_support,
            video_decode_codecs: dto.video_decode_codecs,
            video_encode_codecs: dto.video_encode_codecs,
            max_display_resolution: dto.max_display_resolution,
          },
          select: { id: true, name: true, slug: true, description: true },
        });
        return this.createdModule(moduleKind, item);
      }
      case "npu": {
        const item = await this.prisma.npus.update({
          where: { id },
          data: {
            ...common,
            ...(organizationId !== undefined && {
              manufacturer_org_id: organizationId,
            }),
            dedicated_npu: dto.dedicated_npu,
            tops: dto.dedicated_npu === false ? null : dto.tops,
            tops_int8: dto.dedicated_npu === false ? null : dto.tops_int8,
            tops_int4: dto.dedicated_npu === false ? null : dto.tops_int4,
            tops_fp16: dto.dedicated_npu === false ? null : dto.tops_fp16,
            dsp_name: dto.dsp_name,
            ai_engine_version: dto.ai_engine_version,
            tensor_accelerator: dto.tensor_accelerator,
            supports_int8: dto.supports_int8,
            supports_fp16: dto.supports_fp16,
            supports_fp32: dto.supports_fp32,
            quantization: dto.quantization,
          },
          select: { id: true, name: true, slug: true, description: true },
        });
        return this.createdModule(moduleKind, item);
      }
      case "modem": {
        const item = await this.prisma.modems.update({
          where: { id },
          data: {
            ...common,
            ...(organizationId !== undefined && {
              manufacturer_org_id: organizationId,
            }),
            max_downlink_mbps: dto.max_downlink_mbps,
            max_uplink_mbps: dto.max_uplink_mbps,
            supports_mmwave: dto.supports_mmwave,
            supports_satellite: dto.supports_satellite,
            supported_5g_modes: dto.supported_5g_modes,
            lte_category: dto.lte_category,
            supports_5g_nr: dto.supports_5g_nr,
            carrier_aggregation: dto.carrier_aggregation,
            volte: dto.volte,
            vonr: dto.vonr,
            dual_sim_capability: dto.dual_sim_capability,
            supported_technologies: dto.supported_technologies,
          },
          select: { id: true, name: true, slug: true, description: true },
        });
        return this.createdModule(moduleKind, item);
      }
      case "memory-standard": {
        const item = await this.prisma.memory_standards.update({
          where: { id },
          data: {
            ...common,
            ...(organizationId !== undefined && {
              organization_id: organizationId,
            }),
            ...(category !== undefined && { memory_type: category || null }),
            generation: dto.generation,
            max_data_rate_mtps: dto.max_data_rate_mtps,
            typical_data_rate_mtps: dto.typical_data_rate_mtps,
            jedec_standard: dto.jedec_standard,
            prefetch: dto.prefetch,
            ecc: dto.ecc,
            dual_channel: dto.dual_channel,
            voltage: dto.voltage,
            bandwidth_gbps: dto.bandwidth_gbps,
            channel_width_bits: dto.channel_width_bits,
            maximum_capacity_gb: dto.maximum_capacity_gb,
            is_mobile: dto.is_mobile,
            release_year: dto.release_year,
          },
          select: { id: true, name: true, slug: true, description: true },
        });
        return this.createdModule(moduleKind, item);
      }
      case "storage-standard": {
        const item = await this.prisma.storage_standards.update({
          where: { id },
          data: {
            ...common,
            ...(organizationId !== undefined && {
              organization_id: organizationId,
            }),
            ...(category !== undefined && { storage_type: category || null }),
            generation: dto.generation,
            jedec_standard: dto.jedec_standard,
            interface: dto.interface,
            half_duplex: dto.half_duplex,
            full_duplex: dto.full_duplex,
            command_queue: dto.command_queue,
            boot_partition: dto.boot_partition,
            rpmb: dto.rpmb,
            trim: dto.trim,
            secure_erase: dto.secure_erase,
            hs200: dto.hs200,
            hs400: dto.hs400,
            release_year: dto.release_year,
          },
          select: { id: true, name: true, slug: true, description: true },
        });
        return this.createdModule(moduleKind, item);
      }
      case "operating-system": {
        const item = await this.prisma.operating_systems.update({
          where: { id },
          data: {
            ...common,
            ...(organizationId !== undefined && {
              vendor_org_id: organizationId,
            }),
            ...(category !== undefined && { os_family: category }),
            kernel_type: dto.kernel_type,
            kernel_name: dto.kernel_name,
            license_name: dto.license_name,
            is_open_source: dto.is_open_source,
            initial_release_date: dto.initial_release_date,
            os_type: dto.os_type,
            supported_architectures: dto.supported_architectures,
          },
          select: { id: true, name: true, slug: true, description: true },
        });
        return this.createdModule(moduleKind, item);
      }
    }
  }

  async removeModule(kind: string, id: string): Promise<CreatedHardwareModule> {
    const moduleKind = this.assertAdminModuleKind(kind);

    try {
      switch (moduleKind) {
        case "chipset": {
          const linked = await this.prisma.chipsets.findUnique({
            where: { id },
            select: {
              _count: {
                select: {
                  variant_chipsets: true,
                  chipset_cpu_links: true,
                  chipset_gpu_links: true,
                  chipset_npu_links: true,
                  chipset_modem_links: true,
                  chipset_benchmarks: true,
                },
              },
            },
          });
          if (!linked) {
            throw new NotFoundException(`Hardware module ${id} not found`);
          }
          if (Object.values(linked._count).some((count) => count > 0)) {
            throw new BadRequestException(
              "Không thể xóa chipset đang được mô-đun hoặc thiết bị sử dụng. Hãy gỡ các liên kết trước.",
            );
          }
          const item = await this.prisma.chipsets.update({
            where: { id },
            data: { deleted_at: new Date() },
            select: { id: true, name: true, slug: true, description: true },
          });
          return this.createdModule(moduleKind, item);
        }
        case "cpu":
          return this.createdModule(
            moduleKind,
            await this.prisma.cpus.delete({
              where: { id },
              select: { id: true, name: true, slug: true, description: true },
            }),
          );
        case "gpu":
          return this.createdModule(
            moduleKind,
            await this.prisma.gpus.delete({
              where: { id },
              select: { id: true, name: true, slug: true, description: true },
            }),
          );
        case "npu":
          return this.createdModule(
            moduleKind,
            await this.prisma.npus.delete({
              where: { id },
              select: { id: true, name: true, slug: true, description: true },
            }),
          );
        case "modem":
          return this.createdModule(
            moduleKind,
            await this.prisma.modems.delete({
              where: { id },
              select: { id: true, name: true, slug: true, description: true },
            }),
          );
        case "memory-standard":
          return this.createdModule(
            moduleKind,
            await this.prisma.memory_standards.delete({
              where: { id },
              select: { id: true, name: true, slug: true, description: true },
            }),
          );
        case "storage-standard":
          return this.createdModule(
            moduleKind,
            await this.prisma.storage_standards.delete({
              where: { id },
              select: { id: true, name: true, slug: true, description: true },
            }),
          );
        case "operating-system":
          return this.createdModule(
            moduleKind,
            await this.prisma.operating_systems.delete({
              where: { id },
              select: { id: true, name: true, slug: true, description: true },
            }),
          );
      }
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === "P2003"
      ) {
        throw new BadRequestException(
          "Không thể xóa mô-đun đang được chipset hoặc thiết bị sử dụng. Hãy gỡ các liên kết trước.",
        );
      }
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === "P2025"
      ) {
        throw new NotFoundException(`Hardware module ${id} not found`);
      }
      throw error;
    }
  }

  async listCpus(query: HardwareCatalogQueryDto) {
    const where = this.textWhere(query);
    const pagination = this.pagination(query);
    return this.paginate(
      query,
      () =>
        this.prisma.cpus.findMany({
          where,
          select: CPU_SELECT,
          ...pagination,
          orderBy: [{ name: "asc" }],
        }),
      () => this.prisma.cpus.count({ where }),
    );
  }

  async listGpus(query: HardwareCatalogQueryDto) {
    const where = this.textWhere(query);
    const pagination = this.pagination(query);
    return this.paginate(
      query,
      () =>
        this.prisma.gpus.findMany({
          where,
          select: GPU_SELECT,
          ...pagination,
          orderBy: [{ name: "asc" }],
        }),
      () => this.prisma.gpus.count({ where }),
    );
  }

  async listNpus(query: HardwareCatalogQueryDto) {
    const where = this.textWhere(query);
    const pagination = this.pagination(query);
    return this.paginate(
      query,
      () =>
        this.prisma.npus.findMany({
          where,
          select: NPU_SELECT,
          ...pagination,
          orderBy: [{ name: "asc" }],
        }),
      () => this.prisma.npus.count({ where }),
    );
  }

  async listModems(query: HardwareCatalogQueryDto) {
    const where = this.textWhere(query);
    const pagination = this.pagination(query);
    return this.paginate(
      query,
      () =>
        this.prisma.modems.findMany({
          where,
          select: MODEM_SELECT,
          ...pagination,
          orderBy: [{ name: "asc" }],
        }),
      () => this.prisma.modems.count({ where }),
    );
  }

  async listMemoryStandards(query: HardwareCatalogQueryDto) {
    const where = this.textWhere(query);
    const pagination = this.pagination(query);
    return this.paginate(
      query,
      () =>
        this.prisma.memory_standards.findMany({
          where,
          select: MEMORY_SELECT,
          ...pagination,
          orderBy: [{ name: "asc" }],
        }),
      () => this.prisma.memory_standards.count({ where }),
    );
  }

  async listStorageStandards(query: HardwareCatalogQueryDto) {
    const where = this.textWhere(query);
    const pagination = this.pagination(query);
    return this.paginate(
      query,
      () =>
        this.prisma.storage_standards.findMany({
          where,
          select: STORAGE_SELECT,
          ...pagination,
          orderBy: [{ name: "asc" }],
        }),
      () => this.prisma.storage_standards.count({ where }),
    );
  }

  async listOperatingSystems(query: HardwareCatalogQueryDto) {
    const where = this.textWhere(query);
    const pagination = this.pagination(query);
    return this.paginate(
      query,
      () =>
        this.prisma.operating_systems.findMany({
          where,
          select: OS_SELECT,
          ...pagination,
          orderBy: [{ name: "asc" }],
        }),
      () => this.prisma.operating_systems.count({ where }),
    );
  }

  async createOperatingSystemVersion(dto: CreateOperatingSystemVersionDto) {
    if (!dto.operating_system_id && !dto.operating_system) {
      throw new BadRequestException(
        "Chọn hệ điều hành đã có hoặc nhập thông tin hệ điều hành mới.",
      );
    }
    const reference = dto.operating_system;
    const vendorId = reference
      ? await this.resolveOrganizationId(reference.vendor_org_id)
      : undefined;
    const versionName = dto.version_name.trim();

    return this.prisma.$transaction(async (tx) => {
      let operatingSystem = dto.operating_system_id
        ? await tx.operating_systems.findFirst({
            where: { id: dto.operating_system_id },
            select: { id: true, name: true, slug: true, os_family: true },
          })
        : null;
      if (!operatingSystem && reference) {
        const name = reference.name.trim();
        const slug = reference.slug.trim().toLowerCase();
        operatingSystem = await tx.operating_systems.findFirst({
          where: { OR: [{ name }, { slug }] },
          select: { id: true, name: true, slug: true, os_family: true },
        });
        operatingSystem ??= await tx.operating_systems.create({
          data: {
            name,
            slug,
            os_family: reference.os_family.trim(),
            vendor_org_id: vendorId,
            description: reference.description?.trim() || null,
          },
          select: { id: true, name: true, slug: true, os_family: true },
        });
      }
      if (!operatingSystem) {
        throw new BadRequestException("Hệ điều hành gốc không tồn tại.");
      }
      const existing = await tx.os_versions.findFirst({
        where: {
          operating_system_id: operatingSystem.id,
          version_name: versionName,
        },
        select: { id: true },
      });
      if (existing) {
        throw new ConflictException(
          `${operatingSystem.name} ${versionName} đã tồn tại.`,
        );
      }
      return tx.os_versions.create({
        data: {
          operating_system_id: operatingSystem.id,
          version_name: versionName,
          codename: dto.codename?.trim() || null,
          release_date: dto.release_date,
          end_of_support_date: dto.end_of_support_date,
          api_level: dto.api_level,
          kernel_version: dto.kernel_version?.trim() || null,
          notes: dto.notes?.trim() || null,
        },
        select: OS_VERSION_SELECT,
      });
    });
  }

  async listOsUiLayers(query: HardwareCatalogQueryDto) {
    const q = query.q?.trim();
    const where: Prisma.os_ui_layersWhereInput = q
      ? {
          OR: [
            { name: { contains: q, mode: "insensitive" } },
            { slug: { contains: q, mode: "insensitive" } },
            { description: { contains: q, mode: "insensitive" } },
          ],
        }
      : {};
    const pagination = this.pagination(query);
    return this.paginate(
      query,
      () =>
        this.prisma.os_ui_layers.findMany({
          where,
          select: OS_UI_LAYER_SELECT,
          ...pagination,
          orderBy: [{ name: "asc" }],
        }),
      () => this.prisma.os_ui_layers.count({ where }),
    );
  }

  async createOsUiLayerVersion(dto: CreateOsUiLayerVersionDto) {
    if (!dto.ui_layer_id && !dto.ui_layer) {
      throw new BadRequestException(
        "Chọn giao diện đã có hoặc nhập thông tin giao diện mới.",
      );
    }
    const reference = dto.ui_layer;
    const vendorId = reference
      ? await this.resolveOrganizationId(reference.vendor_org_id)
      : undefined;
    const versionName = dto.version_name.trim();

    return this.prisma.$transaction(async (tx) => {
      let uiLayer = dto.ui_layer_id
        ? await tx.os_ui_layers.findFirst({
            where: { id: dto.ui_layer_id },
            select: { id: true, name: true, slug: true },
          })
        : null;
      if (!uiLayer && reference) {
        const name = reference.name.trim();
        const slug = reference.slug.trim().toLowerCase();
        uiLayer = await tx.os_ui_layers.findFirst({
          where: { OR: [{ name }, { slug }] },
          select: { id: true, name: true, slug: true },
        });
        uiLayer ??= await tx.os_ui_layers.create({
          data: {
            name,
            slug,
            vendor_org_id: vendorId,
            base_os_id: reference.base_os_id,
            description: reference.description?.trim() || null,
          },
          select: { id: true, name: true, slug: true },
        });
      }
      if (!uiLayer) {
        throw new BadRequestException("Giao diện hệ điều hành không tồn tại.");
      }
      const existing = await tx.os_ui_layer_versions.findFirst({
        where: { ui_layer_id: uiLayer.id, version_name: versionName },
        select: { id: true },
      });
      if (existing) {
        throw new ConflictException(
          `${uiLayer.name} ${versionName} đã tồn tại.`,
        );
      }
      return tx.os_ui_layer_versions.create({
        data: {
          ui_layer_id: uiLayer.id,
          version_name: versionName,
          base_os_version_id: dto.base_os_version_id,
          release_date: dto.release_date,
          notes: dto.notes?.trim() || null,
        },
        select: OS_UI_LAYER_VERSION_SELECT,
      });
    });
  }

  async listOperatingSystemVersions(query: HardwareCatalogQueryDto) {
    const q = query.q?.trim();
    const where: Prisma.os_versionsWhereInput = q
      ? {
          OR: [
            { version_name: { contains: q, mode: "insensitive" } },
            { codename: { contains: q, mode: "insensitive" } },
            {
              operating_system: {
                OR: [
                  { name: { contains: q, mode: "insensitive" } },
                  { slug: { contains: q, mode: "insensitive" } },
                ],
              },
            },
          ],
        }
      : {};
    const pagination = this.pagination(query);
    return this.paginate(
      query,
      () =>
        this.prisma.os_versions.findMany({
          where,
          select: OS_VERSION_SELECT,
          ...pagination,
          orderBy: [
            { operating_system: { name: "asc" } },
            { release_date: "desc" },
            { version_name: "desc" },
          ],
        }),
      () => this.prisma.os_versions.count({ where }),
    );
  }

  async listOsUiLayerVersions(query: HardwareCatalogQueryDto) {
    const q = query.q?.trim();
    const where: Prisma.os_ui_layer_versionsWhereInput = q
      ? {
          OR: [
            { version_name: { contains: q, mode: "insensitive" } },
            {
              ui_layer: {
                OR: [
                  { name: { contains: q, mode: "insensitive" } },
                  { slug: { contains: q, mode: "insensitive" } },
                ],
              },
            },
          ],
        }
      : {};
    const pagination = this.pagination(query);
    return this.paginate(
      query,
      () =>
        this.prisma.os_ui_layer_versions.findMany({
          where,
          select: OS_UI_LAYER_VERSION_SELECT,
          ...pagination,
          orderBy: [
            { ui_layer: { name: "asc" } },
            { release_date: "desc" },
            { version_name: "desc" },
          ],
        }),
      () => this.prisma.os_ui_layer_versions.count({ where }),
    );
  }

  async findByKindAndSlug(
    kind: string,
    slug: string,
  ): Promise<HardwareModuleDetail> {
    if (!HARDWARE_MODULE_KINDS.includes(kind as HardwareModuleKind)) {
      throw new NotFoundException(`Hardware module type ${kind} not found`);
    }

    let detail: HardwareModuleDetail;
    switch (kind as HardwareModuleKind) {
      case "chipset":
        detail = await this.findChipset(slug);
        break;
      case "cpu":
        detail = await this.findCpu(slug);
        break;
      case "gpu":
        detail = await this.findGpu(slug);
        break;
      case "npu":
        detail = await this.findNpu(slug);
        break;
      case "modem":
        detail = await this.findModem(slug);
        break;
      case "memory-standard":
        detail = await this.findMemoryStandard(slug);
        break;
      case "storage-standard":
        detail = await this.findStorageStandard(slug);
        break;
      case "operating-system":
        detail = await this.findOperatingSystem(slug);
        break;
      case "camera":
        detail = await this.findCamera(slug);
        break;
      case "display":
        detail = await this.findDisplay(slug);
        break;
      case "battery":
        detail = await this.findBattery(slug);
        break;
    }

    return this.withFieldCoverage(detail);
  }

  private async findChipset(slug: string): Promise<HardwareModuleDetail> {
    const item = await this.prisma.chipsets.findFirst({
      where: { slug, deleted_at: null },
      select: CHIPSET_DETAIL_SELECT,
    });
    if (!item) throw new NotFoundException(`Chipset ${slug} not found`);

    return this.module(
      "chipset",
      item,
      item.manufacturer,
      {
        chip_kind: item.chip_kind,
        model_code: item.model_code,
        supports_64bit: item.supports_64bit,
        integrated_5g: item.integrated_5g,
        integrated_wifi: item.integrated_wifi,
        max_ram_gb: item.max_ram_gb,
        max_display_resolution: item.max_display_resolution,
        max_camera_mp: item.max_camera_mp,
        announcement_date: item.announcement_date,
        release_date: item.release_date,
        cpus: item.chipset_cpu_links.map((link) => ({
          ...link.cpu,
          is_primary: link.is_primary,
        })),
        gpus: item.chipset_gpu_links.map((link) => ({
          ...link.gpu,
          is_primary: link.is_primary,
        })),
        npus: item.chipset_npu_links.map((link) => ({
          ...link.npu,
          is_primary: link.is_primary,
        })),
        modems: item.chipset_modem_links.map((link) => ({
          ...link.modem,
          is_primary: link.is_primary,
          is_integrated: link.is_integrated,
        })),
        benchmarks: item.chipset_benchmarks.map((result) => ({
          name: result.benchmark.name,
          version: result.benchmark.version,
          type: result.benchmark.benchmark_type,
          score: result.score,
          subscore: result.subscore_name,
          unit: result.benchmark.unit?.symbol ?? null,
          tested_at: result.tested_at,
          environment: result.benchmark_run?.test_environment_note ?? null,
        })),
      },
      item.variant_chipsets.map((link) =>
        this.usage(link.device_variant, link.chip_role),
      ),
    );
  }

  private async findCpu(slug: string): Promise<HardwareModuleDetail> {
    const item = await this.prisma.cpus.findFirst({
      where: { slug },
      select: CPU_DETAIL_SELECT,
    });
    if (!item) throw new NotFoundException(`CPU ${slug} not found`);

    return this.module(
      "cpu",
      item,
      item.manufacturer,
      {
        core_count: item.core_count,
        thread_count: item.thread_count,
        big_little: item.big_little,
        isa_name: item.isa_name,
        microarchitecture: item.microarchitecture,
        core_type: item.core_type,
        max_frequency_mhz: item.max_frequency_mhz,
        min_frequency_mhz: item.min_frequency_mhz,
        l1_instruction_cache: item.l1_instruction_cache,
        l1_data_cache: item.l1_data_cache,
        l2_cache: item.l2_cache,
        l3_cache: item.l3_cache,
        supports_64bit: item.supports_64bit,
        simd_extension: item.simd_extension,
        virtualization: item.virtualization,
        out_of_order: item.out_of_order,
        smt: item.smt,
        architecture: item.architecture,
        clusters: item.cpu_clusters,
        chipsets: (item.chipset_cpu_links ?? []).map((link) => ({
          id: link.chipset.id,
          name: link.chipset.name,
          slug: link.chipset.slug,
          is_primary: link.is_primary,
        })),
      },
      [
        ...item.variant_cpus.map((link) =>
          this.usage(link.device_variant, link.cpu_role),
        ),
        ...this.chipsetUsages(item.chipset_cpu_links ?? []),
      ],
    );
  }

  private async findGpu(slug: string): Promise<HardwareModuleDetail> {
    const item = await this.prisma.gpus.findFirst({
      where: { slug },
      select: GPU_DETAIL_SELECT,
    });
    if (!item) throw new NotFoundException(`GPU ${slug} not found`);

    return this.module(
      "gpu",
      item,
      item.manufacturer,
      {
        shader_units: item.shader_units,
        compute_units: item.compute_units,
        clock_mhz: item.clock_mhz,
        fp32_gflops: item.fp32_gflops,
        ray_tracing_support: item.ray_tracing_support,
        api_support: item.api_support,
        gpu_generation: item.gpu_generation,
        opengl_version: item.opengl_version,
        opencl_version: item.opencl_version,
        vulkan_version: item.vulkan_version,
        directx_feature_level: item.directx_feature_level,
        metal_support: item.metal_support,
        cuda_support: item.cuda_support,
        video_decode_codecs: item.video_decode_codecs,
        video_encode_codecs: item.video_encode_codecs,
        max_display_resolution: item.max_display_resolution,
        architecture: item.architecture,
        chipsets: (item.chipset_gpu_links ?? []).map((link) => ({
          id: link.chipset.id,
          name: link.chipset.name,
          slug: link.chipset.slug,
          is_primary: link.is_primary,
        })),
      },
      [
        ...item.variant_gpus.map((link) =>
          this.usage(link.device_variant, link.gpu_role),
        ),
        ...this.chipsetUsages(item.chipset_gpu_links ?? []),
      ],
    );
  }

  private async findNpu(slug: string): Promise<HardwareModuleDetail> {
    const item = await this.prisma.npus.findFirst({
      where: { slug },
      select: NPU_DETAIL_SELECT,
    });
    if (!item) throw new NotFoundException(`NPU ${slug} not found`);

    return this.module(
      "npu",
      item,
      item.manufacturer,
      {
        tops: item.tops,
        tops_int8: item.tops_int8,
        tops_int4: item.tops_int4,
        tops_fp16: item.tops_fp16,
        dedicated_npu: item.dedicated_npu,
        dsp_name: item.dsp_name,
        ai_engine_version: item.ai_engine_version,
        tensor_accelerator: item.tensor_accelerator,
        supports_int8: item.supports_int8,
        supports_fp16: item.supports_fp16,
        supports_fp32: item.supports_fp32,
        quantization: item.quantization,
        architecture: item.architecture,
        chipsets: (item.chipset_npu_links ?? []).map((link) => ({
          id: link.chipset.id,
          name: link.chipset.name,
          slug: link.chipset.slug,
          is_primary: link.is_primary,
        })),
      },
      [
        ...item.variant_npus.map((link) =>
          this.usage(link.device_variant, link.npu_role),
        ),
        ...this.chipsetUsages(item.chipset_npu_links ?? []),
      ],
    );
  }

  private async findModem(slug: string): Promise<HardwareModuleDetail> {
    const item = await this.prisma.modems.findFirst({
      where: { slug },
      select: MODEM_DETAIL_SELECT,
    });
    if (!item) throw new NotFoundException(`Modem ${slug} not found`);

    return this.module(
      "modem",
      item,
      item.manufacturer,
      {
        max_downlink_mbps: item.max_downlink_mbps,
        max_uplink_mbps: item.max_uplink_mbps,
        supports_mmwave: item.supports_mmwave,
        supports_satellite: item.supports_satellite,
        supported_5g_modes: item.supported_5g_modes,
        lte_category: item.lte_category,
        supports_5g_nr: item.supports_5g_nr,
        carrier_aggregation: item.carrier_aggregation,
        volte: item.volte,
        vonr: item.vonr,
        dual_sim_capability: item.dual_sim_capability,
        supported_technologies: item.supported_technologies,
        chipsets: (item.chipset_modem_links ?? []).map((link) => ({
          id: link.chipset.id,
          name: link.chipset.name,
          slug: link.chipset.slug,
          is_primary: link.is_primary,
          is_integrated: link.is_integrated,
        })),
      },
      [
        ...item.variant_modems.map((link) =>
          this.usage(link.device_variant, link.modem_role),
        ),
        ...this.chipsetUsages(item.chipset_modem_links ?? []),
      ],
    );
  }

  private async findMemoryStandard(
    slug: string,
  ): Promise<HardwareModuleDetail> {
    const item = await this.prisma.memory_standards.findFirst({
      where: { slug },
      select: MEMORY_DETAIL_SELECT,
    });
    if (!item) throw new NotFoundException(`Memory standard ${slug} not found`);

    return this.module(
      "memory-standard",
      item,
      item.organization,
      {
        memory_type: item.memory_type,
        generation: item.generation,
        max_data_rate_mtps: item.max_data_rate_mtps,
        typical_data_rate_mtps: item.typical_data_rate_mtps,
        jedec_standard: item.jedec_standard,
        prefetch: item.prefetch,
        ecc: item.ecc,
        dual_channel: item.dual_channel,
        voltage: item.voltage,
        bandwidth_gbps: item.bandwidth_gbps,
        channel_width_bits: item.channel_width_bits,
        maximum_capacity_gb: item.maximum_capacity_gb,
        is_mobile: item.is_mobile,
        release_year: item.release_year,
      },
      item.variant_memory_configs.map((link) =>
        this.usage(link.device_variant, undefined, {
          capacity_gb: link.capacity_gb,
          bandwidth_gbps: link.bandwidth_gbps,
          channel_count: link.channel_count,
        }),
      ),
    );
  }

  private async findStorageStandard(
    slug: string,
  ): Promise<HardwareModuleDetail> {
    const item = await this.prisma.storage_standards.findFirst({
      where: { slug },
      select: STORAGE_DETAIL_SELECT,
    });
    if (!item)
      throw new NotFoundException(`Storage standard ${slug} not found`);

    return this.module(
      "storage-standard",
      item,
      item.organization,
      {
        storage_type: item.storage_type,
        generation: item.generation,
        jedec_standard: item.jedec_standard,
        interface: item.interface,
        half_duplex: item.half_duplex,
        full_duplex: item.full_duplex,
        command_queue: item.command_queue,
        boot_partition: item.boot_partition,
        rpmb: item.rpmb,
        trim: item.trim,
        secure_erase: item.secure_erase,
        hs200: item.hs200,
        hs400: item.hs400,
        release_year: item.release_year,
      },
      item.variant_storage_configs.map((link) =>
        this.usage(link.device_variant, undefined, {
          total_capacity_gb: link.total_capacity_gb,
          module_count: link.module_count,
          is_expandable: link.is_expandable,
          expansion_max_gb: link.expansion_max_gb,
        }),
      ),
    );
  }

  private async findOperatingSystem(
    slug: string,
  ): Promise<HardwareModuleDetail> {
    const item = await this.prisma.operating_systems.findFirst({
      where: { slug },
      select: OS_DETAIL_SELECT,
    });
    if (!item)
      throw new NotFoundException(`Operating system ${slug} not found`);

    const devices = item.os_versions.flatMap((version) =>
      version.variant_operating_systems.map((link) =>
        this.usage(link.device_variant, undefined, {
          version_name: version.version_name,
          codename: version.codename,
          release_date: version.release_date,
          api_level: version.api_level,
          is_default: link.is_default,
          is_upgradable_to: link.is_upgradable_to,
          promised_major_updates: link.promised_major_updates,
          promised_security_years: link.promised_security_years,
        }),
      ),
    );

    return this.module(
      "operating-system",
      item,
      item.vendor,
      {
        os_family: item.os_family,
        kernel_type: item.kernel_type,
        kernel_name: item.kernel_name,
        license_name: item.license_name,
        is_open_source: item.is_open_source,
        initial_release_date: item.initial_release_date,
        os_type: item.os_type,
        supported_architectures: item.supported_architectures,
        versions: item.os_versions.map((version) => ({
          version_name: version.version_name,
          codename: version.codename,
          release_date: version.release_date,
          api_level: version.api_level,
        })),
      },
      devices,
    );
  }

  private async findCamera(slug: string): Promise<HardwareModuleDetail> {
    const item = await this.prisma.camera_modules.findFirst({
      where: { slug },
      select: CAMERA_DETAIL_SELECT,
    });
    if (!item) throw new NotFoundException(`Camera module ${slug} not found`);

    return this.module(
      "camera",
      item,
      item.manufacturer,
      {
        role: item.camera_role,
        effective_megapixel: item.effective_megapixel,
        aperture: item.aperture,
        focal_length_mm_eq: item.focal_length_mm_eq,
        focal_length_mm_native: item.focal_length_mm_native,
        optical_zoom: item.optical_zoom,
        digital_zoom_max: item.digital_zoom_max,
        has_ois: item.has_ois,
        has_eis: item.has_eis,
        ois_type: item.ois_type,
        has_af: item.has_af,
        af_system: item.af_system,
        field_of_view_deg: item.field_of_view_deg,
        video_capabilities: item.video_capabilities,
        has_macro: item.has_macro,
      },
      item.variant_camera_modules.map((link) =>
        this.usage(link.device_variant, link.role, {
          position: link.position,
          module_order: link.module_order,
          is_primary: link.is_primary,
        }),
      ),
    );
  }

  private async findDisplay(slug: string): Promise<HardwareModuleDetail> {
    const item = await this.prisma.display_units.findFirst({
      where: { slug },
      select: DISPLAY_DETAIL_SELECT,
    });
    if (!item) throw new NotFoundException(`Display unit ${slug} not found`);

    return this.module(
      "display",
      item,
      item.manufacturer,
      {
        technology: item.display_technology,
        size_inch: item.size_inch,
        aspect_ratio: item.aspect_ratio,
        resolution_width: item.resolution_width,
        resolution_height: item.resolution_height,
        pixel_density_ppi: item.pixel_density_ppi,
        refresh_rate_hz: item.refresh_rate_hz,
        refresh_rate_min_hz: item.refresh_rate_min_hz,
        ltpo_version: item.ltpo_version,
        touch_sampling_hz: item.touch_sampling_hz,
        brightness_typical_nits: item.brightness_typical_nits,
        brightness_hbm_nits: item.brightness_hbm_nits,
        brightness_peak_nits: item.brightness_peak_nits,
        contrast_ratio: item.contrast_ratio,
        color_depth_bits: item.color_depth_bits,
        color_gamut: item.color_gamut,
        hdr_formats: item.hdr_formats,
        protection_glass: item.protection_glass,
        has_always_on: item.has_always_on,
      },
      item.variant_displays.map((link) =>
        this.usage(link.device_variant, link.display_role, {
          display_order: link.display_order,
        }),
      ),
    );
  }

  private async findBattery(slug: string): Promise<HardwareModuleDetail> {
    const item = await this.prisma.battery_units.findFirst({
      where: { slug },
      select: BATTERY_DETAIL_SELECT,
    });
    if (!item) throw new NotFoundException(`Battery unit ${slug} not found`);

    return this.module(
      "battery",
      item,
      item.manufacturer,
      {
        chemistry: item.battery_chemistry,
        capacity_mah: item.capacity_mah,
        rated_capacity_mah: item.rated_capacity_mah,
        energy_wh: item.energy_wh,
        voltage_nominal_v: item.voltage_nominal_v,
        cell_count: item.cell_count,
        cycle_life: item.cycle_life,
        wired_charging_w: item.wired_charging_w,
        wired_charging_protocol: item.wired_charging_protocol,
        wireless_charging_w: item.wireless_charging_w,
        wireless_charging_protocol: item.wireless_charging_protocol,
        reverse_wired_charging_w: item.reverse_wired_charging_w,
        reverse_wireless_charging_w: item.reverse_wireless_charging_w,
        removable: item.removable,
      },
      item.variant_batteries.map((link) =>
        this.usage(link.device_variant, link.battery_role, {
          is_primary: link.is_primary,
        }),
      ),
    );
  }

  private module(
    kind: HardwareModuleKind,
    item: {
      id: string;
      name?: string | null;
      slug?: string | null;
      description?: string | null;
      image_url?: string | null;
      image_source_url?: string | null;
    },
    organization: HardwareModuleDetail["organization"] | null | undefined,
    specs: Record<string, unknown>,
    devices: HardwareDeviceUsage[],
  ): HardwareModuleDetail {
    const uniqueDevices = this.uniqueUsages(devices);
    const imageDevice = uniqueDevices.find(
      (device) => device.device_model.cover_image_url,
    );

    return {
      kind,
      id: item.id,
      name: item.name ?? item.slug ?? kind,
      slug: item.slug ?? item.id,
      description: item.description ?? null,
      image_url:
        item.image_url ?? imageDevice?.device_model.cover_image_url ?? null,
      image_source_url: item.image_source_url ?? null,
      image_is_module: Boolean(item.image_url),
      image_device: item.image_url
        ? null
        : imageDevice
          ? {
              name: imageDevice.device_model.name,
              slug: imageDevice.device_model.slug,
            }
          : null,
      organization: organization ?? null,
      specs,
      field_coverage: {},
      devices: uniqueDevices,
      research: this.researchSummary(specs, uniqueDevices),
    };
  }

  private async withFieldCoverage(
    detail: HardwareModuleDetail,
  ): Promise<HardwareModuleDetail> {
    const rows = await this.prisma.module_field_coverage.findMany({
      where: { module_kind: detail.kind, module_id: detail.id },
      select: {
        field_key: true,
        status: true,
        source_url: true,
        notes: true,
      },
      orderBy: { field_key: "asc" },
    });
    const specs = { ...detail.specs };
    const fieldCoverage: Record<string, HardwareFieldCoverage> = {};

    for (const row of rows) {
      const status = row.status as HardwareFieldCoverage["status"];
      fieldCoverage[row.field_key] = {
        status,
        source_url: row.source_url,
        notes: row.notes,
      };
      if (
        this.hasResearchValue(specs[row.field_key]) ||
        (status !== "not_disclosed" && status !== "not_applicable")
      ) {
        continue;
      }

      const unavailable: UnavailableHardwareValue = {
        availability_status: status,
        status,
        label:
          status === "not_applicable"
            ? "Không áp dụng"
            : "Nhà sản xuất chưa công bố",
        source_url: row.source_url,
        notes: row.notes,
      };
      specs[row.field_key] = unavailable;
    }

    return {
      ...detail,
      specs,
      field_coverage: fieldCoverage,
      research: this.researchSummary(specs, detail.devices),
    };
  }

  private uniqueUsages(devices: HardwareDeviceUsage[]): HardwareDeviceUsage[] {
    const seen = new Set<string>();

    return devices.filter((device) => {
      const key = `${device.variant_id}:${device.usage_role ?? "module"}`;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
  }

  private researchSummary(
    specs: Record<string, unknown>,
    devices: HardwareDeviceUsage[],
  ): HardwareResearchSummary {
    const specEntries = Object.entries(specs);
    const missingSpecs = specEntries
      .filter(([, value]) => !this.hasResearchValue(value))
      .map(([key]) => key);
    const populatedSpecFieldCount = specEntries.length - missingSpecs.length;
    const variantIds = new Set(devices.map((device) => device.variant_id));
    const productIds = new Set(devices.map((device) => device.device_model.id));
    const productLines = this.productLines(devices);
    const brands = new Set(
      devices
        .map(
          (device) =>
            device.device_model.product_family?.brand_org?.slug ?? null,
        )
        .filter((value): value is string => Boolean(value)),
    );
    const categories = new Set(
      devices
        .map(
          (device) =>
            device.device_model.product_family?.device_category?.slug ?? null,
        )
        .filter((value): value is string => Boolean(value)),
    );

    return {
      variant_count: variantIds.size,
      product_count: productIds.size,
      brand_count: brands.size,
      category_count: categories.size,
      priced_variant_count: devices.filter(
        (device) =>
          device.launch_price !== null && device.launch_price !== undefined,
      ).length,
      spec_field_count: specEntries.length,
      populated_spec_field_count: populatedSpecFieldCount,
      completeness_percent: specEntries.length
        ? Math.round((populatedSpecFieldCount / specEntries.length) * 100)
        : 0,
      missing_specs: missingSpecs,
      representative_variant_ids: this.representativeVariants(
        productLines,
        devices,
      ),
      product_lines: productLines,
    };
  }

  private productLines(
    devices: HardwareDeviceUsage[],
  ): HardwareProductLineResearch[] {
    const lines = new Map<string, ProductLineAccumulator>();

    for (const device of devices) {
      const family = device.device_model.product_family;
      let line = lines.get(family.id);

      if (!line) {
        line = {
          family: {
            id: family.id,
            name: family.name,
            slug: family.slug,
            brand: family.brand_org,
            category: family.device_category,
          },
          variantIds: new Set<string>(),
          markets: new Set<string>(),
          usageRoles: new Set<string>(),
          models: new Map(),
        };
        lines.set(family.id, line);
      }

      line.variantIds.add(device.variant_id);
      if (device.market_name) line.markets.add(device.market_name);
      if (device.usage_role) line.usageRoles.add(device.usage_role);

      const model = device.device_model;
      const existingModel = line.models.get(model.id);
      if (!existingModel) {
        line.models.set(model.id, {
          id: model.id,
          name: model.name,
          slug: model.slug,
          generation_label: model.generation_label,
          release_date: model.release_date,
          variantIds: new Set([device.variant_id]),
          representativeVariantId: device.variant_id,
          hasDefaultVariant: device.is_default,
        });
        continue;
      }

      existingModel.variantIds.add(device.variant_id);
      if (device.is_default && !existingModel.hasDefaultVariant) {
        existingModel.representativeVariantId = device.variant_id;
        existingModel.hasDefaultVariant = true;
      }
    }

    return Array.from(lines.values())
      .map((line) => {
        const models = Array.from(line.models.values())
          .sort((left, right) => {
            const leftTime = left.release_date?.getTime() ?? Number.MAX_VALUE;
            const rightTime = right.release_date?.getTime() ?? Number.MAX_VALUE;
            return leftTime - rightTime || left.name.localeCompare(right.name);
          })
          .map((model) => ({
            id: model.id,
            name: model.name,
            slug: model.slug,
            generation_label: model.generation_label,
            release_date: model.release_date,
            variant_count: model.variantIds.size,
            representative_variant_id: model.representativeVariantId,
          }));

        return {
          family: line.family,
          model_count: models.length,
          variant_count: line.variantIds.size,
          market_count: line.markets.size,
          usage_roles: Array.from(line.usageRoles).sort(),
          representative_variant_ids: models
            .slice(-4)
            .map((model) => model.representative_variant_id),
          models,
        };
      })
      .sort(
        (left, right) =>
          right.variant_count - left.variant_count ||
          `${left.family.brand.name} ${left.family.name}`.localeCompare(
            `${right.family.brand.name} ${right.family.name}`,
          ),
      );
  }

  private representativeVariants(
    productLines: HardwareProductLineResearch[],
    devices: HardwareDeviceUsage[],
  ): string[] {
    const diversified = productLines
      .map(
        (line) =>
          line.representative_variant_ids[
            line.representative_variant_ids.length - 1
          ],
      )
      .filter((id): id is string => Boolean(id));
    const remaining = productLines.flatMap((line) =>
      [...line.representative_variant_ids].reverse(),
    );
    const variantFallbacks = devices.map((device) => device.variant_id);

    return Array.from(
      new Set([...diversified, ...remaining, ...variantFallbacks]),
    ).slice(0, 4);
  }

  private hasResearchValue(value: unknown): boolean {
    if (value === null || value === undefined || value === "") return false;
    if (Array.isArray(value)) return value.length > 0;
    return true;
  }

  private usage(
    variant: VariantUsage,
    usage_role?: string,
    details?: Record<string, unknown>,
  ): HardwareDeviceUsage {
    return {
      variant_id: variant.id,
      variant_name: variant.variant_name,
      market_name: variant.market_name,
      color_name: variant.color_name,
      color_hex: variant.color_hex,
      launch_price: variant.launch_price,
      is_default: variant.is_default,
      currency: variant.currency,
      device_model: variant.device_model,
      ...(usage_role ? { usage_role } : {}),
      ...(details ? { details } : {}),
    };
  }

  private chipsetUsages(
    links: Array<{
      chipset: {
        id: string;
        name: string;
        slug: string;
        variant_chipsets: Array<{
          chip_role: string;
          device_variant: VariantUsage;
        }>;
      };
    }>,
  ): HardwareDeviceUsage[] {
    return links.flatMap((componentLink) =>
      componentLink.chipset.variant_chipsets.map((chipsetLink) =>
        this.usage(chipsetLink.device_variant, chipsetLink.chip_role, {
          relation: "via_chipset",
          chipset_id: componentLink.chipset.id,
          chipset_name: componentLink.chipset.name,
          chipset_slug: componentLink.chipset.slug,
        }),
      ),
    );
  }

  private async resolveInlineChipsetCpu(
    tx: Prisma.TransactionClient,
    input: NonNullable<CreateHardwareModuleDto["cpu"]>,
    organizationId: string,
  ) {
    const existing = await tx.cpus.findFirst({
      where: {
        OR: [{ slug: input.slug }, { name: input.name.trim() }],
      },
      select: { id: true },
    });
    if (existing) return existing.id;

    const cpu = await tx.cpus.create({
      data: {
        manufacturer_org_id: organizationId,
        name: input.name.trim(),
        slug: input.slug.trim().toLowerCase(),
        description: input.description?.trim() || null,
        core_count: input.core_count,
        thread_count: input.core_count,
        big_little: (input.clusters?.length ?? 0) > 1,
        isa_name: input.isa_name,
        microarchitecture: input.microarchitecture,
        max_frequency_mhz: input.max_frequency_mhz,
        supports_64bit: input.supports_64bit ?? true,
        ...(input.clusters?.length && {
          cpu_clusters: {
            create: this.cpuClusterCreateData(input.clusters),
          },
        }),
      },
      select: { id: true },
    });
    return cpu.id;
  }

  private cpuClusterCreateData(
    clusters: NonNullable<CreateHardwareModuleDto["clusters"]>,
  ) {
    return clusters.map((cluster, index) => ({
      cluster_name: cluster.cluster_name?.trim() || null,
      core_microarchitecture: cluster.core_microarchitecture.trim(),
      core_count: cluster.core_count,
      clock_ghz: cluster.clock_ghz,
      cluster_order: cluster.cluster_order ?? index + 1,
    }));
  }

  private async resolveInlineChipsetGpu(
    tx: Prisma.TransactionClient,
    input: NonNullable<CreateHardwareModuleDto["gpu"]>,
    organizationId: string,
  ) {
    const existing = await tx.gpus.findFirst({
      where: {
        OR: [{ slug: input.slug }, { name: input.name.trim() }],
      },
      select: { id: true },
    });
    if (existing) return existing.id;

    const gpu = await tx.gpus.create({
      data: {
        manufacturer_org_id: organizationId,
        name: input.name.trim(),
        slug: input.slug.trim().toLowerCase(),
        description: input.description?.trim() || null,
        gpu_generation: input.gpu_generation,
        clock_mhz: input.clock_mhz,
        api_support: input.api_support,
        opengl_version: input.opengl_version,
        opencl_version: input.opencl_version,
        vulkan_version: input.vulkan_version,
        ray_tracing_support: input.ray_tracing_support,
      },
      select: { id: true },
    });
    return gpu.id;
  }

  private async resolveInlineChipsetNpu(
    tx: Prisma.TransactionClient,
    input: NonNullable<CreateHardwareModuleDto["npu"]>,
    organizationId: string,
  ) {
    const existing = await tx.npus.findFirst({
      where: {
        OR: [{ slug: input.slug }, { name: input.name.trim() }],
      },
      select: { id: true },
    });
    if (existing) return existing.id;

    const dedicated = input.dedicated_npu ?? true;
    const npu = await tx.npus.create({
      data: {
        manufacturer_org_id: organizationId,
        name: input.name.trim(),
        slug: input.slug.trim().toLowerCase(),
        description: input.description?.trim() || null,
        dedicated_npu: dedicated,
        tops: dedicated ? input.tops : null,
        ai_engine_version: input.ai_engine_version,
        dsp_name: input.dsp_name,
        tensor_accelerator: input.tensor_accelerator,
        supports_int8: input.supports_int8,
        supports_fp16: input.supports_fp16,
        quantization: input.quantization,
      },
      select: { id: true },
    });
    return npu.id;
  }

  private async validateChipsetBenchmarks(
    kind: AdminHardwareModuleKind,
    results?: ChipsetBenchmarkResultDto[],
  ) {
    if (results === undefined) return;
    if (kind !== "chipset") {
      throw new BadRequestException(
        "Hardware benchmark results in this workflow belong to a chipset",
      );
    }
    const benchmarkIds = [
      ...new Set(results.map((result) => result.benchmark_id)),
    ];
    if (!benchmarkIds.length) return;
    const valid = await this.prisma.benchmarks.findMany({
      where: { id: { in: benchmarkIds }, target_type: "chipset" },
      select: { id: true },
    });
    if (valid.length !== benchmarkIds.length) {
      throw new BadRequestException(
        "Every chipset result must use a benchmark definition targeted at chipsets",
      );
    }
  }

  private async replaceChipsetBenchmarks(
    tx: Prisma.TransactionClient,
    chipsetId: string,
    results: ChipsetBenchmarkResultDto[],
    replace: boolean,
  ) {
    const obsoleteRunIds = replace
      ? (
          await tx.chipset_benchmarks.findMany({
            where: { chipset_id: chipsetId },
            select: { benchmark_run_id: true },
          })
        )
          .map((result) => result.benchmark_run_id)
          .filter((runId): runId is string => Boolean(runId))
      : [];
    if (replace) {
      await tx.chipset_benchmarks.deleteMany({
        where: { chipset_id: chipsetId },
      });
    }

    for (const result of results) {
      const hasRunContext = [
        result.test_environment_note,
        result.ambient_temp_c,
        result.os_version,
        result.app_version,
        result.power_mode,
        result.is_thermal_throttled,
      ].some((value) => value !== undefined && value !== null && value !== "");
      const run = hasRunContext
        ? await tx.benchmark_runs.create({
            data: {
              benchmark_id: result.benchmark_id,
              source_id: result.source_id,
              tested_at: result.tested_at,
              test_environment_note:
                result.test_environment_note?.trim() || null,
              ambient_temp_c: result.ambient_temp_c,
              os_version: result.os_version?.trim() || null,
              app_version: result.app_version?.trim() || null,
              power_mode: result.power_mode?.trim() || null,
              is_thermal_throttled: result.is_thermal_throttled,
            },
            select: { id: true },
          })
        : null;
      await tx.chipset_benchmarks.create({
        data: {
          chipset_id: chipsetId,
          benchmark_id: result.benchmark_id,
          benchmark_run_id: run?.id,
          score: result.score,
          subscore_name: result.subscore_name?.trim() || null,
          source_id: result.source_id,
          tested_at: result.tested_at,
        },
      });
    }

    if (obsoleteRunIds.length) {
      await tx.benchmark_runs.deleteMany({
        where: {
          id: { in: obsoleteRunIds },
          device_variant_benchmarks: { none: {} },
          chipset_benchmarks: { none: {} },
          cpu_benchmarks: { none: {} },
          gpu_benchmarks: { none: {} },
          npu_benchmarks: { none: {} },
        },
      });
    }
  }

  private async resolveOrganizationId(organizationId?: string) {
    if (!organizationId) return undefined;

    const organization = await this.prisma.organizations.findFirst({
      where: { id: organizationId, deleted_at: null },
      select: { id: true },
    });
    if (!organization) {
      throw new BadRequestException("Organization not found or inactive");
    }

    return organization.id;
  }

  private validateNormalizedModuleInput(
    dto: Partial<CreateHardwareModuleDto> & { kind: AdminHardwareModuleKind },
  ) {
    if (
      dto.kind === "cpu" &&
      dto.min_frequency_mhz !== undefined &&
      dto.max_frequency_mhz !== undefined &&
      dto.min_frequency_mhz > dto.max_frequency_mhz
    ) {
      throw new BadRequestException(
        "Minimum CPU frequency cannot exceed maximum CPU frequency",
      );
    }

    if (
      dto.kind === "storage-standard" &&
      [
        dto.sequential_read_mbps,
        dto.sequential_write_mbps,
        dto.random_read_iops,
        dto.random_write_iops,
      ].some((value) => value !== undefined)
    ) {
      throw new BadRequestException(
        "Storage performance measurements belong in the benchmark module",
      );
    }
  }

  private assertAdminModuleKind(kind: string): AdminHardwareModuleKind {
    if (
      !ADMIN_HARDWARE_MODULE_KINDS.includes(kind as AdminHardwareModuleKind)
    ) {
      throw new NotFoundException(`Hardware module type ${kind} not found`);
    }
    return kind as AdminHardwareModuleKind;
  }

  private createdModule(
    kind: AdminHardwareModuleKind,
    item: {
      id: string;
      name: string;
      slug: string;
      description: string | null;
    },
  ): CreatedHardwareModule {
    return { kind, ...item };
  }

  private textWhere(query: HardwareCatalogQueryDto) {
    const q = query.q?.trim();
    return q
      ? {
          OR: [
            { name: { contains: q, mode: "insensitive" as const } },
            { slug: { contains: q, mode: "insensitive" as const } },
            { description: { contains: q, mode: "insensitive" as const } },
          ],
        }
      : {};
  }

  private operatingSystemVersionName(name: string) {
    return name.match(/(\d+(?:\.\d+)*)\s*$/)?.[1] ?? name;
  }

  private pagination(query: HardwareCatalogQueryDto) {
    const page = query.page ?? 1;
    const pageSize = query.pageSize ?? 20;
    return { skip: (page - 1) * pageSize, take: pageSize };
  }

  private async paginate<TModel>(
    query: HardwareCatalogQueryDto,
    findMany: () => Promise<TModel[]>,
    count: () => Promise<number>,
  ): Promise<HardwareListResult<TModel>> {
    const page = query.page ?? 1;
    const pageSize = query.pageSize ?? 20;
    const [data, total] = await Promise.all([findMany(), count()]);

    return { data, meta: createPaginationMeta(total, page, pageSize) };
  }
}
