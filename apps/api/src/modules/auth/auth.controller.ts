import {
  Controller,
  Post,
  Get,
  Body,
  UseGuards,
  HttpCode,
  HttpStatus,
  Request,
} from '@nestjs/common'
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiBody } from '@nestjs/swagger'
import { AuthGuard } from '@nestjs/passport'
import { FastifyRequest } from 'fastify'
import { AuthService } from './auth.service'
import { RegisterDto } from './dto/register.dto'
import { LoginDto } from './dto/login.dto'
import { RefreshTokenDto } from './dto/refresh-token.dto'
import { AuthResponseDto, AuthTokensDto } from './dto/auth-response.dto'
import { Public } from '../../common/decorators/public.decorator'
import { CurrentUser, AuthUser } from '../../common/decorators/current-user.decorator'

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  /**
   * POST /api/v1/auth/register
   * Đăng ký user mới
   */
  @Public()
  @Post('register')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Đăng ký tài khoản mới' })
  @ApiResponse({ status: 201, type: AuthResponseDto, description: 'Đăng ký thành công' })
  @ApiResponse({ status: 409, description: 'Email/username đã tồn tại' })
  async register(@Body() dto: RegisterDto) {
    return this.authService.register(dto)
  }

  /**
   * POST /api/v1/auth/login
   * Đăng nhập với email + password
   */
  @Public()
  @UseGuards(AuthGuard('local'))
  @Post('login')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Đăng nhập' })
  @ApiBody({ type: LoginDto })
  @ApiResponse({ status: 200, type: AuthResponseDto })
  @ApiResponse({ status: 401, description: 'Email hoặc mật khẩu sai' })
  async login(@Request() req: FastifyRequest & { user: any }) {
    // user đã được LocalStrategy gắn vào req.user
    return this.authService.login(req.user)
  }

  /**
   * POST /api/v1/auth/refresh
   * Refresh access token
   */
  @Public()
  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Refresh access token' })
  @ApiResponse({ status: 200, type: AuthTokensDto })
  @ApiResponse({ status: 401, description: 'Refresh token sai' })
  async refresh(@Body() dto: RefreshTokenDto) {
    return this.authService.refreshToken(dto.refresh_token)
  }

  /**
   * GET /api/v1/auth/me
   * Lấy thông tin user hiện tại
   */
  @Get('me')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Lấy thông tin user hiện tại' })
  @ApiResponse({ status: 200, description: 'User info' })
  @ApiResponse({ status: 401, description: 'Chưa đăng nhập' })
  async getMe(@CurrentUser() user: AuthUser) {
    return user
  }

  /**
   * POST /api/v1/auth/logout
   * Logout (client tự xóa token)
   *
   * Note: JWT là stateless nên không "revoke" được trừ khi
   * dùng blacklist. Hiện tại logout chỉ là semantic — client
   * tự xóa token. Sau này có thể thêm Redis blacklist.
   */
  @Post('logout')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Đăng xuất' })
  @ApiResponse({ status: 204, description: 'Logout thành công' })
  async logout() {
    // TODO: Thêm Redis blacklist cho token (Phase 2)
    return null
  }
}