import { Injectable, ExecutionContext, UnauthorizedException } from '@nestjs/common'
import { AuthGuard } from '@nestjs/passport'
import { Reflector } from '@nestjs/core'
import { IS_PUBLIC_KEY } from '../decorators/public.decorator'

/**
 * JwtAuthGuard - Mặc định bảo vệ MỌI endpoint
 *
 * Hoạt động:
 * 1. Check route có @Public() không → skip auth
 * 2. Nếu không → verify JWT token (do JwtStrategy xử lý)
 * 3. Token hợp lệ → attach user vào request, cho qua
 * 4. Token sai/hết hạn → throw UnauthorizedException (401)
 *
 * Setup global trong app.module.ts:
 *   {
 *     provide: APP_GUARD,
 *     useClass: JwtAuthGuard,
 *   }
 */
@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {
  constructor(private reflector: Reflector) {
    super()
  }

  override canActivate(context: ExecutionContext) {
    // Check xem route có @Public() không
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(), // method-level decorator
      context.getClass(),    // class-level decorator
    ])

    // Nếu là public → skip auth, cho qua
    if (isPublic) {
      return true
    }

    // Không public → chạy passport-jwt strategy để verify token
    return super.canActivate(context)
  }

  /**
   * Override handleRequest để customize error message
   */
  override handleRequest<TUser>(err: Error | null, user: TUser | false): TUser {
    if (err || !user) {
      throw new UnauthorizedException(
        err?.message || 'Bạn cần đăng nhập để truy cập endpoint này',
      )
    }
    return user
  }
}