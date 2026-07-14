import { config } from "dotenv";
import { checkActivePriceAlerts } from "@spechub/alerts-core";
import { PrismaClient } from "@spechub/database";
import { crawlActiveSources } from "./crawler";
import { deliverPendingNotificationEmails } from "./notification-email";

config({
  path: [".env.local", ".env", "../../.env.local", "../../.env"],
});

const priceAlertsEnabled = ["true", "1"].includes(
  (process.env.PRICE_ALERTS_WORKER_ENABLED ?? "false").toLowerCase(),
);
const priceAlertsIntervalMinutes = Number(
  process.env.PRICE_ALERTS_INTERVAL_MINUTES ?? "60",
);
const priceAlertsIntervalMs =
  Math.max(
    1,
    Number.isFinite(priceAlertsIntervalMinutes) ? priceAlertsIntervalMinutes : 60,
  ) * 60_000;
const crawlerEnabled = ["true", "1"].includes(
  (process.env.CRAWLER_WORKER_ENABLED ?? "false").toLowerCase(),
);
const crawlerIntervalMinutes = Number(
  process.env.CRAWLER_INTERVAL_MINUTES ?? "360",
);
const crawlerIntervalMs =
  Math.max(1, Number.isFinite(crawlerIntervalMinutes) ? crawlerIntervalMinutes : 360) *
  60_000;
const crawlerAllowHttp = ["true", "1"].includes(
  (process.env.CRAWLER_ALLOW_HTTP ?? "false").toLowerCase(),
);
const emailDeliveryEnabled = ["true", "1"].includes(
  (process.env.EMAIL_DELIVERY_ENABLED ?? "false").toLowerCase(),
);
const emailDeliveryIntervalMinutes = Number(
  process.env.NOTIFICATION_EMAIL_INTERVAL_MINUTES ?? "5",
);
const emailDeliveryIntervalMs =
  Math.max(
    1,
    Number.isFinite(emailDeliveryIntervalMinutes) ? emailDeliveryIntervalMinutes : 5,
  ) * 60_000;
const prisma = new PrismaClient();
let isRunningPriceAlerts = false;
let isRunningCrawler = false;
let isRunningEmailDelivery = false;
let isStopping = false;

async function runPriceAlertJob() {
  if (isRunningPriceAlerts || isStopping) return;
  isRunningPriceAlerts = true;

  try {
    const result = await checkActivePriceAlerts(prisma);
    const { checked, triggered } = result.data;
    console.log(
      `[price-alert-worker] checked=${checked} triggered=${triggered} at=${new Date().toISOString()}`,
    );
  } catch (error) {
    console.error("[price-alert-worker] job failed", error);
  } finally {
    isRunningPriceAlerts = false;
  }
}

async function runCrawlerJob() {
  if (isRunningCrawler || isStopping) return;
  isRunningCrawler = true;

  try {
    const result = await crawlActiveSources(prisma, { allowHttp: crawlerAllowHttp });
    console.log(
      `[crawler-worker] sources=${result.sources} fetched=${result.fetched} failed=${result.failed} skipped=${result.skipped} at=${new Date().toISOString()}`,
    );
  } catch (error) {
    console.error("[crawler-worker] job failed", error);
  } finally {
    isRunningCrawler = false;
  }
}

async function runNotificationEmailJob() {
  if (isRunningEmailDelivery || isStopping) return;
  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.EMAIL_FROM;
  if (!apiKey || !from) {
    console.error(
      "[notification-email-worker] EMAIL_DELIVERY_ENABLED requires RESEND_API_KEY and EMAIL_FROM",
    );
    return;
  }

  isRunningEmailDelivery = true;
  try {
    const result = await deliverPendingNotificationEmails(prisma, {
      apiKey,
      from,
      batchSize: Number(process.env.NOTIFICATION_EMAIL_BATCH_SIZE ?? "25"),
      maxAttempts: Number(process.env.NOTIFICATION_EMAIL_MAX_ATTEMPTS ?? "5"),
      maxAgeHours: Number(process.env.NOTIFICATION_EMAIL_MAX_AGE_HOURS ?? "24"),
    });
    if (result.scanned > 0) {
      console.log(
        `[notification-email-worker] scanned=${result.scanned} sent=${result.sent} retried=${result.retried} failed=${result.failed} skipped=${result.skipped}`,
      );
    }
  } catch (error) {
    console.error("[notification-email-worker] job failed", error);
  } finally {
    isRunningEmailDelivery = false;
  }
}

async function shutdown(signal: string) {
  if (isStopping) return;
  isStopping = true;
  console.log(`[price-alert-worker] received ${signal}, shutting down`);
  await prisma.$disconnect();
  process.exit(0);
}

async function main() {
  if (!priceAlertsEnabled && !crawlerEnabled && !emailDeliveryEnabled) {
    console.log(
      "[worker] disabled; enable price alerts, crawler and/or email delivery explicitly",
    );
    await prisma.$disconnect();
    return;
  }

  await prisma.$connect();
  if (priceAlertsEnabled) {
    await runPriceAlertJob();
    setInterval(runPriceAlertJob, priceAlertsIntervalMs);
    console.log(
      `[price-alert-worker] running every ${priceAlertsIntervalMs / 60_000} minute(s)`,
    );
  }
  if (crawlerEnabled) {
    await runCrawlerJob();
    setInterval(runCrawlerJob, crawlerIntervalMs);
    console.log(
      `[crawler-worker] running every ${crawlerIntervalMs / 60_000} minute(s); http=${crawlerAllowHttp}`,
    );
  }
  if (emailDeliveryEnabled) {
    await runNotificationEmailJob();
    setInterval(runNotificationEmailJob, emailDeliveryIntervalMs);
    console.log(
      `[notification-email-worker] running every ${emailDeliveryIntervalMs / 60_000} minute(s)`,
    );
  }
}

process.once("SIGINT", () => void shutdown("SIGINT"));
process.once("SIGTERM", () => void shutdown("SIGTERM"));

void main().catch(async (error) => {
  console.error("[price-alert-worker] startup failed", error);
  await prisma.$disconnect();
  process.exit(1);
});
