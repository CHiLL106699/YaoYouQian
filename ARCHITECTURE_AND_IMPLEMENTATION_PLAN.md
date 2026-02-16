# 架構分析與實作計畫：曜友仟管理雲功能補齊

## 1. 專案現況分析 (Code Review)

在 Clone 專案並詳盡分析 `todo.md` 與現有程式碼後，我得出以下結論：多數待辦功能已有相當完整的骨架 (Scaffolding)，甚至部分功能已接近完成。這表示我們的任務核心將是「**完善與整合 (Refinement and Integration)**」，而非從零開發。

| 功能模組 | 檔案路徑 | 現況分析 |
| :--- | :--- | :--- |
| **預約日曆** | `client/src/pages/AppointmentManagement.tsx` | **已實作**。頁面內建 `ListView` 與 `CalendarView` 雙模式切換，月曆視圖可正確顯示當月預約摘要，並能點擊查詢單日詳情。`appointmentRouter` 也已支援 `startDate` / `endDate` 範圍查詢，效能良好。 |
| **LIFF 會員中心** | `client/src/pages/LiffMemberCenter.tsx` | **已實作**。頁面具備完整的會員卡、功能選單、預約記錄（即將到來/歷史紀錄）顯示。已串接 `customer.getByLineUserId` 和 `booking.listByCustomer` API。 |
| **LIFF 術後護理** | `client/src/pages/LiffCare.tsx` | **已實作**。頁面能根據 `tenantId` 抓取 `aftercare_contents` 並以手風琴 (Accordion) 樣式展示。已處理 `instructions` 為 `string[]` 或 `{dos, donts}` 的不同格式。 |
| **術後護理圖卡推播** | `server/line/lineWebhook.ts` | **已實作**。Webhook 能正確識別「術後護理」關鍵字，並以 Carousel 形式回覆 `aftercare_contents` 的 Flex Message。Postback 回調 (`action=aftercare`) 也已實作，能顯示完整圖卡。 |
| **預約時段選擇** | `client/src/pages/BookingForm.tsx` | **骨架存在但未聯動**。目前前端顯示的是靜態的 `timeSlots` 陣列，尚未與後端 `bookingRouter.getAvailableSlots` 或 `slotCalculatorRouter` API 聯動。 |
| **票券系統** | `server/routers/voucherRouter.ts`<br>`client/src/pages/VoucherManagement.tsx` | **已實作**。後端 API 包含 `list`, `create`, `redeem`, `stats`。前端頁面也已完成對應的發行、列表、統計與核銷功能。 |
| **會員分眾行銷** | `server/routers/marketingRouter.ts`<br>`client/src/pages/MarketingCampaignManagement.tsx` | **已實作**。後端 API 包含 `list`, `create`, `send`, `stats`。前端頁面也已完成建立活動、篩選條件、發送與統計功能。 |
| **自動化時段計算** | `server/routers/slotCalculatorRouter.ts`<br>`client/src/pages/SlotCalculatorManagement.tsx` | **已實作**。後端 API 包含 `calculate` (單日) 和 `calculateBatch` (批次)。前端頁面也已完成對應的查詢與批次生成介面。 |
| **程式碼健康度** | 全專案 | **極佳**。執行 `pnpm install` 後，`npx tsc --noEmit` 編譯檢查結果為 **0 個錯誤**。 |

**核心發現**：`todo.md` 中所列的「未完成」項目，絕大多數在先前的開發階段（Phase 12, 14, 15）中已被實作。目前真正的 **Gap** 僅剩下三項：

1.  **前端預約表單** 與 **後端可用時段 API** 的整合。
2.  缺乏 **術後護理衛教的種子資料**，導致 LINE Bot 功能無法實際驗證。
3.  部分前端頁面（如 `ServiceManagement.tsx`）雖已存在，但未在 `App.tsx` 中註冊路由。

## 2. 實作計畫 (Implementation Plan)

基於上述分析，我將專注於補齊真正的功能缺口，並進行全面的整合測試。以下是我的實作計畫：

### Phase 1: 核心功能整合與資料填充

此階段目標是將現有但分散的元件徹底整合，並填入必要資料使其完整運作。

1.  **預約表單時段聯動**
    *   **目標**：將 `BookingForm.tsx` 的靜態時段改為動態拉取。
    *   **修改檔案**：`client/src/pages/BookingForm.tsx`
    *   **實作邏輯**：
        1.  移除靜態的 `timeSlots` 陣列。
        2.  引入 `trpc.booking.getAvailableSlots.useQuery`。
        3.  當使用者選擇日期 (`date`) 時，觸發 `getAvailableSlots` 查詢。
        4.  將回傳的可用時段（`isAvailable: true`）動態渲染到時段選擇的 `<Select>` 元件中。
        5.  處理 `isLoading` 狀態，在時段加載中顯示提示。

2.  **新增術後護理種子資料**
    *   **目標**：在 `aftercare_contents` 表中新增多筆衛教資料，以供 LINE Bot 測試。
    *   **修改檔案**：`server/seed/aftercareSeed.ts` (新增此檔案)
    *   **實作邏輯**：
        1.  建立一個獨立的 `seed` 腳本，使用 Supabase Client 連線資料庫。
        2.  定義涵蓋「雷射」、「注射」、「手術」三大分類的衛教內容陣列。
        3.  每筆資料包含 `tenant_id`, `category`, `treatment_name`, `instructions` (`{dos, donts}` 格式), `image_url` 等欄位。
        4.  執行此腳本將資料 `upsert` 至 `aftercare_contents` 表。

3.  **修復缺失的前端路由**
    *   **目標**：將已存在但未註冊的頁面加入路由，確保可從側邊欄訪問。
    *   **修改檔案**：`client/src/App.tsx`
    *   **實作邏輯**：
        1.  `import ServiceManagement from "./pages/ServiceManagement";`
        2.  在 `<Switch>` 中新增 `<Route path="/services">{() => <DashboardPage component={ServiceManagement} />}</Route>`。
        3.  比對 `DashboardLayout.tsx` 中的 `menuItems` 與 `App.tsx` 中的路由，確保所有後台頁面都已註冊。

### Phase 2: 驗證與交付

1.  **功能驗證**：
    *   **預約流程**：開啟 `/booking` 頁面，確認選擇日期後，時段能動態載入。成功提交預約。
    *   **LINE Bot 互動**：對 LINE Bot 發送「術後護理」，確認收到包含種子資料的 Flex Message Carousel。點擊「查看完整護理須知」能觸發 postback 並顯示完整圖卡。
    *   **後台頁面**：點擊後台側邊欄所有連結，確認 `ServiceManagement` 等先前無法訪問的頁面現在能正常載入。

2.  **最終檢查**：
    *   再次執行 `npx tsc --noEmit`，確保無任何 TypeScript 錯誤。
    *   整理所有修改過的檔案清單。

3.  **程式碼提交**：
    *   `git add .`
    *   `git commit -m "feat: Complete all missing features and integrate components"`
    *   `git push origin main`

## 3. 預期修改檔案清單

*   `client/src/pages/BookingForm.tsx`
*   `client/src/App.tsx`
*   `server/seed/aftercareSeed.ts` (新檔案)
*   `package.json` (新增 `db:seed` 腳本指令)

此計畫旨在以最高效率、最小改動的方式完成所有待辦事項，並確保系統的穩定與完整。計畫已就緒，靜待您的批准即可。
