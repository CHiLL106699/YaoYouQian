# 專案：曜友仟管理雲 (YaoYouQian) - E2E 測試與 CI/CD 導入計畫

## 1. 總體目標

本計畫旨在為「曜友仟管理雲」專案建立一套完整、自動化的端對端 (E2E) 測試框架與持續整合/持續部署 (CI/CD) 流程。目標是確保程式碼的品質、穩定性，並在每次變更後都能安全、快速地部署到生產環境，同時遵循您強調的資安與維護性標準。

## 2. 架構分析

經過對 `CHiLL106699/YaoYouQian` repo 的初步分析，我歸納出以下幾點：

- **技術棧**：專案採用現代化的 TypeScript 全端架構，前端為 React (Vite)，後端使用基於 Express 的 tRPC 伺服器，資料庫為 Supabase (PostgreSQL)，並以 Drizzle ORM 進行操作。
- **程式碼結構**：採用類 Monorepo 的結構，將程式碼分為 `client`、`server`、`shared` 三個主要部分，職責清晰。
- **API 層**：後端 API 透過 tRPC 路由 (`server/routers/`) 提供服務。這是 E2E 測試的核心互動層。測試將直接呼叫這些 tRPC procedure，模擬前端操作，以驗證後端商業邏輯與資料庫互動的正確性。
- **資料庫**：`drizzle/schema.ts` 中定義了完整的資料庫結構，涵蓋了所有核心業務，如租戶、預約、客戶、優惠券等。資料庫中有一個 `id: 1` 的 `測試診所` 租戶可供測試使用。
- **現有測試**：專案中已存在部分使用 `vitest` 撰寫的單元/整合測試，但它們主要針對單一路由或功能，缺乏完整的業務流程驗證，且沒有標準化的測試環境設定與資料清理機制。

## 3. 實施計畫

我將遵循「文檔驅動開發」原則，分階段執行此任務。只有在您批准此計畫後，我才會開始撰寫程式碼。

### Phase 1: 測試基礎設施建置

此階段的目標是建立一個穩固、隔離且可重複的測試環境。

1.  **環境變數管理**：
    - 建立 `.env.test` 檔案，用於存放測試專用的 Supabase 連線資訊與其他密鑰。此檔案將被 `.gitignore` 忽略，確保敏感資訊不上傳至 GitHub。
    - CI 環境中，這些變數將透過 GitHub Secrets 注入。

2.  **Vitest E2E 設定**：
    - 建立一個新的 Vitest 設定檔 `vitest.config.e2e.ts`，專門用於 E2E 測試。
    - 設定 `include: ['tests/e2e/**/*.test.ts']`，將 E2E 測試與單元測試分離。
    - 設定 `globalSetup`，指向一個新的 `tests/e2e/setup.ts` 檔案。

3.  **測試輔助工具 (Test Helpers)**：
    - 建立 `tests/e2e/helpers.ts`，提供以下核心功能：
        - `createTestContext()`: 建立一個包含 tRPC client 和 Supabase client 的測試上下文，並模擬已登入的租戶管理員身份。
        - `clearDatabase()`: 在每次測試執行 *之後*，使用 Supabase Service Role Key 清理所有測試中產生的資料（預約、客戶、優惠券等），確保測試之間的獨立性。將會小心地使用 `DELETE FROM ... WHERE tenant_id = ...` 來避免影響其他租戶資料。
        - `seedData()`: 提供一個可選的函式，用於在特定測試前植入必要的基礎資料。

### Phase 2: E2E 測試案例撰寫

我將根據您的需求，在 `tests/e2e/` 目錄下逐一建立以下測試檔案，並撰寫完整的測試案例。

| 測試檔案 | 核心測試流程 | 驗證重點 |
| :--- | :--- | :--- |
| `booking.test.ts` | 建立預約 → 查詢DB確認 → 列表查詢 → 取消預約 | 時段衝突、日期篩選、資料庫寫入與狀態變更的正確性 |
| `coupon.test.ts` | 建立優惠券 → 使用 → 驗證次數 → 拒絕過期券 | 使用次數 (`usage_count`) 的增減、日期有效性判斷 |
| `voucher.test.ts` | 發行票券 → 核銷 → 統計使用率 | 票券狀態變更、核銷邏輯、統計準確性 |
| `customer.test.ts` | 建立客戶 → 更新資料 → 打標籤 → 依標籤篩選 | 客戶資料的 CRUD、`customer_tags` 關聯表的正確操作 |
| `member-level.test.ts` | 建立會員等級 → 客戶升級 → 驗證權益 | `member_levels` 的建立、客戶 `member_level` 欄位的更新 |
| `marketing.test.ts` | 建立行銷活動 → 設定目標受眾 → 驗證推播邏輯 | `marketing_campaigns` 的建立、目標受眾篩選邏輯（雖然不實際發送，但會驗證目標列表的正確性） |
| `tenant.test.ts` | 租戶註冊 → 登入 → 設定 → 訂閱 | `tenants`、`tenant_subscriptions` 表的建立與更新，身份驗證流程 |

### Phase 3: CI/CD 與 GitHub 模板建置

此階段專注於自動化流程與改善協作體驗。

1.  **建立 `.github/workflows/` 目錄**：
    - **`ci.yml`**: 如您所要求，設定在 `push` 和 `pull_request` 到 `main` 分支時觸發。流程包含：`checkout`, `setup node 20`, `pnpm install`, `tsc --noEmit`, `vitest run -c vitest.config.e2e.ts`, `pnpm build`。環境變數將使用 `secrets.SUPABASE_SERVICE_ROLE_KEY` 等。
    - **`deploy.yml`**: 設定在 `ci.yml` 成功完成後，針對 `main` 分支的 `push` 事件觸發。此處將先使用一個 placeholder 的部署腳本，待您提供具體的部署方式（例如 Vercel, Fly.io, 或其他）後再進行完善。
    - **`seed.yml`**: 建立一個可手動觸發 (`workflow_dispatch`) 的 workflow，用於在需要時執行資料庫種子腳本 (e.g., `pnpm db:seed`)。

2.  **建立 `.github/` 模板**：
    - **`PULL_REQUEST_TEMPLATE.md`**: 建立一個標準的 PR 模板，包含變更摘要、測試說明、相關 Issue 等欄位。
    - **`ISSUE_TEMPLATE/bug_report.md`**: 建立 Bug 回報模板。
    - **`ISSUE_TEMPLATE/feature_request.md`**: 建立功能請求模板。

## 4. 預期修改檔案清單

- **新增檔案**:
    - `.env.test`
    - `vitest.config.e2e.ts`
    - `tests/e2e/setup.ts`
    - `tests/e2e/helpers.ts`
    - `tests/e2e/booking.test.ts`
    - `tests/e2e/coupon.test.ts`
    - `tests/e2e/voucher.test.ts`
    - `tests/e2e/customer.test.ts`
    - `tests/e2e/member-level.test.ts`
    - `tests/e2e/marketing.test.ts`
    - `tests/e2e/tenant.test.ts`
    - `.github/workflows/ci.yml`
    - `.github/workflows/deploy.yml`
    - `.github/workflows/seed.yml`
    - `.github/PULL_REQUEST_TEMPLATE.md`
    - `.github/ISSUE_TEMPLATE/bug_report.md`
    - `.github/ISSUE_TEMPLATE/feature_request.md`
- **可能修改的檔案**:
    - `package.json`: 新增測試相關的 script，例如 `"test:e2e": "vitest run -c vitest.config.e2e.ts"`。
    - `.gitignore`: 新增 `.env.test`。

## 5. 結論

此計畫提供了一個清晰、分階段的執行路徑。我將嚴格遵循 Supabase RLS 的安全模型，所有測試操作都將在指定的測試租戶下進行，確保不會影響任何現有或未來的生產資料。所有敏感金鑰將透過安全的環境變數機制管理。

請審核此計畫。若您批准，我將立即進入 **Phase 1: 測試基礎設施建置**。
