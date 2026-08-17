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
import { CreateDeviceCategoryDto } from './dto/create-device-category.dto'
import { QueryDeviceCategoriesDto } from './dto/query-device-categories.dto'
import { UpdateDeviceCategoryDto } from './dto/update-device-category.dto'

const DEVICE_CATEGORY_SELECT = {
  id: true,
  name: true,
  slug: true,
  parent_category_id: true,
  description: true,
  icon_url: true,
  display_order: true,
  is_active: true,
  created_at: true,
  updated_at: true,
} satisfies Prisma.device_categoriesSelect

const DEVICE_CATEGORY_TREE_SELECT = {
  ...DEVICE_CATEGORY_SELECT,
  child_categories: {
    where: {
      deleted_at: null,
      is_active: true,
    },
    select: DEVICE_CATEGORY_SELECT,
    orderBy: [{ display_order: 'asc' as const }, { name: 'asc' as const }],
  },
} satisfies Prisma.device_categoriesSelect

export type DeviceCategoryItem = Prisma.device_categoriesGetPayload<{
  select: typeof DEVICE_CATEGORY_SELECT
}>

export type DeviceCategoryListResult = {
  data: DeviceCategoryItem[]
  meta: PaginationMeta
}

@Injectable()
export class DeviceCategoriesService {
  constructor(private readonly prisma: PrismaService) {}

  async findMany(
    query: QueryDeviceCategoriesDto,
  ): Promise<DeviceCategoryListResult> {
    const page = query.page ?? 1
    const pageSize = query.pageSize ?? 20
    const where = this.buildWhere(query)

    const [items, total] = await this.prisma.$transaction([
      this.prisma.device_categories.findMany({
        where,
        select: DEVICE_CATEGORY_SELECT,
        skip: (page - 1) * pageSize,
        take: pageSize,
        orderBy: this.buildOrderBy(query),
      }),
      this.prisma.device_categories.count({ where }),
    ])

    return {
      data: items,
      meta: createPaginationMeta(total, page, pageSize),
    }
  }

  async findTree() {
    return this.prisma.device_categories.findMany({
      where: {
        deleted_at: null,
        is_active: true,
        parent_category_id: null,
      },
      select: DEVICE_CATEGORY_TREE_SELECT,
      orderBy: [{ display_order: 'asc' }, { name: 'asc' }],
    })
  }

  async findBySlug(slug: string): Promise<DeviceCategoryItem> {
    const category = await this.prisma.device_categories.findFirst({
      where: {
        slug,
        deleted_at: null,
        is_active: true,
      },
      select: DEVICE_CATEGORY_SELECT,
    })

    if (!category) {
      throw new NotFoundException(`Device category ${slug} not found`)
    }

    return category
  }

  async findById(id: string): Promise<DeviceCategoryItem> {
    const category = await this.prisma.device_categories.findFirst({
      where: {
        id,
        deleted_at: null,
      },
      select: DEVICE_CATEGORY_SELECT,
    })

    if (!category) {
      throw new NotFoundException(`Device category ${id} not found`)
    }

    return category
  }

  async create(dto: CreateDeviceCategoryDto): Promise<DeviceCategoryItem> {
    try {
      return await this.prisma.device_categories.create({
        data: {
          ...dto,
          display_order: dto.display_order ?? 0,
          is_active: dto.is_active ?? true,
        },
        select: DEVICE_CATEGORY_SELECT,
      })
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2002'
      ) {
        throw new ConflictException(
          'Tên hoặc slug danh mục thiết bị đã tồn tại.',
        )
      }
      throw error
    }
  }

  async update(
    id: string,
    dto: UpdateDeviceCategoryDto,
  ): Promise<DeviceCategoryItem> {
    await this.findById(id)

    return this.prisma.device_categories.update({
      where: { id },
      data: dto,
      select: DEVICE_CATEGORY_SELECT,
    })
  }

  async remove(id: string): Promise<DeviceCategoryItem> {
    await this.findById(id)

    return this.prisma.device_categories.update({
      where: { id },
      data: {
        deleted_at: new Date(),
        is_active: false,
      },
      select: DEVICE_CATEGORY_SELECT,
    })
  }

  private buildWhere(
    query: QueryDeviceCategoriesDto,
  ): Prisma.device_categoriesWhereInput {
    const q = query.q?.trim()

    return {
      deleted_at: null,
      ...(query.include_inactive ? {} : { is_active: true }),
      ...(query.parent_category_id && {
        parent_category_id: query.parent_category_id,
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
    query: QueryDeviceCategoriesDto,
  ): Prisma.device_categoriesOrderByWithRelationInput[] {
    const allowedSortFields = new Set([
      'name',
      'slug',
      'display_order',
      'created_at',
      'updated_at',
    ])
    const explicitSortBy =
      query.sortBy && allowedSortFields.has(query.sortBy) ? query.sortBy : undefined

    if (explicitSortBy) {
      return [{ [explicitSortBy]: query.sortOrder ?? 'asc' }]
    }

    return [{ display_order: 'asc' }, { name: 'asc' }]
  }
}
