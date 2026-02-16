-- 001_create_customer_tags_table.sql

-- 啟用 uuid-ossp 擴充功能以生成 UUID
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 建立 customer_tags 資料表
CREATE TABLE public.customer_tags (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
    customer_id UUID NOT NULL,
    tag_name TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- 建立索引以優化查詢性能
CREATE INDEX customer_tags_tenant_id_idx ON public.customer_tags (tenant_id);
CREATE INDEX customer_tags_customer_id_idx ON public.customer_tags (customer_id);

-- 確保每個租戶的標籤名稱是唯一的
ALTER TABLE public.customer_tags ADD CONSTRAINT customer_tags_tenant_id_tag_name_key UNIQUE (tenant_id, tag_name);

-- 啟用 Row Level Security (RLS)
ALTER TABLE public.customer_tags ENABLE ROW LEVEL SECURITY;

-- 為租戶管理員定義 RLS 策略：允許所有操作
CREATE POLICY "Tenants can manage their customer tags" ON public.customer_tags
    FOR ALL
    USING (auth.uid() IN (SELECT user_id FROM public.tenant_users WHERE tenant_id = public.customer_tags.tenant_id AND role = 'admin'))
    WITH CHECK (auth.uid() IN (SELECT user_id FROM public.tenant_users WHERE tenant_id = public.customer_tags.tenant_id AND role = 'admin'));

-- 為普通用戶定義 RLS 策略：允許讀取
CREATE POLICY "Users can view their customer tags" ON public.customer_tags
    FOR SELECT
    USING (auth.uid() IN (SELECT user_id FROM public.tenant_users WHERE tenant_id = public.customer_tags.tenant_id));

-- 建立觸發器函數以更新 updated_at 欄位
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 為 customer_tags 資料表添加觸發器
CREATE TRIGGER update_customer_tags_updated_at
BEFORE UPDATE ON public.customer_tags
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- 授予 public 角色對 customer_tags 資料表的 SELECT 權限
GRANT SELECT ON public.customer_tags TO public;

-- 授予 authenticated 角色對 customer_tags 資料表的 SELECT, INSERT, UPDATE, DELETE 權限
GRANT ALL ON public.customer_tags TO authenticated;

-- 授予服務角色對 customer_tags 資料表的 SELECT, INSERT, UPDATE, DELETE 權限
GRANT ALL ON public.customer_tags TO service_role;
