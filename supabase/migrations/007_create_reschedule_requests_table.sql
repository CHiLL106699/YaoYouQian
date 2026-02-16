CREATE TABLE IF NOT EXISTS public.reschedule_requests (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id uuid NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
    appointment_id uuid NOT NULL REFERENCES public.appointments(id) ON DELETE CASCADE,
    new_datetime timestamptz NOT NULL,
    reason text NOT NULL,
    status text NOT NULL DEFAULT 'pending',
    created_at timestamptz DEFAULT now() NOT NULL,
    updated_at timestamptz DEFAULT now() NOT NULL
);

-- 建立索引
CREATE INDEX IF NOT EXISTS idx_reschedule_requests_tenant_id ON public.reschedule_requests(tenant_id);
CREATE INDEX IF NOT EXISTS idx_reschedule_requests_status ON public.reschedule_requests(status);
CREATE INDEX IF NOT EXISTS idx_reschedule_requests_new_datetime ON public.reschedule_requests(new_datetime);

-- 啟用 RLS
ALTER TABLE public.reschedule_requests ENABLE ROW LEVEL SECURITY;

-- RLS 策略：租戶只能看到自己的改期申請
DROP POLICY IF EXISTS "Tenants can view their own reschedule requests." ON public.reschedule_requests;
CREATE POLICY "Tenants can view their own reschedule requests." ON public.reschedule_requests
  FOR SELECT USING (tenant_id = auth.uid());

-- RLS 策略：租戶可以建立自己的改期申請
DROP POLICY IF EXISTS "Tenants can insert their own reschedule requests." ON public.reschedule_requests;
CREATE POLICY "Tenants can insert their own reschedule requests." ON public.reschedule_requests
  FOR INSERT WITH CHECK (tenant_id = auth.uid());

-- RLS 策略：租戶可以更新自己的改期申請
DROP POLICY IF EXISTS "Tenants can update their own reschedule requests." ON public.reschedule_requests;
CREATE POLICY "Tenants can update their own reschedule requests." ON public.reschedule_requests
  FOR UPDATE USING (tenant_id = auth.uid()) WITH CHECK (tenant_id = auth.uid());

-- RLS 策略：管理員可以查看所有改期申請 (假設 auth.role() 可以判斷管理員)
-- DROP POLICY IF EXISTS "Admins can view all reschedule requests." ON public.reschedule_requests;
-- CREATE POLICY "Admins can view all reschedule requests." ON public.reschedule_requests
--   FOR SELECT USING (auth.role() = 'admin');

-- 建立 updated_at 自動更新觸發器
CREATE OR REPLACE FUNCTION public.set_updated_at() RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS set_reschedule_requests_updated_at ON public.reschedule_requests;
CREATE TRIGGER set_reschedule_requests_updated_at
BEFORE UPDATE ON public.reschedule_requests
FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
