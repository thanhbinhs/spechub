import { SetMetadata } from '@nestjs/common'
import type { UserRole } from '../constants'


export const ROLES_KEY = 'roles'

/**
 * @Roles(...roles) decorator
 *
 * Usage: Chỉ user có role được liệt kê mới truy cập được
 *
 *   @Roles('admin')
 *   @Post()
 *   create(@Body() dto: CreateDto) { ... }
 *
 *   @Roles('admin', 'editor')  // OR logic
 *   @Patch(':id')
 *   update(@Param('id') id: string) { ... }
 */
export const Roles = (...roles: UserRole[]) => SetMetadata(ROLES_KEY, roles)