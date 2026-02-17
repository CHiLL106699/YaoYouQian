-- ============================================
-- Sprint 4: YOKAGE × YaoYouQian 產品線聯動 — Schema 同步 Migration
-- Date: 2026-02-17
-- Description: 確保兩個產品線共用同一套 Supabase 資料庫結構
--              此檔案為冪等設計，可安全重複執行
-- ============================================

-- ============================================
-- Step 1: 確保 ENUM 型別存在
-- ============================================
DO $$ BEGIN
  CREATE TYPE "plan_type_enum" AS ENUM ('yokage_starter', 'yokage_pro', 'yyq_basic', 'yyq_advanced');
EXCEPTION WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE "source_product_enum" AS ENUM ('yokage', 'yaoyouqian');
EXCEPTION WHEN duplicate_object THEN null;
END $$;

-- ============================================
-- Step 2: 確保 tenants 表擁有所有必要欄位
-- ============================================
-- 若從 YaoYouQian 側執行，tenants 表可能缺少部分欄位
ALTER TABLE "tenants" ADD COLUMN IF NOT EXISTS "slug" varchar(100);
ALTER TABLE "tenants" ADD COLUMN IF NOT EXISTS "logo" text;
ALTER TABLE "tenants" ADD COLUMN IF NOT EXISTS "address" text;
ALTER TABLE "tenants" ADD COLUMN IF NOT EXISTS "phone" varchar(20);
ALTER TABLE "tenants" ADD COLUMN IF NOT EXISTS "email" varchar(320);
ALTER TABLE "tenants" ADD COLUMN IF NOT EXISTS "timezone" varchar(50) DEFAULT 'Asia/Taipei';
ALTER TABLE "tenants" ADD COLUMN IF NOT EXISTS "currency" varchar(10) DEFAULT 'TWD';
ALTER TABLE "tenants" ADD COLUMN IF NOT EXISTS "businessHours" jsonb;
ALTER TABLE "tenants" ADD COLUMN IF NOT EXISTS "settings" jsonb;
ALTER TABLE "tenants" ADD COLUMN IF NOT EXISTS "subscriptionPlan" text DEFAULT 'free';
ALTER TABLE "tenants" ADD COLUMN IF NOT EXISTS "subscriptionStatus" text DEFAULT 'active';
ALTER TABLE "tenants" ADD COLUMN IF NOT EXISTS "trialEndsAt" timestamp;
ALTER TABLE "tenants" ADD COLUMN IF NOT EXISTS "isActive" boolean DEFAULT true;

-- 產品線聯動核心欄位（冪等）
ALTER TABLE "tenants" ADD COLUMN IF NOT EXISTS "planType" text DEFAULT 'yokage_starter';
ALTER TABLE "tenants" ADD COLUMN IF NOT EXISTS "enabledModules" jsonb;
ALTER TABLE "tenants" ADD COLUMN IF NOT EXISTS "sourceProduct" text DEFAULT 'yokage';

-- YaoYouQian 特有欄位（確保 YOKAGE 側也有）
ALTER TABLE "tenants" ADD COLUMN IF NOT EXISTS "subdomain" varchar(100);
ALTER TABLE "tenants" ADD COLUMN IF NOT EXISTS "owner_line_user_id" varchar(100);
ALTER TABLE "tenants" ADD COLUMN IF NOT EXISTS "status" varchar(20) DEFAULT 'active';
ALTER TABLE "tenants" ADD COLUMN IF NOT EXISTS "plan_type" varchar(30);
ALTER TABLE "tenants" ADD COLUMN IF NOT EXISTS "enabled_modules" jsonb;
ALTER TABLE "tenants" ADD COLUMN IF NOT EXISTS "source_product" varchar(20);

-- ============================================
-- Step 3: 確保 users 表擁有所有必要欄位
-- ============================================
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "phone" varchar(20);
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "avatar" text;
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "lineUserId" varchar(64);

-- ============================================
-- Step 4: 建立索引（冪等）
-- ============================================
CREATE INDEX IF NOT EXISTS "idx_tenants_plan_type" ON "tenants" ("planType");
CREATE INDEX IF NOT EXISTS "idx_tenants_source_product" ON "tenants" ("sourceProduct");
CREATE INDEX IF NOT EXISTS "idx_tenants_slug" ON "tenants" ("slug");
CREATE INDEX IF NOT EXISTS "idx_tenants_subdomain" ON "tenants" ("subdomain");
CREATE INDEX IF NOT EXISTS "idx_tenants_is_active" ON "tenants" ("isActive");
CREATE INDEX IF NOT EXISTS "idx_users_open_id" ON "users" ("openId");
CREATE INDEX IF NOT EXISTS "idx_users_line_user_id" ON "users" ("lineUserId");

-- ============================================
-- Step 5: RLS Policy — 租戶資料隔離
-- ============================================
-- 啟用 RLS
ALTER TABLE "tenants" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "users" ENABLE ROW LEVEL SECURITY;

-- 建立 helper function（冪等）
CREATE OR REPLACE FUNCTION current_tenant_id() RETURNS integer AS $$
  SELECT COALESCE(
    NULLIF(current_setting('app.current_tenant_id', true), '')::integer,
    0
  );
$$ LANGUAGE sql STABLE;

CREATE OR REPLACE FUNCTION current_user_role() RETURNS text AS $$
  SELECT COALESCE(
    NULLIF(current_setting('app.user_role', true), ''),
    'user'
  );
$$ LANGUAGE sql STABLE;

-- Tenants RLS: 租戶只能看到自己的資料，super_admin 可看全部
DO $$ BEGIN
  DROP POLICY IF EXISTS "tenants_isolation" ON "tenants";
  CREATE POLICY "tenants_isolation" ON "tenants"
    USING (
      current_user_role() = 'super_admin'
      OR id = current_tenant_id()
    );
EXCEPTION WHEN OTHERS THEN null;
END $$;

-- ============================================
-- Step 6: 確保核心業務表存在（customers, appointments 等）
-- 這些表在兩個產品線中都需要
-- ============================================

-- customers 表補充欄位
ALTER TABLE "customers" ADD COLUMN IF NOT EXISTS "lineUserId" varchar(64);
ALTER TABLE "customers" ADD COLUMN IF NOT EXISTS "tags" jsonb;
ALTER TABLE "customers" ADD COLUMN IF NOT EXISTS "source" text;
ALTER TABLE "customers" ADD COLUMN IF NOT EXISTS "lastVisitAt" timestamp;

CREATE INDEX IF NOT EXISTS "idx_customers_tenant" ON "customers" ("tenant_id");
CREATE INDEX IF NOT EXISTS "idx_customers_line_user" ON "customers" ("lineUserId");

-- appointments 表補充欄位
ALTER TABLE "appointments" ADD COLUMN IF NOT EXISTS "source" text DEFAULT 'manual';

CREATE INDEX IF NOT EXISTS "idx_appointments_tenant" ON "appointments" ("tenant_id");
CREATE INDEX IF NOT EXISTS "idx_appointments_date" ON "appointments" ("appointment_date");

-- ============================================
-- Step 7: 產品線升級追蹤表
-- ============================================
CREATE TABLE IF NOT EXISTS "product_upgrade_logs" (
  "id" serial PRIMARY KEY,
  "tenant_id" integer NOT NULL,
  "from_plan" text NOT NULL,
  "to_plan" text NOT NULL,
  "from_product" text NOT NULL,
  "to_product" text NOT NULL,
  "upgraded_by" integer,
  "upgrade_reason" text,
  "metadata" jsonb,
  "created_at" timestamp DEFAULT now() NOT NULL
);

CREATE INDEX IF NOT EXISTS "idx_upgrade_logs_tenant" ON "product_upgrade_logs" ("tenant_id");
CREATE INDEX IF NOT EXISTS "idx_upgrade_logs_created" ON "product_upgrade_logs" ("created_at");

-- ============================================
-- Step 8: 訂閱付款表（確保存在，供營收統計用）
-- ============================================
CREATE TABLE IF NOT EXISTS "subscription_payments" (
  "id" serial PRIMARY KEY,
  "tenant_id" integer NOT NULL,
  "amount" decimal(10,2) NOT NULL DEFAULT 0,
  "currency" varchar(10) DEFAULT 'TWD',
  "status" varchar(20) DEFAULT 'pending',
  "payment_method" varchar(50),
  "period_start" timestamp,
  "period_end" timestamp,
  "metadata" jsonb,
  "created_at" timestamp DEFAULT now() NOT NULL
);

CREATE INDEX IF NOT EXISTS "idx_sub_payments_tenant" ON "subscription_payments" ("tenant_id");
CREATE INDEX IF NOT EXISTS "idx_sub_payments_status" ON "subscription_payments" ("status");

-- ============================================
-- 完成
-- ============================================
-- 此 migration 確保 YOKAGE 和 YaoYouQian 兩個產品線
-- 可以安全地連接到同一個 Supabase 資料庫。
-- 所有操作均為冪等設計（IF NOT EXISTS / IF EXISTS），
-- 可在任一產品線的部署流程中安全執行。
