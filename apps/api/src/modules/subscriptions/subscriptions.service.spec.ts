import { NotFoundException } from "@nestjs/common";
import { SubscriptionsService } from "./subscriptions.service";

describe("SubscriptionsService", () => {
  const freePlan = {
    id: "plan-free",
    code: "free",
    name: "Free",
    features: { price_alerts: false },
    is_active: true,
  };

  const prisma = {
    $transaction: jest.fn(),
    subscription_plans: {
      findMany: jest.fn(),
      findUnique: jest.fn(),
      findFirst: jest.fn(),
    },
    subscriptions: {
      findUnique: jest.fn(),
      upsert: jest.fn(),
    },
    billing_audit_logs: {
      create: jest.fn(),
    },
  };
  const configService = {
    get: jest.fn(),
  };

  let service: SubscriptionsService;

  beforeEach(() => {
    jest.clearAllMocks();
    prisma.$transaction.mockImplementation((callback) => callback(prisma));
    service = new SubscriptionsService(prisma as any, configService as any);
  });

  it("returns the free plan when the user has no subscription", async () => {
    prisma.subscriptions.findUnique.mockResolvedValue(null);
    prisma.subscription_plans.findUnique.mockResolvedValue(freePlan);

    await expect(service.getMe("user-1")).resolves.toEqual({
      data: {
        subscription: null,
        plan: freePlan,
        features: freePlan.features,
      },
    });
  });

  it("rejects checkout creation for inactive or missing plans", async () => {
    prisma.subscription_plans.findUnique.mockResolvedValue({
      ...freePlan,
      is_active: false,
    });

    await expect(
      service.createCheckout("user-1", {
        plan_code: "free",
        billing_cycle: "monthly",
      }),
    ).rejects.toBeInstanceOf(NotFoundException);
  });

  it("does not allow a manual entitlement through public checkout", async () => {
    prisma.subscription_plans.findUnique.mockResolvedValue({
      ...freePlan,
      code: "pro",
      is_active: true,
    });

    await expect(
      service.createCheckout("user-1", {
        plan_code: "pro",
        billing_cycle: "manual",
      }),
    ).rejects.toThrow("Manual billing");
  });

  it("upserts user subscriptions after validating the plan", async () => {
    const subscription = {
      id: "subscription-1",
      user_id: "user-1",
      plan_id: "plan-pro",
      status: "active",
      billing_cycle: "monthly",
    };

    prisma.subscription_plans.findFirst.mockResolvedValue({ id: "plan-pro" });
    prisma.subscriptions.upsert.mockResolvedValue(subscription);
    prisma.billing_audit_logs.create.mockResolvedValue({ id: "audit-1" });

    await expect(
      service.assignUserSubscription("user-1", {
        plan_id: "plan-pro",
        status: "active",
        billing_cycle: "monthly",
      }),
    ).resolves.toBe(subscription);

    expect(prisma.subscriptions.upsert).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { user_id: "user-1" },
        update: expect.objectContaining({
          plan_id: "plan-pro",
          billing_cycle: "monthly",
        }),
        create: expect.objectContaining({
          user_id: "user-1",
          plan_id: "plan-pro",
        }),
      }),
    );
  });
});
