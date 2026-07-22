import { NotFoundException } from "@nestjs/common";
import { AffiliateService } from "./affiliate.service";

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
    },
    affiliate_price_history: {
      create: jest.fn(),
    },
    affiliate_clicks: {
      create: jest.fn(),
    },
    device_variants: {
      findFirst: jest.fn(),
    },
  };

  let service: AffiliateService;

  beforeEach(() => {
    jest.clearAllMocks();
    service = new AffiliateService(
      prisma as any,
      {
        fetchOffer: jest.fn(),
      } as any,
    );
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

  it("throws when an affiliate link is missing", async () => {
    prisma.affiliate_links.findUnique.mockResolvedValue(null);

    await expect(service.findLink("missing")).rejects.toBeInstanceOf(
      NotFoundException,
    );
  });
});
