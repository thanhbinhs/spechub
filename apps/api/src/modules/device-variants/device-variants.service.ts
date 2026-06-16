import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common'
import { Prisma } from '@spechub/database'
import {
  createPaginationMeta,
  type PaginationMeta,
} from '../../common/dto/pagination.dto'
import { PrismaService } from '../../prisma/prisma.service'
import { QueryDeviceVariantsDto } from './dto/query-device-variants.dto'

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
  variant_physical_specs: true,
  variant_io_specs: true,
  variant_thermal_specs: true,
  variant_chipsets: {
    select: {
      chip_role: true,
      is_primary: true,
      chipset: {
        select: {
          id: true,
          name: true,
          slug: true,
          chip_kind: true,
          model_code: true,
          integrated_5g: true,
          max_ram_gb: true,
          manufacturer: {
            select: {
              id: true,
              name: true,
              slug: true,
              short_name: true,
            },
          },
        },
      },
    },
  },
  variant_displays: {
    select: {
      display_role: true,
      display_order: true,
      display_unit: {
        select: {
          id: true,
          name: true,
          slug: true,
          size_inch: true,
          aspect_ratio: true,
          resolution_width: true,
          resolution_height: true,
          pixel_density_ppi: true,
          refresh_rate_hz: true,
          brightness_peak_nits: true,
          hdr_formats: true,
        },
      },
    },
    orderBy: [{ display_order: 'asc' as const }],
  },
  variant_batteries: {
    select: {
      battery_role: true,
      is_primary: true,
      battery_unit: {
        select: {
          id: true,
          name: true,
          slug: true,
          capacity_mah: true,
          energy_wh: true,
          wired_charging_w: true,
          wireless_charging_w: true,
          removable: true,
        },
      },
    },
  },
} satisfies Prisma.device_variantsSelect

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
} satisfies Prisma.device_variantsSelect

export type DeviceVariantListItem = Prisma.device_variantsGetPayload<{
  select: typeof DEVICE_VARIANT_LIST_SELECT
}>

export type DeviceVariantDetail = Prisma.device_variantsGetPayload<{
  select: typeof DEVICE_VARIANT_DETAIL_SELECT
}>

export type DeviceVariantListResult = {
  data: DeviceVariantListItem[]
  meta: PaginationMeta
}

@Injectable()
export class DeviceVariantsService {
  constructor(private readonly prisma: PrismaService) {}

  async findMany(query: QueryDeviceVariantsDto): Promise<DeviceVariantListResult> {
    const page = query.page ?? 1
    const pageSize = query.pageSize ?? 20
    const where = this.buildWhere(query)

    const [items, total] = await this.prisma.$transaction([
      this.prisma.device_variants.findMany({
        where,
        select: DEVICE_VARIANT_LIST_SELECT,
        skip: (page - 1) * pageSize,
        take: pageSize,
        orderBy: this.buildOrderBy(query),
      }),
      this.prisma.device_variants.count({ where }),
    ])

    return {
      data: items,
      meta: createPaginationMeta(total, page, pageSize),
    }
  }

  async findById(id: string): Promise<DeviceVariantDetail> {
    const variant = await this.prisma.device_variants.findFirst({
      where: {
        id,
        deleted_at: null,
      },
      select: DEVICE_VARIANT_DETAIL_SELECT,
    })

    if (!variant) {
      throw new NotFoundException(`Device variant ${id} not found`)
    }

    return variant
  }

  async compare(ids: string[]): Promise<{ data: DeviceVariantDetail[] }> {
    const uniqueIds = [...new Set(ids)]

    if (uniqueIds.length < 2 || uniqueIds.length > 4) {
      throw new BadRequestException('Compare requires 2 to 4 unique variant IDs')
    }

    const variants = await this.prisma.device_variants.findMany({
      where: {
        id: { in: uniqueIds },
        deleted_at: null,
      },
      select: DEVICE_VARIANT_DETAIL_SELECT,
    })

    if (variants.length !== uniqueIds.length) {
      throw new NotFoundException('One or more device variants were not found')
    }

    const byId = new Map(variants.map((variant) => [variant.id, variant]))
    return {
      data: uniqueIds.map((id) => byId.get(id)!),
    }
  }

  private buildWhere(query: QueryDeviceVariantsDto): Prisma.device_variantsWhereInput {
    const q = query.q?.trim()

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
          { variant_name: { contains: q, mode: 'insensitive' } },
          { market_name: { contains: q, mode: 'insensitive' } },
          { sku_code: { contains: q, mode: 'insensitive' } },
          { color_name: { contains: q, mode: 'insensitive' } },
        ],
      }),
    }
  }

  private buildOrderBy(
    query: QueryDeviceVariantsDto,
  ): Prisma.device_variantsOrderByWithRelationInput[] {
    const allowedSortFields = new Set([
      'variant_name',
      'launch_date',
      'launch_price',
      'created_at',
      'updated_at',
    ])
    const explicitSortBy =
      query.sortBy && allowedSortFields.has(query.sortBy) ? query.sortBy : undefined

    if (explicitSortBy) {
      return [{ [explicitSortBy]: query.sortOrder ?? 'asc' }]
    }

    return [
      { is_default: 'desc' },
      { launch_date: 'desc' },
      { variant_name: 'asc' },
    ]
  }
}
