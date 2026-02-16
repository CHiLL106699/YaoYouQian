CREATE TABLE IF NOT EXISTS public.subscription_payments (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id uuid NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
    amount numeric(10, 2) NOT NULL,
    currency text NOT NULL DEFAULT 'TWD',
    line_pay_transaction_id text UNIQUE,
    status text NOT NULL DEFAULT 'pending',
    payment_time timestamptz,
    created_at timestamptz DEFAULT now() NOT NULL,
    updated_at timestamptz DEFAULT now() NOT NULL
);

-- 建立索引
CREATE INDEX IF NOT EXISTS idx_subscription_payments_tenant_id ON public.subscription_payments (tenant_id);
CREATE INDEX IF NOT EXISTS idx_subscription_payments_status ON public.subscription_payments (status);
CREATE INDEX IF NOT EXISTS idx_subscription_payments_payment_time ON public.subscription_payments (payment_time);

-- 啟用 RLS
ALTER TABLE public.subscription_payments ENABLE ROW LEVEL SECURITY;

-- 建立 RLS 策略
DROP POLICY IF EXISTS "Tenants can view their own subscription payments." ON public.subscription_payments;
CREATE POLICY "Tenants can view their own subscription payments." ON public.subscription_payments
  FOR SELECT USING (tenant_id = auth.uid());

DROP POLICY IF EXISTS "Tenants can insert their own subscription payments." ON public.subscription_payments;
CREATE POLICY "Tenants can insert their own subscription payments." ON public.subscription_payments
  FOR INSERT WITH CHECK (tenant_id = auth.uid());

DROP POLICY IF EXISTS "Tenants can update their own subscription payments." ON public.subscription_payments;
CREATE POLICY "Tenants can update their own subscription payments." ON public.subscription_payments
  FOR UPDATE USING (tenant_id = auth.uid());

DROP POLICY IF EXISTS "Tenants can delete their own subscription payments." ON public.subscription_payments;
CREATE POLICY "Tenants can delete their own subscription payments." ON public.subscription_payments
  FOR DELETE USING (tenant_id = auth.uid());

-- 建立 updated_at 自動更新觸發器
CREATE OR REPLACE FUNCTION public.set_updated_at() RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS set_updated_at ON public.subscription_payments;
CREATE TRIGGER set_updated_at
BEFORE UPDATE ON public.subscription_payments
FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
