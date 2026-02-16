ALTER TABLE tenant_subscriptions ENABLE ROW LEVEL SECURITY;

CREATE POLICY tenant_subscriptions_select_own ON tenant_subscriptions
FOR SELECT TO authenticated
USING (tenant_id = current_setting('app.current_tenant_id')::INTEGER);

CREATE POLICY tenant_subscriptions_insert_own ON tenant_subscriptions
FOR INSERT TO authenticated
WITH CHECK (tenant_id = current_setting('app.current_tenant_id')::INTEGER);

CREATE POLICY tenant_subscriptions_update_own ON tenant_subscriptions
FOR UPDATE TO authenticated
USING (tenant_id = current_setting('app.current_tenant_id')::INTEGER)
WITH CHECK (tenant_id = current_setting('app.current_tenant_id')::INTEGER);

CREATE POLICY tenant_subscriptions_delete_own ON tenant_subscriptions
FOR DELETE TO authenticated
USING (tenant_id = current_setting('app.current_tenant_id')::INTEGER);

CREATE POLICY tenant_subscriptions_admin_select_all ON tenant_subscriptions
FOR SELECT TO authenticated
USING (current_setting('app.user_role') = 'super_admin');
