CREATE TABLE IF NOT EXISTS public.booking_slot_limits (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id uuid NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
    date date NOT NULL,
    time_slot text NOT NULL,
    max_bookings integer NOT NULL DEFAULT 0,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);

-- 建立索引
CREATE INDEX IF NOT EXISTS idx_booking_slot_limits_tenant_id ON public.booking_slot_limits (tenant_id);
CREATE INDEX IF NOT EXISTS idx_booking_slot_limits_date ON public.booking_slot_limits (date);
CREATE INDEX IF NOT EXISTS idx_booking_slot_limits_time_slot ON public.booking_slot_limits (time_slot);
CREATE UNIQUE INDEX IF NOT EXISTS idx_booking_slot_limits_unique_constraint ON public.booking_slot_limits (tenant_id, date, time_slot);

-- 啟用 RLS
ALTER TABLE public.booking_slot_limits ENABLE ROW LEVEL SECURITY;

-- 建立 RLS 策略
DROP POLICY IF EXISTS "Tenants can view their own booking slot limits." ON public.booking_slot_limits;
CREATE POLICY "Tenants can view their own booking slot limits." ON public.booking_slot_limits
  FOR SELECT USING (tenant_id = auth.uid());

DROP POLICY IF EXISTS "Tenants can insert their own booking slot limits." ON public.booking_slot_limits;
CREATE POLICY "Tenants can insert their own booking slot limits." ON public.booking_slot_limits
  FOR INSERT WITH CHECK (tenant_id = auth.uid());

DROP POLICY IF EXISTS "Tenants can update their own booking slot limits." ON public.booking_slot_limits;
CREATE POLICY "Tenants can update their own booking slot limits." ON public.booking_slot_limits
  FOR UPDATE USING (tenant_id = auth.uid());

DROP POLICY IF EXISTS "Tenants can delete their own booking slot limits." ON public.booking_slot_limits;
CREATE POLICY "Tenants can delete their own booking slot limits." ON public.booking_slot_limits
  FOR DELETE USING (tenant_id = auth.uid());

-- 建立 updated_at 自動更新觸發器
CREATE OR REPLACE FUNCTION public.set_updated_at() RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS set_updated_at_on_booking_slot_limits ON public.booking_slot_limits;
CREATE TRIGGER set_updated_at_on_booking_slot_limits
BEFORE UPDATE ON public.booking_slot_limits
FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
