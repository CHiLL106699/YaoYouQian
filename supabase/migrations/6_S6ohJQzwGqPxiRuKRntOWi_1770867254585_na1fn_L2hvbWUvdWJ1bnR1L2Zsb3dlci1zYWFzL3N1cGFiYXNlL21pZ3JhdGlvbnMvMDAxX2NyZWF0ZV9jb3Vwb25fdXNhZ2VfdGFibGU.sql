-- CreateTable
CREATE TABLE IF NOT EXISTS public.coupon_usage (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
    coupon_id UUID NOT NULL,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    used_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- CreateIndex
CREATE INDEX IF NOT EXISTS coupon_usage_tenant_id_idx ON public.coupon_usage (tenant_id);
CREATE INDEX IF NOT EXISTS coupon_usage_coupon_id_idx ON public.coupon_usage (coupon_id);
CREATE INDEX IF NOT EXISTS coupon_usage_user_id_idx ON public.coupon_usage (user_id);

-- Enable RLS
ALTER TABLE public.coupon_usage ENABLE ROW LEVEL SECURITY;

-- Policies
-- Allow authenticated users to view their own tenant's coupon usage
CREATE POLICY "Tenants can view their coupon usage" ON public.coupon_usage
FOR SELECT
TO authenticated
USING (tenant_id = (SELECT tenant_id FROM public.profiles WHERE id = auth.uid()));

-- Allow authenticated users to insert coupon usage for their own tenant
CREATE POLICY "Tenants can insert their coupon usage" ON public.coupon_usage
FOR INSERT
TO authenticated
WITH CHECK (tenant_id = (SELECT tenant_id FROM public.profiles WHERE id = auth.uid()));

-- Allow authenticated users to update coupon usage for their own tenant
CREATE POLICY "Tenants can update their coupon usage" ON public.coupon_usage
FOR UPDATE
TO authenticated
USING (tenant_id = (SELECT tenant_id FROM public.profiles WHERE id = auth.uid()))
WITH CHECK (tenant_id = (SELECT tenant_id FROM public.profiles WHERE id = auth.uid()));

-- Allow authenticated users to delete coupon usage for their own tenant
CREATE POLICY "Tenants can delete their coupon usage" ON public.coupon_usage
FOR DELETE
TO authenticated
USING (tenant_id = (SELECT tenant_id FROM public.profiles WHERE id = auth.uid()));

-- For admin roles (assuming a 'service_role' or similar can bypass RLS)
-- This policy is an example and might need adjustment based on actual role management.
-- For simplicity, we'll assume a 'service_role' can bypass RLS for now.
-- In a real scenario, you might have a more granular admin role check.
-- CREATE POLICY "Admins can manage all coupon usage" ON public.coupon_usage
-- FOR ALL
-- TO service_role
-- USING (TRUE) WITH CHECK (TRUE);
