import { Injectable, UnauthorizedException, Logger } from "@nestjs/common";
import { JwtService } from "@nestjs/jwt";
import { ConfigService } from "@nestjs/config";
import { randomUUID } from "node:crypto";
import { UsersService } from "../users/users.service";
import { RedisService } from "../../redis/redis.service";
import { RegisterDto } from "./dto/register.dto";
import {
  JwtPayload,
  RefreshTokenPayload,
} from "./interfaces/jwt-payload.interface";

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    private readonly usersService: UsersService,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
    private readonly redisService: RedisService,
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
    });

    // Sign tokens ngay để user khỏi phải login lại
    const tokens = await this.createSessionTokens({
      sub: user.id,
      email: user.email,
      role: user.role,
    });

    this.logger.log(`Đăng ký thành công: ${user.email}`);

    return {
      user: {
        id: user.id,
        email: user.email,
        username: user.username ?? undefined,
        display_name: user.display_name ?? undefined,
        role: user.role,
      },
      tokens,
    };
  }

  /**
   * Login - được gọi sau khi LocalStrategy validate thành công
   */
  async login(user: {
    id: string;
    email: string;
    role: string;
    username?: string | null;
    display_name?: string | null;
  }) {
    const tokens = await this.createSessionTokens({
      sub: user.id,
      email: user.email,
      role: user.role,
    });

    // Update last login
    await this.usersService.updateLastLogin(user.id);

    this.logger.log(`Login thành công: ${user.email}`);

    return {
      user: {
        id: user.id,
        email: user.email,
        username: user.username ?? undefined,
        display_name: user.display_name ?? undefined,
        role: user.role,
      },
      tokens,
    };
  }

  /**
   * Refresh access token bằng refresh token
   */
  async refreshToken(refreshToken: string) {
    try {
      const payload = await this.jwtService.verifyAsync<RefreshTokenPayload>(
        refreshToken,
        {
          secret: this.configService.get<string>("JWT_SECRET"),
        },
      );

      if (payload.type !== "refresh") {
        throw new UnauthorizedException("Token không hợp lệ");
      }

      if (!payload.session_id) {
        throw new UnauthorizedException("Phiên đăng nhập không hợp lệ");
      }

      const sessionUserId = await this.redisService.get(
        this.sessionKey(payload.session_id),
      );
      if (sessionUserId !== payload.sub) {
        throw new UnauthorizedException(
          "Phiên đăng nhập đã hết hạn hoặc bị thu hồi",
        );
      }

      // Load user
      const user = await this.usersService.findById(payload.sub);
      if (!user || !user.is_active) {
        throw new UnauthorizedException("User không hợp lệ");
      }

      // Sign token mới trong cùng session và gia hạn TTL của session.
      const tokens = await this.signTokens(
        {
          sub: user.id,
          email: user.email,
          role: user.role,
          session_id: payload.session_id,
        },
        payload.session_id,
      );

      await this.redisService.set(
        this.sessionKey(payload.session_id),
        user.id,
        this.refreshTokenTtlSeconds(),
      );

      return tokens;
    } catch {
      throw new UnauthorizedException(
        "Refresh token không hợp lệ hoặc đã hết hạn",
      );
    }
  }

  async logout(sessionId: string): Promise<void> {
    await this.redisService.del(this.sessionKey(sessionId));
  }

  private async createSessionTokens(payload: Omit<JwtPayload, "session_id">) {
    const sessionId = randomUUID();
    const tokens = await this.signTokens(
      { ...payload, session_id: sessionId },
      sessionId,
    );

    await this.redisService.set(
      this.sessionKey(sessionId),
      payload.sub,
      this.refreshTokenTtlSeconds(),
    );

    return tokens;
  }

  /**
   * Sign access + refresh tokens
   */
  private async signTokens(payload: JwtPayload, sessionId: string) {
    const accessTokenExpiresIn = this.configService.get<string>(
      "JWT_EXPIRES_IN",
      "15m",
    );
    const refreshTokenExpiresIn = this.configService.get<string>(
      "JWT_REFRESH_EXPIRES_IN",
      "30d",
    );

    const [access_token, refresh_token] = await Promise.all([
      this.jwtService.signAsync(payload, { expiresIn: accessTokenExpiresIn }),
      this.jwtService.signAsync(
        { sub: payload.sub, type: "refresh", session_id: sessionId },
        { expiresIn: refreshTokenExpiresIn },
      ),
    ]);

    return {
      access_token,
      refresh_token,
      expires_in: this.parseExpiresIn(accessTokenExpiresIn, 900),
    };
  }

  private sessionKey(sessionId: string): string {
    return `auth:session:${sessionId}`;
  }

  private refreshTokenTtlSeconds(): number {
    return this.parseExpiresIn(
      this.configService.get<string>("JWT_REFRESH_EXPIRES_IN", "30d"),
      2_592_000,
    );
  }

  /**
   * Convert "7d" → 604800 (seconds)
   */
  private parseExpiresIn(value: string, fallbackSeconds: number): number {
    const match = value.match(/^(\d+)([smhd])$/);
    if (!match) return fallbackSeconds;

    const num = parseInt(match[1], 10);
    const unit = match[2];

    switch (unit) {
      case "s":
        return num;
      case "m":
        return num * 60;
      case "h":
        return num * 3600;
      case "d":
        return num * 86400;
      default:
        return fallbackSeconds;
    }
  }
}
