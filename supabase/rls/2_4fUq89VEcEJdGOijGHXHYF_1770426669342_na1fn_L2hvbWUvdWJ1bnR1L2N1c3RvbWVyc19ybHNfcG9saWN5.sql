
ALTER TABLE customers ENABLE ROW LEVEL SECURITY;

-- SELECT 策略：租戶只能查看自己的資料
CREATE POLICY customers_select_own ON customers FOR SELECT USING (tenant_id = current_setting('app.current_tenant_id')::INTEGER);

-- INSERT 策略：租戶只能新增自己的資料
CREATE POLICY customers_insert_own ON customers FOR INSERT WITH CHECK (tenant_id = current_setting('app.current_tenant_id')::INTEGER);

-- UPDATE 策略：租戶只能更新自己的資料
CREATE POLICY customers_update_own ON customers FOR UPDATE USING (tenant_id = current_setting('app.current_tenant_id')::INTEGER) WITH CHECK (tenant_id = current_setting('app.current_tenant_id')::INTEGER);

-- DELETE 策略：租戶只能刪除自己的資料
CREATE POLICY customers_delete_own ON customers FOR DELETE USING (tenant_id = current_setting('app.current_tenant_id')::INTEGER);

-- 超級管理員策略：允許查看所有資料
CREATE POLICY customers_admin_select_all ON customers FOR SELECT USING (current_setting('app.user_role') = 'super_admin');
