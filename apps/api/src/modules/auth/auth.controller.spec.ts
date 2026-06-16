import { Test } from '@nestjs/testing';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';

describe('AuthController', () => {
  let controller: AuthController;
  const authService = {
    register: jest.fn(),
    login: jest.fn(),
    refreshToken: jest.fn(),
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    const moduleRef = await Test.createTestingModule({
      controllers: [AuthController],
      providers: [{ provide: AuthService, useValue: authService }],
    }).compile();

    controller = moduleRef.get(AuthController);
  });

  it('registers a user through AuthService', async () => {
    const dto = {
      email: 'user@spechub.io',
      password: 'Password123',
      username: 'user',
    };
    const response = { user: { email: dto.email }, tokens: {} };
    authService.register.mockResolvedValue(response);

    await expect(controller.register(dto)).resolves.toBe(response);
    expect(authService.register).toHaveBeenCalledWith(dto);
  });

  it('logs in with the user attached by LocalStrategy', async () => {
    const user = { id: 'user-1', email: 'admin@spechub.io', role: 'admin' };
    const response = { user, tokens: {} };
    authService.login.mockResolvedValue(response);

    await expect(controller.login({ user } as any)).resolves.toBe(response);
    expect(authService.login).toHaveBeenCalledWith(user);
  });

  it('refreshes tokens through AuthService', async () => {
    const tokens = {
      access_token: 'access-token',
      refresh_token: 'refresh-token',
      expires_in: 604800,
    };
    authService.refreshToken.mockResolvedValue(tokens);

    await expect(
      controller.refresh({ refresh_token: 'old-refresh-token' }),
    ).resolves.toBe(tokens);
    expect(authService.refreshToken).toHaveBeenCalledWith('old-refresh-token');
  });

  it('returns the current authenticated user', async () => {
    const user = { id: 'user-1', email: 'admin@spechub.io', role: 'admin' };

    await expect(controller.getMe(user)).resolves.toBe(user);
  });

  it('logs out without server-side state for now', async () => {
    await expect(controller.logout()).resolves.toBeNull();
  });
});
