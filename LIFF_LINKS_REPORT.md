# 曜友仟管理雲 - LIFF 連結對應報告書

## 專案資訊
- **專案名稱**: 曜友仟管理雲 (Flower SaaS)
- **專案路徑**: `/home/ubuntu/flower-saas`
- **產生日期**: 2026-02-13
- **版本**: beeb03ee

---

## LINE 圖文選單六宮格功能對應

### 1. 立即預約
- **觸發方式**: 精確匹配文字訊息「立即預約」
- **回覆類型**: Flex Message 預約卡片 + LIFF 連結
- **LIFF 頁面**: `/liff/booking` (尚未實作，建議使用 `/booking`)
- **對應 Webhook 處理**: `server/line/lineWebhook.ts` - `replyBookingCard()`
- **說明**: 回覆預約卡片，點擊後導向預約頁面

### 2. 術後護理
- **觸發方式**: 精確匹配文字訊息「術後護理」
- **回覆類型**: Flex Message Carousel 衛教圖卡選單
- **LIFF 頁面**: `/liff/care`
- **對應 Webhook 處理**: `server/line/lineWebhook.ts` - `replyAftercareMenu()`
- **說明**: 查詢 `aftercare_contents` 表，回覆術後護理衛教圖卡選單

### 3. 會員中心
- **觸發方式**: 精確匹配文字訊息「會員中心」
- **回覆類型**: Flex Message 會員中心卡片 + LIFF 連結
- **LIFF 頁面**: `/liff/member`
- **對應 Webhook 處理**: `server/line/lineWebhook.ts` - `replyMemberCenterCard()`
- **說明**: 回覆會員中心卡片，點擊後導向會員中心頁面

### 4. 聯絡我們
- **觸發方式**: 精確匹配文字訊息「聯絡我們」
- **回覆類型**: Flex Message 診所資訊卡片
- **LIFF 頁面**: 無（純資訊展示）
- **對應 Webhook 處理**: `server/line/lineWebhook.ts` - `replyContactCard()`
- **說明**: 回覆診所電話、地址、營業時間等資訊

### 5. 醫美配送
- **觸發方式**: 精確匹配文字訊息「醫美配送」
- **回覆類型**: 文字訊息「功能即將上線」
- **LIFF 頁面**: 無
- **對應 Webhook 處理**: `server/line/lineWebhook.ts` - 直接回覆文字
- **建議**: 可實作「術後保養品/醫美耗材線上商城」，整合現有商品管理模組

### 6. 案例見證
- **觸發方式**: 精確匹配文字訊息「案例見證」
- **回覆類型**: 文字訊息「功能即將上線」
- **LIFF 頁面**: 無
- **對應 Webhook 處理**: `server/line/lineWebhook.ts` - 直接回覆文字
- **建議**: 可實作「Before/After 案例展示牆」，結合會員護照功能

---

## LIFF 頁面詳細資訊

### `/liff/member` - 會員中心
- **檔案位置**: `client/src/pages/LiffMemberCenter.tsx`
- **功能**:
  - 顯示會員卡（頭像、姓名、會員編號）
  - 功能選單（個人資料、立即預約、我的票券、聯絡客服）
  - 預約記錄（即將到來/歷史紀錄）
- **API 依賴**:
  - `trpc.customer.getByLineUserId` - 查詢客戶完整資料
  - `trpc.booking.listByCustomer` - 查詢預約記錄
- **環境變數**:
  - `VITE_LIFF_ID` - LIFF 應用程式 ID
- **URL 參數**:
  - `tenantId` - 租戶 ID（必填）

### `/liff/care` - 術後護理
- **檔案位置**: `client/src/pages/LiffCare.tsx`
- **功能**:
  - 顯示術後護理衛教內容
  - Accordion 展示多項護理須知
  - 區分「應該做」和「不應該做」
- **資料來源**: 從 Webhook 回覆的 Flex Message 中取得（非直接查詢資料庫）
- **環境變數**:
  - `VITE_LIFF_ID` - LIFF 應用程式 ID

### `/booking` - 預約頁面（建議用於「立即預約」）
- **檔案位置**: `client/src/pages/BookingForm.tsx`
- **功能**:
  - 選擇服務項目
  - 選擇日期與時段
  - 填寫客戶資料
  - 提交預約
- **API 依賴**:
  - `trpc.service.list` - 查詢服務項目
  - `trpc.booking.getAvailableSlots` - 查詢可用時段
  - `trpc.booking.submitBooking` - 提交預約
- **URL 參數**:
  - `tenantId` - 租戶 ID（必填）

---

## 六宮格圖文選單圖片候選

已複製到 `assets/rich-menu/` 目錄：

1. **option1.jpg** (621KB) - 深藍燙金中國風格
   - 特色：中央大 Y 字母，燙金邊框，青海波紋背景
   - 風格：奢華、傳統、沉穩

2. **option2.jpeg** (177KB) - 粉色可愛風格
   - 特色：手繪插圖，粉色系，溫馨可愛
   - 風格：親和、溫暖、適合女性客群

3. **option3.jpeg** (220KB) - 粉色可愛風格（加強版）
   - 特色：手繪插圖，粉色系，加入「醫美配送」和「案例見證」文字
   - 風格：親和、溫暖、適合女性客群

4. **option4.jpeg** (248KB) - 深藍霓虹賽博龐克風格
   - 特色：霓虹燈效果，深藍背景，科技感
   - 風格：現代、科技、年輕化

**建議選擇**: option3.jpeg（粉色可愛風格加強版）
- 理由：最符合醫美診所的溫馨親和形象，且已包含所有六宮格功能文字

---

## 六宮格圖文選單設定腳本

### 腳本位置
`scripts/setup-rich-menu.ts`

### 執行方式
```bash
cd /home/ubuntu/flower-saas
npx tsx scripts/setup-rich-menu.ts
```

### 腳本功能
1. 上傳六宮格圖片到 LINE
2. 建立 Rich Menu 物件（定義六宮格區域）
3. 綁定 Rich Menu 到 LINE Bot
4. 設定為預設選單

### 注意事項
- 需要有效的 LINE Channel Access Token（已設定在環境變數 `LINE_CHANNEL_ACCESS_TOKEN`）
- 圖片尺寸必須為 2500x1686 或 2500x843（六宮格建議 2500x1686）
- 圖片格式支援 JPEG 或 PNG
- 圖片大小不得超過 1MB

---

## API 增強功能

### 1. `customerRouter.getByLineUserId`
- **位置**: `server/routers/customerRouter.ts`
- **功能**: 根據 LINE User ID 查詢客戶完整資料
- **輸入參數**:
  - `lineUserId` (string) - LINE User ID
  - `tenantId` (number) - 租戶 ID
- **回傳**: 客戶完整資料（姓名、電話、會員等級等）或 null（未找到）
- **用途**: LIFF 會員中心頁面查詢客戶資料

### 2. `appointmentRouter.list` 日期範圍篩選
- **位置**: `server/routers/appointmentRouter.ts`
- **新增參數**:
  - `startDate` (string, optional) - 開始日期（YYYY-MM-DD 格式）
  - `endDate` (string, optional) - 結束日期（YYYY-MM-DD 格式）
- **功能**: 篩選指定日期範圍內的預約
- **用途**: 預約管理月曆視圖效能優化（只查詢當月資料）

---

## 環境變數設定

### LINE 相關
- `LINE_CHANNEL_ACCESS_TOKEN` - LINE Channel Access Token
- `LINE_CHANNEL_SECRET` - LINE Channel Secret
- `LINE_CHANNEL_ID` - LINE Channel ID
- `VITE_LIFF_ID` - LIFF 應用程式 ID
- `LINE_BOT_BASIC_ID` - LINE Bot Basic ID（@開頭）

### 前端 LIFF
- `VITE_LIFF_CHANNEL_ID` - LIFF Channel ID
- `VITE_LIFF_CHANNEL_SECRET` - LIFF Channel Secret
- `VITE_LINE_BOT_BASIC_ID` - LINE Bot Basic ID（前端用）

---

## 測試狀態

### 後端測試
- **總測試數**: 77
- **通過數**: 77
- **失敗數**: 0
- **測試檔案**: `server/line/lineWebhook.test.ts`

### 前端測試
- **TypeScript 編譯**: 0 錯誤
- **Vite 建置**: 正常

---

## 下一步建議

1. **執行六宮格圖文選單設定**
   - 選擇圖片（建議 option3.jpeg）
   - 執行 `npx tsx scripts/setup-rich-menu.ts`
   - 驗證 LINE Bot 圖文選單是否正確顯示

2. **完善 LIFF 頁面**
   - 實作 `/liff/booking` 頁面（或使用現有 `/booking` 頁面）
   - 測試 LIFF 會員中心的客戶資料查詢功能
   - 測試術後護理頁面的 Flex Message 回覆

3. **實作「醫美配送」和「案例見證」功能**
   - 醫美配送：整合商品管理模組，建立線上商城
   - 案例見證：建立 Before/After 案例展示牆

4. **優化預約管理月曆視圖**
   - 驗證日期範圍篩選功能是否正常運作
   - 測試月曆視圖的效能提升

---

## 聯絡資訊

如有任何問題或需要進一步協助，請聯繫技術團隊。
