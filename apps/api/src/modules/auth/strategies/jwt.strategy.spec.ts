import { UnauthorizedException } from "@nestjs/common";
import { JwtStrategy } from "./jwt.strategy";

describe("JwtStrategy", () => {
  const user = {
    id: "user-1",
    email: "reader@spechub.io",
    username: "reader",
    display_name: "SpecHub Reader",
    role: "reader",
    is_active: true,
  };
  const configService = {
    get: jest.fn(() => "test-jwt-secret"),
  };
  const usersService = {
    findById: jest.fn(),
  };
  const redisService = {
    get: jest.fn(),
  };

  let strategy: JwtStrategy;

  beforeEach(() => {
    jest.clearAllMocks();
    strategy = new JwtStrategy(
      configService as any,
      usersService as any,
      redisService as any,
    );
  });

  it("returns the current user when the Redis session is active", async () => {
    redisService.get.mockResolvedValue(user.id);
    usersService.findById.mockResolvedValue(user);

    await expect(
      strategy.validate({
        sub: user.id,
        email: user.email,
        role: user.role,
        session_id: "session-1",
      }),
    ).resolves.toEqual({
      id: user.id,
      email: user.email,
      role: user.role,
      username: user.username,
      display_name: user.display_name,
      session_id: "session-1",
    });
  });

  it("rejects an access token after logout revoked its session", async () => {
    redisService.get.mockResolvedValue(null);

    await expect(
      strategy.validate({
        sub: user.id,
        email: user.email,
        role: user.role,
        session_id: "revoked-session",
      }),
    ).rejects.toBeInstanceOf(UnauthorizedException);
    expect(usersService.findById).not.toHaveBeenCalled();
  });

  it("rejects legacy access tokens without a session ID", async () => {
    await expect(
      strategy.validate({
        sub: user.id,
        email: user.email,
        role: user.role,
      } as any),
    ).rejects.toBeInstanceOf(UnauthorizedException);
    expect(redisService.get).not.toHaveBeenCalled();
  });
});
