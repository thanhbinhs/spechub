# SpecHub Web

Next.js frontend for the SpecHub MVP. The app provides the public product surface for catalog browsing, device detail, comparison, search, AI Q&A, authentication, and the basic user dashboard.

## Current MVP Surface

| Route | Purpose |
|---|---|
| `/` | Homepage with catalog summary, fast prompts, categories, and featured records. |
| `/devices` | Device model listing with filters and pagination. |
| `/devices/[slug]` | Device detail page with variants and specs. |
| `/compare` | Side-by-side comparison for 2-4 device variants. |
| `/search` | Keyword search backed by the API search endpoint. |
| `/ai` | Catalog-grounded AI question interface. |
| `/login` | JWT login flow through the API. |
| `/register` | Account creation flow through the API. |
| `/dashboard` | Basic authenticated account dashboard. |

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

The root `.env.example` is synchronized with this name. Do not use the older `NEXT_PUBLIC_API_URL` name for the web client.

## Key Files

| File | Purpose |
|---|---|
| `src/app/layout.tsx` | Root layout, fonts, query/auth provider shell. |
| `src/components/app-shell.tsx` | Global navigation and responsive shell. |
| `src/components/query-provider.tsx` | TanStack Query provider and auth provider wrapper. |
| `src/components/auth-provider.tsx` | Local JWT token persistence and auth actions. |
| `src/lib/api.ts` | Configured `@spechub/api-client` instance and query keys. |
| `src/lib/format.ts` | Local formatting helpers used by catalog UI. |

## Health Checks

```bash
pnpm --filter @spechub/web type-check
pnpm --filter @spechub/web lint
```

The root `pnpm type-check` is expected to pass after Phase 1.5 stabilization. See `spechub-v2-master-guide.md` for the post-MVP audit and roadmap.
