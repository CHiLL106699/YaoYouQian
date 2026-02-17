-- ============================================
-- Sprint 4: YaoYouQian Schema Alignment Migration
-- 將 YaoYouQian 資料庫 Schema 與 YOKAGE 完全對齊
-- ============================================
-- 注意：此 Migration 假設 Supabase 資料庫已有 YOKAGE 的完整 Schema。
-- 若 YaoYouQian 使用獨立資料庫，則需執行此 SQL 來補齊缺失的表與欄位。
-- 由於兩個產品共用同一個 Supabase 資料庫（多租戶設計），
-- 此 SQL 主要用於記錄 Schema 對齊的變更歷史。

-- ============================================
-- 1. 確保 tenants 表有完整的產品聯動欄位
-- ============================================
ALTER TABLE tenants ADD COLUMN IF NOT EXISTS plan_type varchar(50) DEFAULT 'yyq_basic';
ALTER TABLE tenants ADD COLUMN IF NOT EXISTS enabled_modules jsonb DEFAULT '[]'::jsonb;
ALTER TABLE tenants ADD COLUMN IF NOT EXISTS source_product varchar(50) DEFAULT 'yaoyouqian';
ALTER TABLE tenants ADD COLUMN IF NOT EXISTS upgrade_requested_at timestamp;
ALTER TABLE tenants ADD COLUMN IF NOT EXISTS upgrade_status varchar(20) DEFAULT NULL;
-- upgrade_status: null (未申請) | 'pending' (待審核) | 'approved' (已批准) | 'rejected' (已拒絕)

-- ============================================
-- 2. 確保 organizations 表（YOKAGE 使用）有對應欄位
-- ============================================
ALTER TABLE organizations ADD COLUMN IF NOT EXISTS plan_type varchar(50) DEFAULT 'yokage_pro';
ALTER TABLE organizations ADD COLUMN IF NOT EXISTS enabled_modules jsonb DEFAULT '[]'::jsonb;
ALTER TABLE organizations ADD COLUMN IF NOT EXISTS source_product varchar(50) DEFAULT 'yokage';
ALTER TABLE organizations ADD COLUMN IF NOT EXISTS upgrade_requested_at timestamp;
ALTER TABLE organizations ADD COLUMN IF NOT EXISTS upgrade_status varchar(20) DEFAULT NULL;

-- ============================================
-- 3. 建立 upgrade_requests 表（升級請求記錄）
-- ============================================
CREATE TABLE IF NOT EXISTS upgrade_requests (
  id serial PRIMARY KEY,
  tenant_id integer NOT NULL,
  organization_id integer,
  current_plan varchar(50) NOT NULL,
  requested_plan varchar(50) NOT NULL DEFAULT 'yokage_pro',
  status varchar(20) NOT NULL DEFAULT 'pending',
  -- pending | approved | rejected
  requested_by integer,
  reviewed_by integer,
  requested_at timestamp DEFAULT now() NOT NULL,
  reviewed_at timestamp,
  notes text,
  admin_notes text,
  source_product varchar(50) DEFAULT 'yaoyouqian',
  created_at timestamp DEFAULT now() NOT NULL,
  updated_at timestamp DEFAULT now() NOT NULL
);

-- ============================================
-- 4. RLS Policy for upgrade_requests
-- ============================================
ALTER TABLE upgrade_requests ENABLE ROW LEVEL SECURITY;

-- 租戶只能看到自己的升級請求
CREATE POLICY IF NOT EXISTS "tenant_view_own_upgrades" ON upgrade_requests
  FOR SELECT
  USING (tenant_id = current_setting('app.current_tenant_id', true)::integer);

-- 租戶只能建立自己的升級請求
CREATE POLICY IF NOT EXISTS "tenant_create_own_upgrades" ON upgrade_requests
  FOR INSERT
  WITH CHECK (tenant_id = current_setting('app.current_tenant_id', true)::integer);

-- 超級管理員可以查看所有升級請求
CREATE POLICY IF NOT EXISTS "super_admin_view_all_upgrades" ON upgrade_requests
  FOR ALL
  USING (current_setting('app.user_role', true) = 'super_admin');

-- ============================================
-- 5. 確保所有共用表都有 RLS 啟用
-- ============================================
-- 以下表在兩個產品中都會使用，確保 RLS 正常運作

-- gamification_campaigns
ALTER TABLE gamification_campaigns ENABLE ROW LEVEL SECURITY;
CREATE POLICY IF NOT EXISTS "tenant_isolation_gamification_campaigns" ON gamification_campaigns
  FOR ALL
  USING (tenant_id = current_setting('app.current_tenant_id', true)::integer);

-- gamification_prizes
ALTER TABLE gamification_prizes ENABLE ROW LEVEL SECURITY;
CREATE POLICY IF NOT EXISTS "tenant_isolation_gamification_prizes" ON gamification_prizes
  FOR ALL
  USING (tenant_id = current_setting('app.current_tenant_id', true)::integer);

-- gamification_plays
ALTER TABLE gamification_plays ENABLE ROW LEVEL SECURITY;
CREATE POLICY IF NOT EXISTS "tenant_isolation_gamification_plays" ON gamification_plays
  FOR ALL
  USING (tenant_id = current_setting('app.current_tenant_id', true)::integer);

-- staff_schedules
ALTER TABLE staff_schedules ENABLE ROW LEVEL SECURITY;
CREATE POLICY IF NOT EXISTS "tenant_isolation_staff_schedules" ON staff_schedules
  FOR ALL
  USING (tenant_id = current_setting('app.current_tenant_id', true)::integer);

-- clock_records
ALTER TABLE clock_records ENABLE ROW LEVEL SECURITY;
CREATE POLICY IF NOT EXISTS "tenant_isolation_clock_records" ON clock_records
  FOR ALL
  USING (tenant_id = current_setting('app.current_tenant_id', true)::integer);

-- notifications
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
CREATE POLICY IF NOT EXISTS "tenant_isolation_notifications" ON notifications
  FOR ALL
  USING (tenant_id = current_setting('app.current_tenant_id', true)::integer);

-- ============================================
-- 6. 建立索引以提升查詢效能
-- ============================================
CREATE INDEX IF NOT EXISTS idx_upgrade_requests_tenant_id ON upgrade_requests(tenant_id);
CREATE INDEX IF NOT EXISTS idx_upgrade_requests_status ON upgrade_requests(status);
CREATE INDEX IF NOT EXISTS idx_upgrade_requests_source_product ON upgrade_requests(source_product);
CREATE INDEX IF NOT EXISTS idx_tenants_plan_type ON tenants(plan_type);
CREATE INDEX IF NOT EXISTS idx_tenants_source_product ON tenants(source_product);
