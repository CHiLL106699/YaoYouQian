# 曜友仟管理雲 (YaoYouQian) 資料庫統一架構修改計畫

> **產出日期**：2026-02-17
> **目標**：將專案從 TiDB (MySQL) + Supabase (PostgreSQL) 的雙資料庫架構，完全統一為純 Supabase PostgreSQL 架構。

---

## 1. 架構分析 (Architecture Analysis)

經過對 `CHiLL106699/YaoYouQian` repo 的完整分析，目前系統狀態如下：

- **雙資料庫依賴**：核心業務邏輯（如預約、客戶、訂單）依賴 TiDB (MySQL)，而行銷、LINE 整合等輔助功能已在使用 Supabase (PostgreSQL)。此架構導致資料分散、維護成本高，且 tRPC router 中存在兩種不同的資料庫客戶端實例，增加了複雜性。
- **Schema 定義**：主要的資料庫 schema 定義於 `drizzle/schema.ts`，使用 `drizzle-orm/mysql-core`，與目標 Supabase (PostgreSQL) 不相容。
- **連線配置**：`server/db.ts` 和 `drizzle.config.ts` 皆指向 TiDB (MySQL) 連線，需全面改寫。
- **資料表缺失**：核心的 `users` 資料表僅存在於 TiDB schema 中，Supabase 資料庫中並無此表，導致認證與使用者資料無法統一管理。
- **環境變數混亂**：存在多組 Supabase 連線變數（`SUPABASE_URL` vs `VITE_SUPABASE_URL`），且部分 router 自行建立 Supabase client，而非使用統一的 `server/supabaseClient.ts`。
- **前端模組錯誤**：`client/src/pages/WhiteLabelSettings.tsx` 和 `ServiceManagement.tsx` 存在對後端模組的不當引用 (`@/lib/storage` 或 `../../../server/storage`)，違反了前端安全原則，應改為透過 tRPC API 進行檔案上傳。
- **SQL 語法差異**：部分程式碼（如 `server/db.ts` 中的 `onDuplicateKeyUpdate`）使用了 MySQL 特有的語法，在 PostgreSQL 中需改為 `onConflict` 或 `.returning()`。

## 2. 資料流向圖 (Data Flow Diagram)

### **修改前 (Current)**

```mermaid
graph TD
    subgraph Frontend (React)
        A[Client Components] --> B{tRPC Client}
    end

    subgraph Backend (Express + tRPC)
        B --> C{tRPC Routers}
        C --> D{TiDB (MySQL) via Drizzle}
        C --> E{Supabase (PostgreSQL) via supabase-js}
    end

    D -- "17 Tables" --> F[Core Data]
    E -- "37 Tables" --> G[Marketing/LINE Data]
```

### **修改後 (Target)**

```mermaid
graph TD
    subgraph Frontend (React)
        A[Client Components] --> B{tRPC Client}
    end

    subgraph Backend (Express + tRPC)
        B --> C{tRPC Routers}
        C --> D{Supabase (PostgreSQL) via Drizzle & supabase-js}
    end

    D -- "All Tables (50+)" --> E[Unified Data]
```

## 3. 預期修改檔案清單 (File Modification List)

| 檔案路徑 | 修改摘要 |
| :--- | :--- |
| `drizzle/schema.ts` | **核心修改**。將所有 `mysqlTable`、`mysqlEnum`、`int`、`varchar` 等改為 `pgTable`、`pgEnum`、`integer`、`varchar` 等 `drizzle-orm/pg-core` 語法。`autoincrement()` 改為 `serial`。 |
| `drizzle.config.ts` | 將 `dialect` 從 `"mysql"` 改為 `"postgresql"`，並更新 `dbCredentials` 指向 Supabase Direct URL。 |
| `package.json` | 移除 `mysql2` 依賴，加入 `pg` 依賴。 |
| `server/db.ts` | **完全重構**。移除 `drizzle-orm/mysql2`，改為使用 `drizzle-orm/node-postgres`。移除 `getDb` 和 `upsertUser`，因為認證將由 Supabase Auth 和新的 `users` 表處理。 |
| `server/supabaseClient.ts` | 統一使用 `process.env.SUPABASE_URL` 和 `process.env.SUPABASE_SERVICE_ROLE_KEY`，移除對 `VITE_` 前綴變數的依賴。 |
| `server/routers/*.ts` (All) | 移除所有自行建立 `createClient` 的實例，統一從 `../supabaseClient` 導入 `supabase`。將所有 MySQL 特有的 `insertId` 或 `onDuplicateKeyUpdate` 邏輯，改為使用 PostgreSQL 的 `.returning()` 或 `onConflict`。 |
| `server/_core/sdk.ts` | 修改 `authenticateRequest` 和 `getUserInfo` 相關邏輯，使其與新的 Supabase `users` 表互動，而非舊的 `db.ts`。 |
| `server/_core/context.ts` | 確保 `User` 型別能正確從新的 `drizzle/schema.ts` 推導。 |
| `shared/types.ts` | 驗證此檔案在 `drizzle/schema.ts` 更新後仍能正確導出類型。 |
| `client/src/pages/WhiteLabelSettings.tsx` | 移除本地檔案處理邏輯，改為呼叫一個新的 tRPC mutation 來處理檔案上傳。 |
| `client/src/pages/ServiceManagement.tsx` | 移除對 `../../../server/storage` 的直接引用，改為呼叫 tRPC mutation。 |
| `client/src/lib/storage.ts` | **新增檔案**。建立一個空的 `storage.ts` 檔案以解決 `WhiteLabelSettings.tsx` 的引用錯誤，但其功能將由 tRPC API 取代。 |
| `.env.example` / `.env` | 統一所有 Supabase 相關環境變數，移除衝突的 `VITE_SUPABASE_URL` 和 `VITE_SUPABASE_ANON_KEY`，確保前後端使用同一組變數。 |

## 4. 執行計畫 (Execution Plan)

1.  **環境準備**：安裝 `pg`，移除 `mysql2`。
2.  **Schema 遷移**：修改 `drizzle/schema.ts` 為 PostgreSQL 語法。
3.  **資料庫建表**：在 Supabase 中手動建立缺失的 `users` 表。
4.  **連線配置更新**：修改 `drizzle.config.ts` 和 `server/db.ts`。
5.  **環境變數統一**：清理並統一所有 Supabase 環境變數。
6.  **tRPC Routers 重構**：逐一修改所有 router，統一 Supabase client 並替換 MySQL 特有語法。
7.  **前端修復**：建立 `client/src/lib/storage.ts` 並修改 `WhiteLabelSettings.tsx` 和 `ServiceManagement.tsx`。
8.  **測試與驗證**：執行 `tsc --noEmit` 和 `pnpm build` 確保所有類型錯誤已修復且專案可成功建構。

---

**請檢閱此計畫。若無異議，請回覆「批准 (Approved)」以開始執行。**
