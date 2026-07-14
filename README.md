# SpecHub

SpecHub is a smart-device research platform. The MVP includes a NestJS API, Next.js web app, Prisma/PostgreSQL database, catalog search, comparison, authentication, catalog-grounded AI Q&A, and commerce/engagement workflows.

Phase 2 adds AI/data foundations: local/OpenAI/Anthropic answer providers, catalog/raw-page embedding indexing, data-ingestion review APIs, citation source APIs, and admin/editor write contracts for core catalog resources.

Phase 3 adds commerce/engagement: wishlists, affiliate buy links and click tracking, price alerts, in-app notifications, subscription plans, manual subscription assignment, and dashboard/device-detail integration.

Phase 4+ completes the operational surface: role-aware `/admin` workflows, a responsive installable PWA shell, Stripe Checkout with signed/idempotent webhooks and audit logs, and separate worker jobs for price alerts, crawler intake, and Resend email delivery.

The current product also includes a versioned Wiki, B2B API keys with scope/rate/quota enforcement, and production probes/metrics with request IDs and structured-log support.

Authentication uses short-lived JWT access tokens, refresh tokens, and Redis-backed sessions. The web client refreshes access tokens before expiry, while logout revokes the current session server-side.

## Requirements

| Tool        | Version                                       |
| ----------- | --------------------------------------------- |
| Node.js     | `>=22.11.0`                                   |
| pnpm        | `>=9.15.0`                                    |
| PostgreSQL  | `16.x` with `pgvector`, `pg_trgm`, `unaccent` |
| Redis       | `7.x`                                         |
| Meilisearch | Optional for MVP search                       |

## Setup

```bash
pnpm install
cp .env.example .env
pnpm db:generate
pnpm db:migrate
pnpm db:seed
```

The API, web, AI prototype, worker, and database scripts load the root `.env` as a fallback; an app-local `.env` still takes precedence when present. The default local API URL is `http://localhost:4000/api/v1`. The web app reads `NEXT_PUBLIC_SPECHUB_API_URL`.

## Phase 2 AI/Data

Local development works with the default `AI_PROVIDER="local"` and `AI_EMBEDDING_PROVIDER="local"`. To use hosted models, set `AI_PROVIDER` to `openai` or `anthropic`, set `AI_EMBEDDING_PROVIDER="openai"` if needed, and provide the matching API key in `.env`.

Key protected endpoints for admin/editor workflows:

| Endpoint                                         | Purpose                                             |
| ------------------------------------------------ | --------------------------------------------------- |
| `POST /api/v1/ai/embeddings/index-device-models` | Rebuild catalog device-model embeddings             |
| `POST /api/v1/ai/embeddings/index-raw-pages`     | Index reviewed raw pages                            |
| `/api/v1/data-ingestion/*`                       | Manage crawler sources, raw pages, and review queue |
| `/api/v1/citations/*`                            | Manage citation sources and citations               |

## Commerce, Billing, and Operations

Commerce and engagement flows are API-first with typed web integration. The remaining provider configuration is explicit: payment remains unavailable until valid Stripe credentials are supplied.

| Area             | Endpoint/UI                                                                                                    |
| ---------------- | -------------------------------------------------------------------------------------------------------------- |
| Wishlists        | `/api/v1/wishlists`, web `/wishlist`, device-detail save action                                                |
| Affiliate        | `/api/v1/affiliate/*`, device-detail buy links and click tracking                                              |
| Price alerts     | `/api/v1/alerts`, searchable variant picker on `/alerts`, scheduled worker, manual admin/editor check endpoint |
| Notifications    | `/api/v1/notifications`, web `/notifications`                                                                  |
| Subscriptions    | `/api/v1/subscriptions/*`, web `/billing`, Stripe Checkout/webhooks/audit                                      |
| Admin operations | web `/admin`: users, catalog, affiliates, plans, billing audit, source moderation                              |
| PWA              | install prompt, manifest, navigation offline fallback at `/offline`                                            |
| Wiki             | `/api/v1/wiki/articles`, revision/moderation API, public web `/wiki`                                          |
| B2B catalog      | `/api/v1/api-keys`, protected `/api/v1/b2b/*`, web `/api-access`                                              |
| Observability    | `/health/live`, `/health/ready`, token-protected `/health/metrics`, `X-Request-ID`                            |

## Billing Setup

1. Run `pnpm db:migrate` to add billing audit and webhook idempotency tables.
2. Set `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`, and `FRONTEND_URL` in `.env`.
3. In Stripe, forward these events to `POST /api/v1/subscriptions/webhooks/stripe`:
   `checkout.session.completed`, `customer.subscription.created`,
   `customer.subscription.updated`, `customer.subscription.deleted`, `invoice.paid`, and `invoice.payment_failed`.
4. Configure `stripe_price_monthly_id` and `stripe_price_yearly_id` from `/admin` when you want Stripe Price objects. Without them, the checkout uses the plan price stored in SpecHub.

The webhook verifies Stripe's signed raw body, tolerates the configured clock window, stores only a payload hash, and ignores duplicate provider event IDs. Webhook processing updates the subscription state, creates a durable audit entry, and notifies the user.

## Worker Operation

Run worker jobs outside the API process. Each job is opt-in, so one process can run only the capabilities you configure:

```bash
PRICE_ALERTS_WORKER_ENABLED=true pnpm dev:worker
```

Set `PRICE_ALERTS_INTERVAL_MINUTES` to adjust cadence. Leave `PRICE_ALERTS_SCHEDULE_ENABLED=false` in production so only the worker owns scheduled checks. The API endpoint `POST /api/v1/alerts/check` remains available for manual admin/editor checks.

For crawler intake, create a source in `/admin` with `crawl_config.seed_urls` and a restrictive `allowed_paths` list, then set `CRAWLER_WORKER_ENABLED=true`. The worker rejects localhost/private IPs, cross-origin URLs, redirects outside the configured origin, credentials in URLs, oversized bodies, and non-HTML responses. It stores raw content as `needs_review`; it never writes catalog data directly.

For email delivery, set `EMAIL_DELIVERY_ENABLED=true`, `RESEND_API_KEY`, and a verified `EMAIL_FROM`. Notifications are committed to a durable email outbox in the same database write. The worker retries temporary failures with backoff, never retries permanent provider errors, and skips stale unsent notifications after `NOTIFICATION_EMAIL_MAX_AGE_HOURS`.

## B2B API setup

`api_access` is enabled by the Team plan seed. An entitled user can create/revoke/rotate keys at `/api-access`; each secret is returned exactly once and only a SHA-256 hash is stored. Call catalog endpoints with `X-API-Key`:

```bash
curl -H "X-API-Key: $SPECHUB_API_KEY" \
  "http://localhost:4000/api/v1/b2b/device-models?page=1&pageSize=20"
```

Keys have the `catalog:read` scope, a per-minute limit, and an optional monthly quota. The current B2B contract contains device-model listing/detail and device-variant detail.

## Observability

Use `/api/v1/health/live` for a process liveness probe and `/api/v1/health/ready` for database/Redis readiness (returns HTTP 503 when degraded). Set `LOG_FORMAT=json` for machine-readable request logs. Set a strong `METRICS_TOKEN` to enable Prometheus-compatible process metrics:

```bash
curl -H "Authorization: Bearer $METRICS_TOKEN" \
  http://localhost:4000/api/v1/health/metrics
```

## Authentication Sessions

Set `JWT_EXPIRES_IN` (default `15m`) and `JWT_REFRESH_EXPIRES_IN` (default `30d`). Redis is required for authenticated requests because each access/refresh token is bound to a revocable server-side session. Deploying this change invalidates older tokens that do not contain a session ID, so existing users must sign in again once.

## Development

```bash
pnpm dev:api
pnpm dev:web
pnpm dev:worker
```

Useful URLs:

| URL                                   | Service               |
| ------------------------------------- | --------------------- |
| `http://localhost:3000`               | Web app               |
| `http://localhost:4000/api/v1`        | API base              |
| `http://localhost:4000/api/docs`      | Swagger               |
| `http://localhost:4000/api/v1/health` | API health            |
| `http://localhost:5555`               | Prisma Studio         |
| `http://localhost:7700`               | Meilisearch dashboard |

## Checks

```bash
pnpm lint
pnpm type-check
pnpm test
pnpm db:validate
pnpm --filter @spechub/web lint
pnpm build
```

## Workspace

| Path                   | Purpose                                       |
| ---------------------- | --------------------------------------------- |
| `apps/api`             | NestJS/Fastify API                            |
| `apps/web`             | Next.js web app                               |
| `apps/ai-service`      | Prototype local embedding service             |
| `apps/worker`          | Separate scheduled price-alert worker         |
| `packages/alerts-core` | Shared, atomic price-alert job implementation |
| `packages/database`    | Prisma schema, migrations, generated client   |
| `packages/api-client`  | TypeScript API client                         |
| `packages/ai-core`     | Local embedding/RAG helpers                   |
| `packages/config`      | Shared TypeScript, ESLint, Tailwind config    |
| `packages/auth`        | Shared auth token helpers                     |
| `packages/utils`       | Shared formatting/string utilities            |

For deeper architecture notes and the post-MVP roadmap, see `spechub-v2-master-guide.md`.
