import { NotFoundException } from "@nestjs/common";
import { AffiliateService } from "./affiliate.service";
import { MarketplacePageError } from "./marketplace-price.service";

describe("AffiliateService", () => {
  const link = {
    id: "link-1",
    partner_id: "partner-1",
    device_variant_id: "variant-1",
    region_code: "US",
    product_url: "https://retailer.example/product",
    current_price: 1099,
    currency_code: "USD",
    in_stock: true,
  };

  const prisma = {
    affiliate_partners: {
      findMany: jest.fn(),
      findUnique: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
    },
    affiliate_links: {
      findMany: jest.fn(),
      findUnique: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
    affiliate_price_history: {
      create: jest.fn(),
      deleteMany: jest.fn(),
    },
    affiliate_clicks: {
      create: jest.fn(),
      deleteMany: jest.fn(),
    },
    device_variants: {
      findFirst: jest.fn(),
    },
    $transaction: jest.fn(),
  };
  const marketplacePrices = {
    fetchOffer: jest.fn(),
    validateProductUrl: jest.fn(),
  };

  let service: AffiliateService;

  beforeEach(() => {
    jest.clearAllMocks();
    service = new AffiliateService(prisma as any, marketplacePrices as any);
  });

  it("crawls and stores a complete offer snapshot when a link is created", async () => {
    prisma.affiliate_partners.findUnique.mockResolvedValue({
      id: "partner-1",
      name: "CellphoneS",
      slug: "cellphones",
      base_url: "https://cellphones.com.vn",
      is_active: true,
      is_trusted: true,
      display_order: 10,
    });
    prisma.device_variants.findFirst.mockResolvedValue({ id: "variant-1" });
    marketplacePrices.fetchOffer.mockResolvedValue({
      price: 19_990_000,
      originalPrice: 21_990_000,
      discountPercent: 9,
      currency: "VND",
      inStock: true,
      availabilityLabel: "Còn hàng",
      productTitle: "Điện thoại thử nghiệm",
      imageUrl: "https://cdn.example.com/product.webp",
      productUrl: "https://cellphones.com.vn/product.html",
      source: "json_ld",
    });
    prisma.affiliate_links.create.mockImplementation(async ({ data }) => ({
      id: "link-1",
      ...data,
    }));

    await service.createLink({
      partner_id: "partner-1",
      device_variant_id: "variant-1",
      product_url: "https://cellphones.com.vn/product.html",
    });

    expect(marketplacePrices.validateProductUrl).toHaveBeenCalledWith(
      "https://cellphones.com.vn/product.html",
      "https://cellphones.com.vn",
    );
    expect(prisma.affiliate_links.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          current_price: 19_990_000,
          original_price: 21_990_000,
          discount_percent: 9,
          product_title: "Điện thoại thử nghiệm",
          image_url: "https://cdn.example.com/product.webp",
          sync_status: "synced",
          sync_error: undefined,
        }),
      }),
    );
    expect(prisma.affiliate_price_history.create).toHaveBeenCalledWith({
      data: {
        affiliate_link_id: "link-1",
        price: 19_990_000,
        currency_code: "VND",
      },
    });
  });

  it("records price history when an affiliate link price changes", async () => {
    prisma.affiliate_links.findUnique.mockResolvedValue(link);
    prisma.affiliate_links.update.mockResolvedValue({
      ...link,
      current_price: 999,
    });

    await service.updateLink("link-1", {
      current_price: 999,
      currency_code: "usd",
    });

    expect(prisma.affiliate_links.update).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          current_price: 999,
          currency_code: "USD",
          last_checked_at: expect.any(Date),
        }),
      }),
    );
    expect(prisma.affiliate_price_history.create).toHaveBeenCalledWith({
      data: {
        affiliate_link_id: "link-1",
        price: 999,
        currency_code: "USD",
      },
    });
  });

  it("does not record price history when the price is unchanged", async () => {
    prisma.affiliate_links.findUnique.mockResolvedValue(link);
    prisma.affiliate_links.update.mockResolvedValue(link);

    await service.updateLink("link-1", {
      current_price: 1099,
    });

    expect(prisma.affiliate_price_history.create).not.toHaveBeenCalled();
  });

  it("summarizes trusted-store history and identifies a historical low", async () => {
    const now = new Date("2026-08-05T08:00:00.000Z");
    prisma.affiliate_links.findMany.mockResolvedValue([
      {
        ...link,
        current_price: 900,
        currency_code: "VND",
        last_checked_at: now,
        partner: {
          id: "partner-1",
          name: "Cửa hàng A",
          is_trusted: true,
          display_order: 1,
        },
        device_variant: { id: "variant-1", variant_name: "256 GB" },
        price_history: [
          {
            price: 1000,
            currency_code: "VND",
            recorded_at: new Date("2026-08-01T08:00:00.000Z"),
          },
          { price: 900, currency_code: "VND", recorded_at: now },
        ],
      },
      {
        ...link,
        id: "link-2",
        partner_id: "partner-2",
        current_price: 1000,
        currency_code: "VND",
        last_checked_at: now,
        partner: {
          id: "partner-2",
          name: "Cửa hàng B",
          is_trusted: true,
          display_order: 2,
        },
        device_variant: { id: "variant-1", variant_name: "256 GB" },
        price_history: [
          { price: 1000, currency_code: "VND", recorded_at: now },
        ],
      },
    ]);

    const result = await service.getPriceInsights({
      device_model_slug: "phone-test",
      days: 90,
    });

    expect(result.data.variants[0]?.summary).toEqual(
      expect.objectContaining({
        current_best_price: 900,
        historical_low: 900,
        price_spread: 100,
        signal: "historical_low",
      }),
    );
    expect(result.data.variants[0]?.offers[0]).toEqual(
      expect.objectContaining({
        change_amount: -100,
        change_percent: -10,
      }),
    );
  });

  it("deletes a link together with click and price history", async () => {
    prisma.affiliate_links.findUnique.mockResolvedValue(link);
    prisma.affiliate_clicks.deleteMany.mockReturnValue("delete-clicks");
    prisma.affiliate_price_history.deleteMany.mockReturnValue("delete-prices");
    prisma.affiliate_links.delete.mockReturnValue("delete-link");
    prisma.$transaction.mockResolvedValue([]);

    await expect(service.removeLink("link-1")).resolves.toEqual({
      id: "link-1",
      deleted: true,
    });

    expect(prisma.$transaction).toHaveBeenCalledWith([
      "delete-clicks",
      "delete-prices",
      "delete-link",
    ]);
    expect(prisma.affiliate_clicks.deleteMany).toHaveBeenCalledWith({
      where: { affiliate_link_id: "link-1" },
    });
    expect(prisma.affiliate_price_history.deleteMany).toHaveBeenCalledWith({
      where: { affiliate_link_id: "link-1" },
    });
    expect(prisma.affiliate_links.delete).toHaveBeenCalledWith({
      where: { id: "link-1" },
    });
  });

  it("tracks affiliate clicks and returns the redirect URL", async () => {
    prisma.affiliate_links.findUnique.mockResolvedValue(link);
    prisma.affiliate_clicks.create.mockResolvedValue({ id: "click-1" });

    await expect(
      service.trackClick(
        "link-1",
        {
          session_id: "8b1f2f0a-ec4e-4755-8efe-698c6c892001",
          referrer: "https://spechub.test/devices/iphone",
        },
        {
          userId: "user-1",
          ipAddress: "127.0.0.1",
          userAgent: "Jest",
        },
      ),
    ).resolves.toEqual({
      data: {
        affiliate_link_id: "link-1",
        redirect_url: "https://retailer.example/product",
      },
    });

    expect(prisma.affiliate_clicks.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        affiliate_link_id: "link-1",
        user_id: "user-1",
        referrer: "https://spechub.test/devices/iphone",
      }),
    });
  });

  it("marks a 404 marketplace URL unavailable without returning a server error", async () => {
    const linkedOffer = {
      ...link,
      partner: {
        slug: "amazon",
        base_url: "https://www.amazon.com",
      },
    };
    prisma.affiliate_links.findUnique.mockResolvedValue(linkedOffer);
    marketplacePrices.fetchOffer.mockRejectedValue(
      new MarketplacePageError(404),
    );
    prisma.affiliate_links.update.mockImplementation(async ({ data }) => ({
      ...linkedOffer,
      ...data,
    }));

    await expect(service.syncLink("link-1")).resolves.toEqual(
      expect.objectContaining({
        in_stock: false,
        sync_status: "unavailable",
        sync_source: "unavailable",
        availability_label: "Liên kết đã hết hiệu lực",
      }),
    );

    expect(prisma.affiliate_links.update).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          in_stock: false,
          sync_status: "unavailable",
          sync_error:
            "Liên kết sản phẩm không còn tồn tại hoặc URL đã thay đổi.",
        }),
      }),
    );
  });

  it("throws when an affiliate link is missing", async () => {
    prisma.affiliate_links.findUnique.mockResolvedValue(null);

    await expect(service.findLink("missing")).rejects.toBeInstanceOf(
      NotFoundException,
    );
  });
});
