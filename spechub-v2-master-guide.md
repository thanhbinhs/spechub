# SpecHub v2 — Master Setup Guide

> Tài liệu này thiết kế lại **toàn bộ kiến trúc** SpecHub để hỗ trợ AI research, auto data ingestion, e-commerce và nhiều revenue streams. Cung cấp guide setup từ A-Z với các phiên bản đã test ổn định.

---

## Phần 1 — Tầm nhìn và phương án

### 1.1 Mục tiêu dự án

SpecHub không chỉ là wiki — sẽ trở thành:

1. **Platform AI research** — User hỏi về thiết bị, AI trả lời có dẫn nguồn
2. **Auto data engine** — Tự động crawl, extract, normalize specs
3. **E-commerce hybrid** — Affiliate links + direct sales (nếu hợp tác retailer)
4. **B2B service** — API cho retailers, reviewers, content sites
5. **Community** — User contribute, có reputation system

### 1.2 Các tính năng quan trọng cần thiết

| Tính năng | Mô tả | Ưu tiên |
|---|---|---|
| **AI Smart Search** | Hỏi natural language, trả lời có nguồn | ⭐⭐⭐ |
| **Smart Compare** | AI analyze pros/cons khi compare devices | ⭐⭐⭐ |
| **Auto Data Crawler** | Tự crawl từ GSMArena, Notebookcheck... | ⭐⭐⭐ |
| **AI Spec Extractor** | LLM đọc HTML → extract structured data | ⭐⭐⭐ |
| **Personalized Feed** | "Recommended for you" dựa trên hành vi | ⭐⭐ |
| **Price Alerts** | Notify khi giá giảm | ⭐⭐ |
| **Affiliate Integration** | Link mua hàng có tracking | ⭐⭐⭐ |
| **Premium Subscription** | Advanced features cho user trả phí | ⭐⭐ |
| **Mobile App** | iOS + Android native | ⭐⭐ |
| **Admin CMS** | Quản lý content, moderate community | ⭐⭐⭐ |
| **Analytics Dashboard** | BI cho admin và B2B users | ⭐⭐ |
| **Multi-language** | Vietnamese, English (Japan, Korea sau) | ⭐⭐ |
| **Community Forum** | Q&A, reviews từ users | ⭐ |
| **Wishlist + Compare List** | Lưu device, compare nhiều thiết bị | ⭐⭐⭐ |
| **Notifications System** | Email, push, in-app | ⭐⭐ |

### 1.3 Tech Stack đề xuất (đã test)

| Layer | Technology | Phiên bản | Lý do chọn |
|---|---|---|---|
| **Frontend Web** | Next.js | 15.x | App Router, SSR, ISR, RSC |
| **Frontend Mobile** | Expo (React Native) | 52.x | Reuse code TypeScript |
| **API Gateway** | NestJS | 11.x | Modular, dễ test, ecosystem mạnh |
| **Database** | PostgreSQL | 16 | Mạnh, có pgvector cho AI |
| **Vector DB** | pgvector | 0.7+ | Extension PostgreSQL |
| **Cache** | Redis | 7 | Cache + queue + pub/sub |
| **Queue** | BullMQ | 5.x | Background jobs |
| **Search** | Meilisearch | 1.11+ | Faster than Elasticsearch, dễ deploy |
| **ORM** | Prisma | 6.x | Type-safe, NHẤT QUYẾT KHÔNG dùng v7 |
| **AI/LLM** | Vercel AI SDK | 4.x | Multi-provider abstraction |
| **Auth** | Better Auth | 1.x | Modern, hơn NextAuth |
| **Storage** | Cloudflare R2 / S3 | - | Cheap, S3-compatible |
| **CDN** | Cloudflare | - | Free tier mạnh |
| **Email** | Resend | - | Dev-friendly, rẻ |
| **Payments** | Stripe + VNPay | - | Quốc tế + Việt Nam |
| **Monitoring** | Sentry + Better Stack | - | Error + uptime tracking |
| **Analytics** | PostHog | - | Self-host được, full-featured |
| **Monorepo** | Turborepo | 2.x | Build cache, parallel |
| **Package Manager** | pnpm | 9.x | Tiết kiệm disk, nhanh |
| **Container** | Docker (production only) | - | Dev native, prod containerized |

### 1.4 Hosting Strategy

```
Development: Tất cả native trên macOS (như guide cũ)
Staging:     Single VPS (Hetzner, Vultr) — $20/tháng
Production:
  - Web (Next.js):     Vercel (free tier rất mạnh)
  - API (NestJS):      Railway / Fly.io ($10-30/tháng)
  - Database:          Neon / Supabase (free → $25/tháng)
  - Redis:             Upstash (free → pay-as-you-go)
  - Search:            Meilisearch Cloud / self-host VPS
  - Storage:           Cloudflare R2 ($0.015/GB)
  - Workers:           Cùng VPS với API, scale riêng khi cần
```

---

## Phần 2 — Cấu trúc Monorepo v2

```
spechub/
│
├── apps/                              # Deployable applications
│   ├── web/                           # Next.js 15 — Public website
│   ├── admin/                         # Next.js 15 — Admin dashboard
│   ├── mobile/                        # Expo — iOS/Android (sau)
│   ├── api/                           # NestJS — Main API gateway
│   ├── ai-service/                    # NestJS — AI research microservice
│   ├── crawler/                       # NestJS — Crawler microservice
│   └── workers/                       # NestJS — Background workers
│
├── packages/                          # Shared libraries
│   ├── database/                      # Prisma schema + migrations
│   ├── types/                         # Shared TypeScript types
│   ├── ui/                            # Shared React components
│   ├── config/                        # ESLint, TS, Tailwind configs
│   ├── api-client/                    # API SDK for web/mobile/admin
│   ├── auth/                          # Auth helpers, hooks
│   ├── utils/                         # Pure utility functions
│   ├── ai-core/                       # AI helpers (RAG, embeddings)
│   └── analytics/                     # Tracking helpers
│
├── infra/                             # Infrastructure as code
│   ├── docker/                        # Dockerfiles cho production
│   ├── k8s/                           # Kubernetes manifests (sau)
│   └── scripts/                       # Deploy scripts
│
├── docs/                              # Documentation
│   ├── architecture/
│   ├── api/
│   └── runbooks/
│
├── .github/workflows/                 # CI/CD pipelines
├── .vscode/                           # VS Code settings
│
├── package.json                       # Root package
├── pnpm-workspace.yaml               # Workspace config
├── turbo.json                         # Turborepo tasks
├── tsconfig.json                      # Root TS config
├── .env.example                       # Sample env (commit này)
├── .gitignore
└── README.md
```

### 2.1 Tại sao chia microservices?

- **api/** — Main API, handle CRUD, auth, business logic
- **ai-service/** — Riêng vì heavy compute, scale riêng, retry policy khác
- **crawler/** — Riêng vì cần proxy rotation, rate limit khác
- **workers/** — Background jobs, scale theo queue depth

Trong tương lai có thể tách thành các service nhỏ hơn (catalog, commerce, search...) khi traffic tăng.

---

## Phần 3 — Phiên bản chính xác (TESTED & STABLE)

Đây là **single source of truth** — sao chép chính xác.

### 3.1 Môi trường runtime

| Tool | Version | Cài qua |
|---|---|---|
| macOS | 13+ | - |
| Node.js | **22.11.0 LTS** | fnm |
| pnpm | **9.15.0** | corepack |
| PostgreSQL | **16.6** | brew |
| Redis | **7.4** | brew |
| Meilisearch | **1.11.x** | brew (optional dev) |

### 3.2 Backend (apps/api, ai-service, crawler, workers)

```json
{
  "@nestjs/core": "11.0.6",
  "@nestjs/common": "11.0.6",
  "@nestjs/platform-fastify": "11.0.6",
  "@nestjs/config": "4.0.0",
  "@nestjs/swagger": "11.0.0",
  "@nestjs/jwt": "11.0.0",
  "@nestjs/passport": "11.0.0",
  "@nestjs/throttler": "6.4.0",
  "@nestjs/bullmq": "11.0.1",
  "@nestjs/event-emitter": "3.0.0",
  "@nestjs/cache-manager": "3.0.0",
  "@nestjs/schedule": "5.0.0",

  "fastify": "5.2.0",
  "@fastify/static": "8.0.4",
  "@fastify/multipart": "9.0.2",
  "@fastify/cookie": "11.0.2",
  "@fastify/helmet": "13.0.1",

  "@prisma/client": "6.1.0",
  "prisma": "6.1.0",

  "ioredis": "5.4.2",
  "bullmq": "5.34.6",
  "cache-manager-redis-yet": "5.1.5",

  "class-validator": "0.14.1",
  "class-transformer": "0.5.1",

  "passport": "0.7.0",
  "passport-jwt": "4.0.1",
  "passport-local": "1.0.0",
  "bcryptjs": "2.4.3",
  "argon2": "0.41.1",

  "@aws-sdk/client-s3": "3.717.0",
  "@aws-sdk/s3-request-presigner": "3.717.0",

  "ai": "4.0.27",
  "@ai-sdk/anthropic": "1.0.6",
  "@ai-sdk/openai": "1.0.13",
  "@ai-sdk/google": "1.0.13",

  "meilisearch": "0.46.0",
  "cheerio": "1.0.0",
  "playwright": "1.49.1",

  "resend": "4.0.1",
  "stripe": "17.4.0",

  "zod": "3.24.1",
  "date-fns": "4.1.0",
  "lodash-es": "4.17.21"
}
```

### 3.3 Frontend Web (apps/web, admin)

```json
{
  "next": "15.1.3",
  "react": "19.0.0",
  "react-dom": "19.0.0",

  "@tanstack/react-query": "5.62.10",
  "@tanstack/react-table": "8.20.6",
  "@tanstack/react-query-devtools": "5.62.10",

  "zustand": "5.0.2",
  "axios": "1.7.9",
  "swr": "2.3.0",

  "react-hook-form": "7.54.2",
  "@hookform/resolvers": "3.10.0",
  "zod": "3.24.1",

  "ai": "4.0.27",
  "@ai-sdk/react": "1.0.7",

  "tailwindcss": "3.4.17",
  "@tailwindcss/typography": "0.5.15",
  "@tailwindcss/forms": "0.5.10",
  "tailwind-merge": "2.6.0",
  "tailwindcss-animate": "1.0.7",
  "clsx": "2.1.1",

  "@radix-ui/react-dialog": "1.1.4",
  "@radix-ui/react-dropdown-menu": "2.1.4",
  "@radix-ui/react-tabs": "1.1.2",
  "@radix-ui/react-tooltip": "1.1.6",
  "@radix-ui/react-select": "2.1.4",
  "@radix-ui/react-checkbox": "1.1.3",
  "@radix-ui/react-slot": "1.1.1",
  "@radix-ui/react-popover": "1.1.4",

  "lucide-react": "0.469.0",

  "next-themes": "0.4.4",
  "next-mdx-remote": "5.0.0",
  "gray-matter": "4.0.3",

  "date-fns": "4.1.0",
  "react-markdown": "9.0.1",
  "rehype-highlight": "7.0.1",

  "framer-motion": "11.15.0",

  "better-auth": "1.1.4",

  "posthog-js": "1.205.0",
  "@sentry/nextjs": "8.47.0"
}
```

### 3.4 Quy tắc về phiên bản

✅ **Cố định patch version** (vd `11.0.6` thay `^11.0.6`) cho production-critical packages: Prisma, NestJS core, Next.js.

✅ **Dùng `^` cho minor** với utility packages: lodash, date-fns, zod.

❌ **KHÔNG bao giờ dùng `latest` hoặc `*`**.

❌ **KHÔNG dùng các version sau** (đã có vấn đề):
- Prisma 7.x (breaking changes lớn)
- Tailwind 4.x (alpha)
- React 19 RC (đã stable thì OK, nhưng beta thì không)
- NestJS 11 với Express 5 (chưa stable)

---

## Phần 4 — Database Schema mở rộng

Schema phải thay đổi để hỗ trợ AI và commerce. Các nhóm bảng mới:

### 4.1 Core (giữ nguyên từ v1)
- `organizations`, `device_categories`, `product_families`
- `device_models`, `device_variants`
- `chipsets`, `display_units`, `battery_units`, ...

### 4.2 AI & Search (MỚI)

```prisma
// Embeddings cho RAG
model embeddings {
  id          String   @id @default(uuid()) @db.Uuid
  entity_type String   @db.VarChar(50)  // device, review, article, ...
  entity_id   String   @db.Uuid
  chunk_text  String                     // text được embed
  chunk_index Int      @default(0)       // nếu chia chunk
  embedding   Unsupported("vector(1536)")  // pgvector
  model_name  String   @db.VarChar(50)  // "voyage-3", "openai-3-small"
  created_at  DateTime @default(now())

  @@index([entity_type, entity_id])
}

// Cache câu trả lời AI
model ai_query_cache {
  id          String   @id @default(uuid()) @db.Uuid
  query_hash  String   @unique @db.VarChar(64)  // SHA256 của query
  query_text  String
  answer_text String
  citations   Json                              // sources
  model_name  String   @db.VarChar(50)
  hit_count   Int      @default(1)
  created_at  DateTime @default(now())
  expires_at  DateTime?

  @@index([query_hash])
  @@index([expires_at])
}

// Search log để cải thiện
model search_logs {
  id            String   @id @default(uuid()) @db.Uuid
  user_id       String?  @db.Uuid
  query         String
  query_type    String   @db.VarChar(20)  // "keyword", "ai_question"
  result_count  Int      @default(0)
  clicked_id    String?  @db.Uuid
  clicked_type  String?  @db.VarChar(50)
  session_id    String?  @db.Uuid
  ip_address    String?  @db.Inet
  user_agent    String?
  created_at    DateTime @default(now())

  @@index([user_id])
  @@index([created_at])
}
```

### 4.3 Crawler & Data Sources (MỚI)

```prisma
model data_sources {
  id              String   @id @default(uuid()) @db.Uuid
  name            String   @unique @db.VarChar(100)  // "GSMArena"
  base_url        String
  reliability     Int      @default(50)  // 0-100
  last_crawled_at DateTime?
  crawl_config    Json                    // selectors, rate limits
  is_active       Boolean  @default(true)

  raw_pages       raw_pages[]
}

model raw_pages {
  id              String   @id @default(uuid()) @db.Uuid
  source_id       String   @db.Uuid
  url             String   @unique
  raw_html        String?  @db.Text
  raw_text        String?  @db.Text
  parsed_data     Json?
  status          String   @default("pending")  // pending, parsed, failed
  device_model_id String?  @db.Uuid
  crawled_at      DateTime @default(now())
  parsed_at       DateTime?

  source          data_sources    @relation(fields: [source_id], references: [id])
  device_model    device_models?  @relation(fields: [device_model_id], references: [id])

  @@index([status])
  @@index([url])
}

model extraction_jobs {
  id          String    @id @default(uuid()) @db.Uuid
  raw_page_id String    @db.Uuid
  status      String    @default("pending")
  attempts    Int       @default(0)
  llm_used    String?   @db.VarChar(50)
  result      Json?
  error       String?
  created_at  DateTime  @default(now())
  completed_at DateTime?

  @@index([status])
}
```

### 4.4 Commerce (MỚI)

```prisma
model affiliate_partners {
  id              String   @id @default(uuid()) @db.Uuid
  name            String   @unique @db.VarChar(100)  // Amazon, Shopee
  base_url        String
  commission_rate Decimal  @db.Decimal(5, 2)  // %
  api_credentials Json?    // encrypted
  is_active       Boolean  @default(true)

  affiliate_links affiliate_links[]
}

model affiliate_links {
  id                String   @id @default(uuid()) @db.Uuid
  partner_id        String   @db.Uuid
  device_variant_id String   @db.Uuid
  region_code       String   @db.VarChar(2)
  product_url       String
  current_price     Decimal? @db.Decimal(12, 2)
  currency_code     String   @db.VarChar(3)
  in_stock          Boolean  @default(true)
  last_checked_at   DateTime @default(now())

  partner         affiliate_partners @relation(fields: [partner_id], references: [id])
  device_variant  device_variants    @relation(fields: [device_variant_id], references: [id])
  price_history   affiliate_price_history[]

  @@index([device_variant_id, region_code])
}

model affiliate_price_history {
  id                 String   @id @default(uuid()) @db.Uuid
  affiliate_link_id  String   @db.Uuid
  price              Decimal  @db.Decimal(12, 2)
  currency_code      String   @db.VarChar(3)
  recorded_at        DateTime @default(now())

  affiliate_link     affiliate_links @relation(fields: [affiliate_link_id], references: [id])

  @@index([affiliate_link_id, recorded_at])
}

model affiliate_clicks {
  id                String   @id @default(uuid()) @db.Uuid
  affiliate_link_id String   @db.Uuid
  user_id           String?  @db.Uuid
  session_id        String?  @db.Uuid
  ip_address        String?  @db.Inet
  user_agent        String?
  referrer          String?
  clicked_at        DateTime @default(now())

  @@index([affiliate_link_id])
  @@index([clicked_at])
}

// Conversion tracking (sau khi user click → mua)
model affiliate_conversions {
  id                String   @id @default(uuid()) @db.Uuid
  affiliate_link_id String   @db.Uuid
  click_id          String?  @db.Uuid
  order_value       Decimal  @db.Decimal(12, 2)
  commission        Decimal  @db.Decimal(12, 2)
  currency_code     String   @db.VarChar(3)
  status            String   @default("pending")  // pending, confirmed, paid
  external_order_id String?
  created_at        DateTime @default(now())
}
```

### 4.5 Subscription & Billing (MỚI)

```prisma
model subscription_plans {
  id              String   @id @default(uuid()) @db.Uuid
  code            String   @unique @db.VarChar(30)  // "free", "pro", "team"
  name            String   @db.VarChar(100)
  description     String?
  price_monthly   Decimal  @db.Decimal(8, 2)
  price_yearly    Decimal  @db.Decimal(8, 2)
  currency_code   String   @db.VarChar(3)
  features        Json                    // {"compare_limit": 10, "alerts": true}
  is_active       Boolean  @default(true)

  subscriptions   subscriptions[]
}

model subscriptions {
  id                  String   @id @default(uuid()) @db.Uuid
  user_id             String   @unique @db.Uuid
  plan_id             String   @db.Uuid
  status              String   @default("active")  // active, canceled, past_due
  billing_cycle       String   @db.VarChar(20)  // monthly, yearly
  stripe_customer_id  String?  @unique
  stripe_sub_id       String?  @unique
  current_period_end  DateTime?
  cancel_at_period_end Boolean @default(false)
  created_at          DateTime @default(now())

  plan                subscription_plans @relation(fields: [plan_id], references: [id])
}
```

### 4.6 User Engagement (MỚI)

```prisma
model wishlists {
  id          String   @id @default(uuid()) @db.Uuid
  user_id     String   @db.Uuid
  name        String   @db.VarChar(100) @default("Default")
  is_public   Boolean  @default(false)
  created_at  DateTime @default(now())

  items       wishlist_items[]
}

model wishlist_items {
  id                String   @id @default(uuid()) @db.Uuid
  wishlist_id       String   @db.Uuid
  device_variant_id String   @db.Uuid
  notes             String?
  added_at          DateTime @default(now())

  @@unique([wishlist_id, device_variant_id])
}

model price_alerts {
  id                String   @id @default(uuid()) @db.Uuid
  user_id           String   @db.Uuid
  device_variant_id String   @db.Uuid
  target_price      Decimal  @db.Decimal(12, 2)
  currency_code     String   @db.VarChar(3)
  region_code       String   @db.VarChar(2)
  is_active         Boolean  @default(true)
  triggered_at      DateTime?
  created_at        DateTime @default(now())

  @@index([device_variant_id, is_active])
}

model user_views {
  id                String   @id @default(uuid()) @db.Uuid
  user_id           String?  @db.Uuid
  session_id        String   @db.Uuid
  entity_type       String   @db.VarChar(50)
  entity_id         String   @db.Uuid
  duration_seconds  Int?
  viewed_at         DateTime @default(now())

  @@index([user_id])
  @@index([entity_type, entity_id])
}

model notifications {
  id          String   @id @default(uuid()) @db.Uuid
  user_id     String   @db.Uuid
  type        String   @db.VarChar(50)  // price_alert, new_review, etc.
  title       String   @db.VarChar(200)
  body        String?
  data        Json?
  read_at     DateTime?
  created_at  DateTime @default(now())

  @@index([user_id, read_at])
}
```

---

## Phần 5 — Hướng dẫn setup từng bước

### Bước 1: Cài môi trường

```bash
# Xcode CLI tools
xcode-select --install

# Homebrew (Apple Silicon)
/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"
echo 'eval "$(/opt/homebrew/bin/brew shellenv)"' >> ~/.zprofile
eval "$(/opt/homebrew/bin/brew shellenv)"

# fnm + Node 22 LTS
brew install fnm
echo 'eval "$(fnm env --use-on-cd --shell zsh)"' >> ~/.zshrc
source ~/.zshrc
fnm install 22.11.0
fnm use 22.11.0
fnm default 22.11.0

# pnpm via corepack
corepack enable pnpm
corepack prepare pnpm@9.15.0 --activate

# Verify
node -v   # v22.11.0
pnpm -v   # 9.15.0
```

### Bước 2: PostgreSQL 16 + pgvector

```bash
# PostgreSQL 16
brew install postgresql@16
echo 'export PATH="/opt/homebrew/opt/postgresql@16/bin:$PATH"' >> ~/.zshrc
source ~/.zshrc
brew services start postgresql@16

# pgvector extension (cho AI embeddings)
brew install pgvector

# Tạo user + database
createuser spechub --createdb
psql postgres -c "ALTER USER spechub WITH PASSWORD 'spechub_dev_2026';"
createdb spechub_dev -U spechub
createdb spechub_test -U spechub

# Enable pgvector extension
psql -U spechub -d spechub_dev -c "CREATE EXTENSION IF NOT EXISTS vector;"
psql -U spechub -d spechub_dev -c "CREATE EXTENSION IF NOT EXISTS pg_trgm;"  # full-text
psql -U spechub -d spechub_dev -c "CREATE EXTENSION IF NOT EXISTS unaccent;" # tiếng Việt
```

**Giải thích:**
- `pgvector`: Extension cho phép lưu vector và làm similarity search
- `pg_trgm`: Trigram cho fuzzy matching ("iphon" match "iPhone")
- `unaccent`: Bỏ dấu để search tiếng Việt ("đien thoai" → "dien thoai")

### Bước 3: Redis

```bash
brew install redis
brew services start redis
redis-cli ping   # → PONG
```

### Bước 4: Meilisearch (search engine)

```bash
brew install meilisearch
brew services start meilisearch

# Verify
curl http://localhost:7700/health   # → {"status":"available"}
```

**Tại sao Meilisearch thay vì Elasticsearch?**
- Setup 5 phút thay 2 giờ
- Typo tolerance built-in
- 50ms response time
- Nhỏ gọn, nhẹ
- Free, open source

### Bước 5: Tạo monorepo gốc

```bash
mkdir -p ~/Projects/spechub-v2
cd ~/Projects/spechub-v2

# Tạo cấu trúc folder
mkdir -p apps/{web,admin,api,ai-service,crawler,workers}
mkdir -p packages/{database,types,ui,config,api-client,auth,utils,ai-core,analytics}
mkdir -p infra/{docker,scripts}
mkdir -p docs/{architecture,api}
mkdir -p .github/workflows
mkdir -p .vscode
```

### Bước 6: Root package.json và config

```bash
# 6.1 pnpm-workspace.yaml
cat > pnpm-workspace.yaml << 'EOF'
packages:
  - "apps/*"
  - "packages/*"
EOF

# 6.2 .npmrc
cat > .npmrc << 'EOF'
auto-install-peers=true
strict-peer-dependencies=false
shamefully-hoist=false
node-linker=isolated
prefer-workspace-packages=true
EOF

# 6.3 turbo.json
cat > turbo.json << 'EOF'
{
  "$schema": "https://turbo.build/schema.json",
  "ui": "tui",
  "globalDependencies": [".env"],
  "globalEnv": ["NODE_ENV", "DATABASE_URL", "REDIS_URL"],
  "tasks": {
    "build": {
      "dependsOn": ["^build"],
      "inputs": ["$TURBO_DEFAULT$", ".env*"],
      "outputs": [".next/**", "!.next/cache/**", "dist/**"]
    },
    "dev": {
      "cache": false,
      "persistent": true,
      "dependsOn": ["^db:generate"]
    },
    "lint": {
      "dependsOn": ["^lint"]
    },
    "type-check": {
      "dependsOn": ["^build"]
    },
    "test": {
      "cache": false
    },
    "db:generate": {
      "cache": false,
      "outputs": ["**/generated/**"]
    },
    "db:migrate": {
      "cache": false
    },
    "db:seed": {
      "cache": false
    }
  }
}
EOF

# 6.4 Root package.json
cat > package.json << 'EOF'
{
  "name": "spechub",
  "version": "0.1.0",
  "private": true,
  "scripts": {
    "dev": "turbo dev",
    "dev:web": "turbo dev --filter=@spechub/web",
    "dev:api": "turbo dev --filter=@spechub/api",
    "build": "turbo build",
    "lint": "turbo lint",
    "type-check": "turbo type-check",
    "test": "turbo test",
    "format": "prettier --write \"**/*.{ts,tsx,json,md,css}\"",
    "db:generate": "turbo db:generate --filter=@spechub/database",
    "db:migrate": "turbo db:migrate --filter=@spechub/database",
    "db:seed": "turbo db:seed --filter=@spechub/database",
    "db:studio": "pnpm --filter @spechub/database studio",
    "db:reset": "pnpm --filter @spechub/database reset",
    "clean": "turbo clean && rm -rf node_modules"
  },
  "devDependencies": {
    "turbo": "2.3.3",
    "typescript": "5.7.2",
    "prettier": "3.4.2",
    "prettier-plugin-tailwindcss": "0.6.9",
    "@types/node": "22.10.2"
  },
  "engines": {
    "node": ">=22.11.0",
    "pnpm": ">=9.15.0"
  },
  "packageManager": "pnpm@9.15.0"
}
EOF

# 6.5 .gitignore
cat > .gitignore << 'EOF'
# Dependencies
node_modules/
.pnpm-store/

# Build outputs
dist/
build/
.next/
.turbo/
*.tsbuildinfo

# Environment
.env
.env.*
!.env.example
!.env.*.example

# IDE
.vscode/*
!.vscode/settings.json
!.vscode/extensions.json
.idea/

# OS
.DS_Store
Thumbs.db

# Logs
*.log
logs/

# Prisma
packages/database/generated/
packages/database/prisma/migrations/dev_*

# Testing
coverage/

# Production-only
docker-compose.override.yml
EOF

# 6.6 .env.example (commit này)
cat > .env.example << 'EOF'
# === DATABASE ===
DATABASE_URL="postgresql://spechub:spechub_dev_2026@localhost:5432/spechub_dev"
DATABASE_TEST_URL="postgresql://spechub:spechub_dev_2026@localhost:5432/spechub_test"

# === REDIS ===
REDIS_URL="redis://localhost:6379"

# === SEARCH ===
MEILISEARCH_HOST="http://localhost:7700"
MEILISEARCH_API_KEY=""

# === AI/LLM ===
ANTHROPIC_API_KEY=""
OPENAI_API_KEY=""
VOYAGE_API_KEY=""

# === STORAGE ===
S3_ACCESS_KEY=""
S3_SECRET_KEY=""
S3_BUCKET="spechub-dev"
S3_REGION="auto"
S3_ENDPOINT=""

# === EMAIL ===
RESEND_API_KEY=""
EMAIL_FROM="noreply@spechub.io"

# === PAYMENTS ===
STRIPE_SECRET_KEY=""
STRIPE_WEBHOOK_SECRET=""

# === AUTH ===
AUTH_SECRET="generate-with-openssl-rand-base64-32"
JWT_SECRET="generate-min-32-chars"

# === MONITORING ===
SENTRY_DSN=""
POSTHOG_KEY=""

# === URLs ===
NEXT_PUBLIC_API_URL="http://localhost:4000/api/v1"
NEXT_PUBLIC_WEB_URL="http://localhost:3000"
NEXT_PUBLIC_ADMIN_URL="http://localhost:3001"
EOF

# 6.7 Cài root dependencies
pnpm install
```

### Bước 7: Setup `packages/config` (shared TypeScript config)

```bash
cd packages/config

cat > package.json << 'EOF'
{
  "name": "@spechub/config",
  "version": "0.0.1",
  "private": true,
  "exports": {
    "./typescript/base": "./typescript/base.json",
    "./typescript/nestjs": "./typescript/nestjs.json",
    "./typescript/nextjs": "./typescript/nextjs.json",
    "./typescript/react-library": "./typescript/react-library.json",
    "./eslint/base": "./eslint/base.js",
    "./tailwind/base": "./tailwind/base.js"
  }
}
EOF

mkdir -p typescript eslint tailwind

# Base TS config
cat > typescript/base.json << 'EOF'
{
  "$schema": "https://json.schemastore.org/tsconfig",
  "compilerOptions": {
    "target": "ES2022",
    "lib": ["ES2022"],
    "module": "ESNext",
    "moduleResolution": "bundler",
    "strict": true,
    "strictNullChecks": true,
    "noUncheckedIndexedAccess": true,
    "noImplicitOverride": true,
    "declaration": true,
    "declarationMap": true,
    "sourceMap": true,
    "esModuleInterop": true,
    "allowSyntheticDefaultImports": true,
    "resolveJsonModule": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true,
    "isolatedModules": true,
    "incremental": true
  },
  "exclude": ["node_modules", "dist", ".next", "build"]
}
EOF

# NestJS-specific TS config
cat > typescript/nestjs.json << 'EOF'
{
  "extends": "./base.json",
  "compilerOptions": {
    "module": "CommonJS",
    "moduleResolution": "node",
    "emitDecoratorMetadata": true,
    "experimentalDecorators": true,
    "target": "ES2022",
    "outDir": "./dist",
    "rootDir": "./src",
    "noUncheckedIndexedAccess": false
  }
}
EOF

# Next.js-specific TS config
cat > typescript/nextjs.json << 'EOF'
{
  "extends": "./base.json",
  "compilerOptions": {
    "target": "ES2017",
    "lib": ["dom", "dom.iterable", "ES2022"],
    "module": "ESNext",
    "moduleResolution": "bundler",
    "jsx": "preserve",
    "noEmit": true,
    "incremental": true,
    "plugins": [{ "name": "next" }]
  }
}
EOF

cd ../..
```

### Bước 8: Setup `packages/database` (Prisma + pgvector)

```bash
cd packages/database

cat > package.json << 'EOF'
{
  "name": "@spechub/database",
  "version": "0.0.1",
  "private": true,
  "main": "./src/index.ts",
  "types": "./src/index.ts",
  "exports": {
    ".": "./src/index.ts",
    "./client": "./generated/client/index.js"
  },
  "scripts": {
    "db:generate": "prisma generate",
    "db:migrate": "prisma migrate dev",
    "db:migrate:deploy": "prisma migrate deploy",
    "db:reset": "prisma migrate reset",
    "db:studio": "prisma studio",
    "db:seed": "tsx prisma/seed.ts",
    "studio": "prisma studio",
    "reset": "prisma migrate reset --force",
    "type-check": "tsc --noEmit"
  },
  "dependencies": {
    "@prisma/client": "6.1.0"
  },
  "devDependencies": {
    "prisma": "6.1.0",
    "tsx": "4.19.2",
    "typescript": "5.7.2",
    "@types/node": "22.10.2"
  },
  "prisma": {
    "seed": "tsx prisma/seed.ts"
  }
}
EOF

# Schema chính
mkdir -p prisma src
cat > prisma/schema.prisma << 'EOF'
generator client {
  provider        = "prisma-client-js"
  output          = "../generated/client"
  previewFeatures = ["postgresqlExtensions"]
}

datasource db {
  provider   = "postgresql"
  url        = env("DATABASE_URL")
  extensions = [vector, pg_trgm, unaccent]
}

// =====================================
// META & LOOKUPS
// =====================================

model release_statuses {
  id         Int    @id @default(autoincrement())
  code       String @unique @db.VarChar(30)
  name       String @db.VarChar(60)
  sort_order Int    @default(0)

  device_models   device_models[]
  device_variants device_variants[]
}

model currencies {
  code         String @id @db.VarChar(3)
  name         String @db.VarChar(60)
  symbol       String @db.VarChar(10)
  decimal_places Int  @default(2)
}

// =====================================
// ORGANIZATIONS
// =====================================

model organizations {
  id            String    @id @default(uuid()) @db.Uuid
  name          String    @unique @db.VarChar(160)
  slug          String    @unique @db.VarChar(180)
  short_name    String?   @db.VarChar(80)
  country_code  String?   @db.VarChar(2)
  founded_year  Int?
  website_url   String?
  logo_url      String?
  description   String?
  is_active     Boolean   @default(true)
  parent_org_id String?   @db.Uuid
  created_at    DateTime  @default(now()) @db.Timestamptz(6)
  updated_at    DateTime  @updatedAt @db.Timestamptz(6)
  deleted_at    DateTime? @db.Timestamptz(6)

  parent_org    organizations?   @relation("OrgHierarchy", fields: [parent_org_id], references: [id])
  child_orgs    organizations[]  @relation("OrgHierarchy")

  product_families product_families[]
  chipsets         chipsets[]

  @@index([slug])
  @@index([country_code])
}

// =====================================
// DEVICE HIERARCHY
// =====================================

model device_categories {
  id                 String  @id @default(uuid()) @db.Uuid
  name               String  @unique @db.VarChar(60)
  slug               String  @unique @db.VarChar(80)
  description        String?
  icon_url           String?
  parent_category_id String? @db.Uuid
  display_order      Int     @default(0)
  is_active          Boolean @default(true)
  created_at         DateTime @default(now()) @db.Timestamptz(6)

  parent           device_categories?  @relation("CategoryTree", fields: [parent_category_id], references: [id])
  children         device_categories[] @relation("CategoryTree")
  product_families product_families[]
}

model product_families {
  id                 String   @id @default(uuid()) @db.Uuid
  brand_org_id       String   @db.Uuid
  device_category_id String   @db.Uuid
  name               String   @db.VarChar(120)
  slug               String   @unique @db.VarChar(160)
  description        String?
  cover_image_url    String?
  first_release_year Int?
  is_active          Boolean  @default(true)
  created_at         DateTime @default(now()) @db.Timestamptz(6)
  updated_at         DateTime @updatedAt @db.Timestamptz(6)

  brand            organizations     @relation(fields: [brand_org_id], references: [id])
  device_category  device_categories @relation(fields: [device_category_id], references: [id])
  device_models    device_models[]

  @@unique([brand_org_id, name])
  @@index([slug])
}

model device_models {
  id                String    @id @default(uuid()) @db.Uuid
  product_family_id String    @db.Uuid
  name              String    @db.VarChar(160)
  slug              String    @unique @db.VarChar(200)
  internal_codename String?   @db.VarChar(80)
  release_status_id Int
  announcement_date DateTime? @db.Date
  release_date      DateTime? @db.Date
  description       String?
  cover_image_url   String?
  view_count        Int       @default(0)
  created_at        DateTime  @default(now()) @db.Timestamptz(6)
  updated_at        DateTime  @updatedAt @db.Timestamptz(6)
  deleted_at        DateTime? @db.Timestamptz(6)

  product_family product_families @relation(fields: [product_family_id], references: [id])
  release_status release_statuses @relation(fields: [release_status_id], references: [id])
  device_variants device_variants[]
  raw_pages       raw_pages[]

  @@unique([product_family_id, name])
  @@index([slug])
  @@index([release_date])
}

model device_variants {
  id                String    @id @default(uuid()) @db.Uuid
  device_model_id   String    @db.Uuid
  variant_name      String    @db.VarChar(160)
  sku_code          String?   @db.VarChar(100)
  color_name        String?   @db.VarChar(80)
  release_status_id Int
  launch_date       DateTime? @db.Date
  launch_price      Decimal?  @db.Decimal(12, 2)
  currency_code     String?   @db.VarChar(3)
  is_default        Boolean   @default(false)
  created_at        DateTime  @default(now()) @db.Timestamptz(6)
  updated_at        DateTime  @updatedAt @db.Timestamptz(6)

  device_model    device_models    @relation(fields: [device_model_id], references: [id])
  release_status  release_statuses @relation(fields: [release_status_id], references: [id])
  affiliate_links affiliate_links[]

  @@unique([device_model_id, variant_name])
}

// =====================================
// COMPONENTS (chipsets, displays...)
// =====================================

model chipsets {
  id                  String  @id @default(uuid()) @db.Uuid
  manufacturer_org_id String  @db.Uuid
  name                String  @unique @db.VarChar(160)
  slug                String  @unique @db.VarChar(180)
  description         String?
  created_at          DateTime @default(now()) @db.Timestamptz(6)

  manufacturer organizations @relation(fields: [manufacturer_org_id], references: [id])

  @@index([slug])
}

// =====================================
// USERS & AUTH
// =====================================

model users {
  id              String    @id @default(uuid()) @db.Uuid
  email           String    @unique @db.VarChar(255)
  email_verified  Boolean   @default(false)
  password_hash   String?
  name            String?   @db.VarChar(120)
  username        String?   @unique @db.VarChar(60)
  avatar_url      String?
  role            String    @default("reader") @db.VarChar(20)
  is_active       Boolean   @default(true)
  last_login_at   DateTime?
  created_at      DateTime  @default(now()) @db.Timestamptz(6)
  updated_at      DateTime  @updatedAt @db.Timestamptz(6)
  deleted_at      DateTime?

  search_logs   search_logs[]
  wishlists     wishlists[]
  price_alerts  price_alerts[]
  notifications notifications[]
  subscription  subscriptions?

  @@index([email])
}

// =====================================
// AI & SEARCH
// =====================================

model embeddings {
  id          String   @id @default(uuid()) @db.Uuid
  entity_type String   @db.VarChar(50)
  entity_id   String   @db.Uuid
  chunk_text  String
  chunk_index Int      @default(0)
  // pgvector: cần dùng Unsupported và migration thủ công
  // embedding   Unsupported("vector(1536)")
  embedding_json Json   // Tạm thời dùng JSON, sau migrate sang vector
  model_name  String   @db.VarChar(50)
  created_at  DateTime @default(now())

  @@index([entity_type, entity_id])
}

model ai_query_cache {
  id          String    @id @default(uuid()) @db.Uuid
  query_hash  String    @unique @db.VarChar(64)
  query_text  String
  answer_text String
  citations   Json
  model_name  String    @db.VarChar(50)
  hit_count   Int       @default(1)
  created_at  DateTime  @default(now())
  expires_at  DateTime?

  @@index([expires_at])
}

model search_logs {
  id           String   @id @default(uuid()) @db.Uuid
  user_id      String?  @db.Uuid
  query        String
  query_type   String   @db.VarChar(20)
  result_count Int      @default(0)
  session_id   String?  @db.Uuid
  created_at   DateTime @default(now())

  user users? @relation(fields: [user_id], references: [id])

  @@index([user_id])
  @@index([created_at])
}

// =====================================
// CRAWLER
// =====================================

model data_sources {
  id              String    @id @default(uuid()) @db.Uuid
  name            String    @unique @db.VarChar(100)
  base_url        String
  reliability     Int       @default(50)
  last_crawled_at DateTime?
  crawl_config    Json
  is_active       Boolean   @default(true)
  created_at      DateTime  @default(now())

  raw_pages raw_pages[]
}

model raw_pages {
  id              String    @id @default(uuid()) @db.Uuid
  source_id       String    @db.Uuid
  url             String    @unique
  raw_html        String?   @db.Text
  raw_text        String?   @db.Text
  parsed_data     Json?
  status          String    @default("pending")
  device_model_id String?   @db.Uuid
  crawled_at      DateTime  @default(now())
  parsed_at       DateTime?

  source       data_sources    @relation(fields: [source_id], references: [id])
  device_model device_models?  @relation(fields: [device_model_id], references: [id])

  @@index([status])
}

// =====================================
// COMMERCE & AFFILIATE
// =====================================

model affiliate_partners {
  id              String   @id @default(uuid()) @db.Uuid
  name            String   @unique @db.VarChar(100)
  slug            String   @unique @db.VarChar(120)
  base_url        String
  logo_url        String?
  commission_rate Decimal  @db.Decimal(5, 2)
  is_active       Boolean  @default(true)

  affiliate_links affiliate_links[]
}

model affiliate_links {
  id                String    @id @default(uuid()) @db.Uuid
  partner_id        String    @db.Uuid
  device_variant_id String    @db.Uuid
  region_code       String    @db.VarChar(2)
  product_url       String
  current_price     Decimal?  @db.Decimal(12, 2)
  currency_code     String    @db.VarChar(3)
  in_stock          Boolean   @default(true)
  last_checked_at   DateTime  @default(now())

  partner        affiliate_partners @relation(fields: [partner_id], references: [id])
  device_variant device_variants    @relation(fields: [device_variant_id], references: [id])

  @@index([device_variant_id, region_code])
}

// =====================================
// SUBSCRIPTIONS
// =====================================

model subscription_plans {
  id            String   @id @default(uuid()) @db.Uuid
  code          String   @unique @db.VarChar(30)
  name          String   @db.VarChar(100)
  price_monthly Decimal  @db.Decimal(8, 2)
  price_yearly  Decimal  @db.Decimal(8, 2)
  currency_code String   @db.VarChar(3)
  features      Json
  is_active     Boolean  @default(true)

  subscriptions subscriptions[]
}

model subscriptions {
  id                  String    @id @default(uuid()) @db.Uuid
  user_id             String    @unique @db.Uuid
  plan_id             String    @db.Uuid
  status              String    @default("active")
  billing_cycle       String    @db.VarChar(20)
  current_period_end  DateTime?
  created_at          DateTime  @default(now())

  user users              @relation(fields: [user_id], references: [id])
  plan subscription_plans @relation(fields: [plan_id], references: [id])
}

// =====================================
// USER ENGAGEMENT
// =====================================

model wishlists {
  id         String   @id @default(uuid()) @db.Uuid
  user_id    String   @db.Uuid
  name       String   @default("Default") @db.VarChar(100)
  is_public  Boolean  @default(false)
  created_at DateTime @default(now())

  user users @relation(fields: [user_id], references: [id])
}

model price_alerts {
  id                String    @id @default(uuid()) @db.Uuid
  user_id           String    @db.Uuid
  device_variant_id String    @db.Uuid
  target_price      Decimal   @db.Decimal(12, 2)
  currency_code     String    @db.VarChar(3)
  is_active         Boolean   @default(true)
  triggered_at      DateTime?
  created_at        DateTime  @default(now())

  user users @relation(fields: [user_id], references: [id])

  @@index([device_variant_id, is_active])
}

model notifications {
  id         String    @id @default(uuid()) @db.Uuid
  user_id    String    @db.Uuid
  type       String    @db.VarChar(50)
  title      String    @db.VarChar(200)
  body       String?
  data       Json?
  read_at    DateTime?
  created_at DateTime  @default(now())

  user users @relation(fields: [user_id], references: [id])

  @@index([user_id, read_at])
}
EOF

# .env riêng cho database package
cat > .env << 'EOF'
DATABASE_URL="postgresql://spechub:spechub_dev_2026@localhost:5432/spechub_dev"
EOF

# Re-export Prisma client
cat > src/index.ts << 'EOF'
export * from '../generated/client'
export { PrismaClient } from '../generated/client'
EOF

# Cài dependencies
pnpm install

# Generate Prisma Client
pnpm prisma generate

# Migrate (tạo bảng)
pnpm prisma migrate dev --name init

cd ../..
```

### Bước 9: Setup `apps/api` (NestJS chính)

```bash
cd apps/api

# Package.json
cat > package.json << 'EOF'
{
  "name": "@spechub/api",
  "version": "0.0.1",
  "private": true,
  "scripts": {
    "dev": "nest start --watch",
    "build": "nest build",
    "start:prod": "node dist/main",
    "type-check": "tsc --noEmit",
    "lint": "eslint \"src/**/*.ts\" --fix",
    "test": "jest"
  },
  "dependencies": {
    "@nestjs/core": "11.0.6",
    "@nestjs/common": "11.0.6",
    "@nestjs/platform-fastify": "11.0.6",
    "@nestjs/config": "4.0.0",
    "@nestjs/swagger": "11.0.0",
    "@nestjs/jwt": "11.0.0",
    "@nestjs/passport": "11.0.0",
    "@nestjs/throttler": "6.4.0",
    "@nestjs/bullmq": "11.0.1",
    "@nestjs/event-emitter": "3.0.0",
    "@nestjs/cache-manager": "3.0.0",
    "@nestjs/schedule": "5.0.0",
    "fastify": "5.2.0",
    "@fastify/static": "8.0.4",
    "@fastify/cookie": "11.0.2",
    "@fastify/helmet": "13.0.1",
    "@spechub/database": "workspace:*",
    "@spechub/types": "workspace:*",
    "ioredis": "5.4.2",
    "bullmq": "5.34.6",
    "cache-manager": "6.3.2",
    "cache-manager-redis-yet": "5.1.5",
    "class-validator": "0.14.1",
    "class-transformer": "0.5.1",
    "passport": "0.7.0",
    "passport-jwt": "4.0.1",
    "passport-local": "1.0.0",
    "bcryptjs": "2.4.3",
    "zod": "3.24.1",
    "reflect-metadata": "0.2.2",
    "rxjs": "7.8.1",
    "meilisearch": "0.46.0",
    "ai": "4.0.27",
    "@ai-sdk/anthropic": "1.0.6",
    "@ai-sdk/openai": "1.0.13"
  },
  "devDependencies": {
    "@nestjs/cli": "11.0.0",
    "@nestjs/schematics": "11.0.0",
    "@nestjs/testing": "11.0.6",
    "@spechub/config": "workspace:*",
    "@types/bcryptjs": "2.4.6",
    "@types/passport-jwt": "4.0.1",
    "@types/passport-local": "1.0.38",
    "@types/node": "22.10.2",
    "@types/express": "5.0.0",
    "ts-loader": "9.5.1",
    "ts-node": "10.9.2",
    "tsconfig-paths": "4.2.0",
    "typescript": "5.7.2",
    "jest": "29.7.0",
    "ts-jest": "29.2.5",
    "@types/jest": "29.5.14"
  }
}
EOF

# Tsconfig dùng config chung
cat > tsconfig.json << 'EOF'
{
  "extends": "@spechub/config/typescript/nestjs",
  "compilerOptions": {
    "baseUrl": "./",
    "paths": {
      "@/*": ["src/*"]
    }
  },
  "include": ["src/**/*"],
  "exclude": ["node_modules", "dist", "test", "**/*.spec.ts"]
}
EOF

# nest-cli.json
cat > nest-cli.json << 'EOF'
{
  "$schema": "https://json.schemastore.org/nest-cli",
  "collection": "@nestjs/schematics",
  "sourceRoot": "src",
  "compilerOptions": {
    "deleteOutDir": true
  }
}
EOF

# .env
cat > .env << 'EOF'
NODE_ENV=development
PORT=4000

DATABASE_URL="postgresql://spechub:spechub_dev_2026@localhost:5432/spechub_dev"
REDIS_URL="redis://localhost:6379"
MEILISEARCH_HOST="http://localhost:7700"

JWT_SECRET="spechub-jwt-dev-secret-min-32-chars-CHANGE-IN-PROD"
JWT_EXPIRES_IN="7d"
JWT_REFRESH_EXPIRES_IN="30d"

AUTH_SECRET="spechub-auth-secret-min-32-chars"

FRONTEND_URL="http://localhost:3000"
ADMIN_URL="http://localhost:3001"
BCRYPT_ROUNDS=12
EOF

# Tạo cấu trúc src
mkdir -p src/{modules,common,prisma,redis,config,health}
mkdir -p src/modules/{auth,users,organizations,categories,families,models,variants,chipsets,search,ai,wishlists,alerts,affiliate,subscriptions,notifications}
mkdir -p src/common/{guards,decorators,filters,pipes,interceptors,dto}

cd ../..
```

### Bước 10: Code chính cho NestJS API

```bash
cd apps/api/src

# main.ts
cat > main.ts << 'EOF'
import 'reflect-metadata'
import { NestFactory } from '@nestjs/core'
import {
  FastifyAdapter,
  NestFastifyApplication,
} from '@nestjs/platform-fastify'
import { ValidationPipe, VersioningType, Logger } from '@nestjs/common'
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger'
import { ConfigService } from '@nestjs/config'
import fastifyHelmet from '@fastify/helmet'
import fastifyCookie from '@fastify/cookie'
import { AppModule } from './app.module'

async function bootstrap() {
  const logger = new Logger('Bootstrap')

  const app = await NestFactory.create<NestFastifyApplication>(
    AppModule,
    new FastifyAdapter({
      logger: false,
      trustProxy: true,
    }),
  )

  const config = app.get(ConfigService)

  await app.register(fastifyHelmet as any, {
    contentSecurityPolicy: false,
  })

  await app.register(fastifyCookie as any, {
    secret: config.get<string>('AUTH_SECRET'),
  })

  app.setGlobalPrefix('api')
  app.enableVersioning({
    type: VersioningType.URI,
    defaultVersion: '1',
  })

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: {
        enableImplicitConversion: true,
      },
    }),
  )

  app.enableCors({
    origin: [
      config.get<string>('FRONTEND_URL') ?? 'http://localhost:3000',
      config.get<string>('ADMIN_URL') ?? 'http://localhost:3001',
    ],
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  })

  if (config.get<string>('NODE_ENV') !== 'production') {
    const swaggerConfig = new DocumentBuilder()
      .setTitle('SpecHub API')
      .setDescription('Smart device wiki & research platform')
      .setVersion('1.0')
      .addBearerAuth()
      .addTag('auth', 'Authentication')
      .addTag('devices', 'Device catalog')
      .addTag('search', 'Search & AI research')
      .addTag('commerce', 'Affiliate & subscriptions')
      .build()
    SwaggerModule.setup('api/docs', app, SwaggerModule.createDocument(app, swaggerConfig))
  }

  const port = config.get<number>('PORT') ?? 4000
  await app.listen(port, '0.0.0.0')

  logger.log('')
  logger.log(`🚀  API:      http://localhost:${port}/api/v1`)
  logger.log(`📖  Swagger:  http://localhost:${port}/api/docs`)
  logger.log(`💚  Health:   http://localhost:${port}/api/v1/health`)
  logger.log('')
}

bootstrap().catch((err) => {
  console.error('Fatal error:', err)
  process.exit(1)
})
EOF

# app.module.ts
cat > app.module.ts << 'EOF'
import { Module } from '@nestjs/common'
import { ConfigModule } from '@nestjs/config'
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler'
import { CacheModule } from '@nestjs/cache-manager'
import { EventEmitterModule } from '@nestjs/event-emitter'
import { ScheduleModule } from '@nestjs/schedule'
import { APP_GUARD, APP_FILTER } from '@nestjs/core'

import { PrismaModule } from './prisma/prisma.module'
import { RedisModule } from './redis/redis.module'
import { HealthController } from './health/health.controller'
import { GlobalExceptionFilter } from './common/filters/global-exception.filter'

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ['.env.local', '.env'],
      cache: true,
    }),

    ThrottlerModule.forRoot([
      { name: 'short', ttl: 1000, limit: 10 },
      { name: 'long', ttl: 60_000, limit: 100 },
    ]),

    EventEmitterModule.forRoot({
      wildcard: true,
      maxListeners: 20,
    }),

    ScheduleModule.forRoot(),

    PrismaModule,
    RedisModule,
  ],
  controllers: [HealthController],
  providers: [
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
    {
      provide: APP_FILTER,
      useClass: GlobalExceptionFilter,
    },
  ],
})
export class AppModule {}
EOF

# Health Controller
cat > health/health.controller.ts << 'EOF'
import { Controller, Get } from '@nestjs/common'
import { ApiTags, ApiOperation } from '@nestjs/swagger'
import { PrismaService } from '../prisma/prisma.service'
import { RedisService } from '../redis/redis.service'

@ApiTags('health')
@Controller('health')
export class HealthController {
  constructor(
    private readonly prisma: PrismaService,
    private readonly redis: RedisService,
  ) {}

  @Get()
  @ApiOperation({ summary: 'Health check endpoint' })
  async health() {
    const checks = await Promise.allSettled([
      this.checkDatabase(),
      this.checkRedis(),
    ])

    const [dbCheck, redisCheck] = checks
    const allOk = checks.every((c) => c.status === 'fulfilled')

    return {
      status: allOk ? 'ok' : 'degraded',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      version: '0.1.0',
      checks: {
        database: dbCheck.status === 'fulfilled' ? 'ok' : 'failed',
        redis: redisCheck.status === 'fulfilled' ? 'ok' : 'failed',
      },
    }
  }

  private async checkDatabase() {
    await this.prisma.$queryRaw`SELECT 1`
  }

  private async checkRedis() {
    await this.redis.ping()
  }
}
EOF

# Prisma Module & Service
cat > prisma/prisma.module.ts << 'EOF'
import { Global, Module } from '@nestjs/common'
import { PrismaService } from './prisma.service'

@Global()
@Module({
  providers: [PrismaService],
  exports: [PrismaService],
})
export class PrismaModule {}
EOF

cat > prisma/prisma.service.ts << 'EOF'
import {
  Injectable,
  OnModuleInit,
  OnModuleDestroy,
  Logger,
} from '@nestjs/common'
import { PrismaClient } from '@spechub/database'

@Injectable()
export class PrismaService
  extends PrismaClient
  implements OnModuleInit, OnModuleDestroy
{
  private readonly logger = new Logger(PrismaService.name)

  constructor() {
    super({
      log: [
        { level: 'warn', emit: 'event' },
        { level: 'error', emit: 'event' },
      ],
    })
  }

  async onModuleInit() {
    await this.$connect()
    this.logger.log('✓ Prisma connected to database')
  }

  async onModuleDestroy() {
    await this.$disconnect()
    this.logger.log('Prisma disconnected')
  }
}
EOF

# Redis Module & Service
cat > redis/redis.module.ts << 'EOF'
import { Global, Module } from '@nestjs/common'
import { RedisService } from './redis.service'

@Global()
@Module({
  providers: [RedisService],
  exports: [RedisService],
})
export class RedisModule {}
EOF

cat > redis/redis.service.ts << 'EOF'
import {
  Injectable,
  OnModuleInit,
  OnModuleDestroy,
  Logger,
} from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import Redis from 'ioredis'

@Injectable()
export class RedisService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(RedisService.name)
  private client!: Redis

  constructor(private readonly config: ConfigService) {}

  onModuleInit() {
    const url = this.config.get<string>('REDIS_URL') ?? 'redis://localhost:6379'

    this.client = new Redis(url, {
      lazyConnect: false,
      maxRetriesPerRequest: 3,
      retryStrategy: (times) => Math.min(times * 100, 2000),
    })

    this.client.on('connect', () => this.logger.log('✓ Redis connected'))
    this.client.on('error', (err) => this.logger.error(`Redis: ${err.message}`))
  }

  onModuleDestroy() {
    this.client?.disconnect()
  }

  async ping(): Promise<string> {
    return this.client.ping()
  }

  async get(key: string): Promise<string | null> {
    return this.client.get(key)
  }

  async set(key: string, value: string, ttlSeconds?: number): Promise<void> {
    if (ttlSeconds) {
      await this.client.setex(key, ttlSeconds, value)
    } else {
      await this.client.set(key, value)
    }
  }

  async del(key: string): Promise<number> {
    return this.client.del(key)
  }

  async getJSON<T>(key: string): Promise<T | null> {
    const raw = await this.get(key)
    if (!raw) return null
    try {
      return JSON.parse(raw) as T
    } catch {
      return null
    }
  }

  async setJSON<T>(key: string, value: T, ttlSeconds?: number): Promise<void> {
    await this.set(key, JSON.stringify(value), ttlSeconds)
  }

  /** Get raw client for advanced operations (pubsub, scripts...) */
  getClient(): Redis {
    return this.client
  }
}
EOF

# Global Exception Filter
cat > common/filters/global-exception.filter.ts << 'EOF'
import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common'
import { FastifyReply, FastifyRequest } from 'fastify'

@Catch()
export class GlobalExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(GlobalExceptionFilter.name)

  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp()
    const response = ctx.getResponse<FastifyReply>()
    const request = ctx.getRequest<FastifyRequest>()

    const status =
      exception instanceof HttpException
        ? exception.getStatus()
        : HttpStatus.INTERNAL_SERVER_ERROR

    const message =
      exception instanceof HttpException
        ? exception.getResponse()
        : 'Internal server error'

    if (status >= 500) {
      this.logger.error(
        `${request.method} ${request.url}`,
        (exception as Error).stack,
      )
    }

    response.status(status).send({
      statusCode: status,
      timestamp: new Date().toISOString(),
      path: request.url,
      message,
    })
  }
}
EOF

cd ../..
```

### Bước 11: Setup `apps/web` (Next.js)

```bash
cd ~/Projects/spechub-v2

# Tạo Next.js bằng CLI chính thức
pnpm create next-app@15.1.3 apps/web \
  --typescript \
  --tailwind \
  --app \
  --src-dir \
  --import-alias "@/*" \
  --eslint \
  --no-turbopack \
  --use-pnpm

cd apps/web

# Cài dependencies bổ sung
pnpm add \
  @tanstack/react-query@5.62.10 \
  @tanstack/react-table@8.20.6 \
  @tanstack/react-query-devtools@5.62.10 \
  zustand@5.0.2 \
  axios@1.7.9 \
  react-hook-form@7.54.2 \
  @hookform/resolvers@3.10.0 \
  zod@3.24.1 \
  ai@4.0.27 \
  @ai-sdk/react@1.0.7 \
  @radix-ui/react-dialog@1.1.4 \
  @radix-ui/react-dropdown-menu@2.1.4 \
  @radix-ui/react-tabs@1.1.2 \
  @radix-ui/react-tooltip@1.1.6 \
  @radix-ui/react-select@2.1.4 \
  @radix-ui/react-slot@1.1.1 \
  lucide-react@0.469.0 \
  next-themes@0.4.4 \
  date-fns@4.1.0 \
  clsx@2.1.1 \
  tailwind-merge@2.6.0

# Folders
cd src
mkdir -p "app/(public)/(catalog)/devices/[slug]"
mkdir -p "app/(public)/(catalog)/chipsets/[slug]"
mkdir -p "app/(public)/search"
mkdir -p "app/(public)/compare"
mkdir -p "app/(auth)/login"
mkdir -p "app/(auth)/register"
mkdir -p "app/(account)/dashboard"
mkdir -p "app/(account)/wishlist"
mkdir -p "app/(account)/alerts"
mkdir -p "app/api/auth"
mkdir -p components/{ui,layout,catalog,search,compare,ai}
mkdir -p lib/{api,auth,utils}
mkdir -p hooks stores types

cd ../../..
```

### Bước 12: Chạy thử

```bash
cd ~/Projects/spechub-v2

# Cài lại dependencies sau khi có hết files
pnpm install

# Generate Prisma Client
pnpm db:generate

# Migrate database
pnpm db:migrate

# Chạy tất cả
pnpm dev
```

Mở 3 URLs:
- `http://localhost:3000` — Web
- `http://localhost:4000/api/docs` — Swagger
- `http://localhost:5555` — Prisma Studio (`pnpm db:studio`)

---

## Phần 6 — Roadmap triển khai

### Sprint 1 (Tuần 1-2): Foundation ✅
- [x] Monorepo setup
- [x] Database schema cơ bản
- [x] Auth module (JWT)
- [x] Health checks

### Sprint 2 (Tuần 3-4): Core Catalog
- [ ] CRUD Organizations, Categories, Families
- [ ] CRUD Device Models, Variants
- [ ] Public listing pages
- [ ] Detail pages với full specs

### Sprint 3 (Tuần 5-6): Search & AI Foundation
- [ ] Meilisearch integration
- [ ] Embedding pipeline (Voyage AI)
- [ ] AI search endpoint
- [ ] Frontend search UI

### Sprint 4 (Tuần 7-8): Crawler
- [ ] Crawler service với Playwright
- [ ] LLM extractor module
- [ ] Admin review queue
- [ ] Auto schedule với BullMQ

### Sprint 5 (Tuần 9-10): Commerce
- [ ] Affiliate links module
- [ ] Price history tracking
- [ ] User wishlist
- [ ] Price alerts với cron job

### Sprint 6 (Tuần 11-12): Engagement
- [ ] User profiles
- [ ] Reviews & ratings
- [ ] Notifications system
- [ ] Email với Resend

### Sprint 7+: Premium Features
- [ ] Subscription với Stripe
- [ ] B2B API với rate limiting
- [ ] Mobile app (Expo)
- [ ] Multi-language

---

## Phần 7 — Checklist tổng kết

### Setup ban đầu
- [ ] Node 22.11.0 LTS
- [ ] pnpm 9.15.0
- [ ] PostgreSQL 16 + pgvector
- [ ] Redis 7
- [ ] Meilisearch 1.11+

### Monorepo
- [ ] `pnpm-workspace.yaml`
- [ ] `turbo.json` với tasks đầy đủ
- [ ] `packages/config` shared
- [ ] `packages/database` với Prisma 6

### Backend
- [ ] NestJS 11.0.6
- [ ] Fastify 5.2.0
- [ ] PrismaService với type đúng
- [ ] RedisService không lỗi type
- [ ] Health check endpoint
- [ ] Global exception filter

### Frontend
- [ ] Next.js 15.1.3
- [ ] React 19 stable
- [ ] Tailwind 3.4 (KHÔNG v4)
- [ ] App Router

### Database
- [ ] Schema cơ bản
- [ ] AI tables (embeddings, ai_query_cache)
- [ ] Crawler tables (data_sources, raw_pages)
- [ ] Commerce tables (affiliate, subscriptions)
- [ ] User engagement tables
- [ ] Migrations chạy thành công

### Vận hành
- [ ] `pnpm dev` chạy được tất cả
- [ ] Health check trả ok
- [ ] Swagger docs accessible
- [ ] Prisma Studio mở được
- [ ] Meilisearch reachable

---

## Phần 8 — Lưu ý quan trọng

1. **KHÔNG dùng Prisma 7** — đã có quá nhiều breaking changes
2. **KHÔNG dùng Tailwind 4** — vẫn alpha
3. **KHÔNG dùng `latest` cho dependencies**
4. **Có 2 file `.env`** — `apps/api/.env` và `packages/database/.env`, cùng `DATABASE_URL`
5. **Generate Prisma TRƯỚC KHI** dùng PrismaClient
6. **Dùng `workspace:*` cho internal packages** (escape `*` với nháy đơn)
7. **Cast type rõ ràng** với `ConfigService.get<string>(...)`
8. **Test từng app riêng** trước khi `pnpm dev`

Khi mọi thứ chạy đúng, bạn có nền móng vững chắc cho một platform AI-powered có thể scale.
