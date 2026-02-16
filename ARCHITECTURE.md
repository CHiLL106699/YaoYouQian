# 曜友仟管理雲：EMR 與預約提醒模組開發計畫

**作者：** Manus AI
**日期：** 2026年2月17日

## 1. 專案背景與目標

本文件旨在規劃「曜友仟管理雲」的兩大核心功能模組：**智能會員與影像病歷系統 (EMR)** 以及 **多層次智能預約與自動提醒系統**。計畫將遵循使用者要求的技術棧與開發規範，在現有專案基礎上進行擴充，確保新舊功能無縫整合、代碼可維護性與資訊安全。

## 2. 現有架構分析

在 clone `CHiLL106699/YaoYouQian` repo 並進行全面分析後，歸納出以下關鍵架構與開發模式：

| 構面 | 分析結果 |
| :--- | :--- |
| **專案結構** | 採用 Monorepo 架構，`client/` (Vite + React) 和 `server/` (Node.js + Express) 分離。 |
| **前端框架** | 使用 React v19、TypeScript、TailwindCSS 及 shadcn/ui 元件庫，確保了現代化的 UI/UX 與開發效率。 |
| **前端路由** | `wouter` 函式庫負責路由管理。需在 `client/src/App.tsx` 中註冊新頁面路由。 |
| **狀態管理** | 全域狀態主要透過 React Context API 管理，例如 `TenantProvider` 提供 `tenantId`。 |
| **後端 API** | `tRPC` 作為主要的 API 層，提供型別安全的端對端開發體驗。後端 tRPC Router 透過 `supabase-js` 客戶端與資料庫互動。 |
| **資料庫** | Supabase (PostgreSQL) 作為核心資料庫。後端服務透過 `service_role` 金鑰進行操作，符合安全實踐。 |
| **身分驗證** | Supabase Auth 負責使用者驗證與會話管理。前端透過 `useAuth` hook 取得使用者資訊。 |
| **檔案儲存** | 專案中已有 `customerPhotoRouter.ts`，但檔案上傳邏輯尚未完全實現。將採用 Supabase Storage 作為統一的檔案儲存方案。 |
| **排程任務** | 專案中存在 `supabase/functions/send-booking-reminder` 的 Edge Function，顯示現有模式是利用 Supabase 的排程功能 (pg_cron) 觸發 Edge Function 來執行背景任務。 |

## 3. 開發計畫與資料流設計

基於以上分析，我將遵循現有模式，提出以下開發計畫與資料流圖。

### 3.1. 模組一：智能會員與影像病歷系統 (EMR)

此模組旨在建立一個完整的病歷管理系統，包含病歷記錄、影像管理及電子同意書簽署。

#### 資料庫結構 (Supabase)

將建立以下三個核心資料表：

- `medical_records`: 儲存核心病歷資訊。
- `medical_photos`: 儲存與病歷關聯的影像，並透過 `photo_type` 區分術前、術後、進程中照片。
- `consent_forms`: 儲存病患簽署的電子同意書，簽名將以 Base64 格式儲存於 `signature_data` 欄位。

#### 資料流向圖

```mermaid
flowchart TD
    subgraph Client (React)
        A[MedicalRecordManagement.tsx] -- tRPC --> B
        C[BeforeAfterSlider.tsx] -- 讀取照片 --> B
        D[ConsentFormManagement.tsx] -- tRPC --> E
        F[SignaturePad.tsx] -- 產生 Base64 簽名 --> D
    end

    subgraph Server (tRPC)
        B[medicalRecordRouter.ts] -- Supabase Client --> G[medical_records]
        H[medicalPhotoRouter.ts] -- Supabase Client --> I[medical_photos]
        H -- Supabase Storage --> J[檔案儲存 Bucket]
        E[consentFormRouter.ts] -- Supabase Client --> K[consent_forms]
    end

    subgraph Supabase
        G
        I
        J
        K
    end

    A -- 讀取/寫入 --> B
    D -- 讀取/寫入 --> E
    A -- 觸發照片上傳 --> H
```

### 3.2. 模組二：多層次智能預約與自動提醒

此模組旨在實現一個高併發安全的預約系統，並能自動透過 LINE 發送多階段提醒。

#### 資料庫結構 (Supabase)

將建立以下兩個支援功能的資料表：

- `appointment_reminders`: 記錄所有已發送的提醒，用於追蹤與避免重複發送。
- `appointment_locks`: 預約鎖定表，透過資料庫 Transaction 與 Row-level locking 防止在高併發場景下同一時段被超賣。

#### 資料流向圖

```mermaid
flowchart TD
    subgraph Client (React)
        L[ReminderSettings.tsx] -- tRPC --> M[appointmentReminderRouter.ts]
        N[ReminderHistory.tsx] -- tRPC --> M
    end

    subgraph Server (tRPC)
        M -- Supabase Client --> O[appointment_reminders]
        P[appointmentLock.ts] -- Supabase Transaction --> Q[appointment_locks]
    end

    subgraph Supabase
        O
        Q
        R[pg_cron Scheduler] -- 觸發 --> S[Edge Function: reminderScheduler]
    end

    subgraph Supabase Edge Function
        S -- 讀取預約 --> T[appointments]
        S -- 寫入記錄 --> O
        S -- LINE Messaging API --> U[LINE 使用者]
    end
```

## 4. 預計新增/修改的檔案清單

根據上述計畫，將會新增或修改以下檔案：

| 類型 | 路徑 | 說明 |
| :--- | :--- | :--- |
| **後端 Router** | `server/routers/medicalRecordRouter.ts` | 新增：病歷 CRUD。 |
| | `server/routers/medicalPhotoRouter.ts` | 新增：影像上傳與查詢。 |
| | `server/routers/consentFormRouter.ts` | 新增：同意書 CRUD。 |
| | `server/routers/appointmentReminderRouter.ts` | 新增：提醒設定與歷史查詢。 |
| **後端工具** | `server/utils/appointmentLock.ts` | 新增：預約鎖定機制。 |
| **排程任務** | `supabase/functions/reminderScheduler/index.ts` | 新增：掃描預約並發送 LINE 提醒的背景邏輯。 |
| **前端頁面** | `client/src/pages/MedicalRecordManagement.tsx` | 新增：病歷管理主頁面。 |
| | `client/src/pages/ConsentFormManagement.tsx` | 新增：同意書管理主頁面。 |
| | `client/src/pages/ReminderSettings.tsx` | 新增：預約提醒設定頁面。 |
| | `client/src/pages/ReminderHistory.tsx` | 新增：提醒發送歷史頁面。 |
| **前端元件** | `client/src/components/BeforeAfterSlider.tsx` | 新增：術前術後照片滑動比對元件。 |
| | `client/src/components/SignaturePad.tsx` | 新增：電子簽名 Canvas 元件。 |
| **核心整合** | `server/routers.ts` | 修改：註冊上述四個新的 tRPC Router。 |
| | `client/src/App.tsx` | 修改：加入 `/medical-records`, `/consent-forms`, `/reminder-settings`, `/reminder-history` 四個路由。 |
| | `client/src/components/DashboardLayout.tsx` | 修改：在側邊欄加入對應的功能導航連結。 |

## 5. 開發步驟規劃

我將遵循以下階段進行開發，確保每個階段的交付物都符合預期：

1.  **Phase 1: 資料庫建置** - 根據設計在 Supabase 中建立所有新資料表。
2.  **Phase 2: 後端開發** - 開發所有 tRPC Router、工具函式庫及 Edge Function。
3.  **Phase 3: 前端開發** - 開發所有 React 頁面與元件。
4.  **Phase 4: 整合與測試** - 將前後端串接，註冊路由與導航，並進行完整的功能測試與 `tsc --noEmit`、`pnpm build` 驗證。
5.  **Phase 5: 交付** - 將所有代碼 push 至 GitHub repo，並提供最終的檔案變更清單。

---

此架構分析與開發計畫已完成。若您批准此計畫，我將立即開始第一階段的開發工作。
