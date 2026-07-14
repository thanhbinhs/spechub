import type { PrismaClient } from "@spechub/database";

const DEFAULT_BATCH_SIZE = 25;
const DEFAULT_MAX_ATTEMPTS = 5;
const DEFAULT_MAX_AGE_HOURS = 24;

export type NotificationEmailResult = {
  scanned: number;
  sent: number;
  retried: number;
  failed: number;
  skipped: number;
};

export async function deliverPendingNotificationEmails(
  prisma: PrismaClient,
  options: {
    apiKey: string;
    from: string;
    fetcher?: typeof fetch;
    batchSize?: number;
    maxAttempts?: number;
    maxAgeHours?: number;
  },
): Promise<NotificationEmailResult> {
  const now = new Date();
  const batchSize = clampInteger(options.batchSize, DEFAULT_BATCH_SIZE, 1, 100);
  const maxAttempts = clampInteger(options.maxAttempts, DEFAULT_MAX_ATTEMPTS, 1, 10);
  const maxAgeHours = clampInteger(options.maxAgeHours, DEFAULT_MAX_AGE_HOURS, 1, 24 * 30);
  const expiresBefore = new Date(now.getTime() - maxAgeHours * 60 * 60 * 1000);
  const deliveries = await prisma.notification_deliveries.findMany({
    where: {
      channel: "email",
      OR: [
        { status: "pending" },
        { status: "retrying", next_attempt_at: { lte: now } },
      ],
    },
    select: {
      id: true,
      recipient: true,
      attempts: true,
      created_at: true,
      notification: {
        select: {
          title: true,
          body: true,
        },
      },
    },
    orderBy: { created_at: "asc" },
    take: batchSize,
  });
  const result: NotificationEmailResult = {
    scanned: deliveries.length,
    sent: 0,
    retried: 0,
    failed: 0,
    skipped: 0,
  };

  for (const delivery of deliveries) {
    if (delivery.created_at < expiresBefore) {
      await prisma.notification_deliveries.update({
        where: { id: delivery.id },
        data: {
          status: "skipped",
          last_error: `Delivery expired after ${maxAgeHours} hour(s)`,
          next_attempt_at: null,
        },
      });
      result.skipped += 1;
      continue;
    }

    try {
      const providerMessageId = await sendWithResend(
        options.fetcher ?? fetch,
        options.apiKey,
        options.from,
        delivery.recipient,
        delivery.notification.title,
        delivery.notification.body,
      );
      await prisma.notification_deliveries.update({
        where: { id: delivery.id },
        data: {
          status: "sent",
          attempts: { increment: 1 },
          provider_message_id: providerMessageId,
          last_error: null,
          next_attempt_at: null,
          sent_at: new Date(),
        },
      });
      result.sent += 1;
    } catch (error) {
      const isRetryable = isRetryableError(error);
      const nextAttempt = delivery.attempts + 1;
      const shouldRetry = isRetryable && nextAttempt < maxAttempts;
      await prisma.notification_deliveries.update({
        where: { id: delivery.id },
        data: {
          status: shouldRetry ? "retrying" : "failed",
          attempts: { increment: 1 },
          last_error: formatError(error).slice(0, 2_000),
          next_attempt_at: shouldRetry
            ? new Date(now.getTime() + retryDelayMilliseconds(nextAttempt))
            : null,
        },
      });
      if (shouldRetry) result.retried += 1;
      else result.failed += 1;
    }
  }

  return result;
}

async function sendWithResend(
  fetcher: typeof fetch,
  apiKey: string,
  from: string,
  recipient: string,
  subject: string,
  body?: string | null,
) {
  const response = await fetcher("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from,
      to: [recipient],
      subject,
      text: body ? `${subject}\n\n${body}` : subject,
      html: emailHtml(subject, body),
    }),
    signal: AbortSignal.timeout(20_000),
  });
  const payload = await readJson(response);
  if (!response.ok) {
    throw new ResendDeliveryError(
      response.status,
      readProviderMessage(payload) ?? `Resend returned HTTP ${response.status}`,
    );
  }
  return typeof payload?.id === "string" ? payload.id : null;
}

class ResendDeliveryError extends Error {
  constructor(
    readonly status: number,
    message: string,
  ) {
    super(message);
    this.name = "ResendDeliveryError";
  }
}

function emailHtml(title: string, body?: string | null) {
  const escapedTitle = escapeHtml(title);
  const escapedBody = body ? escapeHtml(body).replace(/\n/g, "<br />") : "";
  return `<main style="font-family:Arial,sans-serif;line-height:1.5;color:#0f172a"><h1 style="font-size:20px">${escapedTitle}</h1>${escapedBody ? `<p>${escapedBody}</p>` : ""}</main>`;
}

function escapeHtml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

async function readJson(response: Response): Promise<Record<string, unknown> | null> {
  const text = await response.text();
  if (!text) return null;
  try {
    const value: unknown = JSON.parse(text);
    return value && typeof value === "object" && !Array.isArray(value)
      ? (value as Record<string, unknown>)
      : null;
  } catch {
    return null;
  }
}

function readProviderMessage(payload: Record<string, unknown> | null) {
  if (!payload) return null;
  return typeof payload.message === "string" ? payload.message : null;
}

function isRetryableError(error: unknown) {
  return !(error instanceof ResendDeliveryError) || error.status === 429 || error.status >= 500;
}

function retryDelayMilliseconds(attempt: number) {
  return Math.min(60 * 60 * 1000, 60_000 * 2 ** Math.max(0, attempt - 1));
}

function clampInteger(value: number | undefined, fallback: number, min: number, max: number) {
  return Number.isInteger(value) ? Math.min(Math.max(value ?? fallback, min), max) : fallback;
}

function formatError(error: unknown) {
  return error instanceof Error ? error.message : String(error);
}
