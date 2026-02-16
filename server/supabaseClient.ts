import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  throw new Error('Missing Supabase environment variables (VITE_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY)');
}

export const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

/**
 * 資料庫輔助函數：確保所有查詢符合 RLS 策略
 */
export const dbHelpers = {
  /**
   * 設定當前租戶 ID（用於 RLS 策略）
   */
  async setCurrentTenant(tenantId: number) {
    await supabase.rpc('set_config', {
      setting: 'app.current_tenant_id',
      value: tenantId.toString()
    });
  },

  /**
   * 設定使用者角色（用於 RLS 策略）
   */
  async setUserRole(role: 'tenant_admin' | 'super_admin') {
    await supabase.rpc('set_config', {
      setting: 'app.user_role',
      value: role
    });
  }
};
