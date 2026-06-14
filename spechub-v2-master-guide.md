# 📘 SpecHub — Project Architecture & Documentation

> **Tài liệu thiết kế chi tiết** toàn bộ dự án SpecHub.
> Tập trung sâu vào **cấu trúc dự án**, **chi tiết từng file**, **mối quan hệ giữa các thành phần**.

**Version:** 3.0
**Status:** Foundation completed, building modules
**Audience:** Developers, technical reviewers, future maintainers

---

## 📑 Mục lục

1. [Giới thiệu dự án](#1-giới-thiệu-dự-án)
2. [Môi trường dự án](#2-môi-trường-dự-án)
3. [Cấu trúc dự án tổng thể](#3-cấu-trúc-dự-án-tổng-thể)
4. [Chi tiết từng thư mục và file](#4-chi-tiết-từng-thư-mục-và-file)
   - 4.1 [Apps](#41-apps---deployable-applications)
     - [apps/api](#411-appsapi---backend-nestjs)
     - [apps/web](#412-appsweb---frontend-nextjs)
     - [apps/admin](#413-appsadmin---admin-dashboard)
     - [apps/ai-service](#414-appsai-service---ai-microservice)
     - [apps/crawler](#415-appscrawler---crawler-service)
     - [apps/workers](#416-appsworkers---background-jobs)
   - 4.2 [Packages](#42-packages---shared-libraries)
   - 4.3 [Infra & Docs](#43-infra--docs)
   - 4.4 [Root files](#44-root-configuration-files)
5. [Sơ đồ quan hệ giữa các thành phần](#5-sơ-đồ-quan-hệ-giữa-các-thành-phần)
6. [Database schema relationships](#6-database-schema-relationships)
7. [Module dependencies](#7-module-dependencies)
8. [Roadmap chi tiết các phần cần làm](#8-roadmap-chi-tiết-các-phần-cần-làm)
9. [Naming conventions](#9-naming-conventions)
10. [Quick reference](#10-quick-reference)

---

## 1. Giới thiệu dự án

### 1.1 SpecHub là gì?

**SpecHub** là một platform thông tin và research về thiết bị thông minh thế hệ mới. Khác với các website spec truyền thống chỉ hiển thị thông số kỹ thuật, SpecHub kết hợp:

- **🧠 AI Research Engine** — Trả lời câu hỏi natural language về thiết bị, có dẫn nguồn
- **🤖 Auto Data Ingestion** — Crawler tự động + LLM extractor, không cần nhập thủ công
- **🛒 E-commerce hybrid** — Affiliate + subscription + B2B API
- **📚 Wiki collaborative** — Cộng đồng đóng góp, có versioning + citations
- **📱 Multi-platform** — Web (Next.js), Mobile (Expo), Admin dashboard

### 1.2 Vấn đề SpecHub giải quyết

| Vấn đề hiện tại | Giải pháp SpecHub |
|---|---|
| GSMArena chỉ liệt kê spec, không có ngữ cảnh | AI trả lời câu hỏi cụ thể với dẫn nguồn |
| Data nhập thủ công, cập nhật chậm | Crawler + LLM extractor tự động |
| Không có so sánh thông minh | AI phân tích pros/cons giữa các thiết bị |
| Không có price tracking | Affiliate + price history + alerts |
| Không có API cho B2B | RESTful + GraphQL API có rate limit |

### 1.3 Đối tượng người dùng

| Persona | Use case |
|---|---|
| **Người mua hàng cá nhân** | So sánh thiết bị, theo dõi giá, đọc reviews |
| **Reviewers & creators** | Research data, dẫn nguồn, embed widget |
| **Retailers** | Lấy spec data qua B2B API |
| **Developers** | Embed compare widget, dùng API |
| **Power users** | Tìm hiểu sâu (chipset, sensor, benchmark) |

### 1.4 Tính năng chính

#### Phase 1 — MVP Core
- ✅ Catalog: Browse devices theo brand/category
- ✅ Detail pages: Full spec, gallery, variants
- ✅ Compare: So sánh 2-4 thiết bị
- ✅ Search: Keyword + filter (Meilisearch)
- ✅ Authentication: JWT + refresh token

#### Phase 2 — AI & Data
- 🔄 RAG search engine với citations
- 🔄 Crawler từ GSMArena, Notebookcheck
- 🔄 LLM extractor (Claude function calling)
- 🔄 Admin review queue

#### Phase 3 — Commerce
- ⏳ Affiliate links + click tracking
- ⏳ Price history + alerts
- ⏳ Wishlist + favorites
- ⏳ Notifications (email + push)

#### Phase 4 — Premium
- ⏳ Subscription plans (Free/Pro/Team)
- ⏳ Stripe + VNPay integration
- ⏳ B2B API với API keys
- ⏳ Usage tracking + quotas

---

## 2. Môi trường dự án

### 2.1 Yêu cầu hệ thống

| Component | Yêu cầu tối thiểu | Khuyến nghị |
|---|---|---|
| **OS** | macOS 13+ | macOS 14+ (Sonoma) |
| **RAM** | 8GB | 16GB+ |
| **Storage** | 20GB trống | 50GB+ SSD |
| **CPU** | Intel hoặc Apple Silicon | Apple Silicon M1+ |

### 2.2 Tools cần cài

| Tool | Version | Lý do |
|---|---|---|
| **Xcode CLI** | latest | Compile native modules |
| **Homebrew** | 4.x | Package manager macOS |
| **Node.js** | `22.11.0` LTS | Stable đến 2026-10, không dùng v24 |
| **pnpm** | `9.15.0` | Monorepo, tiết kiệm disk |
| **PostgreSQL** | `16.x` | Primary DB + pgvector extension |
| **Redis** | `7.x` | Cache + queue + pub/sub |
| **Meilisearch** | `1.11+` | Search engine (optional cho MVP) |
| **VS Code** | latest | IDE recommended |
| **Git** | 2.40+ | Version control |

### 2.3 Production tech stack

#### Runtime & Framework
```yaml
Runtime: Node.js 22 LTS
Backend Framework: NestJS 11.0.6 + Fastify 5.2.0
Frontend Framework: Next.js 15.5.7 + React 19
Mobile: Expo 52 (planned)
```

#### Database & Storage
```yaml
Primary DB: PostgreSQL 16
  Extensions:
    - pgvector (AI embeddings)
    - pg_trgm (fuzzy search)
    - unaccent (Vietnamese search)
ORM: Prisma 6.1.0
Cache: Redis 7
Search: Meilisearch 1.11+
Storage: Cloudflare R2 / AWS S3
```

#### AI & ML
```yaml
LLM SDK: Vercel AI SDK 4.0
LLM Providers:
  - Anthropic Claude (primary)
  - OpenAI GPT-4 (fallback)
  - Google Gemini (experimental)
Embeddings: Voyage AI (free tier)
Reranker: Cohere (optional)
```

#### Development Tools
```yaml
Package Manager: pnpm 9.15.0
Monorepo: Turborepo 2.3
TypeScript: 5.7.2 strict mode
Linter: ESLint 9
Formatter: Prettier 3.4
Testing: Jest 29 + Vitest
```

#### External Services (Production)
```yaml
Hosting:
  - Web: Vercel (free tier)
  - API: Railway / Fly.io ($10-30/mo)
  - DB: Neon / Supabase
  - Redis: Upstash
  - CDN: Cloudflare

Monitoring:
  - Errors: Sentry
  - Uptime: Better Stack
  - Analytics: PostHog
  - Logs: Better Stack Logtail

Email & Payments:
  - Transactional: Resend
  - Payments: Stripe + VNPay
```

### 2.4 Environment variables

```bash
# === DATABASE ===
DATABASE_URL="postgresql://spechub:password@localhost:5432/spechub_dev"

# === REDIS ===
REDIS_URL="redis://localhost:6379"

# === SEARCH ===
MEILISEARCH_HOST="http://localhost:7700"
MEILISEARCH_API_KEY=""

# === AI/LLM ===
ANTHROPIC_API_KEY="sk-ant-..."
OPENAI_API_KEY="sk-..."
VOYAGE_API_KEY="..."

# === AUTH ===
JWT_SECRET="min-32-chars-secret"
JWT_EXPIRES_IN="7d"
JWT_REFRESH_EXPIRES_IN="30d"

# === STORAGE ===
S3_ACCESS_KEY=""
S3_SECRET_KEY=""
S3_BUCKET="spechub-prod"
S3_REGION="auto"
S3_ENDPOINT="..."

# === EMAIL ===
RESEND_API_KEY="re_..."
EMAIL_FROM="noreply@spechub.io"

# === PAYMENTS ===
STRIPE_SECRET_KEY="sk_..."
STRIPE_WEBHOOK_SECRET="whsec_..."

# === URLs ===
NEXT_PUBLIC_API_URL="http://localhost:4000/api/v1"
NEXT_PUBLIC_WEB_URL="http://localhost:3000"

# === MONITORING ===
SENTRY_DSN=""
POSTHOG_KEY=""
```

---

## 3. Cấu trúc dự án tổng thể

### 3.1 Sơ đồ thư mục cấp 1

```
spechub/
│
├── 📂 apps/                    # 6 deployable applications
│   ├── api/                    # NestJS - Main API
│   ├── web/                    # Next.js - Public website
│   ├── admin/                  # Next.js - Admin dashboard
│   ├── ai-service/             # NestJS - AI microservice
│   ├── crawler/                # NestJS - Crawler service
│   └── workers/                # NestJS - Background jobs
│
├── 📂 packages/                # 9 shared libraries
│   ├── database/               # Prisma schema + client
│   ├── types/                  # Shared TypeScript types
│   ├── ui/                     # Shared React components
│   ├── config/                 # ESLint, TS, Tailwind configs
│   ├── api-client/             # API SDK
│   ├── auth/                   # Auth helpers
│   ├── utils/                  # Pure utility functions
│   ├── ai-core/                # RAG, embedding helpers
│   └── analytics/              # Tracking helpers
│
├── 📂 infra/                   # Infrastructure
│   ├── docker/                 # Dockerfiles
│   └── scripts/                # Deploy scripts
│
├── 📂 docs/                    # Documentation
│   ├── architecture/           # ADRs, diagrams
│   ├── api/                    # API documentation
│   └── runbooks/               # Operational guides
│
├── 📂 .github/                 # GitHub config
│   └── workflows/              # CI/CD pipelines
│
├── 📂 .vscode/                 # VS Code settings
│   ├── settings.json
│   └── extensions.json
│
└── 📄 Root config files
    ├── package.json            # Root package
    ├── pnpm-workspace.yaml     # Workspace config
    ├── turbo.json              # Turborepo tasks
    ├── tsconfig.json           # Root TS config
    ├── .gitignore
    ├── .env.example
    ├── README.md
    └── SPECHUB-MASTER.md       # Master documentation
```

### 3.2 Quy ước phân chia

| Folder | Quy ước |
|---|---|
| `apps/*` | Deployable — có thể run, deploy độc lập |
| `packages/*` | Library — chỉ là code, không deploy |
| `infra/*` | Infrastructure as code |
| `docs/*` | Documentation (markdown) |

### 3.3 Workspace dependencies

```yaml
# pnpm-workspace.yaml
packages:
  - "apps/*"
  - "packages/*"
```

Mỗi app/package có `package.json` riêng. Để dùng nhau:

```json
{
  "dependencies": {
    "@spechub/database": "workspace:*",
    "@spechub/types": "workspace:*"
  }
}
```

---

## 4. Chi tiết từng thư mục và file

### 4.1 Apps - Deployable applications

#### 4.1.1 apps/api - Backend NestJS

**Vai trò:** Main API gateway, xử lý authentication, CRUD, business logic.

**Cấu trúc chi tiết:**

```
apps/api/
├── 📂 src/
│   │
│   ├── 📂 common/                              # Shared utilities (Global)
│   │   ├── 📂 decorators/
│   │   │   ├── current-user.decorator.ts       # @CurrentUser() - Lấy user từ request
│   │   │   ├── public.decorator.ts             # @Public() - Bypass JWT auth
│   │   │   └── roles.decorator.ts              # @Roles('admin') - Role check
│   │   ├── 📂 guards/
│   │   │   ├── jwt-auth.guard.ts               # Verify JWT token
│   │   │   └── roles.guard.ts                  # Check user role
│   │   ├── 📂 interceptors/
│   │   │   ├── transform.interceptor.ts        # Wrap response {data, meta}
│   │   │   └── logging.interceptor.ts          # Log requests
│   │   ├── 📂 filters/
│   │   │   └── global-exception.filter.ts      # Catch & format errors
│   │   ├── 📂 pipes/
│   │   │   └── parse-uuid.pipe.ts              # Validate UUID params
│   │   ├── 📂 dto/
│   │   │   ├── pagination.dto.ts               # page, pageSize, sort
│   │   │   ├── api-response.dto.ts             # Standard response shape
│   │   │   └── id-param.dto.ts                 # Validate :id UUID
│   │   ├── 📂 constants/
│   │   │   └── index.ts                        # CACHE_TTL, PAGINATION, JWT_CONFIG
│   │   ├── 📂 types/
│   │   │   └── index.ts                        # AuthUser, UserRole, etc.
│   │   └── common.module.ts                    # Global module export
│   │
│   ├── 📂 prisma/                              # Database service
│   │   ├── prisma.service.ts                   # PrismaClient wrapper
│   │   └── prisma.module.ts                    # Global PrismaModule
│   │
│   ├── 📂 redis/                               # Cache service
│   │   ├── redis.service.ts                    # ioredis wrapper
│   │   └── redis.module.ts                     # Global RedisModule
│   │
│   ├── 📂 health/                              # Health check
│   │   └── health.controller.ts                # GET /health
│   │
│   ├── 📂 modules/                             # Feature modules (1 folder/module)
│   │   │
│   │   ├── 📂 auth/                            # Authentication
│   │   │   ├── 📂 dto/
│   │   │   │   ├── register.dto.ts             # POST /register body
│   │   │   │   ├── login.dto.ts                # POST /login body
│   │   │   │   ├── refresh-token.dto.ts        # POST /refresh body
│   │   │   │   └── auth-response.dto.ts        # Swagger response
│   │   │   ├── 📂 strategies/
│   │   │   │   ├── jwt.strategy.ts             # Passport JWT verify
│   │   │   │   └── local.strategy.ts           # Passport email/password
│   │   │   ├── 📂 interfaces/
│   │   │   │   └── jwt-payload.interface.ts    # Type-safe JWT
│   │   │   ├── auth.controller.ts              # 5 endpoints (register, login, refresh, me, logout)
│   │   │   ├── auth.service.ts                 # Business logic
│   │   │   └── auth.module.ts                  # Module wiring
│   │   │
│   │   ├── 📂 users/                           # User management
│   │   │   ├── users.service.ts                # CRUD users + bcrypt hash
│   │   │   └── users.module.ts                 # Export UsersService
│   │   │
│   │   ├── 📂 organizations/                   # Brands, manufacturers
│   │   │   ├── 📂 dto/
│   │   │   │   ├── create-organization.dto.ts
│   │   │   │   ├── update-organization.dto.ts
│   │   │   │   ├── query-organizations.dto.ts
│   │   │   │   └── organization-response.dto.ts
│   │   │   ├── organizations.controller.ts     # 7 endpoints
│   │   │   ├── organizations.service.ts        # Business logic
│   │   │   └── organizations.module.ts
│   │   │
│   │   ├── 📂 device-categories/               # Phone, Tablet, Laptop...
│   │   │   ├── dto/
│   │   │   ├── device-categories.controller.ts
│   │   │   ├── device-categories.service.ts
│   │   │   └── device-categories.module.ts
│   │   │
│   │   ├── 📂 product-families/                # iPhone 16 Series, Galaxy S25...
│   │   │   ├── dto/
│   │   │   ├── product-families.controller.ts
│   │   │   ├── product-families.service.ts
│   │   │   └── product-families.module.ts
│   │   │
│   │   ├── 📂 device-models/                   # iPhone 16 Pro, Galaxy S25 Ultra...
│   │   │   ├── dto/
│   │   │   ├── device-models.controller.ts     # List, detail, filter
│   │   │   ├── device-models.service.ts
│   │   │   └── device-models.module.ts
│   │   │
│   │   ├── 📂 device-variants/                 # 256GB Natural Titanium...
│   │   │   ├── dto/
│   │   │   ├── device-variants.controller.ts   # Detail, compare
│   │   │   ├── device-variants.service.ts
│   │   │   └── device-variants.module.ts
│   │   │
│   │   ├── 📂 chipsets/                        # A18 Pro, Snapdragon 8 Elite...
│   │   │   ├── dto/
│   │   │   ├── chipsets.controller.ts
│   │   │   ├── chipsets.service.ts
│   │   │   └── chipsets.module.ts
│   │   │
│   │   ├── 📂 search/                          # Meilisearch integration
│   │   │   ├── dto/
│   │   │   ├── search.controller.ts            # GET /search?q=...
│   │   │   ├── search.service.ts               # Sync DB → Meilisearch
│   │   │   └── search.module.ts
│   │   │
│   │   ├── 📂 ai/                              # AI Research API
│   │   │   ├── dto/
│   │   │   ├── ai.controller.ts                # POST /ai/ask
│   │   │   ├── ai.service.ts                   # RAG pipeline
│   │   │   └── ai.module.ts
│   │   │
│   │   ├── 📂 wishlists/                       # User wishlists
│   │   │   ├── dto/
│   │   │   ├── wishlists.controller.ts
│   │   │   ├── wishlists.service.ts
│   │   │   └── wishlists.module.ts
│   │   │
│   │   ├── 📂 alerts/                          # Price alerts
│   │   │   ├── dto/
│   │   │   ├── alerts.controller.ts
│   │   │   ├── alerts.service.ts
│   │   │   └── alerts.module.ts
│   │   │
│   │   ├── 📂 affiliate/                       # Affiliate links + clicks
│   │   │   ├── dto/
│   │   │   ├── affiliate.controller.ts
│   │   │   ├── affiliate.service.ts
│   │   │   └── affiliate.module.ts
│   │   │
│   │   ├── 📂 subscriptions/                   # Stripe subscriptions
│   │   │   ├── dto/
│   │   │   ├── subscriptions.controller.ts
│   │   │   ├── subscriptions.service.ts
│   │   │   ├── webhooks.controller.ts          # Stripe webhooks
│   │   │   └── subscriptions.module.ts
│   │   │
│   │   ├── 📂 notifications/                   # In-app, email, push
│   │   │   ├── dto/
│   │   │   ├── notifications.controller.ts
│   │   │   ├── notifications.service.ts
│   │   │   └── notifications.module.ts
│   │   │
│   │   └── 📂 wiki/                            # Wiki articles
│   │       ├── dto/
│   │       ├── wiki.controller.ts
│   │       ├── wiki.service.ts
│   │       └── wiki.module.ts
│   │
│   ├── app.module.ts                           # Root module - register all
│   ├── app.controller.ts                       # Root controller (deprecated, dùng health)
│   ├── app.service.ts                          # Root service (deprecated)
│   └── main.ts                                 # Entry point - Fastify + Swagger
│
├── 📂 dist/                                    # Build output (gitignored)
├── 📂 node_modules/                            # Dependencies (gitignored)
├── 📂 test/                                    # E2E tests
│   ├── app.e2e-spec.ts
│   └── jest-e2e.json
│
├── 📄 .env                                     # Local env (gitignored)
├── 📄 .env.example                             # Template env (committed)
├── 📄 .eslintrc.js                             # ESLint config
├── 📄 .prettierrc                              # Prettier config
├── 📄 nest-cli.json                            # NestJS CLI config
├── 📄 package.json                             # Dependencies + scripts
├── 📄 tsconfig.json                            # TypeScript config (extends shared)
├── 📄 tsconfig.build.json                      # Build-specific TS
└── 📄 README.md
```

**File quan trọng và mục đích:**

| File | Mục đích | Khi nào sửa |
|---|---|---|
| `src/main.ts` | Entry point, setup Fastify, CORS, Swagger | Khi đổi global middleware |
| `src/app.module.ts` | Root module, register tất cả modules | Khi thêm module mới |
| `src/common/common.module.ts` | Global filters, interceptors | Hiếm khi |
| `src/prisma/prisma.service.ts` | Wrapper PrismaClient | Hiếm khi |
| `src/redis/redis.service.ts` | Wrapper ioredis | Khi đổi connection options |
| `src/modules/*/` | Feature modules | Mỗi feature mới |
| `.env` | Local config | Mỗi machine |
| `nest-cli.json` | Build config | Khi đổi build behavior |
| `tsconfig.json` | TypeScript per-project | Khi cần path aliases |

**Module pattern (mỗi feature):**

```
modules/<feature-name>/
├── dto/                          # Data Transfer Objects
│   ├── create-<name>.dto.ts      # POST body validation
│   ├── update-<name>.dto.ts      # PATCH body validation
│   ├── query-<name>.dto.ts       # GET query params
│   └── <name>-response.dto.ts    # Response shape (Swagger)
├── <name>.controller.ts          # HTTP endpoints
├── <name>.service.ts             # Business logic
└── <name>.module.ts              # Module config
```

**Endpoints conventions:**

| Method | URL | Purpose | Auth |
|---|---|---|---|
| `GET` | `/<resource>` | List với pagination | Public hoặc JWT |
| `GET` | `/<resource>/:slug` | Detail by slug | Public |
| `GET` | `/<resource>/:id/by-id` | Detail by UUID | Public |
| `POST` | `/<resource>` | Create | Admin |
| `PATCH` | `/<resource>/:id` | Update | Admin |
| `DELETE` | `/<resource>/:id` | Soft delete | Admin |
| `GET` | `/<resource>/search` | Search | Public |

---

#### 4.1.2 apps/web - Frontend Next.js

**Vai trò:** Public website, hiển thị devices, compare, AI chat.

**Cấu trúc chi tiết:**

```
apps/web/
├── 📂 src/
│   │
│   ├── 📂 app/                                 # Next.js 15 App Router
│   │   │
│   │   ├── 📂 (public)/                        # Route group - public pages
│   │   │   ├── layout.tsx                      # Public layout (header, footer)
│   │   │   ├── page.tsx                        # Homepage
│   │   │   │
│   │   │   ├── 📂 (catalog)/                   # Catalog section
│   │   │   │   ├── layout.tsx                  # Catalog layout (sidebar)
│   │   │   │   │
│   │   │   │   ├── 📂 devices/
│   │   │   │   │   ├── page.tsx                # /devices - list
│   │   │   │   │   ├── loading.tsx             # Loading UI
│   │   │   │   │   ├── error.tsx               # Error boundary
│   │   │   │   │   └── 📂 [slug]/
│   │   │   │   │       ├── page.tsx            # /devices/iphone-16-pro
│   │   │   │   │       ├── opengraph-image.tsx # OG image
│   │   │   │   │       └── 📂 reviews/
│   │   │   │   │           └── page.tsx        # /devices/[slug]/reviews
│   │   │   │   │
│   │   │   │   ├── 📂 chipsets/[slug]/
│   │   │   │   │   └── page.tsx
│   │   │   │   │
│   │   │   │   ├── 📂 brands/[slug]/
│   │   │   │   │   └── page.tsx
│   │   │   │   │
│   │   │   │   └── 📂 families/[slug]/
│   │   │   │       └── page.tsx
│   │   │   │
│   │   │   ├── 📂 compare/
│   │   │   │   ├── page.tsx                    # /compare (max 4 devices)
│   │   │   │   └── 📂 [...slugs]/
│   │   │   │       └── page.tsx                # /compare/iphone-16/galaxy-s25
│   │   │   │
│   │   │   ├── 📂 search/
│   │   │   │   └── page.tsx                    # /search?q=...
│   │   │   │
│   │   │   └── 📂 ai/
│   │   │       └── page.tsx                    # /ai - AI chat interface
│   │   │
│   │   ├── 📂 (auth)/                          # Auth pages
│   │   │   ├── layout.tsx                      # Auth layout (centered)
│   │   │   ├── 📂 login/
│   │   │   │   └── page.tsx                    # /login
│   │   │   ├── 📂 register/
│   │   │   │   └── page.tsx                    # /register
│   │   │   └── 📂 forgot-password/
│   │   │       └── page.tsx                    # /forgot-password
│   │   │
│   │   ├── 📂 (account)/                       # User account (protected)
│   │   │   ├── layout.tsx                      # Account layout (sidebar nav)
│   │   │   ├── 📂 dashboard/
│   │   │   │   └── page.tsx                    # /dashboard
│   │   │   ├── 📂 wishlist/
│   │   │   │   └── page.tsx                    # /wishlist
│   │   │   ├── 📂 alerts/
│   │   │   │   └── page.tsx                    # /alerts
│   │   │   ├── 📂 notifications/
│   │   │   │   └── page.tsx                    # /notifications
│   │   │   ├── 📂 settings/
│   │   │   │   └── page.tsx                    # /settings
│   │   │   └── 📂 billing/
│   │   │       └── page.tsx                    # /billing
│   │   │
│   │   ├── 📂 api/                             # API Routes (Next.js)
│   │   │   ├── 📂 auth/
│   │   │   │   ├── 📂 [...nextauth]/
│   │   │   │   │   └── route.ts                # NextAuth.js handler
│   │   │   │   └── 📂 callback/
│   │   │   │       └── route.ts                # OAuth callbacks
│   │   │   └── 📂 og/
│   │   │       └── route.tsx                   # Dynamic OG images
│   │   │
│   │   ├── layout.tsx                          # Root layout (html, body)
│   │   ├── globals.css                         # Global CSS + Tailwind
│   │   ├── not-found.tsx                       # 404 page
│   │   ├── error.tsx                           # Global error
│   │   ├── loading.tsx                         # Global loading
│   │   └── sitemap.ts                          # Dynamic sitemap
│   │
│   ├── 📂 components/                          # React components
│   │   │
│   │   ├── 📂 ui/                              # shadcn/ui components
│   │   │   ├── button.tsx
│   │   │   ├── card.tsx
│   │   │   ├── dialog.tsx
│   │   │   ├── input.tsx
│   │   │   ├── select.tsx
│   │   │   ├── tabs.tsx
│   │   │   └── ...
│   │   │
│   │   ├── 📂 layout/                          # Layout components
│   │   │   ├── header.tsx                      # Site header
│   │   │   ├── footer.tsx                      # Site footer
│   │   │   ├── sidebar.tsx                     # Sidebar nav
│   │   │   └── mobile-nav.tsx                  # Mobile navigation
│   │   │
│   │   ├── 📂 catalog/                         # Catalog feature
│   │   │   ├── device-card.tsx                 # Device preview card
│   │   │   ├── device-list.tsx                 # Grid/list view
│   │   │   ├── filter-sidebar.tsx              # Filters
│   │   │   ├── sort-dropdown.tsx
│   │   │   └── pagination.tsx
│   │   │
│   │   ├── 📂 device-detail/                   # Detail page components
│   │   │   ├── hero-section.tsx                # Tên + ảnh + giá
│   │   │   ├── variant-selector.tsx            # Pick color/storage
│   │   │   ├── spec-table.tsx                  # Full specs
│   │   │   ├── gallery.tsx                     # Image gallery
│   │   │   ├── benchmark-chart.tsx
│   │   │   └── buy-buttons.tsx                 # Affiliate links
│   │   │
│   │   ├── 📂 compare/                         # Compare feature
│   │   │   ├── compare-table.tsx               # Side-by-side specs
│   │   │   ├── device-picker.tsx               # Add device to compare
│   │   │   ├── compare-summary.tsx             # AI summary
│   │   │   └── pros-cons.tsx
│   │   │
│   │   ├── 📂 search/                          # Search feature
│   │   │   ├── search-bar.tsx                  # Global search bar
│   │   │   ├── search-results.tsx
│   │   │   ├── search-filters.tsx
│   │   │   └── instant-search.tsx              # Quick suggestions
│   │   │
│   │   ├── 📂 ai/                              # AI chat
│   │   │   ├── chat-interface.tsx              # Main chat UI
│   │   │   ├── message-bubble.tsx
│   │   │   ├── citation-card.tsx               # Source citation
│   │   │   └── streaming-text.tsx              # Streaming response
│   │   │
│   │   ├── 📂 auth/                            # Auth components
│   │   │   ├── login-form.tsx
│   │   │   ├── register-form.tsx
│   │   │   └── auth-guard.tsx                  # Client-side route guard
│   │   │
│   │   └── 📂 common/                          # Reusable
│   │       ├── logo.tsx
│   │       ├── theme-toggle.tsx
│   │       ├── error-boundary.tsx
│   │       └── loading-spinner.tsx
│   │
│   ├── 📂 lib/                                 # Utilities (non-React)
│   │   ├── 📂 api/                             # API client
│   │   │   ├── client.ts                       # Axios/fetch wrapper
│   │   │   ├── devices.ts                      # Device API calls
│   │   │   ├── organizations.ts
│   │   │   ├── auth.ts
│   │   │   └── types.ts
│   │   ├── 📂 auth/
│   │   │   ├── session.ts                      # Get session
│   │   │   └── config.ts                       # NextAuth config
│   │   ├── 📂 utils/
│   │   │   ├── cn.ts                           # className helper (clsx + twMerge)
│   │   │   ├── format.ts                       # Format date, price, etc.
│   │   │   ├── slugify.ts
│   │   │   └── validation.ts
│   │   └── constants.ts                        # App constants
│   │
│   ├── 📂 hooks/                               # Custom React hooks
│   │   ├── use-auth.ts                         # Auth state
│   │   ├── use-debounce.ts                     # Debounce values
│   │   ├── use-local-storage.ts
│   │   ├── use-compare.ts                      # Compare list state
│   │   └── use-wishlist.ts
│   │
│   ├── 📂 stores/                              # Zustand stores
│   │   ├── compare.store.ts                    # Compare list (persist)
│   │   ├── user.store.ts                       # User session
│   │   └── ui.store.ts                         # UI state (theme, modal)
│   │
│   ├── 📂 types/                               # TypeScript types
│   │   ├── api.ts                              # API response types
│   │   ├── device.ts                           # Device-related types
│   │   └── user.ts
│   │
│   ├── 📂 styles/                              # Additional styles
│   │   └── prose.css                           # Typography for MDX
│   │
│   └── middleware.ts                           # Next.js middleware (auth, redirects)
│
├── 📂 public/                                  # Static assets
│   ├── favicon.ico
│   ├── logo.svg
│   ├── robots.txt
│   └── 📂 images/
│       └── ...
│
├── 📂 .next/                                   # Build output (gitignored)
├── 📂 node_modules/                            # gitignored
│
├── 📄 .env.local                               # Local env (gitignored)
├── 📄 .env.local.example                       # Template
├── 📄 next.config.ts                           # Next.js config
├── 📄 tailwind.config.ts                       # Tailwind config
├── 📄 postcss.config.mjs                       # PostCSS
├── 📄 tsconfig.json                            # TypeScript config
├── 📄 package.json
├── 📄 .eslintrc.json
└── 📄 README.md
```

**Conventions Next.js App Router:**

| File name | Mục đích | Bắt buộc? |
|---|---|---|
| `page.tsx` | Page component (route) | ✅ Có |
| `layout.tsx` | Shared layout cho route | ❌ Optional |
| `loading.tsx` | Loading UI (Suspense) | ❌ Optional |
| `error.tsx` | Error boundary | ❌ Optional |
| `not-found.tsx` | 404 cho route | ❌ Optional |
| `route.ts` | API route handler | ❌ Chỉ trong `/api/` |
| `opengraph-image.tsx` | Dynamic OG image | ❌ Optional |
| `(group)/` | Route group (không trong URL) | ❌ Optional |
| `[param]/` | Dynamic route | ❌ Optional |
| `[...slug]/` | Catch-all route | ❌ Optional |

---

#### 4.1.3 apps/admin - Admin Dashboard

**Vai trò:** Internal CMS cho admin/moderator quản lý content, review crawl data, analytics.

**Cấu trúc:**

```
apps/admin/
├── src/
│   ├── app/
│   │   ├── (auth)/login/page.tsx
│   │   └── (dashboard)/
│   │       ├── layout.tsx                      # Dashboard layout
│   │       ├── page.tsx                        # /admin - Overview
│   │       │
│   │       ├── 📂 devices/                     # Device management
│   │       │   ├── page.tsx                    # List + filters
│   │       │   ├── new/page.tsx                # Tạo device
│   │       │   └── [id]/edit/page.tsx          # Edit
│   │       │
│   │       ├── 📂 crawl-queue/                 # Review crawled data
│   │       │   ├── page.tsx                    # Queue list
│   │       │   └── [id]/page.tsx               # Review + approve
│   │       │
│   │       ├── 📂 users/                       # User management
│   │       │   ├── page.tsx
│   │       │   └── [id]/page.tsx
│   │       │
│   │       ├── 📂 analytics/                   # Analytics dashboard
│   │       │   ├── page.tsx                    # Overview
│   │       │   ├── revenue/page.tsx            # Revenue
│   │       │   └── users/page.tsx              # User analytics
│   │       │
│   │       ├── 📂 affiliate/                   # Affiliate management
│   │       │   ├── partners/page.tsx
│   │       │   ├── links/page.tsx
│   │       │   └── conversions/page.tsx
│   │       │
│   │       └── 📂 settings/                    # Settings
│   │           └── page.tsx
│   │
│   ├── components/                             # Admin components
│   │   ├── data-table/                         # Reusable data table
│   │   │   ├── data-table.tsx
│   │   │   ├── pagination.tsx
│   │   │   └── filters.tsx
│   │   ├── forms/                              # Form components
│   │   └── charts/                             # Analytics charts
│   │
│   └── lib/
│       └── (giống apps/web)
│
└── (config files giống apps/web)
```

---

#### 4.1.4 apps/ai-service - AI Microservice

**Vai trò:** Tách riêng AI heavy compute (RAG, embeddings, LLM calls). Scale độc lập.

**Cấu trúc:**

```
apps/ai-service/
├── src/
│   ├── 📂 modules/
│   │   │
│   │   ├── 📂 rag/                             # RAG pipeline
│   │   │   ├── rag.service.ts                  # Main RAG logic
│   │   │   ├── retriever.service.ts            # Hybrid retrieval
│   │   │   ├── reranker.service.ts             # Cohere reranker
│   │   │   ├── synthesizer.service.ts          # LLM synthesize
│   │   │   └── rag.module.ts
│   │   │
│   │   ├── 📂 embeddings/                      # Embedding pipeline
│   │   │   ├── embeddings.service.ts           # Voyage/OpenAI embed
│   │   │   ├── chunker.service.ts              # Text chunking
│   │   │   ├── indexer.service.ts              # Index to pgvector
│   │   │   └── embeddings.module.ts
│   │   │
│   │   ├── 📂 llm/                             # LLM abstraction
│   │   │   ├── llm.service.ts                  # Multi-provider
│   │   │   ├── providers/
│   │   │   │   ├── anthropic.provider.ts
│   │   │   │   ├── openai.provider.ts
│   │   │   │   └── google.provider.ts
│   │   │   └── llm.module.ts
│   │   │
│   │   └── 📂 extractor/                       # LLM data extractor
│   │       ├── extractor.service.ts            # Extract specs from HTML
│   │       ├── schemas/                        # Output schemas
│   │       │   ├── device-model.schema.ts
│   │       │   └── chipset.schema.ts
│   │       └── extractor.module.ts
│   │
│   ├── app.module.ts
│   └── main.ts                                 # Port 4001
│
└── (config files giống apps/api)
```

**Endpoints:**

| Method | URL | Purpose |
|---|---|---|
| `POST` | `/api/v1/ai/ask` | RAG: User hỏi → answer + citations |
| `POST` | `/api/v1/ai/embed` | Embed text → vector |
| `POST` | `/api/v1/ai/extract` | LLM extract specs từ HTML |
| `POST` | `/api/v1/ai/compare` | AI so sánh 2 devices |

---

#### 4.1.5 apps/crawler - Crawler Service

**Vai trò:** Crawl data từ GSMArena, Notebookcheck, official sites. Có rate limit, proxy rotation.

**Cấu trúc:**

```
apps/crawler/
├── src/
│   ├── 📂 modules/
│   │   │
│   │   ├── 📂 sources/                         # Source configs
│   │   │   ├── gsmarena.crawler.ts             # GSMArena specific
│   │   │   ├── notebookcheck.crawler.ts
│   │   │   ├── apple.crawler.ts                # Apple official
│   │   │   ├── samsung.crawler.ts
│   │   │   └── base.crawler.ts                 # Abstract class
│   │   │
│   │   ├── 📂 scheduler/                       # Schedule crawls
│   │   │   ├── scheduler.service.ts            # Cron jobs
│   │   │   └── scheduler.module.ts
│   │   │
│   │   ├── 📂 queue/                           # BullMQ queue
│   │   │   ├── crawl.queue.ts                  # Crawl jobs
│   │   │   ├── crawl.processor.ts              # Process jobs
│   │   │   └── queue.module.ts
│   │   │
│   │   ├── 📂 storage/                         # Save raw HTML
│   │   │   └── raw-pages.service.ts            # → raw_pages table
│   │   │
│   │   └── 📂 proxy/                           # Proxy rotation
│   │       ├── proxy.service.ts
│   │       └── proxy.module.ts
│   │
│   ├── app.module.ts
│   └── main.ts                                 # Port 4002
│
└── (config files)
```

---

#### 4.1.6 apps/workers - Background Jobs

**Vai trò:** Process BullMQ jobs (email, embeddings, price check, notifications).

**Cấu trúc:**

```
apps/workers/
├── src/
│   ├── 📂 workers/
│   │   │
│   │   ├── 📂 email/                           # Send emails
│   │   │   ├── email.processor.ts              # Process email queue
│   │   │   ├── templates/                      # Email templates (MJML)
│   │   │   │   ├── welcome.tsx
│   │   │   │   ├── price-alert.tsx
│   │   │   │   └── verification.tsx
│   │   │   └── email.module.ts
│   │   │
│   │   ├── 📂 embeddings/                      # Generate embeddings async
│   │   │   ├── embeddings.processor.ts
│   │   │   └── embeddings.module.ts
│   │   │
│   │   ├── 📂 price-check/                     # Cron: Check prices
│   │   │   ├── price-check.processor.ts
│   │   │   └── price-check.module.ts
│   │   │
│   │   ├── 📂 notifications/                   # Push notifications
│   │   │   ├── push.processor.ts
│   │   │   └── push.module.ts
│   │   │
│   │   └── 📂 reports/                         # Daily/weekly reports
│   │       ├── reports.processor.ts
│   │       └── reports.module.ts
│   │
│   ├── app.module.ts
│   └── main.ts                                 # Worker, không expose HTTP
│
└── (config files)
```

---

### 4.2 Packages - Shared libraries

#### 4.2.1 packages/database

**Vai trò:** Prisma schema, migrations, Prisma Client. Dùng chung cho mọi app.

```
packages/database/
├── 📂 prisma/
│   ├── schema.prisma                           # Schema (~90 tables, 14 groups)
│   ├── seed.ts                                 # Seed data
│   ├── 📂 migrations/                          # SQL migrations
│   │   ├── 20260506_init/
│   │   │   └── migration.sql
│   │   └── migration_lock.toml
│   └── 📂 raw-sql/                             # Manual SQL
│       └── post-migrate.sql                    # CHECK constraints, indexes
│
├── 📂 generated/                               # Generated Prisma Client (gitignored)
│   └── client/
│       ├── index.js
│       └── index.d.ts
│
├── 📂 src/
│   └── index.ts                                # Re-export Prisma types
│
├── 📄 .env                                     # DATABASE_URL (gitignored)
├── 📄 package.json
└── 📄 tsconfig.json
```

**Scripts:**

```json
{
  "scripts": {
    "db:generate": "prisma generate",
    "db:migrate": "prisma migrate dev",
    "db:migrate:deploy": "prisma migrate deploy",
    "db:reset": "prisma migrate reset",
    "db:studio": "prisma studio",
    "db:seed": "tsx prisma/seed.ts"
  }
}
```

---

#### 4.2.2 packages/types

**Vai trò:** TypeScript types/interfaces dùng chung giữa frontend & backend.

```
packages/types/
├── src/
│   ├── api/                                    # API request/response types
│   │   ├── device.types.ts
│   │   ├── organization.types.ts
│   │   ├── user.types.ts
│   │   └── index.ts
│   ├── domain/                                 # Domain models
│   │   ├── device.ts
│   │   ├── user.ts
│   │   └── index.ts
│   ├── enums/                                  # Shared enums
│   │   ├── role.enum.ts
│   │   ├── status.enum.ts
│   │   └── index.ts
│   └── index.ts                                # Main export
└── package.json
```

---

#### 4.2.3 packages/ui

**Vai trò:** Shared React components (button, card, modal...) dùng cho cả web + admin.

```
packages/ui/
├── src/
│   ├── components/
│   │   ├── button.tsx
│   │   ├── card.tsx
│   │   ├── input.tsx
│   │   ├── dialog.tsx
│   │   └── ...
│   ├── hooks/
│   │   ├── use-media-query.ts
│   │   └── use-on-click-outside.ts
│   ├── styles/
│   │   └── globals.css
│   └── index.ts                                # Main export
├── tailwind.config.ts                          # Base config
└── package.json
```

---

#### 4.2.4 packages/config

**Vai trò:** Shared configurations (ESLint, TypeScript, Tailwind).

```
packages/config/
├── 📂 typescript/
│   ├── base.json                               # Base TS config
│   ├── nestjs.json                             # NestJS-specific
│   ├── nextjs.json                             # Next.js-specific
│   └── react-library.json                      # React libs
├── 📂 eslint/
│   ├── base.js
│   ├── nextjs.js
│   └── nestjs.js
├── 📂 tailwind/
│   └── base.js                                 # Base Tailwind config
└── package.json
```

---

#### 4.2.5 packages/api-client

**Vai trò:** TypeScript SDK gọi API. Dùng cho web, admin, mobile.

```
packages/api-client/
├── src/
│   ├── client.ts                               # Main client class
│   ├── endpoints/
│   │   ├── devices.endpoint.ts
│   │   ├── auth.endpoint.ts
│   │   ├── users.endpoint.ts
│   │   └── index.ts
│   ├── types/
│   └── index.ts
└── package.json
```

**Usage:**

```typescript
import { SpecHubClient } from '@spechub/api-client'

const client = new SpecHubClient({
  baseUrl: 'http://localhost:4000/api/v1',
  token: 'jwt_token',
})

const devices = await client.devices.list({ page: 1 })
```

---

#### 4.2.6 packages/auth

**Vai trò:** Auth helpers, NextAuth config, session utilities.

```
packages/auth/
├── src/
│   ├── config.ts                               # NextAuth config
│   ├── providers/
│   │   ├── credentials.provider.ts
│   │   └── google.provider.ts
│   ├── utils/
│   │   ├── jwt.ts
│   │   └── session.ts
│   └── index.ts
└── package.json
```

---

#### 4.2.7 packages/utils

**Vai trò:** Pure utility functions (formatters, validators, helpers).

```
packages/utils/
├── src/
│   ├── format/
│   │   ├── date.ts                             # formatDate, timeAgo
│   │   ├── price.ts                            # formatPrice, formatCurrency
│   │   └── number.ts                           # formatNumber, abbreviate
│   ├── validation/
│   │   ├── email.ts
│   │   ├── slug.ts
│   │   └── uuid.ts
│   ├── string/
│   │   ├── slugify.ts
│   │   ├── truncate.ts
│   │   └── normalize.ts                        # Bỏ dấu tiếng Việt
│   └── index.ts
└── package.json
```

---

#### 4.2.8 packages/ai-core

**Vai trò:** AI utilities dùng chung cho ai-service và backend.

```
packages/ai-core/
├── src/
│   ├── embeddings/
│   │   ├── voyage.ts                           # Voyage AI provider
│   │   ├── openai.ts                           # OpenAI embeddings
│   │   └── interface.ts
│   ├── prompts/
│   │   ├── rag.prompts.ts                      # RAG system prompts
│   │   ├── extractor.prompts.ts                # Extraction prompts
│   │   └── compare.prompts.ts
│   ├── chunking/
│   │   ├── recursive.ts                        # Recursive chunking
│   │   └── semantic.ts
│   ├── vectors/
│   │   ├── similarity.ts                       # Cosine similarity
│   │   └── normalize.ts
│   └── index.ts
└── package.json
```

---

#### 4.2.9 packages/analytics

**Vai trò:** Tracking events (PostHog), unified API cho web/mobile.

```
packages/analytics/
├── src/
│   ├── client.ts                               # PostHog client
│   ├── events/                                 # Event definitions
│   │   ├── user.events.ts
│   │   ├── device.events.ts
│   │   └── conversion.events.ts
│   ├── hooks/
│   │   └── use-analytics.ts                    # React hook
│   └── index.ts
└── package.json
```

---

### 4.3 Infra & Docs

```
infra/
├── 📂 docker/
│   ├── api.Dockerfile                          # Build API image
│   ├── web.Dockerfile                          # Build web image
│   ├── workers.Dockerfile                      # Build workers image
│   └── docker-compose.prod.yml                 # Production compose
│
└── 📂 scripts/
    ├── deploy.sh                               # Deploy script
    ├── backup-db.sh                            # DB backup
    └── seed-prod.sh                            # Seed production

docs/
├── 📂 architecture/
│   ├── 001-monorepo.md                         # ADR: Why monorepo
│   ├── 002-prisma-vs-typeorm.md
│   ├── 003-meilisearch-vs-elasticsearch.md
│   └── system-diagram.md
│
├── 📂 api/
│   ├── openapi.yaml                            # OpenAPI spec
│   └── postman-collection.json
│
└── 📂 runbooks/
    ├── deployment.md
    ├── debugging.md
    └── incident-response.md
```

---

### 4.4 Root configuration files

| File | Mục đích | Sửa khi nào |
|---|---|---|
| `package.json` | Root scripts + dev deps | Thêm script global |
| `pnpm-workspace.yaml` | Định nghĩa workspaces | Thêm folder mới vào workspace |
| `turbo.json` | Turborepo task config | Thêm task mới |
| `tsconfig.json` | Root TypeScript references | Hiếm khi |
| `.gitignore` | Ignore files | Khi build tool mới |
| `.npmrc` | pnpm config | Hiếm khi |
| `.env.example` | Template env vars | Khi thêm env var mới |
| `.prettierrc` | Prettier rules | Thay đổi format |
| `.eslintrc.js` | ESLint config root | Thay đổi lint rules |
| `README.md` | Project intro | Quan trọng |
| `SPECHUB-MASTER.md` | Master doc | Mỗi major change |

---

## 5. Sơ đồ quan hệ giữa các thành phần

### 5.1 High-level architecture

```
╔════════════════════════════════════════════════════════════════╗
║                        CLIENTS LAYER                            ║
║  ┌──────────────┐    ┌──────────────┐    ┌──────────────┐     ║
║  │   Web App    │    │  Admin App   │    │  Mobile App  │     ║
║  │  (Next.js)   │    │  (Next.js)   │    │   (Expo)     │     ║
║  └──────┬───────┘    └──────┬───────┘    └──────┬───────┘     ║
╚═════════│═══════════════════│═══════════════════│══════════════╝
          │                   │                   │
          │  HTTPS + JWT Bearer Token              │
          ▼                   ▼                   ▼
╔════════════════════════════════════════════════════════════════╗
║                     API GATEWAY LAYER                           ║
║  ┌─────────────────────────────────────────────────────────┐  ║
║  │              Main API (apps/api)                         │  ║
║  │  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐   │  ║
║  │  │   Auth   │ │ Catalog  │ │   AI     │ │Commerce  │   │  ║
║  │  │  Module  │ │ Module   │ │ Module   │ │ Module   │   │  ║
║  │  └──────────┘ └──────────┘ └──────────┘ └──────────┘   │  ║
║  │  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐   │  ║
║  │  │  Users   │ │ Search   │ │Wishlist  │ │   Wiki   │   │  ║
║  │  │  Module  │ │ Module   │ │ Module   │ │ Module   │   │  ║
║  │  └──────────┘ └──────────┘ └──────────┘ └──────────┘   │  ║
║  └─────────────────────────────────────────────────────────┘  ║
╚═════│════════════════│════════════════│═══════════════════════╝
      │                │                │
      ▼                ▼                ▼
┌──────────┐    ┌──────────┐    ┌──────────────┐
│ AI       │    │ Crawler  │    │   Workers    │
│ Service  │    │ Service  │    │   (BullMQ)   │
└─────┬────┘    └─────┬────┘    └──────┬───────┘
      │               │                │
      └───────┬───────┴────────────────┘
              │
              ▼
╔════════════════════════════════════════════════════════════════╗
║                      DATA LAYER                                 ║
║  ┌─────────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐   ║
║  │ PostgreSQL  │  │ pgvector │  │  Redis   │  │   S3/R2  │   ║
║  │  (16.x)     │  │ (vectors)│  │  (cache) │  │ (files)  │   ║
║  └─────────────┘  └──────────┘  └──────────┘  └──────────┘   ║
║  ┌─────────────┐                                               ║
║  │ Meilisearch │                                               ║
║  │  (search)   │                                               ║
║  └─────────────┘                                               ║
╚════════════════════════════════════════════════════════════════╝
              │
              ▼
╔════════════════════════════════════════════════════════════════╗
║                   EXTERNAL SERVICES                             ║
║  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐       ║
║  │  Claude  │  │  GPT-4   │  │ Voyage   │  │  Stripe  │       ║
║  │   API    │  │   API    │  │   AI     │  │   API    │       ║
║  └──────────┘  └──────────┘  └──────────┘  └──────────┘       ║
║  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐       ║
║  │  VNPay   │  │  Resend  │  │  Sentry  │  │ PostHog  │       ║
║  └──────────┘  └──────────┘  └──────────┘  └──────────┘       ║
╚════════════════════════════════════════════════════════════════╝
```

### 5.2 Package dependencies graph

```
┌────────────────────────────────────────────────────────────┐
│                       APPS                                  │
│                                                             │
│   apps/web ─────────────────────────┐                      │
│       │                              │                      │
│       ├─► @spechub/database         │                      │
│       ├─► @spechub/types            │                      │
│       ├─► @spechub/ui               │                      │
│       ├─► @spechub/api-client       │                      │
│       ├─► @spechub/auth             │                      │
│       ├─► @spechub/utils            │                      │
│       └─► @spechub/analytics        │                      │
│                                      │                      │
│   apps/admin ──────────────────────┤                      │
│       │                              ├─► (same as web)     │
│                                      │                      │
│   apps/api ────────────────────────┤                      │
│       ├─► @spechub/database         │                      │
│       ├─► @spechub/types            │                      │
│       ├─► @spechub/utils            │                      │
│       └─► @spechub/ai-core          │                      │
│                                      │                      │
│   apps/ai-service ─────────────────┤                      │
│       ├─► @spechub/database         │                      │
│       ├─► @spechub/types            │                      │
│       └─► @spechub/ai-core          │                      │
│                                      │                      │
│   apps/crawler ────────────────────┤                      │
│       ├─► @spechub/database         │                      │
│       ├─► @spechub/types            │                      │
│       └─► @spechub/ai-core          │                      │
│                                      │                      │
│   apps/workers ────────────────────┘                      │
│       ├─► @spechub/database                                │
│       ├─► @spechub/types                                   │
│       └─► @spechub/utils                                   │
│                                                             │
└────────────────────────────────────────────────────────────┘
                          │
                          ▼
┌────────────────────────────────────────────────────────────┐
│                    PACKAGES                                 │
│                                                             │
│   @spechub/api-client ────► @spechub/types                 │
│   @spechub/auth ─────────► @spechub/types                  │
│   @spechub/ui ──────────► @spechub/utils                   │
│   @spechub/ai-core ─────► @spechub/types                   │
│   @spechub/database ────► (standalone, Prisma)             │
│   @spechub/types ───────► (standalone)                     │
│   @spechub/utils ───────► (standalone)                     │
│   @spechub/config ──────► (standalone)                     │
│   @spechub/analytics ───► @spechub/types                   │
│                                                             │
└────────────────────────────────────────────────────────────┘
```

### 5.3 NestJS Module dependency graph (apps/api)

```
                     AppModule
                         │
        ┌────────────────┼────────────────┬───────────────┐
        │                │                │               │
        ▼                ▼                ▼               ▼
  ConfigModule    ThrottlerModule    CommonModule   PrismaModule
       (global)        (global)         (global)       (global)
                                                          │
                                                          │ (used by all)
                                                          ▼
        ┌──────────────────────────────────────────────────┐
        │                                                  │
        ▼                                                  ▼
   RedisModule                                       UsersModule
     (global)                                             │
                                                          │ uses
                                                          ▼
                                                     AuthModule
                                                       │  │
                                                       │  ├─► JwtModule
                                                       │  └─► PassportModule
                                                       │
                                                       │ used by guards in all modules
                                                       │
        ┌────────────────┬──────────────┬──────────────┴───────────┬──────────────┐
        ▼                ▼              ▼                          ▼              ▼
 OrganizationsModule  CategoriesModule  ModelsModule       VariantsModule    SearchModule
        │                │                  │                      │                │
        │                │                  │                      │                │
        └──────────┬─────┴──────────┬──────┴──────────────┬──────┘                │
                   ▼                ▼                     ▼                        │
              uses PrismaService  uses RedisService  uses AuthModule          uses Meilisearch
                                                          │
                  (continues for: chipsets, wishlists, alerts, affiliate,
                   subscriptions, notifications, wiki, ai)
```

### 5.4 Request flow (Auth + Authorization)

```
┌──────────┐
│  Client  │
│ Browser  │
└────┬─────┘
     │ POST /api/v1/auth/login
     │ { email, password }
     ▼
┌──────────────────────────────────────────┐
│         Fastify HTTP Server               │
│  + CORS + Helmet + Cookie + Throttler    │
└────┬─────────────────────────────────────┘
     │
     ▼
┌──────────────────────────────────────────┐
│       Global Guards (in order)           │
│                                          │
│  1. ThrottlerGuard - Rate limit check   │
│  2. JwtAuthGuard                         │
│     - Check @Public()? → yes, skip      │
│     - else, verify JWT                   │
│  3. RolesGuard                           │
│     - Check @Roles()? → no, allow       │
│     - else, check user.role             │
└────┬─────────────────────────────────────┘
     │
     ▼
┌──────────────────────────────────────────┐
│      Global Pipes (validation)           │
│                                          │
│  - ValidationPipe (class-validator)      │
│  - Transform DTO + reject invalid        │
└────┬─────────────────────────────────────┘
     │
     ▼
┌──────────────────────────────────────────┐
│    Controller (AuthController.login)     │
│                                          │
│  - LocalAuthGuard verifies email/pass    │
│  - LocalStrategy.validate() returns user │
│  - req.user attached                     │
└────┬─────────────────────────────────────┘
     │
     ▼
┌──────────────────────────────────────────┐
│      AuthService.login(user)             │
│                                          │
│  - signTokens({ sub, email, role })      │
│  - jwtService.signAsync() x 2            │
│  - usersService.updateLastLogin()        │
└────┬─────────────────────────────────────┘
     │
     ▼
┌──────────────────────────────────────────┐
│    Global Interceptors (in order)        │
│                                          │
│  1. TransformInterceptor                 │
│     - Wrap response { data, meta }       │
│  2. LoggingInterceptor                   │
│     - Log: POST /auth/login 200 45ms     │
└────┬─────────────────────────────────────┘
     │
     ▼
┌──────────────────────────────────────────┐
│         Response to Client               │
│                                          │
│  {                                       │
│    "data": {                             │
│      "user": { ... },                    │
│      "tokens": {                         │
│        "access_token": "...",            │
│        "refresh_token": "...",           │
│        "expires_in": 604800              │
│      }                                   │
│    }                                     │
│  }                                       │
└──────────────────────────────────────────┘
```

---

## 6. Database schema relationships

### 6.1 Sơ đồ quan hệ 14 nhóm bảng

```
┌─────────────────────────────────────────────────────────────┐
│                        META LAYER (0)                        │
│  languages ─┬─► translations                                 │
│             └─► (used by all "content" tables)              │
│                                                              │
│  sources ─► citations ─► (cited in wiki, specs)             │
│                                                              │
│  media_assets ─► entity_media ─► (polymorphic)              │
│  tags ─► entity_tags ─► (polymorphic)                       │
│  units ─► feature_definitions ─► benchmarks                 │
└─────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│                  ORGANIZATIONS (A)                           │
│  organizations ─┬─► product_families (brand_org)            │
│   │             ├─► chipsets (manufacturer)                  │
│   │             ├─► display_units, camera_sensors, ...      │
│   │             └─► organization_role_assignments           │
│   │                                                          │
│   └─► (self-ref: parent_org_id)                             │
└─────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│                  DEVICE HIERARCHY (B)                        │
│                                                              │
│  device_categories (tree)                                    │
│        │                                                     │
│        ▼                                                     │
│  product_families ◄── organizations (brand)                 │
│        │                                                     │
│        ▼                                                     │
│  device_models ─► model_lineage (successor/predecessor)     │
│        │                                                     │
│        ▼                                                     │
│  device_variants (CENTER OF SCHEMA)                         │
│        ├─► variant_physical_specs (1-1)                     │
│        ├─► variant_io_specs (1-1)                           │
│        ├─► variant_thermal_specs (1-1)                      │
│        ├─► variant_price_history (1-many)                   │
│        └─► (composition tables - layer F)                   │
└─────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│                  TAXONOMY (C)                                │
│                                                              │
│  technology_families (self-ref tree)                        │
│  architectures (ARMv9.2-A, x86-64...)                       │
│  process_nodes (TSMC N3B, ...)  ─► foundry_org              │
│  display_technologies, battery_chemistries                  │
│  network_generations (5G, Wi-Fi 7...)                       │
└─────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│                  COMPONENTS (D)                              │
│                                                              │
│  chipsets ─┬─► cpus (chipset_cpu_links)                     │
│            ├─► gpus (chipset_gpu_links)                     │
│            ├─► npus (chipset_npu_links)                     │
│            └─► modems (chipset_modem_links)                 │
│                                                              │
│  camera_modules ─► camera_sensors (sensor_links)            │
│  display_units, battery_units                                │
│  memory_standards, storage_standards                         │
│  operating_systems ─► os_versions ─► os_ui_layers           │
└─────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│           VARIANT COMPOSITION (F) - 15+ tables               │
│                                                              │
│  device_variants ─┬─► variant_chipsets ◄─► chipsets         │
│                   ├─► variant_displays ◄─► display_units    │
│                   ├─► variant_batteries ◄─► battery_units   │
│                   ├─► variant_camera_modules                │
│                   ├─► variant_memory_configs                │
│                   ├─► variant_storage_configs               │
│                   ├─► variant_operating_systems             │
│                   └─► (...)                                  │
└─────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│        BENCHMARKS (H) - 5 score tables                       │
│                                                              │
│  benchmarks ─► benchmark_runs (context)                     │
│              │                                               │
│              ├─► device_variant_benchmarks                   │
│              ├─► chipset_benchmarks                          │
│              ├─► cpu_benchmarks                              │
│              ├─► gpu_benchmarks                              │
│              └─► npu_benchmarks                              │
└─────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│                  USERS & WIKI (I)                            │
│                                                              │
│  users ─┬─► wiki_revisions (author)                         │
│         ├─► comments                                         │
│         ├─► wishlists                                        │
│         ├─► price_alerts                                     │
│         ├─► notifications                                    │
│         └─► subscriptions                                    │
│                                                              │
│  wiki_articles (polymorphic) ─► wiki_revisions              │
│                              └─► wiki_article_citations     │
└─────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│          AI / SEARCH / CRAWLER (J, K)                        │
│                                                              │
│  embeddings (pgvector) ─► (polymorphic on entity)           │
│  ai_query_cache ─► (no FK, query hash unique)               │
│  search_logs ─► users                                        │
│                                                              │
│  data_sources ─► raw_pages ─► device_models                 │
└─────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│        COMMERCE & ENGAGEMENT (L, M, N)                       │
│                                                              │
│  affiliate_partners ─► affiliate_links ─► device_variants   │
│                        │                                     │
│                        ├─► affiliate_price_history          │
│                        └─► affiliate_clicks                  │
│                                                              │
│  subscription_plans ─► subscriptions ─► users               │
│                                                              │
│  wishlists ─► wishlist_items ─► device_variants             │
│  price_alerts ─► device_variants                            │
│  notifications ─► users                                      │
└─────────────────────────────────────────────────────────────┘
```

### 6.2 Patterns chính

#### Pattern 1: Polymorphic relationships
```
entity_table + entity_id → reference đến bất kỳ bảng nào

Ví dụ:
  translations: entity_table='device_models', entity_id='<uuid>'
  entity_media: entity_table='chipsets', entity_id='<uuid>'
  comments: entity_table='device_models', entity_id='<uuid>'
```

#### Pattern 2: Vertical partitioning (1-1)
```
device_variants ─┬─► variant_physical_specs (PK = device_variant_id)
                 ├─► variant_io_specs (PK = device_variant_id)
                 └─► variant_thermal_specs (PK = device_variant_id)
```

#### Pattern 3: Junction table với role
```
variant_chipsets:
  - device_variant_id
  - chipset_id
  - chip_role ('soc' | 'controller' | 'coprocessor')
  - is_primary

UNIQUE(device_variant_id, chipset_id, chip_role)
```

#### Pattern 4: Lookup tables thay enum
```
device_models.release_status_id → release_statuses.id
                                  (rumored, announced, released, eol...)
```

---

## 7. Module dependencies

### 7.1 NestJS module hierarchy (apps/api)

```
AppModule (root)
│
├─► Global Modules
│   ├─► ConfigModule (env)
│   ├─► ThrottlerModule (rate limit)
│   ├─► CommonModule
│   │   ├─► GlobalExceptionFilter
│   │   ├─► TransformInterceptor
│   │   └─► LoggingInterceptor
│   ├─► PrismaModule
│   │   └─► PrismaService
│   └─► RedisModule
│       └─► RedisService
│
├─► Foundation Modules
│   ├─► UsersModule
│   │   └─► UsersService
│   │       (uses: PrismaService)
│   └─► AuthModule
│       ├─► JwtModule (async config)
│       ├─► PassportModule
│       ├─► JwtStrategy
│       │   (uses: UsersService)
│       ├─► LocalStrategy
│       │   (uses: UsersService)
│       ├─► AuthService
│       │   (uses: UsersService, JwtService)
│       └─► AuthController
│
└─► Feature Modules
    │
    ├─► OrganizationsModule
    │   ├─► OrganizationsService
    │   │   (uses: PrismaService, RedisService)
    │   └─► OrganizationsController
    │       (uses: JwtAuthGuard, RolesGuard)
    │
    ├─► DeviceCategoriesModule
    │   └─► (similar structure)
    │
    ├─► ProductFamiliesModule
    │   └─► (similar structure)
    │
    ├─► DeviceModelsModule
    │   └─► (uses: OrganizationsService, CategoriesService...)
    │
    ├─► DeviceVariantsModule
    │   └─► (uses: DeviceModelsService...)
    │
    ├─► ChipsetsModule
    │   └─► (similar)
    │
    ├─► SearchModule
    │   ├─► MeilisearchService
    │   └─► SearchController
    │       (uses: PrismaService for sync)
    │
    ├─► AIModule
    │   ├─► AIService
    │   │   (calls ai-service via HTTP)
    │   └─► AIController
    │
    ├─► WishlistsModule
    ├─► AlertsModule
    ├─► AffiliateModule
    ├─► SubscriptionsModule
    ├─► NotificationsModule
    └─► WikiModule
```

### 7.2 Frontend component hierarchy (apps/web)

```
RootLayout (app/layout.tsx)
│
├─► ThemeProvider
├─► QueryProvider (TanStack Query)
├─► AuthProvider
└─► Toaster
    │
    ├─► (public)/layout.tsx
    │   ├─► Header
    │   │   ├─► Logo
    │   │   ├─► MainNav
    │   │   ├─► SearchBar
    │   │   └─► UserMenu / LoginButton
    │   │
    │   ├─► <Page Content>
    │   │   │
    │   │   ├─► HomePage (page.tsx)
    │   │   │   ├─► HeroSection
    │   │   │   ├─► PopularDevices
    │   │   │   ├─► RecentReviews
    │   │   │   └─► CTASection
    │   │   │
    │   │   ├─► DeviceListPage (/devices)
    │   │   │   ├─► FilterSidebar
    │   │   │   ├─► SortDropdown
    │   │   │   ├─► DeviceGrid
    │   │   │   │   └─► DeviceCard (multiple)
    │   │   │   └─► Pagination
    │   │   │
    │   │   ├─► DeviceDetailPage (/devices/[slug])
    │   │   │   ├─► HeroSection
    │   │   │   │   ├─► ImageGallery
    │   │   │   │   ├─► VariantSelector
    │   │   │   │   └─► BuyButtons
    │   │   │   ├─► Tabs
    │   │   │   │   ├─► SpecsTab
    │   │   │   │   │   └─► SpecTable
    │   │   │   │   ├─► ReviewsTab
    │   │   │   │   ├─► CompareTab
    │   │   │   │   └─► BenchmarksTab
    │   │   │   │       └─► BenchmarkChart
    │   │   │   ├─► RelatedDevices
    │   │   │   └─► AISummaryCard
    │   │   │
    │   │   ├─► ComparePage (/compare)
    │   │   │   ├─► DevicePicker (multiple)
    │   │   │   ├─► CompareTable
    │   │   │   ├─► AIAnalysis
    │   │   │   └─► ProsCons
    │   │   │
    │   │   ├─► SearchPage (/search)
    │   │   │   ├─► SearchBar (large)
    │   │   │   ├─► SearchFilters
    │   │   │   └─► SearchResults
    │   │   │
    │   │   └─► AIPage (/ai)
    │   │       ├─► ChatInterface
    │   │       │   ├─► MessageList
    │   │       │   │   └─► MessageBubble (multiple)
    │   │       │   └─► InputBox
    │   │       └─► CitationsSidebar
    │   │           └─► CitationCard (multiple)
    │   │
    │   └─► Footer
    │
    ├─► (auth)/layout.tsx (centered)
    │   ├─► LoginPage
    │   │   └─► LoginForm
    │   └─► RegisterPage
    │       └─► RegisterForm
    │
    └─► (account)/layout.tsx (protected)
        ├─► AccountSidebar
        ├─► DashboardPage
        ├─► WishlistPage
        ├─► AlertsPage
        ├─► SettingsPage
        └─► BillingPage
```

---

## 8. Roadmap chi tiết các phần cần làm

### 8.1 Progress overview

| Phase | Status | Sprints |
|---|---|---|
| **Phase 0 — Foundation** | ✅ Done | Setup, monorepo, DB, seed |
| **Phase 1 — MVP Core** | 🔄 In progress | Modules, frontend, search |
| **Phase 2 — AI & Data** | ⏳ Pending | RAG, crawler |
| **Phase 3 — Commerce** | ⏳ Pending | Affiliate, subscriptions |
| **Phase 4 — Scale** | ⏳ Pending | Mobile, multi-lang |

### 8.2 Phase 0 — Foundation ✅

| # | Task | Status |
|---|---|---|
| 1 | Setup macOS environment (Node, pnpm, brew) | ✅ |
| 2 | Create monorepo structure | ✅ |
| 3 | PostgreSQL 16 + pgvector + Redis | ✅ |
| 4 | NestJS API skeleton + Fastify | ✅ |
| 5 | Next.js skeleton | ✅ |
| 6 | Prisma schema (14 groups, 90 tables) | ✅ |
| 7 | Seed data (4 devices, 8 orgs) | ✅ |
| 8 | Health check endpoint | ✅ |
| 9 | Master documentation | ✅ |

### 8.3 Phase 1 — MVP Core 🔄

#### Sprint 1: Backend foundation (Week 1)

| # | Module | Files | Status |
|---|---|---|---|
| 1 | Common Module | `decorators/`, `guards/`, `interceptors/`, `pipes/`, `dto/`, `constants/` | 🔄 Next |
| 2 | Users Module | `users.service.ts`, `users.module.ts` | ⏳ |
| 3 | Auth Module | `dto/`, `strategies/`, `auth.service.ts`, `auth.controller.ts`, `auth.module.ts` | ⏳ |
| 4 | Integration test | Login, register, /me flow | ⏳ |

#### Sprint 2: Core CRUD modules (Week 2)

| # | Module | Endpoints | Status |
|---|---|---|---|
| 5 | OrganizationsModule | 7 endpoints (CRUD + search) | ⏳ |
| 6 | DeviceCategoriesModule | Tree CRUD | ⏳ |
| 7 | ProductFamiliesModule | CRUD by brand | ⏳ |
| 8 | DeviceModelsModule | CRUD + filters | ⏳ |
| 9 | DeviceVariantsModule | Detail + compare | ⏳ |

#### Sprint 3: Components & Search (Week 3)

| # | Module | Status |
|---|---|---|
| 10 | ChipsetsModule | ⏳ |
| 11 | Display/Battery/Camera modules | ⏳ |
| 12 | SearchModule + Meilisearch setup | ⏳ |
| 13 | Sync script DB → Meilisearch | ⏳ |

#### Sprint 4: Frontend (Week 4)

| # | Page/Component | Status |
|---|---|---|
| 14 | API client setup (`@spechub/api-client`) | ⏳ |
| 15 | TanStack Query setup | ⏳ |
| 16 | Homepage with featured devices | ⏳ |
| 17 | Device list page (`/devices`) | ⏳ |
| 18 | Device detail page (`/devices/[slug]`) | ⏳ |
| 19 | Compare page (`/compare`) | ⏳ |
| 20 | Search page (`/search`) | ⏳ |
| 21 | Auth pages (login, register) | ⏳ |

### 8.4 Phase 2 — AI & Auto Data ⏳

#### Sprint 5: AI Foundation (Week 5-6)

| # | Task | Status |
|---|---|---|
| 22 | Setup `apps/ai-service` | ⏳ |
| 23 | Embeddings pipeline (Voyage AI) | ⏳ |
| 24 | Index existing data → pgvector | ⏳ |
| 25 | RAG pipeline (retrieval + LLM) | ⏳ |
| 26 | AI search endpoint | ⏳ |
| 27 | Chat UI on frontend | ⏳ |

#### Sprint 6: Crawler (Week 7-8)

| # | Task | Status |
|---|---|---|
| 28 | Setup `apps/crawler` | ⏳ |
| 29 | Playwright + proxy rotation | ⏳ |
| 30 | GSMArena crawler | ⏳ |
| 31 | LLM extractor (Claude function calling) | ⏳ |
| 32 | Admin review queue UI | ⏳ |
| 33 | Auto schedule with cron | ⏳ |

### 8.5 Phase 3 — Commerce ⏳

#### Sprint 7-8: Commerce features (Week 9-10)

| # | Module | Status |
|---|---|---|
| 34 | AffiliateModule (links, clicks) | ⏳ |
| 35 | Price history tracking | ⏳ |
| 36 | Where to buy widget | ⏳ |
| 37 | WishlistsModule | ⏳ |
| 38 | AlertsModule + cron check | ⏳ |
| 39 | NotificationsModule (in-app, email) | ⏳ |
| 40 | Resend integration | ⏳ |

### 8.6 Phase 4 — Premium & Scale ⏳

#### Sprint 9-12

| # | Task | Status |
|---|---|---|
| 41 | SubscriptionsModule (Free/Pro/Team) | ⏳ |
| 42 | Stripe integration + webhooks | ⏳ |
| 43 | VNPay integration | ⏳ |
| 44 | B2B API key management | ⏳ |
| 45 | Mobile app (Expo) | ⏳ |
| 46 | Multi-language (i18n) | ⏳ |
| 47 | SEO optimization (sitemap, schema.org) | ⏳ |
| 48 | PWA support | ⏳ |
| 49 | Analytics dashboard (admin) | ⏳ |
| 50 | Community forum | ⏳ |

---

## 9. Naming conventions

### 9.1 Files & Folders

| Loại | Convention | Example |
|---|---|---|
| Files | kebab-case | `device-model.service.ts` |
| Folders | kebab-case | `device-models/` |
| Components | PascalCase trong file kebab-case | `DeviceCard` in `device-card.tsx` |
| Test files | `*.spec.ts` or `*.test.ts` | `users.service.spec.ts` |
| E2E tests | `*.e2e-spec.ts` | `auth.e2e-spec.ts` |

### 9.2 TypeScript

| Loại | Convention | Example |
|---|---|---|
| Variables | camelCase | `deviceModel`, `currentUser` |
| Constants | UPPER_SNAKE_CASE | `JWT_EXPIRES_IN`, `MAX_PAGE_SIZE` |
| Types/Interfaces | PascalCase | `DeviceModel`, `CreateDto` |
| Enums | PascalCase | `UserRole.Admin` |
| Functions | camelCase | `findById()`, `validatePassword()` |
| Classes | PascalCase | `AuthService`, `PrismaService` |
| Generic types | Single letter or descriptive | `<T>`, `<TUser>` |

### 9.3 Database

| Loại | Convention | Example |
|---|---|---|
| Tables | snake_case plural | `device_models`, `variant_chipsets` |
| Columns | snake_case | `device_variant_id`, `created_at` |
| Foreign keys | `<referenced_table_singular>_id` | `device_variant_id` |
| Indexes | `<table>_<column>_idx` | `users_email_idx` |
| Constraints | `<table>_<purpose>_check` | `users_role_check` |

### 9.4 API endpoints

| Loại | Convention | Example |
|---|---|---|
| Routes | kebab-case | `/api/v1/device-models` |
| Query params | snake_case | `?sort_by=name&page_size=20` |
| Request body | snake_case (match DB) | `{ "device_model_id": "..." }` |
| Response body | snake_case (consistency) | `{ "created_at": "..." }` |

### 9.5 Git

```
Branch naming:
  feat/<feature>           # New feature
  fix/<bug>                # Bug fix
  chore/<task>             # Maintenance
  refactor/<area>          # Refactor
  docs/<area>              # Documentation

Commit conventions (Conventional Commits):
  feat(auth): add JWT refresh token
  fix(prisma): resolve migration race condition
  docs(readme): update setup instructions
  refactor(common): extract pagination helper
  test(auth): add login integration tests
  chore(deps): upgrade prisma to 6.1.0
  perf(search): add index on slug column
```

---

## 10. Quick reference

### 10.1 Lệnh hằng ngày

```bash
# Development
pnpm dev                              # Start all apps
pnpm dev:api                          # Start only API
pnpm dev:web                          # Start only web

# Database
pnpm db:generate                      # Generate Prisma Client
pnpm db:migrate                       # Run migrations
pnpm db:seed                          # Seed data
pnpm db:studio                        # Open Prisma Studio
pnpm db:reset                         # Reset DB (caution!)

# Build & Test
pnpm build                            # Build all
pnpm test                             # Run tests
pnpm lint                             # Lint all
pnpm type-check                       # TypeScript check
pnpm format                           # Prettier format

# Services
brew services start postgresql@16
brew services start redis
brew services start meilisearch

# Git workflow
git checkout -b feat/auth-module
git commit -m "feat(auth): add JWT strategy"
git push origin feat/auth-module
```

### 10.2 URLs hữu ích

| URL | Service |
|---|---|
| `http://localhost:3000` | Web frontend |
| `http://localhost:3001` | Admin dashboard |
| `http://localhost:4000/api/v1` | API base URL |
| `http://localhost:4000/api/docs` | Swagger UI |
| `http://localhost:4000/api/v1/health` | Health check |
| `http://localhost:4001/api/v1` | AI service |
| `http://localhost:5555` | Prisma Studio |
| `http://localhost:7700` | Meilisearch dashboard |
| `http://localhost:6379` | Redis (use redis-cli) |
| `http://localhost:5432` | PostgreSQL (use psql) |

### 10.3 File quan trọng cần biết

| File | Path | Mục đích |
|---|---|---|
| Root package.json | `/package.json` | Scripts toàn project |
| Workspace config | `/pnpm-workspace.yaml` | Khai báo workspaces |
| Turbo config | `/turbo.json` | Build pipeline |
| API entry | `/apps/api/src/main.ts` | Bootstrap API |
| API root module | `/apps/api/src/app.module.ts` | Register modules |
| Prisma schema | `/packages/database/prisma/schema.prisma` | Database design |
| Seed file | `/packages/database/prisma/seed.ts` | Initial data |
| Web entry | `/apps/web/src/app/layout.tsx` | Root layout |
| Master doc | `/SPECHUB-MASTER.md` | Reference này |

### 10.4 Test credentials (after seed)

| Email | Password | Role |
|---|---|---|
| `admin@spechub.io` | `admin123` | admin |
| `contributor@spechub.io` | `contributor123` | contributor |

### 10.5 Khắc phục sự cố nhanh

```bash
# Port đã bị chiếm
lsof -ti:4000 | xargs kill -9

# Restart services
brew services restart postgresql@16
brew services restart redis

# Reset Prisma
cd packages/database
rm -rf node_modules/.prisma
pnpm prisma generate

# Clean monorepo
pnpm clean              # If you have clean script
rm -rf node_modules .turbo
pnpm install

# Reset DB
pnpm db:reset           # Drop & recreate

# Check workspace packages
pnpm ls -r --depth=0
```

---

## 📌 Quy tắc vàng

1. **Cố định version** — Không dùng `latest`, đặc biệt cho production-critical packages
2. **Không skip migration** — Mọi schema change phải qua Prisma migrate
3. **Test trước khi merge** — Lint + type-check + unit tests phải pass
4. **Conventional commits** — `feat:`, `fix:`, `docs:`, etc.
5. **Documentation đi đôi với code** — Mới feature → update docs
6. **Soft delete mặc định** — Không xóa cứng data
7. **DTO validation strict** — Mọi input phải qua class-validator
8. **Cache aggressively** — Redis cho heavy queries
9. **Error handling consistent** — Dùng GlobalExceptionFilter
10. **Security first** — Không bao giờ commit `.env`, hash passwords, validate inputs

---

## 🔗 Liên kết tham khảo

- **Repository:** (TBD - GitHub URL)
- **Master Documentation:** `SPECHUB-MASTER.md`
- **API Documentation:** `http://localhost:4000/api/docs`
- **Database Schema:** `packages/database/prisma/schema.prisma`

---

**Document maintained by:** SpecHub Team
**Last updated:** 2026-05-11
**Version:** 3.0
**Next review:** After Phase 1 MVP completion