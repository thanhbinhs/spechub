import {
  BadRequestException,
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
  CreateHardwareModuleDto,
} from "./dto/create-hardware-module.dto";

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
  description: true,
  manufacturer: { select: ORGANIZATION_SELECT },
  architecture: { select: { id: true, name: true, slug: true } },
  _count: { select: { variant_cpus: true } },
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
  description: true,
  manufacturer: { select: ORGANIZATION_SELECT },
  architecture: { select: { id: true, name: true, slug: true } },
  _count: { select: { variant_gpus: true } },
} satisfies Prisma.gpusSelect;

const NPU_SELECT = {
  id: true,
  name: true,
  slug: true,
  tops: true,
  tops_int4: true,
  tops_fp16: true,
  description: true,
  manufacturer: { select: ORGANIZATION_SELECT },
  architecture: { select: { id: true, name: true, slug: true } },
  _count: { select: { variant_npus: true } },
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
  description: true,
  manufacturer: { select: ORGANIZATION_SELECT },
  _count: { select: { variant_modems: true } },
} satisfies Prisma.modemsSelect;

const MEMORY_SELECT = {
  id: true,
  name: true,
  slug: true,
  memory_type: true,
  generation: true,
  max_data_rate_mtps: true,
  typical_data_rate_mtps: true,
  voltage: true,
  bandwidth_gbps: true,
  channel_width_bits: true,
  is_mobile: true,
  release_year: true,
  description: true,
  organization: { select: ORGANIZATION_SELECT },
  _count: { select: { variant_memory_configs: true } },
} satisfies Prisma.memory_standardsSelect;

const STORAGE_SELECT = {
  id: true,
  name: true,
  slug: true,
  storage_type: true,
  generation: true,
  sequential_read_mbps: true,
  sequential_write_mbps: true,
  random_read_iops: true,
  random_write_iops: true,
  release_year: true,
  description: true,
  organization: { select: ORGANIZATION_SELECT },
  _count: { select: { variant_storage_configs: true } },
} satisfies Prisma.storage_standardsSelect;

const OS_SELECT = {
  id: true,
  name: true,
  slug: true,
  os_family: true,
  kernel_type: true,
  is_open_source: true,
  description: true,
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
} satisfies Prisma.operating_systemsSelect;

const WIRELESS_SELECT = {
  id: true,
  name: true,
  slug: true,
  wireless_type: true,
  max_speed_mbps: true,
  description: true,
  organization: { select: ORGANIZATION_SELECT },
  _count: { select: { variant_wireless_support: true } },
} satisfies Prisma.wireless_standardsSelect;

const PORT_SELECT = {
  id: true,
  name: true,
  slug: true,
  port_type: true,
  data_speed_gbps: true,
  power_delivery_w: true,
  alt_modes: true,
  description: true,
  organization: { select: ORGANIZATION_SELECT },
  _count: { select: { variant_ports: true } },
} satisfies Prisma.port_standardsSelect;

const SENSOR_SELECT = {
  id: true,
  name: true,
  slug: true,
  sensor_category: true,
  description: true,
  manufacturer: { select: ORGANIZATION_SELECT },
  _count: { select: { variant_hardware_sensors: true } },
} satisfies Prisma.hardware_sensorsSelect;

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
  chip_kind: true,
  model_code: true,
  supports_64bit: true,
  integrated_5g: true,
  integrated_wifi: true,
  max_ram_gb: true,
  manufacturer: { select: ORGANIZATION_SELECT },
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
} satisfies Prisma.modemsSelect;

const MEMORY_DETAIL_SELECT = {
  ...MEMORY_SELECT,
  variant_memory_configs: {
    select: {
      capacity_gb: true,
      speed_mhz: true,
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

const WIRELESS_DETAIL_SELECT = {
  ...WIRELESS_SELECT,
  variant_wireless_support: {
    select: {
      notes: true,
      device_variant: { select: VARIANT_USAGE_SELECT },
    },
  },
} satisfies Prisma.wireless_standardsSelect;

const PORT_DETAIL_SELECT = {
  ...PORT_SELECT,
  variant_ports: {
    select: {
      port_count: true,
      notes: true,
      device_variant: { select: VARIANT_USAGE_SELECT },
    },
  },
} satisfies Prisma.port_standardsSelect;

const SENSOR_DETAIL_SELECT = {
  ...SENSOR_SELECT,
  variant_hardware_sensors: {
    select: {
      notes: true,
      device_variant: { select: VARIANT_USAGE_SELECT },
    },
  },
} satisfies Prisma.hardware_sensorsSelect;

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
  "wireless-standard",
  "port-standard",
  "sensor",
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
  organization: {
    id: string;
    name: string;
    slug: string;
    short_name: string | null;
  } | null;
  specs: Record<string, unknown>;
  devices: HardwareDeviceUsage[];
  research: HardwareResearchSummary;
};

export type CreatedHardwareModule = {
  id: string;
  kind: AdminHardwareModuleKind;
  name: string;
  slug: string;
  description: string | null;
};

@Injectable()
export class HardwareCatalogService {
  constructor(private readonly prisma: PrismaService) {}

  async createModule(
    dto: CreateHardwareModuleDto,
  ): Promise<CreatedHardwareModule> {
    const name = dto.name.trim();
    const slug = dto.slug.trim().toLowerCase();
    const description = dto.description?.trim() || null;
    const organizationId = await this.resolveOrganizationId(
      dto.organization_id,
    );
    const category = dto.category?.trim();

    switch (dto.kind) {
      case "chipset": {
        if (!organizationId) {
          throw new BadRequestException("Chipsets require a manufacturer");
        }
        if (!category) {
          throw new BadRequestException("Chipsets require a chip kind");
        }
        const item = await this.prisma.chipsets.create({
          data: {
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
          },
          select: { id: true, name: true, slug: true, description: true },
        });
        return this.createdModule(dto.kind, item);
      }
      case "cpu": {
        const item = await this.prisma.cpus.create({
          data: {
            manufacturer_org_id: organizationId,
            name,
            slug,
            description,
            core_count: dto.core_count,
            thread_count: dto.thread_count,
            big_little: dto.big_little,
            isa_name: dto.isa_name,
          },
          select: { id: true, name: true, slug: true, description: true },
        });
        return this.createdModule(dto.kind, item);
      }
      case "gpu": {
        const item = await this.prisma.gpus.create({
          data: {
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
          },
          select: { id: true, name: true, slug: true, description: true },
        });
        return this.createdModule(dto.kind, item);
      }
      case "npu": {
        const item = await this.prisma.npus.create({
          data: {
            manufacturer_org_id: organizationId,
            name,
            slug,
            description,
            tops: dto.tops,
            tops_int4: dto.tops_int4,
            tops_fp16: dto.tops_fp16,
          },
          select: { id: true, name: true, slug: true, description: true },
        });
        return this.createdModule(dto.kind, item);
      }
      case "modem": {
        const item = await this.prisma.modems.create({
          data: {
            manufacturer_org_id: organizationId,
            name,
            slug,
            description,
            max_downlink_mbps: dto.max_downlink_mbps,
            max_uplink_mbps: dto.max_uplink_mbps,
            supports_mmwave: dto.supports_mmwave,
            supports_satellite: dto.supports_satellite,
            supported_5g_modes: dto.supported_5g_modes,
          },
          select: { id: true, name: true, slug: true, description: true },
        });
        return this.createdModule(dto.kind, item);
      }
      case "memory-standard": {
        const item = await this.prisma.memory_standards.create({
          data: {
            organization_id: organizationId,
            memory_type: category || null,
            name,
            slug,
            description,
            generation: dto.generation,
            max_data_rate_mtps: dto.max_data_rate_mtps,
            typical_data_rate_mtps: dto.typical_data_rate_mtps,
            voltage: dto.voltage,
            bandwidth_gbps: dto.bandwidth_gbps,
            channel_width_bits: dto.channel_width_bits,
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
            organization_id: organizationId,
            storage_type: category || null,
            name,
            slug,
            description,
            generation: dto.generation,
            sequential_read_mbps: dto.sequential_read_mbps,
            sequential_write_mbps: dto.sequential_write_mbps,
            random_read_iops: dto.random_read_iops,
            random_write_iops: dto.random_write_iops,
            release_year: dto.release_year,
          },
          select: { id: true, name: true, slug: true, description: true },
        });
        return this.createdModule(dto.kind, item);
      }
      case "wireless-standard": {
        if (!category) {
          throw new BadRequestException(
            "Wireless standards require a wireless type",
          );
        }
        const item = await this.prisma.wireless_standards.create({
          data: {
            organization_id: organizationId,
            wireless_type: category,
            name,
            slug,
            description,
            max_speed_mbps: dto.max_speed_mbps,
          },
          select: { id: true, name: true, slug: true, description: true },
        });
        return this.createdModule(dto.kind, item);
      }
      case "port-standard": {
        if (!category) {
          throw new BadRequestException("Port standards require a port type");
        }
        const item = await this.prisma.port_standards.create({
          data: {
            organization_id: organizationId,
            port_type: category,
            name,
            slug,
            description,
            data_speed_gbps: dto.data_speed_gbps,
            power_delivery_w: dto.power_delivery_w,
            alt_modes: dto.alt_modes,
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
            vendor_org_id: organizationId,
            os_family: category,
            name,
            slug,
            description,
            kernel_type: dto.kernel_type,
            is_open_source: dto.is_open_source,
          },
          select: { id: true, name: true, slug: true, description: true },
        });
        return this.createdModule(dto.kind, item);
      }
      case "sensor": {
        if (!category) {
          throw new BadRequestException("Sensors require a sensor category");
        }
        const item = await this.prisma.hardware_sensors.create({
          data: {
            manufacturer_org_id: organizationId,
            sensor_category: category,
            name,
            slug,
            description,
          },
          select: { id: true, name: true, slug: true, description: true },
        });
        return this.createdModule(dto.kind, item);
      }
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

  async listWirelessStandards(query: HardwareCatalogQueryDto) {
    const where = this.textWhere(query);
    const pagination = this.pagination(query);
    return this.paginate(
      query,
      () =>
        this.prisma.wireless_standards.findMany({
          where,
          select: WIRELESS_SELECT,
          ...pagination,
          orderBy: [{ name: "asc" }],
        }),
      () => this.prisma.wireless_standards.count({ where }),
    );
  }

  async listPortStandards(query: HardwareCatalogQueryDto) {
    const where = this.textWhere(query);
    const pagination = this.pagination(query);
    return this.paginate(
      query,
      () =>
        this.prisma.port_standards.findMany({
          where,
          select: PORT_SELECT,
          ...pagination,
          orderBy: [{ name: "asc" }],
        }),
      () => this.prisma.port_standards.count({ where }),
    );
  }

  async listSensors(query: HardwareCatalogQueryDto) {
    const where = this.textWhere(query);
    const pagination = this.pagination(query);
    return this.paginate(
      query,
      () =>
        this.prisma.hardware_sensors.findMany({
          where,
          select: SENSOR_SELECT,
          ...pagination,
          orderBy: [{ sensor_category: "asc" }, { name: "asc" }],
        }),
      () => this.prisma.hardware_sensors.count({ where }),
    );
  }

  async findByKindAndSlug(
    kind: string,
    slug: string,
  ): Promise<HardwareModuleDetail> {
    if (!HARDWARE_MODULE_KINDS.includes(kind as HardwareModuleKind)) {
      throw new NotFoundException(`Hardware module type ${kind} not found`);
    }

    switch (kind as HardwareModuleKind) {
      case "chipset":
        return this.findChipset(slug);
      case "cpu":
        return this.findCpu(slug);
      case "gpu":
        return this.findGpu(slug);
      case "npu":
        return this.findNpu(slug);
      case "modem":
        return this.findModem(slug);
      case "memory-standard":
        return this.findMemoryStandard(slug);
      case "storage-standard":
        return this.findStorageStandard(slug);
      case "operating-system":
        return this.findOperatingSystem(slug);
      case "wireless-standard":
        return this.findWirelessStandard(slug);
      case "port-standard":
        return this.findPortStandard(slug);
      case "sensor":
        return this.findSensor(slug);
      case "camera":
        return this.findCamera(slug);
      case "display":
        return this.findDisplay(slug);
      case "battery":
        return this.findBattery(slug);
    }
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
        architecture: item.architecture,
        clusters: item.cpu_clusters,
      },
      item.variant_cpus.map((link) =>
        this.usage(link.device_variant, link.cpu_role),
      ),
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
        architecture: item.architecture,
      },
      item.variant_gpus.map((link) =>
        this.usage(link.device_variant, link.gpu_role),
      ),
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
        tops_int4: item.tops_int4,
        tops_fp16: item.tops_fp16,
        architecture: item.architecture,
      },
      item.variant_npus.map((link) =>
        this.usage(link.device_variant, link.npu_role),
      ),
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
      },
      item.variant_modems.map((link) =>
        this.usage(link.device_variant, link.modem_role),
      ),
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
        voltage: item.voltage,
        bandwidth_gbps: item.bandwidth_gbps,
        channel_width_bits: item.channel_width_bits,
        is_mobile: item.is_mobile,
        release_year: item.release_year,
      },
      item.variant_memory_configs.map((link) =>
        this.usage(link.device_variant, undefined, {
          capacity_gb: link.capacity_gb,
          speed_mhz: link.speed_mhz,
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
        sequential_read_mbps: item.sequential_read_mbps,
        sequential_write_mbps: item.sequential_write_mbps,
        random_read_iops: item.random_read_iops,
        random_write_iops: item.random_write_iops,
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
        is_open_source: item.is_open_source,
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

  private async findWirelessStandard(
    slug: string,
  ): Promise<HardwareModuleDetail> {
    const item = await this.prisma.wireless_standards.findFirst({
      where: { slug },
      select: WIRELESS_DETAIL_SELECT,
    });
    if (!item)
      throw new NotFoundException(`Wireless standard ${slug} not found`);

    return this.module(
      "wireless-standard",
      item,
      item.organization,
      {
        wireless_type: item.wireless_type,
        max_speed_mbps: item.max_speed_mbps,
      },
      item.variant_wireless_support.map((link) =>
        this.usage(link.device_variant, undefined, { notes: link.notes }),
      ),
    );
  }

  private async findPortStandard(slug: string): Promise<HardwareModuleDetail> {
    const item = await this.prisma.port_standards.findFirst({
      where: { slug },
      select: PORT_DETAIL_SELECT,
    });
    if (!item) throw new NotFoundException(`Port standard ${slug} not found`);

    return this.module(
      "port-standard",
      item,
      item.organization,
      {
        port_type: item.port_type,
        data_speed_gbps: item.data_speed_gbps,
        power_delivery_w: item.power_delivery_w,
        alt_modes: item.alt_modes,
      },
      item.variant_ports.map((link) =>
        this.usage(link.device_variant, undefined, {
          port_count: link.port_count,
          notes: link.notes,
        }),
      ),
    );
  }

  private async findSensor(slug: string): Promise<HardwareModuleDetail> {
    const item = await this.prisma.hardware_sensors.findFirst({
      where: { slug },
      select: SENSOR_DETAIL_SELECT,
    });
    if (!item) throw new NotFoundException(`Sensor ${slug} not found`);

    return this.module(
      "sensor",
      item,
      item.manufacturer,
      { sensor_category: item.sensor_category },
      item.variant_hardware_sensors.map((link) =>
        this.usage(link.device_variant, undefined, { notes: link.notes }),
      ),
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
    },
    organization: HardwareModuleDetail["organization"] | null | undefined,
    specs: Record<string, unknown>,
    devices: HardwareDeviceUsage[],
  ): HardwareModuleDetail {
    const uniqueDevices = this.uniqueUsages(devices);

    return {
      kind,
      id: item.id,
      name: item.name ?? item.slug ?? kind,
      slug: item.slug ?? item.id,
      description: item.description ?? null,
      organization: organization ?? null,
      specs,
      devices: uniqueDevices,
      research: this.researchSummary(specs, uniqueDevices),
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
