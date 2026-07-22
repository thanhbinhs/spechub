import { Injectable, NotFoundException } from "@nestjs/common";
import { Prisma } from "@spechub/database";
import {
  CreateAffiliateLinkDto,
  QueryAffiliateLinksDto,
} from "./dto/create-affiliate-link.dto";
import { CreateAffiliatePartnerDto } from "./dto/create-affiliate-partner.dto";
import { TrackAffiliateClickDto } from "./dto/track-affiliate-click.dto";
import { UpdateAffiliateLinkDto } from "./dto/update-affiliate-link.dto";
import { UpdateAffiliatePartnerDto } from "./dto/update-affiliate-partner.dto";
import { PrismaService } from "../../prisma/prisma.service";
import { MarketplacePriceService } from "./marketplace-price.service";

const AFFILIATE_PARTNER_SELECT = {
  id: true,
  name: true,
  slug: true,
  base_url: true,
  logo_url: true,
  commission_rate: true,
  is_active: true,
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
  currency_code: true,
  in_stock: true,
  last_checked_at: true,
  created_at: true,
  partner: {
    select: {
      id: true,
      name: true,
      slug: true,
      base_url: true,
      logo_url: true,
      commission_rate: true,
      is_active: true,
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
      orderBy: [{ is_active: "desc" }, { name: "asc" }],
    });

    return { data: partners };
  }

  async createPartner(
    dto: CreateAffiliatePartnerDto,
  ): Promise<AffiliatePartnerItem> {
    return this.prisma.affiliate_partners.create({
      data: {
        ...dto,
        is_active: dto.is_active ?? true,
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

    return { data: links };
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

  async createLink(dto: CreateAffiliateLinkDto): Promise<AffiliateLinkItem> {
    await Promise.all([
      this.ensurePartner(dto.partner_id),
      this.ensureVariant(dto.device_variant_id),
    ]);

    const link = await this.prisma.affiliate_links.create({
      data: {
        partner_id: dto.partner_id,
        device_variant_id: dto.device_variant_id,
        region_code: dto.region_code.toUpperCase(),
        product_url: dto.product_url,
        current_price: dto.current_price,
        currency_code: dto.currency_code.toUpperCase(),
        in_stock: dto.in_stock ?? true,
      },
      select: AFFILIATE_LINK_SELECT,
    });

    if (dto.current_price !== undefined) {
      await this.recordPrice(link.id, dto.current_price, link.currency_code);
    }

    return link;
  }

  async updateLink(
    id: string,
    dto: UpdateAffiliateLinkDto,
  ): Promise<AffiliateLinkItem> {
    const current = await this.findLink(id);
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

  async syncLink(
    id: string,
  ): Promise<AffiliateLinkItem & { sync_source: string }> {
    const link = await this.findLink(id);
    const offer = await this.marketplacePrices.fetchOffer({
      partnerSlug: link.partner.slug,
      partnerBaseUrl: link.partner.base_url,
      productUrl: link.product_url,
    });
    const updated = await this.updateLink(id, {
      current_price: offer.price,
      currency_code: offer.currency,
      in_stock: offer.inStock,
      ...(offer.productUrl ? { product_url: offer.productUrl } : {}),
    });
    return { ...updated, sync_source: offer.source };
  }

  async syncAllLinks() {
    const links = await this.prisma.affiliate_links.findMany({
      where: { partner: { is_active: true } },
      select: { id: true },
      orderBy: { last_checked_at: "asc" },
      take: 100,
    });
    const results = await Promise.allSettled(
      links.map((link) => this.syncLink(link.id)),
    );
    return {
      data: {
        checked: results.length,
        updated: results.filter((result) => result.status === "fulfilled")
          .length,
        failed: results.filter((result) => result.status === "rejected").length,
      },
    };
  }

  private async ensurePartner(id: string) {
    const partner = await this.prisma.affiliate_partners.findUnique({
      where: { id },
      select: { id: true },
    });

    if (!partner) {
      throw new NotFoundException(`Affiliate partner ${id} not found`);
    }
  }

  private async ensureVariant(id: string) {
    const variant = await this.prisma.device_variants.findFirst({
      where: { id, deleted_at: null },
      select: { id: true },
    });

    if (!variant) {
      throw new NotFoundException(`Device variant ${id} not found`);
    }
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
}
