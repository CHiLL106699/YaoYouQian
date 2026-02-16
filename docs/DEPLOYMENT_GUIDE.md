# YoCHiLLSAAS 多租戶預約系統 - 部署指南

**版本**: 1.0  
**日期**: 2026-02-07  
**作者**: Manus AI

---

## 📋 目錄

1. [系統需求](#系統需求)
2. [Supabase 設定](#supabase-設定)
3. [環境變數設定](#環境變數設定)
4. [資料庫 Migration](#資料庫-migration)
5. [Edge Functions 部署](#edge-functions-部署)
6. [前端部署](#前端部署)
7. [LINE 整合設定](#line-整合設定)
8. [LINE Pay 設定](#line-pay-設定)
9. [測試與驗證](#測試與驗證)
10. [常見問題](#常見問題)

---

## 系統需求

### 必要服務
- **Supabase 專案**（已提供：`ebkzsuckjnmpsxgggmzs`）
- **LINE Developers Console 帳號**
- **LINE Pay Merchant 帳號**
- **Amazon S3 儲存空間**（用於 Logo 上傳）

### 開發環境
- Node.js 22.13.0+
- pnpm 10.4.1+
- Deno 1.x（用於 Edge Functions）

---

## Supabase 設定

### 1. 取得連線資訊

已提供的 Supabase 專案資訊：
```
Project ID: ebkzsuckjnmpsxgggmzs
URL: https://ebkzsuckjnmpsxgggmzs.supabase.co
Anon Key: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
Service Role Key: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

### 2. 啟用必要的 Supabase 功能

在 Supabase Dashboard 中：
1. 前往 **Database** → **Extensions**
2. 啟用以下 Extensions：
   - `uuid-ossp`（用於 UUID 生成）
   - `pg_cron`（用於定期扣款排程）

---

## 環境變數設定

### 前端環境變數（`.env`）

```bash
# Supabase
EXPO_PUBLIC_SUPABASE_URL=https://ebkzsuckjnmpsxgggmzs.supabase.co
EXPO_PUBLIC_SUPABASE_KEY=sb_publishable_eAs8vNOBTO92BRR5FluXOQ_Y_sARKhh

# LINE LIFF
VITE_LINE_LIFF_ID=<your_liff_id>

# Amazon S3（用於 Logo 上傳）
VITE_S3_BUCKET_NAME=<your_bucket_name>
VITE_S3_REGION=<your_region>
```

### 後端環境變數（Supabase Edge Functions）

在 Supabase Dashboard → **Edge Functions** → **Secrets** 中設定：

```bash
# LINE Pay
LINE_PAY_CHANNEL_ID=<your_line_pay_channel_id>
LINE_PAY_CHANNEL_SECRET=<your_line_pay_channel_secret>
LINE_PAY_SANDBOX_MODE=true  # 測試環境設為 true，正式環境設為 false

# LINE Messaging API
LINE_MESSAGING_ACCESS_TOKEN=<your_line_messaging_access_token>
LINE_MESSAGING_CHANNEL_SECRET=<your_line_messaging_channel_secret>

# Supabase Service Role Key（用於 Edge Functions 存取資料庫）
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

---

## 資料庫 Migration

### 方法 1：使用 Supabase MCP（推薦）

```bash
# 執行所有 Migration 腳本
cd /home/ubuntu/flower-saas/supabase/migrations
manus-mcp-cli tool call apply_migration --server supabase --input '{
  "project_id": "ebkzsuckjnmpsxgggmzs",
  "name": "create_multi_tenant_schema",
  "query": "$(cat 001_create_tenants_table.sql)"
}'
```

### 方法 2：使用 Supabase SQL Editor

1. 前往 Supabase Dashboard → **SQL Editor**
2. 依序執行以下 Migration 腳本：
   - `001_create_tenants_table.sql`
   - `002_create_tenant_subscriptions_table.sql`
   - `003_create_tenant_settings_table.sql`
   - `004_create_subscription_payments_table.sql`
   - `005_create_appointments_table.sql`
   - `006_create_customers_table.sql`
   - `007_create_reschedule_requests_table.sql`
   - `008_create_booking_slot_limits_table.sql`

### 驗證 Migration

```sql
-- 檢查所有表是否建立成功
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
  AND table_name IN (
    'tenants', 
    'tenant_subscriptions', 
    'tenant_settings', 
    'subscription_payments', 
    'appointments', 
    'customers', 
    'reschedule_requests', 
    'booking_slot_limits'
  );
```

---

## Edge Functions 部署

### 1. 安裝 Supabase CLI

```bash
npm install -g supabase
supabase login
```

### 2. 連結專案

```bash
cd /home/ubuntu/flower-saas
supabase link --project-ref ebkzsuckjnmpsxgggmzs
```

### 3. 部署所有 Edge Functions

```bash
# 部署 LINE Pay 相關 Functions
supabase functions deploy line-pay-request
supabase functions deploy line-pay-confirm
supabase functions deploy line-pay-charge

# 部署 LINE 通知相關 Functions
supabase functions deploy send-line-notification
supabase functions deploy send-batch-approval-notification
supabase functions deploy send-booking-reminder
```

### 4. 設定 Edge Functions Secrets

```bash
supabase secrets set LINE_PAY_CHANNEL_ID=<your_value>
supabase secrets set LINE_PAY_CHANNEL_SECRET=<your_value>
supabase secrets set LINE_MESSAGING_ACCESS_TOKEN=<your_value>
supabase secrets set SUPABASE_SERVICE_ROLE_KEY=<your_value>
```

### 5. 測試 Edge Functions

```bash
# 測試 LINE Pay Request
curl -X POST \
  https://ebkzsuckjnmpsxgggmzs.supabase.co/functions/v1/line-pay-request \
  -H "Authorization: Bearer <your_anon_key>" \
  -H "Content-Type: application/json" \
  -d '{
    "tenantId": 1,
    "amount": 1000,
    "currency": "TWD",
    "productName": "基礎方案",
    "confirmUrl": "https://your-domain.com/subscription/confirm"
  }'
```

---

## 前端部署

### 1. 安裝依賴

```bash
cd /home/ubuntu/flower-saas
pnpm install
```

### 2. 建置專案

```bash
pnpm build
```

### 3. 部署到 Manus

```bash
# 使用 Manus webdev 工具自動部署
# 或手動部署到其他平台（Vercel, Netlify 等）
```

---

## LINE 整合設定

### 1. 建立 LINE Login Channel

1. 前往 [LINE Developers Console](https://developers.line.biz/)
2. 建立新的 **LINE Login Channel**
3. 記錄 **Channel ID** 和 **Channel Secret**

### 2. 建立 LINE Messaging API Channel

1. 在 LINE Developers Console 建立 **Messaging API Channel**
2. 記錄 **Channel Access Token**
3. 設定 Webhook URL：
   ```
   https://ebkzsuckjnmpsxgggmzs.supabase.co/functions/v1/send-line-notification
   ```

### 3. 建立 LINE LIFF App

1. 在 LINE Login Channel 中新增 **LIFF App**
2. 設定 Endpoint URL：
   ```
   https://your-domain.com/liff/booking
   ```
3. 選擇 **Size**: Full
4. 記錄 **LIFF ID**

---

## LINE Pay 設定

### 1. 申請 LINE Pay Merchant 帳號

1. 前往 [LINE Pay Merchant Portal](https://pay.line.me/portal/tw/main)
2. 完成商家註冊流程
3. 取得 **Channel ID** 和 **Channel Secret**

### 2. 設定 Confirm URL

在 LINE Pay Merchant Portal 中設定 Confirm URL：
```
https://your-domain.com/subscription/confirm
```

### 3. 測試環境設定

LINE Pay 提供 Sandbox 環境進行測試：
- Sandbox API Base URL: `https://sandbox-api-pay.line.me`
- 測試卡號：請參考 [LINE Pay 測試指南](https://pay.line.me/tw/developers/techsupport/sandbox/testflow?locale=zh_TW)

---

## 測試與驗證

### 1. 資料庫連線測試

```sql
-- 測試租戶建立
INSERT INTO tenants (name, subdomain, owner_line_user_id)
VALUES ('測試診所', 'test-clinic', 'U1234567890abcdef');

-- 測試 RLS 策略
SET app.current_tenant_id = '1';
SELECT * FROM tenants WHERE id = 1;
```

### 2. Edge Functions 測試

```bash
# 測試 LINE 通知
curl -X POST \
  https://ebkzsuckjnmpsxgggmzs.supabase.co/functions/v1/send-line-notification \
  -H "Authorization: Bearer <your_anon_key>" \
  -H "Content-Type: application/json" \
  -d '{
    "lineUserId": "U1234567890abcdef",
    "message": "測試通知訊息"
  }'
```

### 3. 前端功能測試

- ✅ 租戶註冊流程
- ✅ LINE LIFF 預約表單
- ✅ 管理後台登入
- ✅ 預約審核功能
- ✅ 時段管理功能
- ✅ 白標化設定
- ✅ LINE Pay 訂閱流程

---

## 常見問題

### Q1: Migration 執行失敗怎麼辦？

**A**: 檢查以下項目：
1. Supabase 專案是否正常運作
2. Service Role Key 是否正確
3. 是否有權限執行 DDL 操作
4. 檢查錯誤訊息並修正 SQL 語法

### Q2: Edge Functions 部署失敗？

**A**: 確認：
1. Supabase CLI 已正確安裝並登入
2. 專案已正確連結（`supabase link`）
3. Deno 版本是否相容
4. 檢查 Edge Function 代碼是否有語法錯誤

### Q3: LINE Pay 測試失敗？

**A**: 檢查：
1. Channel ID 和 Channel Secret 是否正確
2. 是否使用 Sandbox 環境（測試時）
3. Confirm URL 是否正確設定
4. 檢查 Edge Function 日誌

### Q4: RLS 策略導致資料無法存取？

**A**: 確認：
1. 是否正確設定 `app.current_tenant_id`
2. 使用 Service Role Key 時 RLS 會被繞過
3. 檢查 RLS 策略是否正確

### Q5: LINE LIFF 無法開啟？

**A**: 檢查：
1. LIFF ID 是否正確
2. Endpoint URL 是否可存取
3. LIFF App 是否已發布
4. 檢查瀏覽器 Console 錯誤訊息

---

## 🎉 部署完成

完成以上步驟後，您的 YoCHiLLSAAS 多租戶預約系統已成功部署！

**下一步**：
1. 建立第一個租戶帳號
2. 設定 LINE Bot 與 LIFF
3. 測試完整的預約流程
4. 監控系統運作狀態

**技術支援**：
- 架構文檔：`docs/architecture-analysis.md`
- 資料流向圖：`docs/data-flow-diagram.md`
- API 文檔：`docs/API_REFERENCE.md`

---

**文檔結束**
