import {
  Controller,
  Get,
  Patch,
  Delete,
  Param,
  Body,
  Query,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags, ApiOperation } from '@nestjs/swagger';
import { ParseUUIDPipe } from '@nestjs/common';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { USER_ROLES, type UserRole } from '../../common/constants';
import { UsersService } from './users.service';
import { UpdateUserDto } from './dto/update-user.dto';
import { UpdatePasswordDto } from './dto/update-password.dto';
import { QueryUsersDto } from './dto/query-users.dto';
import type { SafeUser } from './interfaces/safe-user.interface';

@ApiTags('users')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  // ────────── User tự thao tác với mình ──────────

  @Get('me')
  @ApiOperation({ summary: 'Lấy profile của user hiện tại' })
  getMe(@CurrentUser() user: SafeUser): SafeUser {
    // JWT đã verify trong guard, user gắn vào request.
    // Không query lại DB ở đây — tin JWT (trade-off: nếu user bị disable
    // sau khi JWT issued, vẫn pass đến khi token expire).
    return user;
  }

  @Patch('me')
  @ApiOperation({ summary: 'Update profile' })
  updateMe(
    @CurrentUser() user: SafeUser,
    @Body() dto: UpdateUserDto,
  ): Promise<SafeUser> {
    return this.usersService.update(user.id, dto);
  }

  @Patch('me/password')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Đổi password' })
  async updateMyPassword(
    @CurrentUser() user: SafeUser,
    @Body() dto: UpdatePasswordDto,
  ): Promise<void> {
    await this.usersService.updatePassword(user.id, dto.current_password, dto.new_password);
  }

  // ────────── Public profile lookup ──────────

  @Get(':username')
  @ApiOperation({ summary: 'Xem public profile' })
  async getPublicProfile(@Param('username') username: string) {
    const user = await this.usersService.findByUsername(username);
    if (!user) return null;
    // Chỉ trả public fields
    return {
      username: user.username,
      display_name: user.display_name,
      avatar_url: user.avatar_url,
      created_at: user.created_at,
    };
  }

  // ────────── Admin only ──────────

  @Get()
  @UseGuards(RolesGuard)
  @Roles(USER_ROLES.ADMIN)
  @ApiOperation({ summary: 'Admin: list users' })
  findAll(@Query() query: QueryUsersDto) {
    return this.usersService.findMany(query);
  }

  @Get(':id/by-id')
  @UseGuards(RolesGuard)
  @Roles(USER_ROLES.ADMIN, USER_ROLES.MODERATOR)
  @ApiOperation({ summary: 'Admin: get user by UUID' })
  findById(@Param('id', ParseUUIDPipe) id: string) {
    return this.usersService.findByIdOrThrow(id);
  }

  @Patch(':id/role')
  @UseGuards(RolesGuard)
  @Roles(USER_ROLES.ADMIN)
  @ApiOperation({ summary: 'Admin: đổi role' })
  updateRole(
    @Param('id', ParseUUIDPipe) id: string,
    @Body('role') role: UserRole,
  ) {
    return this.usersService.updateRole(id, role);
  }

  @Patch(':id/active')
  @UseGuards(RolesGuard)
  @Roles(USER_ROLES.ADMIN)
  @ApiOperation({ summary: 'Admin: enable/disable user' })
  setActive(
    @Param('id', ParseUUIDPipe) id: string,
    @Body('is_active') isActive: boolean,
  ) {
    return this.usersService.setActive(id, isActive);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @UseGuards(RolesGuard)
  @Roles(USER_ROLES.ADMIN)
  @ApiOperation({ summary: 'Admin: soft delete user' })
  remove(@Param('id', ParseUUIDPipe) id: string) {
    return this.usersService.softDelete(id);
  }
}