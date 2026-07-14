import {
  BadRequestException,
  Injectable,
  Logger,
  NotFoundException,
  ServiceUnavailableException,
} from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { createHash, createHmac, timingSafeEqual } from "node:crypto";
import { Prisma } from "@spechub/database";
import { PrismaService } from "../../prisma/prisma.service";
import { AssignSubscriptionDto } from "./dto/assign-subscription.dto";
import { CreateCheckoutDto } from "./dto/create-checkout.dto";
import { CreateSubscriptionPlanDto } from "./dto/create-subscription-plan.dto";
import { QueryBillingAuditDto } from "./dto/query-billing-audit.dto";
import { UpdateSubscriptionPlanDto } from "./dto/update-subscription-plan.dto";

const PLAN_SELECT = {
  id: true,
  code: true,
  name: true,
  description: true,
  price_monthly: true,
  price_yearly: true,
  currency_code: true,
  features: true,
  is_active: true,
  stripe_price_monthly_id: true,
  stripe_price_yearly_id: true,
  created_at: true,
} satisfies Prisma.subscription_plansSelect;

const SUBSCRIPTION_SELECT = {
  id: true,
  user_id: true,
  plan_id: true,
  provider: true,
  status: true,
  billing_cycle: true,
  stripe_customer_id: true,
  stripe_sub_id: true,
  current_period_end: true,
  cancel_at_period_end: true,
  cancelled_at: true,
  ended_at: true,
  last_payment_at: true,
  last_payment_error: true,
  created_at: true,
  updated_at: true,
  plan: {
    select: PLAN_SELECT,
  },
} satisfies Prisma.subscriptionsSelect;

export type SubscriptionPlanItem = Prisma.subscription_plansGetPayload<{
  select: typeof PLAN_SELECT;
}>;

export type SubscriptionItem = Prisma.subscriptionsGetPayload<{
  select: typeof SUBSCRIPTION_SELECT;
}>;

const BILLING_AUDIT_SELECT = {
  id: true,
  subscription_id: true,
  user_id: true,
  provider: true,
  action: true,
  status: true,
  external_event_id: true,
  details: true,
  error_message: true,
  created_at: true,
} satisfies Prisma.billing_audit_logsSelect;

type StripeObject = Record<string, unknown>;

type StripeEvent = {
  id: string;
  type: string;
  data: { object: StripeObject };
};

type StripeCheckoutSession = {
  id: string;
  url: string | null;
};

type StripeInvoiceList = {
  data?: StripeObject[];
};

@Injectable()
export class SubscriptionsService {
  private readonly logger = new Logger(SubscriptionsService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly configService: ConfigService,
  ) {}

  async listPlans(): Promise<{ data: SubscriptionPlanItem[] }> {
    const plans = await this.prisma.subscription_plans.findMany({
      where: { is_active: true },
      select: PLAN_SELECT,
      orderBy: [{ price_monthly: "asc" }],
    });

    return { data: plans };
  }

  async listPlansForAdmin(): Promise<{ data: SubscriptionPlanItem[] }> {
    const plans = await this.prisma.subscription_plans.findMany({
      select: PLAN_SELECT,
      orderBy: [{ is_active: "desc" }, { price_monthly: "asc" }],
    });

    return { data: plans };
  }

  async getMe(userId: string) {
    const subscription = await this.prisma.subscriptions.findUnique({
      where: { user_id: userId },
      select: SUBSCRIPTION_SELECT,
    });
    const plan = subscription?.plan ?? (await this.getFreePlan());

    return {
      data: {
        subscription,
        plan,
        features: plan.features,
      },
    };
  }

  async createCheckout(userId: string, dto: CreateCheckoutDto) {
    const plan = await this.prisma.subscription_plans.findUnique({
      where: { code: dto.plan_code },
      select: PLAN_SELECT,
    });

    if (!plan || !plan.is_active) {
      throw new NotFoundException(`Plan ${dto.plan_code} not found`);
    }

    if (plan.code === "free") {
      throw new BadRequestException("The free plan does not require checkout");
    }
    if (dto.billing_cycle === "manual") {
      throw new BadRequestException(
        "Manual billing is reserved for an admin-assigned entitlement",
      );
    }

    if (!this.isStripeConfigured()) {
      await this.recordAudit({
        userId,
        provider: "stripe",
        action: "checkout_requested",
        status: "not_configured",
        details: { plan_code: plan.code, billing_cycle: dto.billing_cycle },
      });

      return {
        data: {
          provider: "stripe",
          status: "not_configured",
          user_id: userId,
          plan,
          billing_cycle: dto.billing_cycle,
          message:
            "Stripe secret and webhook credentials must be configured before accepting checkout.",
        },
      };
    }

    const session = await this.createStripeCheckoutSession(userId, plan, dto);

    await this.recordAudit({
      userId,
      provider: "stripe",
      action: "checkout_created",
      status: "pending",
      externalEventId: session.id,
      details: { plan_code: plan.code, billing_cycle: dto.billing_cycle },
    });

    return {
      data: {
        provider: "stripe",
        status: "pending",
        user_id: userId,
        plan,
        billing_cycle: dto.billing_cycle,
        checkout_id: session.id,
        checkout_url: session.url,
      },
    };
  }

  async assignUserSubscription(
    userId: string,
    dto: AssignSubscriptionDto,
  ): Promise<SubscriptionItem> {
    await this.ensurePlan(dto.plan_id);

    return this.prisma.$transaction(async (tx) => {
      const subscription = await tx.subscriptions.upsert({
        where: { user_id: userId },
        update: {
          plan_id: dto.plan_id,
          provider: "manual",
          status: dto.status ?? "active",
          billing_cycle: dto.billing_cycle,
          current_period_end: dto.current_period_end,
          cancel_at_period_end: dto.cancel_at_period_end ?? false,
          cancelled_at: null,
          ended_at: null,
          last_payment_error: null,
          stripe_customer_id: null,
          stripe_sub_id: null,
        },
        create: {
          user_id: userId,
          plan_id: dto.plan_id,
          provider: "manual",
          status: dto.status ?? "active",
          billing_cycle: dto.billing_cycle,
          current_period_end: dto.current_period_end,
          cancel_at_period_end: dto.cancel_at_period_end ?? false,
        },
        select: SUBSCRIPTION_SELECT,
      });

      await tx.billing_audit_logs.create({
        data: {
          subscription_id: subscription.id,
          user_id: userId,
          provider: "manual",
          action: "subscription_assigned",
          status: subscription.status,
          details: this.toJson({
            plan_id: dto.plan_id,
            billing_cycle: dto.billing_cycle,
          }),
        },
      });

      return subscription;
    });
  }

  async createPlan(dto: CreateSubscriptionPlanDto): Promise<SubscriptionPlanItem> {
    return this.prisma.subscription_plans.create({
      data: {
        ...dto,
        features: this.toJson(dto.features),
        is_active: dto.is_active ?? true,
      },
      select: PLAN_SELECT,
    });
  }

  async updatePlan(
    id: string,
    dto: UpdateSubscriptionPlanDto,
  ): Promise<SubscriptionPlanItem> {
    await this.ensurePlan(id);
    const { features, ...planData } = dto;

    return this.prisma.subscription_plans.update({
      where: { id },
      data: {
        ...planData,
        ...(features !== undefined && {
          features: this.toJson(features as Record<string, unknown>),
        }),
      },
      select: PLAN_SELECT,
    });
  }

  async cancelMySubscription(userId: string): Promise<SubscriptionItem> {
    const subscription = await this.findSubscriptionForUser(userId);

    if (subscription.provider === "stripe" && subscription.stripe_sub_id) {
      await this.stripeRequest<StripeObject>(
        `/subscriptions/${subscription.stripe_sub_id}`,
        new URLSearchParams({ cancel_at_period_end: "true" }),
      );
    }

    const now = new Date();
    const updated = await this.prisma.subscriptions.update({
      where: { id: subscription.id },
      data:
        subscription.provider === "manual"
          ? {
              status: "canceled",
              cancel_at_period_end: false,
              cancelled_at: now,
              ended_at: now,
            }
          : {
              cancel_at_period_end: true,
              cancelled_at: now,
            },
      select: SUBSCRIPTION_SELECT,
    });

    await this.recordAudit({
      subscriptionId: updated.id,
      userId,
      provider: updated.provider,
      action: "subscription_cancel_requested",
      status: updated.status,
      details: { cancel_at_period_end: updated.cancel_at_period_end },
    });

    return updated;
  }

  async resumeMySubscription(userId: string): Promise<SubscriptionItem> {
    const subscription = await this.findSubscriptionForUser(userId);

    if (subscription.status === "canceled" || subscription.ended_at) {
      throw new BadRequestException(
        "A canceled subscription must be purchased again instead of resumed",
      );
    }

    if (subscription.provider === "stripe" && subscription.stripe_sub_id) {
      await this.stripeRequest<StripeObject>(
        `/subscriptions/${subscription.stripe_sub_id}`,
        new URLSearchParams({ cancel_at_period_end: "false" }),
      );
    }

    const updated = await this.prisma.subscriptions.update({
      where: { id: subscription.id },
      data: { cancel_at_period_end: false, cancelled_at: null },
      select: SUBSCRIPTION_SELECT,
    });

    await this.recordAudit({
      subscriptionId: updated.id,
      userId,
      provider: updated.provider,
      action: "subscription_resumed",
      status: updated.status,
    });

    return updated;
  }

  async retryMyPayment(userId: string): Promise<SubscriptionItem> {
    const subscription = await this.findSubscriptionForUser(userId);

    if (!['past_due', 'incomplete'].includes(subscription.status)) {
      throw new BadRequestException("The subscription does not have a retryable payment");
    }

    if (subscription.provider !== "stripe" || !subscription.stripe_sub_id) {
      throw new BadRequestException(
        "Payment retry is available only for Stripe subscriptions",
      );
    }

    try {
      const invoices = await this.stripeRequest<StripeInvoiceList>(
        `/invoices?subscription=${encodeURIComponent(subscription.stripe_sub_id)}&status=open&limit=1`,
      );
      const invoiceId = this.getString(invoices.data?.[0], "id");

      if (!invoiceId) {
        throw new BadRequestException("No open Stripe invoice is available to retry");
      }

      await this.stripeRequest<StripeObject>(`/invoices/${invoiceId}/pay`, new URLSearchParams());
      const updated = await this.prisma.subscriptions.update({
        where: { id: subscription.id },
        data: { status: "active", last_payment_at: new Date(), last_payment_error: null },
        select: SUBSCRIPTION_SELECT,
      });

      await this.recordAudit({
        subscriptionId: updated.id,
        userId,
        provider: "stripe",
        action: "payment_retry",
        status: "succeeded",
        details: { invoice_id: invoiceId },
      });

      return updated;
    } catch (error) {
      await this.recordAudit({
        subscriptionId: subscription.id,
        userId,
        provider: "stripe",
        action: "payment_retry",
        status: "failed",
        errorMessage: this.errorMessage(error),
      });
      throw error;
    }
  }

  async listMyAudit(userId: string, query: QueryBillingAuditDto) {
    return this.listAudit({ ...query, user_id: userId });
  }

  async listAudit(query: QueryBillingAuditDto) {
    const data = await this.prisma.billing_audit_logs.findMany({
      where: query.user_id ? { user_id: query.user_id } : undefined,
      select: BILLING_AUDIT_SELECT,
      orderBy: { created_at: "desc" },
      take: query.limit ?? 50,
    });

    return { data };
  }

  async handleWebhook(
    provider: string,
    rawBody: Buffer | undefined,
    signature: string | undefined,
  ) {
    if (provider !== "stripe") {
      throw new NotFoundException(`Unsupported billing provider: ${provider}`);
    }

    if (!rawBody) {
      throw new BadRequestException("Webhook raw body is unavailable");
    }

    const event = this.verifyStripeWebhook(rawBody, signature);
    const payloadHash = createHash("sha256").update(rawBody).digest("hex");

    try {
      await this.prisma.billing_webhook_events.create({
        data: {
          provider,
          external_event_id: event.id,
          event_type: event.type,
          payload_hash: payloadHash,
        },
      });
    } catch (error) {
      if (this.isUniqueConstraintError(error)) {
        return {
          data: { provider, event_id: event.id, received: true, duplicate: true },
        };
      }
      throw error;
    }

    try {
      await this.processStripeEvent(event);
      await this.prisma.billing_webhook_events.update({
        where: {
          provider_external_event_id: {
            provider,
            external_event_id: event.id,
          },
        },
        data: { status: "processed", processed_at: new Date() },
      });

      return {
        data: { provider, event_id: event.id, received: true, processed: true },
      };
    } catch (error) {
      const message = this.errorMessage(error);
      await this.prisma.billing_webhook_events.update({
        where: {
          provider_external_event_id: {
            provider,
            external_event_id: event.id,
          },
        },
        data: { status: "failed", error_message: message },
      });
      this.logger.error(`Stripe webhook ${event.id} failed: ${message}`);
      throw error;
    }
  }

  private async getFreePlan(): Promise<SubscriptionPlanItem> {
    const plan = await this.prisma.subscription_plans.findUnique({
      where: { code: "free" },
      select: PLAN_SELECT,
    });

    if (!plan) {
      throw new NotFoundException("Free plan not found");
    }

    return plan;
  }

  private async ensurePlan(planId: string) {
    const plan = await this.prisma.subscription_plans.findFirst({
      where: { OR: [{ id: planId }, { code: planId }] },
      select: { id: true },
    });

    if (!plan) {
      throw new NotFoundException(`Plan ${planId} not found`);
    }
  }

  private async findSubscriptionForUser(userId: string): Promise<SubscriptionItem> {
    const subscription = await this.prisma.subscriptions.findUnique({
      where: { user_id: userId },
      select: SUBSCRIPTION_SELECT,
    });

    if (!subscription) {
      throw new NotFoundException("No paid subscription was found for this user");
    }

    return subscription;
  }

  private isStripeConfigured() {
    return Boolean(
      this.configService.get<string>("STRIPE_SECRET_KEY") &&
        this.configService.get<string>("STRIPE_WEBHOOK_SECRET"),
    );
  }

  private async createStripeCheckoutSession(
    userId: string,
    plan: SubscriptionPlanItem,
    dto: CreateCheckoutDto,
  ) {
    const priceId =
      dto.billing_cycle === "yearly"
        ? plan.stripe_price_yearly_id
        : plan.stripe_price_monthly_id;
    const billingInterval = dto.billing_cycle === "yearly" ? "year" : "month";
    const frontendUrl = this.configService.get<string>("FRONTEND_URL");

    if (!frontendUrl) {
      throw new ServiceUnavailableException("FRONTEND_URL must be configured for Stripe checkout");
    }

    const successUrl = new URL("/billing?checkout=success&session_id={CHECKOUT_SESSION_ID}", frontendUrl).toString();
    const cancelUrl = new URL("/billing?checkout=cancelled", frontendUrl).toString();
    const form = new URLSearchParams({
      mode: "subscription",
      success_url: successUrl,
      cancel_url: cancelUrl,
      client_reference_id: userId,
      "metadata[user_id]": userId,
      "metadata[plan_code]": plan.code,
      "metadata[billing_cycle]": dto.billing_cycle,
      "subscription_data[metadata][user_id]": userId,
      "subscription_data[metadata][plan_code]": plan.code,
      "subscription_data[metadata][billing_cycle]": dto.billing_cycle,
    });

    if (priceId) {
      form.set("line_items[0][price]", priceId);
    } else {
      form.set("line_items[0][price_data][currency]", plan.currency_code.toLowerCase());
      form.set(
        "line_items[0][price_data][unit_amount]",
        String(this.toMinorUnits(dto.billing_cycle === "yearly" ? plan.price_yearly : plan.price_monthly, plan.currency_code)),
      );
      form.set("line_items[0][price_data][recurring][interval]", billingInterval);
      form.set("line_items[0][price_data][product_data][name]", `${plan.name} (${dto.billing_cycle})`);
    }
    form.set("line_items[0][quantity]", "1");

    const session = await this.stripeRequest<StripeCheckoutSession>(
      "/checkout/sessions",
      form,
    );
    if (!session.id || !session.url) {
      throw new ServiceUnavailableException("Stripe did not return a checkout URL");
    }

    return session;
  }

  private async stripeRequest<T>(path: string, body?: URLSearchParams): Promise<T> {
    const secret = this.configService.get<string>("STRIPE_SECRET_KEY");
    if (!secret) {
      throw new ServiceUnavailableException("Stripe is not configured");
    }

    const response = await fetch(`https://api.stripe.com/v1${path}`, {
      method: body ? "POST" : "GET",
      headers: {
        Authorization: `Bearer ${secret}`,
        ...(body ? { "Content-Type": "application/x-www-form-urlencoded" } : {}),
      },
      body: body?.toString(),
    });
    const payload: unknown = await response.json().catch(() => null);

    if (!response.ok) {
      const message = this.getString(payload, "message") ?? "Stripe request failed";
      throw new BadRequestException(message);
    }

    return payload as T;
  }

  private verifyStripeWebhook(
    rawBody: Buffer,
    signatureHeader: string | undefined,
  ): StripeEvent {
    const secret = this.configService.get<string>("STRIPE_WEBHOOK_SECRET");
    if (!secret) {
      throw new ServiceUnavailableException("STRIPE_WEBHOOK_SECRET is not configured");
    }
    if (!signatureHeader) {
      throw new BadRequestException("Missing Stripe signature");
    }

    const entries = signatureHeader.split(",").map((entry) => entry.split("="));
    const timestamp = entries.find(([key]) => key === "t")?.[1];
    const signatures = entries
      .filter(([key]) => key === "v1")
      .map(([, value]) => value)
      .filter((value): value is string => Boolean(value));
    const toleranceSeconds = Number(
      this.configService.get<string>("STRIPE_WEBHOOK_TOLERANCE_SECONDS", "300"),
    );

    if (!timestamp || !signatures.length || !/^\d+$/.test(timestamp)) {
      throw new BadRequestException("Malformed Stripe signature");
    }
    if (Math.abs(Date.now() / 1_000 - Number(timestamp)) > toleranceSeconds) {
      throw new BadRequestException("Expired Stripe webhook signature");
    }

    const expected = createHmac("sha256", secret)
      .update(`${timestamp}.${rawBody.toString("utf8")}`)
      .digest("hex");
    const expectedBuffer = Buffer.from(expected, "hex");
    const verified = signatures.some((signature) => {
      const candidate = Buffer.from(signature, "hex");
      return (
        candidate.length === expectedBuffer.length &&
        timingSafeEqual(candidate, expectedBuffer)
      );
    });

    if (!verified) {
      throw new BadRequestException("Invalid Stripe webhook signature");
    }

    const parsed: unknown = JSON.parse(rawBody.toString("utf8"));
    if (!this.isRecord(parsed) || !this.isRecord(parsed.data) || !this.isRecord(parsed.data.object)) {
      throw new BadRequestException("Malformed Stripe webhook payload");
    }

    const id = this.getString(parsed, "id");
    const type = this.getString(parsed, "type");
    if (!id || !type) {
      throw new BadRequestException("Stripe webhook is missing id or type");
    }

    return { id, type, data: { object: parsed.data.object } };
  }

  private async processStripeEvent(event: StripeEvent) {
    switch (event.type) {
      case "checkout.session.completed":
        await this.syncCheckoutSession(event);
        return;
      case "customer.subscription.created":
      case "customer.subscription.updated":
      case "customer.subscription.deleted":
        await this.syncStripeSubscription(event);
        return;
      case "invoice.paid":
        await this.syncInvoice(event, true);
        return;
      case "invoice.payment_failed":
        await this.syncInvoice(event, false);
        return;
      default:
        await this.recordAudit({
          provider: "stripe",
          action: "webhook_ignored",
          status: "ignored",
          externalEventId: event.id,
          details: { event_type: event.type },
        });
    }
  }

  private async syncCheckoutSession(event: StripeEvent) {
    const object = event.data.object;
    const metadata = this.getRecord(object, "metadata");
    const userId = this.getString(metadata, "user_id") ?? this.getString(object, "client_reference_id");
    const planCode = this.getString(metadata, "plan_code");
    const subscriptionId = this.getString(object, "subscription");
    const customerId = this.getString(object, "customer");

    if (!userId || !planCode) {
      throw new BadRequestException("Checkout session is missing subscription metadata");
    }

    const plan = await this.findPlanByCode(planCode);
    const subscription = await this.prisma.$transaction(async (tx) => {
      const current = await tx.subscriptions.upsert({
        where: { user_id: userId },
        update: {
          plan_id: plan.id,
          provider: "stripe",
          status: "active",
          billing_cycle: this.getString(metadata, "billing_cycle") ?? "monthly",
          stripe_customer_id: customerId,
          stripe_sub_id: subscriptionId,
          last_payment_at: new Date(),
          last_payment_error: null,
        },
        create: {
          user_id: userId,
          plan_id: plan.id,
          provider: "stripe",
          status: "active",
          billing_cycle: this.getString(metadata, "billing_cycle") ?? "monthly",
          stripe_customer_id: customerId,
          stripe_sub_id: subscriptionId,
          last_payment_at: new Date(),
        },
        select: SUBSCRIPTION_SELECT,
      });

      await tx.billing_audit_logs.create({
        data: {
          subscription_id: current.id,
          user_id: userId,
          provider: "stripe",
          action: "checkout_completed",
          status: "succeeded",
          external_event_id: event.id,
          details: this.toJson({ plan_code: planCode, checkout_session_id: this.getString(object, "id") }),
        },
      });
      return current;
    });

    await this.createSubscriptionNotification(
      subscription.user_id,
      "Payment received",
      `Your ${subscription.plan.name} subscription is active.`,
      { subscription_id: subscription.id, plan_code: plan.code },
    );
  }

  private async syncStripeSubscription(event: StripeEvent) {
    const object = event.data.object;
    const metadata = this.getRecord(object, "metadata");
    const stripeSubId = this.getString(object, "id");
    const existing = stripeSubId
      ? await this.prisma.subscriptions.findUnique({
          where: { stripe_sub_id: stripeSubId },
          select: SUBSCRIPTION_SELECT,
        })
      : null;
    const userId = existing?.user_id ?? this.getString(metadata, "user_id");
    const planCode = this.getString(metadata, "plan_code") ?? existing?.plan.code;

    if (!userId || !planCode) {
      throw new BadRequestException("Stripe subscription is missing SpecHub metadata");
    }

    const plan = await this.findPlanByCode(planCode);
    const status = this.normalizeStripeStatus(this.getString(object, "status"));
    const currentPeriodEnd = this.unixTimestamp(this.getNumber(object, "current_period_end"));
    const cancelAtPeriodEnd = this.getBoolean(object, "cancel_at_period_end") ?? false;
    const endedAt = this.unixTimestamp(this.getNumber(object, "ended_at"));
    const canceledAt = this.unixTimestamp(this.getNumber(object, "canceled_at"));
    const billingCycle = this.getSubscriptionInterval(object) ?? existing?.billing_cycle ?? "monthly";

    const subscription = await this.prisma.$transaction(async (tx) => {
      const current = await tx.subscriptions.upsert({
        where: { user_id: userId },
        update: {
          plan_id: plan.id,
          provider: "stripe",
          status,
          billing_cycle: billingCycle,
          stripe_customer_id: this.getString(object, "customer") ?? existing?.stripe_customer_id,
          stripe_sub_id: stripeSubId ?? existing?.stripe_sub_id,
          current_period_end: currentPeriodEnd,
          cancel_at_period_end: cancelAtPeriodEnd,
          cancelled_at: canceledAt,
          ended_at: endedAt,
        },
        create: {
          user_id: userId,
          plan_id: plan.id,
          provider: "stripe",
          status,
          billing_cycle: billingCycle,
          stripe_customer_id: this.getString(object, "customer"),
          stripe_sub_id: stripeSubId,
          current_period_end: currentPeriodEnd,
          cancel_at_period_end: cancelAtPeriodEnd,
          cancelled_at: canceledAt,
          ended_at: endedAt,
        },
        select: SUBSCRIPTION_SELECT,
      });
      await tx.billing_audit_logs.create({
        data: {
          subscription_id: current.id,
          user_id: userId,
          provider: "stripe",
          action: "subscription_synced",
          status,
          external_event_id: event.id,
          details: this.toJson({ event_type: event.type, plan_code: planCode }),
        },
      });
      return current;
    });

    await this.createSubscriptionNotification(
      subscription.user_id,
      "Subscription updated",
      `Your ${subscription.plan.name} subscription is now ${subscription.status}.`,
      { subscription_id: subscription.id, status: subscription.status },
    );
  }

  private async syncInvoice(event: StripeEvent, paid: boolean) {
    const object = event.data.object;
    const stripeSubId = this.getString(object, "subscription");
    if (!stripeSubId) {
      throw new BadRequestException("Invoice is missing a Stripe subscription id");
    }

    const subscription = await this.prisma.subscriptions.findUnique({
      where: { stripe_sub_id: stripeSubId },
      select: SUBSCRIPTION_SELECT,
    });
    if (!subscription) {
      throw new NotFoundException("Stripe invoice has no matching SpecHub subscription");
    }

    const errorMessage = paid
      ? null
      : this.getString(this.getRecord(object, "last_finalization_error"), "message") ??
        "Stripe payment failed";
    const updated = await this.prisma.$transaction(async (tx) => {
      const current = await tx.subscriptions.update({
        where: { id: subscription.id },
        data: paid
          ? { status: "active", last_payment_at: new Date(), last_payment_error: null }
          : { status: "past_due", last_payment_error: errorMessage },
        select: SUBSCRIPTION_SELECT,
      });
      await tx.billing_audit_logs.create({
        data: {
          subscription_id: current.id,
          user_id: current.user_id,
          provider: "stripe",
          action: paid ? "invoice_paid" : "invoice_payment_failed",
          status: paid ? "succeeded" : "failed",
          external_event_id: event.id,
          details: this.toJson({ invoice_id: this.getString(object, "id") }),
          error_message: errorMessage,
        },
      });
      return current;
    });

    await this.createSubscriptionNotification(
      updated.user_id,
      paid ? "Payment received" : "Payment failed",
      paid
        ? `Your ${updated.plan.name} billing payment was received.`
        : "We could not process your subscription payment. Update payment details and retry.",
      { subscription_id: updated.id, invoice_id: this.getString(object, "id") },
    );
  }

  private async createSubscriptionNotification(
    userId: string,
    title: string,
    body: string,
    data: Record<string, unknown>,
  ) {
    const user = await this.prisma.users.findUnique({
      where: { id: userId },
      select: { email: true },
    });
    if (!user) {
      throw new NotFoundException(`User ${userId} not found`);
    }

    await this.prisma.notifications.create({
      data: {
        user_id: userId,
        type: "subscription_updated",
        title,
        body,
        data: this.toJson(data),
        deliveries: {
          create: {
            channel: "email",
            recipient: user.email,
          },
        },
      },
    });
  }

  private async findPlanByCode(code: string) {
    const plan = await this.prisma.subscription_plans.findUnique({
      where: { code },
      select: PLAN_SELECT,
    });
    if (!plan) {
      throw new NotFoundException(`Plan ${code} not found`);
    }
    return plan;
  }

  private async recordAudit(input: {
    subscriptionId?: string;
    userId?: string;
    provider: string;
    action: string;
    status: string;
    externalEventId?: string;
    details?: Record<string, unknown>;
    errorMessage?: string;
  }) {
    return this.prisma.billing_audit_logs.create({
      data: {
        subscription_id: input.subscriptionId,
        user_id: input.userId,
        provider: input.provider,
        action: input.action,
        status: input.status,
        external_event_id: input.externalEventId,
        details: input.details ? this.toJson(input.details) : undefined,
        error_message: input.errorMessage,
      },
    });
  }

  private toMinorUnits(value: Prisma.Decimal | number, currencyCode: string) {
    const zeroDecimalCurrencies = new Set([
      "BIF",
      "CLP",
      "DJF",
      "GNF",
      "JPY",
      "KMF",
      "KRW",
      "MGA",
      "PYG",
      "RWF",
      "UGX",
      "VND",
      "VUV",
      "XAF",
      "XOF",
      "XPF",
    ]);
    const decimal = Number(value);
    const amount = zeroDecimalCurrencies.has(currencyCode.toUpperCase())
      ? decimal
      : decimal * 100;

    if (!Number.isSafeInteger(Math.round(amount)) || amount < 0) {
      throw new BadRequestException("Plan price cannot be represented by Stripe");
    }
    return Math.round(amount);
  }

  private normalizeStripeStatus(status: string | undefined) {
    return ["active", "trialing", "past_due", "canceled", "incomplete"].includes(
      status ?? "",
    )
      ? status!
      : "incomplete";
  }

  private getSubscriptionInterval(object: StripeObject) {
    const items = this.getRecord(object, "items");
    const itemList = Array.isArray(items?.data) ? items.data : [];
    const first = itemList[0];
    const price = this.isRecord(first) ? this.getRecord(first, "price") : undefined;
    const recurring = this.getRecord(price, "recurring");
    const interval = this.getString(recurring, "interval");
    return interval === "year" ? "yearly" : interval === "month" ? "monthly" : undefined;
  }

  private unixTimestamp(value: number | undefined) {
    return value ? new Date(value * 1_000) : null;
  }

  private isUniqueConstraintError(error: unknown) {
    return (
      error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002"
    );
  }

  private errorMessage(error: unknown) {
    return error instanceof Error ? error.message.slice(0, 2_000) : "Unknown billing error";
  }

  private isRecord(value: unknown): value is StripeObject {
    return typeof value === "object" && value !== null && !Array.isArray(value);
  }

  private getRecord(value: unknown, key: string) {
    return this.isRecord(value) && this.isRecord(value[key]) ? value[key] : undefined;
  }

  private getString(value: unknown, key: string) {
    return this.isRecord(value) && typeof value[key] === "string" ? value[key] : undefined;
  }

  private getNumber(value: unknown, key: string) {
    return this.isRecord(value) && typeof value[key] === "number" ? value[key] : undefined;
  }

  private getBoolean(value: unknown, key: string) {
    return this.isRecord(value) && typeof value[key] === "boolean" ? value[key] : undefined;
  }

  private toJson(value: Record<string, unknown>): Prisma.InputJsonValue {
    return value as Prisma.InputJsonValue;
  }
}
