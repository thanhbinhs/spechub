import { Injectable, Logger } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";

export type MarketplaceOffer = {
  price: number;
  currency: string;
  inStock: boolean;
  productUrl?: string;
  source: "partner_api" | "json_ld";
};

@Injectable()
export class MarketplacePriceService {
  private readonly logger = new Logger(MarketplacePriceService.name);

  constructor(private readonly config: ConfigService) {}

  async fetchOffer(input: {
    partnerSlug: string;
    partnerBaseUrl: string;
    productUrl: string;
  }): Promise<MarketplaceOffer> {
    this.assertPartnerUrl(input.productUrl, input.partnerBaseUrl);

    const bridgeUrl = this.config.get<string>("COMMERCE_PRICE_API_URL")?.trim();
    if (bridgeUrl) {
      try {
        return await this.fetchFromPartnerBridge(bridgeUrl, input);
      } catch (error) {
        this.logger.warn(
          `Price API bridge failed for ${input.partnerSlug}; falling back to product metadata: ${String(error)}`,
        );
      }
    }

    return this.fetchFromJsonLd(input.productUrl);
  }

  private async fetchFromPartnerBridge(
    bridgeUrl: string,
    input: { partnerSlug: string; productUrl: string },
  ): Promise<MarketplaceOffer> {
    const token = this.config.get<string>("COMMERCE_PRICE_API_TOKEN")?.trim();
    const response = await fetch(bridgeUrl, {
      method: "POST",
      signal: AbortSignal.timeout(12_000),
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: JSON.stringify({
        partner: input.partnerSlug,
        product_url: input.productUrl,
        market: "VN",
      }),
    });
    if (!response.ok) {
      throw new Error(`Partner bridge returned ${response.status}`);
    }

    const payload = (await response.json()) as Record<string, unknown>;
    return this.normalizeOffer(payload, "partner_api");
  }

  private async fetchFromJsonLd(productUrl: string): Promise<MarketplaceOffer> {
    const response = await fetch(productUrl, {
      signal: AbortSignal.timeout(12_000),
      redirect: "follow",
      headers: {
        Accept: "text/html,application/xhtml+xml",
        "User-Agent":
          "SpecHubPriceBot/1.0 (+https://spechub.io; structured product metadata)",
      },
    });
    if (!response.ok)
      throw new Error(`Marketplace returned ${response.status}`);

    const html = await response.text();
    if (html.length > 3_000_000)
      throw new Error("Marketplace page is too large");
    const scripts = Array.from(
      html.matchAll(
        /<script[^>]*type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi,
      ),
    );

    for (const match of scripts) {
      try {
        const parsed = JSON.parse(match[1]!.trim()) as unknown;
        const product = this.findProductNode(parsed);
        if (!product) continue;
        const offers = Array.isArray(product.offers)
          ? product.offers[0]
          : product.offers;
        if (!offers || typeof offers !== "object") continue;
        return this.normalizeOffer(
          offers as Record<string, unknown>,
          "json_ld",
        );
      } catch {
        // A page may contain multiple JSON-LD blocks; continue with the next block.
      }
    }

    throw new Error("No schema.org Product/Offer price was found");
  }

  private findProductNode(value: unknown): Record<string, unknown> | null {
    if (Array.isArray(value)) {
      for (const item of value) {
        const found = this.findProductNode(item);
        if (found) return found;
      }
      return null;
    }
    if (!value || typeof value !== "object") return null;
    const record = value as Record<string, unknown>;
    const type = record["@type"];
    if (
      type === "Product" ||
      (Array.isArray(type) && type.includes("Product"))
    ) {
      return record;
    }
    return this.findProductNode(record["@graph"]);
  }

  private normalizeOffer(
    payload: Record<string, unknown>,
    source: MarketplaceOffer["source"],
  ): MarketplaceOffer {
    const price = Number(
      payload.price ??
        payload.current_price ??
        payload.lowPrice ??
        payload.sale_price,
    );
    const currency = String(
      payload.priceCurrency ??
        payload.currency ??
        payload.currency_code ??
        "VND",
    ).toUpperCase();
    const availability = String(payload.availability ?? payload.in_stock ?? "");
    const inStock =
      typeof payload.in_stock === "boolean"
        ? payload.in_stock
        : !/outofstock|soldout|false/i.test(availability);

    if (!Number.isFinite(price) || price < 0) {
      throw new Error("Price provider returned an invalid price");
    }
    if (!/^[A-Z]{3}$/.test(currency)) {
      throw new Error("Price provider returned an invalid currency");
    }

    return {
      price,
      currency,
      inStock,
      source,
      ...(typeof payload.url === "string" ? { productUrl: payload.url } : {}),
    };
  }

  private assertPartnerUrl(productUrl: string, partnerBaseUrl: string) {
    const product = new URL(productUrl);
    const partner = new URL(partnerBaseUrl);
    const hostMatches =
      product.hostname === partner.hostname ||
      product.hostname.endsWith(`.${partner.hostname}`) ||
      partner.hostname.endsWith(`.${product.hostname}`);
    if (product.protocol !== "https:" || !hostMatches) {
      throw new Error("Product URL must use HTTPS on the partner's own domain");
    }
  }
}
