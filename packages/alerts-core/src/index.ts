import type { PrismaClient } from "@spechub/database";

export type PriceAlertCheckResult = {
  data: {
    checked: number;
    triggered: number;
  };
};

export async function checkActivePriceAlerts(
  prisma: PrismaClient,
): Promise<PriceAlertCheckResult> {
  const alerts = await prisma.price_alerts.findMany({
    where: {
      is_active: true,
      triggered_at: null,
    },
    select: {
      id: true,
      user_id: true,
      user: {
        select: {
          email: true,
        },
      },
      target_price: true,
      currency_code: true,
      region_code: true,
      device_variant: {
        select: {
          id: true,
          variant_name: true,
          device_model: {
            select: {
              name: true,
              slug: true,
            },
          },
          affiliate_links: {
            where: {
              in_stock: true,
            },
            select: {
              id: true,
              current_price: true,
              currency_code: true,
              region_code: true,
              product_url: true,
              partner: {
                select: {
                  name: true,
                },
              },
            },
          },
        },
      },
    },
  });
  let triggered = 0;

  for (const alert of alerts) {
    const matchingLink = alert.device_variant.affiliate_links.find((link) => {
      if (!link.current_price) return false;
      return (
        link.currency_code === alert.currency_code &&
        link.region_code === alert.region_code &&
        Number(link.current_price) <= Number(alert.target_price)
      );
    });

    if (!matchingLink) continue;

    const wasTriggered = await prisma.$transaction(async (tx) => {
      const changed = await tx.price_alerts.updateMany({
        where: {
          id: alert.id,
          is_active: true,
          triggered_at: null,
        },
        data: {
          triggered_at: new Date(),
          is_active: false,
        },
      });

      if (changed.count !== 1) return false;

      await tx.notifications.create({
        data: {
          user_id: alert.user_id,
          type: "price_alert_triggered",
          title: `${alert.device_variant.device_model.name} hit your target price`,
          body: `${alert.device_variant.variant_name} is now ${matchingLink.current_price} ${matchingLink.currency_code} at ${matchingLink.partner.name}.`,
          data: {
            price_alert_id: alert.id,
            affiliate_link_id: matchingLink.id,
            device_variant_id: alert.device_variant.id,
            device_slug: alert.device_variant.device_model.slug,
            product_url: matchingLink.product_url,
          },
          deliveries: {
            create: {
              channel: "email",
              recipient: alert.user.email,
            },
          },
        },
      });

      return true;
    });

    if (wasTriggered) triggered += 1;
  }

  return {
    data: {
      checked: alerts.length,
      triggered,
    },
  };
}
