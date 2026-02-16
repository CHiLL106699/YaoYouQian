-- 建立 tenants 表（租戶基本資料）
CREATE TABLE IF NOT EXISTS tenants (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  subdomain VARCHAR(100) NOT NULL UNIQUE,
  custom_domain VARCHAR(255),
  status VARCHAR(50) NOT NULL DEFAULT 'active',
  owner_line_user_id TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 建立索引
CREATE INDEX idx_tenants_subdomain ON tenants(subdomain);
CREATE INDEX idx_tenants_status ON tenants(status);
CREATE INDEX idx_tenants_owner_line_user_id ON tenants(owner_line_user_id);

-- 啟用 RLS
ALTER TABLE tenants ENABLE ROW LEVEL SECURITY;

-- RLS 策略：租戶只能查看自己的資料
CREATE POLICY "Tenants can view own data"
  ON tenants FOR SELECT
  USING (id = current_setting('app.current_tenant_id', true)::INTEGER);

-- RLS 策略：超級管理員可查看所有資料
CREATE POLICY "Super admin can view all tenants"
  ON tenants FOR SELECT
  USING (current_setting('app.user_role', true) = 'super_admin');

-- RLS 策略：租戶可更新自己的資料
CREATE POLICY "Tenants can update own data"
  ON tenants FOR UPDATE
  USING (id = current_setting('app.current_tenant_id', true)::INTEGER);

-- 建立 updated_at 自動更新觸發器
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_tenants_updated_at
  BEFORE UPDATE ON tenants
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
