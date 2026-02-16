-- Create error_logs table
CREATE TABLE public.error_logs (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id uuid NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
    level text NOT NULL,
    message text NOT NULL,
    stack_trace text,
    metadata jsonb,
    created_at timestamptz DEFAULT now()
);

-- Add indexes
CREATE INDEX idx_error_logs_tenant_id ON public.error_logs (tenant_id);
CREATE INDEX idx_error_logs_created_at ON public.error_logs (created_at DESC);
CREATE INDEX idx_error_logs_level ON public.error_logs (level);

-- Enable Row Level Security
ALTER TABLE public.error_logs ENABLE ROW LEVEL SECURITY;

-- Policy for authenticated users to insert their own error logs
-- This policy assumes that the 'tenants' table has an 'owner_id' column of type UUID
-- which stores the auth.uid() of the tenant owner.
CREATE POLICY "Authenticated users can insert their own error logs" ON public.error_logs
FOR INSERT WITH CHECK (auth.uid() IS NOT NULL AND tenant_id IN (SELECT id FROM public.tenants WHERE auth.uid() = owner_id));

-- Policy for users to view their own error logs
-- This policy assumes that the 'tenants' table has an 'owner_id' column of type UUID
-- which stores the auth.uid() of the tenant owner.
CREATE POLICY "Users can view their own error logs" ON public.error_logs
FOR SELECT USING (auth.uid() IS NOT NULL AND tenant_id IN (SELECT id FROM public.tenants WHERE auth.uid() = owner_id));

-- Policy for admin role to view all error logs (assuming 'admin' role exists in auth.role())
CREATE POLICY "Admins can view all error logs" ON public.error_logs
FOR SELECT TO authenticated USING (auth.role() = 'admin');
