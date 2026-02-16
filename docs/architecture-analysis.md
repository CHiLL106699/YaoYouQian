# YoCHiLLSAAS 多租戶預約系統 - 架構分析文檔

**作者**: Manus AI  
**日期**: 2026-02-07  
**版本**: 1.0

---

## 一、專案概述

本專案旨在建立一個符合企業級資安標準的 **SaaS 多租戶預約管理系統**，整合 LINE LIFF 客戶端、管理後台、LINE Pay 訂閱機制與白標化功能。系統採用 **Supabase** 作為後端資料庫與認證層，並透過 **Supabase Edge Functions** 封裝所有敏感 API 操作，確保前端無法直接存取 Service Role Key 或第三方 API 金鑰。

### 核心功能模組

系統包含以下核心功能模組：

1. **多租戶資料庫架構**：建立 `tenants`、`tenant_subscriptions`、`tenant_settings` 表，所有業務表加入 `tenant_id` 欄位，實作 Supabase RLS 策略確保資料隔離。
2. **LINE LIFF 客戶端**：提供預約表單、會員預約管理（查看/取消/改期）、LINE 通知整合（預約確認、提醒、異動通知）。
3. **管理後台預約審核**：支援單筆/批次審核、時段數量上限管理（視覺化熱力圖）、會員管理、預約改期申請審核。
4. **LINE Pay 訂閱整合**：實作首次授權流程、定期扣款機制、訂閱方案管理（基礎版/專業版/企業版）、付款紀錄追蹤。
5. **白標化功能**：支援 Logo 上傳、品牌色自訂、自訂網域綁定。
6. **租戶註冊與試用期管理**：提供自助註冊流程、14 天免費試用期、試用期到期提醒與自動停用。
7. **超級管理員後台**：包含租戶清單與搜尋、訂閱狀態監控儀表板、系統健康度監控。
8. **Supabase Edge Functions 層**：封裝所有敏感操作（LINE Pay API、LINE Messaging API、Service Role Key），確保前端無法直接存取敏感金鑰。

---

## 二、技術架構設計

### 2.1 技術棧選擇

系統採用以下技術棧：

| 層級 | 技術選擇 | 說明 |
|------|---------|------|
| **前端框架** | React 19 + Tailwind CSS 4 + shadcn/ui | 現代化 UI 框架，支援快速開發與一致性設計 |
| **後端框架** | Express 4 + tRPC 11 | 類型安全的 API 層，端到端類型推導 |
| **資料庫** | Supabase (PostgreSQL) | 提供 RLS 策略、Edge Functions、即時訂閱功能 |
| **認證系統** | Manus OAuth + Supabase Auth | 支援多租戶身份驗證與權限控制 |
| **檔案儲存** | Amazon S3 | 儲存租戶上傳的 Logo、品牌素材等檔案 |
| **LINE 整合** | LINE LIFF + LINE Messaging API + LINE Pay API | 提供客戶端預約介面與通知功能 |
| **部署平台** | Manus Platform | 內建 CI/CD、自訂網域支援、環境變數管理 |

### 2.2 系統架構圖

系統採用三層架構設計：

```
┌─────────────────────────────────────────────────────────────────┐
│                         客戶端層                                  │
├─────────────────────────────────────────────────────────────────┤
│  LINE LIFF 預約表單  │  管理後台 (React 19)  │  超級管理員後台   │
│  - 預約表單          │  - 預約審核           │  - 租戶管理       │
│  - 會員預約管理      │  - 時段管理           │  - 訂閱監控       │
│  - 改期申請          │  - 白標化設定         │  - 系統健康度     │
└─────────────────────────────────────────────────────────────────┘
                                  ↓ HTTPS
┌─────────────────────────────────────────────────────────────────┐
│                         API 層 (tRPC 11)                         │
├─────────────────────────────────────────────────────────────────┤
│  租戶管理 Router  │  預約管理 Router  │  訂閱管理 Router        │
│  - 註冊/查詢      │  - 建立/審核      │  - LINE Pay 整合        │
│  - 白標化設定      │  - 改期申請       │  - 定期扣款             │
└─────────────────────────────────────────────────────────────────┘
                                  ↓
┌─────────────────────────────────────────────────────────────────┐
│                   Supabase Edge Functions 層                     │
├─────────────────────────────────────────────────────────────────┤
│  LINE Pay API     │  LINE Messaging API  │  敏感操作封裝        │
│  - 首次授權       │  - 預約通知          │  - Service Role Key  │
│  - 定期扣款       │  - 改期通知          │  - API 金鑰管理      │
└─────────────────────────────────────────────────────────────────┘
                                  ↓
┌─────────────────────────────────────────────────────────────────┐
│                    資料庫層 (Supabase PostgreSQL)                │
├─────────────────────────────────────────────────────────────────┤
│  tenants  │  tenant_subscriptions  │  appointments  │  customers │
│  - RLS 策略確保租戶資料隔離                                       │
│  - 所有業務表包含 tenant_id 欄位                                  │
└─────────────────────────────────────────────────────────────────┘
```

### 2.3 資安架構設計

系統遵循以下資安原則：

1. **前端零敏感金鑰**：所有 LINE Pay API、LINE Messaging API、Supabase Service Role Key 僅存在於 Supabase Edge Functions 中，前端無法直接存取。
2. **RLS 策略強制執行**：所有資料表啟用 Row Level Security (RLS)，確保租戶只能存取自己的資料。
3. **租戶上下文中介層**：後端 API 自動注入 `tenant_id`，防止跨租戶資料存取。
4. **敏感操作審計日誌**：所有敏感操作（如訂閱扣款、預約審核）記錄至 `audit_logs` 表。

---

## 三、資料庫 Schema 設計

### 3.1 多租戶核心表

#### tenants 表（租戶基本資料）

| 欄位名稱 | 資料類型 | 說明 | 約束 |
|---------|---------|------|------|
| `id` | SERIAL | 租戶唯一識別碼 | PRIMARY KEY |
| `name` | VARCHAR(255) | 租戶名稱（診所/企業名稱） | NOT NULL |
| `subdomain` | VARCHAR(100) | 子網域（例如：clinic-a） | UNIQUE, NOT NULL |
| `custom_domain` | VARCHAR(255) | 自訂網域（例如：clinic-a.com） | NULLABLE |
| `status` | VARCHAR(50) | 租戶狀態（active/suspended/cancelled） | NOT NULL |
| `owner_line_user_id` | TEXT | 租戶管理員的 LINE User ID | NOT NULL |
| `created_at` | TIMESTAMP | 建立時間 | DEFAULT CURRENT_TIMESTAMP |
| `updated_at` | TIMESTAMP | 更新時間 | DEFAULT CURRENT_TIMESTAMP |

#### tenant_subscriptions 表（訂閱狀態）

| 欄位名稱 | 資料類型 | 說明 | 約束 |
|---------|---------|------|------|
| `id` | SERIAL | 訂閱唯一識別碼 | PRIMARY KEY |
| `tenant_id` | INTEGER | 租戶 ID | REFERENCES tenants(id) |
| `plan` | VARCHAR(50) | 訂閱方案（basic/professional/enterprise） | NOT NULL |
| `status` | VARCHAR(50) | 訂閱狀態（trial/active/cancelled/expired） | NOT NULL |
| `line_pay_reg_key` | TEXT | LINE Pay 預先核准付款金鑰 | NULLABLE |
| `current_period_start` | TIMESTAMP | 當前計費週期開始時間 | NOT NULL |
| `current_period_end` | TIMESTAMP | 當前計費週期結束時間 | NOT NULL |
| `trial_end` | TIMESTAMP | 試用期結束時間 | NULLABLE |
| `created_at` | TIMESTAMP | 建立時間 | DEFAULT CURRENT_TIMESTAMP |
| `updated_at` | TIMESTAMP | 更新時間 | DEFAULT CURRENT_TIMESTAMP |

#### tenant_settings 表（白標化設定）

| 欄位名稱 | 資料類型 | 說明 | 約束 |
|---------|---------|------|------|
| `id` | SERIAL | 設定唯一識別碼 | PRIMARY KEY |
| `tenant_id` | INTEGER | 租戶 ID | REFERENCES tenants(id), UNIQUE |
| `logo_url` | TEXT | Logo 圖片 URL（S3） | NULLABLE |
| `primary_color` | VARCHAR(7) | 主要品牌色（HEX 格式） | DEFAULT '#FF69B4' |
| `secondary_color` | VARCHAR(7) | 次要品牌色（HEX 格式） | DEFAULT '#FFC0CB' |
| `company_name` | VARCHAR(255) | 公司顯示名稱 | NULLABLE |
| `contact_phone` | VARCHAR(20) | 聯絡電話 | NULLABLE |
| `contact_email` | VARCHAR(255) | 聯絡 Email | NULLABLE |
| `created_at` | TIMESTAMP | 建立時間 | DEFAULT CURRENT_TIMESTAMP |
| `updated_at` | TIMESTAMP | 更新時間 | DEFAULT CURRENT_TIMESTAMP |

#### subscription_payments 表（付款紀錄）

| 欄位名稱 | 資料類型 | 說明 | 約束 |
|---------|---------|------|------|
| `id` | SERIAL | 付款紀錄唯一識別碼 | PRIMARY KEY |
| `tenant_id` | INTEGER | 租戶 ID | REFERENCES tenants(id) |
| `subscription_id` | INTEGER | 訂閱 ID | REFERENCES tenant_subscriptions(id) |
| `amount` | DECIMAL(10, 2) | 付款金額 | NOT NULL |
| `currency` | VARCHAR(3) | 貨幣代碼 | DEFAULT 'TWD' |
| `line_pay_transaction_id` | TEXT | LINE Pay 交易 ID | NULLABLE |
| `status` | VARCHAR(50) | 付款狀態（pending/success/failed） | NOT NULL |
| `payment_date` | TIMESTAMP | 付款時間 | DEFAULT CURRENT_TIMESTAMP |
| `created_at` | TIMESTAMP | 建立時間 | DEFAULT CURRENT_TIMESTAMP |

### 3.2 業務資料表

#### appointments 表（預約資料）

| 欄位名稱 | 資料類型 | 說明 | 約束 |
|---------|---------|------|------|
| `id` | SERIAL | 預約唯一識別碼 | PRIMARY KEY |
| `tenant_id` | INTEGER | 租戶 ID | REFERENCES tenants(id), NOT NULL |
| `customer_id` | INTEGER | 客戶 ID | REFERENCES customers(id) |
| `appointment_date` | DATE | 預約日期 | NOT NULL |
| `appointment_time` | TIME | 預約時間 | NOT NULL |
| `service_type` | VARCHAR(100) | 療程類型 | NOT NULL |
| `status` | VARCHAR(50) | 預約狀態（pending/approved/cancelled/completed） | NOT NULL |
| `notes` | TEXT | 備註 | NULLABLE |
| `created_at` | TIMESTAMP | 建立時間 | DEFAULT CURRENT_TIMESTAMP |
| `updated_at` | TIMESTAMP | 更新時間 | DEFAULT CURRENT_TIMESTAMP |

#### customers 表（客戶資料）

| 欄位名稱 | 資料類型 | 說明 | 約束 |
|---------|---------|------|------|
| `id` | SERIAL | 客戶唯一識別碼 | PRIMARY KEY |
| `tenant_id` | INTEGER | 租戶 ID | REFERENCES tenants(id), NOT NULL |
| `line_user_id` | TEXT | LINE User ID | NOT NULL |
| `name` | VARCHAR(255) | 客戶姓名 | NOT NULL |
| `phone` | VARCHAR(20) | 客戶手機 | NULLABLE |
| `birth_date` | DATE | 客戶生日 | NULLABLE |
| `created_at` | TIMESTAMP | 建立時間 | DEFAULT CURRENT_TIMESTAMP |
| `updated_at` | TIMESTAMP | 更新時間 | DEFAULT CURRENT_TIMESTAMP |

#### reschedule_requests 表（改期申請）

| 欄位名稱 | 資料類型 | 說明 | 約束 |
|---------|---------|------|------|
| `id` | SERIAL | 改期申請唯一識別碼 | PRIMARY KEY |
| `tenant_id` | INTEGER | 租戶 ID | REFERENCES tenants(id), NOT NULL |
| `appointment_id` | INTEGER | 原預約 ID | REFERENCES appointments(id) |
| `new_date` | DATE | 新預約日期 | NOT NULL |
| `new_time` | TIME | 新預約時間 | NOT NULL |
| `reason` | TEXT | 改期原因 | NULLABLE |
| `status` | VARCHAR(50) | 申請狀態（pending/approved/rejected） | NOT NULL |
| `created_at` | TIMESTAMP | 建立時間 | DEFAULT CURRENT_TIMESTAMP |
| `updated_at` | TIMESTAMP | 更新時間 | DEFAULT CURRENT_TIMESTAMP |

#### booking_slot_limits 表（時段數量上限）

| 欄位名稱 | 資料類型 | 說明 | 約束 |
|---------|---------|------|------|
| `id` | SERIAL | 設定唯一識別碼 | PRIMARY KEY |
| `tenant_id` | INTEGER | 租戶 ID | REFERENCES tenants(id), NOT NULL |
| `date` | DATE | 日期（NULL 表示全域預設值） | NULLABLE |
| `time_slot` | TIME | 時段（NULL 表示全日預設值） | NULLABLE |
| `max_bookings` | INTEGER | 最大預約數量 | NOT NULL |
| `created_at` | TIMESTAMP | 建立時間 | DEFAULT CURRENT_TIMESTAMP |
| `updated_at` | TIMESTAMP | 更新時間 | DEFAULT CURRENT_TIMESTAMP |

### 3.3 RLS 策略設計

所有資料表啟用 Row Level Security (RLS)，並實作以下策略：

```sql
-- tenants 表：僅允許租戶查看自己的資料
CREATE POLICY "Tenants can view own data"
  ON tenants FOR SELECT
  USING (id = current_setting('app.current_tenant_id')::INTEGER);

-- appointments 表：僅允許租戶查看自己的預約
CREATE POLICY "Tenants can view own appointments"
  ON appointments FOR SELECT
  USING (tenant_id = current_setting('app.current_tenant_id')::INTEGER);

-- customers 表：僅允許租戶查看自己的客戶
CREATE POLICY "Tenants can view own customers"
  ON customers FOR SELECT
  USING (tenant_id = current_setting('app.current_tenant_id')::INTEGER);

-- 超級管理員可查看所有資料
CREATE POLICY "Super admin can view all data"
  ON tenants FOR SELECT
  USING (current_setting('app.user_role') = 'super_admin');
```

---

## 四、資料流向設計

### 4.1 租戶註冊流程

```
1. 租戶填寫註冊表單（診所名稱、子網域、管理員 LINE User ID）
   ↓
2. 前端呼叫 tRPC API: tenantRegistration.register
   ↓
3. 後端驗證子網域唯一性
   ↓
4. 建立 tenants 記錄（status = 'active'）
   ↓
5. 建立 tenant_subscriptions 記錄（status = 'trial', trial_end = 14 天後）
   ↓
6. 建立 tenant_settings 記錄（預設品牌色）
   ↓
7. 發送 LINE 通知給租戶管理員（註冊成功）
   ↓
8. 返回租戶 ID 與管理後台登入連結
```

### 4.2 LINE LIFF 預約流程

```
1. 客戶在 LINE LIFF 中開啟預約表單
   ↓
2. 前端呼叫 tRPC API: appointments.getAvailableSlots（查詢可用時段）
   ↓
3. 後端查詢 booking_slot_limits 表，計算各時段剩餘名額
   ↓
4. 前端顯示時段狀態（可預約/少量名額/已額滿/休診中）
   ↓
5. 客戶選擇時段並提交預約
   ↓
6. 前端呼叫 tRPC API: appointments.create
   ↓
7. 後端驗證時段未額滿，建立 appointments 記錄（status = 'pending'）
   ↓
8. 呼叫 Supabase Edge Function: send-line-notification
   ↓
9. Edge Function 使用 LINE Messaging API 發送預約確認通知給客戶
   ↓
10. Edge Function 發送預約審核通知給租戶管理員
```

### 4.3 LINE Pay 訂閱流程

```
【首次授權】
1. 租戶在管理後台選擇訂閱方案（basic/professional/enterprise）
   ↓
2. 前端呼叫 tRPC API: linePaySubscription.initiate
   ↓
3. 後端呼叫 Supabase Edge Function: line-pay-request
   ↓
4. Edge Function 使用 LINE Pay API 建立付款請求（payType = 'PREAPPROVED'）
   ↓
5. 返回 paymentUrl，前端導向 LINE Pay 付款頁面
   ↓
6. 租戶完成授權，LINE Pay 回調 /api/subscription/confirm
   ↓
7. 後端呼叫 Supabase Edge Function: line-pay-confirm
   ↓
8. Edge Function 確認付款並取得 regKey
   ↓
9. 更新 tenant_subscriptions 表（line_pay_reg_key = regKey, status = 'active'）
   ↓
10. 發送 LINE 通知給租戶管理員（訂閱成功）

【定期扣款】
1. Cron Job 每日檢查即將到期的訂閱（current_period_end < 3 天）
   ↓
2. 呼叫 Supabase Edge Function: line-pay-charge
   ↓
3. Edge Function 使用 regKey 發起 LINE Pay Pre-approved Payment
   ↓
4. 扣款成功 → 更新 current_period_end（延長 1 個月）
   ↓
5. 建立 subscription_payments 記錄（status = 'success'）
   ↓
6. 發送 LINE 通知給租戶管理員（扣款成功）
   ↓
7. 扣款失敗 → 重試 3 次 → 仍失敗則更新 status = 'suspended'
   ↓
8. 發送 LINE 通知給租戶管理員（扣款失敗，請更新付款方式）
```

### 4.4 預約審核流程

```
1. 租戶管理員在後台查看待審核預約（status = 'pending'）
   ↓
2. 點擊「批次核准」按鈕
   ↓
3. 前端呼叫 tRPC API: appointments.batchApprove
   ↓
4. 後端更新 appointments 表（status = 'approved'）
   ↓
5. 呼叫 Supabase Edge Function: send-batch-approval-notification
   ↓
6. Edge Function 使用 LINE Messaging API 發送審核成功通知給所有客戶
   ↓
7. Edge Function 發送彙整通知給租戶管理員（包含所有核准預約清單）
```

---

## 五、Supabase Edge Functions 設計

### 5.1 Edge Functions 清單

| Function 名稱 | 說明 | 輸入參數 | 輸出結果 |
|--------------|------|---------|---------|
| `line-pay-request` | 建立 LINE Pay 付款請求 | `tenantId`, `plan`, `amount` | `paymentUrl`, `transactionId` |
| `line-pay-confirm` | 確認 LINE Pay 付款並取得 regKey | `transactionId`, `orderId` | `regKey`, `status` |
| `line-pay-charge` | 使用 regKey 發起定期扣款 | `tenantId`, `regKey`, `amount` | `transactionId`, `status` |
| `send-line-notification` | 發送 LINE 通知（單筆） | `lineUserId`, `message` | `success` |
| `send-batch-approval-notification` | 發送批次審核通知 | `tenantId`, `appointments[]` | `success` |
| `send-booking-reminder` | 發送預約前一天提醒 | `appointmentId` | `success` |

### 5.2 環境變數管理

所有敏感金鑰僅存在於 Supabase Edge Functions 環境變數中：

```bash
# LINE Pay API
LINE_PAY_CHANNEL_ID=<LINE Pay Channel ID>
LINE_PAY_CHANNEL_SECRET=<LINE Pay Channel Secret>
LINE_PAY_API_URL=https://api-pay.line.me  # 正式環境
# LINE_PAY_API_URL=https://sandbox-api-pay.line.me  # 測試環境

# LINE Messaging API
LINE_CHANNEL_ACCESS_TOKEN=<LINE Channel Access Token>

# Supabase
SUPABASE_SERVICE_ROLE_KEY=<Supabase Service Role Key>
SUPABASE_URL=<Supabase Project URL>
```

---

## 六、檔案結構清單

### 6.1 資料庫 Migration 檔案

```
/home/ubuntu/flower-saas/
├── supabase/
│   ├── migrations/
│   │   ├── 001_create_tenants_table.sql
│   │   ├── 002_create_tenant_subscriptions_table.sql
│   │   ├── 003_create_tenant_settings_table.sql
│   │   ├── 004_create_subscription_payments_table.sql
│   │   ├── 005_create_appointments_table.sql
│   │   ├── 006_create_customers_table.sql
│   │   ├── 007_create_reschedule_requests_table.sql
│   │   ├── 008_create_booking_slot_limits_table.sql
│   │   ├── 009_enable_rls_policies.sql
│   │   └── 010_create_indexes.sql
```

### 6.2 後端 tRPC Router 檔案

```
/home/ubuntu/flower-saas/server/
├── routers/
│   ├── tenantRegistration.ts        # 租戶註冊 API
│   ├── tenantManagement.ts          # 租戶管理 API
│   ├── appointments.ts               # 預約管理 API
│   ├── rescheduleApproval.ts        # 改期申請 API
│   ├── slotLimits.ts                # 時段管理 API
│   ├── linePaySubscription.ts       # LINE Pay 訂閱 API
│   ├── whiteLabel.ts                # 白標化設定 API
│   └── superAdmin.ts                # 超級管理員 API
├── supabase.ts                      # Supabase 客戶端初始化
└── routers.ts                       # 主 Router 匯出
```

### 6.3 前端頁面檔案

```
/home/ubuntu/flower-saas/client/src/pages/
├── admin/
│   ├── TenantDashboard.tsx          # 租戶儀表板
│   ├── AppointmentApproval.tsx      # 預約審核頁面
│   ├── AppointmentCalendar.tsx      # 預約日曆頁面
│   ├── RescheduleApproval.tsx       # 改期申請審核頁面
│   ├── SlotManagement.tsx           # 時段管理頁面
│   ├── CustomerManagement.tsx       # 會員管理頁面
│   ├── WhiteLabelSettings.tsx       # 白標化設定頁面
│   └── SubscriptionManagement.tsx   # 訂閱管理頁面
├── liff/
│   ├── LiffBooking.tsx              # LINE LIFF 預約表單
│   ├── LiffMyBookings.tsx           # 會員預約管理頁面
│   └── LiffReschedule.tsx           # 預約改期申請頁面
├── superadmin/
│   ├── TenantList.tsx               # 租戶清單頁面
│   ├── SubscriptionMonitor.tsx      # 訂閱監控儀表板
│   └── SystemHealth.tsx             # 系統健康度監控頁面
├── TenantRegistration.tsx           # 租戶註冊頁面
└── Home.tsx                         # 首頁（產品介紹）
```

### 6.4 Supabase Edge Functions 檔案

```
/home/ubuntu/flower-saas/supabase/functions/
├── line-pay-request/
│   └── index.ts                     # 建立 LINE Pay 付款請求
├── line-pay-confirm/
│   └── index.ts                     # 確認 LINE Pay 付款並取得 regKey
├── line-pay-charge/
│   └── index.ts                     # 使用 regKey 發起定期扣款
├── send-line-notification/
│   └── index.ts                     # 發送 LINE 通知（單筆）
├── send-batch-approval-notification/
│   └── index.ts                     # 發送批次審核通知
└── send-booking-reminder/
    └── index.ts                     # 發送預約前一天提醒
```

### 6.5 技術文檔檔案

```
/home/ubuntu/flower-saas/docs/
├── architecture-analysis.md         # 架構分析文檔（本文檔）
├── api-documentation.md             # API 文檔（所有 tRPC 端點）
├── line-pay-integration-guide.md    # LINE Pay 訂閱整合完整指南
├── line-provider-registration.md    # LINE Developers Console 註冊與上架教學
├── line-extension-assets.md         # LINE 官方擴展上架素材準備清單
├── deployment-guide.md              # 部署指南（環境變數設定、資料庫 Migration）
└── faq.md                           # 常見問題 FAQ
```

---

## 七、關鍵技術決策

### 7.1 為何選擇 Supabase Edge Functions？

系統選擇 Supabase Edge Functions 作為敏感操作封裝層，主要基於以下考量：

1. **資安隔離**：Edge Functions 運行在 Supabase 伺服器端，前端無法直接存取 Service Role Key 或第三方 API 金鑰。
2. **原生整合**：Edge Functions 可直接存取 Supabase 資料庫，無需額外配置連線字串。
3. **自動擴展**：Supabase 提供自動擴展機制，無需手動管理伺服器資源。
4. **開發體驗**：使用 TypeScript 撰寫，與前端技術棧一致，降低學習成本。

### 7.2 為何選擇 tRPC？

系統選擇 tRPC 作為 API 層，主要基於以下考量：

1. **端到端類型安全**：tRPC 提供端到端類型推導，前端可直接使用後端定義的類型，減少類型錯誤。
2. **無需手動撰寫 API 文檔**：tRPC 自動生成 API 文檔，減少維護成本。
3. **開發效率**：tRPC 提供 `useQuery` 和 `useMutation` Hooks，簡化前端 API 呼叫邏輯。
4. **與 React Query 整合**：tRPC 內建 React Query 支援，提供快取、樂觀更新等功能。

### 7.3 為何選擇 LINE Pay 而非 Stripe？

系統選擇 LINE Pay 作為訂閱付款方式，主要基於以下考量：

1. **目標市場**：系統主要面向台灣市場，LINE Pay 在台灣普及率高於 Stripe。
2. **使用者體驗**：LINE Pay 整合於 LINE 應用程式中，使用者無需跳轉至外部網站。
3. **預先核准付款**：LINE Pay 提供 Pre-approved Payment 功能，支援定期扣款。
4. **通知整合**：LINE Pay 與 LINE Messaging API 整合，可透過 LINE 發送付款通知。

---

## 八、風險評估與緩解策略

### 8.1 資安風險

| 風險項目 | 風險等級 | 緩解策略 |
|---------|---------|---------|
| **跨租戶資料洩漏** | 高 | 實作 Supabase RLS 策略，確保租戶只能存取自己的資料 |
| **敏感金鑰洩漏** | 高 | 所有敏感金鑰僅存在於 Supabase Edge Functions 環境變數中 |
| **SQL 注入攻擊** | 中 | 使用 Drizzle ORM 參數化查詢，避免手動拼接 SQL |
| **XSS 攻擊** | 中 | 使用 React 自動轉義機制，避免直接渲染 HTML |

### 8.2 效能風險

| 風險項目 | 風險等級 | 緩解策略 |
|---------|---------|---------|
| **資料庫查詢效能** | 中 | 建立索引（tenant_id, appointment_date, status） |
| **LINE API 呼叫延遲** | 中 | 使用非同步佇列處理 LINE 通知，避免阻塞主流程 |
| **Edge Functions 冷啟動** | 低 | 使用 Supabase 內建快取機制，減少冷啟動次數 |

### 8.3 業務風險

| 風險項目 | 風險等級 | 緩解策略 |
|---------|---------|---------|
| **LINE Pay 扣款失敗** | 高 | 實作重試機制（重試 3 次），並發送 LINE 通知給租戶管理員 |
| **試用期到期未轉換** | 中 | 實作試用期到期提醒（提前 3 天發送 LINE 通知） |
| **租戶流失** | 中 | 提供完整的白標化功能與客製化支援 |

---

## 九、開發階段規劃

### Phase 1: 建立 Supabase 多租戶資料庫 Schema 與 RLS 策略

**預計工時**: 4 小時

**交付成果**:
- 完成所有資料表建立（tenants, tenant_subscriptions, tenant_settings, subscription_payments, appointments, customers, reschedule_requests, booking_slot_limits）
- 完成 RLS 策略實作（確保租戶資料隔離）
- 完成索引建立（優化查詢效能）
- 提供 SQL Migration 腳本

### Phase 2: 建立後端 tRPC API 層

**預計工時**: 8 小時

**交付成果**:
- 完成租戶註冊 API（tenantRegistration.ts）
- 完成租戶管理 API（tenantManagement.ts）
- 完成預約管理 API（appointments.ts）
- 完成改期申請 API（rescheduleApproval.ts）
- 完成時段管理 API（slotLimits.ts）
- 完成 LINE Pay 訂閱 API（linePaySubscription.ts）
- 完成白標化設定 API（whiteLabel.ts）
- 完成超級管理員 API（superAdmin.ts）

### Phase 3: 建立管理後台前端

**預計工時**: 12 小時

**交付成果**:
- 完成租戶儀表板（TenantDashboard.tsx）
- 完成預約審核頁面（AppointmentApproval.tsx）
- 完成預約日曆頁面（AppointmentCalendar.tsx）
- 完成改期申請審核頁面（RescheduleApproval.tsx）
- 完成時段管理頁面（SlotManagement.tsx）
- 完成會員管理頁面（CustomerManagement.tsx）
- 完成白標化設定頁面（WhiteLabelSettings.tsx）
- 完成訂閱管理頁面（SubscriptionManagement.tsx）

### Phase 4: 建立 LINE LIFF 客戶端

**預計工時**: 6 小時

**交付成果**:
- 完成 LINE LIFF 預約表單（LiffBooking.tsx）
- 完成會員預約管理頁面（LiffMyBookings.tsx）
- 完成預約改期申請頁面（LiffReschedule.tsx）
- 整合時段狀態查詢（顯示可預約/少量名額/已額滿/休診中）

### Phase 5: 整合 LINE Pay 訂閱與 LINE Messaging API 通知

**預計工時**: 8 小時

**交付成果**:
- 完成 LINE Pay 首次授權流程（line-pay-request, line-pay-confirm）
- 完成定期扣款機制（line-pay-charge）
- 完成付款失敗重試邏輯
- 完成所有 LINE 通知功能（預約確認、審核結果、改期通知、訂閱扣款）

### Phase 6: 建立超級管理員後台與系統監控

**預計工時**: 6 小時

**交付成果**:
- 完成租戶清單頁面（TenantList.tsx）
- 完成訂閱監控儀表板（SubscriptionMonitor.tsx）
- 完成系統健康度監控頁面（SystemHealth.tsx）

### Phase 7: 產出完整技術文檔、API 文檔與整合指南

**預計工時**: 4 小時

**交付成果**:
- 完成 API 文檔（api-documentation.md）
- 完成 LINE Pay 訂閱整合完整指南（line-pay-integration-guide.md）
- 完成 LINE Developers Console 註冊與上架教學（line-provider-registration.md）
- 完成 LINE 官方擴展上架素材準備清單（line-extension-assets.md）
- 完成部署指南（deployment-guide.md）
- 完成常見問題 FAQ（faq.md）

### Phase 8: 建立驗收測試清單與測試工具

**預計工時**: 4 小時

**交付成果**:
- 完成驗收測試清單
- 完成測試工具（debug.html）
- 完成所有功能測試（多租戶資料隔離、LINE Pay 訂閱、LINE 通知、白標化）

**總預計工時**: 52 小時

---

## 十、結論

本架構分析文檔詳細說明了 YoCHiLLSAAS 多租戶預約系統的技術架構、資料庫設計、資料流向、檔案結構與開發階段規劃。系統採用 **Supabase + tRPC + React 19** 技術棧，並透過 **Supabase Edge Functions** 封裝所有敏感操作，確保符合企業級資安標準。

系統核心功能包含多租戶資料庫架構、LINE LIFF 客戶端、管理後台預約審核、LINE Pay 訂閱整合、白標化功能、租戶註冊與試用期管理、超級管理員後台與系統監控。所有功能模組均遵循「前端零敏感金鑰」、「RLS 策略強制執行」、「租戶上下文中介層」等資安原則。

下一步將等待架構批准後，開始 Phase 1 實作：建立 Supabase 多租戶資料庫 Schema 與 RLS 策略。

---

**文檔結束**
