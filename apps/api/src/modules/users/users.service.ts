import {
  Injectable,
  ConflictException,
  NotFoundException,
  UnauthorizedException,
  Logger,
} from '@nestjs/common';
import * as bcrypt from 'bcryptjs';
import { Prisma } from '@spechub/database';
import { PrismaService } from '../../prisma/prisma.service';
import { BCRYPT_ROUNDS, USER_ROLES, type UserRole } from '../../common/constants';
import type { SafeUser, UserWithPassword } from './interfaces/safe-user.interface';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { QueryUsersDto } from './dto/query-users.dto';

@Injectable()
export class UsersService {
  private readonly logger = new Logger(UsersService.name);

  /**
   * Select chuẩn — exclude password_hash.
   * Dùng cho mọi query trả về SafeUser.
   */
  private readonly safeSelect = {
    id: true,
    email: true,
    email_verified_at: true,
    username: true,
    display_name: true,
    avatar_url: true,
    role: true,
    is_active: true,
    last_login_at: true,
    created_at: true,
    updated_at: true,
    deleted_at: true,
  } satisfies Prisma.usersSelect;

  constructor(private readonly prisma: PrismaService) {}

  // ═══════════════════════════════════════════════════════════
  // PHẦN A — Methods dùng bởi AuthModule (BẮT BUỘC)
  // ═══════════════════════════════════════════════════════════

  /**
   * Tìm user theo email — INCLUDE password_hash.
   * ⚠️ CHỈ dùng cho login flow trong AuthService.
   * Không expose user object này ra response.
   */
  async findByEmailWithPassword(email: string): Promise<UserWithPassword | null> {
    return this.prisma.users.findFirst({
      where: {
        email: email.toLowerCase().trim(),
        deleted_at: null,
      },
    });
  }

  /**
   * Tìm user theo email — EXCLUDE password_hash.
   * Dùng cho mọi query trả về data.
   */
  async findByEmail(email: string): Promise<SafeUser | null> {
    return this.prisma.users.findFirst({
      where: {
        email: email.toLowerCase().trim(),
        deleted_at: null,
      },
      select: this.safeSelect,
    });
  }

  /**
   * Tìm user theo ID — exclude password_hash.
   * Dùng bởi JwtStrategy.validate() và endpoint /auth/me.
   */
  async findById(id: string): Promise<SafeUser | null> {
    return this.prisma.users.findFirst({
      where: { id, deleted_at: null },
      select: this.safeSelect,
    });
  }

  /**
   * Throw nếu không tìm thấy. Tiện cho controller (không phải check null).
   */
  async findByIdOrThrow(id: string): Promise<SafeUser> {
    const user = await this.findById(id);
    if (!user) {
      throw new NotFoundException(`User ${id} not found`);
    }
    return user;
  }

  /**
   * Tìm theo username — public profile lookup.
   */
  async findByUsername(username: string): Promise<SafeUser | null> {
    return this.prisma.users.findFirst({
      where: { username: username.toLowerCase(), deleted_at: null },
      select: this.safeSelect,
    });
  }

  /**
   * Tạo user mới. Hash password với bcrypt.
   * Throw ConflictException nếu email/username đã tồn tại.
   *
   * Được gọi bởi AuthService.register().
   */
  async create(dto: CreateUserDto, role: UserRole = USER_ROLES.READER): Promise<SafeUser> {
    const email = dto.email.toLowerCase().trim();
    const username = dto.username?.toLowerCase().trim();

    // Check duplicate trước khi hash → tiết kiệm CPU
    const existing = await this.prisma.users.findFirst({
      where: {
        OR: [{ email }, ...(username ? [{ username }] : [])],
        deleted_at: null,
      },
      select: { id: true, email: true, username: true },
    });

    if (existing) {
      if (existing.email === email) {
        throw new ConflictException('Email đã được sử dụng');
      }
      throw new ConflictException('Username đã được sử dụng');
    }

    const password_hash = await bcrypt.hash(dto.password, BCRYPT_ROUNDS);

    try {
      const user = await this.prisma.users.create({
        data: {
          email,
          username,
          password_hash,
          display_name: dto.display_name,
          role,
        },
        select: this.safeSelect,
      });

      this.logger.log(`User created: ${user.id} (${email})`);
      return user;
    } catch (error) {
      // Race condition: 2 requests cùng register cùng email
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2002'
      ) {
        throw new ConflictException('Email hoặc username đã tồn tại');
      }
      throw error;
    }
  }

  /**
   * Verify password — return SafeUser nếu match, null nếu không.
   * Được gọi bởi LocalStrategy hoặc AuthService.login().
   *
   * KHÔNG throw UnauthorizedException ở đây — để caller quyết định
   * message gì (tránh user enumeration: "email không tồn tại" vs "sai password").
   */
  async validatePassword(email: string, password: string): Promise<SafeUser | null> {
    const user = await this.findByEmailWithPassword(email);

    if (!user || !user.password_hash) {
      // Vẫn chạy bcrypt.compare với dummy hash để chống timing attack
      // (attacker đoán email có tồn tại không qua response time)
      await bcrypt.compare(password, '$2a$10$invalidinvalidinvalidinvalidinvalidinvalidinvalidinvali');
      return null;
    }

    if (!user.is_active) {
      return null;
    }

    const isValid = await bcrypt.compare(password, user.password_hash);
    if (!isValid) return null;

    // Strip password_hash trước khi return
    const { password_hash: _password_hash, ...safe } = user;
    return safe;
  }

  /**
   * Update timestamp đăng nhập cuối.
   * Gọi sau khi login thành công. Fire-and-forget OK (không await ở caller).
   */
  async updateLastLogin(userId: string): Promise<void> {
    await this.prisma.users.update({
      where: { id: userId },
      data: { last_login_at: new Date() },
    });
  }

  // ═══════════════════════════════════════════════════════════
  // PHẦN B — Methods mở rộng (CRUD, profile, admin)
  // ═══════════════════════════════════════════════════════════

  /**
   * Update profile (display_name, avatar_url).
   * User tự update mình.
   */
  async update(id: string, dto: UpdateUserDto): Promise<SafeUser> {
    await this.findByIdOrThrow(id); // throw 404 nếu không tồn tại

    return this.prisma.users.update({
      where: { id },
      data: dto,
      select: this.safeSelect,
    });
  }

  /**
   * Đổi password. Verify current password trước.
   */
  async updatePassword(
    id: string,
    currentPassword: string,
    newPassword: string,
  ): Promise<void> {
    const user = await this.prisma.users.findUnique({ where: { id } });
    if (!user || !user.password_hash) {
      throw new NotFoundException('User not found');
    }

    const isValid = await bcrypt.compare(currentPassword, user.password_hash);
    if (!isValid) {
      throw new UnauthorizedException('Current password không đúng');
    }

    const new_hash = await bcrypt.hash(newPassword, BCRYPT_ROUNDS);

    await this.prisma.users.update({
      where: { id },
      data: { password_hash: new_hash },
    });

    this.logger.log(`Password changed: ${id}`);
  }

  /**
   * Admin only — list users với pagination & filter.
   */
  async findMany(query: QueryUsersDto) {
    const { page = 1, pageSize = 20, q, role, is_active } = query;
    const skip = (page - 1) * pageSize;

    const where: Prisma.usersWhereInput = {
      deleted_at: null,
      ...(role && { role }),
      ...(is_active !== undefined && { is_active }),
      ...(q && {
        OR: [
          { email: { contains: q, mode: 'insensitive' } },
          { username: { contains: q, mode: 'insensitive' } },
          { display_name: { contains: q, mode: 'insensitive' } },
        ],
      }),
    };

    const [items, total] = await this.prisma.$transaction([
      this.prisma.users.findMany({
        where,
        select: this.safeSelect,
        skip,
        take: pageSize,
        orderBy: { created_at: 'desc' },
      }),
      this.prisma.users.count({ where }),
    ]);

    return {
      items,
      meta: {
        page,
        pageSize,
        total,
        total_pages: Math.ceil(total / pageSize),
      },
    };
  }

  /**
   * Admin only — đổi role.
   */
  async updateRole(id: string, role: UserRole): Promise<SafeUser> {
    const user = await this.findByIdOrThrow(id);
    await this.ensureActiveAdminIsNotLast(user, role !== USER_ROLES.ADMIN);
    return this.prisma.users.update({
      where: { id },
      data: { role },
      select: this.safeSelect,
    });
  }

  /**
   * Admin only — disable account (giữ data, chặn login).
   */
  async setActive(id: string, isActive: boolean): Promise<SafeUser> {
    const user = await this.findByIdOrThrow(id);
    await this.ensureActiveAdminIsNotLast(user, !isActive);
    return this.prisma.users.update({
      where: { id },
      data: { is_active: isActive },
      select: this.safeSelect,
    });
  }

  /**
   * Soft delete — set deleted_at = now().
   * Không xóa cứng (giữ FK history cho comments, wiki_revisions...).
   */
  async softDelete(id: string): Promise<void> {
    const user = await this.findByIdOrThrow(id);
    await this.ensureActiveAdminIsNotLast(user, true);
    await this.prisma.users.update({
      where: { id },
      data: { deleted_at: new Date(), is_active: false },
    });
    this.logger.log(`User soft-deleted: ${id}`);
  }

  /**
   * Mark email verified — gọi từ EmailVerifyController sau khi verify token.
   */
  async markEmailVerified(id: string): Promise<void> {
    await this.prisma.users.update({
      where: { id },
      data: { email_verified_at: new Date() },
    });
  }

  private async ensureActiveAdminIsNotLast(
    user: SafeUser,
    removesAdminAccess: boolean,
  ) {
    if (
      user.role !== USER_ROLES.ADMIN ||
      !user.is_active ||
      !removesAdminAccess
    ) {
      return;
    }

    const activeAdminCount = await this.prisma.users.count({
      where: {
        role: USER_ROLES.ADMIN,
        is_active: true,
        deleted_at: null,
      },
    });

    if (activeAdminCount <= 1) {
      throw new ConflictException("Không thể vô hiệu hóa admin đang hoạt động cuối cùng");
    }
  }
}
