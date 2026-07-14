import { Injectable, NotFoundException } from "@nestjs/common";
import { Prisma } from "@spechub/database";
import {
  createPaginationMeta,
  type PaginationMeta,
} from "../../common/dto/pagination.dto";
import { PrismaService } from "../../prisma/prisma.service";
import { CreateDeviceModelDto } from "./dto/create-device-model.dto";
import { QueryDeviceModelsDto } from "./dto/query-device-models.dto";
import { UpdateDeviceModelDto } from "./dto/update-device-model.dto";
import { DEVICE_VARIANT_COMPONENT_SELECT } from "../device-variants/device-variant-component-select";

const VARIANT_SUMMARY_SELECT = {
  id: true,
  variant_name: true,
  market_name: true,
  sku_code: true,
  color_name: true,
  color_hex: true,
  launch_date: true,
  launch_price: true,
  is_default: true,
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
} satisfies Prisma.device_variantsSelect;

const DEVICE_MODEL_LIST_SELECT = {
  id: true,
  product_family_id: true,
  name: true,
  slug: true,
  internal_codename: true,
  announcement_date: true,
  release_date: true,
  end_of_sale_date: true,
  end_of_support_date: true,
  generation_label: true,
  description: true,
  cover_image_url: true,
  created_at: true,
  updated_at: true,
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
  device_variants: {
    where: {
      deleted_at: null,
    },
    select: VARIANT_SUMMARY_SELECT,
    orderBy: [
      { is_default: "desc" as const },
      { launch_date: "asc" as const },
      { variant_name: "asc" as const },
    ],
    take: 1,
  },
  _count: {
    select: {
      device_variants: true,
    },
  },
} satisfies Prisma.device_modelsSelect;

const DEVICE_MODEL_DETAIL_SELECT = {
  ...DEVICE_MODEL_LIST_SELECT,
  device_variants: {
    where: {
      deleted_at: null,
    },
    select: {
      ...VARIANT_SUMMARY_SELECT,
      ...DEVICE_VARIANT_COMPONENT_SELECT,
    },
    orderBy: [
      { is_default: "desc" as const },
      { launch_date: "asc" as const },
      { variant_name: "asc" as const },
    ],
  },
} satisfies Prisma.device_modelsSelect;

export type DeviceModelListItem = Prisma.device_modelsGetPayload<{
  select: typeof DEVICE_MODEL_LIST_SELECT;
}>;

export type DeviceModelDetail = Prisma.device_modelsGetPayload<{
  select: typeof DEVICE_MODEL_DETAIL_SELECT;
}>;

export type DeviceModelListResult = {
  data: DeviceModelListItem[];
  meta: PaginationMeta;
};

@Injectable()
export class DeviceModelsService {
  constructor(private readonly prisma: PrismaService) {}

  async listReleaseStatuses() {
    return this.prisma.release_statuses.findMany({
      select: { id: true, code: true, name: true },
      orderBy: { sort_order: "asc" },
    });
  }

  async findMany(query: QueryDeviceModelsDto): Promise<DeviceModelListResult> {
    const page = query.page ?? 1;
    const pageSize = query.pageSize ?? 20;
    const where = this.buildWhere(query);

    const [items, total] = await this.prisma.$transaction([
      this.prisma.device_models.findMany({
        where,
        select: DEVICE_MODEL_LIST_SELECT,
        skip: (page - 1) * pageSize,
        take: pageSize,
        orderBy: this.buildOrderBy(query),
      }),
      this.prisma.device_models.count({ where }),
    ]);

    return {
      data: items,
      meta: createPaginationMeta(total, page, pageSize),
    };
  }

  async findBySlug(slug: string): Promise<DeviceModelDetail> {
    const model = await this.prisma.device_models.findFirst({
      where: {
        slug,
        deleted_at: null,
      },
      select: DEVICE_MODEL_DETAIL_SELECT,
    });

    if (!model) {
      throw new NotFoundException(`Device model ${slug} not found`);
    }

    return model;
  }

  async findById(id: string): Promise<DeviceModelDetail> {
    const model = await this.prisma.device_models.findFirst({
      where: {
        id,
        deleted_at: null,
      },
      select: DEVICE_MODEL_DETAIL_SELECT,
    });

    if (!model) {
      throw new NotFoundException(`Device model ${id} not found`);
    }

    return model;
  }

  async create(dto: CreateDeviceModelDto): Promise<DeviceModelDetail> {
    const model = await this.prisma.device_models.create({
      data: dto,
      select: DEVICE_MODEL_DETAIL_SELECT,
    });

    return model;
  }

  async update(
    id: string,
    dto: UpdateDeviceModelDto,
  ): Promise<DeviceModelDetail> {
    await this.findById(id);

    return this.prisma.device_models.update({
      where: { id },
      data: dto,
      select: DEVICE_MODEL_DETAIL_SELECT,
    });
  }

  async remove(id: string): Promise<DeviceModelDetail> {
    await this.findById(id);

    return this.prisma.device_models.update({
      where: { id },
      data: {
        deleted_at: new Date(),
      },
      select: DEVICE_MODEL_DETAIL_SELECT,
    });
  }

  private buildWhere(
    query: QueryDeviceModelsDto,
  ): Prisma.device_modelsWhereInput {
    const q = query.q?.trim();

    return {
      deleted_at: null,
      ...(query.product_family_id && {
        product_family_id: query.product_family_id,
      }),
      ...(query.release_status && {
        release_status: {
          code: query.release_status,
        },
      }),
      ...((query.family_slug || query.brand_slug || query.category_slug) && {
        product_family: {
          deleted_at: null,
          ...(query.family_slug && { slug: query.family_slug }),
          ...(query.brand_slug && {
            brand_org: {
              slug: query.brand_slug,
              deleted_at: null,
            },
          }),
          ...(query.category_slug && {
            device_category: {
              slug: query.category_slug,
              deleted_at: null,
            },
          }),
        },
      }),
      ...(q && {
        OR: [
          { name: { contains: q, mode: "insensitive" } },
          { slug: { contains: q, mode: "insensitive" } },
          { internal_codename: { contains: q, mode: "insensitive" } },
          { description: { contains: q, mode: "insensitive" } },
        ],
      }),
    };
  }

  private buildOrderBy(
    query: QueryDeviceModelsDto,
  ): Prisma.device_modelsOrderByWithRelationInput[] {
    const allowedSortFields = new Set([
      "name",
      "slug",
      "announcement_date",
      "release_date",
      "created_at",
      "updated_at",
    ]);
    const explicitSortBy =
      query.sortBy && allowedSortFields.has(query.sortBy)
        ? query.sortBy
        : undefined;

    if (explicitSortBy) {
      return [{ [explicitSortBy]: query.sortOrder ?? "desc" }];
    }

    return [{ release_date: "desc" }, { name: "asc" }];
  }
}
