# SaaS 轉換策略 - 借鑑花花模板

## 現狀分析

### 已完成
- 所有 Router 已從 Drizzle ORM 轉換為 Supabase Client
- 11 個 Supabase 表已建立
- 0 TypeScript 編譯錯誤
- Server 正常運行，無 runtime 錯誤

### 花花模板提供的核心功能（可借鑑）
1. **LINE 整合模組**：lineNotification.ts, lineWebhook.ts - 推播、Webhook、Flex Message
2. **LIFF 前端頁面**：LiffBooking, LiffMall, LiffWeight, LiffProfile, LiffMyBookings 等
3. **管理後台頁面**：Dashboard, Appointments, Customers, Orders, Products, Aftercare 等
4. **進階功能**：LINE Pay 訂閱、改期審核、時段管理、會員等級、優惠券、推薦碼

### SaaS 化需要的改造
1. 所有 LINE 模組需要支援多租戶（每個租戶有自己的 LINE Channel）
2. 前端需要 TenantContext 注入 tenantId
3. Supabase 查詢需要 tenant_id 過濾
4. LINE 憑證需要從 tenant_settings 表動態讀取

## 執行計畫

### Phase 1: LINE 核心模組 SaaS 化
- 建立 `server/line/lineService.ts` - 多租戶 LINE 服務
- 建立 `server/line/lineWebhook.ts` - 多租戶 Webhook 處理
- 建立 `server/line/lineNotification.ts` - 多租戶推播

### Phase 2: 前端 SaaS 化
- 借鑑花花模板的 Dashboard, Appointments 等頁面
- 加入 TenantContext 注入
- 適配 SaaS 路由結構

### Phase 3: LIFF 前端
- 借鑑 LiffBooking, LiffMall 等
- 加入租戶識別（subdomain / URL param）
