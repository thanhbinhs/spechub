CREATE TABLE "api_keys" (
  "id" UUID NOT NULL,
  "user_id" UUID NOT NULL,
  "name" VARCHAR(100) NOT NULL,
  "key_prefix" VARCHAR(32) NOT NULL,
  "key_hash" CHAR(64) NOT NULL,
  "scopes" JSONB NOT NULL,
  "rate_limit_per_minute" INTEGER NOT NULL DEFAULT 60,
  "monthly_quota" INTEGER,
  "is_active" BOOLEAN NOT NULL DEFAULT true,
  "last_used_at" TIMESTAMPTZ(6),
  "expires_at" TIMESTAMPTZ(6),
  "revoked_at" TIMESTAMPTZ(6),
  "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMPTZ(6) NOT NULL,
  CONSTRAINT "api_keys_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "api_key_usage" (
  "id" UUID NOT NULL,
  "api_key_id" UUID NOT NULL,
  "bucket_start" TIMESTAMPTZ(6) NOT NULL,
  "request_count" INTEGER NOT NULL DEFAULT 0,
  "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMPTZ(6) NOT NULL,
  CONSTRAINT "api_key_usage_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "api_keys_key_prefix_key" ON "api_keys"("key_prefix");
CREATE UNIQUE INDEX "api_keys_key_hash_key" ON "api_keys"("key_hash");
CREATE INDEX "api_keys_user_id_is_active_idx" ON "api_keys"("user_id", "is_active");
CREATE INDEX "api_keys_expires_at_idx" ON "api_keys"("expires_at");
CREATE UNIQUE INDEX "api_key_usage_api_key_id_bucket_start_key" ON "api_key_usage"("api_key_id", "bucket_start");
CREATE INDEX "api_key_usage_bucket_start_idx" ON "api_key_usage"("bucket_start");

ALTER TABLE "api_keys"
  ADD CONSTRAINT "api_keys_user_id_fkey"
  FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "api_key_usage"
  ADD CONSTRAINT "api_key_usage_api_key_id_fkey"
  FOREIGN KEY ("api_key_id") REFERENCES "api_keys"("id") ON DELETE CASCADE ON UPDATE CASCADE;
