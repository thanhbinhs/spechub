import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import { Prisma } from "@spechub/database";
import { checkActivePriceAlerts } from "@spechub/alerts-core";
import { USER_ROLES, type UserRole } from "../../common/constants";
import { PrismaService } from "../../prisma/prisma.service";
import { CreatePriceAlertDto } from "./dto/create-price-alert.dto";
import { UpdatePriceAlertDto } from "./dto/update-price-alert.dto";

const PRICE_ALERT_SELECT = {
  id: true,
  user_id: true,
  device_variant_id: true,
  target_price: true,
  currency_code: true,
  region_code: true,
  is_active: true,
  triggered_at: true,
  created_at: true,
  device_variant: {
    select: {
      id: true,
      variant_name: true,
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
} satisfies Prisma.price_alertsSelect;

export type PriceAlertItem = Prisma.price_alertsGetPayload<{
  select: typeof PRICE_ALERT_SELECT;
}>;

@Injectable()
export class AlertsService {
  constructor(private readonly prisma: PrismaService) {}

  async findMany(userId: string): Promise<{ data: PriceAlertItem[] }> {
    const alerts = await this.prisma.price_alerts.findMany({
      where: { user_id: userId },
      select: PRICE_ALERT_SELECT,
      orderBy: [{ is_active: "desc" }, { created_at: "desc" }],
    });

    return { data: alerts };
  }

  async create(
    userId: string,
    dto: CreatePriceAlertDto,
  ): Promise<PriceAlertItem> {
    await this.ensureCanCreatePriceAlert(userId);
    await this.ensureVariant(dto.device_variant_id);

    const currencyCode = dto.currency_code.toUpperCase();
    const regionCode = dto.region_code.toUpperCase();
    const existingAlert = await this.prisma.price_alerts.findFirst({
      where: {
        user_id: userId,
        device_variant_id: dto.device_variant_id,
        currency_code: currencyCode,
        region_code: regionCode,
      },
      select: { id: true },
      orderBy: { created_at: "desc" },
    });

    if (existingAlert) {
      return this.prisma.price_alerts.update({
        where: { id: existingAlert.id },
        data: {
          target_price: dto.target_price,
          is_active: true,
          triggered_at: null,
        },
        select: PRICE_ALERT_SELECT,
      });
    }

    return this.prisma.price_alerts.create({
      data: {
        user_id: userId,
        device_variant_id: dto.device_variant_id,
        target_price: dto.target_price,
        currency_code: currencyCode,
        region_code: regionCode,
      },
      select: PRICE_ALERT_SELECT,
    });
  }

  async update(
    userId: string,
    role: UserRole,
    id: string,
    dto: UpdatePriceAlertDto,
  ): Promise<PriceAlertItem> {
    await this.ensureWritable(userId, role, id);

    return this.prisma.price_alerts.update({
      where: { id },
      data: {
        ...(dto.target_price !== undefined && {
          target_price: dto.target_price,
        }),
        ...(dto.currency_code !== undefined && {
          currency_code: dto.currency_code.toUpperCase(),
        }),
        ...(dto.region_code !== undefined && {
          region_code: dto.region_code.toUpperCase(),
        }),
        ...(dto.is_active !== undefined && {
          is_active: dto.is_active,
          ...(dto.is_active && { triggered_at: null }),
        }),
      },
      select: PRICE_ALERT_SELECT,
    });
  }

  async remove(userId: string, role: UserRole, id: string) {
    await this.ensureWritable(userId, role, id);

    const alert = await this.prisma.price_alerts.update({
      where: { id },
      data: { is_active: false },
      select: PRICE_ALERT_SELECT,
    });

    return alert;
  }

  async checkActiveAlerts() {
    return checkActivePriceAlerts(this.prisma);
  }

  private async ensureCanCreatePriceAlert(userId: string) {
    const features = await this.getEffectiveFeatures(userId);
    if (features.price_alerts === true) return;

    throw new ForbiddenException("Price alerts require a Pro or Team plan");
  }

  private async getEffectiveFeatures(userId: string) {
    const subscription = await this.prisma.subscriptions.findUnique({
      where: { user_id: userId },
      select: {
        plan: {
          select: {
            features: true,
          },
        },
      },
    });

    if (subscription?.plan.features) {
      return subscription.plan.features as Record<string, unknown>;
    }

    const freePlan = await this.prisma.subscription_plans.findUnique({
      where: { code: "free" },
      select: { features: true },
    });

    return (freePlan?.features ?? {}) as Record<string, unknown>;
  }

  private async ensureWritable(
    userId: string,
    role: UserRole,
    alertId: string,
  ) {
    const alert = await this.prisma.price_alerts.findUnique({
      where: { id: alertId },
      select: { id: true, user_id: true },
    });

    if (!alert) {
      throw new NotFoundException(`Price alert ${alertId} not found`);
    }

    if (alert.user_id !== userId && role !== USER_ROLES.ADMIN) {
      throw new ForbiddenException("You do not own this price alert");
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
}
