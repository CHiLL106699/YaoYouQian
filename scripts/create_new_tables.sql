-- ============================================================
-- BI Dashboard Tables
-- ============================================================

-- 1. dashboard_snapshots: 每日快照，用於歷史趨勢
CREATE TABLE IF NOT EXISTS dashboard_snapshots (
  id BIGSERIAL PRIMARY KEY,
  tenant_id BIGINT NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  snapshot_date DATE NOT NULL,
  metrics JSONB NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(tenant_id, snapshot_date)
);

-- 2. report_exports: 報表匯出記錄
CREATE TABLE IF NOT EXISTS report_exports (
  id BIGSERIAL PRIMARY KEY,
  tenant_id BIGINT NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  report_type TEXT NOT NULL,
  file_url TEXT,
  format TEXT NOT NULL CHECK (format IN ('csv', 'xlsx', 'pdf')),
  generated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  generated_by TEXT
);

-- ============================================================
-- Marketing Automation Tables
-- ============================================================

-- 3. smart_tags: 智能標籤
CREATE TABLE IF NOT EXISTS smart_tags (
  id BIGSERIAL PRIMARY KEY,
  tenant_id BIGINT NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  tag_name TEXT NOT NULL,
  tag_category TEXT NOT NULL CHECK (tag_category IN ('behavior', 'interest', 'status', 'custom')),
  auto_rule JSONB,
  color TEXT DEFAULT '#6366f1',
  description TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 4. customer_smart_tags: 客戶標籤關聯
CREATE TABLE IF NOT EXISTS customer_smart_tags (
  id BIGSERIAL PRIMARY KEY,
  customer_id BIGINT NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
  tag_id BIGINT NOT NULL REFERENCES smart_tags(id) ON DELETE CASCADE,
  tenant_id BIGINT NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  applied_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  applied_by TEXT NOT NULL CHECK (applied_by IN ('auto', 'manual')),
  expires_at TIMESTAMPTZ,
  UNIQUE(customer_id, tag_id)
);

-- 5. campaign_templates: 行銷模板
CREATE TABLE IF NOT EXISTS campaign_templates (
  id BIGSERIAL PRIMARY KEY,
  tenant_id BIGINT NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  template_name TEXT NOT NULL,
  message_type TEXT NOT NULL CHECK (message_type IN ('text', 'flex', 'image')),
  content JSONB NOT NULL DEFAULT '{}',
  category TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 6. campaign_executions: 行銷執行記錄
CREATE TABLE IF NOT EXISTS campaign_executions (
  id BIGSERIAL PRIMARY KEY,
  campaign_id BIGINT,
  tenant_id BIGINT NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  template_id BIGINT REFERENCES campaign_templates(id),
  target_tag_ids JSONB DEFAULT '[]',
  target_count INTEGER NOT NULL DEFAULT 0,
  sent_count INTEGER NOT NULL DEFAULT 0,
  opened_count INTEGER NOT NULL DEFAULT 0,
  clicked_count INTEGER NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'pending',
  executed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 7. medical_compliance_keywords: 醫療法規警示詞庫
CREATE TABLE IF NOT EXISTS medical_compliance_keywords (
  id BIGSERIAL PRIMARY KEY,
  keyword TEXT NOT NULL UNIQUE,
  severity TEXT NOT NULL CHECK (severity IN ('warning', 'blocked')),
  regulation_reference TEXT,
  description TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- Indexes for performance
-- ============================================================
CREATE INDEX IF NOT EXISTS idx_dashboard_snapshots_tenant_date ON dashboard_snapshots(tenant_id, snapshot_date);
CREATE INDEX IF NOT EXISTS idx_report_exports_tenant ON report_exports(tenant_id);
CREATE INDEX IF NOT EXISTS idx_smart_tags_tenant ON smart_tags(tenant_id);
CREATE INDEX IF NOT EXISTS idx_customer_smart_tags_tenant ON customer_smart_tags(tenant_id);
CREATE INDEX IF NOT EXISTS idx_customer_smart_tags_customer ON customer_smart_tags(customer_id);
CREATE INDEX IF NOT EXISTS idx_customer_smart_tags_tag ON customer_smart_tags(tag_id);
CREATE INDEX IF NOT EXISTS idx_campaign_templates_tenant ON campaign_templates(tenant_id);
CREATE INDEX IF NOT EXISTS idx_campaign_executions_tenant ON campaign_executions(tenant_id);

-- ============================================================
-- Seed default compliance keywords
-- ============================================================
INSERT INTO medical_compliance_keywords (keyword, severity, regulation_reference, description) VALUES
  ('買一送一', 'blocked', '醫療法第86條', '醫療廣告不得以促銷手法招攬病人'),
  ('免費', 'warning', '醫療法第86條', '免費字眼可能構成不當招攬'),
  ('保證', 'blocked', '醫療法第86條', '醫療行為不得保證療效'),
  ('最便宜', 'blocked', '醫療法第86條', '不得以價格比較方式招攬'),
  ('效果最好', 'blocked', '醫療法第86條', '不得宣稱療效優於他人'),
  ('無副作用', 'blocked', '醫療法第86條', '不得宣稱無副作用'),
  ('永久', 'warning', '醫療法第86條', '不得暗示永久效果'),
  ('第一', 'warning', '醫療法第86條', '不得使用排名性用語'),
  ('最好', 'blocked', '醫療法第86條', '不得使用最高級形容詞'),
  ('特價', 'warning', '醫療法第86條', '促銷用語可能違規'),
  ('打折', 'warning', '醫療法第86條', '折扣用語可能構成不當招攬'),
  ('限時', 'warning', '醫療法第86條', '限時優惠可能構成不當招攬'),
  ('秒殺', 'blocked', '醫療法第86條', '促銷用語不得用於醫療廣告'),
  ('治癒', 'blocked', '醫療法第86條', '不得保證治癒效果'),
  ('根治', 'blocked', '醫療法第86條', '不得保證根治效果')
ON CONFLICT (keyword) DO NOTHING;

-- ============================================================
-- RLS Policies
-- ============================================================
ALTER TABLE dashboard_snapshots ENABLE ROW LEVEL SECURITY;
ALTER TABLE report_exports ENABLE ROW LEVEL SECURITY;
ALTER TABLE smart_tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE customer_smart_tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE campaign_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE campaign_executions ENABLE ROW LEVEL SECURITY;
ALTER TABLE medical_compliance_keywords ENABLE ROW LEVEL SECURITY;

-- Service role bypass (for backend operations)
CREATE POLICY "service_role_all_dashboard_snapshots" ON dashboard_snapshots FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY "service_role_all_report_exports" ON report_exports FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY "service_role_all_smart_tags" ON smart_tags FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY "service_role_all_customer_smart_tags" ON customer_smart_tags FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY "service_role_all_campaign_templates" ON campaign_templates FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY "service_role_all_campaign_executions" ON campaign_executions FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY "service_role_all_compliance_keywords" ON medical_compliance_keywords FOR ALL TO service_role USING (true) WITH CHECK (true);
