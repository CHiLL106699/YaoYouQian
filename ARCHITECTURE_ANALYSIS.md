# 架構分析與改造計畫：YaoYouQian 管理雲

**作者：** Manus AI (資深全端執行者)
**日期：** 2026年2月17日
**狀態：** 草案，待批准 (Draft, Pending Approval)

## 1. 專案背景與目標

本文件旨在分析 `YaoYouQian` (曜友仟) 專案的現有技術架構，並根據新的業務需求提出一個清晰、可執行的改造計畫。此計畫將遵循您提出的**資安優先**、**文檔驅動**與**階段性交付**三大核心原則。

核心目標是將 `YaoYouQian` 改造為一個可擴展、可維護、且符合多租戶 (Multi-tenant) SaaS 標準的系統，同時整合 `YOKAGE` 的遊戲化行銷功能，並優化客戶在 LINE LIFF 環境中的使用者體驗。

## 2. 現有架構分析

在 Clone `CHiLL106699/YaoYouQian` Repo 並進行初步分析後，我對當前系統的理解如下：

| 組件 | 技術棧 | 分析 | 
| :--- | :--- | :--- | 
| **前端** | React, TypeScript, Vite, Wouter, TailwindCSS | 採用現代化的前端技術，組件化程度高。路由管理使用 `wouter`，UI 元件庫為 `shadcn/ui`。目前路由結構較為扁平，未完全區分客戶端、員工端與管理後台。 | 
| **後端** | Node.js, Express, tRPC | 使用 tRPC 提供型別安全的 API。目前的 tRPC Router (`appRouter`) 結構為單層，所有功能模組的 Router 都直接掛載在根路由下，缺乏分層管理。 | 
| **資料庫** | PostgreSQL, Drizzle ORM | 使用 Drizzle 作為 ORM，與 PostgreSQL 資料庫互動。資料庫 Schema 定義在 `drizzle/schema.ts`。`tenants` 資料表缺少必要的欄位以支援多產品線與功能模組化。 | 
| **認證** | 自訂義 OAuth (Manus OAuth) | 透過 `server/_core/context.ts` 處理使用者認證，並將使用者資訊注入 tRPC context。 | 
| **LIFF 整合** | `@line/liff` SDK | 前端已整合 LIFF SDK，並有數個 LIFF 頁面 (`LiffMemberCenter`, `LiffCare`, `liff/BookingForm` 等)，但功能與路由分散，未形成統一的會員中心體驗。 | 

**總體評價：** 專案基礎良好，但為了支援更複雜的 SaaS 業務邏輯，後端路由架構、資料庫 Schema 以及前端路由都需要進行結構性重構。

## 3. 改造計畫 (Proposed Architecture)

為達成專案目標，我將執行以下改造計畫，分為後端、前端兩大部分。

### 3.1. 資料流向圖 (Data Flow Diagram)

下圖展示了改造後的核心資料流動路徑，特別是 tRPC 三層架構與 Feature Gating 中間件的角色。

```mermaid
graph TD
    subgraph LINE/Web Browser
        A[LIFF Client] -->|tRPC Request| B{tRPC Gateway};
        C[LIFF Staff] -->|tRPC Request| B;
        D[Web Manage] -->|tRPC Request| B;
    end

    subgraph Backend Server
        B --> E{Feature Gating Middleware};
        E -->|Shared Logic| F[coreRouter];
        E -->|YaoYouQian Specific| G[lineRouter];
    end

    subgraph tRPC Routers
        F --> F1[appointmentRouter];
        F --> F2[customerRouter];
        F --> F_GAME[gamificationRouter];
        F --> F_ETC[...];

        G --> G1[liffAuthRouter];
        G --> G2[linePayRouter];
        G --> G3[liffBookingRouter];
        G --> G_MEMBER[liffMemberRouter];
    end

    subgraph Database (Supabase/Postgres)
        F1 --> H[(DB)];
        F2 --> H;
        F_GAME --> H;
        G1 --> H;
        G2 --> H;
        G3 --> H;
        G_MEMBER --> H;
    end

    E -- Check Tenant Plan & Modules --> H;
```

**流程說明：**

1.  所有來自前端（LIFF 或 Web）的請求都先進入 tRPC Gateway。
2.  **Feature Gating Middleware** 會攔截請求，讀取 `tenants` 表中的 `plan_type` 和 `enabled_modules`。
3.  根據租戶的方案和啟用的模組，中間件決定此請求是否被允許，實現功能門控。
4.  請求被分發到對應的 Router：
    *   **coreRouter**: 處理所有產品線（YOKAGE, YaoYouQian）共用的核心邏輯，如預約、客戶管理、以及新加入的**遊戲化行銷 (gamificationRouter)**。
    *   **lineRouter**: 處理專屬於 YaoYouQian (LINE 環境) 的強化功能，如 LIFF 內的預約流程、會員中心、LINE Pay 等。
5.  各個子 Router 執行商業邏輯，並與資料庫進行互動。

### 3.2. 後端改造：Schema 與 tRPC 架構

| 任務 | 描述 | 預計修改檔案 | 
| :--- | :--- | :--- | 
| **Drizzle Schema 整合** | 在 `tenants` 表中新增 `plan_type`, `enabled_modules`, `source_product` 欄位，以區分不同 SaaS 產品及其功能。 | `drizzle/schema.ts` | 
| **產出 Migration SQL** | 根據更新後的 Schema，使用 `drizzle-kit` 產生對應的 SQL 遷移腳本。 | `drizzle/migrations/` | 
| **tRPC 三層架構** | 重構 `server/routers.ts`，建立 `coreRouter` 和 `lineRouter`，並將現有及新增的 Router 歸類進去。 | `server/routers.ts`, `server/routers/coreRouter.ts`, `server/routers/lineRouter.ts` (new) | 
| **Feature Gating Middleware** | 在 `server/_core/trpc.ts` 中建立一個新的 tRPC 中間件，用於檢查租戶權限。 | `server/_core/trpc.ts` | 
| **遊戲化 Router** | 建立 `gamificationRouter` 並將其放置在 `coreRouter` 層。 | `server/routers/gamificationRouter.ts` (new) | 

### 3.3. 前端改造：路由與功能整合

| 任務 | 描述 | 預計修改/新增檔案 | 
| :--- | :--- | :--- | 
| **LIFF 客戶端路由** | 根據需求重構 `/liff/*` 路由，整合預約功能至會員中心。 | `client/src/App.tsx`, `client/src/pages/LiffMemberCenter.tsx`, `client/src/pages/liff/Booking.tsx` (new), `client/src/pages/liff/Shop.tsx` (new), `client/src/pages/liff/News.tsx` (new), `client/src/pages/liff/Consent.tsx` (new), `client/src/pages/liff/Gamification.tsx` (new) | 
| **LIFF 員工端路由** | 建立 `/liff/staff/*` 相關頁面，提供員工專用功能。 | `client/src/App.tsx`, `client/src/pages/liff/staff/*` (new) | 
| **Web 管理後台路由** | 建立 `/manage/*` 相關頁面，用於後台管理。 | `client/src/App.tsx`, `client/src/pages/manage/*` (new) | 
| **會員中心整合** | 重構 `LiffMemberCenter.tsx`，以 Tab 形式整合「我的預約」功能，包含查詢、取消、修改。 | `client/src/pages/LiffMemberCenter.tsx` | 

## 4. 執行計畫與風險評估

我將嚴格按照以下階段執行，並在每個階段完成後向您匯報，待您批准後再進行下一步。

*   **Phase 1: 架構批准 (本文件)**
*   **Phase 2: 資料庫 Schema 修改與遷移**
*   **Phase 3: 後端 tRPC 路由重構**
*   **Phase 4: 前端路由結構建立 (空頁面)**
*   **Phase 5: 核心功能實現 (會員中心整合預約、遊戲化)**
*   **Phase 6: 其餘頁面功能開發**
*   **Phase 7: 整合測試與 Build 驗證**
*   **Phase 8: 產出報告與 Push to GitHub**

**潛在風險：**
1.  **tRPC 路由重構**：可能影響現有 API 的路徑，需要全面測試以確保向後兼容或在前端同步修改。
2.  **LIFF 頁面整合**：在單一頁面 (`LiffMemberCenter`) 中整合多個 Tab 和複雜的狀態管理，需要謹慎設計以避免性能問題。

我已完成初步分析和規劃。請審核此架構分析文件。若您批准 (Approved)，我將立即開始執行 Phase 2。
