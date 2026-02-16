-- 005_create_appointments_table.sql

-- 建立 appointments 資料表
CREATE TABLE IF NOT EXISTS public.appointments (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id uuid NOT NULL,
    customer_id uuid NOT NULL,
    appointment_datetime timestamptz NOT NULL,
    service_type text NOT NULL,
    status text NOT NULL DEFAULT 'pending',
    notes text,
    created_at timestamptz DEFAULT now() NOT NULL,
    updated_at timestamptz DEFAULT now() NOT NULL,
    
    -- 外鍵關聯
    CONSTRAINT fk_tenant
        FOREIGN KEY(tenant_id)
        REFERENCES public.tenants(id)
        ON DELETE CASCADE,
    CONSTRAINT fk_customer
        FOREIGN KEY(customer_id)
        REFERENCES public.customers(id)
        ON DELETE CASCADE
);

-- 建立索引
CREATE INDEX IF NOT EXISTS idx_appointments_tenant_id ON public.appointments (tenant_id);
CREATE INDEX IF NOT EXISTS idx_appointments_status ON public.appointments (status);
CREATE INDEX IF NOT EXISTS idx_appointments_appointment_datetime ON public.appointments (appointment_datetime);

-- 啟用 Row Level Security (RLS)
ALTER TABLE public.appointments ENABLE ROW LEVEL SECURITY;

-- 建立 RLS 策略
-- 允許租戶讀取自己的預約資料
CREATE POLICY "Tenants can view their own appointments." ON public.appointments
    FOR SELECT USING (tenant_id = (current_setting('app.tenant_id')::uuid));

-- 允許租戶新增自己的預約資料
CREATE POLICY "Tenants can insert their own appointments." ON public.appointments
    FOR INSERT WITH CHECK (tenant_id = (current_setting('app.tenant_id')::uuid));

-- 允許租戶更新自己的預約資料
CREATE POLICY "Tenants can update their own appointments." ON public.appointments
    FOR UPDATE USING (tenant_id = (current_setting('app.tenant_id')::uuid));

-- 允許租戶刪除自己的預約資料
CREATE POLICY "Tenants can delete their own appointments." ON public.appointments
    FOR DELETE USING (tenant_id = (current_setting('app.tenant_id')::uuid));

-- 建立 updated_at 自動更新觸發器函數
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 建立 updated_at 自動更新觸發器
CREATE TRIGGER set_updated_at_appointments
BEFORE UPDATE ON public.appointments
FOR EACH ROW
EXECUTE FUNCTION public.set_updated_at();
