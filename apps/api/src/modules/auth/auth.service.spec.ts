import { UnauthorizedException } from '@nestjs/common';
import { AuthService } from './auth.service';

describe('AuthService', () => {
  const user = {
    id: 'user-1',
    email: 'admin@spechub.io',
    username: 'admin',
    display_name: 'SpecHub Admin',
    role: 'admin',
    is_active: true,
  };

  const usersService = {
    create: jest.fn(),
    updateLastLogin: jest.fn(),
    findById: jest.fn(),
  };

  const jwtService = {
    signAsync: jest.fn(),
    verifyAsync: jest.fn(),
  };

  const configService = {
    get: jest.fn((key: string, defaultValue?: string) => {
      const values: Record<string, string> = {
        JWT_SECRET: 'test-secret',
        JWT_EXPIRES_IN: '15m',
        JWT_REFRESH_EXPIRES_IN: '30d',
      };

      return values[key] ?? defaultValue;
    }),
  };

  let service: AuthService;

  beforeEach(() => {
    jest.clearAllMocks();
    jwtService.signAsync.mockImplementation(async (payload: { type?: string }) =>
      payload.type === 'refresh' ? 'refresh-token' : 'access-token',
    );
    service = new AuthService(
      usersService as any,
      jwtService as any,
      configService as any,
    );
  });

  it('registers a user and returns tokens', async () => {
    usersService.create.mockResolvedValue(user);

    await expect(
      service.register({
        email: user.email,
        password: 'Password123',
        username: user.username,
        display_name: user.display_name,
      }),
    ).resolves.toEqual({
      user: {
        id: user.id,
        email: user.email,
        username: user.username,
        display_name: user.display_name,
        role: user.role,
      },
      tokens: {
        access_token: 'access-token',
        refresh_token: 'refresh-token',
        expires_in: 900,
      },
    });

    expect(usersService.create).toHaveBeenCalledWith({
      email: user.email,
      password: 'Password123',
      username: user.username,
      display_name: user.display_name,
    });
  });

  it('logs in and updates last login', async () => {
    usersService.updateLastLogin.mockResolvedValue(undefined);

    const response = await service.login(user);

    expect(response.tokens.access_token).toBe('access-token');
    expect(response.tokens.refresh_token).toBe('refresh-token');
    expect(usersService.updateLastLogin).toHaveBeenCalledWith(user.id);
  });

  it('refreshes access and refresh tokens for an active user', async () => {
    jwtService.verifyAsync.mockResolvedValue({ sub: user.id, type: 'refresh' });
    usersService.findById.mockResolvedValue(user);

    await expect(service.refreshToken('valid-refresh-token')).resolves.toEqual({
      access_token: 'access-token',
      refresh_token: 'refresh-token',
      expires_in: 900,
    });

    expect(jwtService.verifyAsync).toHaveBeenCalledWith('valid-refresh-token', {
      secret: 'test-secret',
    });
  });

  it('rejects non-refresh tokens in the refresh flow', async () => {
    jwtService.verifyAsync.mockResolvedValue({ sub: user.id, type: 'access' });

    await expect(service.refreshToken('access-token')).rejects.toBeInstanceOf(
      UnauthorizedException,
    );
  });

  it('rejects refresh tokens for inactive users', async () => {
    jwtService.verifyAsync.mockResolvedValue({ sub: user.id, type: 'refresh' });
    usersService.findById.mockResolvedValue({ ...user, is_active: false });

    await expect(service.refreshToken('valid-refresh-token')).rejects.toBeInstanceOf(
      UnauthorizedException,
    );
  });
});
