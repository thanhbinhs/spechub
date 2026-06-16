import { Test } from '@nestjs/testing'
import { OrganizationsController } from './organizations.controller'
import { OrganizationsService } from './organizations.service'

describe('OrganizationsController', () => {
  const organizationsService = {
    findMany: jest.fn(),
    findById: jest.fn(),
    findBySlug: jest.fn(),
  }

  let controller: OrganizationsController

  beforeEach(async () => {
    jest.clearAllMocks()

    const moduleRef = await Test.createTestingModule({
      controllers: [OrganizationsController],
      providers: [
        { provide: OrganizationsService, useValue: organizationsService },
      ],
    }).compile()

    controller = moduleRef.get(OrganizationsController)
  })

  it('delegates list queries to the service', async () => {
    const result = { data: [], meta: { total: 0 } }
    const query = { page: 1, pageSize: 20, q: 'apple' }
    organizationsService.findMany.mockResolvedValue(result)

    await expect(controller.findMany(query as any)).resolves.toBe(result)
    expect(organizationsService.findMany).toHaveBeenCalledWith(query)
  })

  it('delegates id lookups to the service', async () => {
    const organization = { id: 'org-1', slug: 'apple' }
    organizationsService.findById.mockResolvedValue(organization)

    await expect(controller.findById('org-1')).resolves.toBe(organization)
    expect(organizationsService.findById).toHaveBeenCalledWith('org-1')
  })

  it('delegates slug lookups to the service', async () => {
    const organization = { id: 'org-1', slug: 'apple' }
    organizationsService.findBySlug.mockResolvedValue(organization)

    await expect(controller.findBySlug('apple')).resolves.toBe(organization)
    expect(organizationsService.findBySlug).toHaveBeenCalledWith('apple')
  })
})
