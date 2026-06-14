import { Injectable, UnauthorizedException, Logger } from '@nestjs/common'
import { JwtService } from '@nestjs/jwt'
import { ConfigService } from '@nestjs/config'
import { UsersService } from '../users/users.service'
import { RegisterDto } from './dto/register.dto'
import { JwtPayload, RefreshTokenPayload } from './interfaces/jwt-payload.interface'

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name)

  constructor(
    private readonly usersService: UsersService,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {}

  /**
   * Đăng ký user mới
   */
  async register(dto: RegisterDto) {
    const user = await this.usersService.create({
      email: dto.email,
      password: dto.password,
      username: dto.username,
      display_name: dto.display_name,
    })

    // Sign tokens ngay để user khỏi phải login lại
    const tokens = await this.signTokens({
      sub: user.id,
      email: user.email,
      role: user.role,
    })

    this.logger.log(`Đăng ký thành công: ${user.email}`)

    return {
      user: {
        id: user.id,
        email: user.email,
        username: user.username ?? undefined,
        display_name: user.display_name ?? undefined,
        role: user.role,
      },
      tokens,
    }
  }

  /**
   * Login - được gọi sau khi LocalStrategy validate thành công
   */
  async login(user: { id: string; email: string; role: string; username?: string | null; display_name?: string | null }) {
    const tokens = await this.signTokens({
      sub: user.id,
      email: user.email,
      role: user.role,
    })

    // Update last login
    await this.usersService.updateLastLogin(user.id)

    this.logger.log(`Login thành công: ${user.email}`)

    return {
      user: {
        id: user.id,
        email: user.email,
        username: user.username ?? undefined,
        display_name: user.display_name ?? undefined,
        role: user.role,
      },
      tokens,
    }
  }

  /**
   * Refresh access token bằng refresh token
   */
  async refreshToken(refreshToken: string) {
    try {
      const payload = await this.jwtService.verifyAsync<RefreshTokenPayload>(refreshToken, {
        secret: this.configService.get<string>('JWT_SECRET'),
      })

      if (payload.type !== 'refresh') {
        throw new UnauthorizedException('Token không hợp lệ')
      }

      // Load user
      const user = await this.usersService.findById(payload.sub)
      if (!user || !user.is_active) {
        throw new UnauthorizedException('User không hợp lệ')
      }

      // Sign tokens mới
      return await this.signTokens({
        sub: user.id,
        email: user.email,
        role: user.role,
      })
    } catch (error) {
      throw new UnauthorizedException('Refresh token không hợp lệ hoặc đã hết hạn')
    }
  }

  /**
   * Sign access + refresh tokens
   */
  private async signTokens(payload: JwtPayload) {
    const accessTokenExpiresIn = this.configService.get<string>('JWT_EXPIRES_IN', '7d')
    const refreshTokenExpiresIn = this.configService.get<string>('JWT_REFRESH_EXPIRES_IN', '30d')

    const [access_token, refresh_token] = await Promise.all([
      this.jwtService.signAsync(payload, { expiresIn: accessTokenExpiresIn }),
      this.jwtService.signAsync(
        { sub: payload.sub, type: 'refresh' },
        { expiresIn: refreshTokenExpiresIn },
      ),
    ])

    return {
      access_token,
      refresh_token,
      expires_in: this.parseExpiresIn(accessTokenExpiresIn),
    }
  }

  /**
   * Convert "7d" → 604800 (seconds)
   */
  private parseExpiresIn(value: string): number {
    const match = value.match(/^(\d+)([smhd])$/)
    if (!match) return 604800 // default 7 days

    const num = parseInt(match[1], 10)
    const unit = match[2]

    switch (unit) {
      case 's': return num
      case 'm': return num * 60
      case 'h': return num * 3600
      case 'd': return num * 86400
      default: return 604800
    }
  }
}