import { ConflictException, NotFoundException } from '@nestjs/common'
import { OrganizationsService } from './organizations.service'

describe('OrganizationsService', () => {
  const organization = {
    id: 'org-1',
    name: 'Apple Inc.',
    slug: 'apple',
    short_name: 'Apple',
    legal_name: 'Apple Inc.',
    country_code: 'US',
    founded_year: 1976,
    website_url: 'https://apple.com',
    logo_url: null,
    description: 'Apple description',
    is_active: true,
    created_at: new Date('2026-01-01T00:00:00.000Z'),
    updated_at: new Date('2026-01-02T00:00:00.000Z'),
  }

  const prisma = {
    organizations: {
      findMany: jest.fn(),
      count: jest.fn(),
      findFirst: jest.fn(),
      update: jest.fn(),
    },
    product_families: {
      count: jest.fn(),
    },
    $transaction: jest.fn((operations: Promise<unknown>[]) =>
      Promise.all(operations),
    ),
  }

  let service: OrganizationsService

  beforeEach(() => {
    jest.clearAllMocks()
    service = new OrganizationsService(prisma as any)
  })

  it('lists active organizations with pagination and filters', async () => {
    prisma.organizations.findMany.mockResolvedValue([organization])
    prisma.organizations.count.mockResolvedValue(1)

    await expect(
      service.findMany({
        page: 2,
        pageSize: 10,
        q: 'apple',
        country_code: 'US',
        sortOrder: 'desc',
      } as any),
    ).resolves.toEqual({
      data: [organization],
      meta: {
        total: 1,
        page: 2,
        pageSize: 10,
        totalPages: 1,
        hasNext: false,
        hasPrev: true,
      },
    })

    expect(prisma.organizations.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        skip: 10,
        take: 10,
        orderBy: { name: 'asc' },
        where: expect.objectContaining({
          deleted_at: null,
          is_active: true,
          country_code: 'US',
          OR: expect.any(Array),
        }),
      }),
    )
  })

  it('can include inactive organizations in list results', async () => {
    prisma.organizations.findMany.mockResolvedValue([organization])
    prisma.organizations.count.mockResolvedValue(1)

    await service.findMany({ include_inactive: true } as any)

    expect(prisma.organizations.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.not.objectContaining({ is_active: true }),
      }),
    )
  })

  it('finds an active organization by slug', async () => {
    prisma.organizations.findFirst.mockResolvedValue(organization)

    await expect(service.findBySlug('apple')).resolves.toBe(organization)
    expect(prisma.organizations.findFirst).toHaveBeenCalledWith(
      expect.objectContaining({
        where: {
          slug: 'apple',
          deleted_at: null,
          is_active: true,
        },
      }),
    )
  })

  it('throws when slug is missing', async () => {
    prisma.organizations.findFirst.mockResolvedValue(null)

    await expect(service.findBySlug('missing')).rejects.toBeInstanceOf(
      NotFoundException,
    )
  })

  it('finds an organization by id', async () => {
    prisma.organizations.findFirst.mockResolvedValue(organization)

    await expect(service.findById('org-1')).resolves.toBe(organization)
    expect(prisma.organizations.findFirst).toHaveBeenCalledWith(
      expect.objectContaining({
        where: {
          id: 'org-1',
          deleted_at: null,
        },
      }),
    )
  })

  it('prevents deleting an organization used by product families', async () => {
    prisma.organizations.findFirst.mockResolvedValue(organization)
    prisma.product_families.count.mockResolvedValue(2)

    await expect(service.remove('org-1')).rejects.toBeInstanceOf(
      ConflictException,
    )
    expect(prisma.organizations.update).not.toHaveBeenCalled()
  })

  it('soft-deletes an organization without linked product families', async () => {
    prisma.organizations.findFirst.mockResolvedValue(organization)
    prisma.product_families.count.mockResolvedValue(0)
    prisma.organizations.update.mockResolvedValue({
      ...organization,
      is_active: false,
    })

    await service.remove('org-1')

    expect(prisma.organizations.update).toHaveBeenCalledWith({
      where: { id: 'org-1' },
      data: {
        deleted_at: expect.any(Date),
        is_active: false,
      },
      select: expect.any(Object),
    })
  })
})
