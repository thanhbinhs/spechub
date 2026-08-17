import {
  BadRequestException,
  HttpException,
  HttpStatus,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import { Prisma } from "@spechub/database";
import { PrismaService } from "../../prisma/prisma.service";
import {
  CreateAffiliateLinkDto,
  QueryAffiliateLinksDto,
  QueryAffiliatePriceInsightsDto,
} from "./dto/create-affiliate-link.dto";
import { CreateAffiliatePartnerDto } from "./dto/create-affiliate-partner.dto";
import { InspectAffiliateOfferDto } from "./dto/inspect-affiliate-offer.dto";
import { TrackAffiliateClickDto } from "./dto/track-affiliate-click.dto";
import { UpdateAffiliateLinkDto } from "./dto/update-affiliate-link.dto";
import { UpdateAffiliatePartnerDto } from "./dto/update-affiliate-partner.dto";
import {
  type MarketplaceOffer,
  MarketplacePageError,
  MarketplacePriceService,
} from "./marketplace-price.service";

const AFFILIATE_PARTNER_SELECT = {
  id: true,
  name: true,
  slug: true,
  base_url: true,
  logo_url: true,
  description: true,
  commission_rate: true,
  is_trusted: true,
  is_active: true,
  display_order: true,
  created_at: true,
  _count: {
    select: {
      affiliate_links: true,
    },
  },
} satisfies Prisma.affiliate_partnersSelect;

const AFFILIATE_LINK_SELECT = {
  id: true,
  partner_id: true,
  device_variant_id: true,
  region_code: true,
  product_url: true,
  current_price: true,
  original_price: true,
  discount_percent: true,
  currency_code: true,
  in_stock: true,
  product_title: true,
  image_url: true,
  availability_label: true,
  last_sync_source: true,
  sync_status: true,
  sync_error: true,
  last_checked_at: true,
  created_at: true,
  updated_at: true,
  partner: {
    select: {
      id: true,
      name: true,
      slug: true,
      base_url: true,
      logo_url: true,
      description: true,
      commission_rate: true,
      is_trusted: true,
      is_active: true,
      display_order: true,
    },
  },
  device_variant: {
    select: {
      id: true,
      variant_name: true,
      sku_code: true,
      color_name: true,
      device_model: {
        select: {
          id: true,
          name: true,
          slug: true,
        },
      },
    },
  },
} satisfies Prisma.affiliate_linksSelect;

export type AffiliatePartnerItem = Prisma.affiliate_partnersGetPayload<{
  select: typeof AFFILIATE_PARTNER_SELECT;
}>;

export type AffiliateLinkItem = Prisma.affiliate_linksGetPayload<{
  select: typeof AFFILIATE_LINK_SELECT;
}>;

@Injectable()
export class AffiliateService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly marketplacePrices: MarketplacePriceService,
  ) {}

  async listPartners(): Promise<{ data: AffiliatePartnerItem[] }> {
    const partners = await this.prisma.affiliate_partners.findMany({
      select: AFFILIATE_PARTNER_SELECT,
      orderBy: [
        { is_active: "desc" },
        { is_trusted: "desc" },
        { display_order: "asc" },
        { name: "asc" },
      ],
    });

    return { data: partners };
  }

  async createPartner(
    dto: CreateAffiliatePartnerDto,
  ): Promise<AffiliatePartnerItem> {
    return this.prisma.affiliate_partners.create({
      data: {
        ...dto,
        is_trusted: dto.is_trusted ?? false,
        is_active: dto.is_active ?? true,
        display_order: dto.display_order ?? 100,
      },
      select: AFFILIATE_PARTNER_SELECT,
    });
  }

  async updatePartner(
    id: string,
    dto: UpdateAffiliatePartnerDto,
  ): Promise<AffiliatePartnerItem> {
    await this.ensurePartner(id);

    return this.prisma.affiliate_partners.update({
      where: { id },
      data: dto,
      select: AFFILIATE_PARTNER_SELECT,
    });
  }

  async listLinks(
    query: QueryAffiliateLinksDto,
  ): Promise<{ data: AffiliateLinkItem[] }> {
    const links = await this.prisma.affiliate_links.findMany({
      where: {
        ...(query.device_variant_id && {
          device_variant_id: query.device_variant_id,
        }),
        ...(query.device_model_slug && {
          device_variant: {
            device_model: {
              slug: query.device_model_slug,
              deleted_at: null,
            },
          },
        }),
        ...(query.region_code && {
          region_code: query.region_code.toUpperCase(),
        }),
        ...(query.in_stock_only && { in_stock: true }),
        partner: {
          is_active: true,
          ...(query.partner_slug && { slug: query.partner_slug }),
        },
      },
      select: AFFILIATE_LINK_SELECT,
      orderBy: [{ in_stock: "desc" }, { current_price: "asc" }],
    });

    return {
      data: links.sort(
        (left, right) =>
          Number(right.partner.is_trusted) - Number(left.partner.is_trusted) ||
          left.partner.display_order - right.partner.display_order ||
          Number(right.in_stock) - Number(left.in_stock) ||
          Number(left.current_price ?? Number.MAX_SAFE_INTEGER) -
            Number(right.current_price ?? Number.MAX_SAFE_INTEGER),
      ),
    };
  }

  async findLink(id: string): Promise<AffiliateLinkItem> {
    const link = await this.prisma.affiliate_links.findUnique({
      where: { id },
      select: AFFILIATE_LINK_SELECT,
    });

    if (!link) {
      throw new NotFoundException(`Affiliate link ${id} not found`);
    }

    return link;
  }

  async getPriceInsights(query: QueryAffiliatePriceInsightsDto) {
    if (!query.device_model_slug && !query.device_variant_id) {
      throw new BadRequestException(
        "device_model_slug or device_variant_id is required",
      );
    }

    const days = query.days ?? 90;
    const since = new Date(Date.now() - days * 24 * 60 * 60 * 1_000);
    const links = await this.prisma.affiliate_links.findMany({
      where: {
        ...(query.device_variant_id
          ? { device_variant_id: query.device_variant_id }
          : {
              device_variant: {
                device_model: {
                  slug: query.device_model_slug,
                  deleted_at: null,
                },
              },
            }),
        ...(query.region_code && {
          region_code: query.region_code.toUpperCase(),
        }),
        partner: {
          is_active: true,
          is_trusted: true,
        },
      },
      select: {
        ...AFFILIATE_LINK_SELECT,
        price_history: {
          where: { recorded_at: { gte: since } },
          select: {
            price: true,
            currency_code: true,
            recorded_at: true,
          },
          orderBy: { recorded_at: "asc" },
        },
      },
      orderBy: [
        { device_variant_id: "asc" },
        { partner: { display_order: "asc" } },
      ],
    });

    const grouped = new Map<
      string,
      {
        id: string;
        name: string;
        offers: ReturnType<AffiliateService["priceOfferInsight"]>[];
      }
    >();

    for (const link of links) {
      const variant = grouped.get(link.device_variant_id) ?? {
        id: link.device_variant_id,
        name: link.device_variant.variant_name,
        offers: [],
      };
      variant.offers.push(this.priceOfferInsight(link));
      grouped.set(link.device_variant_id, variant);
    }

    const variants = Array.from(grouped.values()).map((variant) => ({
      ...variant,
      summary: this.priceVariantSummary(variant.offers),
    }));

    return {
      data: {
        generated_at: new Date().toISOString(),
        days,
        variants,
      },
    };
  }

  async inspectOffer(dto: InspectAffiliateOfferDto) {
    const partner = await this.ensurePartner(dto.partner_id);
    try {
      const offer = await this.marketplacePrices.fetchOffer({
        partnerSlug: partner.slug,
        partnerBaseUrl: partner.base_url,
        productUrl: dto.product_url,
      });
      return { partner, offer };
    } catch (error) {
      throw this.marketplaceHttpException(error);
    }
  }

  async createLink(dto: CreateAffiliateLinkDto): Promise<AffiliateLinkItem> {
    const [partner] = await Promise.all([
      this.ensurePartner(dto.partner_id),
      this.ensureVariant(dto.device_variant_id),
    ]);
    this.marketplacePrices.validateProductUrl(
      dto.product_url,
      partner.base_url,
    );
    let offer: MarketplaceOffer | undefined;
    let syncError: string | undefined;
    try {
      offer = await this.marketplacePrices.fetchOffer({
        partnerSlug: partner.slug,
        partnerBaseUrl: partner.base_url,
        productUrl: dto.product_url,
      });
    } catch (error) {
      syncError = this.syncErrorMessage(error);
    }

    const currencyCode = (
      offer?.currency ??
      dto.currency_code ??
      "VND"
    ).toUpperCase();
    const currentPrice = offer?.price ?? dto.current_price;
    const link = await this.prisma.affiliate_links.create({
      data: {
        partner_id: dto.partner_id,
        device_variant_id: dto.device_variant_id,
        region_code: (dto.region_code ?? "VN").toUpperCase(),
        product_url: offer?.productUrl ?? dto.product_url,
        current_price: currentPrice,
        original_price: offer?.originalPrice,
        discount_percent: offer?.discountPercent,
        currency_code: currencyCode,
        in_stock: offer?.inStock ?? dto.in_stock ?? true,
        product_title: offer?.productTitle,
        image_url: offer?.imageUrl,
        availability_label: offer?.availabilityLabel,
        last_sync_source: offer?.source,
        sync_status: offer ? "synced" : "error",
        sync_error: syncError,
        last_checked_at: new Date(),
      },
      select: AFFILIATE_LINK_SELECT,
    });

    if (currentPrice !== undefined) {
      await this.recordPrice(link.id, currentPrice, link.currency_code);
    }

    return link;
  }

  async updateLink(
    id: string,
    dto: UpdateAffiliateLinkDto,
  ): Promise<AffiliateLinkItem> {
    const current = await this.findLink(id);
    const partner =
      dto.partner_id !== undefined
        ? await this.ensurePartner(dto.partner_id)
        : current.partner;
    if (dto.device_variant_id !== undefined) {
      await this.ensureVariant(dto.device_variant_id);
    }
    if (dto.product_url !== undefined || dto.partner_id !== undefined) {
      this.marketplacePrices.validateProductUrl(
        dto.product_url ?? current.product_url,
        partner.base_url,
      );
    }
    const priceChanged =
      dto.current_price !== undefined &&
      String(dto.current_price) !== String(current.current_price ?? "");

    const updated = await this.prisma.affiliate_links.update({
      where: { id },
      data: {
        ...(dto.partner_id !== undefined && { partner_id: dto.partner_id }),
        ...(dto.device_variant_id !== undefined && {
          device_variant_id: dto.device_variant_id,
        }),
        ...(dto.region_code !== undefined && {
          region_code: dto.region_code.toUpperCase(),
        }),
        ...(dto.product_url !== undefined && { product_url: dto.product_url }),
        ...(dto.current_price !== undefined && {
          current_price: dto.current_price,
        }),
        ...(dto.currency_code !== undefined && {
          currency_code: dto.currency_code.toUpperCase(),
        }),
        ...(dto.in_stock !== undefined && { in_stock: dto.in_stock }),
        last_checked_at: new Date(),
      },
      select: AFFILIATE_LINK_SELECT,
    });

    if (priceChanged && dto.current_price !== undefined) {
      await this.recordPrice(
        id,
        dto.current_price,
        dto.currency_code?.toUpperCase() ?? updated.currency_code,
      );
    }

    return updated;
  }

  async removeLink(id: string) {
    await this.findLink(id);

    await this.prisma.$transaction([
      this.prisma.affiliate_clicks.deleteMany({
        where: { affiliate_link_id: id },
      }),
      this.prisma.affiliate_price_history.deleteMany({
        where: { affiliate_link_id: id },
      }),
      this.prisma.affiliate_links.delete({ where: { id } }),
    ]);

    return { id, deleted: true as const };
  }

  async trackClick(
    id: string,
    dto: TrackAffiliateClickDto,
    meta: {
      userId?: string;
      ipAddress?: string;
      userAgent?: string;
      referrer?: string;
    },
  ) {
    const link = await this.findLink(id);

    await this.prisma.affiliate_clicks.create({
      data: {
        affiliate_link_id: id,
        user_id: meta.userId,
        session_id: dto.session_id,
        ip_address: meta.ipAddress,
        user_agent: meta.userAgent,
        referrer: dto.referrer ?? meta.referrer,
      },
    });

    return {
      data: {
        affiliate_link_id: id,
        redirect_url: link.product_url,
      },
    };
  }

  async syncLink(id: string): Promise<
    AffiliateLinkItem & {
      sync_source: MarketplaceOffer["source"] | "unavailable";
    }
  > {
    const link = await this.findLink(id);
    try {
      const offer = await this.marketplacePrices.fetchOffer({
        partnerSlug: link.partner.slug,
        partnerBaseUrl: link.partner.base_url,
        productUrl: link.product_url,
      });
      const priceChanged =
        String(offer.price) !== String(link.current_price ?? "");
      const updated = await this.prisma.affiliate_links.update({
        where: { id },
        data: {
          product_url: offer.productUrl ?? link.product_url,
          current_price: offer.price,
          original_price: offer.originalPrice,
          discount_percent: offer.discountPercent,
          currency_code: offer.currency,
          in_stock: offer.inStock,
          product_title: offer.productTitle,
          image_url: offer.imageUrl,
          availability_label: offer.availabilityLabel,
          last_sync_source: offer.source,
          sync_status: "synced",
          sync_error: null,
          last_checked_at: new Date(),
        },
        select: AFFILIATE_LINK_SELECT,
      });
      if (priceChanged) {
        await this.recordPrice(id, offer.price, offer.currency);
      }
      return { ...updated, sync_source: offer.source };
    } catch (error) {
      const unavailable =
        error instanceof MarketplacePageError && error.unavailable;
      const syncError = this.syncErrorMessage(error);
      const updated = await this.prisma.affiliate_links.update({
        where: { id },
        data: {
          sync_status: unavailable ? "unavailable" : "error",
          sync_error: syncError,
          last_checked_at: new Date(),
          ...(unavailable
            ? {
                in_stock: false,
                availability_label: "Liên kết đã hết hiệu lực",
              }
            : {}),
        },
        select: AFFILIATE_LINK_SELECT,
      });
      if (unavailable) {
        return { ...updated, sync_source: "unavailable" };
      }
      throw this.marketplaceHttpException(error);
    }
  }

  async syncDueLinks(
    options: {
      maxAgeMinutes?: number;
      limit?: number;
      concurrency?: number;
    } = {},
  ) {
    const maxAgeMinutes = Math.max(0, options.maxAgeMinutes ?? 180);
    const limit = Math.min(100, Math.max(1, options.limit ?? 24));
    const concurrency = Math.min(8, Math.max(1, options.concurrency ?? 4));
    const staleBefore = new Date(Date.now() - maxAgeMinutes * 60_000);
    const links = await this.prisma.affiliate_links.findMany({
      where: {
        partner: { is_active: true },
        last_checked_at: { lt: staleBefore },
      },
      select: { id: true },
      orderBy: { last_checked_at: "asc" },
      take: limit,
    });
    const results: PromiseSettledResult<
      Awaited<ReturnType<typeof this.syncLink>>
    >[] = [];
    for (let index = 0; index < links.length; index += concurrency) {
      results.push(
        ...(await Promise.allSettled(
          links
            .slice(index, index + concurrency)
            .map((link) => this.syncLink(link.id)),
        )),
      );
    }
    return {
      data: {
        checked: results.length,
        updated: results.filter((result) => result.status === "fulfilled")
          .length,
        failed: results.filter((result) => result.status === "rejected").length,
      },
    };
  }

  syncAllLinks() {
    return this.syncDueLinks({ maxAgeMinutes: 0, limit: 100, concurrency: 5 });
  }

  private async ensurePartner(id: string) {
    const partner = await this.prisma.affiliate_partners.findUnique({
      where: { id },
      select: {
        id: true,
        name: true,
        slug: true,
        base_url: true,
        logo_url: true,
        description: true,
        commission_rate: true,
        is_trusted: true,
        is_active: true,
        display_order: true,
      },
    });

    if (!partner) {
      throw new NotFoundException(`Affiliate partner ${id} not found`);
    }
    return partner;
  }

  private async ensureVariant(id: string) {
    const variant = await this.prisma.device_variants.findFirst({
      where: { id, deleted_at: null },
      select: { id: true },
    });

    if (!variant) {
      throw new NotFoundException(`Device variant ${id} not found`);
    }
    return variant;
  }

  private recordPrice(linkId: string, price: number, currencyCode: string) {
    return this.prisma.affiliate_price_history.create({
      data: {
        affiliate_link_id: linkId,
        price,
        currency_code: currencyCode,
      },
    });
  }

  private priceOfferInsight(
    link: AffiliateLinkItem & {
      price_history: Array<{
        price: Prisma.Decimal;
        currency_code: string;
        recorded_at: Date;
      }>;
    },
  ) {
    const currentPrice = this.finitePrice(link.current_price);
    const history = link.price_history
      .filter((point) => point.currency_code === link.currency_code)
      .map((point) => ({
        price: Number(point.price),
        recorded_at: point.recorded_at.toISOString(),
      }))
      .filter((point) => Number.isFinite(point.price));
    const lastPoint = history.at(-1);
    if (
      currentPrice !== null &&
      (!lastPoint ||
        lastPoint.price !== currentPrice ||
        new Date(lastPoint.recorded_at).getTime() <
          new Date(link.last_checked_at).getTime() - 60_000)
    ) {
      history.push({
        price: currentPrice,
        recorded_at: new Date(link.last_checked_at).toISOString(),
      });
    }

    const prices = history.map((point) => point.price);
    const priorDistinctPrice = [...prices]
      .reverse()
      .find((price) => currentPrice !== null && price !== currentPrice);
    const changeAmount =
      currentPrice !== null && priorDistinctPrice !== undefined
        ? currentPrice - priorDistinctPrice
        : null;
    const changePercent =
      changeAmount !== null && priorDistinctPrice
        ? (changeAmount / priorDistinctPrice) * 100
        : null;

    return {
      link_id: link.id,
      device_variant_id: link.device_variant_id,
      partner: link.partner,
      product_url: link.product_url,
      current_price: currentPrice,
      currency_code: link.currency_code,
      in_stock: link.in_stock,
      last_checked_at: new Date(link.last_checked_at).toISOString(),
      lowest_price: prices.length ? Math.min(...prices) : currentPrice,
      highest_price: prices.length ? Math.max(...prices) : currentPrice,
      average_price: prices.length
        ? this.roundPrice(
            prices.reduce((total, price) => total + price, 0) / prices.length,
          )
        : currentPrice,
      change_amount:
        changeAmount === null ? null : this.roundPrice(changeAmount),
      change_percent:
        changePercent === null ? null : Math.round(changePercent * 10) / 10,
      history,
    };
  }

  private priceVariantSummary(
    offers: ReturnType<AffiliateService["priceOfferInsight"]>[],
  ) {
    const available = offers.filter(
      (offer) => offer.in_stock && offer.current_price !== null,
    );
    const preferredCurrency = available[0]?.currency_code ?? "VND";
    const comparable = available.filter(
      (offer) => offer.currency_code === preferredCurrency,
    );
    const currentPrices = comparable.map((offer) => offer.current_price!);
    const historicalPrices = comparable.flatMap((offer) =>
      offer.history.map((point) => point.price),
    );
    const currentBest = currentPrices.length
      ? Math.min(...currentPrices)
      : null;
    const currentHighest = currentPrices.length
      ? Math.max(...currentPrices)
      : null;
    const historicalLow = historicalPrices.length
      ? Math.min(...historicalPrices)
      : currentBest;
    const historicalAverage = historicalPrices.length
      ? historicalPrices.reduce((total, price) => total + price, 0) /
        historicalPrices.length
      : currentBest;
    const priceSpread =
      currentBest !== null && currentHighest !== null
        ? currentHighest - currentBest
        : null;
    const bestOffer = comparable.find(
      (offer) => offer.current_price === currentBest,
    );
    const strongestDrop = comparable.reduce<number | null>((drop, offer) => {
      if (offer.change_percent === null || offer.change_percent >= 0)
        return drop;
      return drop === null || offer.change_percent < drop
        ? offer.change_percent
        : drop;
    }, null);
    const sampleCount = historicalPrices.length;
    const signal =
      sampleCount < 2 || currentBest === null
        ? "limited_data"
        : historicalLow !== null && currentBest <= historicalLow * 1.02
          ? "historical_low"
          : historicalAverage !== null &&
              currentBest <= historicalAverage * 0.92
            ? "good_buy"
            : strongestDrop !== null && strongestDrop <= -5
              ? "price_drop"
              : "stable";

    return {
      currency_code: preferredCurrency,
      current_best_price: currentBest,
      current_highest_price: currentHighest,
      historical_low: historicalLow,
      historical_average:
        historicalAverage === null ? null : this.roundPrice(historicalAverage),
      price_spread: priceSpread,
      price_spread_percent:
        priceSpread !== null && currentBest
          ? Math.round((priceSpread / currentBest) * 1_000) / 10
          : null,
      best_link_id: bestOffer?.link_id ?? null,
      strongest_drop_percent: strongestDrop,
      sample_count: sampleCount,
      signal,
    };
  }

  private finitePrice(value: Prisma.Decimal | number | null) {
    if (value === null) return null;
    const price = Number(value);
    return Number.isFinite(price) ? price : null;
  }

  private roundPrice(value: number) {
    return Math.round(value * 100) / 100;
  }

  private syncErrorMessage(error: unknown) {
    const message =
      error instanceof Error ? error.message : "Không thể đọc dữ liệu nơi bán";
    return message.slice(0, 500);
  }

  private marketplaceHttpException(error: unknown) {
    if (error instanceof HttpException) return error;
    return new HttpException(
      this.syncErrorMessage(error),
      HttpStatus.UNPROCESSABLE_ENTITY,
    );
  }
}
