/**
 * E2E Test Helpers
 *
 * 提供 Supabase Service Role Client 用於直接操作資料庫，
 * 以及測試資料清理工具，確保每次測試的獨立性。
 *
 * 安全說明：
 * - 此處使用 Service Role Key 僅限於測試環境
 * - Service Role Key 絕不會出現在前端程式碼中
 * - .env.test 已被 .gitignore 忽略
 */
import { createClient, type SupabaseClient } from "@supabase/supabase-js";

/** 測試專用的租戶 ID（已存在於資料庫中的「測試診所」） */
export const TEST_TENANT_ID = Number(process.env.TEST_TENANT_ID) || 1;

/** 用於 E2E 測試的獨立租戶 ID（動態建立，避免污染既有資料） */
export const E2E_TENANT_PREFIX = "__e2e_test__";

let _supabase: SupabaseClient | null = null;

/**
 * 取得 Supabase Service Role Client（單例）
 * 使用 Service Role Key 以繞過 RLS，直接操作資料庫
 */
export function getSupabase(): SupabaseClient {
  if (!_supabase) {
    const url = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
    const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (!url || !key) {
      throw new Error(
        "Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in environment variables. " +
          "Please ensure .env.test is properly configured."
      );
    }
    _supabase = createClient(url, key, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    });
  }
  return _supabase;
}

/**
 * 建立一個測試專用的租戶，並回傳其 ID
 * 使用唯一前綴確保可被安全清理
 */
export async function createTestTenant(
  suffix?: string
): Promise<{ tenantId: number; subdomain: string }> {
  const supabase = getSupabase();
  const ts = Date.now();
  const rand = Math.random().toString(36).slice(2, 8);
  const uniqueId = `${E2E_TENANT_PREFIX}${suffix || ""}-${ts}-${rand}`;
  const subdomain = uniqueId.replace(/[^a-z0-9-]/g, "-").slice(0, 60);

  const { data, error } = await supabase
    .from("tenants")
    .insert({
      name: `E2E Test Tenant ${suffix || ""}`,
      subdomain,
      status: "active",
    })
    .select("id, subdomain")
    .single();

  if (error) {
    throw new Error(`Failed to create test tenant: ${error.message}`);
  }

  return { tenantId: data.id, subdomain: data.subdomain };
}

/**
 * 清理指定租戶的所有測試資料
 * 按照外鍵依賴順序刪除，避免 FK constraint violation
 */
export async function cleanupTestTenant(tenantId: number): Promise<void> {
  const supabase = getSupabase();

  // 依照外鍵依賴順序，從子表到父表逐一清理
  const tablesToClean = [
    "coupon_usage",
    "customer_tags",
    "customer_photos",
    "reschedule_approvals",
    "approvals",
    "order_items",        // 依賴 orders
    "orders",
    "appointments",
    "vouchers",
    "coupons",
    "marketing_campaigns",
    "member_levels",
    "deposits",
    "revenue",
    "dose_calculations",
    "weight_tracking",
    "aftercare_records",
    "aftercare_contents",
    "referrals",
    "member_promos",
    "member_promotions",
    "error_logs",
    "time_slot_templates",
    "slot_limits",
    "booking_slot_limits",
    "services",
    "products",
    "payment_methods",
    "shop_orders",
    "customers",
    "tenant_line_configs",
    "tenant_settings",
    "tenant_subscriptions",
    "tenants",
  ];

  for (const table of tablesToClean) {
    try {
      await supabase.from(table).delete().eq("tenant_id", tenantId);
    } catch {
      // 部分表可能不存在 tenant_id 欄位，靜默忽略
    }
  }
}

/**
 * 清理所有 E2E 測試產生的租戶（根據 subdomain 前綴識別）
 */
export async function cleanupAllTestTenants(): Promise<void> {
  const supabase = getSupabase();

  // 找出所有測試租戶
  const { data: testTenants } = await supabase
    .from("tenants")
    .select("id")
    .like("subdomain", `${E2E_TENANT_PREFIX}%`);

  if (testTenants && testTenants.length > 0) {
    for (const tenant of testTenants) {
      await cleanupTestTenant(tenant.id);
    }
  }
}

/**
 * 產生唯一的測試識別碼
 */
export function uniqueId(prefix = "test"): string {
  return `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}

/**
 * 產生未來的 ISO 日期字串
 */
export function futureDate(daysFromNow: number): string {
  const d = new Date();
  d.setDate(d.getDate() + daysFromNow);
  return d.toISOString();
}

/**
 * 產生過去的 ISO 日期字串
 */
export function pastDate(daysAgo: number): string {
  const d = new Date();
  d.setDate(d.getDate() - daysAgo);
  return d.toISOString();
}

/**
 * 產生 YYYY-MM-DD 格式的日期字串
 */
export function formatDate(date: Date): string {
  return date.toISOString().split("T")[0];
}

/**
 * 產生未來的 YYYY-MM-DD 日期字串
 */
export function futureDateStr(daysFromNow: number): string {
  const d = new Date();
  d.setDate(d.getDate() + daysFromNow);
  return formatDate(d);
}

/**
 * 產生過去的 YYYY-MM-DD 日期字串
 */
export function pastDateStr(daysAgo: number): string {
  const d = new Date();
  d.setDate(d.getDate() - daysAgo);
  return formatDate(d);
}
