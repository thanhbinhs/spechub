# SpecHub Web

Next.js frontend for the SpecHub MVP and operations surface. The app provides catalog browsing, device detail, comparison, search, AI Q&A, authentication, engagement workflows, and the role-aware admin workspace.

## Current MVP Surface

| Route             | Purpose                                                                                                |
| ----------------- | ------------------------------------------------------------------------------------------------------ |
| `/`               | Homepage with catalog summary, fast prompts, categories, and featured records.                         |
| `/devices`        | Device model listing with filters and pagination.                                                      |
| `/devices/[slug]` | Device detail page with variants and specs.                                                            |
| `/compare`        | Side-by-side comparison for 2-4 device variants.                                                       |
| `/search`         | Keyword search backed by the API search endpoint.                                                      |
| `/ai`             | Catalog-grounded AI question interface.                                                                |
| `/login`          | JWT login flow through the API.                                                                        |
| `/register`       | Account creation flow through the API.                                                                 |
| `/dashboard`      | Basic authenticated account dashboard.                                                                 |
| `/wishlist`       | Authenticated saved variants and wishlist item removal.                                                |
| `/alerts`         | Searchable variant picker plus create/edit/pause/reactivate price-alert flow.                          |
| `/notifications`  | Authenticated in-app notification center.                                                              |
| `/billing`        | Public plan cards plus authenticated current-plan, checkout, cancellation, retry, and billing history. |
| `/admin`          | Role-aware catalog, affiliate, subscription, source, review-queue, and user operations.                |
| `/offline`        | PWA navigation fallback when the app shell is offline.                                                 |

## Run Locally

From the repository root:

```bash
pnpm install
pnpm db:generate
pnpm dev:api
pnpm dev:web
```

Web runs at `http://localhost:3000`. The API is expected at `http://localhost:4000/api/v1`.

## Environment

The web client currently reads:

```bash
NEXT_PUBLIC_SPECHUB_API_URL="http://localhost:4000/api/v1"
```

The web config loads the repository root `.env` as a fallback and lets `apps/web/.env` override it. The root `.env.example` is synchronized with this name. Do not use the older `NEXT_PUBLIC_API_URL` name for the web client.

## Key Files

| File                                | Purpose                                                   |
| ----------------------------------- | --------------------------------------------------------- |
| `src/app/layout.tsx`                | Root layout, fonts, query/auth provider shell.            |
| `src/components/app-shell.tsx`      | Global navigation and responsive shell.                   |
| `src/components/query-provider.tsx` | TanStack Query provider and auth provider wrapper.        |
| `src/components/auth-provider.tsx`  | Local JWT token persistence and auth actions.             |
| `src/lib/api.ts`                    | Configured `@spechub/api-client` instance and query keys. |
| `src/lib/format.ts`                 | Local formatting helpers used by catalog UI.              |

## PWA and operations

The web app includes `manifest.ts`, an install prompt, a service worker, mobile safe-area navigation, and the `/offline` fallback. Admin/editor users access `/admin` from the same responsive shell; no separate admin app is required yet.

## Health Checks

```bash
pnpm --filter @spechub/web type-check
pnpm --filter @spechub/web lint
pnpm --filter @spechub/web build
```

The root `pnpm type-check` is expected to pass after Phase 1.5 stabilization. The current web surface also includes Wiki (`/wiki`), B2B API-key management (`/api-access`), crawler configuration in `/admin`, and the Phase 3/4 product routes. See `spechub-v2-master-guide.md` for the post-MVP audit and roadmap.
