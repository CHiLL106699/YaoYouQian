# YoCHiLLSAAS 功能清單與花花專案對照表

## 📊 功能對照總覽

### ✅ 已完成功能（YoCHiLLSAAS 已具備）

1. **多租戶架構**
   - ✅ tenants 表（租戶基本資料）
   - ✅ tenant_subscriptions 表（訂閱狀態）
   - ✅ tenant_settings 表（白標化設定）
   - ✅ RLS 策略（資料隔離）

2. **租戶管理**
   - ✅ 租戶註冊流程（TenantRegister.tsx）
   - ✅ 租戶登入流程（TenantLogin.tsx）
   - ✅ Supabase Auth 整合

3. **預約管理**
   - ✅ 預約審核（AppointmentManagement.tsx）
   - ✅ 預約改期申請（RescheduleRequests.tsx）
   - ✅ 時段數量上限設定（SlotManagement.tsx）

4. **客戶管理**
   - ✅ 客戶清單（CustomerManagement.tsx）
   - ✅ 客戶詳情頁面

5. **白標化功能**
   - ✅ Logo 上傳（WhiteLabelSettings.tsx）
   - ✅ 品牌色自訂
   - ✅ 自訂網域綁定

6. **訂閱管理**
   - ✅ 訂閱方案管理（SubscriptionManagement.tsx）
   - ✅ LINE Pay 訂閱整合（LinePaySubscription.tsx）

7. **超級管理員後台**
   - ✅ 超級管理員登入（SuperAdminLogin.tsx）
   - ✅ 超級管理員儀表板（SuperAdminDashboard.tsx）

8. **LINE LIFF 客戶端**
   - ✅ 預約表單（BookingForm.tsx）
   - ✅ 我的預約（MyAppointments.tsx）
   - ✅ 預約詳情（AppointmentDetail.tsx）

---

### ⚠️ 缺失功能（需補齊）

#### 1. **體重管理功能**
- ❌ 體重追蹤記錄（weight_tracking 表）
- ❌ 體重管理權限開通功能
- ❌ 體重管理 LIFF 頁面（LiffWeight.tsx）
- ❌ 劑量計算功能（dose_calculation_history 表）

#### 2. **商城功能**
- ❌ 商品管理（products 表）
- ❌ 商城訂單管理（shop_orders 表）
- ❌ 購物車功能
- ❌ 商城結帳流程

#### 3. **術後照護功能**
- ❌ 術後照護記錄（aftercare_records 表）
- ❌ 追蹤提醒功能
- ❌ 術後照護統計

#### 4. **會員等級功能**
- ❌ 會員等級設定（member_levels 表）
- ❌ 會員等級自動升級邏輯
- ❌ 會員等級優惠

#### 5. **優惠券功能**
- ❌ 優惠券管理（coupons 表）
- ❌ 優惠券發放功能
- ❌ 優惠券使用記錄

#### 6. **推薦獎勵功能**
- ❌ 推薦碼生成
- ❌ 推薦獎勵記錄（referrals 表）
- ❌ 推薦獎勵統計

#### 7. **會員促銷活動功能**
- ❌ 促銷活動管理（member_promos 表）
- ❌ 促銷活動參與記錄
- ❌ 促銷活動統計

#### 8. **付款方式管理**
- ❌ 付款方式設定（payment_methods 表）
- ❌ 付款方式選擇功能

#### 9. **標籤管理功能**
- ❌ 客戶標籤管理（customer_tags 表）
- ❌ 標籤篩選功能

#### 10. **錯誤日誌功能**
- ❌ 錯誤日誌記錄（error_logs 表）
- ❌ 錯誤日誌查詢與分析

#### 11. **LINE 通知功能**
- ❌ 預約審核通知（已實作部分，需完整測試）
- ❌ 預約取消通知
- ❌ 預約前一天提醒通知
- ❌ 商城訂單狀態通知
- ❌ 會員註冊成功通知

#### 12. **時段模板功能**
- ❌ 時段模板管理（time_slot_templates 表）
- ❌ 批次建立時段功能

#### 13. **統計與報表功能**
- ❌ 註冊趨勢統計
- ❌ 來源統計
- ❌ 預約統計（每週統計）
- ❌ 商品銷售統計
- ❌ 術後照護統計

#### 14. **其他療程諮詢引導**
- ❌ 「其他療程」二級選單（皮膚管理諮詢、體態管理諮詢）

#### 15. **預約日曆功能**
- ❌ 後台預約日曆顯示
- ❌ 日曆匯出圖片功能
- ❌ 批次選擇日期功能

#### 16. **會員中心功能**
- ❌ 會員資料更新（LIFF 頁面）
- ❌ 會員反饋功能（LIFF 頁面）

#### 17. **轉帳功能**
- ❌ 轉帳記錄管理（transfers 表）

---

## 🚀 補齊計畫

### Phase 1: 核心功能補齊（優先）
1. LINE 通知功能完整實作
2. 預約日曆功能
3. 統計與報表功能
4. 「其他療程」諮詢引導

### Phase 2: 進階功能補齊
1. 體重管理功能
2. 商城功能
3. 術後照護功能
4. 會員等級功能

### Phase 3: 營銷功能補齊
1. 優惠券功能
2. 推薦獎勵功能
3. 會員促銷活動功能

### Phase 4: 輔助功能補齊
1. 付款方式管理
2. 標籤管理功能
3. 錯誤日誌功能
4. 時段模板功能
5. 轉帳功能

---

## 📝 命名規範

所有功能命名必須使用 **YoCHiLLSAAS** 品牌識別，避免使用「花花」、「Manus」等字眼。

**範例**：
- ❌ 花花醫美預約系統
- ✅ YoCHiLLSAAS 多租戶預約管理系統

- ❌ Manus Auth 登入
- ✅ Supabase Auth 登入

---

## 🔒 資安原則

1. 所有敏感 API 操作必須透過 Supabase Edge Functions 執行
2. 前端不得直接存取 Service Role Key 或第三方 API 金鑰
3. 實作 Row Level Security (RLS) 策略確保租戶資料隔離
4. 所有業務表包含 `tenant_id` 欄位
