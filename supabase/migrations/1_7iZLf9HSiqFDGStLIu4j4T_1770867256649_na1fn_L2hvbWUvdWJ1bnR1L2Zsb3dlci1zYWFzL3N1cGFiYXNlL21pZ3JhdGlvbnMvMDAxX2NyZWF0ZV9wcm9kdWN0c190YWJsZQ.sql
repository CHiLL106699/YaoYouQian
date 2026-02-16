-- CreateTable
CREATE TABLE products (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    name TEXT NOT NULL,
    description TEXT,
    price NUMERIC NOT NULL,
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE
);

-- CreateIndex
CREATE INDEX products_tenant_id_idx ON products(tenant_id);

-- Enable RLS
ALTER TABLE products ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Tenants can view their own products." ON products
  FOR SELECT USING (tenant_id = auth.jwt() ->> 'tenant_id');

CREATE POLICY "Tenants can insert their own products." ON products
  FOR INSERT WITH CHECK (tenant_id = auth.jwt() ->> 'tenant_id');

CREATE POLICY "Tenants can update their own products." ON products
  FOR UPDATE USING (tenant_id = auth.jwt() ->> 'tenant_id');

CREATE POLICY "Tenants can delete their own products." ON products
  FOR DELETE USING (tenant_id = auth.jwt() ->> 'tenant_id');

-- Allow service_role to bypass RLS (optional, but good for admin tasks)
CREATE POLICY "Service role can bypass RLS." ON products
  FOR ALL USING (current_user = 'supabase_admin');
