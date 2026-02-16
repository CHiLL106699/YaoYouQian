# YoCHiLLSAAS 多租戶預約系統 - 專案待辦清單

## Phase 1-3: 基礎架構修復（已完成）
- [x] 修復 Supabase tenants 表 owner_line_user_id nullable 問題
- [x] 建立 11 個缺失的 Supabase 表
- [x] 修復 TenantContext auth_user_id 查詢 + localStorage 持久化
- [x] 修復 TenantLogin / TenantRegister 導航
- [x] 將 8 個 Drizzle Router 轉換為 Supabase Client
- [x] 修復 tenantRouter getDashboardStats 為 Supabase
- [x] 補充 aftercare_records, customers, tenant_settings 缺失欄位

## Phase 4: LINE 核心模組 SaaS 化（已完成）
- [x] 建立 server/line/lineService.ts - 多租戶 LINE 推播服務
- [x] 建立 server/line/lineWebhook.ts - 多租戶 Webhook 處理
- [x] 建立 server/line/lineNotification.ts - 多租戶通知模板（Flex Message）
- [x] 建立 server/line/sendLineMessage.ts - 向後相容層
- [x] 設定 LINE 環境變數（Channel ID, Secret, Access Token）
- [x] 在 tenant_settings 表加入 LINE 憑證欄位
- [x] LINE 服務測試全部通過（6/6）

## Phase 5: 前端頁面重寫（已完成）
- [x] 重寫 ProductManagement.tsx（商品管理）
- [x] 重寫 CustomerManagement.tsx（客戶管理）
- [x] 重寫 AftercareManagement.tsx（術後護理管理）
- [x] 重寫 AppointmentManagement.tsx（預約管理）
- [x] 重寫 ShopOrders.tsx（訂單管理）
- [x] 重寫 AnalyticsDashboard.tsx（數據分析）
- [x] 重寫 ReferralProgram.tsx（推薦計畫）
- [x] 重寫 PaymentMethods.tsx（付款方式）
- [x] 重寫 MemberPromotions.tsx（會員促銷）
- [x] 重寫 CouponManagement.tsx（優惠券管理）
- [x] 重寫 TenantSettings.tsx（診所設定）
- [x] 重寫 ErrorLogs.tsx（錯誤日誌）
- [x] 更新 DashboardLayout 側邊欄導航
- [x] 更新 App.tsx 路由整合 DashboardLayout
- [x] TS 編譯錯誤從 102 降至 1（僅剩 SuperJSON 類型相容性問題）
- [x] Router 測試全部通過（12/12）
- [x] 修復 TenantDashboard 側邊欄導航完整性
- [x] 確認所有管理頁面可正常載入

## 後續待做
- [ ] 實作預約日曆功能（後台日曆顯示）
- [ ] 實作 LINE LIFF 操作端頁面
- [ ] 實作術後護理 LINE 圖卡推播
- [ ] 實作預約時段選擇聯動
- [ ] 部署 Supabase Edge Functions
- [ ] 整合花花模板的 UI 風格到 SaaS 版本

## Phase 6: LINE Webhook + 衛教圖卡 + 預約導向（SaaS 多租戶）
- [x] 建立 /api/line/webhook Express 路由端點（多租戶識別）
- [x] 建立術後護理衛教圖卡 Flex Message 模板（按療程分類）
- [x] 建立預約選時段導向 flos-public-schedule.netlify.app
- [x] 建立後台衛教內容管理頁面 + aftercareContentRouter
- [x] 建立 Supabase aftercare_contents 表（租戶級衛教內容）
- [x] 設定 LINE Bot Webhook URL 指向系統
- [x] Webhook 簽名驗證（HMAC-SHA256）
- [x] 測試 Webhook 端到端流程

## Phase 7: 衛教資料 + FK 測試修復
- [ ] 在 Supabase aftercare_contents 表新增衛教種子資料（按療程分類）
- [ ] 確認 LINE Bot Webhook 能根據療程回覆對應衛教圖卡
- [ ] 修復 service.test.ts 3 個 FK constraint 測試
- [ ] 修復 bookingRouter.test.ts 2 個 FK constraint 測試
- [ ] 達到 62/62 測試全部通過

## Phase 8: 登入 Bug 修復與 LOGO 更新（已完成）
- [x] 診斷登入失敗根因：舊使用者 identity 記錄缺失
- [x] 清理損壞的使用者帳號（apm7250@gmail.com）
- [x] 驗證 admin.createUser 正確建立 identity（SDK 測試通過）
- [x] 驗證 signInWithPassword 登入流程正常（7/7 測試通過）
- [x] 驗證 RLS 策略允許已認證使用者查詢自己的 tenant
- [x] 改善登入錯誤訊息（英文翻中文：Invalid login credentials → 電子郵件或密碼錯誤）
- [x] 移除 AdminLogin 過於嚴格的密碼驗證（不再要求大小寫+特殊字元）
- [x] 替換所有 LOGO 為新圖片（Home, TenantLogin, AdminLogin, DashboardLayout, SuperAdminDashboard）
- [x] 建立 tenantAuth.test.ts 端到端認證測試（7/7 通過）

## Phase 9: 並行修復所有系統錯誤（已完成）
- [x] 修復 services 表缺失 image_url 欄位（Supabase migration）
- [x] 修復 appointments 表缺失 appointment_date 欄位（Supabase migration）
- [x] 修復 bookingRouter 測試失敗（timestamp 格式錯誤）
- [x] 修復 bookingRouter 輸入驗證（name 和 phone 不能為空）
- [x] 修復 TypeScript SuperJSON 類型錯誤（移除 client 端 transformer 配置）
- [x] 所有測試通過 69/69
- [x] TypeScript 編譯成功 0 errors

## Phase 10: 移除客戶見證、隱藏租戶入口、研究競品特色（已完成）
- [x] 移除 Home.tsx 中的客戶見證假資料（醫療法規遵循）
- [x] 隱藏租戶註冊/登入入口（Home.tsx 導航改為「管理後台」連結到 /super-admin-login）
- [x] 研究夏客（Hanker）預約系統特色（已建立 competitor-analysis.md）
- [x] 研究 SUPER8 預約系統特色（已建立 competitor-analysis.md）
- [x] 列出 YoCHiLLSAAS 缺失的關鍵功能（已整理到 competitor-analysis.md）
- [ ] 補充缺失功能到超級管理員後台（待 Phase 11-13 開發）

## Phase 11: 骨架功能全面驗證與修復（已完成）
- [x] 全面檢查現有頁面功能完整性
- [x] 補齊 CustomerManagement.tsx 的新增/編輯/刪除功能
- [x] 補齊 customerRouter.ts 的 create/update/delete API
- [x] 修復 BookingForm.tsx 的 tenantId 寫死問題
- [x] 補齊 WhiteLabelSettings.tsx 的 Logo 上傳功能
- [x] 執行完整測試驗證（69/69 通過）
- [x] 建立測試報告（TEST_REPORT.md）

## Phase 12: 高優先級功能開發（業績統計、會員護照、訂金）（已完成）
- [x] 建立 customer_photos 表（會員護照功能）
- [x] 建立 deposits 表（訂金功能）
- [x] 建立 revenue 表（業績統計）
- [x] revenueRouter tRPC API 已存在
- [x] customerPhotoRouter tRPC API 已存在
- [x] depositRouter tRPC API 已存在
- [x] 實作 RevenueCalendar 元件（每日營收日曆視圖）
- [x] 實作 CustomerPhotoManagement 頁面（成品照片上傳與管理）
- [x] 實作 DepositManagement 頁面（訂金管理）
- [x] 整合到 TenantDashboard（業績統計儀表板）
- [x] 新增路由到 App.tsx
- [x] 測試驗證所有功能（69/69 通過）

## Phase 12: 中優先級功能開發（票券系統、會員分眾行銷、時段自動計算）
- [ ] 建立票券系統（發行、使用、統計）
- [ ] 建立會員分眾行銷功能（標籤、推播）
- [ ] 建立自動化時段計算（避免預約衝突）

## Phase 13: 低優先級功能開發（LINE 圖文選單、POS 整合）
- [ ] 實作 LINE 圖文選單（六宮格：立即預約、術後護理、案例見證、會員中心、聯絡我們）
- [ ] 醫美配送格子暫時留空（不做商城）
- [ ] POS 系統整合規劃

## Phase 14: 品牌識別更新為「曜友仟管理雲」（已完成）
- [x] 上傳 FLOS LOGO 到 S3（花瓣圖案）
- [x] 上傳 YoCHiLL LOGO 到 S3
- [x] 新增環境變數 VITE_YOCHILL_LOGO
- [x] 更新 Home.tsx 品牌識別（雙 LOGO + 新名稱）
- [x] 更新 DashboardLayout 品牌識別（FLOS LOGO + 新名稱）
- [x] 更新 SuperAdminDashboard 品牌識別（FLOS LOGO + 新名稱）

## Phase 13: 修復 LOGO 顯示問題（已完成）
- [x] 修復 Home.tsx 的 FLOS LOGO（白色背景 + 圓角）
- [x] 確認 YoCHiLL "Y" 字 LOGO 正確顯示
- [x] 更新導航列和 Hero Section 的雙 LOGO 顯示

## Phase 14: 中優先級功能開發（票券系統、會員分眾行銷、時段自動計算）（已完成）
- [x] 建立 vouchers 表（票券系統）
- [x] 建立 marketing_campaigns 表（行銷活動）
- [x] 實作 voucherRouter tRPC API（發行、核銷、統計）
- [x] 實作 marketingRouter tRPC API（分群、推播）
- [x] 實作 slotCalculatorRouter tRPC API（時段自動計算）
- [x] 實作 VoucherManagement 頁面（票券發行與核銷）
- [x] 實作 MarketingCampaignManagement 頁面（會員分眾行銷）
- [x] 實作 SlotCalculatorManagement 頁面（時段自動計算設定）
- [x] 整合到 App.tsx
- [x] 測試驗證所有功能（69/69 通過）

## Phase 15: LINE 圖文選單 + 側邊欄整合 + 預約日曆
- [x] LINE 圖文選單六宮格 Webhook 回覆實作（立即預約、術後護理、會員中心、聯絡我們）
- [x] 立即預約：Flex Message 卡片 + LIFF 導向預約頁面
- [x] 術後護理：圖文卡片 Flex Message Carousel 回覆 + LIFF 護理頁面
- [x] 會員中心：Flex Message 卡片 + LIFF 會員中心頁面
- [x] 聯絡我們：Flex Message 診所資訊卡片
- [x] 醫美配送格子暫留空（回覆「功能即將上線」）
- [x] 案例見證格子暫留空（回覆「功能即將上線」）
- [x] DashboardLayout 側邊欄整合新頁面（票券管理、行銷活動、時段計算、訂金管理、會員護照、白標設定）
- [x] AppointmentManagement 加入月曆視圖（雙視圖切換、日期點擊展開、狀態摘要）
- [x] LIFF 會員中心頁面實作（深藍燙金風格、預約記錄、功能選單）
- [x] LIFF 術後護理頁面實作（Accordion 展示、dos/donts 分類）
- [x] setup-rich-menu.ts 腳本（六宮格圖文選單自動化設定）
- [x] LINE Webhook 六宮格測試（77/77 通過）

## Phase 16: LOGO 修復 + 六宮格圖文選單 + API 增強（已完成）
- [x] 修復首頁 LOGO 主次問題（曜友仟 LOGO 放大為主，YoCHiLL LOGO 縮小為次）
- [x] 修復首頁 LOGO 讀取失敗問題（LOGO URL 正常，無需修復）
- [x] 實作 customerRouter.getByLineUserId API（查詢完整客戶資料）
- [x] 為 appointmentRouter.list 增加 startDate/endDate 日期範圍築選（月曆視圖效能提升）
- [x] 執行 setup-rich-menu.ts 設定六宮格圖文選單（選擇 option3.jpeg，已上傳圖片）
- [x] 產出 LIFF 連結對應報告書（LIFF_LINKS_REPORT.md）
- [x] 測試驗證所有修改（TypeScript 0 錯誤）

## Phase 17: GitHub 推送 + 環境資訊交接
- [ ] 建立 GitHub repo CHiLL106699/YaoYouQian (public)
- [ ] 確認 .gitignore 正確設定
- [ ] 推送專案到 main branch
- [ ] 收集 Supabase 連線資訊
- [ ] 收集 LINE 相關憑證
- [ ] 收集所有環境變數清單
- [ ] 查詢 Supabase 資料表清單
- [ ] 產出完整交接文件
