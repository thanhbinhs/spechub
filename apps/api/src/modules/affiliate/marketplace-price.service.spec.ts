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
      text: async () => `
        <html><script type="application/ld+json">
          {"@type":"Product","name":"Phone","offers":{"@type":"Offer","price":"19990000","priceCurrency":"VND","availability":"https://schema.org/InStock"}}
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
      source: "json_ld",
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
});
