import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common'
import { Prisma } from '@spechub/database'
import {
  createPaginationMeta,
  type PaginationMeta,
} from '../../common/dto/pagination.dto'
import { PrismaService } from '../../prisma/prisma.service'
import { CreateProductFamilyDto } from './dto/create-product-family.dto'
import { QueryProductFamiliesDto } from './dto/query-product-families.dto'
import { UpdateProductFamilyDto } from './dto/update-product-family.dto'

const PRODUCT_FAMILY_SELECT = {
  id: true,
  brand_org_id: true,
  device_category_id: true,
  name: true,
  slug: true,
  description: true,
  cover_image_url: true,
  first_release_year: true,
  last_release_year: true,
  is_active: true,
  created_at: true,
  updated_at: true,
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
} satisfies Prisma.product_familiesSelect

export type ProductFamilyItem = Prisma.product_familiesGetPayload<{
  select: typeof PRODUCT_FAMILY_SELECT
}>

export type ProductFamilyListResult = {
  data: ProductFamilyItem[]
  meta: PaginationMeta
}

@Injectable()
export class ProductFamiliesService {
  constructor(private readonly prisma: PrismaService) {}

  async findMany(query: QueryProductFamiliesDto): Promise<ProductFamilyListResult> {
    const page = query.page ?? 1
    const pageSize = query.pageSize ?? 20
    const where = this.buildWhere(query)

    const [items, total] = await this.prisma.$transaction([
      this.prisma.product_families.findMany({
        where,
        select: PRODUCT_FAMILY_SELECT,
        skip: (page - 1) * pageSize,
        take: pageSize,
        orderBy: this.buildOrderBy(query),
      }),
      this.prisma.product_families.count({ where }),
    ])

    return {
      data: items,
      meta: createPaginationMeta(total, page, pageSize),
    }
  }

  async findBySlug(slug: string): Promise<ProductFamilyItem> {
    const family = await this.prisma.product_families.findFirst({
      where: {
        slug,
        deleted_at: null,
        is_active: true,
      },
      select: PRODUCT_FAMILY_SELECT,
    })

    if (!family) {
      throw new NotFoundException(`Product family ${slug} not found`)
    }

    return family
  }

  async findById(id: string): Promise<ProductFamilyItem> {
    const family = await this.prisma.product_families.findFirst({
      where: {
        id,
        deleted_at: null,
      },
      select: PRODUCT_FAMILY_SELECT,
    })

    if (!family) {
      throw new NotFoundException(`Product family ${id} not found`)
    }

    return family
  }

  async create(dto: CreateProductFamilyDto): Promise<ProductFamilyItem> {
    return this.prisma.product_families.create({
      data: {
        ...dto,
        is_active: dto.is_active ?? true,
      },
      select: PRODUCT_FAMILY_SELECT,
    })
  }

  async update(
    id: string,
    dto: UpdateProductFamilyDto,
  ): Promise<ProductFamilyItem> {
    await this.findById(id)

    return this.prisma.product_families.update({
      where: { id },
      data: dto,
      select: PRODUCT_FAMILY_SELECT,
    })
  }

  async remove(id: string): Promise<ProductFamilyItem> {
    await this.findById(id)
    const linkedModels = await this.prisma.device_models.count({
      where: {
        product_family_id: id,
        deleted_at: null,
      },
    })
    if (linkedModels > 0) {
      throw new ConflictException(
        `Không thể xóa dòng sản phẩm vì đang có ${linkedModels} thiết bị sử dụng. Hãy chuyển hoặc xóa các thiết bị trước.`,
      )
    }

    return this.prisma.product_families.update({
      where: { id },
      data: {
        deleted_at: new Date(),
        is_active: false,
      },
      select: PRODUCT_FAMILY_SELECT,
    })
  }

  private buildWhere(
    query: QueryProductFamiliesDto,
  ): Prisma.product_familiesWhereInput {
    const q = query.q?.trim()

    return {
      deleted_at: null,
      ...(query.include_inactive ? {} : { is_active: true }),
      ...(query.brand_org_id && { brand_org_id: query.brand_org_id }),
      ...(query.device_category_id && {
        device_category_id: query.device_category_id,
      }),
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
      ...(q && {
        OR: [
          { name: { contains: q, mode: 'insensitive' } },
          { slug: { contains: q, mode: 'insensitive' } },
          { description: { contains: q, mode: 'insensitive' } },
        ],
      }),
    }
  }

  private buildOrderBy(
    query: QueryProductFamiliesDto,
  ): Prisma.product_familiesOrderByWithRelationInput[] {
    const allowedSortFields = new Set([
      'name',
      'slug',
      'first_release_year',
      'last_release_year',
      'created_at',
      'updated_at',
    ])
    const explicitSortBy =
      query.sortBy && allowedSortFields.has(query.sortBy) ? query.sortBy : undefined

    if (explicitSortBy) {
      return [{ [explicitSortBy]: query.sortOrder ?? 'asc' }]
    }

    return [{ first_release_year: 'desc' }, { name: 'asc' }]
  }
}
