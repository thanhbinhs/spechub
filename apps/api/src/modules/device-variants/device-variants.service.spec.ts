import { BadRequestException, NotFoundException } from '@nestjs/common'
import { DeviceVariantsService } from './device-variants.service'

describe('DeviceVariantsService', () => {
  const variantA = { id: 'variant-a', variant_name: '256GB Natural Titanium' }
  const variantB = { id: 'variant-b', variant_name: '512GB Black Titanium' }

  const prisma = {
    device_variants: {
      findMany: jest.fn(),
      count: jest.fn(),
      findFirst: jest.fn(),
    },
    $transaction: jest.fn((operations: Promise<unknown>[]) =>
      Promise.all(operations),
    ),
  }

  let service: DeviceVariantsService

  beforeEach(() => {
    jest.clearAllMocks()
    service = new DeviceVariantsService(prisma as any)
  })

  it('lists variants by model slug', async () => {
    prisma.device_variants.findMany.mockResolvedValue([variantA])
    prisma.device_variants.count.mockResolvedValue(1)

    await service.findMany({ model_slug: 'iphone-16-pro', default_only: true } as any)

    expect(prisma.device_variants.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          deleted_at: null,
          is_default: true,
          device_model: {
            slug: 'iphone-16-pro',
            deleted_at: null,
          },
        }),
      }),
    )
  })

  it('compares variants while preserving requested order', async () => {
    prisma.device_variants.findMany.mockResolvedValue([variantB, variantA])

    await expect(service.compare(['variant-a', 'variant-b'])).resolves.toEqual({
      data: [variantA, variantB],
    })
  })

  it('rejects compare requests with fewer than 2 unique ids', async () => {
    await expect(service.compare(['variant-a', 'variant-a'])).rejects.toBeInstanceOf(
      BadRequestException,
    )
  })

  it('throws when any compare variant is missing', async () => {
    prisma.device_variants.findMany.mockResolvedValue([variantA])

    await expect(service.compare(['variant-a', 'variant-b'])).rejects.toBeInstanceOf(
      NotFoundException,
    )
  })
})
