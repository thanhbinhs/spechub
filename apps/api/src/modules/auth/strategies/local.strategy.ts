import { Injectable, UnauthorizedException } from '@nestjs/common'
import { PassportStrategy } from '@nestjs/passport'
import { Strategy } from 'passport-local'
import { UsersService } from '../../users/users.service'

/**
 * LocalStrategy - Validate email + password
 *
 * Hoạt động:
 * 1. Endpoint POST /auth/login với @UseGuards(LocalAuthGuard)
 * 2. Guard tự động extract email/password từ body
 * 3. Call validate(email, password) → return user nếu OK
 * 4. Attach user vào request.user → controller dùng
 *
 * Note: Mặc định passport-local đọc field "username", "password"
 *       Cần override usernameField="email"
 */
@Injectable()
export class LocalStrategy extends PassportStrategy(Strategy, 'local') {
  constructor(private readonly usersService: UsersService) {
    super({
      usernameField: 'email', // ← Mặc định là "username"
      passwordField: 'password',
    })
  }

  async validate(email: string, password: string) {
    const user = await this.usersService.validatePassword(email, password)

    if (!user) {
      throw new UnauthorizedException('Email hoặc mật khẩu không đúng')
    }

    if (!user.is_active) {
      throw new UnauthorizedException('Tài khoản đã bị vô hiệu hóa')
    }

    return user
  }
}