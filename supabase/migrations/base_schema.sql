-- ============================================
-- Flower SaaS 基礎 Schema Migration
-- 建立所有核心資料表
-- ============================================

-- 1. Customers Table (客戶資料表)
CREATE TABLE IF NOT EXISTS public.customers (
    id BIGSERIAL PRIMARY KEY,
    tenant_id BIGINT NOT NULL REFERENCES public.tenants(id),
    line_user_id TEXT,
    name TEXT NOT NULL,
    phone TEXT,
    email TEXT,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_customers_tenant_id ON public.customers(tenant_id);
CREATE INDEX IF NOT EXISTS idx_customers_line_user_id ON public.customers(line_user_id);

-- 2. Services Table (服務項目資料表)
CREATE TABLE IF NOT EXISTS public.services (
    id BIGSERIAL PRIMARY KEY,
    tenant_id BIGINT NOT NULL REFERENCES public.tenants(id),
    name TEXT NOT NULL,
    description TEXT,
    duration_minutes INTEGER NOT NULL DEFAULT 60,
    price DECIMAL(10, 2),
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_services_tenant_id ON public.services(tenant_id);
CREATE INDEX IF NOT EXISTS idx_services_is_active ON public.services(is_active);

-- 3. Appointments Table (預約資料表)
CREATE TABLE IF NOT EXISTS public.appointments (
    id BIGSERIAL PRIMARY KEY,
    tenant_id BIGINT NOT NULL REFERENCES public.tenants(id),
    customer_id BIGINT NOT NULL REFERENCES public.customers(id),
    service_id BIGINT REFERENCES public.services(id),
    appointment_time TIMESTAMP WITH TIME ZONE NOT NULL,
    duration_minutes INTEGER NOT NULL DEFAULT 60,
    status TEXT NOT NULL DEFAULT 'pending',
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_appointments_tenant_id ON public.appointments(tenant_id);
CREATE INDEX IF NOT EXISTS idx_appointments_customer_id ON public.appointments(customer_id);
CREATE INDEX IF NOT EXISTS idx_appointments_appointment_time ON public.appointments(appointment_time);
CREATE INDEX IF NOT EXISTS idx_appointments_status ON public.appointments(status);

-- 4. Time Slots Table (時段資料表)
CREATE TABLE IF NOT EXISTS public.time_slots (
    id BIGSERIAL PRIMARY KEY,
    tenant_id BIGINT NOT NULL REFERENCES public.tenants(id),
    start_time TIMESTAMP WITH TIME ZONE NOT NULL,
    end_time TIMESTAMP WITH TIME ZONE NOT NULL,
    is_available BOOLEAN NOT NULL DEFAULT true,
    max_bookings INTEGER NOT NULL DEFAULT 1,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_time_slots_tenant_id ON public.time_slots(tenant_id);
CREATE INDEX IF NOT EXISTS idx_time_slots_start_time ON public.time_slots(start_time);
CREATE INDEX IF NOT EXISTS idx_time_slots_is_available ON public.time_slots(is_available);

-- 5. Reschedule Requests Table (改期申請資料表)
CREATE TABLE IF NOT EXISTS public.reschedule_requests (
    id BIGSERIAL PRIMARY KEY,
    tenant_id BIGINT NOT NULL REFERENCES public.tenants(id),
    appointment_id BIGINT NOT NULL REFERENCES public.appointments(id),
    customer_id BIGINT NOT NULL REFERENCES public.customers(id),
    original_time TIMESTAMP WITH TIME ZONE NOT NULL,
    requested_time TIMESTAMP WITH TIME ZONE NOT NULL,
    reason TEXT,
    status TEXT NOT NULL DEFAULT 'pending',
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_reschedule_requests_tenant_id ON public.reschedule_requests(tenant_id);
CREATE INDEX IF NOT EXISTS idx_reschedule_requests_appointment_id ON public.reschedule_requests(appointment_id);
CREATE INDEX IF NOT EXISTS idx_reschedule_requests_status ON public.reschedule_requests(status);

-- 6. White Label Settings Table (白標設定資料表)
CREATE TABLE IF NOT EXISTS public.white_label_settings (
    id BIGSERIAL PRIMARY KEY,
    tenant_id BIGINT NOT NULL REFERENCES public.tenants(id) UNIQUE,
    brand_name TEXT,
    logo_url TEXT,
    primary_color TEXT,
    theme_mode TEXT DEFAULT 'light',
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_white_label_settings_tenant_id ON public.white_label_settings(tenant_id);

-- ============================================
-- Migration 完成
-- ============================================
