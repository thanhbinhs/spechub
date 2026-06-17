# SpecHub

SpecHub is a smart-device research platform. The MVP includes a NestJS API, Next.js web app, Prisma/PostgreSQL database, catalog search, comparison, authentication, and catalog-grounded AI Q&A.

## Requirements

| Tool | Version |
|---|---|
| Node.js | `>=22.11.0` |
| pnpm | `>=9.15.0` |
| PostgreSQL | `16.x` with `pgvector`, `pg_trgm`, `unaccent` |
| Redis | `7.x` |
| Meilisearch | Optional for MVP search |

## Setup

```bash
pnpm install
cp .env.example .env
pnpm db:generate
pnpm db:migrate
pnpm db:seed
```

The default local API URL is `http://localhost:4000/api/v1`. The web app reads `NEXT_PUBLIC_SPECHUB_API_URL`.

## Development

```bash
pnpm dev:api
pnpm dev:web
```

Useful URLs:

| URL | Service |
|---|---|
| `http://localhost:3000` | Web app |
| `http://localhost:4000/api/v1` | API base |
| `http://localhost:4000/api/docs` | Swagger |
| `http://localhost:4000/api/v1/health` | API health |
| `http://localhost:5555` | Prisma Studio |
| `http://localhost:7700` | Meilisearch dashboard |

## Checks

```bash
pnpm type-check
pnpm test
pnpm --filter @spechub/web lint
pnpm build
```

## Workspace

| Path | Purpose |
|---|---|
| `apps/api` | NestJS/Fastify API |
| `apps/web` | Next.js web app |
| `apps/ai-service` | Prototype local embedding service |
| `packages/database` | Prisma schema, migrations, generated client |
| `packages/api-client` | TypeScript API client |
| `packages/ai-core` | Local embedding/RAG helpers |
| `packages/config` | Shared TypeScript, ESLint, Tailwind config |
| `packages/auth` | Shared auth token helpers |
| `packages/utils` | Shared formatting/string utilities |

For deeper architecture notes and the post-MVP roadmap, see `spechub-v2-master-guide.md`.
