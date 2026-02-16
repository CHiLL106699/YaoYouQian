# YoCHiLLSAAS 多租戶預約系統 - 資料流向圖

**作者**: Manus AI  
**日期**: 2026-02-07  
**版本**: 1.0

---

## 一、租戶註冊流程

```mermaid
sequenceDiagram
    participant User as 租戶管理員
    participant Frontend as 前端 (React)
    participant tRPC as tRPC API
    participant DB as Supabase DB
    participant EdgeFn as Edge Function
    participant LINE as LINE Messaging API

    User->>Frontend: 填寫註冊表單
    Frontend->>tRPC: tenantRegistration.register()
    tRPC->>DB: 驗證子網域唯一性
    DB-->>tRPC: 驗證通過
    tRPC->>DB: 建立 tenants 記錄
    tRPC->>DB: 建立 tenant_subscriptions 記錄
    tRPC->>DB: 建立 tenant_settings 記錄
    tRPC->>EdgeFn: send-line-notification
    EdgeFn->>LINE: 發送註冊成功通知
    LINE-->>User: 收到 LINE 通知
    tRPC-->>Frontend: 返回租戶 ID 與登入連結
    Frontend-->>User: 顯示註冊成功頁面
```

---

## 二、LINE LIFF 預約流程

```mermaid
sequenceDiagram
    participant Customer as 客戶
    participant LIFF as LINE LIFF
    participant tRPC as tRPC API
    participant DB as Supabase DB
    participant EdgeFn as Edge Function
    participant LINE as LINE Messaging API
    participant Admin as 租戶管理員

    Customer->>LIFF: 開啟預約表單
    LIFF->>tRPC: appointments.getAvailableSlots()
    tRPC->>DB: 查詢 booking_slot_limits
    tRPC->>DB: 查詢 appointments (計算剩餘名額)
    DB-->>tRPC: 返回時段狀態
    tRPC-->>LIFF: 返回可用時段
    LIFF-->>Customer: 顯示時段狀態
    Customer->>LIFF: 選擇時段並提交
    LIFF->>tRPC: appointments.create()
    tRPC->>DB: 驗證時段未額滿
    tRPC->>DB: 建立 appointments 記錄
    tRPC->>EdgeFn: send-line-notification (客戶)
    EdgeFn->>LINE: 發送預約確認通知
    LINE-->>Customer: 收到 LINE 通知
    tRPC->>EdgeFn: send-line-notification (管理員)
    EdgeFn->>LINE: 發送預約審核通知
    LINE-->>Admin: 收到 LINE 通知
    tRPC-->>LIFF: 返回預約成功
    LIFF-->>Customer: 顯示預約成功頁面
```

---

## 三、LINE Pay 訂閱流程

### 3.1 首次授權流程

```mermaid
sequenceDiagram
    participant Admin as 租戶管理員
    participant Frontend as 前端 (React)
    participant tRPC as tRPC API
    participant EdgeFn as Edge Function
    participant LinePay as LINE Pay API
    participant DB as Supabase DB
    participant LINE as LINE Messaging API

    Admin->>Frontend: 選擇訂閱方案
    Frontend->>tRPC: linePaySubscription.initiate()
    tRPC->>EdgeFn: line-pay-request
    EdgeFn->>LinePay: 建立付款請求 (PREAPPROVED)
    LinePay-->>EdgeFn: 返回 paymentUrl
    EdgeFn-->>tRPC: 返回 paymentUrl
    tRPC-->>Frontend: 返回 paymentUrl
    Frontend-->>Admin: 導向 LINE Pay 頁面
    Admin->>LinePay: 完成授權
    LinePay->>tRPC: 回調 /api/subscription/confirm
    tRPC->>EdgeFn: line-pay-confirm
    EdgeFn->>LinePay: 確認付款並取得 regKey
    LinePay-->>EdgeFn: 返回 regKey
    EdgeFn->>DB: 更新 tenant_subscriptions (regKey, status='active')
    EdgeFn->>LINE: 發送訂閱成功通知
    LINE-->>Admin: 收到 LINE 通知
    EdgeFn-->>tRPC: 返回成功
    tRPC-->>Frontend: 返回成功
    Frontend-->>Admin: 顯示訂閱成功頁面
```

### 3.2 定期扣款流程

```mermaid
sequenceDiagram
    participant Cron as Cron Job
    participant EdgeFn as Edge Function
    participant DB as Supabase DB
    participant LinePay as LINE Pay API
    participant LINE as LINE Messaging API
    participant Admin as 租戶管理員

    Cron->>DB: 查詢即將到期的訂閱
    DB-->>Cron: 返回訂閱清單
    loop 每個訂閱
        Cron->>EdgeFn: line-pay-charge
        EdgeFn->>DB: 取得 regKey
        EdgeFn->>LinePay: 使用 regKey 發起扣款
        alt 扣款成功
            LinePay-->>EdgeFn: 返回 transactionId
            EdgeFn->>DB: 更新 current_period_end (+1 月)
            EdgeFn->>DB: 建立 subscription_payments (status='success')
            EdgeFn->>LINE: 發送扣款成功通知
            LINE-->>Admin: 收到 LINE 通知
        else 扣款失敗
            LinePay-->>EdgeFn: 返回錯誤
            EdgeFn->>EdgeFn: 重試 (最多 3 次)
            alt 重試成功
                EdgeFn->>DB: 更新 current_period_end (+1 月)
                EdgeFn->>DB: 建立 subscription_payments (status='success')
                EdgeFn->>LINE: 發送扣款成功通知
                LINE-->>Admin: 收到 LINE 通知
            else 重試失敗
                EdgeFn->>DB: 更新 status='suspended'
                EdgeFn->>DB: 建立 subscription_payments (status='failed')
                EdgeFn->>LINE: 發送扣款失敗通知
                LINE-->>Admin: 收到 LINE 通知
            end
        end
    end
```

---

## 四、預約審核流程

### 4.1 單筆審核流程

```mermaid
sequenceDiagram
    participant Admin as 租戶管理員
    participant Frontend as 前端 (React)
    participant tRPC as tRPC API
    participant DB as Supabase DB
    participant EdgeFn as Edge Function
    participant LINE as LINE Messaging API
    participant Customer as 客戶

    Admin->>Frontend: 點擊「核准」按鈕
    Frontend->>tRPC: appointments.approve()
    tRPC->>DB: 更新 appointments (status='approved')
    tRPC->>EdgeFn: send-line-notification (客戶)
    EdgeFn->>LINE: 發送審核成功通知
    LINE-->>Customer: 收到 LINE 通知
    tRPC->>EdgeFn: send-line-notification (管理員)
    EdgeFn->>LINE: 發送審核成功通知
    LINE-->>Admin: 收到 LINE 通知
    tRPC-->>Frontend: 返回成功
    Frontend-->>Admin: 顯示審核成功訊息
```

### 4.2 批次審核流程

```mermaid
sequenceDiagram
    participant Admin as 租戶管理員
    participant Frontend as 前端 (React)
    participant tRPC as tRPC API
    participant DB as Supabase DB
    participant EdgeFn as Edge Function
    participant LINE as LINE Messaging API
    participant Customer as 客戶

    Admin->>Frontend: 選擇多筆預約並點擊「批次核准」
    Frontend->>tRPC: appointments.batchApprove()
    loop 每個預約
        tRPC->>DB: 更新 appointments (status='approved')
    end
    tRPC->>EdgeFn: send-batch-approval-notification
    loop 每個客戶
        EdgeFn->>LINE: 發送審核成功通知
        LINE-->>Customer: 收到 LINE 通知
    end
    EdgeFn->>LINE: 發送彙整通知 (管理員)
    LINE-->>Admin: 收到 LINE 通知
    tRPC-->>Frontend: 返回成功
    Frontend-->>Admin: 顯示批次審核成功訊息
```

---

## 五、預約改期流程

```mermaid
sequenceDiagram
    participant Customer as 客戶
    participant LIFF as LINE LIFF
    participant tRPC as tRPC API
    participant DB as Supabase DB
    participant Admin as 租戶管理員
    participant Frontend as 前端 (React)
    participant EdgeFn as Edge Function
    participant LINE as LINE Messaging API

    Customer->>LIFF: 點擊「申請改期」
    LIFF->>tRPC: rescheduleRequests.create()
    tRPC->>DB: 建立 reschedule_requests 記錄
    tRPC->>EdgeFn: send-line-notification (管理員)
    EdgeFn->>LINE: 發送改期申請通知
    LINE-->>Admin: 收到 LINE 通知
    tRPC-->>LIFF: 返回成功
    LIFF-->>Customer: 顯示申請成功頁面
    
    Admin->>Frontend: 查看改期申請
    Frontend->>tRPC: rescheduleRequests.checkConflict()
    tRPC->>DB: 查詢新時段是否有其他預約
    DB-->>tRPC: 返回衝突狀態
    tRPC-->>Frontend: 返回衝突狀態
    Frontend-->>Admin: 顯示衝突警告（如有）
    
    alt 核准改期
        Admin->>Frontend: 點擊「核准」
        Frontend->>tRPC: rescheduleRequests.approve()
        tRPC->>DB: 更新 appointments (date, time)
        tRPC->>DB: 更新 reschedule_requests (status='approved')
        tRPC->>EdgeFn: send-line-notification (客戶)
        EdgeFn->>LINE: 發送改期核准通知
        LINE-->>Customer: 收到 LINE 通知
    else 拒絕改期
        Admin->>Frontend: 點擊「拒絕」
        Frontend->>tRPC: rescheduleRequests.reject()
        tRPC->>DB: 更新 reschedule_requests (status='rejected')
        tRPC->>EdgeFn: send-line-notification (客戶)
        EdgeFn->>LINE: 發送改期拒絕通知
        LINE-->>Customer: 收到 LINE 通知
    end
```

---

## 六、時段管理流程

```mermaid
sequenceDiagram
    participant Admin as 租戶管理員
    participant Frontend as 前端 (React)
    participant tRPC as tRPC API
    participant DB as Supabase DB

    Admin->>Frontend: 開啟時段管理頁面
    Frontend->>tRPC: slotLimits.getSlotLimits()
    tRPC->>DB: 查詢 booking_slot_limits
    DB-->>tRPC: 返回時段上限設定
    tRPC->>DB: 查詢 appointments (計算各時段預約數量)
    DB-->>tRPC: 返回預約數量
    tRPC-->>Frontend: 返回時段上限與預約數量
    Frontend-->>Admin: 顯示熱力圖（綠/黃/紅/灰）
    
    Admin->>Frontend: 設定時段上限
    Frontend->>tRPC: slotLimits.setSlotLimit()
    tRPC->>DB: 插入或更新 booking_slot_limits
    DB-->>tRPC: 返回成功
    tRPC-->>Frontend: 返回成功
    Frontend-->>Admin: 更新熱力圖
```

---

## 七、白標化設定流程

```mermaid
sequenceDiagram
    participant Admin as 租戶管理員
    participant Frontend as 前端 (React)
    participant tRPC as tRPC API
    participant S3 as Amazon S3
    participant DB as Supabase DB

    Admin->>Frontend: 上傳 Logo 圖片
    Frontend->>tRPC: whiteLabel.uploadLogo()
    tRPC->>S3: 上傳圖片至 S3
    S3-->>tRPC: 返回 S3 URL
    tRPC->>DB: 更新 tenant_settings (logo_url)
    DB-->>tRPC: 返回成功
    tRPC-->>Frontend: 返回 S3 URL
    Frontend-->>Admin: 顯示 Logo 預覽
    
    Admin->>Frontend: 選擇品牌色
    Frontend->>tRPC: whiteLabel.updateColors()
    tRPC->>DB: 更新 tenant_settings (primary_color, secondary_color)
    DB-->>tRPC: 返回成功
    tRPC-->>Frontend: 返回成功
    Frontend-->>Admin: 套用品牌色預覽
    
    Admin->>Frontend: 設定自訂網域
    Frontend->>tRPC: whiteLabel.setCustomDomain()
    tRPC->>DB: 更新 tenants (custom_domain)
    DB-->>tRPC: 返回成功
    tRPC-->>Frontend: 返回成功
    Frontend-->>Admin: 顯示網域設定成功
```

---

## 八、系統架構總覽

```mermaid
graph TB
    subgraph "客戶端層"
        A[LINE LIFF 預約表單]
        B[管理後台 React 19]
        C[超級管理員後台]
    end
    
    subgraph "API 層 tRPC 11"
        D[租戶管理 Router]
        E[預約管理 Router]
        F[訂閱管理 Router]
        G[白標化 Router]
    end
    
    subgraph "Supabase Edge Functions"
        H[line-pay-request]
        I[line-pay-confirm]
        J[line-pay-charge]
        K[send-line-notification]
        L[send-batch-approval-notification]
        M[send-booking-reminder]
    end
    
    subgraph "外部服務"
        N[LINE Pay API]
        O[LINE Messaging API]
        P[Amazon S3]
    end
    
    subgraph "資料庫層"
        Q[(Supabase PostgreSQL)]
    end
    
    A --> E
    B --> D
    B --> E
    B --> F
    B --> G
    C --> D
    C --> F
    
    D --> Q
    E --> Q
    F --> H
    F --> I
    F --> J
    G --> P
    G --> Q
    
    H --> N
    I --> N
    J --> N
    K --> O
    L --> O
    M --> O
    
    E --> K
    E --> L
    E --> M
```

---

**文檔結束**
