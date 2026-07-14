import { ForbiddenException } from "@nestjs/common";
import { AlertsService } from "./alerts.service";

describe("AlertsService", () => {
  const prisma = {
    $transaction: jest.fn(),
    subscriptions: {
      findUnique: jest.fn(),
    },
    subscription_plans: {
      findUnique: jest.fn(),
    },
    price_alerts: {
      findMany: jest.fn(),
      findFirst: jest.fn(),
      findUnique: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
    },
    device_variants: {
      findFirst: jest.fn(),
    },
  };
  const transaction = {
    price_alerts: {
      updateMany: jest.fn(),
    },
    notifications: {
      create: jest.fn(),
    },
  };

  let service: AlertsService;

  beforeEach(() => {
    jest.clearAllMocks();
    prisma.$transaction = jest.fn((callback) => callback(transaction));
    service = new AlertsService(prisma as any);
  });

  it("blocks price alert creation when the effective plan lacks the feature", async () => {
    prisma.subscriptions.findUnique.mockResolvedValue(null);
    prisma.subscription_plans.findUnique.mockResolvedValue({
      features: { price_alerts: false },
    });

    await expect(
      service.create("user-1", {
        device_variant_id: "variant-1",
        target_price: 999,
        currency_code: "USD",
        region_code: "US",
      }),
    ).rejects.toBeInstanceOf(ForbiddenException);

    expect(prisma.price_alerts.create).not.toHaveBeenCalled();
  });

  it("creates price alerts for users with the price alert feature", async () => {
    const alert = {
      id: "alert-1",
      user_id: "user-1",
      device_variant_id: "variant-1",
      target_price: 999,
      currency_code: "USD",
      region_code: "US",
    };

    prisma.subscriptions.findUnique.mockResolvedValue({
      plan: { features: { price_alerts: true } },
    });
    prisma.device_variants.findFirst.mockResolvedValue({ id: "variant-1" });
    prisma.price_alerts.findFirst.mockResolvedValue(null);
    prisma.price_alerts.create.mockResolvedValue(alert);

    await expect(
      service.create("user-1", {
        device_variant_id: "variant-1",
        target_price: 999,
        currency_code: "usd",
        region_code: "us",
      }),
    ).resolves.toBe(alert);

    expect(prisma.price_alerts.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          user_id: "user-1",
          currency_code: "USD",
          region_code: "US",
        }),
      }),
    );
  });

  it("reactivates the latest matching alert instead of creating a duplicate", async () => {
    const reactivatedAlert = {
      id: "alert-1",
      user_id: "user-1",
      device_variant_id: "variant-1",
      target_price: 899,
      currency_code: "USD",
      region_code: "US",
      is_active: true,
      triggered_at: null,
    };

    prisma.subscriptions.findUnique.mockResolvedValue({
      plan: { features: { price_alerts: true } },
    });
    prisma.device_variants.findFirst.mockResolvedValue({ id: "variant-1" });
    prisma.price_alerts.findFirst.mockResolvedValue({ id: "alert-1" });
    prisma.price_alerts.update.mockResolvedValue(reactivatedAlert);

    await expect(
      service.create("user-1", {
        device_variant_id: "variant-1",
        target_price: 899,
        currency_code: "usd",
        region_code: "us",
      }),
    ).resolves.toBe(reactivatedAlert);

    expect(prisma.price_alerts.create).not.toHaveBeenCalled();
    expect(prisma.price_alerts.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: "alert-1" },
        data: {
          target_price: 899,
          is_active: true,
          triggered_at: null,
        },
      }),
    );
  });

  it("clears the trigger timestamp when an alert is reactivated", async () => {
    prisma.price_alerts.findUnique.mockResolvedValue({
      id: "alert-1",
      user_id: "user-1",
    });
    prisma.price_alerts.update.mockResolvedValue({
      id: "alert-1",
      is_active: true,
      triggered_at: null,
    });

    await service.update("user-1", "reader", "alert-1", {
      is_active: true,
    });

    expect(prisma.price_alerts.update).toHaveBeenCalledWith(
      expect.objectContaining({
        data: {
          is_active: true,
          triggered_at: null,
        },
      }),
    );
  });

  it("triggers matching active alerts and creates notifications atomically", async () => {
    prisma.price_alerts.findMany.mockResolvedValue([
      {
        id: "alert-1",
        user_id: "user-1",
        user: { email: "reader@example.com" },
        target_price: 1000,
        currency_code: "USD",
        region_code: "US",
        device_variant: {
          id: "variant-1",
          variant_name: "256GB",
          device_model: {
            name: "Spec Phone Pro",
            slug: "spec-phone-pro",
          },
          affiliate_links: [
            {
              id: "link-1",
              current_price: 949,
              currency_code: "USD",
              region_code: "US",
              product_url: "https://retailer.example/product",
              partner: {
                name: "Retailer",
                slug: "retailer",
              },
            },
          ],
        },
      },
    ]);
    transaction.price_alerts.updateMany.mockResolvedValue({ count: 1 });
    transaction.notifications.create.mockResolvedValue({
      id: "notification-1",
    });

    await expect(service.checkActiveAlerts()).resolves.toEqual({
      data: {
        checked: 1,
        triggered: 1,
      },
    });

    expect(transaction.price_alerts.updateMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({ id: "alert-1", triggered_at: null }),
        data: expect.objectContaining({
          triggered_at: expect.any(Date),
          is_active: false,
        }),
      }),
    );
    expect(transaction.notifications.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          user_id: "user-1",
          type: "price_alert_triggered",
          data: expect.objectContaining({
            price_alert_id: "alert-1",
            affiliate_link_id: "link-1",
          }),
          deliveries: {
            create: {
              channel: "email",
              recipient: "reader@example.com",
            },
          },
        }),
      }),
    );
  });

  it("does not notify twice when another worker already claimed the alert", async () => {
    prisma.price_alerts.findMany.mockResolvedValue([
      {
        id: "alert-1",
        user_id: "user-1",
        user: { email: "reader@example.com" },
        target_price: 1000,
        currency_code: "USD",
        region_code: "US",
        device_variant: {
          id: "variant-1",
          variant_name: "256GB",
          device_model: { name: "Spec Phone Pro", slug: "spec-phone-pro" },
          affiliate_links: [
            {
              id: "link-1",
              current_price: 949,
              currency_code: "USD",
              region_code: "US",
              product_url: "https://retailer.example/product",
              partner: { name: "Retailer" },
            },
          ],
        },
      },
    ]);
    transaction.price_alerts.updateMany.mockResolvedValue({ count: 0 });

    await expect(service.checkActiveAlerts()).resolves.toEqual({
      data: { checked: 1, triggered: 0 },
    });
    expect(transaction.notifications.create).not.toHaveBeenCalled();
  });
});
