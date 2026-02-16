CREATE TABLE IF NOT EXISTS public.tenant_subscriptions (
    id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id uuid NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
    status text NOT NULL,
    line_pay_reg_key text,
    billing_cycle text NOT NULL,
    trial_end_date timestamptz,
    created_at timestamptz DEFAULT now() NOT NULL,
    updated_at timestamptz DEFAULT now() NOT NULL
);

-- 建立索引
CREATE INDEX IF NOT EXISTS idx_tenant_subscriptions_tenant_id ON public.tenant_subscriptions (tenant_id);
CREATE INDEX IF NOT EXISTS idx_tenant_subscriptions_status ON public.tenant_subscriptions (status);
CREATE INDEX IF NOT EXISTS idx_tenant_subscriptions_trial_end_date ON public.tenant_subscriptions (trial_end_date);

-- 啟用 RLS
ALTER TABLE public.tenant_subscriptions ENABLE ROW LEVEL SECURITY;

-- RLS 策略：所有使用者只能查看自己的訂閱資訊
DROP POLICY IF EXISTS "Tenants can view their own subscriptions." ON public.tenant_subscriptions;
CREATE POLICY "Tenants can view their own subscriptions." ON public.tenant_subscriptions
    FOR SELECT USING (auth.uid() = tenant_id);

-- RLS 策略：租戶可以新增自己的訂閱資訊
DROP POLICY IF EXISTS "Tenants can insert their own subscriptions." ON public.tenant_subscriptions;
CREATE POLICY "Tenants can insert their own subscriptions." ON public.tenant_subscriptions
    FOR INSERT WITH CHECK (auth.uid() = tenant_id);

-- RLS 策略：租戶可以更新自己的訂閱資訊
DROP POLICY IF EXISTS "Tenants can update their own subscriptions." ON public.tenant_subscriptions;
CREATE POLICY "Tenants can update their own subscriptions." ON public.tenant_subscriptions
    FOR UPDATE USING (auth.uid() = tenant_id) WITH CHECK (auth.uid() = tenant_id);

-- RLS 策略：管理員可以查看所有訂閱資訊 (假設 auth.role() = 'admin')
DROP POLICY IF EXISTS "Admins can view all subscriptions." ON public.tenant_subscriptions;
CREATE POLICY "Admins can view all subscriptions." ON public.tenant_subscriptions
    FOR SELECT TO service_role USING (true);

-- 建立 updated_at 自動更新觸發器
CREATE OR REPLACE FUNCTION public.set_updated_at() RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS set_tenant_subscriptions_updated_at ON public.tenant_subscriptions;
CREATE TRIGGER set_tenant_subscriptions_updated_at
BEFORE UPDATE ON public.tenant_subscriptions
FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
