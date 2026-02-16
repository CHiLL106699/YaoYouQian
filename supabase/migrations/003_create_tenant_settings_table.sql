CREATE TABLE IF NOT EXISTS public.tenant_settings (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id uuid NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
    logo_url text,
    primary_brand_color text,
    secondary_brand_color text,
    company_name text,
    contact_info jsonb,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);

-- 索引
CREATE INDEX IF NOT EXISTS tenant_settings_tenant_id_idx ON public.tenant_settings (tenant_id);

-- RLS 啟用
ALTER TABLE public.tenant_settings ENABLE ROW LEVEL SECURITY;

-- RLS 策略
DROP POLICY IF EXISTS "Tenants can view their own tenant_settings." ON public.tenant_settings;
CREATE POLICY "Tenants can view their own tenant_settings." ON public.tenant_settings
  FOR SELECT USING (auth.uid() = (SELECT id FROM public.tenants WHERE id = tenant_id));

DROP POLICY IF EXISTS "Tenants can insert their own tenant_settings." ON public.tenant_settings;
CREATE POLICY "Tenants can insert their own tenant_settings." ON public.tenant_settings
  FOR INSERT WITH CHECK (auth.uid() = (SELECT id FROM public.tenants WHERE id = tenant_id));

DROP POLICY IF EXISTS "Tenants can update their own tenant_settings." ON public.tenant_settings;
CREATE POLICY "Tenants can update their own tenant_settings." ON public.tenant_settings
  FOR UPDATE USING (auth.uid() = (SELECT id FROM public.tenants WHERE id = tenant_id));

DROP POLICY IF EXISTS "Tenants can delete their own tenant_settings." ON public.tenant_settings;
CREATE POLICY "Tenants can delete their own tenant_settings." ON public.tenant_settings
  FOR DELETE USING (auth.uid() = (SELECT id FROM public.tenants WHERE id = tenant_id));

-- 自動更新觸發器
CREATE OR REPLACE FUNCTION public.set_updated_at() RETURNS TRIGGER AS 1586
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
1586 LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS set_tenant_settings_updated_at ON public.tenant_settings;
CREATE TRIGGER set_tenant_settings_updated_at
BEFORE UPDATE ON public.tenant_settings
FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
