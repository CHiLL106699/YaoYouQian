-- ============================================
-- Flower SaaS 新增功能 Migration 腳本合併版
-- 請在 Supabase SQL Editor 中執行此腳本
-- ============================================

-- 1. Weight Tracking Table
CREATE TABLE IF NOT EXISTS public.weight_tracking (
    id BIGSERIAL PRIMARY KEY,
    tenant_id BIGINT NOT NULL REFERENCES public.tenants(id),
    customer_id BIGINT NOT NULL REFERENCES public.customers(id),
    weight DECIMAL(5, 2) NOT NULL,
    unit TEXT NOT NULL DEFAULT 'kg',
    recorded_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_weight_tracking_tenant_id ON public.weight_tracking(tenant_id);
CREATE INDEX IF NOT EXISTS idx_weight_tracking_customer_id ON public.weight_tracking(customer_id);
CREATE INDEX IF NOT EXISTS idx_weight_tracking_recorded_at ON public.weight_tracking(recorded_at);

ALTER TABLE public.weight_tracking ENABLE ROW LEVEL SECURITY;

-- 2. Products Table
CREATE TABLE IF NOT EXISTS public.products (
    id BIGSERIAL PRIMARY KEY,
    tenant_id BIGINT NOT NULL REFERENCES public.tenants(id),
    name TEXT NOT NULL,
    description TEXT,
    price DECIMAL(10, 2) NOT NULL,
    stock_quantity INTEGER NOT NULL DEFAULT 0,
    category TEXT,
    image_url TEXT,
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_products_tenant_id ON public.products(tenant_id);
CREATE INDEX IF NOT EXISTS idx_products_category ON public.products(category);
CREATE INDEX IF NOT EXISTS idx_products_is_active ON public.products(is_active);

ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;

-- 3. Shop Orders Table
CREATE TABLE IF NOT EXISTS public.shop_orders (
    id BIGSERIAL PRIMARY KEY,
    tenant_id BIGINT NOT NULL REFERENCES public.tenants(id),
    customer_id BIGINT NOT NULL REFERENCES public.customers(id),
    total_amount DECIMAL(10, 2) NOT NULL,
    status TEXT NOT NULL DEFAULT 'pending',
    payment_method TEXT,
    payment_status TEXT NOT NULL DEFAULT 'unpaid',
    shipping_address TEXT,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_shop_orders_tenant_id ON public.shop_orders(tenant_id);
CREATE INDEX IF NOT EXISTS idx_shop_orders_customer_id ON public.shop_orders(customer_id);
CREATE INDEX IF NOT EXISTS idx_shop_orders_status ON public.shop_orders(status);

ALTER TABLE public.shop_orders ENABLE ROW LEVEL SECURITY;

-- 4. Aftercare Records Table
CREATE TABLE IF NOT EXISTS public.aftercare_records (
    id BIGSERIAL PRIMARY KEY,
    tenant_id BIGINT NOT NULL REFERENCES public.tenants(id),
    customer_id BIGINT NOT NULL REFERENCES public.customers(id),
    appointment_id BIGINT REFERENCES public.appointments(id),
    care_date TIMESTAMP WITH TIME ZONE NOT NULL,
    care_type TEXT NOT NULL,
    notes TEXT,
    follow_up_required BOOLEAN NOT NULL DEFAULT false,
    next_follow_up_date TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_aftercare_records_tenant_id ON public.aftercare_records(tenant_id);
CREATE INDEX IF NOT EXISTS idx_aftercare_records_customer_id ON public.aftercare_records(customer_id);
CREATE INDEX IF NOT EXISTS idx_aftercare_records_care_date ON public.aftercare_records(care_date);

ALTER TABLE public.aftercare_records ENABLE ROW LEVEL SECURITY;

-- 5. Member Levels Table
CREATE TABLE IF NOT EXISTS public.member_levels (
    id BIGSERIAL PRIMARY KEY,
    tenant_id BIGINT NOT NULL REFERENCES public.tenants(id),
    level_name TEXT NOT NULL,
    min_points INTEGER NOT NULL DEFAULT 0,
    discount_percentage DECIMAL(5, 2) NOT NULL DEFAULT 0,
    benefits TEXT,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_member_levels_tenant_id ON public.member_levels(tenant_id);

ALTER TABLE public.member_levels ENABLE ROW LEVEL SECURITY;

-- 6. Coupons Table
CREATE TABLE IF NOT EXISTS public.coupons (
    id BIGSERIAL PRIMARY KEY,
    tenant_id BIGINT NOT NULL REFERENCES public.tenants(id),
    code TEXT NOT NULL UNIQUE,
    discount_type TEXT NOT NULL,
    discount_value DECIMAL(10, 2) NOT NULL,
    min_purchase_amount DECIMAL(10, 2),
    max_discount_amount DECIMAL(10, 2),
    valid_from TIMESTAMP WITH TIME ZONE NOT NULL,
    valid_until TIMESTAMP WITH TIME ZONE NOT NULL,
    usage_limit INTEGER,
    usage_count INTEGER NOT NULL DEFAULT 0,
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_coupons_tenant_id ON public.coupons(tenant_id);
CREATE INDEX IF NOT EXISTS idx_coupons_code ON public.coupons(code);
CREATE INDEX IF NOT EXISTS idx_coupons_is_active ON public.coupons(is_active);

ALTER TABLE public.coupons ENABLE ROW LEVEL SECURITY;

-- 7. Coupon Usage Table
CREATE TABLE IF NOT EXISTS public.coupon_usage (
    id BIGSERIAL PRIMARY KEY,
    tenant_id BIGINT NOT NULL REFERENCES public.tenants(id),
    coupon_id BIGINT NOT NULL REFERENCES public.coupons(id),
    customer_id BIGINT NOT NULL REFERENCES public.customers(id),
    order_id BIGINT,
    used_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_coupon_usage_tenant_id ON public.coupon_usage(tenant_id);
CREATE INDEX IF NOT EXISTS idx_coupon_usage_coupon_id ON public.coupon_usage(coupon_id);
CREATE INDEX IF NOT EXISTS idx_coupon_usage_customer_id ON public.coupon_usage(customer_id);

ALTER TABLE public.coupon_usage ENABLE ROW LEVEL SECURITY;

-- 8. Referrals Table
CREATE TABLE IF NOT EXISTS public.referrals (
    id BIGSERIAL PRIMARY KEY,
    tenant_id BIGINT NOT NULL REFERENCES public.tenants(id),
    referrer_id BIGINT NOT NULL REFERENCES public.customers(id),
    referred_id BIGINT NOT NULL REFERENCES public.customers(id),
    reward_points INTEGER NOT NULL DEFAULT 0,
    reward_amount DECIMAL(10, 2),
    status TEXT NOT NULL DEFAULT 'pending',
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_referrals_tenant_id ON public.referrals(tenant_id);
CREATE INDEX IF NOT EXISTS idx_referrals_referrer_id ON public.referrals(referrer_id);
CREATE INDEX IF NOT EXISTS idx_referrals_referred_id ON public.referrals(referred_id);

ALTER TABLE public.referrals ENABLE ROW LEVEL SECURITY;

-- 9. Member Promos Table
CREATE TABLE IF NOT EXISTS public.member_promos (
    id BIGSERIAL PRIMARY KEY,
    tenant_id BIGINT NOT NULL REFERENCES public.tenants(id),
    title TEXT NOT NULL,
    description TEXT,
    promo_type TEXT NOT NULL,
    discount_value DECIMAL(10, 2),
    target_member_level BIGINT REFERENCES public.member_levels(id),
    valid_from TIMESTAMP WITH TIME ZONE NOT NULL,
    valid_until TIMESTAMP WITH TIME ZONE NOT NULL,
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_member_promos_tenant_id ON public.member_promos(tenant_id);
CREATE INDEX IF NOT EXISTS idx_member_promos_is_active ON public.member_promos(is_active);

ALTER TABLE public.member_promos ENABLE ROW LEVEL SECURITY;

-- 10. Payment Methods Table
CREATE TABLE IF NOT EXISTS public.payment_methods (
    id BIGSERIAL PRIMARY KEY,
    tenant_id BIGINT NOT NULL REFERENCES public.tenants(id),
    method_name TEXT NOT NULL,
    method_type TEXT NOT NULL,
    is_active BOOLEAN NOT NULL DEFAULT true,
    configuration JSONB,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_payment_methods_tenant_id ON public.payment_methods(tenant_id);
CREATE INDEX IF NOT EXISTS idx_payment_methods_is_active ON public.payment_methods(is_active);

ALTER TABLE public.payment_methods ENABLE ROW LEVEL SECURITY;

-- 11. Customer Tags Table
CREATE TABLE IF NOT EXISTS public.customer_tags (
    id BIGSERIAL PRIMARY KEY,
    tenant_id BIGINT NOT NULL REFERENCES public.tenants(id),
    customer_id BIGINT NOT NULL REFERENCES public.customers(id),
    tag_name TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_customer_tags_tenant_id ON public.customer_tags(tenant_id);
CREATE INDEX IF NOT EXISTS idx_customer_tags_customer_id ON public.customer_tags(customer_id);
CREATE INDEX IF NOT EXISTS idx_customer_tags_tag_name ON public.customer_tags(tag_name);

ALTER TABLE public.customer_tags ENABLE ROW LEVEL SECURITY;

-- 12. Error Logs Table
CREATE TABLE IF NOT EXISTS public.error_logs (
    id BIGSERIAL PRIMARY KEY,
    tenant_id BIGINT REFERENCES public.tenants(id),
    error_type TEXT NOT NULL,
    error_message TEXT NOT NULL,
    stack_trace TEXT,
    user_id BIGINT,
    request_path TEXT,
    request_method TEXT,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_error_logs_tenant_id ON public.error_logs(tenant_id);
CREATE INDEX IF NOT EXISTS idx_error_logs_error_type ON public.error_logs(error_type);
CREATE INDEX IF NOT EXISTS idx_error_logs_created_at ON public.error_logs(created_at);

ALTER TABLE public.error_logs ENABLE ROW LEVEL SECURITY;

-- 13. Time Slot Templates Table (已在之前的 Migration 中建立，此處略過)

-- 14. Transfers Table (已在之前的 Migration 中建立，此處略過)

-- ============================================
-- RLS Policies for all new tables
-- ============================================

-- Weight Tracking RLS
CREATE POLICY "Tenants can view their own weight tracking records" ON public.weight_tracking FOR SELECT USING (tenant_id = current_setting('app.current_tenant_id', true)::bigint);
CREATE POLICY "Tenants can insert their own weight tracking records" ON public.weight_tracking FOR INSERT WITH CHECK (tenant_id = current_setting('app.current_tenant_id', true)::bigint);
CREATE POLICY "Tenants can update their own weight tracking records" ON public.weight_tracking FOR UPDATE USING (tenant_id = current_setting('app.current_tenant_id', true)::bigint);
CREATE POLICY "Tenants can delete their own weight tracking records" ON public.weight_tracking FOR DELETE USING (tenant_id = current_setting('app.current_tenant_id', true)::bigint);

-- Products RLS
CREATE POLICY "Tenants can view their own products" ON public.products FOR SELECT USING (tenant_id = current_setting('app.current_tenant_id', true)::bigint);
CREATE POLICY "Tenants can insert their own products" ON public.products FOR INSERT WITH CHECK (tenant_id = current_setting('app.current_tenant_id', true)::bigint);
CREATE POLICY "Tenants can update their own products" ON public.products FOR UPDATE USING (tenant_id = current_setting('app.current_tenant_id', true)::bigint);
CREATE POLICY "Tenants can delete their own products" ON public.products FOR DELETE USING (tenant_id = current_setting('app.current_tenant_id', true)::bigint);

-- Shop Orders RLS
CREATE POLICY "Tenants can view their own shop orders" ON public.shop_orders FOR SELECT USING (tenant_id = current_setting('app.current_tenant_id', true)::bigint);
CREATE POLICY "Tenants can insert their own shop orders" ON public.shop_orders FOR INSERT WITH CHECK (tenant_id = current_setting('app.current_tenant_id', true)::bigint);
CREATE POLICY "Tenants can update their own shop orders" ON public.shop_orders FOR UPDATE USING (tenant_id = current_setting('app.current_tenant_id', true)::bigint);

-- Aftercare Records RLS
CREATE POLICY "Tenants can view their own aftercare records" ON public.aftercare_records FOR SELECT USING (tenant_id = current_setting('app.current_tenant_id', true)::bigint);
CREATE POLICY "Tenants can insert their own aftercare records" ON public.aftercare_records FOR INSERT WITH CHECK (tenant_id = current_setting('app.current_tenant_id', true)::bigint);
CREATE POLICY "Tenants can update their own aftercare records" ON public.aftercare_records FOR UPDATE USING (tenant_id = current_setting('app.current_tenant_id', true)::bigint);

-- Member Levels RLS
CREATE POLICY "Tenants can view their own member levels" ON public.member_levels FOR SELECT USING (tenant_id = current_setting('app.current_tenant_id', true)::bigint);
CREATE POLICY "Tenants can insert their own member levels" ON public.member_levels FOR INSERT WITH CHECK (tenant_id = current_setting('app.current_tenant_id', true)::bigint);
CREATE POLICY "Tenants can update their own member levels" ON public.member_levels FOR UPDATE USING (tenant_id = current_setting('app.current_tenant_id', true)::bigint);

-- Coupons RLS
CREATE POLICY "Tenants can view their own coupons" ON public.coupons FOR SELECT USING (tenant_id = current_setting('app.current_tenant_id', true)::bigint);
CREATE POLICY "Tenants can insert their own coupons" ON public.coupons FOR INSERT WITH CHECK (tenant_id = current_setting('app.current_tenant_id', true)::bigint);
CREATE POLICY "Tenants can update their own coupons" ON public.coupons FOR UPDATE USING (tenant_id = current_setting('app.current_tenant_id', true)::bigint);

-- Coupon Usage RLS
CREATE POLICY "Tenants can view their own coupon usage" ON public.coupon_usage FOR SELECT USING (tenant_id = current_setting('app.current_tenant_id', true)::bigint);
CREATE POLICY "Tenants can insert their own coupon usage" ON public.coupon_usage FOR INSERT WITH CHECK (tenant_id = current_setting('app.current_tenant_id', true)::bigint);

-- Referrals RLS
CREATE POLICY "Tenants can view their own referrals" ON public.referrals FOR SELECT USING (tenant_id = current_setting('app.current_tenant_id', true)::bigint);
CREATE POLICY "Tenants can insert their own referrals" ON public.referrals FOR INSERT WITH CHECK (tenant_id = current_setting('app.current_tenant_id', true)::bigint);
CREATE POLICY "Tenants can update their own referrals" ON public.referrals FOR UPDATE USING (tenant_id = current_setting('app.current_tenant_id', true)::bigint);

-- Member Promos RLS
CREATE POLICY "Tenants can view their own member promos" ON public.member_promos FOR SELECT USING (tenant_id = current_setting('app.current_tenant_id', true)::bigint);
CREATE POLICY "Tenants can insert their own member promos" ON public.member_promos FOR INSERT WITH CHECK (tenant_id = current_setting('app.current_tenant_id', true)::bigint);
CREATE POLICY "Tenants can update their own member promos" ON public.member_promos FOR UPDATE USING (tenant_id = current_setting('app.current_tenant_id', true)::bigint);

-- Payment Methods RLS
CREATE POLICY "Tenants can view their own payment methods" ON public.payment_methods FOR SELECT USING (tenant_id = current_setting('app.current_tenant_id', true)::bigint);
CREATE POLICY "Tenants can insert their own payment methods" ON public.payment_methods FOR INSERT WITH CHECK (tenant_id = current_setting('app.current_tenant_id', true)::bigint);
CREATE POLICY "Tenants can update their own payment methods" ON public.payment_methods FOR UPDATE USING (tenant_id = current_setting('app.current_tenant_id', true)::bigint);

-- Customer Tags RLS
CREATE POLICY "Tenants can view their own customer tags" ON public.customer_tags FOR SELECT USING (tenant_id = current_setting('app.current_tenant_id', true)::bigint);
CREATE POLICY "Tenants can insert their own customer tags" ON public.customer_tags FOR INSERT WITH CHECK (tenant_id = current_setting('app.current_tenant_id', true)::bigint);
CREATE POLICY "Tenants can delete their own customer tags" ON public.customer_tags FOR DELETE USING (tenant_id = current_setting('app.current_tenant_id', true)::bigint);

-- Error Logs RLS (Super Admin 可查看所有，Tenant 只能查看自己的)
CREATE POLICY "Tenants can view their own error logs" ON public.error_logs FOR SELECT USING (tenant_id = current_setting('app.current_tenant_id', true)::bigint OR current_setting('app.user_role', true) = 'super_admin');
CREATE POLICY "System can insert error logs" ON public.error_logs FOR INSERT WITH CHECK (true);

-- ============================================
-- 完成！請檢查執行結果
-- ============================================
