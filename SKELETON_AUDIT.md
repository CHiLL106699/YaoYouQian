# Flower SaaS 骨架功能完整性檢查

## 檢查目標
確保所有現有頁面都是**真正可用的 SaaS 多租戶規格**，而不是空殼。

## 檢查項目

### 1. 超級管理員後台 (Super Admin)
- [ ] SuperAdminLogin.tsx - 登入功能
- [ ] SuperAdminDashboard.tsx - 儀表板顯示所有租戶
- [ ] 租戶列表是否正確從 Supabase 讀取
- [ ] 租戶統計數據是否正確計算

### 2. 租戶管理 (Tenant Management)
- [ ] TenantRegister.tsx - 註冊功能
- [ ] TenantLogin.tsx - 登入功能
- [ ] TenantDashboard.tsx - 租戶專屬儀表板
- [ ] 多租戶隔離 (tenant_id) 是否正確實作

### 3. 預約管理 (Appointment Management)
- [ ] AppointmentManagement.tsx - 預約審核功能
- [ ] 是否正確顯示預約列表
- [ ] 審核/拒絕功能是否可用
- [ ] 預約狀態更新是否正確

### 4. 改期管理 (Reschedule Management)
- [ ] RescheduleRequests.tsx - 改期申請列表
- [ ] 是否正確顯示改期申請
- [ ] 批准/拒絕功能是否可用

### 5. 時段管理 (Slot Management)
- [ ] SlotManagement.tsx - 時段數量上限設定
- [ ] 是否正確顯示時段設定
- [ ] 新增/編輯/刪除功能是否可用

### 6. 客戶管理 (Customer Management)
- [ ] CustomerManagement.tsx - 客戶列表
- [ ] 是否正確顯示客戶資料
- [ ] 客戶詳情頁面是否可用
- [ ] 新增/編輯客戶功能是否可用

### 7. 白標化設定 (White Label Settings)
- [ ] WhiteLabelSettings.tsx - Logo/品牌色設定
- [ ] Logo 上傳功能是否可用
- [ ] 品牌色自訂功能是否可用
- [ ] 自訂網域綁定功能是否可用

### 8. 訂閱管理 (Subscription Management)
- [ ] SubscriptionManagement.tsx - 訂閱方案管理
- [ ] 是否正確顯示訂閱方案
- [ ] 方案切換功能是否可用

### 9. LINE Pay 訂閱 (LINE Pay Subscription)
- [ ] LinePaySubscription.tsx - LINE Pay 整合
- [ ] 付款流程是否可用

### 10. LINE LIFF 客戶端 (LINE LIFF Client)
- [ ] BookingForm.tsx - 預約表單
- [ ] MyAppointments.tsx - 我的預約
- [ ] AppointmentDetail.tsx - 預約詳情
- [ ] LIFF 初始化是否正確
- [ ] 預約提交功能是否可用

## 檢查方法
1. 逐一開啟每個頁面
2. 檢查是否有 API 呼叫
3. 檢查是否有錯誤訊息
4. 檢查是否有假資料/空殼
5. 檢查多租戶隔離是否正確

## 修復優先級
1. **P0 (最高)**: 核心預約功能 (AppointmentManagement, BookingForm, MyAppointments)
2. **P1 (高)**: 客戶管理、時段管理
3. **P2 (中)**: 白標化、訂閱管理
4. **P3 (低)**: LINE Pay、改期管理
