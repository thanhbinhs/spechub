import { ConfigService } from "@nestjs/config";
import { MarketplacePriceService } from "./marketplace-price.service";

describe("MarketplacePriceService", () => {
  const originalFetch = global.fetch;

  afterEach(() => {
    global.fetch = originalFetch;
    jest.restoreAllMocks();
  });

  it("reads a public schema.org Product offer as the safe fallback", async () => {
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      url: "https://shop.example.com/products/phone",
      text: async () => `
        <html><script type="application/ld+json">
          {"@type":"Product","name":"Phone","image":["https://cdn.example.com/phone.webp"],"offers":{"@type":"Offer","price":"19990000","highPrice":"21990000","priceCurrency":"VND","availability":"https://schema.org/InStock"}}
        </script></html>`,
    }) as typeof fetch;
    const service = new MarketplacePriceService(new ConfigService({}));

    await expect(
      service.fetchOffer({
        partnerSlug: "example",
        partnerBaseUrl: "https://shop.example.com",
        productUrl: "https://shop.example.com/products/phone",
      }),
    ).resolves.toEqual({
      price: 19_990_000,
      currency: "VND",
      inStock: true,
      availabilityLabel: "Còn hàng",
      originalPrice: 21_990_000,
      discountPercent: 9,
      productTitle: "Phone",
      imageUrl: "https://cdn.example.com/phone.webp",
      productUrl: "https://shop.example.com/products/phone",
      source: "json_ld",
    });
  });

  it("falls back to Open Graph product metadata used by retail pages", async () => {
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      url: "https://shop.example.com/products/laptop",
      text: async () => `
        <html><head>
          <meta property="og:title" content="Laptop Pro &amp; Bag">
          <meta property="og:image" content="/media/laptop.webp">
          <meta property="product:price:amount" content="24990000">
          <meta property="product:price:currency" content="VND">
          <meta property="product:availability" content="in stock">
        </head></html>`,
    }) as typeof fetch;
    const service = new MarketplacePriceService(new ConfigService({}));

    await expect(
      service.fetchOffer({
        partnerSlug: "example",
        partnerBaseUrl: "https://shop.example.com",
        productUrl: "https://shop.example.com/products/laptop",
      }),
    ).resolves.toEqual({
      price: 24_990_000,
      currency: "VND",
      inStock: true,
      availabilityLabel: "Còn hàng",
      productTitle: "Laptop Pro & Bag",
      imageUrl: "https://shop.example.com/media/laptop.webp",
      productUrl: "https://shop.example.com/products/laptop",
      source: "open_graph",
    });
  });

  it("rejects product URLs outside the configured partner domain", async () => {
    const service = new MarketplacePriceService(new ConfigService({}));

    await expect(
      service.fetchOffer({
        partnerSlug: "example",
        partnerBaseUrl: "https://shop.example.com",
        productUrl: "https://attacker.example.net/internal",
      }),
    ).rejects.toThrow("partner's own domain");
  });

  it("rejects a redirect that leaves the partner domain", async () => {
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      url: "https://attacker.example.net/capture",
      text: async () => "",
    }) as typeof fetch;
    const service = new MarketplacePriceService(new ConfigService({}));

    await expect(
      service.fetchOffer({
        partnerSlug: "example",
        partnerBaseUrl: "https://shop.example.com",
        productUrl: "https://shop.example.com/products/phone",
      }),
    ).rejects.toThrow("partner's own domain");
  });

  it("classifies a missing product page as an unavailable link", async () => {
    global.fetch = jest.fn().mockResolvedValue({
      ok: false,
      status: 404,
    }) as typeof fetch;
    const service = new MarketplacePriceService(new ConfigService({}));

    await expect(
      service.fetchOffer({
        partnerSlug: "example",
        partnerBaseUrl: "https://shop.example.com",
        productUrl: "https://shop.example.com/products/removed",
      }),
    ).rejects.toMatchObject({
      name: "MarketplacePageError",
      status: 404,
      unavailable: true,
      message: "Liên kết sản phẩm không còn tồn tại hoặc URL đã thay đổi.",
    });
  });
});
