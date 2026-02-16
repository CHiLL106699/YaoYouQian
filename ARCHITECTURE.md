# 曜友仟管理雲：新功能模組架構分析

## 1. 專案目標

本文件旨在規劃與說明「曜友仟管理雲」兩大核心功能模組的開發架構：
1.  **多角色自動分潤系統 (HRM/Payroll)**
2.  **庫存與耗材聯動扣抵 (ERP)**

此分析將遵循現有專案的技術棧（React, tRPC, Supabase）與代碼風格，確保新功能無縫整合且符合資安與可維護性標準。

## 2. 資料庫架構 (Database Schema)

將於 Supabase 資料庫中建立以下資料表。所有資料表都將包含 `tenant_id` 以符合多租戶架構的 RLS（Row-Level Security）策略。

### 2.1 HRM/Payroll 相關資料表

```sql
-- 員工資料表
CREATE TABLE staff (
    id BIGINT PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
    tenant_id BIGINT NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    role_type VARCHAR(50) NOT NULL CHECK (role_type IN ('consultant', 'doctor', 'nurse', 'admin')),
    line_user_id VARCHAR(255) UNIQUE,
    phone VARCHAR(50),
    email VARCHAR(255) UNIQUE,
    base_salary DECIMAL(12, 2) DEFAULT 0.00,
    status VARCHAR(50) NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'archived')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 分潤規則表
CREATE TABLE commission_rules (
    id BIGINT PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
    tenant_id BIGINT NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    service_id BIGINT REFERENCES services(id) ON DELETE SET NULL, -- 可針對特定服務或通用角色
    role_type VARCHAR(50) NOT NULL CHECK (role_type IN ('consultant', 'doctor', 'nurse', 'admin')),
    commission_rate DECIMAL(5, 4) NOT NULL, -- 例如 0.1000 代表 10%
    condition_type VARCHAR(50) NOT NULL DEFAULT 'immediate' CHECK (condition_type IN ('immediate', 'deferred', 'milestone')),
    condition_value JSONB, -- 儲存遞延或里程碑的具體條件
    description TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(tenant_id, service_id, role_type) -- 確保規則的唯一性
);

-- 訂單-員工角色關聯表 (多對多)
CREATE TABLE staff_order_roles (
    order_id BIGINT NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
    staff_id BIGINT NOT NULL REFERENCES staff(id) ON DELETE CASCADE,
    role_type VARCHAR(50) NOT NULL CHECK (role_type IN ('consultant', 'doctor', 'nurse', 'admin')),
    PRIMARY KEY (order_id, staff_id, role_type)
);

-- 分潤記錄表
CREATE TABLE commission_records (
    id BIGINT PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
    order_id BIGINT NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
    staff_id BIGINT NOT NULL REFERENCES staff(id) ON DELETE CASCADE,
    tenant_id BIGINT NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    role_type VARCHAR(50) NOT NULL,
    amount DECIMAL(12, 2) NOT NULL, -- 分潤金額
    rate DECIMAL(5, 4) NOT NULL, -- 當下套用的比率
    status VARCHAR(50) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'partial', 'paid', 'cancelled')),
    paid_at TIMESTAMPTZ,
    deferred_conditions JSONB, -- 記錄當時的遞延條件
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
```

### 2.2 ERP 相關資料表

```sql
-- 庫存品項表
CREATE TABLE inventory (
    id BIGINT PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
    tenant_id BIGINT NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    item_name VARCHAR(255) NOT NULL,
    sku VARCHAR(100) UNIQUE,
    category VARCHAR(100),
    unit VARCHAR(50) NOT NULL,
    stock_quantity INTEGER NOT NULL DEFAULT 0,
    safety_threshold INTEGER NOT NULL DEFAULT 0,
    cost_price DECIMAL(10, 2),
    supplier VARCHAR(255),
    last_restocked_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 服務物料清單 (BOM)
CREATE TABLE service_materials (
    id BIGINT PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
    service_id BIGINT NOT NULL REFERENCES services(id) ON DELETE CASCADE,
    inventory_id BIGINT NOT NULL REFERENCES inventory(id) ON DELETE CASCADE,
    tenant_id BIGINT NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    quantity_per_use DECIMAL(10, 2) NOT NULL,
    unit VARCHAR(50) NOT NULL,
    notes TEXT,
    UNIQUE(service_id, inventory_id)
);

-- 庫存異動記錄表
CREATE TABLE inventory_transactions (
    id BIGINT PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
    inventory_id BIGINT NOT NULL REFERENCES inventory(id) ON DELETE RESTRICT,
    tenant_id BIGINT NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    transaction_type VARCHAR(50) NOT NULL CHECK (transaction_type IN ('consume', 'restock', 'adjust', 'return')),
    quantity INTEGER NOT NULL, -- 正數為增加，負數為減少
    reference_id BIGINT, -- 關聯的訂單ID、採購單ID等
    reference_type VARCHAR(100), -- 例如 'order', 'purchase'
    operator_id BIGINT REFERENCES staff(id), -- 操作人員
    notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 低庫存警示表
CREATE TABLE low_stock_alerts (
    id BIGINT PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
    inventory_id BIGINT NOT NULL REFERENCES inventory(id) ON DELETE CASCADE,
    tenant_id BIGINT NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    current_stock INTEGER NOT NULL,
    threshold INTEGER NOT NULL,
    alert_type VARCHAR(50) NOT NULL CHECK (alert_type IN ('warning', 'critical')),
    notified_at TIMESTAMPTZ,
    resolved_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
```

## 3. 資料流向圖 (Data Flow Diagram)

以下為核心業務邏輯的資料流向。

### 3.1 自動分潤流程

```mermaid
graph TD
    A[訂單完成] --> B{觸發分潤計算};
    B --> C{讀取 staff_order_roles};
    C --> D{找出參與員工與角色};
    D --> E{讀取 commission_rules};
    E --> F{比對 service_id 和 role_type};
    F --> G{計算分潤金額};
    G --> H{判斷 condition_type};
    H -- immediate --> I[建立 commission_records (status=pending)];
    H -- deferred/milestone --> J[建立 commission_records (status=partial, 記錄觸發條件)];
    K[管理者手動觸發] --> L{更新 commission_records (status=paid)};
    M[批次發放] --> L;
```

### 3.2 自動扣庫存流程

```mermaid
graph TD
    A[護理師點擊「療程完成」] --> B{觸發庫存扣抵};
    B --> C{讀取 service_materials (BOM)};
    C --> D{找出對應耗材與數量};
    D --> E{For each 耗材...};
    E --> F[更新 inventory.stock_quantity];
    F --> G[建立 inventory_transactions 記錄];
    G --> H{檢查庫存是否低於安全水位};
    H -- Yes --> I[建立 low_stock_alerts 記錄];
    H -- No --> J[結束];
    I --> K[發送通知給管理者];
```

## 4. 後端架構 (Backend Architecture)

將遵循現有的 tRPC 模式，在 `server/routers/` 目錄下建立新的 Router 檔案，並在 `server/routers.ts` 中註冊。

### 4.1 HRM/Payroll Routers

-   **`server/routers/staffRouter.ts`**
    -   `list`: `protectedProcedure` - 查詢員工列表，可按角色篩選。
    -   `create`: `adminProcedure` - 新增員工。
    -   `update`: `adminProcedure` - 更新員工資料。
    -   `set_status`: `adminProcedure` - 變更員工狀態 (active/inactive)。
-   **`server/routers/commissionRouter.ts`**
    -   `rules.list`: `protectedProcedure` - 查詢分潤規則列表。
    -   `rules.create`: `adminProcedure` - 新增分潤規則。
    -   `rules.update`: `adminProcedure` - 更新分潤規則。
    -   `rules.delete`: `adminProcedure` - 刪除分潤規則。
    -   `records.list`: `protectedProcedure` - 查詢分潤記錄，可按員工、月份、狀態篩選。
    -   `records.trigger_deferred`: `adminProcedure` - 手動觸發遞延條件。
    -   `records.batch_payout`: `adminProcedure` - 批次發放分潤，更新記錄狀態為 `paid`。
    -   `reports.by_staff`: `protectedProcedure` - 產生指定員工的分潤報表。
-   **`server/routers/orderRouter.ts` (修改)**
    -   `assign_staff`: `protectedProcedure` - 為訂單指派不同角色的員工 (寫入 `staff_order_roles`)。
    -   `complete_order`: `protectedProcedure` (修改) - 在訂單完成邏輯中，加入呼叫分潤計算的觸發器。

### 4.2 ERP Routers

-   **`server/routers/inventoryRouter.ts`**
    -   `list`: `protectedProcedure` - 查詢庫存列表，可篩選低於安全水位的品項。
    -   `create`: `adminProcedure` - 新增庫存品項。
    -   `update`: `adminProcedure` - 更新庫存品項。
    -   `restock`: `adminProcedure` - 登記進貨，增加庫存數量。
    -   `adjust`: `adminProcedure` - 手動調整庫存數量。
-   **`server/routers/serviceMaterialRouter.ts`**
    -   `list`: `protectedProcedure` - 查詢指定服務的 BOM 物料清單。
    -   `set`: `adminProcedure` - 設定/更新一個服務的 BOM。
-   **`server/routers/inventoryTransactionRouter.ts`**
    -   `list`: `protectedProcedure` - 查詢庫存異動歷史記錄。
-   **`server/routers/lowStockAlertRouter.ts`**
    -   `list`: `protectedProcedure` - 查詢所有未解決的低庫存警示。
    -   `resolve`: `adminProcedure` - 標記警示為已處理。

## 5. 前端架構 (Frontend Architecture)

將在 `client/src/pages/` 目錄下建立新的頁面元件，並使用 `wouter` 在 `client/src/App.tsx` 中設定路由。所有需授權的頁面都將由 `DashboardLayout` 元件包裹。

### 5.1 HRM/Payroll 頁面

-   `client/src/pages/StaffManagement.tsx` (`/staff`)
-   `client/src/pages/CommissionRuleManagement.tsx` (`/commission-rules`)
-   `client/src/pages/CommissionDashboard.tsx` (`/commission-dashboard`)
-   `client/src/pages/OrderStaffAssignment.tsx` (`/order-staff-assignment`)

### 5.2 ERP 頁面

-   `client/src/pages/InventoryManagement.tsx` (`/inventory`)
-   `client/src/pages/ServiceMaterialManagement.tsx` (`/service-materials`)
-   `client/src/pages/InventoryTransactionHistory.tsx` (`/inventory-transactions`)
-   `client/src/pages/LowStockAlerts.tsx` (`/low-stock-alerts`)

### 5.3 導航與路由整合

-   **`client/src/App.tsx`**: 新增上述 8 個路由。
-   **`client/src/components/DashboardLayout.tsx`**: 在 `menuItems` 陣列中加入新的導航分組與項目：
    -   **人事分潤**: 員工管理, 分潤規則, 分潤儀表板, 訂單角色指派
    -   **庫存管理**: 庫存列表, BOM設定, 異動歷史, 低庫存警示

## 6. 預計新增/修改檔案清單

### 新增檔案

-   `server/routers/staffRouter.ts`
-   `server/routers/commissionRouter.ts`
-   `server/routers/inventoryRouter.ts`
-   `server/routers/serviceMaterialRouter.ts`
-   `server/routers/inventoryTransactionRouter.ts`
-   `server/routers/lowStockAlertRouter.ts`
-   `client/src/pages/StaffManagement.tsx`
-   `client/src/pages/CommissionRuleManagement.tsx`
-   `client/src/pages/CommissionDashboard.tsx`
-   `client/src/pages/OrderStaffAssignment.tsx`
-   `client/src/pages/InventoryManagement.tsx`
-   `client/src/pages/ServiceMaterialManagement.tsx`
-   `client/src/pages/InventoryTransactionHistory.tsx`
-   `client/src/pages/LowStockAlerts.tsx`
-   `.env` (用於存放 Supabase 連線資訊)

### 修改檔案

-   `server/routers.ts` (註冊新的 tRPC routers)
-   `server/routers/orderRouter.ts` (加入 staff 指派與分潤觸發邏輯)
-   `client/src/App.tsx` (加入新頁面的路由)
-   `client/src/components/DashboardLayout.tsx` (加入側邊欄導航連結)

---

此架構設計完畢，待 Tech Lead 審核批准後，即可進入開發階段。
