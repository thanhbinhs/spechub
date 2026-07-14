-- Production billing metadata, idempotent webhook tracking, and durable audit logs.
ALTER TABLE "subscription_plans"
  ADD COLUMN "stripe_price_monthly_id" VARCHAR(120),
  ADD COLUMN "stripe_price_yearly_id" VARCHAR(120);

ALTER TABLE "subscriptions"
  ADD COLUMN "provider" VARCHAR(30) NOT NULL DEFAULT 'manual',
  ADD COLUMN "cancelled_at" TIMESTAMP(3),
  ADD COLUMN "ended_at" TIMESTAMP(3),
  ADD COLUMN "last_payment_at" TIMESTAMP(3),
  ADD COLUMN "last_payment_error" TEXT;

CREATE UNIQUE INDEX "subscription_plans_stripe_price_monthly_id_key"
  ON "subscription_plans"("stripe_price_monthly_id");

CREATE UNIQUE INDEX "subscription_plans_stripe_price_yearly_id_key"
  ON "subscription_plans"("stripe_price_yearly_id");

CREATE TABLE "billing_audit_logs" (
  "id" UUID NOT NULL,
  "subscription_id" UUID,
  "user_id" UUID,
  "provider" VARCHAR(30) NOT NULL,
  "action" VARCHAR(80) NOT NULL,
  "status" VARCHAR(30) NOT NULL,
  "external_event_id" VARCHAR(120),
  "details" JSONB,
  "error_message" TEXT,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "billing_audit_logs_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "billing_webhook_events" (
  "id" UUID NOT NULL,
  "provider" VARCHAR(30) NOT NULL,
  "external_event_id" VARCHAR(120) NOT NULL,
  "event_type" VARCHAR(100) NOT NULL,
  "payload_hash" CHAR(64) NOT NULL,
  "status" VARCHAR(30) NOT NULL DEFAULT 'received',
  "error_message" TEXT,
  "received_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "processed_at" TIMESTAMP(3),

  CONSTRAINT "billing_webhook_events_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "billing_webhook_events_provider_external_event_id_key"
  ON "billing_webhook_events"("provider", "external_event_id");

CREATE INDEX "billing_audit_logs_user_id_created_at_idx"
  ON "billing_audit_logs"("user_id", "created_at");

CREATE INDEX "billing_audit_logs_subscription_id_created_at_idx"
  ON "billing_audit_logs"("subscription_id", "created_at");

CREATE INDEX "billing_audit_logs_external_event_id_idx"
  ON "billing_audit_logs"("external_event_id");

CREATE INDEX "billing_webhook_events_status_received_at_idx"
  ON "billing_webhook_events"("status", "received_at");

ALTER TABLE "billing_audit_logs"
  ADD CONSTRAINT "billing_audit_logs_subscription_id_fkey"
  FOREIGN KEY ("subscription_id") REFERENCES "subscriptions"("id")
  ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "billing_audit_logs"
  ADD CONSTRAINT "billing_audit_logs_user_id_fkey"
  FOREIGN KEY ("user_id") REFERENCES "users"("id")
  ON DELETE SET NULL ON UPDATE CASCADE;
