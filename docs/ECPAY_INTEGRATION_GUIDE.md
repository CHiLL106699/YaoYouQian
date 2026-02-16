# 綠界金流（ECPay）訂閱整合指南

## 📋 概述

本文檔說明如何整合綠界金流（ECPay）的定期定額委託扣款功能，實作訂閱制付款。

---

## 🔑 前置準備

### 1. 取得綠界金流 API 金鑰

1. 登入 [綠界金流商店後台](https://vendor.ecpay.com.tw/)
2. 前往「系統開發管理」→「系統介接設定」
3. 取得以下金鑰：
   - `MerchantID`（特店編號）
   - `HashKey`（介接 HashKey）
   - `HashIV`（介接 HashIV）
4. 設定回傳網址：
   - 測試環境：`https://your-domain.com/api/ecpay/callback`
   - 正式環境：`https://your-domain.com/api/ecpay/callback`

### 2. 設定環境變數

在 Supabase Edge Functions 中設定以下環境變數：

```bash
ECPAY_MERCHANT_ID=your_merchant_id
ECPAY_HASH_KEY=your_hash_key
ECPAY_HASH_IV=your_hash_iv
ECPAY_SANDBOX_MODE=true  # 測試環境設為 true，正式環境設為 false
```

---

## 🚀 整合流程

### 階段 1：首次授權流程（信用卡記憶）

#### 1.1 前端：導向綠界金流授權頁面

```typescript
// client/src/pages/EcPaySubscription.tsx
const handleStartAuthorization = async () => {
  // 呼叫後端 API 取得綠界金流授權表單資料
  const { formData, formUrl } = await trpc.subscription.authorizeEcPay.mutateAsync({
    subscriptionPlan: 'professional',
    tenantId: currentTenantId,
  });

  // 建立表單並自動提交
  const form = document.createElement('form');
  form.method = 'POST';
  form.action = formUrl;
  
  Object.entries(formData).forEach(([key, value]) => {
    const input = document.createElement('input');
    input.type = 'hidden';
    input.name = key;
    input.value = value as string;
    form.appendChild(input);
  });

  document.body.appendChild(form);
  form.submit();
};
```

#### 1.2 後端：建立綠界金流授權請求

```typescript
// server/routers/subscriptionRouter.ts
import crypto from 'crypto';

authorizeEcPay: protectedProcedure
  .input(z.object({
    subscriptionPlan: z.enum(['basic', 'professional', 'enterprise']),
    tenantId: z.number(),
  }))
  .mutation(async ({ input }) => {
    const planPrices = {
      basic: 999,
      professional: 2999,
      enterprise: 9999,
    };
    const amount = planPrices[input.subscriptionPlan];

    // 建立交易資料
    const tradeData = {
      MerchantID: process.env.ECPAY_MERCHANT_ID,
      MerchantTradeNo: `TENANT_${input.tenantId}_${Date.now()}`,
      MerchantTradeDate: new Date().toISOString().replace('T', ' ').substring(0, 19),
      PaymentType: 'aio',
      TotalAmount: amount,
      TradeDesc: `訂閱方案 - ${input.subscriptionPlan}`,
      ItemName: `訂閱方案 - ${input.subscriptionPlan}`,
      ReturnURL: `https://your-domain.com/api/ecpay/callback`,
      ChoosePayment: 'Credit',
      EncryptType: 1,
      BindingCard: 1, // 記憶卡號
      MerchantMemberID: `tenant_${input.tenantId}`, // 特店會員編號
    };

    // 產生檢查碼
    const sortedData = Object.keys(tradeData)
      .sort()
      .map(key => `${key}=${tradeData[key]}`)
      .join('&');
    const hashString = `HashKey=${process.env.ECPAY_HASH_KEY}&${sortedData}&HashIV=${process.env.ECPAY_HASH_IV}`;
    const checkMacValue = crypto.createHash('sha256').update(encodeURIComponent(hashString).toLowerCase()).digest('hex').toUpperCase();

    return {
      formUrl: process.env.ECPAY_SANDBOX_MODE === 'true'
        ? 'https://payment-stage.ecpay.com.tw/Cashier/AioCheckOut/V5'
        : 'https://payment.ecpay.com.tw/Cashier/AioCheckOut/V5',
      formData: {
        ...tradeData,
        CheckMacValue: checkMacValue,
      },
    };
  }),
```

#### 1.3 處理綠界金流回調

```typescript
// server/routers/subscriptionRouter.ts
confirmEcPay: publicProcedure
  .input(z.object({
    MerchantID: z.string(),
    MerchantTradeNo: z.string(),
    RtnCode: z.string(),
    RtnMsg: z.string(),
    TradeNo: z.string(),
    TradeAmt: z.string(),
    PaymentDate: z.string(),
    CheckMacValue: z.string(),
    CardNo4No: z.string().optional(), // 信用卡末四碼
    CardNo6No: z.string().optional(), // 信用卡前六碼
  }))
  .mutation(async ({ input }) => {
    // 驗證檢查碼
    const { CheckMacValue, ...data } = input;
    const sortedData = Object.keys(data)
      .sort()
      .map(key => `${key}=${data[key]}`)
      .join('&');
    const hashString = `HashKey=${process.env.ECPAY_HASH_KEY}&${sortedData}&HashIV=${process.env.ECPAY_HASH_IV}`;
    const calculatedCheckMacValue = crypto.createHash('sha256').update(encodeURIComponent(hashString).toLowerCase()).digest('hex').toUpperCase();

    if (calculatedCheckMacValue !== CheckMacValue) {
      throw new Error('檢查碼驗證失敗');
    }

    if (input.RtnCode === '1') {
      // 儲存信用卡資訊到資料庫
      await supabase
        .from('tenant_subscriptions')
        .update({
          ecpay_card_no4: input.CardNo4No,
          ecpay_card_no6: input.CardNo6No,
          status: 'trial',
          trial_end_date: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000),
        })
        .eq('tenant_id', tenantId);

      return { success: true };
    } else {
      throw new Error(`授權失敗: ${input.RtnMsg}`);
    }
  }),
```

---

### 階段 2：定期扣款機制

#### 2.1 建立定期扣款函數

```typescript
// supabase/functions/ecpay-charge/index.ts
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import crypto from 'crypto';

serve(async (req) => {
  const { tenantId, amount } = await req.json();

  // 取得租戶訂閱資訊
  const { data: subscription } = await supabase
    .from('tenant_subscriptions')
    .select('*')
    .eq('tenant_id', tenantId)
    .single();

  // 建立定期扣款請求
  const tradeData = {
    MerchantID: Deno.env.get('ECPAY_MERCHANT_ID')!,
    MerchantTradeNo: `TENANT_${tenantId}_${Date.now()}`,
    MerchantTradeDate: new Date().toISOString().replace('T', ' ').substring(0, 19),
    TotalAmount: amount,
    TradeDesc: '訂閱方案定期扣款',
    ItemName: '訂閱方案定期扣款',
    MerchantMemberID: `tenant_${tenantId}`,
    PeriodAmount: amount,
    PeriodType: 'M', // 月繳
    Frequency: 1, // 每月扣款一次
    ExecTimes: 999, // 持續扣款次數（999 表示持續扣款）
    PeriodReturnURL: `https://your-domain.com/api/ecpay/period-callback`,
  };

  // 產生檢查碼
  const sortedData = Object.keys(tradeData)
    .sort()
    .map(key => `${key}=${tradeData[key]}`)
    .join('&');
  const hashString = `HashKey=${Deno.env.get('ECPAY_HASH_KEY')}&${sortedData}&HashIV=${Deno.env.get('ECPAY_HASH_IV')}`;
  const checkMacValue = crypto.createHash('sha256').update(encodeURIComponent(hashString).toLowerCase()).digest('hex').toUpperCase();

  // 呼叫綠界金流定期定額 API
  const response = await fetch('https://payment.ecpay.com.tw/Cashier/PeriodCheckOut', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: new URLSearchParams({
      ...tradeData,
      CheckMacValue: checkMacValue,
    }),
  });

  const data = await response.json();

  if (data.RtnCode === '1') {
    // 記錄付款成功
    await supabase.from('subscription_payments').insert({
      tenant_id: tenantId,
      amount,
      payment_method: 'ecpay',
      status: 'success',
      transaction_id: data.TradeNo,
      paid_at: new Date(),
    });

    return new Response(JSON.stringify({ success: true }), {
      headers: { 'Content-Type': 'application/json' },
    });
  } else {
    throw new Error(`扣款失敗: ${data.RtnMsg}`);
  }
});
```

---

### 階段 3：付款失敗處理邏輯

#### 3.1 記錄付款失敗

```typescript
// 在 Edge Function 中處理扣款失敗
if (data.RtnCode !== '1') {
  // 記錄失敗紀錄
  await supabase.from('subscription_payments').insert({
    tenant_id: tenantId,
    amount,
    payment_method: 'ecpay',
    status: 'failed',
    error_message: data.RtnMsg,
    created_at: new Date(),
  });

  // 更新訂閱狀態
  await supabase.from('tenant_subscriptions').update({
    status: 'payment_failed',
    payment_retry_count: subscription.payment_retry_count + 1,
  }).eq('tenant_id', tenantId);

  // 發送 LINE 通知
  await sendLineNotification(tenantId, '付款失敗通知', `您的訂閱付款失敗，請更新付款方式。錯誤訊息：${data.RtnMsg}`);
}
```

---

## 📊 資料庫 Schema 更新

### tenant_subscriptions 表新增欄位

```sql
ALTER TABLE tenant_subscriptions
ADD COLUMN ecpay_card_no4 VARCHAR(4),
ADD COLUMN ecpay_card_no6 VARCHAR(6),
ADD COLUMN payment_retry_count INTEGER DEFAULT 0,
ADD COLUMN next_retry_date TIMESTAMP,
ADD COLUMN next_billing_date TIMESTAMP;
```

---

## ⚠️ 重要注意事項

1. **測試環境與正式環境**：
   - 測試環境使用 `payment-stage.ecpay.com.tw`
   - 正式環境使用 `payment.ecpay.com.tw`

2. **安全性**：
   - 所有綠界金流 API 金鑰必須儲存在 Supabase Edge Functions 環境變數
   - 前端不得直接呼叫綠界金流 API

3. **檢查碼計算**：
   - 使用 SHA-256 雜湊演算法
   - 參數必須依照字母順序排序
   - URL Encode 後轉小寫

4. **信用卡記憶功能**：
   - 必須取得使用者同意
   - 僅儲存卡號前六碼與末四碼（不儲存完整卡號）

---

## 🔗 相關資源

- [綠界金流 API 文檔](https://developers.ecpay.com.tw/)
- [定期定額委託扣款功能說明](https://developers.ecpay.com.tw/?p=2856)
- [Supabase Edge Functions 文檔](https://supabase.com/docs/guides/functions)

---

## 📝 後續步驟

1. ⬜ 在綠界金流商店後台建立商店
2. ⬜ 設定 Supabase Edge Functions 環境變數
3. ⬜ 部署 `ecpay-charge` Edge Function
4. ⬜ 測試首次授權流程
5. ⬜ 測試定期扣款機制
6. ⬜ 測試付款失敗處理邏輯
7. ⬜ 建立監控儀表板追蹤付款狀態
