-- Create aftercare_records table
CREATE TABLE public.aftercare_records (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    tenant_id uuid NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
    record_date date NOT NULL,
    notes text,
    created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL
);

-- Create indexes
CREATE INDEX idx_aftercare_records_tenant_id ON public.aftercare_records (tenant_id);
CREATE INDEX idx_aftercare_records_record_date ON public.aftercare_records (record_date);

-- Enable Row Level Security
ALTER TABLE public.aftercare_records ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY select_aftercare_records ON public.aftercare_records FOR SELECT TO authenticated USING (
    auth.uid() IN (SELECT user_id FROM public.tenant_members WHERE tenant_id = aftercare_records.tenant_id)
);

CREATE POLICY insert_aftercare_records ON public.aftercare_records FOR INSERT TO authenticated WITH CHECK (
    auth.uid() IN (SELECT user_id FROM public.tenant_members WHERE tenant_id = aftercare_records.tenant_id)
);

CREATE POLICY update_aftercare_records ON public.aftercare_records FOR UPDATE TO authenticated USING (
    auth.uid() IN (SELECT user_id FROM public.tenant_members WHERE tenant_id = aftercare_records.tenant_id)
) WITH CHECK (
    auth.uid() IN (SELECT user_id FROM public.tenant_members WHERE tenant_id = aftercare_records.tenant_id)
);

CREATE POLICY delete_aftercare_records ON public.aftercare_records FOR DELETE TO authenticated USING (
    auth.uid() IN (SELECT user_id FROM public.tenant_members WHERE tenant_id = aftercare_records.tenant_id)
);

-- Grant permissions to authenticated role
GRANT ALL ON public.aftercare_records TO authenticated;
