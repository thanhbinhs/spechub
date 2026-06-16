import { plainToInstance } from 'class-transformer'
import { validate } from 'class-validator'
import { UpdateUserRoleDto } from './update-user-role.dto'

describe('UpdateUserRoleDto', () => {
  async function validateRole(role: unknown) {
    const dto = plainToInstance(UpdateUserRoleDto, { role })
    return validate(dto)
  }

  it('accepts known user roles', async () => {
    await expect(validateRole('admin')).resolves.toHaveLength(0)
    await expect(validateRole('editor')).resolves.toHaveLength(0)
    await expect(validateRole('reader')).resolves.toHaveLength(0)
  })

  it('rejects unknown roles', async () => {
    const errors = await validateRole('superadmin')

    expect(errors).toHaveLength(1)
    expect(errors[0].constraints).toHaveProperty('isIn')
  })
})
