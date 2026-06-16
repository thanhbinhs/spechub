import { ApiProperty } from '@nestjs/swagger'
import { IsIn } from 'class-validator'
import { ALL_USER_ROLES, type UserRole } from '../../../common/constants'

export class UpdateUserRoleDto {
  @ApiProperty({ enum: ALL_USER_ROLES })
  @IsIn(ALL_USER_ROLES)
  role!: UserRole
}