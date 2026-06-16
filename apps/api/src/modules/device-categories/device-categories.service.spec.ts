import { NotFoundException } from '@nestjs/common'
import { DeviceCategoriesService } from './device-categories.service'

describe('DeviceCategoriesService', () => {
  const category = {
    id: 'category-1',
    name: 'Smartphone',
    slug: 'smartphone',
    parent_category_id: null,
    description: 'Phones',
    icon_url: null,
    display_order: 1,
    is_active: true,
    created_at: new Date('2026-01-01T00:00:00.000Z'),
    updated_at: new Date('2026-01-02T00:00:00.000Z'),
  }

  const prisma = {
    device_categories: {
      findMany: jest.fn(),
      count: jest.fn(),
      findFirst: jest.fn(),
    },
    $transaction: jest.fn((operations: Promise<unknown>[]) =>
      Promise.all(operations),
    ),
  }

  let service: DeviceCategoriesService

  beforeEach(() => {
    jest.clearAllMocks()
    service = new DeviceCategoriesService(prisma as any)
  })

  it('lists active categories with pagination', async () => {
    prisma.device_categories.findMany.mockResolvedValue([category])
    prisma.device_categories.count.mockResolvedValue(1)

    await expect(service.findMany({ page: 1, pageSize: 10 } as any)).resolves.toEqual({
      data: [category],
      meta: {
        total: 1,
        page: 1,
        pageSize: 10,
        totalPages: 1,
        hasNext: false,
        hasPrev: false,
      },
    })

    expect(prisma.device_categories.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          deleted_at: null,
          is_active: true,
        }),
        orderBy: [{ display_order: 'asc' }, { name: 'asc' }],
      }),
    )
  })

  it('loads the active category tree', async () => {
    prisma.device_categories.findMany.mockResolvedValue([category])

    await expect(service.findTree()).resolves.toEqual([category])
    expect(prisma.device_categories.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: {
          deleted_at: null,
          is_active: true,
          parent_category_id: null,
        },
      }),
    )
  })

  it('throws when a slug is missing', async () => {
    prisma.device_categories.findFirst.mockResolvedValue(null)

    await expect(service.findBySlug('missing')).rejects.toBeInstanceOf(
      NotFoundException,
    )
  })
})
