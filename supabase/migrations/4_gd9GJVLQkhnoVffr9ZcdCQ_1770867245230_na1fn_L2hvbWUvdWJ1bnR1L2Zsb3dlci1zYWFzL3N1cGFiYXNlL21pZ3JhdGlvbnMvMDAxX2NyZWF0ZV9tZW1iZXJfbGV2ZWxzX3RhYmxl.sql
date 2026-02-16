-- CreateTable
CREATE TABLE public.member_levels (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id uuid NOT NULL,
    name text NOT NULL,
    description text,
    min_spend numeric(10, 2) NOT NULL DEFAULT 0.00,
    max_spend numeric(10, 2) NOT NULL DEFAULT 99999999.99,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);

-- AddForeignKey
ALTER TABLE public.member_levels ADD CONSTRAINT member_levels_tenant_id_fkey FOREIGN KEY (tenant_id) REFERENCES public.tenants(id) ON DELETE CASCADE;

-- CreateIndex
CREATE INDEX member_levels_tenant_id_idx ON public.member_levels (tenant_id);
CREATE UNIQUE INDEX member_levels_tenant_id_name_idx ON public.member_levels (tenant_id, name);

-- Enable RLS
ALTER TABLE public.member_levels ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Tenants can view their member levels." ON public.member_levels FOR SELECT USING (auth.uid() IS NOT NULL AND tenant_id IN ( SELECT tenants.id FROM public.tenants WHERE tenants.owner_id = auth.uid() ));
CREATE POLICY "Tenants can insert their member levels." ON public.member_levels FOR INSERT WITH CHECK (auth.uid() IS NOT NULL AND tenant_id IN ( SELECT tenants.id FROM public.tenants WHERE tenants.owner_id = auth.uid() ));
CREATE POLICY "Tenants can update their member levels." ON public.member_levels FOR UPDATE USING (auth.uid() IS NOT NULL AND tenant_id IN ( SELECT tenants.id FROM public.tenants WHERE tenants.owner_id = auth.uid() )) WITH CHECK (auth.uid() IS NOT NULL AND tenant_id IN ( SELECT tenants.id FROM public.tenants WHERE tenants.owner_id = auth.uid() ));
CREATE POLICY "Tenants can delete their member levels." ON public.member_levels FOR DELETE USING (auth.uid() IS NOT NULL AND tenant_id IN ( SELECT tenants.id FROM public.tenants WHERE tenants.owner_id = auth.uid() ));
