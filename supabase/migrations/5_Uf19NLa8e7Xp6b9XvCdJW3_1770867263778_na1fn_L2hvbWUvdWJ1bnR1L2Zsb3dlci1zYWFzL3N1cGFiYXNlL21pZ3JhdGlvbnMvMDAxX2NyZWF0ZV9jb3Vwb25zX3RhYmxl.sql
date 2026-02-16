-- Create coupons table
CREATE TABLE public.coupons (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id uuid NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
    code text NOT NULL UNIQUE,
    type text NOT NULL,
    value numeric(10, 2) NOT NULL,
    min_purchase_amount numeric(10, 2) DEFAULT 0.00,
    usage_limit integer DEFAULT 1,
    used_count integer DEFAULT 0,
    expires_at timestamp with time zone,
    is_active boolean DEFAULT TRUE,
    created_at timestamp with time zone NOT NULL DEFAULT now(),
    updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Add indexes
CREATE INDEX coupons_tenant_id_idx ON public.coupons (tenant_id);
CREATE INDEX coupons_code_idx ON public.coupons (code);

-- Enable Row Level Security
ALTER TABLE public.coupons ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Tenants can view their own coupons" ON public.coupons
FOR SELECT USING (auth.uid() IN (SELECT id FROM public.tenants WHERE id = tenant_id));

CREATE POLICY "Tenants can create their own coupons" ON public.coupons
FOR INSERT WITH CHECK (auth.uid() IN (SELECT id FROM public.tenants WHERE id = tenant_id));

CREATE POLICY "Tenants can update their own coupons" ON public.coupons
FOR UPDATE USING (auth.uid() IN (SELECT id FROM public.tenants WHERE id = tenant_id))
WITH CHECK (auth.uid() IN (SELECT id FROM public.tenants WHERE id = tenant_id));

CREATE POLICY "Tenants can delete their own coupons" ON public.coupons
FOR DELETE USING (auth.uid() IN (SELECT id FROM public.tenants WHERE id = tenant_id));

-- Optional: Add trigger to update `updated_at` column automatically
CREATE TRIGGER handle_updated_at BEFORE UPDATE ON public.coupons
FOR EACH ROW EXECUTE FUNCTION moddatetime('updated_at');

-- Rollback section (for development/testing)
-- DROP TRIGGER IF EXISTS handle_updated_at ON public.coupons;
-- DROP POLICY IF EXISTS "Tenants can delete their own coupons" ON public.coupons;
-- DROP POLICY IF EXISTS "Tenants can update their own coupons" ON public.coupons;
-- DROP POLICY IF EXISTS "Tenants can create their own coupons" ON public.coupons;
-- DROP POLICY IF EXISTS "Tenants can view their own coupons" ON public.coupons;
-- ALTER TABLE public.coupons DISABLE ROW LEVEL SECURITY;
-- DROP INDEX IF EXISTS coupons_code_idx;
-- DROP INDEX IF EXISTS coupons_tenant_id_idx;
-- DROP TABLE IF EXISTS public.coupons;
