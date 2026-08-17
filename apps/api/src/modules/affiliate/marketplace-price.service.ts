import { Injectable, Logger } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { isIP } from "node:net";

export type MarketplaceOffer = {
  price: number;
  originalPrice?: number;
  discountPercent?: number;
  currency: string;
  inStock: boolean;
  availabilityLabel?: string;
  productTitle?: string;
  imageUrl?: string;
  productUrl?: string;
  source: "partner_api" | "json_ld" | "open_graph" | "embedded_data";
};

type MarketplaceInput = {
  partnerSlug: string;
  partnerBaseUrl: string;
  productUrl: string;
};

export class MarketplacePageError extends Error {
  readonly unavailable: boolean;

  constructor(readonly status: number) {
    const unavailable = status === 404 || status === 410;
    const message = unavailable
      ? "Liên kết sản phẩm không còn tồn tại hoặc URL đã thay đổi."
      : status === 403
        ? "Trang bán hàng từ chối truy cập tự động. Hãy kiểm tra URL hoặc nhập giá thủ công."
        : status === 429
          ? "Trang bán hàng đang giới hạn số lần kiểm tra. Vui lòng thử lại sau."
          : `Trang bán hàng tạm thời không phản hồi (mã ${status}).`;
    super(message);
    this.name = "MarketplacePageError";
    this.unavailable = unavailable;
  }
}

@Injectable()
export class MarketplacePriceService {
  private readonly logger = new Logger(MarketplacePriceService.name);

  constructor(private readonly config: ConfigService) {}

  async fetchOffer(input: MarketplaceInput): Promise<MarketplaceOffer> {
    this.validateProductUrl(input.productUrl, input.partnerBaseUrl);

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

    return this.fetchFromProductMetadata(input);
  }

  validateProductUrl(productUrl: string, partnerBaseUrl: string) {
    this.assertPartnerUrl(productUrl, partnerBaseUrl);
  }

  private async fetchFromPartnerBridge(
    bridgeUrl: string,
    input: MarketplaceInput,
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
    return this.normalizeOffer(payload, "partner_api", input.productUrl);
  }

  private async fetchFromProductMetadata(
    input: MarketplaceInput,
  ): Promise<MarketplaceOffer> {
    const response = await fetch(input.productUrl, {
      signal: AbortSignal.timeout(12_000),
      redirect: "follow",
      headers: {
        Accept: "text/html,application/xhtml+xml",
        "Accept-Language": "vi-VN,vi;q=0.9,en;q=0.7",
        "Cache-Control": "no-cache",
        "User-Agent":
          "Mozilla/5.0 (compatible; SpecHubCommerceBot/1.0; +https://spechub.io)",
      },
    });
    if (!response.ok) {
      throw new MarketplacePageError(response.status);
    }

    const finalUrl = response.url || input.productUrl;
    this.assertPartnerUrl(finalUrl, input.partnerBaseUrl);
    const html = await response.text();
    if (html.length > 3_000_000) {
      throw new Error("Marketplace page is too large");
    }

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
        const offers = this.firstOffer(product.offers);
        if (!offers) continue;
        return this.normalizeOffer(
          {
            ...product,
            ...offers,
            name: product.name,
            image: product.image,
            url: product.url ?? offers.url ?? finalUrl,
          },
          "json_ld",
          finalUrl,
        );
      } catch {
        // A page may contain several JSON-LD blocks; continue with the next one.
      }
    }

    const openGraph = this.readOpenGraph(html);
    if (openGraph.price !== undefined) {
      return this.normalizeOffer(
        {
          price: openGraph.price,
          original_price: openGraph.originalPrice,
          priceCurrency: openGraph.currency,
          availability: openGraph.availability,
          name: openGraph.title,
          image: openGraph.image,
          url: finalUrl,
        },
        "open_graph",
        finalUrl,
      );
    }

    const embedded = this.readEmbeddedProductData(html);
    if (embedded.price !== undefined) {
      return this.normalizeOffer(
        {
          price: embedded.price,
          original_price: embedded.originalPrice,
          priceCurrency: openGraph.currency ?? "VND",
          availability: openGraph.availability,
          name: openGraph.title,
          image: openGraph.image,
          url: finalUrl,
        },
        "embedded_data",
        finalUrl,
      );
    }

    throw new Error("No public Product/Offer price was found");
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
    return (
      this.findProductNode(record["@graph"]) ??
      this.findProductNode(record["mainEntity"])
    );
  }

  private firstOffer(value: unknown): Record<string, unknown> | null {
    if (Array.isArray(value)) {
      return (
        value.find(
          (item): item is Record<string, unknown> =>
            Boolean(item) && typeof item === "object",
        ) ?? null
      );
    }
    return value && typeof value === "object"
      ? (value as Record<string, unknown>)
      : null;
  }

  private normalizeOffer(
    payload: Record<string, unknown>,
    source: MarketplaceOffer["source"],
    baseUrl: string,
  ): MarketplaceOffer {
    const currency = String(
      payload.priceCurrency ??
        payload.currency ??
        payload.currency_code ??
        "VND",
    ).toUpperCase();
    const price = this.parsePrice(
      payload.price ??
        payload.current_price ??
        payload.lowPrice ??
        payload.sale_price ??
        payload.salePrice,
      currency,
    );
    const originalPrice = this.parsePrice(
      payload.original_price ??
        payload.originalPrice ??
        payload.highPrice ??
        payload.list_price ??
        payload.regularPrice,
      currency,
    );
    const availability = String(payload.availability ?? payload.in_stock ?? "");
    const inStock =
      typeof payload.in_stock === "boolean"
        ? payload.in_stock
        : !/outofstock|soldout|preorderclosed|false|hết hàng/i.test(
            availability,
          );

    if (!Number.isFinite(price) || price! < 0) {
      throw new Error("Price provider returned an invalid price");
    }
    if (!/^[A-Z]{3}$/.test(currency)) {
      throw new Error("Price provider returned an invalid currency");
    }

    const explicitDiscount = Number(
      payload.discount_percent ?? payload.discountPercent,
    );
    const discountPercent =
      Number.isFinite(explicitDiscount) && explicitDiscount > 0
        ? explicitDiscount
        : originalPrice && originalPrice > price!
          ? Math.round((1 - price! / originalPrice) * 100)
          : undefined;
    const productTitle = this.cleanText(payload.name ?? payload.title);
    const imageUrl = this.normalizeImageUrl(
      payload.image ??
        payload.image_url ??
        payload.imageUrl ??
        payload.thumbnail,
      baseUrl,
    );
    const productUrl = this.normalizeHttpUrl(
      payload.url ?? payload.product_url,
      baseUrl,
    );

    return {
      price: price!,
      currency,
      inStock,
      source,
      ...(originalPrice && originalPrice >= price! ? { originalPrice } : {}),
      ...(discountPercent ? { discountPercent } : {}),
      ...(availability
        ? { availabilityLabel: this.availabilityLabel(availability, inStock) }
        : {}),
      ...(productTitle ? { productTitle } : {}),
      ...(imageUrl ? { imageUrl } : {}),
      ...(productUrl ? { productUrl } : {}),
    };
  }

  private readOpenGraph(html: string) {
    const meta = new Map<string, string>();
    for (const match of html.matchAll(/<meta\b[^>]*>/gi)) {
      const tag = match[0];
      const key =
        this.attribute(tag, "property") ??
        this.attribute(tag, "name") ??
        this.attribute(tag, "itemprop");
      const content = this.attribute(tag, "content");
      if (key && content && !meta.has(key.toLowerCase())) {
        meta.set(key.toLowerCase(), this.decodeHtml(content));
      }
    }
    return {
      price:
        meta.get("product:price:amount") ??
        meta.get("og:price:amount") ??
        meta.get("price"),
      originalPrice:
        meta.get("product:original_price:amount") ??
        meta.get("product:sale_price:amount"),
      currency:
        meta.get("product:price:currency") ??
        meta.get("og:price:currency") ??
        "VND",
      availability:
        meta.get("product:availability") ?? meta.get("availability"),
      title: meta.get("og:title") ?? meta.get("twitter:title"),
      image:
        meta.get("og:image:secure_url") ??
        meta.get("og:image") ??
        meta.get("twitter:image"),
    };
  }

  private readEmbeddedProductData(html: string) {
    return {
      price: this.embeddedValue(html, [
        "special_price",
        "sale_price",
        "salePrice",
        "finalPrice",
        "currentPrice",
      ]),
      originalPrice: this.embeddedValue(html, [
        "original_price",
        "originalPrice",
        "regular_price",
        "regularPrice",
        "listPrice",
      ]),
    };
  }

  private embeddedValue(html: string, keys: string[]) {
    for (const key of keys) {
      const escaped = key.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
      const match = html.match(
        new RegExp(
          `["']${escaped}["']\\s*:\\s*(?:["']([^"']+)["']|([0-9][0-9.,]*))`,
          "i",
        ),
      );
      if (match?.[1] || match?.[2]) return match[1] ?? match[2];
    }
    return undefined;
  }

  private attribute(tag: string, name: string) {
    const escaped = name.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const match = tag.match(
      new RegExp(
        `\\b${escaped}\\s*=\\s*(?:"([^"]*)"|'([^']*)'|([^\\s>]+))`,
        "i",
      ),
    );
    return match?.[1] ?? match?.[2] ?? match?.[3];
  }

  private parsePrice(value: unknown, currency: string) {
    if (typeof value === "number") return Number.isFinite(value) ? value : null;
    if (typeof value !== "string" || !value.trim()) return null;
    const raw = value.trim();
    const normalized = raw.replace(/[^\d,.-]/g, "");
    const decimalCandidate =
      currency !== "VND" &&
      /^[0-9]+[.,][0-9]{1,2}$/.test(normalized) &&
      (normalized.match(/[.,]/g)?.length ?? 0) === 1
        ? normalized.replace(",", ".")
        : normalized.replace(/[.,]/g, "");
    const parsed = Number(decimalCandidate);
    return Number.isFinite(parsed) ? parsed : null;
  }

  private cleanText(value: unknown) {
    if (typeof value !== "string") return undefined;
    const text = this.decodeHtml(value).replace(/\s+/g, " ").trim();
    return text ? text.slice(0, 300) : undefined;
  }

  private normalizeImageUrl(value: unknown, baseUrl: string) {
    const candidate = Array.isArray(value)
      ? value[0]
      : value && typeof value === "object"
        ? ((value as Record<string, unknown>).url ??
          (value as Record<string, unknown>).contentUrl)
        : value;
    return this.normalizeHttpUrl(candidate, baseUrl);
  }

  private normalizeHttpUrl(value: unknown, baseUrl: string) {
    if (typeof value !== "string" || !value.trim()) return undefined;
    try {
      const url = new URL(this.decodeHtml(value), baseUrl);
      return url.protocol === "https:" || url.protocol === "http:"
        ? url.toString()
        : undefined;
    } catch {
      return undefined;
    }
  }

  private availabilityLabel(value: string, inStock: boolean) {
    if (/preorder|pre-order|đặt trước/i.test(value)) return "Đặt trước";
    return inStock ? "Còn hàng" : "Hết hàng";
  }

  private decodeHtml(value: string) {
    return value
      .replace(/&amp;/gi, "&")
      .replace(/&quot;/gi, '"')
      .replace(/&#39;|&apos;/gi, "'")
      .replace(/&lt;/gi, "<")
      .replace(/&gt;/gi, ">")
      .replace(/&#(\d+);/g, (_, code: string) =>
        String.fromCodePoint(Number(code)),
      );
  }

  private assertPartnerUrl(productUrl: string, partnerBaseUrl: string) {
    const product = new URL(productUrl);
    const partner = new URL(partnerBaseUrl);
    this.assertPublicHost(product.hostname);
    this.assertPublicHost(partner.hostname);
    const hostMatches =
      product.hostname === partner.hostname ||
      product.hostname.endsWith(`.${partner.hostname}`) ||
      partner.hostname.endsWith(`.${product.hostname}`);
    if (product.protocol !== "https:" || !hostMatches) {
      throw new Error("Product URL must use HTTPS on the partner's own domain");
    }
  }

  private assertPublicHost(hostname: string) {
    const normalized = hostname.toLowerCase();
    const ipVersion = isIP(normalized);
    const isPrivateIp =
      ipVersion === 4 &&
      /^(?:10\.|127\.|169\.254\.|192\.168\.|172\.(?:1[6-9]|2\d|3[01])\.)/.test(
        normalized,
      );
    if (
      normalized === "localhost" ||
      normalized.endsWith(".local") ||
      normalized === "::1" ||
      isPrivateIp
    ) {
      throw new Error("Marketplace host must be public");
    }
  }
}
