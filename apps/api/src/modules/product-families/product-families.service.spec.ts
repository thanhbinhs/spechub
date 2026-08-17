import { ConflictException, NotFoundException } from '@nestjs/common'
import { ProductFamiliesService } from './product-families.service'

describe('ProductFamiliesService', () => {
  const family = {
    id: 'family-1',
    name: 'iPhone 16 Series',
    slug: 'iphone-16-series',
    brand_org_id: 'org-1',
    device_category_id: 'category-1',
    is_active: true,
  }

  const prisma = {
    product_families: {
      findMany: jest.fn(),
      count: jest.fn(),
      findFirst: jest.fn(),
      update: jest.fn(),
    },
    device_models: {
      count: jest.fn(),
    },
    $transaction: jest.fn((operations: Promise<unknown>[]) =>
      Promise.all(operations),
    ),
  }

  let service: ProductFamiliesService

  beforeEach(() => {
    jest.clearAllMocks()
    service = new ProductFamiliesService(prisma as any)
  })

  it('filters product families by brand and category slug', async () => {
    prisma.product_families.findMany.mockResolvedValue([family])
    prisma.product_families.count.mockResolvedValue(1)

    await service.findMany({
      brand_slug: 'apple',
      category_slug: 'smartphone',
    } as any)

    expect(prisma.product_families.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          deleted_at: null,
          is_active: true,
          brand_org: expect.objectContaining({ slug: 'apple' }),
          device_category: expect.objectContaining({ slug: 'smartphone' }),
        }),
      }),
    )
  })

  it('finds a product family by slug', async () => {
    prisma.product_families.findFirst.mockResolvedValue(family)

    await expect(service.findBySlug('iphone-16-series')).resolves.toBe(family)
  })

  it('throws when a family is missing', async () => {
    prisma.product_families.findFirst.mockResolvedValue(null)

    await expect(service.findById('missing')).rejects.toBeInstanceOf(
      NotFoundException,
    )
  })

  it('prevents deleting a family used by device models', async () => {
    prisma.product_families.findFirst.mockResolvedValue(family)
    prisma.device_models.count.mockResolvedValue(3)

    await expect(service.remove('family-1')).rejects.toBeInstanceOf(
      ConflictException,
    )
    expect(prisma.product_families.update).not.toHaveBeenCalled()
  })

  it('soft-deletes a family without linked device models', async () => {
    prisma.product_families.findFirst.mockResolvedValue(family)
    prisma.device_models.count.mockResolvedValue(0)
    prisma.product_families.update.mockResolvedValue({
      ...family,
      is_active: false,
    })

    await service.remove('family-1')

    expect(prisma.product_families.update).toHaveBeenCalledWith({
      where: { id: 'family-1' },
      data: {
        deleted_at: expect.any(Date),
        is_active: false,
      },
      select: expect.any(Object),
    })
  })
})
