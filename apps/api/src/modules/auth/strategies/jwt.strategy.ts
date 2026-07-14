import { Injectable, UnauthorizedException } from "@nestjs/common";
import { PassportStrategy } from "@nestjs/passport";
import { ExtractJwt, Strategy } from "passport-jwt";
import { ConfigService } from "@nestjs/config";
import { UsersService } from "../../users/users.service";
import { RedisService } from "../../../redis/redis.service";
import { JwtPayload } from "../interfaces/jwt-payload.interface";
import { AuthUser } from "../../../common/decorators/current-user.decorator";

/**
 * JwtStrategy - Validate JWT token
 *
 * Hoạt động:
 * 1. Extract token từ header "Authorization: Bearer <token>"
 * 2. Verify signature với JWT_SECRET
 * 3. Check token chưa expired
 * 4. Decode payload → call validate()
 * 5. validate() return user → attach vào request.user
 *
 * Setup: được register trong AuthModule, dùng bởi JwtAuthGuard
 */
@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy, "jwt") {
  constructor(
    private readonly configService: ConfigService,
    private readonly usersService: UsersService,
    private readonly redisService: RedisService,
  ) {
    const secret = configService.get<string>("JWT_SECRET");
    if (!secret) {
      throw new Error("JWT_SECRET không được config");
    }

    super({
      // Lấy token từ header Authorization: Bearer ...
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      // KHÔNG ignore expiration → token hết hạn sẽ throw
      ignoreExpiration: false,
      // Secret để verify signature
      secretOrKey: secret,
    });
  }

  /**
   * Called sau khi JWT đã verify signature + expiration.
   * payload chính là object đã sign lúc login.
   *
   * Return value sẽ được attach vào request.user
   */
  async validate(payload: JwtPayload): Promise<AuthUser> {
    if (!payload.session_id) {
      throw new UnauthorizedException("Phiên đăng nhập không hợp lệ");
    }

    const sessionUserId = await this.redisService.get(
      `auth:session:${payload.session_id}`,
    );
    if (sessionUserId !== payload.sub) {
      throw new UnauthorizedException(
        "Phiên đăng nhập đã hết hạn hoặc bị thu hồi",
      );
    }

    // Load user từ DB để chắc chắn user còn tồn tại + active
    const user = await this.usersService.findById(payload.sub);

    if (!user) {
      throw new UnauthorizedException("Token không hợp lệ");
    }

    if (!user.is_active) {
      throw new UnauthorizedException("Tài khoản đã bị vô hiệu hóa");
    }

    // Return shape match với AuthUser interface
    return {
      id: user.id,
      email: user.email,
      role: user.role,
      username: user.username ?? undefined,
      display_name: user.display_name ?? undefined,
      session_id: payload.session_id,
    };
  }
}
