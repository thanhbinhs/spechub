import { SetMetadata } from '@nestjs/common'

/**
 * Key dùng để mark metadata "public".
 * JwtAuthGuard sẽ check key này để quyết định có skip auth không.
 */
export const IS_PUBLIC_KEY = 'isPublic'

/**
 * @Public() decorator
 *
 * Usage: Đánh dấu endpoint không cần auth
 *
 *   @Public()
 *   @Get('login')
 *   login() { ... }
 *
 *   @Public()
 *   @Get('devices')  // Public listing
 *   findAll() { ... }
 */
export const Public = () => SetMetadata(IS_PUBLIC_KEY, true)