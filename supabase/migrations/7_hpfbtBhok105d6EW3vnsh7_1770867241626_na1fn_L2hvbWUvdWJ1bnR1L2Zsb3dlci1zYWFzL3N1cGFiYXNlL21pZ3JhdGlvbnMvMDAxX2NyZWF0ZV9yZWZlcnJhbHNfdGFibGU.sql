-- CreateTable
CREATE TABLE public.referrals (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id uuid NOT NULL,
    referrer_id uuid,
    referred_id uuid,
    status text NOT NULL DEFAULT 'pending',
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);

-- AddForeignKey
ALTER TABLE public.referrals ADD CONSTRAINT fk_tenant
    FOREIGN KEY (tenant_id) REFERENCES public.tenants(id)
    ON DELETE CASCADE;

-- CreateIndex
CREATE INDEX referrals_tenant_id_idx ON public.referrals (tenant_id);
CREATE INDEX referrals_referrer_id_idx ON public.referrals (referrer_id);
CREATE INDEX referrals_referred_id_idx ON public.referrals (referred_id);

-- Enable RLS
ALTER TABLE public.referrals ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Tenants can view their own referrals." ON public.referrals
  FOR SELECT USING (tenant_id = auth.uid());

CREATE POLICY "Tenants can insert their own referrals." ON public.referrals
  FOR INSERT WITH CHECK (tenant_id = auth.uid());

CREATE POLICY "Tenants can update their own referrals." ON public.referrals
  FOR UPDATE USING (tenant_id = auth.uid());

CREATE POLICY "Tenants can delete their own referrals." ON public.referrals
  FOR DELETE USING (tenant_id = auth.uid());
