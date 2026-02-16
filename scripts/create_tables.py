#!/usr/bin/env python3
"""Create HRM/Payroll and ERP tables in Supabase."""
import psycopg2

DB_URL = "postgresql://postgres.mrifutgtlquznfgbmild:13c0e727-a308-4244-9eda-2fd0edaa06a2@aws-1-ap-northeast-1.pooler.supabase.com:5432/postgres"

# Alternative: use keyword args for psycopg2
DB_PARAMS = {
    'host': 'aws-1-ap-northeast-1.pooler.supabase.com',
    'port': 5432,
    'dbname': 'postgres',
    'user': 'postgres.mrifutgtlquznfgbmild',
    'password': '13c0e727-a308-4244-9eda-2fd0edaa06a2',
}

SQL = """
-- ============================================================
-- HRM/Payroll Module Tables
-- ============================================================

-- 1. staff (員工資料表)
CREATE TABLE IF NOT EXISTS staff (
    id BIGINT PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
    tenant_id BIGINT NOT NULL,
    name VARCHAR(255) NOT NULL,
    role_type VARCHAR(50) NOT NULL CHECK (role_type IN ('consultant', 'doctor', 'nurse', 'admin')),
    line_user_id VARCHAR(255),
    phone VARCHAR(50),
    email VARCHAR(255),
    base_salary DECIMAL(12, 2) DEFAULT 0.00,
    status VARCHAR(50) NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'archived')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 2. commission_rules (分潤規則表)
CREATE TABLE IF NOT EXISTS commission_rules (
    id BIGINT PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
    tenant_id BIGINT NOT NULL,
    service_id BIGINT,
    role_type VARCHAR(50) NOT NULL CHECK (role_type IN ('consultant', 'doctor', 'nurse', 'admin')),
    commission_rate DECIMAL(5, 4) NOT NULL,
    condition_type VARCHAR(50) NOT NULL DEFAULT 'immediate' CHECK (condition_type IN ('immediate', 'deferred', 'milestone')),
    condition_value JSONB,
    description TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 3. staff_order_roles (訂單-員工角色關聯表)
CREATE TABLE IF NOT EXISTS staff_order_roles (
    id BIGINT PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
    order_id BIGINT NOT NULL,
    staff_id BIGINT NOT NULL REFERENCES staff(id) ON DELETE CASCADE,
    role_type VARCHAR(50) NOT NULL CHECK (role_type IN ('consultant', 'doctor', 'nurse', 'admin')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(order_id, staff_id, role_type)
);

-- 4. commission_records (分潤記錄表)
CREATE TABLE IF NOT EXISTS commission_records (
    id BIGINT PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
    order_id BIGINT NOT NULL,
    staff_id BIGINT NOT NULL REFERENCES staff(id) ON DELETE CASCADE,
    tenant_id BIGINT NOT NULL,
    role_type VARCHAR(50) NOT NULL,
    amount DECIMAL(12, 2) NOT NULL,
    rate DECIMAL(5, 4) NOT NULL,
    status VARCHAR(50) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'partial', 'paid', 'cancelled')),
    paid_at TIMESTAMPTZ,
    deferred_conditions JSONB,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- ERP Module Tables
-- ============================================================

-- 5. inventory (庫存品項表)
CREATE TABLE IF NOT EXISTS inventory (
    id BIGINT PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
    tenant_id BIGINT NOT NULL,
    item_name VARCHAR(255) NOT NULL,
    sku VARCHAR(100),
    category VARCHAR(100),
    unit VARCHAR(50) NOT NULL,
    stock_quantity INTEGER NOT NULL DEFAULT 0,
    safety_threshold INTEGER NOT NULL DEFAULT 0,
    cost_price DECIMAL(10, 2),
    supplier VARCHAR(255),
    last_restocked_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 6. service_materials (BOM 物料清單)
CREATE TABLE IF NOT EXISTS service_materials (
    id BIGINT PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
    service_id BIGINT NOT NULL,
    inventory_id BIGINT NOT NULL REFERENCES inventory(id) ON DELETE CASCADE,
    tenant_id BIGINT NOT NULL,
    quantity_per_use DECIMAL(10, 2) NOT NULL,
    unit VARCHAR(50) NOT NULL,
    notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(service_id, inventory_id)
);

-- 7. inventory_transactions (庫存異動記錄表)
CREATE TABLE IF NOT EXISTS inventory_transactions (
    id BIGINT PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
    inventory_id BIGINT NOT NULL REFERENCES inventory(id) ON DELETE RESTRICT,
    tenant_id BIGINT NOT NULL,
    transaction_type VARCHAR(50) NOT NULL CHECK (transaction_type IN ('consume', 'restock', 'adjust', 'return')),
    quantity INTEGER NOT NULL,
    reference_id BIGINT,
    reference_type VARCHAR(100),
    operator_id BIGINT,
    notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 8. low_stock_alerts (低庫存警示表)
CREATE TABLE IF NOT EXISTS low_stock_alerts (
    id BIGINT PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
    inventory_id BIGINT NOT NULL REFERENCES inventory(id) ON DELETE CASCADE,
    tenant_id BIGINT NOT NULL,
    current_stock INTEGER NOT NULL,
    threshold INTEGER NOT NULL,
    alert_type VARCHAR(50) NOT NULL CHECK (alert_type IN ('warning', 'critical')),
    notified_at TIMESTAMPTZ,
    resolved_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- Indexes for performance
-- ============================================================
CREATE INDEX IF NOT EXISTS idx_staff_tenant ON staff(tenant_id);
CREATE INDEX IF NOT EXISTS idx_staff_role ON staff(tenant_id, role_type);
CREATE INDEX IF NOT EXISTS idx_commission_rules_tenant ON commission_rules(tenant_id);
CREATE INDEX IF NOT EXISTS idx_commission_rules_service ON commission_rules(tenant_id, service_id, role_type);
CREATE INDEX IF NOT EXISTS idx_staff_order_roles_order ON staff_order_roles(order_id);
CREATE INDEX IF NOT EXISTS idx_staff_order_roles_staff ON staff_order_roles(staff_id);
CREATE INDEX IF NOT EXISTS idx_commission_records_tenant ON commission_records(tenant_id);
CREATE INDEX IF NOT EXISTS idx_commission_records_staff ON commission_records(staff_id);
CREATE INDEX IF NOT EXISTS idx_commission_records_order ON commission_records(order_id);
CREATE INDEX IF NOT EXISTS idx_commission_records_status ON commission_records(tenant_id, status);
CREATE INDEX IF NOT EXISTS idx_inventory_tenant ON inventory(tenant_id);
CREATE INDEX IF NOT EXISTS idx_inventory_sku ON inventory(tenant_id, sku);
CREATE INDEX IF NOT EXISTS idx_service_materials_service ON service_materials(service_id);
CREATE INDEX IF NOT EXISTS idx_service_materials_inventory ON service_materials(inventory_id);
CREATE INDEX IF NOT EXISTS idx_inventory_transactions_inventory ON inventory_transactions(inventory_id);
CREATE INDEX IF NOT EXISTS idx_inventory_transactions_tenant ON inventory_transactions(tenant_id);
CREATE INDEX IF NOT EXISTS idx_low_stock_alerts_tenant ON low_stock_alerts(tenant_id);
CREATE INDEX IF NOT EXISTS idx_low_stock_alerts_unresolved ON low_stock_alerts(tenant_id) WHERE resolved_at IS NULL;

-- Enable RLS on all new tables
ALTER TABLE staff ENABLE ROW LEVEL SECURITY;
ALTER TABLE commission_rules ENABLE ROW LEVEL SECURITY;
ALTER TABLE staff_order_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE commission_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE inventory ENABLE ROW LEVEL SECURITY;
ALTER TABLE service_materials ENABLE ROW LEVEL SECURITY;
ALTER TABLE inventory_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE low_stock_alerts ENABLE ROW LEVEL SECURITY;

-- RLS policies: allow service_role full access (backend uses service_role key)
DO $$ 
DECLARE
    tbl TEXT;
BEGIN
    FOR tbl IN SELECT unnest(ARRAY['staff','commission_rules','staff_order_roles','commission_records','inventory','service_materials','inventory_transactions','low_stock_alerts'])
    LOOP
        EXECUTE format('DROP POLICY IF EXISTS service_role_all ON %I', tbl);
        EXECUTE format('CREATE POLICY service_role_all ON %I FOR ALL TO service_role USING (true) WITH CHECK (true)', tbl);
    END LOOP;
END $$;
"""

def main():
    print("Connecting to Supabase PostgreSQL...")
    conn = psycopg2.connect(**DB_PARAMS)
    conn.autocommit = True
    cur = conn.cursor()
    
    print("Executing DDL...")
    cur.execute(SQL)
    
    # Verify tables were created
    cur.execute("""
        SELECT table_name FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name IN ('staff','commission_rules','staff_order_roles','commission_records','inventory','service_materials','inventory_transactions','low_stock_alerts')
        ORDER BY table_name;
    """)
    tables = cur.fetchall()
    print(f"\nCreated/verified {len(tables)} tables:")
    for t in tables:
        print(f"  ✓ {t[0]}")
    
    cur.close()
    conn.close()
    print("\nDone!")

if __name__ == "__main__":
    main()
