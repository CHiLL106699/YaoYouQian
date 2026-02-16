# Supabase RLS 策略實作指南

## 📋 概述

本文檔說明如何在 Supabase 資料庫中實作 Row Level Security (RLS) 策略，確保多租戶資料隔離。

---

## 🔐 RLS 策略檔案清單

所有 RLS 策略 SQL 腳本位於 `supabase/rls/` 目錄：

1. **tenants 表 RLS 策略**
   - 檔案：`tenants_rls_policy.sql`
   - 功能：租戶只能查看自己的資料，超級管理員可查看所有租戶

2. **appointments 表 RLS 策略**
   - 檔案：`appointments_rls_policy.sql`
   - 功能：租戶只能查看自己的預約（基於 `tenant_id`）

3. **customers 表 RLS 策略**
   - 檔案：`customers_rls_policy.sql`
   - 功能：租戶只能查看自己的客戶（基於 `tenant_id`）

4. **tenant_subscriptions 表 RLS 策略**
   - 檔案：`tenant_subscriptions_rls_policy.sql`
   - 功能：租戶只能查看自己的訂閱資料

5. **reschedule_requests 表 RLS 策略**
   - 檔案：`reschedule_requests_rls_policy.sql`
   - 功能：租戶只能查看自己的改期申請

---

## 🚀 執行步驟

### 方法 1：使用 Supabase MCP 工具（推薦）

```bash
# 1. 列出所有 RLS 策略檔案
ls -la supabase/rls/

# 2. 使用 Supabase MCP 執行 SQL 腳本
for file in supabase/rls/*.sql; do
  manus-mcp-cli tool call execute_sql --server supabase --input "{\"sql\": \"$(cat $file)\", \"project_ref\": \"ebkzsuckjnmpsxgggmzs\"}"
done
```

### 方法 2：手動在 Supabase SQL Editor 執行

1. 登入 Supabase Dashboard：https://supabase.com/dashboard
2. 選擇專案：`ebkzsuckjnmpsxgggmzs`
3. 前往 **SQL Editor**
4. 依序執行以下 SQL 腳本：
   - `tenants_rls_policy.sql`
   - `appointments_rls_policy.sql`
   - `customers_rls_policy.sql`
   - `tenant_subscriptions_rls_policy.sql`
   - `reschedule_requests_rls_policy.sql`

---

## 🔧 RLS 策略核心概念

### 1. 啟用 RLS

```sql
ALTER TABLE table_name ENABLE ROW LEVEL SECURITY;
```

### 2. 建立租戶隔離策略

```sql
CREATE POLICY "tenants_select_own"
  ON table_name FOR SELECT
  USING (tenant_id = current_setting('app.current_tenant_id')::INTEGER);
```

### 3. 建立超級管理員策略

```sql
CREATE POLICY "tenants_admin_select_all"
  ON table_name FOR SELECT
  USING (current_setting('app.user_role') = 'super_admin');
```

### 4. 設定當前租戶 ID（在應用程式中）

```typescript
// 在每次請求前設定當前租戶 ID
await supabase.rpc('set_config', {
  setting: 'app.current_tenant_id',
  value: tenantId.toString()
});

// 設定使用者角色
await supabase.rpc('set_config', {
  setting: 'app.user_role',
  value: userRole // 'tenant_admin' 或 'super_admin'
});
```

---

## ⚠️ 重要注意事項

1. **RLS 是生死關鍵**：
   - 絕不能只依賴前端隱藏按鈕來控制資料存取
   - 必須在資料庫端寫死規則

2. **測試 RLS 策略**：
   - 使用不同租戶帳號測試資料隔離
   - 確認超級管理員可查看所有資料
   - 確認一般租戶只能查看自己的資料

3. **效能考量**：
   - RLS 策略會影響查詢效能
   - 確保 `tenant_id` 欄位有建立索引

4. **錯誤處理**：
   - 當 RLS 策略阻止存取時，Supabase 會回傳空結果
   - 應在應用程式層處理「無權限」的情況

---

## 📊 驗證 RLS 策略

### 測試腳本範例

```sql
-- 1. 設定租戶 ID
SELECT set_config('app.current_tenant_id', '1', false);

-- 2. 查詢預約資料（應只看到 tenant_id = 1 的資料）
SELECT * FROM appointments;

-- 3. 切換到另一個租戶
SELECT set_config('app.current_tenant_id', '2', false);

-- 4. 再次查詢（應只看到 tenant_id = 2 的資料）
SELECT * FROM appointments;

-- 5. 設定為超級管理員
SELECT set_config('app.user_role', 'super_admin', false);

-- 6. 查詢（應看到所有資料）
SELECT * FROM appointments;
```

---

## 🔗 相關資源

- [Supabase RLS 官方文檔](https://supabase.com/docs/guides/auth/row-level-security)
- [PostgreSQL RLS 文檔](https://www.postgresql.org/docs/current/ddl-rowsecurity.html)
- [多租戶架構最佳實踐](https://supabase.com/docs/guides/auth/row-level-security#multi-tenancy)

---

## 📝 後續步驟

1. ✅ 執行所有 RLS 策略 SQL 腳本
2. ⬜ 在應用程式中實作 `set_config` 邏輯
3. ⬜ 測試資料隔離功能
4. ⬜ 監控 RLS 策略效能
5. ⬜ 為其他表（如 `booking_slot_limits`）建立 RLS 策略
