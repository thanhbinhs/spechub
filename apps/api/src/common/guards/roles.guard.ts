import { Injectable, CanActivate, ExecutionContext, ForbiddenException } from '@nestjs/common'
import { Reflector } from '@nestjs/core'
import { FastifyRequest } from 'fastify'
import { ROLES_KEY } from '../decorators/roles.decorator'
import type { UserRole } from '../constants'
import { AuthUser } from '../decorators/current-user.decorator'

/**
 * RolesGuard - Check role của user
 *
 * Hoạt động:
 * 1. Đọc roles required từ @Roles() decorator
 * 2. Nếu không có @Roles() → cho qua (mọi user đã login đều OK)
 * 3. Có @Roles() → check user.role có nằm trong list không
 * 4. Không match → throw ForbiddenException (403)
 *
 * Hierarchy role (cao → thấp):
 *   admin > moderator > editor > contributor > reader
 *
 * Note: User phải đã được authenticate (JwtAuthGuard chạy trước)
 *       Guard này check role của user.
 */
@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredRoles = this.reflector.getAllAndOverride<UserRole[]>(ROLES_KEY, [
      context.getHandler(),
      context.getClass(),
    ])

    // Không có @Roles() → mọi user authenticated đều OK
    if (!requiredRoles || requiredRoles.length === 0) {
      return true
    }

    const request = context.switchToHttp().getRequest<FastifyRequest & { user?: AuthUser }>()
    const user = request.user

    if (!user) {
      throw new ForbiddenException('User không hợp lệ')
    }

    // Check user role có nằm trong list required không
    const hasRole = requiredRoles.includes(user.role as UserRole)

    if (!hasRole) {
      throw new ForbiddenException(
        `Bạn không có quyền truy cập. Cần role: ${requiredRoles.join(' hoặc ')}`,
      )
    }

    return true
  }
}
