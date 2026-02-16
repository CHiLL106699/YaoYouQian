ALTER TABLE reschedule_requests ENABLE ROW LEVEL SECURITY;

-- SELECT policy for tenants
CREATE POLICY reschedule_requests_select_own ON reschedule_requests
FOR SELECT USING (tenant_id = current_setting('app.current_tenant_id')::INTEGER);

-- INSERT policy for tenants
CREATE POLICY reschedule_requests_insert_own ON reschedule_requests
FOR INSERT WITH CHECK (tenant_id = current_setting('app.current_tenant_id')::INTEGER);

-- UPDATE policy for tenants
CREATE POLICY reschedule_requests_update_own ON reschedule_requests
FOR UPDATE USING (tenant_id = current_setting('app.current_tenant_id')::INTEGER)
WITH CHECK (tenant_id = current_setting('app.current_tenant_id')::INTEGER);

-- DELETE policy for tenants
CREATE POLICY reschedule_requests_delete_own ON reschedule_requests
FOR DELETE USING (tenant_id = current_setting('app.current_tenant_id')::INTEGER);

-- Super admin policy to view all data
CREATE POLICY reschedule_requests_admin_select_all ON reschedule_requests
FOR SELECT USING (current_setting('app.user_role') = 'super_admin');
