# YoCHiLLSAAS 資料庫 Migration 執行指引

## 📋 前置說明

本專案使用 **TiDB (MySQL 相容)**資料庫，不支援 PostgreSQL 的 RLS (Row Level Security) 語法。資料隔離機制已透過應用層（tRPC Router）實作完成。

## 🎯 Migration 目標

建立 12 個新增功能的資料表：
1. weight_tracking（體重追蹤）
2. products（商品管理）
3. shop_orders（商城訂單）
4. aftercare_records（術後照護記錄）
5. member_levels（會員等級）
6. coupons（優惠券）
7. coupon_usage（優惠券使用記錄）
8. referrals（推薦獎勵）
9. member_promos（會員促銷活動）
10. payment_methods（付款方式）
11. customer_tags（客戶標籤）
12. error_logs（錯誤日誌）

## 📝 執行步驟

### 步驟 1：開啟 Supabase SQL Editor

1. 前往 [Supabase Dashboard](https://supabase.com/dashboard/project/mrifutgtlquznfgbmild/sql/new)
2. 登入您的 Supabase 帳號
3. 選擇專案：**SAASGOCHILL**
4. 點擊左側選單的 **SQL Editor**
5. 點擊 **New Query** 建立新的查詢

### 步驟 2：複製 Migration SQL 腳本

開啟檔案：`/home/ubuntu/flower-saas/supabase/migrations/combined_new_migrations_tidb.sql`

**方法 A（推薦）**：使用本地編輯器
```bash
# 在本地終端機執行
cd /home/ubuntu/flower-saas
cat supabase/migrations/combined_new_migrations_tidb.sql
```

**方法 B**：直接從下方複製完整 SQL

<details>
<summary>點擊展開完整 SQL 腳本</summary>

```sql
-- ============================================
-- YoCHiLLSAAS 新增功能 Migration 腳本（TiDB 相容版本）
-- 請在 Supabase SQL Editor 中執行此腳本
-- 注意：TiDB 不支援 PostgreSQL RLS，資料隔離透過應用層實作
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

-- ============================================
-- Migration 完成
-- ============================================
-- 資料隔離透過應用層（tRPC Router）實作
-- 所有 Router 已實作 tenant_id 過濾邏輯
-- ============================================
```

</details>

### 步驟 3：貼上並執行 SQL

1. 將複製的 SQL 腳本貼到 Supabase SQL Editor 中
2. 檢查 SQL 腳本是否完整（應該有 12 個 CREATE TABLE 語句）
3. 點擊右下角的 **Run** 按鈕（或按 Ctrl+Enter）
4. 等待執行完成

### 步驟 4：驗證執行結果

執行完成後，檢查 **Results** 標籤頁：

**✅ 成功標誌**：
- 顯示 "Success. No rows returned"
- 或顯示每個 CREATE TABLE 的成功訊息

**❌ 錯誤處理**：
- 如果出現錯誤，請檢查錯誤訊息
- 常見錯誤：
  - `table already exists`：資料表已存在，可忽略（使用 IF NOT EXISTS）
  - `foreign key constraint fails`：參考的資料表不存在，需先建立父資料表

### 步驟 5：驗證資料表建立

前往 **Table Editor** 頁面，確認以下資料表已建立：

- [ ] weight_tracking
- [ ] products
- [ ] shop_orders
- [ ] aftercare_records
- [ ] member_levels
- [ ] coupons
- [ ] coupon_usage
- [ ] referrals
- [ ] member_promos
- [ ] payment_methods
- [ ] customer_tags
- [ ] error_logs

## 🔍 驗證測試

執行整合測試驗證資料表是否可正常查詢：

```bash
cd /home/ubuntu/flower-saas
pnpm test server/integration.test.ts
```

**預期結果**：所有測試應該通過（10/10 passed）

## ⚠️ 注意事項

1. **TiDB 限制**：本專案使用 TiDB（MySQL 相容），不支援 PostgreSQL 的 RLS Policies
2. **資料隔離**：租戶資料隔離已透過 tRPC Router 層實作，所有查詢都會自動過濾 `tenant_id`
3. **備份建議**：執行 Migration 前建議先備份現有資料庫
4. **回滾方案**：如需回滾，可執行 `DROP TABLE` 指令刪除新建的資料表

## 📞 支援

如遇到問題，請提供：
1. 錯誤訊息截圖
2. 執行的 SQL 腳本內容
3. Supabase 專案資訊

---

**Migration 版本**：v1.0.0  
**建立日期**：2026-02-12  
**相容資料庫**：TiDB (MySQL 8.0+)
