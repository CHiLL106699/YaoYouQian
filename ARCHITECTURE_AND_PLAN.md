# 曜友仟管理雲：BI 儀表板與精準再行銷系統開發計畫

**作者：** Manus AI
**日期：** 2026-02-17

---

## 1. 專案背景與目標

本文件旨在闡述為「曜友仟管理雲」新增兩大核心功能模組的架構設計與開發計畫：

1.  **視覺化營運數據儀表板 (BI Dashboard)**：提供多維度的數據洞察，幫助診所管理者快速掌握營運狀況，做出明智決策。
2.  **標籤化精準再行銷系統 (Marketing Automation)**：建立自動化、智慧化的客戶標籤體系，並結合 LINE Messaging API 實現合規的精準行銷，提升客戶回訪率與價值。

本計畫將嚴格遵循「文檔驅動開發」與「資安優先」的原則，確保系統的可維護性、擴展性與安全性。

## 2. 現有架構分析

在深入設計前，已對現有專案 `CHiLL106699/YaoYouQian` 進行了全面分析：

-   **前端**：使用 `React`、`TypeScript`、`Vite` 構建，路由由 `wouter` 管理，UI 元件庫為 `shadcn/ui` 搭配 `TailwindCSS`。狀態管理與後端通訊主要透過 `@trpc/react-query` 實現。
-   **後端**：基於 `Node.js` 與 `tRPC`，所有 API 路由均在 `server/routers/` 目錄下定義，並於 `server/routers.ts` 中統一註冊。
-   **資料庫**：`Supabase (PostgreSQL)` 為唯一數據源。後端服務通過 `supabase-js` 的 Service Role Key 與資料庫互動，前端則使用 Anon Key。專案已利用 RLS 進行資料隔離。
-   **環境**：前端環境變數使用 `VITE_` 前綴，後端則直接讀取 `process.env`。Supabase 連線資訊與 LINE 憑證需透過環境變數注入。

此架構清晰、現代化，為新功能開發提供了良好基礎。新模組將無縫整合至現有 tRPC 路由與 React 前端結構中。

## 3. 整體設計與資料流

新功能將遵循現有的 Client-Server 架構。前端 React 頁面將透過 tRPC Hooks (`useQuery`, `useMutation`) 呼叫後端對應的 tRPC Router。後端 Router 負責處理業務邏輯，並使用 Supabase Service Role Client 與資料庫進行安全的 CRUD 操作。所有敏感操作與資料查詢均在後端完成，前端只接收脫敏後的結果。

### 資料流向圖

```mermaid
graph TD
    subgraph Frontend (Browser)
        A[React Components] -- tRPC Hook --> B(tRPC Client)
    end

    subgraph Backend (Server)
        B -- HTTP Request --> C(tRPC Server)
        C -- Procedure Call --> D{tRPC Routers}
        D -- Supabase Client --> E(Supabase DB)
        D -- LINE API Call --> F(LINE Messaging API)
    end

    subgraph External Services
        E
        F
    end

    A -- Renders --> G(User Interface)
    E -- Returns Data --> D
    F -- Returns Result --> D
    D -- Returns JSON --> C
    C -- HTTP Response --> B
    B -- Returns Data/State --> A
```

## 4. 模組一：視覺化營運數據儀表板 (BI Dashboard)

### 4.1 資料庫設計

將在 Supabase 中建立以下新表，並設定相應的 RLS 政策，確保租戶只能存取自身資料。

| 表名稱 (Table)          | 欄位 (Column)       | 類型 (Type)          | 描述                                     |
| ----------------------- | ------------------- | -------------------- | ---------------------------------------- |
| `dashboard_snapshots`   | `id`                | `BIGINT` (PK)        | 唯一識別碼                               |
|                         | `tenant_id`         | `BIGINT` (FK)        | 租戶 ID                                  |
|                         | `snapshot_date`     | `DATE`               | 快照日期                                 |
|                         | `metrics`           | `JSONB`              | 儲存當日的關鍵指標數據（如營收、新客數） |
|                         | `created_at`        | `TIMESTAMPTZ`        | 建立時間                                 |
| `report_exports`        | `id`                | `BIGINT` (PK)        | 唯一識別碼                               |
|                         | `tenant_id`         | `BIGINT` (FK)        | 租戶 ID                                  |
|                         | `report_type`       | `TEXT`               | 報表類型（如：revenue_overview）         |
|                         | `file_url`          | `TEXT`               | 匯出檔案的儲存 URL                       |
|                         | `format`            | `ENUM('csv', 'xlsx')`| 檔案格式                                 |
|                         | `generated_at`      | `TIMESTAMPTZ`        | 產生時間                                 |
|                         | `generated_by`      | `UUID` (FK)          | 產生報表的使用者 ID                      |

### 4.2 後端架構 (tRPC Router)

將建立 `server/routers/biDashboardRouter.ts`，並使用 `protectedProcedure` 確保所有端點都需要身份驗證。

-   **`getRevenueOverview`**: 根據時間範圍（日/週/月/年）從 `orders` 和 `appointments` 表中彙總營收數據，並與前期數據進行比較。
-   **`getServiceAnalytics`**: 分析 `appointments` 和 `services` 表，計算各療程的營收佔比、轉換率及平均客單價。
-   **`getCustomerAnalytics`**: 分析 `customers` 表，計算新客數趨勢、回訪率及客戶生命週期價值 (LTV)。
-   **`getStaffPerformance`**: 聚合 `appointments` 表數據，提供按員工維度的營收、服務客戶數等績效指標。
-   **`getAppointmentAnalytics`**: 分析 `appointments` 表，計算爽約率、預約尖峰時段等。
-   **`getTopServices`**: 根據營收或預約次數，對 `services` 進行排名。
-   **`exportReport`**: 接收報表類型與數據，使用 `json2csv` 套件生成 CSV 內容，並返回給前端下載。
-   **`saveDailySnapshot`**: 此程序將由 Supabase Cron Job 每日定時觸發，計算當日核心營運指標並存入 `dashboard_snapshots` 表。

### 4.3 前端架構

將建立新的儀表板頁面及可重用元件。

-   **`client/src/pages/BIDashboard.tsx`**: 主頁面，整合所有圖表元件，並提供時間範圍切換等互動功能。
-   **`client/src/components/KPICard.tsx`**: 顯示單一關鍵績效指標（KPI）的卡片元件。
-   **`client/src/components/RevenueChart.tsx`**: 使用 `recharts` 的 `LineChart` 顯示營收趨勢。
-   **`client/src/components/ServicePieChart.tsx`**: 使用 `recharts` 的 `PieChart` 顯示療程營收佔比。
-   **`client/src/components/StaffPerformanceChart.tsx`**: 使用 `recharts` 的 `BarChart` 比較員工績效。
-   **`client/src/components/AppointmentHeatmap.tsx`**: 自訂元件，以熱力圖形式展示預約時段分佈。
-   **`client/src/components/CustomerFunnel.tsx`**: 自訂漏斗圖元件，展示客戶轉化流程。

## 5. 模組二：標籤化精準再行銷系統

### 5.1 資料庫設計

| 表名稱 (Table)                 | 欄位 (Column)           | 類型 (Type)                               | 描述                                                               |
| ------------------------------ | ----------------------- | ----------------------------------------- | ------------------------------------------------------------------ |
| `smart_tags`                   | `id`                    | `BIGINT` (PK)                             | 唯一識別碼                                                         |
|                                | `tenant_id`             | `BIGINT` (FK)                             | 租戶 ID                                                            |
|                                | `tag_name`              | `TEXT`                                    | 標籤名稱                                                           |
|                                | `tag_category`          | `ENUM('behavior', 'interest', ...)`       | 標籤分類                                                           |
|                                | `auto_rule`             | `JSONB`                                   | 自動化規則定義，例如 `{"type":"inactive_days","value":90}`      |
|                                | `color`                 | `TEXT`                                    | 標籤顏色 (Hex Code)                                                |
|                                | `description`           | `TEXT`                                    | 標籤描述                                                           |
| `customer_smart_tags`          | `id`                    | `BIGINT` (PK)                             | 唯一識別碼                                                         |
|                                | `customer_id`           | `BIGINT` (FK)                             | 客戶 ID                                                            |
|                                | `tag_id`                | `BIGINT` (FK)                             | 標籤 ID                                                            |
|                                | `tenant_id`             | `BIGINT` (FK)                             | 租戶 ID                                                            |
|                                | `applied_at`            | `TIMESTAMPTZ`                             | 標籤應用時間                                                       |
|                                | `applied_by`            | `ENUM('auto', 'manual')`                  | 應用方式                                                           |
|                                | `expires_at`            | `TIMESTAMPTZ`                             | 標籤過期時間 (可選)                                                |
| `campaign_templates`           | `id`                    | `BIGINT` (PK)                             | 唯一識別碼                                                         |
|                                | `tenant_id`             | `BIGINT` (FK)                             | 租戶 ID                                                            |
|                                | `template_name`         | `TEXT`                                    | 模板名稱                                                           |
|                                | `message_type`          | `ENUM('text', 'flex', 'image')`           | 訊息類型                                                           |
|                                | `content`               | `JSONB`                                   | 訊息內容 (例如 LINE Flex Message JSON)                             |
|                                | `category`              | `TEXT`                                    | 模板分類                                                           |
| `campaign_executions`          | `id`                    | `BIGINT` (PK)                             | 唯一識別碼                                                         |
|                                | `campaign_id`           | `BIGINT` (FK)                             | 關聯的行銷活動 ID (可選)                                           |
|                                | `tenant_id`             | `BIGINT` (FK)                             | 租戶 ID                                                            |
|                                | `target_count`          | `INTEGER`                                 | 目標受眾數量                                                       |
|                                | `sent_count`            | `INTEGER`                                 | 成功發送數量                                                       |
|                                | `status`                | `TEXT`                                    | 執行狀態 (例如：processing, completed, failed)                     |
|                                | `executed_at`           | `TIMESTAMPTZ`                             | 執行時間                                                           |
| `medical_compliance_keywords`  | `id`                    | `BIGINT` (PK)                             | 唯一識別碼                                                         |
|                                | `keyword`               | `TEXT`                                    | 警示關鍵詞                                                         |
|                                | `severity`              | `ENUM('warning', 'blocked')`              | 嚴重級別                                                           |
|                                | `regulation_reference`  | `TEXT`                                    | 法規參考                                                           |
|                                | `description`           | `TEXT`                                    | 描述                                                               |

### 5.2 後端架構 (tRPC Routers)

將建立多個職責單一的 tRPC Router。

-   **`server/routers/smartTagRouter.ts`**: 提供標籤的 CRUD 功能。包含一個由 Cron Job 觸發的 `applyAutoTags` 程序，用於掃描客戶數據並根據 `auto_rule` 自動應用標籤。
-   **`server/routers/campaignTemplateRouter.ts`**: 提供行銷模板的 CRUD 功能。
-   **`server/routers/campaignExecutionRouter.ts`**: 核心執行緒。提供一個 `executeCampaign` 程序，步驟如下：
    1.  根據傳入的標籤 ID 查詢 `customer_smart_tags` 和 `customers` 表，篩選出目標客戶的 `line_user_id`。
    2.  呼叫 `complianceRouter` 的 `checkContent` 程序進行合規檢查。
    3.  若合規檢查通過，則分批次呼叫 LINE Messaging API 的群發接口。
    4.  在 `campaign_executions` 表中記錄執行結果。
-   **`server/routers/complianceRouter.ts`**: 提供警示詞庫的 CRUD，以及一個 `checkContent` 程序，用於掃描文本內容是否包含警示詞，並返回檢查結果。

### 5.3 前端架構

-   **`client/src/pages/SmartTagManagement.tsx`**: 管理智能標籤，包括新增、編輯、刪除標籤，以及設定自動化規則。
-   **`client/src/pages/CampaignTemplateManagement.tsx`**: 管理行銷模板，提供視覺化的 Flex Message 編輯器預覽。
-   **`client/src/pages/CampaignExecution.tsx`**: 引導式操作介面，讓使用者完成選擇受眾、選擇模板、預覽、發送的完整流程。
-   **`client/src/pages/ComplianceKeywordManagement.tsx`**: 管理醫療法規警示詞庫。
-   **`client/src/components/ComplianceChecker.tsx`**: 一個可重用的 React 元件，包裹一個文本輸入框，當用戶輸入時即時呼叫後端進行合規檢查，並高亮顯示有問題的詞彙。

## 6. 檔案變更清單

### 6.1 新增檔案

```
# BI Dashboard
- client/src/pages/BIDashboard.tsx
- client/src/components/KPICard.tsx
- client/src/components/RevenueChart.tsx
- client/src/components/ServicePieChart.tsx
- client/src/components/StaffPerformanceChart.tsx
- client/src/components/AppointmentHeatmap.tsx
- client/src/components/CustomerFunnel.tsx
- server/routers/biDashboardRouter.ts

# Marketing Automation
- client/src/pages/SmartTagManagement.tsx
- client/src/pages/CampaignTemplateManagement.tsx
- client/src/pages/CampaignExecution.tsx
- client/src/pages/ComplianceKeywordManagement.tsx
- client/src/components/ComplianceChecker.tsx
- server/routers/smartTagRouter.ts
- server/routers/campaignTemplateRouter.ts
- server/routers/campaignExecutionRouter.ts
- server/routers/complianceRouter.ts
```

### 6.2 修改檔案

```
- client/src/App.tsx                     # 新增前端路由
- client/src/components/DashboardLayout.tsx # 在側邊欄加入新頁面的導航連結
- server/routers.ts                      # 註冊新的 tRPC Routers
- drizzle/schema.ts                      # (如果使用 Drizzle) 添加新的資料庫表結構
```

## 7. 資安考量

-   **API 安全**：所有 tRPC 端點預設為 `protectedProcedure`，確保只有登入且具備權限的租戶才能存取。
-   **資料庫安全**：將為所有新表建立嚴格的 RLS (Row-Level Security) 政策，確保租戶之間資料完全隔離。所有後端查詢都將在 `tenant_id` 的脈絡下執行。
-   **憑證管理**：Supabase Service Role Key 與 LINE Channel Access Token 將嚴格存放在後端環境變數中，絕不洩漏至前端。
-   **合規性**：內建的醫療法規警示詞庫是本專案的亮點，能主動預防使用者發送違規內容，降低法律風險。

## 8. 開發與交付計畫

我將遵循您批准的階段性交付模式。在您批准此架構文檔後，我將依序進入以下階段：

1.  **資料庫建置**：執行 SQL 腳本建立所有新表。
2.  **後端開發**：開發所有 tRPC Routers。
3.  **前端開發**：開發所有 React 頁面與元件。
4.  **整合與測試**：整合前後端，並進行完整的功能測試。
5.  **交付**：提交所有程式碼變更，並提供最終的驗收清單。

我已完成架構分析，現呈上此開發計畫，懇請審批。
