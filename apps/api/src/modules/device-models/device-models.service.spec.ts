import { NotFoundException } from '@nestjs/common'
import { DeviceModelsService } from './device-models.service'

describe('DeviceModelsService', () => {
  const model = {
    id: 'model-1',
    name: 'iPhone 16 Pro',
    slug: 'iphone-16-pro',
    product_family_id: 'family-1',
  }

  const prisma = {
    device_models: {
      findMany: jest.fn(),
      count: jest.fn(),
      findFirst: jest.fn(),
    },
    $transaction: jest.fn((operations: Promise<unknown>[]) =>
      Promise.all(operations),
    ),
  }

  let service: DeviceModelsService

  beforeEach(() => {
    jest.clearAllMocks()
    service = new DeviceModelsService(prisma as any)
  })

  it('filters device models by brand, category, family and release status', async () => {
    prisma.device_models.findMany.mockResolvedValue([model])
    prisma.device_models.count.mockResolvedValue(1)

    await service.findMany({
      brand_slug: 'apple',
      category_slug: 'smartphone',
      family_slug: 'iphone-16-series',
      release_status: 'released',
      q: 'iphone',
    } as any)

    expect(prisma.device_models.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          deleted_at: null,
          release_status: { code: 'released' },
          product_family: expect.objectContaining({
            slug: 'iphone-16-series',
            brand_org: expect.objectContaining({ slug: 'apple' }),
            device_category: expect.objectContaining({ slug: 'smartphone' }),
          }),
          OR: expect.any(Array),
        }),
      }),
    )
  })

  it('finds a model by slug', async () => {
    prisma.device_models.findFirst.mockResolvedValue(model)

    await expect(service.findBySlug('iphone-16-pro')).resolves.toBe(model)
  })

  it('throws when a model is missing', async () => {
    prisma.device_models.findFirst.mockResolvedValue(null)

    await expect(service.findById('missing')).rejects.toBeInstanceOf(
      NotFoundException,
    )
  })
})
