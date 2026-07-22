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
import { CreateDeviceVariantDto } from "./dto/create-device-variant.dto";
import { QueryDeviceVariantsDto } from "./dto/query-device-variants.dto";
import { UpdateDeviceVariantDto } from "./dto/update-device-variant.dto";
import { DEVICE_VARIANT_COMPONENT_SELECT } from "./device-variant-component-select";

const DEVICE_VARIANT_DETAIL_SELECT = {
  id: true,
  device_model_id: true,
  variant_name: true,
  sku_code: true,
  market_name: true,
  color_name: true,
  color_hex: true,
  launch_date: true,
  end_of_sale_date: true,
  launch_price: true,
  is_default: true,
  notes: true,
  created_at: true,
  updated_at: true,
  currency: {
    select: {
      id: true,
      code: true,
      symbol: true,
      decimal_digits: true,
    },
  },
  release_status: {
    select: {
      id: true,
      code: true,
      name: true,
    },
  },
  device_model: {
    select: {
      id: true,
      name: true,
      slug: true,
      announcement_date: true,
      release_date: true,
      product_family: {
        select: {
          id: true,
          name: true,
          slug: true,
          brand_org: {
            select: {
              id: true,
              name: true,
              slug: true,
              short_name: true,
              logo_url: true,
            },
          },
          device_category: {
            select: {
              id: true,
              name: true,
              slug: true,
            },
          },
        },
      },
      release_status: {
        select: {
          id: true,
          code: true,
          name: true,
        },
      },
    },
  },
  ...DEVICE_VARIANT_COMPONENT_SELECT,
} satisfies Prisma.device_variantsSelect;

const DEVICE_VARIANT_LIST_SELECT = {
  id: true,
  device_model_id: true,
  variant_name: true,
  sku_code: true,
  market_name: true,
  color_name: true,
  color_hex: true,
  launch_date: true,
  launch_price: true,
  is_default: true,
  created_at: true,
  updated_at: true,
  currency: DEVICE_VARIANT_DETAIL_SELECT.currency,
  release_status: DEVICE_VARIANT_DETAIL_SELECT.release_status,
  device_model: DEVICE_VARIANT_DETAIL_SELECT.device_model,
} satisfies Prisma.device_variantsSelect;

export type DeviceVariantListItem = Prisma.device_variantsGetPayload<{
  select: typeof DEVICE_VARIANT_LIST_SELECT;
}>;

export type DeviceVariantDetail = Prisma.device_variantsGetPayload<{
  select: typeof DEVICE_VARIANT_DETAIL_SELECT;
}>;

export type DeviceVariantListResult = {
  data: DeviceVariantListItem[];
  meta: PaginationMeta;
};

@Injectable()
export class DeviceVariantsService {
  constructor(private readonly prisma: PrismaService) {}

  async findMany(
    query: QueryDeviceVariantsDto,
  ): Promise<DeviceVariantListResult> {
    const page = query.page ?? 1;
    const pageSize = query.pageSize ?? 20;
    const where = this.buildWhere(query);

    const [items, total] = await this.prisma.$transaction([
      this.prisma.device_variants.findMany({
        where,
        select: DEVICE_VARIANT_LIST_SELECT,
        skip: (page - 1) * pageSize,
        take: pageSize,
        orderBy: this.buildOrderBy(query),
      }),
      this.prisma.device_variants.count({ where }),
    ]);

    return {
      data: items,
      meta: createPaginationMeta(total, page, pageSize),
    };
  }

  async findById(id: string): Promise<DeviceVariantDetail> {
    const variant = await this.prisma.device_variants.findFirst({
      where: {
        id,
        deleted_at: null,
      },
      select: DEVICE_VARIANT_DETAIL_SELECT,
    });

    if (!variant) {
      throw new NotFoundException(`Device variant ${id} not found`);
    }

    return variant;
  }

  async listCurrencies() {
    return this.prisma.currencies.findMany({
      select: { id: true, code: true, symbol: true, decimal_digits: true },
      orderBy: { code: "asc" },
    });
  }

  async listBenchmarks() {
    return this.prisma.benchmarks.findMany({
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

  async create(dto: CreateDeviceVariantDto): Promise<DeviceVariantDetail> {
    const {
      physical_specs,
      io_specs,
      thermal_specs,
      performance_results,
      ...variantData
    } = dto;

    if (dto.is_default) {
      await this.prisma.device_variants.updateMany({
        where: {
          device_model_id: dto.device_model_id,
          deleted_at: null,
        },
        data: { is_default: false },
      });
    }

    return this.prisma.device_variants.create({
      data: {
        ...variantData,
        is_default: dto.is_default ?? false,
        ...(physical_specs && {
          variant_physical_specs: { create: physical_specs },
        }),
        ...(io_specs && { variant_io_specs: { create: io_specs } }),
        ...(thermal_specs && {
          variant_thermal_specs: { create: thermal_specs },
        }),
        ...(performance_results?.length && {
          device_variant_benchmarks: {
            create: performance_results.map((result) =>
              this.performanceResultCreate(result),
            ),
          },
        }),
      },
      select: DEVICE_VARIANT_DETAIL_SELECT,
    });
  }

  async update(
    id: string,
    dto: UpdateDeviceVariantDto,
  ): Promise<DeviceVariantDetail> {
    const current = await this.findById(id);
    const {
      physical_specs,
      io_specs,
      thermal_specs,
      performance_results,
      ...variantData
    } = dto;
    const deviceModelId = dto.device_model_id ?? current.device_model_id;

    if (dto.is_default) {
      await this.prisma.device_variants.updateMany({
        where: {
          device_model_id: deviceModelId,
          id: { not: id },
          deleted_at: null,
        },
        data: { is_default: false },
      });
    }

    const obsoleteRunIds =
      performance_results === undefined
        ? []
        : (current.device_variant_benchmarks ?? [])
            .map((result) => result.benchmark_run?.id)
            .filter((runId): runId is string => Boolean(runId));
    const updated = await this.prisma.device_variants.update({
      where: { id },
      data: {
        ...variantData,
        ...(physical_specs && {
          variant_physical_specs: {
            upsert: { create: physical_specs, update: physical_specs },
          },
        }),
        ...(io_specs && {
          variant_io_specs: { upsert: { create: io_specs, update: io_specs } },
        }),
        ...(thermal_specs && {
          variant_thermal_specs: {
            upsert: { create: thermal_specs, update: thermal_specs },
          },
        }),
        ...(performance_results !== undefined && {
          device_variant_benchmarks: {
            deleteMany: {},
            ...(performance_results.length && {
              create: performance_results.map((result) =>
                this.performanceResultCreate(result),
              ),
            }),
          },
        }),
      },
      select: DEVICE_VARIANT_DETAIL_SELECT,
    });
    if (obsoleteRunIds.length) {
      await this.prisma.benchmark_runs.deleteMany({
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
    return updated;
  }

  async remove(id: string): Promise<DeviceVariantDetail> {
    await this.findById(id);

    return this.prisma.device_variants.update({
      where: { id },
      data: {
        deleted_at: new Date(),
      },
      select: DEVICE_VARIANT_DETAIL_SELECT,
    });
  }

  async compare(ids: string[]): Promise<{ data: DeviceVariantDetail[] }> {
    const uniqueIds = [...new Set(ids)];

    if (uniqueIds.length < 2 || uniqueIds.length > 4) {
      throw new BadRequestException(
        "Compare requires 2 to 4 unique variant IDs",
      );
    }

    const variants = await this.prisma.device_variants.findMany({
      where: {
        id: { in: uniqueIds },
        deleted_at: null,
      },
      select: DEVICE_VARIANT_DETAIL_SELECT,
    });

    if (variants.length !== uniqueIds.length) {
      throw new NotFoundException("One or more device variants were not found");
    }

    const byId = new Map(variants.map((variant) => [variant.id, variant]));
    return {
      data: uniqueIds.map((id) => byId.get(id)!),
    };
  }

  private buildWhere(
    query: QueryDeviceVariantsDto,
  ): Prisma.device_variantsWhereInput {
    const q = query.q?.trim();

    return {
      deleted_at: null,
      ...(query.default_only && { is_default: true }),
      ...(query.device_model_id && { device_model_id: query.device_model_id }),
      ...(query.model_slug && {
        device_model: {
          slug: query.model_slug,
          deleted_at: null,
        },
      }),
      ...(q && {
        OR: [
          { variant_name: { contains: q, mode: "insensitive" } },
          { market_name: { contains: q, mode: "insensitive" } },
          { sku_code: { contains: q, mode: "insensitive" } },
          { color_name: { contains: q, mode: "insensitive" } },
          {
            device_model: {
              deleted_at: null,
              OR: [
                { name: { contains: q, mode: "insensitive" } },
                { slug: { contains: q, mode: "insensitive" } },
              ],
            },
          },
        ],
      }),
    };
  }

  private performanceResultCreate(
    result: NonNullable<CreateDeviceVariantDto["performance_results"]>[number],
  ) {
    const {
      benchmark_id,
      score,
      subscore_name,
      source_id,
      tested_at,
      test_environment_note,
      ambient_temp_c,
      os_version,
      app_version,
      power_mode,
      is_thermal_throttled,
    } = result;
    const hasRunContext = [
      test_environment_note,
      ambient_temp_c,
      os_version,
      app_version,
      power_mode,
      is_thermal_throttled,
    ].some((value) => value !== undefined && value !== null && value !== "");

    return {
      benchmark_id,
      score,
      subscore_name,
      source_id,
      tested_at,
      ...(hasRunContext && {
        benchmark_run: {
          create: {
            benchmark_id,
            source_id,
            tested_at,
            test_environment_note,
            ambient_temp_c,
            os_version,
            app_version,
            power_mode,
            is_thermal_throttled,
          },
        },
      }),
    };
  }

  private buildOrderBy(
    query: QueryDeviceVariantsDto,
  ): Prisma.device_variantsOrderByWithRelationInput[] {
    const allowedSortFields = new Set([
      "variant_name",
      "launch_date",
      "launch_price",
      "created_at",
      "updated_at",
    ]);
    const explicitSortBy =
      query.sortBy && allowedSortFields.has(query.sortBy)
        ? query.sortBy
        : undefined;

    if (explicitSortBy) {
      return [{ [explicitSortBy]: query.sortOrder ?? "asc" }];
    }

    return [
      { is_default: "desc" },
      { launch_date: "desc" },
      { variant_name: "asc" },
    ];
  }
}
