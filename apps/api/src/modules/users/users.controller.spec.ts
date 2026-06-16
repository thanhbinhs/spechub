import { Test } from '@nestjs/testing'
import { UsersController } from './users.controller'
import { UsersService } from './users.service'

describe('UsersController', () => {
  let controller: UsersController
  const usersService = {
    findByIdOrThrow: jest.fn(),
    findByUsername: jest.fn(),
    updateRole: jest.fn(),
  }

  beforeEach(async () => {
    jest.clearAllMocks()

    const moduleRef = await Test.createTestingModule({
      controllers: [UsersController],
      providers: [{ provide: UsersService, useValue: usersService }],
    }).compile()

    controller = moduleRef.get(UsersController)
  })

  it('loads the current user profile from the database', async () => {
    const user = { id: 'user-1', email: 'admin@spechub.io', role: 'admin' }
    usersService.findByIdOrThrow.mockResolvedValue(user)

    await expect(controller.getMe('user-1')).resolves.toBe(user)
    expect(usersService.findByIdOrThrow).toHaveBeenCalledWith('user-1')
  })

  it('returns only public fields for username lookup', async () => {
    usersService.findByUsername.mockResolvedValue({
      id: 'user-1',
      email: 'hidden@spechub.io',
      username: 'contributor',
      display_name: 'Contributor',
      avatar_url: 'https://example.com/avatar.png',
      role: 'contributor',
      created_at: new Date('2026-01-01T00:00:00.000Z'),
    })

    await expect(controller.getPublicProfile('contributor')).resolves.toEqual({
      username: 'contributor',
      display_name: 'Contributor',
      avatar_url: 'https://example.com/avatar.png',
      created_at: new Date('2026-01-01T00:00:00.000Z'),
    })
  })

  it('updates role using the validated role DTO', async () => {
    const updated = { id: 'user-1', role: 'editor' }
    usersService.updateRole.mockResolvedValue(updated)

    await expect(controller.updateRole('user-1', { role: 'editor' })).resolves.toBe(updated)
    expect(usersService.updateRole).toHaveBeenCalledWith('user-1', 'editor')
  })
})
