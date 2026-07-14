import { Injectable, NotFoundException } from '@nestjs/common'
import { Prisma } from '@spechub/database'
import {
  createPaginationMeta,
  type PaginationMeta,
} from '../../common/dto/pagination.dto'
import { PrismaService } from '../../prisma/prisma.service'
import { CreateOrganizationDto } from './dto/create-organization.dto'
import { QueryOrganizationsDto } from './dto/query-organization.dto'
import { UpdateOrganizationDto } from './dto/update-organization.dto'

const ORGANIZATION_SELECT = {
  id: true,
  name: true,
  slug: true,
  short_name: true,
  legal_name: true,
  country_code: true,
  founded_year: true,
  website_url: true,
  logo_url: true,
  description: true,
  is_active: true,
  created_at: true,
  updated_at: true,
} satisfies Prisma.organizationsSelect

export type OrganizationListItem = Prisma.organizationsGetPayload<{
  select: typeof ORGANIZATION_SELECT
}>

export type OrganizationListResult = {
  data: OrganizationListItem[]
  meta: PaginationMeta
}

@Injectable()
export class OrganizationsService {
  constructor(private readonly prisma: PrismaService) {}

  async findMany(query: QueryOrganizationsDto): Promise<OrganizationListResult> {
    const page = query.page ?? 1
    const pageSize = query.pageSize ?? 20
    const where = this.buildWhere(query)

    const [items, total] = await this.prisma.$transaction([
      this.prisma.organizations.findMany({
        where,
        select: ORGANIZATION_SELECT,
        skip: (page - 1) * pageSize,
        take: pageSize,
        orderBy: this.buildOrderBy(query),
      }),
      this.prisma.organizations.count({ where }),
    ])

    return {
      data: items,
      meta: createPaginationMeta(total, page, pageSize),
    }
  }

  async findBySlug(slug: string): Promise<OrganizationListItem> {
    const organization = await this.prisma.organizations.findFirst({
      where: {
        slug,
        deleted_at: null,
        is_active: true,
      },
      select: ORGANIZATION_SELECT,
    })

    if (!organization) {
      throw new NotFoundException(`Organization ${slug} not found`)
    }

    return organization
  }

  async findById(id: string): Promise<OrganizationListItem> {
    const organization = await this.prisma.organizations.findFirst({
      where: {
        id,
        deleted_at: null,
      },
      select: ORGANIZATION_SELECT,
    })

    if (!organization) {
      throw new NotFoundException(`Organization ${id} not found`)
    }

    return organization
  }

  async create(dto: CreateOrganizationDto): Promise<OrganizationListItem> {
    return this.prisma.organizations.create({
      data: dto,
      select: ORGANIZATION_SELECT,
    })
  }

  async update(
    id: string,
    dto: UpdateOrganizationDto,
  ): Promise<OrganizationListItem> {
    await this.findById(id)

    return this.prisma.organizations.update({
      where: { id },
      data: dto,
      select: ORGANIZATION_SELECT,
    })
  }

  async remove(id: string): Promise<OrganizationListItem> {
    await this.findById(id)

    return this.prisma.organizations.update({
      where: { id },
      data: {
        deleted_at: new Date(),
        is_active: false,
      },
      select: ORGANIZATION_SELECT,
    })
  }

  private buildWhere(query: QueryOrganizationsDto): Prisma.organizationsWhereInput {
    const q = query.q?.trim()

    return {
      deleted_at: null,
      ...(query.include_inactive ? {} : { is_active: true }),
      ...(query.country_code && { country_code: query.country_code }),
      ...(q && {
        OR: [
          { name: { contains: q, mode: 'insensitive' } },
          { short_name: { contains: q, mode: 'insensitive' } },
          { slug: { contains: q, mode: 'insensitive' } },
          { description: { contains: q, mode: 'insensitive' } },
        ],
      }),
    }
  }

  private buildOrderBy(
    query: QueryOrganizationsDto,
  ): Prisma.organizationsOrderByWithRelationInput {
    const allowedSortFields = new Set([
      'name',
      'slug',
      'country_code',
      'founded_year',
      'created_at',
      'updated_at',
    ])
    const explicitSortBy =
      query.sortBy && allowedSortFields.has(query.sortBy) ? query.sortBy : undefined
    const sortBy = explicitSortBy ?? 'name'

    return {
      [sortBy]: explicitSortBy ? (query.sortOrder ?? 'asc') : 'asc',
    }
  }
}
