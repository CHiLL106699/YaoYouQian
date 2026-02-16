# YoCHiLLSAAS 並行開發任務清單

## 階段 3：並行開發所有租戶 Dashboard 頁面（25 個功能模組）

### 已完成頁面（基礎版本存在，需要優化）
1. ✅ TenantDashboard.tsx - 租戶儀表板（已重新設計）
2. ✅ AppointmentManagement.tsx - 預約管理（基礎版本存在）
3. ✅ CustomerManagement.tsx - 客戶管理（基礎版本存在）
4. ✅ SlotManagement.tsx - 時段管理（基礎版本存在）
5. ✅ RescheduleRequests.tsx - 改期申請（基礎版本存在）
6. ✅ WhiteLabelSettings.tsx - 白標設定（基礎版本存在）
7. ✅ SubscriptionManagement.tsx - 訂閱管理（基礎版本存在）
8. ✅ TenantSettings.tsx - 租戶設定（基礎版本存在）

### 新增功能頁面（已建立基礎版本）
9. ✅ WeightTracking.tsx - 體重追蹤
10. ✅ ProductManagement.tsx - 商品管理
11. ✅ ShopOrders.tsx - 商城訂單
12. ✅ AftercareRecords.tsx - 術後照護
13. ✅ MemberLevels.tsx - 會員等級
14. ✅ CouponManagement.tsx - 優惠券管理
15. ✅ ReferralProgram.tsx - 推薦獎勵
16. ✅ MemberPromotions.tsx - 會員促銷
17. ✅ PaymentMethods.tsx - 付款方式
18. ✅ CustomerTags.tsx - 客戶標籤
19. ✅ ErrorLogs.tsx - 錯誤日誌
20. ✅ TimeSlotTemplates.tsx - 時段模板

### 需要優化的項目
所有頁面需要：
- 套用深藍底燙金字配色方案
- 整合 tRPC API 呼叫
- 加入完整的 CRUD 功能
- 優化 UI/UX（卡片、表格、表單）
- 加入搜尋、篩選、分頁功能
- 加入載入狀態與錯誤處理

## 階段 4：並行開發所有 tRPC Router 與後端邏輯（20 個 Router）

### 核心 Router（6 個）
1. ✅ appointmentRouter - 預約管理（基礎版本存在）
2. ✅ customerRouter - 客戶管理（基礎版本存在）
3. ⬜ serviceRouter - 服務項目管理
4. ✅ slotRouter - 時段管理（基礎版本存在）
5. ✅ rescheduleRouter - 改期申請（基礎版本存在）
6. ✅ whiteLabelRouter - 白標設定（基礎版本存在）

### 新增 Router（12 個）
7. ✅ weightTrackingRouter - 體重追蹤（基礎版本存在）
8. ✅ shopRouter - 商品與訂單（基礎版本存在）
9. ✅ aftercareRouter - 術後照護（基礎版本存在）
10. ✅ memberLevelRouter - 會員等級（基礎版本存在）
11. ✅ couponRouter - 優惠券（基礎版本存在）
12. ✅ referralRouter - 推薦獎勵（基礎版本存在）
13. ✅ memberPromoRouter - 會員促銷（基礎版本存在）
14. ✅ paymentMethodRouter - 付款方式（基礎版本存在）
15. ✅ customerTagRouter - 客戶標籤（基礎版本存在）
16. ✅ errorLogRouter - 錯誤日誌（基礎版本存在）
17. ✅ slotTemplateRouter - 時段模板（基礎版本存在）
18. ⬜ statisticsRouter - 統計報表

### 系統 Router（2 個）
19. ✅ tenantRouter - 租戶管理（基礎版本存在）
20. ✅ superAdminRouter - 超級管理員（基礎版本存在）

## 當前狀態總結

### 前端頁面
- ✅ 20 個頁面已建立基礎版本
- ⚠️ 所有頁面需要套用統一配色方案
- ⚠️ 所有頁面需要整合 tRPC API
- ⚠️ 所有頁面需要優化 UI/UX

### 後端 Router
- ✅ 18 個 Router 已建立基礎版本
- ⬜ 2 個 Router 需要新增（serviceRouter, statisticsRouter）
- ⚠️ 所有 Router 需要完善資料庫查詢邏輯
- ⚠️ 所有 Router 需要加入錯誤處理與驗證

### 資料庫
- ✅ 19 個資料表已建立
- ✅ RLS Policies 已啟用
- ✅ Service Role Policies 已設定

### 下一步行動
1. 使用 map 工具並行優化所有前端頁面（套用配色方案 + 整合 API）
2. 使用 map 工具並行完善所有後端 Router（資料庫查詢邏輯）
3. 整合測試所有功能
4. 修復發現的問題
5. 生成功能截圖
6. 最終驗收與交付
