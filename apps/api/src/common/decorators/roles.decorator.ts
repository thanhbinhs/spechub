import { SetMetadata } from '@nestjs/common'

/**
 * Các role có trong hệ thống (match với users.role trong DB)
 */
export type UserRole = 'reader' | 'contributor' | 'editor' | 'moderator' | 'admin'

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