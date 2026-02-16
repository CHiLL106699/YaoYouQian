CREATE TABLE IF NOT EXISTS customers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    line_user_id TEXT UNIQUE,
    name TEXT NOT NULL,
    phone TEXT,
    birthday DATE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_customers_tenant_id ON customers(tenant_id);
CREATE INDEX IF NOT EXISTS idx_customers_line_user_id ON customers(line_user_id);

ALTER TABLE customers ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Tenants can view their own customers." ON customers;
CREATE POLICY "Tenants can view their own customers." ON customers FOR SELECT USING (tenant_id = auth.jwt() ->> 'tenant_id')::uuid;

DROP POLICY IF EXISTS "Tenants can insert their own customers." ON customers;
CREATE POLICY "Tenants can insert their own customers." ON customers FOR INSERT WITH CHECK (tenant_id = auth.jwt() ->> 'tenant_id')::uuid;

DROP POLICY IF EXISTS "Tenants can update their own customers." ON customers;
CREATE POLICY "Tenants can update their own customers." ON customers FOR UPDATE USING (tenant_id = auth.jwt() ->> 'tenant_id')::uuid WITH CHECK (tenant_id = auth.jwt() ->> 'tenant_id')::uuid;

DROP POLICY IF EXISTS "Tenants can delete their own customers." ON customers;
CREATE POLICY "Tenants can delete their own customers." ON customers FOR DELETE USING (tenant_id = auth.jwt() ->> 'tenant_id')::uuid;

CREATE OR REPLACE FUNCTION update_updated_at_column() RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

DROP TRIGGER IF EXISTS update_customers_updated_at ON customers;
CREATE TRIGGER update_customers_updated_at BEFORE UPDATE ON customers FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
