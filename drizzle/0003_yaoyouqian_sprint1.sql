-- ============================================
-- YaoYouQian Sprint 1 Migration
-- 新增多產品線欄位、遊戲化行銷表、員工班表/打卡表、通知表
-- ============================================

-- 1. Add new enums
DO $$ BEGIN
  CREATE TYPE "plan_type" AS ENUM ('yokage_starter', 'yokage_pro', 'yyq_basic', 'yyq_advanced');
EXCEPTION WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE "source_product" AS ENUM ('yokage', 'yaoyouqian');
EXCEPTION WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE "gamification_type" AS ENUM ('ichiban_kuji', 'slot_machine');
EXCEPTION WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE "gamification_status" AS ENUM ('draft', 'active', 'ended');
EXCEPTION WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE "prize_status" AS ENUM ('available', 'won', 'expired');
EXCEPTION WHEN duplicate_object THEN null;
END $$;

-- 2. Alter tenants table: add plan_type, enabled_modules, source_product
ALTER TABLE "tenants" ADD COLUMN IF NOT EXISTS "plan_type" varchar(30) DEFAULT 'yyq_basic';
ALTER TABLE "tenants" ADD COLUMN IF NOT EXISTS "enabled_modules" jsonb DEFAULT '[]'::jsonb;
ALTER TABLE "tenants" ADD COLUMN IF NOT EXISTS "source_product" varchar(20) DEFAULT 'yaoyouqian';

-- 3. Alter appointments table: add staff_id
ALTER TABLE "appointments" ADD COLUMN IF NOT EXISTS "staff_id" integer;

-- 4. Create gamification_campaigns table
CREATE TABLE IF NOT EXISTS "gamification_campaigns" (
  "id" serial PRIMARY KEY,
  "tenant_id" integer NOT NULL,
  "name" varchar(200) NOT NULL,
  "type" varchar(30) NOT NULL,
  "status" varchar(20) NOT NULL DEFAULT 'draft',
  "description" text,
  "start_date" timestamp,
  "end_date" timestamp,
  "max_plays_per_user" integer DEFAULT 1,
  "cost_per_play" integer DEFAULT 0,
  "image_url" text,
  "settings" jsonb DEFAULT '{}'::jsonb,
  "created_at" timestamp NOT NULL DEFAULT now(),
  "updated_at" timestamp NOT NULL DEFAULT now()
);

-- 5. Create gamification_prizes table
CREATE TABLE IF NOT EXISTS "gamification_prizes" (
  "id" serial PRIMARY KEY,
  "campaign_id" integer NOT NULL,
  "tenant_id" integer NOT NULL,
  "name" varchar(200) NOT NULL,
  "description" text,
  "image_url" text,
  "probability" decimal(5,4) NOT NULL,
  "total_quantity" integer NOT NULL,
  "remaining_quantity" integer NOT NULL,
  "prize_type" varchar(50) DEFAULT 'physical',
  "prize_value" text,
  "sort_order" integer DEFAULT 0,
  "created_at" timestamp NOT NULL DEFAULT now()
);

-- 6. Create gamification_plays table
CREATE TABLE IF NOT EXISTS "gamification_plays" (
  "id" serial PRIMARY KEY,
  "campaign_id" integer NOT NULL,
  "tenant_id" integer NOT NULL,
  "customer_id" integer,
  "line_user_id" varchar(100),
  "prize_id" integer,
  "is_win" boolean NOT NULL DEFAULT false,
  "played_at" timestamp NOT NULL DEFAULT now()
);

-- 7. Create staff_schedules table
CREATE TABLE IF NOT EXISTS "staff_schedules" (
  "id" serial PRIMARY KEY,
  "tenant_id" integer NOT NULL,
  "staff_id" integer NOT NULL,
  "date" varchar(20) NOT NULL,
  "start_time" varchar(10) NOT NULL,
  "end_time" varchar(10) NOT NULL,
  "shift_type" varchar(30) DEFAULT 'normal',
  "notes" text,
  "created_at" timestamp NOT NULL DEFAULT now(),
  "updated_at" timestamp NOT NULL DEFAULT now()
);

-- 8. Create clock_records table
CREATE TABLE IF NOT EXISTS "clock_records" (
  "id" serial PRIMARY KEY,
  "tenant_id" integer NOT NULL,
  "staff_id" integer NOT NULL,
  "clock_in" timestamp,
  "clock_out" timestamp,
  "date" varchar(20) NOT NULL,
  "location" text,
  "notes" text,
  "created_at" timestamp NOT NULL DEFAULT now()
);

-- 9. Create notifications table
CREATE TABLE IF NOT EXISTS "notifications" (
  "id" serial PRIMARY KEY,
  "tenant_id" integer NOT NULL,
  "target_type" varchar(30) NOT NULL,
  "target_id" integer,
  "title" varchar(200) NOT NULL,
  "content" text NOT NULL,
  "channel" varchar(30) DEFAULT 'line',
  "status" varchar(20) DEFAULT 'pending',
  "sent_at" timestamp,
  "created_at" timestamp NOT NULL DEFAULT now()
);
