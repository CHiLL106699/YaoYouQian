-- ============================================
-- YoCHiLLSAAS RLS 啟用與 Policies 建立腳本
-- 請在 Supabase SQL Editor 中執行此腳本
-- ============================================

-- 1. 啟用所有資料表的 RLS
ALTER TABLE public.tenants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.services ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.appointments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.time_slots ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reschedule_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.white_label_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.weight_tracking ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.shop_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.aftercare_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.member_levels ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.coupons ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.coupon_usage ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.referrals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.member_promos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payment_methods ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.customer_tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.error_logs ENABLE ROW LEVEL SECURITY;

-- 2. 建立 RLS Policies（僅允許後端 Service Role 存取）
-- 由於前端已移除直接資料庫存取，所有資料操作都透過 tRPC Router（使用 Service Role Key）
-- 因此 RLS Policies 設定為：拒絕所有 anon 角色的存取，僅允許 service_role

-- tenants 資料表
CREATE POLICY "Service role can manage tenants" ON public.tenants
  FOR ALL USING (auth.role() = 'service_role');

-- customers 資料表
CREATE POLICY "Service role can manage customers" ON public.customers
  FOR ALL USING (auth.role() = 'service_role');

-- services 資料表
CREATE POLICY "Service role can manage services" ON public.services
  FOR ALL USING (auth.role() = 'service_role');

-- appointments 資料表
CREATE POLICY "Service role can manage appointments" ON public.appointments
  FOR ALL USING (auth.role() = 'service_role');

-- time_slots 資料表
CREATE POLICY "Service role can manage time_slots" ON public.time_slots
  FOR ALL USING (auth.role() = 'service_role');

-- reschedule_requests 資料表
CREATE POLICY "Service role can manage reschedule_requests" ON public.reschedule_requests
  FOR ALL USING (auth.role() = 'service_role');

-- white_label_settings 資料表
CREATE POLICY "Service role can manage white_label_settings" ON public.white_label_settings
  FOR ALL USING (auth.role() = 'service_role');

-- weight_tracking 資料表
CREATE POLICY "Service role can manage weight_tracking" ON public.weight_tracking
  FOR ALL USING (auth.role() = 'service_role');

-- products 資料表
CREATE POLICY "Service role can manage products" ON public.products
  FOR ALL USING (auth.role() = 'service_role');

-- shop_orders 資料表
CREATE POLICY "Service role can manage shop_orders" ON public.shop_orders
  FOR ALL USING (auth.role() = 'service_role');

-- aftercare_records 資料表
CREATE POLICY "Service role can manage aftercare_records" ON public.aftercare_records
  FOR ALL USING (auth.role() = 'service_role');

-- member_levels 資料表
CREATE POLICY "Service role can manage member_levels" ON public.member_levels
  FOR ALL USING (auth.role() = 'service_role');

-- coupons 資料表
CREATE POLICY "Service role can manage coupons" ON public.coupons
  FOR ALL USING (auth.role() = 'service_role');

-- coupon_usage 資料表
CREATE POLICY "Service role can manage coupon_usage" ON public.coupon_usage
  FOR ALL USING (auth.role() = 'service_role');

-- referrals 資料表
CREATE POLICY "Service role can manage referrals" ON public.referrals
  FOR ALL USING (auth.role() = 'service_role');

-- member_promos 資料表
CREATE POLICY "Service role can manage member_promos" ON public.member_promos
  FOR ALL USING (auth.role() = 'service_role');

-- payment_methods 資料表
CREATE POLICY "Service role can manage payment_methods" ON public.payment_methods
  FOR ALL USING (auth.role() = 'service_role');

-- customer_tags 資料表
CREATE POLICY "Service role can manage customer_tags" ON public.customer_tags
  FOR ALL USING (auth.role() = 'service_role');

-- error_logs 資料表
CREATE POLICY "Service role can manage error_logs" ON public.error_logs
  FOR ALL USING (auth.role() = 'service_role');

-- ============================================
-- RLS 啟用完成
-- ============================================
-- 所有資料表已啟用 RLS
-- 所有 Policies 已建立（僅允許 service_role 存取）
-- 前端無法直接存取資料庫，所有操作必須透過 tRPC Router
-- ============================================
