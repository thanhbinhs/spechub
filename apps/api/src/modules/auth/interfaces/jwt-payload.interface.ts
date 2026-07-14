/**
 * JwtPayload - Data được encode vào JWT token
 *
 * Khi sign token:
 *   jwtService.sign({ sub: user.id, email: user.email, role: user.role })
 *
 * Khi decode token (JwtStrategy.validate):
 *   { sub, email, role, iat, exp } được trả về
 */
export interface JwtPayload {
  sub: string; // user.id (subject - chuẩn JWT)
  email: string; // user.email
  role: string; // user.role
  session_id: string; // Redis-backed session used for server-side revocation
  iat?: number; // issued at (tự động bởi jwt)
  exp?: number; // expires at (tự động bởi jwt)
}

/**
 * RefreshTokenPayload - Payload riêng cho refresh token
 * Chỉ chứa sub để giảm risk nếu bị leak
 */
export interface RefreshTokenPayload {
  sub: string;
  type: "refresh";
  session_id: string;
  iat?: number;
  exp?: number;
}
