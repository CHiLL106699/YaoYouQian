import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables. Please set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY.');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

/**
 * 租戶註冊
 */
export async function registerTenant(data: {
  email: string;
  password: string;
  companyName: string;
  contactPerson: string;
  subscriptionPlan: string;
}) {
  // 1. 建立 Supabase Auth 使用者
  const { data: authData, error: authError } = await supabase.auth.signUp({
    email: data.email,
    password: data.password,
    options: {
      data: {
        company_name: data.companyName,
        contact_person: data.contactPerson,
        role: 'tenant_admin',
      },
    },
  });

  if (authError) throw authError;

  // 2. 建立租戶資料（透過 tRPC 或 Edge Function）
  // 此處應呼叫後端 API 建立 tenants 表資料
  return authData;
}

/**
 * 租戶登入
 */
export async function loginTenant(email: string, password: string) {
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) throw error;
  return data;
}

/**
 * 超級管理員登入
 */
export async function loginAdmin(email: string, password: string) {
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) throw error;

  // 檢查是否為超級管理員
  const user = data.user;
  if (user?.user_metadata?.role !== 'super_admin') {
    await supabase.auth.signOut();
    throw new Error('無權限存取超級管理員後台');
  }

  return data;
}

/**
 * 登出
 */
export async function logout() {
  const { error } = await supabase.auth.signOut();
  if (error) throw error;
}

/**
 * 取得當前使用者
 */
export async function getCurrentUser() {
  const { data: { user } } = await supabase.auth.getUser();
  return user;
}

/**
 * 取得當前租戶 ID（從 user metadata 或 tenants 表）
 */
export async function getCurrentTenantId(): Promise<number | null> {
  const user = await getCurrentUser();
  if (!user) return null;

  // 從 tenants 表查詢（假設 auth_user_id 欄位儲存 Supabase Auth User ID）
  const { data, error } = await supabase
    .from('tenants')
    .select('id')
    .eq('auth_user_id', user.id)
    .single();

  if (error) {
    console.error('取得租戶 ID 失敗:', error);
    return null;
  }

  return data?.id || null;
}
