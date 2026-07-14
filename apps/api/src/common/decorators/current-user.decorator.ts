import { createParamDecorator, ExecutionContext } from "@nestjs/common";
import { FastifyRequest } from "fastify";

/**
 * Interface mô tả shape của user trong JWT payload.
 * Sau khi JwtStrategy validate token, nó sẽ attach object này
 * vào request.user
 */
export interface AuthUser {
  id: string;
  email: string;
  role: string;
  username?: string;
  display_name?: string;
  session_id: string;
}

/**
 * @CurrentUser() decorator
 *
 * Usage:
 *   @Get('me')
 *   getMe(@CurrentUser() user: AuthUser) {
 *     return user
 *   }
 *
 *   // Lấy 1 field cụ thể:
 *   @Get('my-id')
 *   getMyId(@CurrentUser('id') userId: string) {
 *     return { userId }
 *   }
 */
export const CurrentUser = createParamDecorator(
  (
    data: keyof AuthUser | undefined,
    ctx: ExecutionContext,
  ): AuthUser | string | undefined => {
    const request = ctx
      .switchToHttp()
      .getRequest<FastifyRequest & { user?: AuthUser }>();
    const user = request.user;

    if (!user) {
      return undefined;
    }

    // Nếu có truyền key cụ thể, chỉ trả về field đó
    return data ? user[data] : user;
  },
);
