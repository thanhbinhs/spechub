import { ForbiddenException, HttpException } from "@nestjs/common";
import { ApiKeysService } from "./api-keys.service";

describe("ApiKeysService", () => {
  const transaction = {
    api_key_usage: {
      upsert: jest.fn(),
      aggregate: jest.fn(),
    },
    api_keys: {
      update: jest.fn(),
    },
  };
  const prisma = {
    subscriptions: {
      findUnique: jest.fn(),
    },
    api_keys: {
      create: jest.fn(),
      findUnique: jest.fn(),
      findFirst: jest.fn(),
      findMany: jest.fn(),
      update: jest.fn(),
    },
    $transaction: jest.fn(),
  };
  let service: ApiKeysService;

  beforeEach(() => {
    jest.clearAllMocks();
    prisma.$transaction.mockImplementation(
      async (callback: (tx: typeof transaction) => unknown) => callback(transaction),
    );
    service = new ApiKeysService(prisma as any);
  });

  it("only creates a secret once for a subscription with API access", async () => {
    prisma.subscriptions.findUnique.mockResolvedValue({
      plan: { features: { api_access: true } },
    });
    prisma.api_keys.create.mockImplementation(async ({ data }: any) => ({
      id: "key-1",
      name: data.name,
      key_prefix: data.key_prefix,
      scopes: data.scopes,
      rate_limit_per_minute: data.rate_limit_per_minute,
      monthly_quota: data.monthly_quota,
      is_active: true,
      last_used_at: null,
      expires_at: null,
      revoked_at: null,
      created_at: new Date(),
      updated_at: new Date(),
    }));

    const result = await service.create("user-1", {
      name: "Production sync",
      rate_limit_per_minute: 120,
    });

    expect(result.data.key).toMatch(/^sph_b2b_/);
    expect(result.data.key_prefix).toBe(result.data.key.slice(0, 20));
    expect(prisma.api_keys.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          user_id: "user-1",
          key_hash: expect.stringMatching(/^[a-f0-9]{64}$/),
          scopes: ["catalog:read"],
        }),
      }),
    );
  });

  it("does not issue a key when the plan lacks API access", async () => {
    prisma.subscriptions.findUnique.mockResolvedValue({
      plan: { features: { api_access: false } },
    });

    await expect(
      service.create("user-1", { name: "No entitlement" }),
    ).rejects.toBeInstanceOf(ForbiddenException);
    expect(prisma.api_keys.create).not.toHaveBeenCalled();
  });

  it("authorizes a scoped active key and records minute usage", async () => {
    prisma.api_keys.findUnique.mockResolvedValue({
      id: "key-1",
      user_id: "user-1",
      key_hash: "a".repeat(64),
      scopes: ["catalog:read"],
      rate_limit_per_minute: 60,
      monthly_quota: null,
      is_active: true,
      expires_at: null,
      revoked_at: null,
      user: {
        is_active: true,
        subscription: { plan: { features: { api_access: true } } },
      },
    });
    transaction.api_key_usage.upsert.mockResolvedValue({ request_count: 1 });
    transaction.api_keys.update.mockResolvedValue({ id: "key-1" });

    await expect(
      service.authorize(`sph_b2b_${"a".repeat(43)}`, "catalog:read"),
    ).resolves.toMatchObject({ id: "key-1", user_id: "user-1" });
    expect(transaction.api_key_usage.upsert).toHaveBeenCalledWith(
      expect.objectContaining({
        create: expect.objectContaining({ api_key_id: "key-1", request_count: 1 }),
        update: { request_count: { increment: 1 } },
      }),
    );
  });

  it("returns 429 when the minute rate limit is exceeded", async () => {
    prisma.api_keys.findUnique.mockResolvedValue({
      id: "key-1",
      user_id: "user-1",
      key_hash: "a".repeat(64),
      scopes: ["catalog:read"],
      rate_limit_per_minute: 1,
      monthly_quota: null,
      is_active: true,
      expires_at: null,
      revoked_at: null,
      user: {
        is_active: true,
        subscription: { plan: { features: { api_access: true } } },
      },
    });
    transaction.api_key_usage.upsert.mockResolvedValue({ request_count: 2 });

    await expect(
      service.authorize(`sph_b2b_${"b".repeat(43)}`, "catalog:read"),
    ).rejects.toBeInstanceOf(HttpException);
    await expect(
      service.authorize(`sph_b2b_${"b".repeat(43)}`, "catalog:read"),
    ).rejects.toMatchObject({ status: 429 });
  });
});
