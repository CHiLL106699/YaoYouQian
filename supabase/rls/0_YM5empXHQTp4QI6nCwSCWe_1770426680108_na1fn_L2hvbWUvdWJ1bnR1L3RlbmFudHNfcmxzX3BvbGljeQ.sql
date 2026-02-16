ALTER TABLE tenants ENABLE ROW LEVEL SECURITY;

-- 租戶只能查看自己的資料
CREATE POLICY tenants_select_own ON tenants FOR SELECT TO authenticated USING (tenant_id = current_setting('app.current_tenant_id')::INTEGER);

-- 超級管理員可以查看所有資料
CREATE POLICY tenants_admin_select_all ON tenants FOR SELECT TO authenticated USING (current_setting('app.user_role') = 'super_admin');

-- 租戶只能新增自己的資料
CREATE POLICY tenants_insert_own ON tenants FOR INSERT TO authenticated WITH CHECK (tenant_id = current_setting('app.current_tenant_id')::INTEGER);

-- 租戶只能更新自己的資料
CREATE POLICY tenants_update_own ON tenants FOR UPDATE TO authenticated USING (tenant_id = current_setting('app.current_tenant_id')::INTEGER) WITH CHECK (tenant_id = current_setting('app.current_tenant_id')::INTEGER);

-- 租戶只能刪除自己的資料
CREATE POLICY tenants_delete_own ON tenants FOR DELETE TO authenticated USING (tenant_id = current_setting('app.current_tenant_id')::INTEGER);
