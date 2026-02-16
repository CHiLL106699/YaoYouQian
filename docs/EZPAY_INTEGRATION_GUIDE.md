# 藍新金流（ezPay）訂閱整合指南

## 📋 概述

本文檔說明如何整合藍新金流（ezPay）的信用卡定期定額功能，實作訂閱制付款。

---

## 🔑 前置準備

### 1. 取得藍新金流 API 金鑰

1. 登入 [藍新金流商店後台](https://cwww.newebpay.com/)
2. 前往「商店資料設定」→「API 串接」
3. 取得以下金鑰：
   - `MerchantID`（商店代號）
   - `HashKey`（串接金鑰）
   - `HashIV`（串接密碼）
4. 設定回調 URL：
   - 測試環境：`https://your-domain.com/api/ezpay/callback`
   - 正式環境：`https://your-domain.com/api/ezpay/callback`

### 2. 設定環境變數

在 Supabase Edge Functions 中設定以下環境變數：

```bash
EZPAY_MERCHANT_ID=your_merchant_id
EZPAY_HASH_KEY=your_hash_key
EZPAY_HASH_IV=your_hash_iv
EZPAY_SANDBOX_MODE=true  # 測試環境設為 true，正式環境設為 false
```

---

## 🚀 整合流程

### 階段 1：首次授權流程（信用卡記憶）

#### 1.1 前端：導向藍新金流授權頁面

```typescript
// client/src/pages/EzPaySubscription.tsx
const handleStartAuthorization = async () => {
  // 呼叫後端 API 取得藍新金流授權表單資料
  const { formData, formUrl } = await trpc.subscription.authorizeEzPay.mutateAsync({
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

#### 1.2 後端：建立藍新金流授權請求

```typescript
// server/routers/subscriptionRouter.ts
import crypto from 'crypto';

authorizeEzPay: protectedProcedure
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
    const tradeInfo = {
      MerchantID: process.env.EZPAY_MERCHANT_ID,
      RespondType: 'JSON',
      TimeStamp: Math.floor(Date.now() / 1000),
      Version: '2.0',
      MerchantOrderNo: `TENANT_${input.tenantId}_${Date.now()}`,
      Amt: amount,
      ItemDesc: `訂閱方案 - ${input.subscriptionPlan}`,
      Email: 'tenant@example.com', // 從租戶資料取得
      ReturnURL: `https://your-domain.com/api/ezpay/callback`,
      NotifyURL: `https://your-domain.com/api/ezpay/notify`,
      TokenTerm: 'tenant@example.com', // 信用卡記憶識別碼
    };

    // 加密交易資料
    const tradeInfoStr = new URLSearchParams(tradeInfo as any).toString();
    const cipher = crypto.createCipheriv('aes-256-cbc', process.env.EZPAY_HASH_KEY!, process.env.EZPAY_HASH_IV!);
    const encrypted = cipher.update(tradeInfoStr, 'utf8', 'hex') + cipher.final('hex');

    // 產生檢查碼
    const hashString = `HashKey=${process.env.EZPAY_HASH_KEY}&${tradeInfoStr}&HashIV=${process.env.EZPAY_HASH_IV}`;
    const tradeSha = crypto.createHash('sha256').update(hashString).digest('hex').toUpperCase();

    return {
      formUrl: process.env.EZPAY_SANDBOX_MODE === 'true'
        ? 'https://ccore.newebpay.com/MPG/mpg_gateway'
        : 'https://core.newebpay.com/MPG/mpg_gateway',
      formData: {
        MerchantID: process.env.EZPAY_MERCHANT_ID,
        TradeInfo: encrypted,
        TradeSha: tradeSha,
        Version: '2.0',
      },
    };
  }),
```

#### 1.3 處理藍新金流回調

```typescript
// server/routers/subscriptionRouter.ts
confirmEzPay: publicProcedure
  .input(z.object({
    Status: z.string(),
    MerchantID: z.string(),
    TradeInfo: z.string(),
    TradeSha: z.string(),
  }))
  .mutation(async ({ input }) => {
    // 解密交易資料
    const decipher = crypto.createDecipheriv('aes-256-cbc', process.env.EZPAY_HASH_KEY!, process.env.EZPAY_HASH_IV!);
    const decrypted = decipher.update(input.TradeInfo, 'hex', 'utf8') + decipher.final('utf8');
    const result = JSON.parse(decrypted);

    if (result.Status === 'SUCCESS') {
      // 儲存信用卡 Token 到資料庫
      await supabase
        .from('tenant_subscriptions')
        .update({
          ezpay_token: result.Result.TokenValue,
          status: 'trial',
          trial_end_date: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000),
        })
        .eq('tenant_id', tenantId);

      return { success: true };
    } else {
      throw new Error(`授權失敗: ${result.Message}`);
    }
  }),
```

---

### 階段 2：定期扣款機制

#### 2.1 建立定期扣款函數

```typescript
// supabase/functions/ezpay-charge/index.ts
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import crypto from 'crypto';

serve(async (req) => {
  const { tenantId, token, amount } = await req.json();

  // 建立定期扣款請求
  const postData = {
    MerchantID: Deno.env.get('EZPAY_MERCHANT_ID')!,
    PostData_: {
      MerchantOrderNo: `TENANT_${tenantId}_${Date.now()}`,
      Amt: amount,
      PeriodAmt: amount,
      PeriodType: 'M', // 月繳
      PeriodPoint: new Date().getDate(), // 每月扣款日
      PeriodTimes: 999, // 持續扣款次數（999 表示持續扣款）
      TokenValue: token,
    },
  };

  // 加密 PostData_
  const postDataStr = JSON.stringify(postData.PostData_);
  const cipher = crypto.createCipheriv('aes-256-cbc', Deno.env.get('EZPAY_HASH_KEY')!, Deno.env.get('EZPAY_HASH_IV')!);
  const encrypted = cipher.update(postDataStr, 'utf8', 'hex') + cipher.final('hex');

  // 呼叫藍新金流定期定額 API
  const response = await fetch('https://ccore.newebpay.com/MPG/period', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: new URLSearchParams({
      MerchantID_: postData.MerchantID,
      PostData_: encrypted,
    }),
  });

  const data = await response.json();

  if (data.Status === 'SUCCESS') {
    // 記錄付款成功
    await supabase.from('subscription_payments').insert({
      tenant_id: tenantId,
      amount,
      payment_method: 'ezpay',
      status: 'success',
      transaction_id: data.Result.MerchantOrderNo,
      paid_at: new Date(),
    });

    return new Response(JSON.stringify({ success: true }), {
      headers: { 'Content-Type': 'application/json' },
    });
  } else {
    throw new Error(`扣款失敗: ${data.Message}`);
  }
});
```

---

### 階段 3：付款失敗處理邏輯

#### 3.1 記錄付款失敗

```typescript
// 在 Edge Function 中處理扣款失敗
if (data.Status !== 'SUCCESS') {
  // 記錄失敗紀錄
  await supabase.from('subscription_payments').insert({
    tenant_id: tenantId,
    amount,
    payment_method: 'ezpay',
    status: 'failed',
    error_message: data.Message,
    created_at: new Date(),
  });

  // 更新訂閱狀態
  await supabase.from('tenant_subscriptions').update({
    status: 'payment_failed',
    payment_retry_count: subscription.payment_retry_count + 1,
  }).eq('tenant_id', tenantId);

  // 發送 LINE 通知
  await sendLineNotification(tenantId, '付款失敗通知', `您的訂閱付款失敗，請更新付款方式。錯誤訊息：${data.Message}`);
}
```

---

## 📊 資料庫 Schema 更新

### tenant_subscriptions 表新增欄位

```sql
ALTER TABLE tenant_subscriptions
ADD COLUMN ezpay_token VARCHAR(255),
ADD COLUMN payment_retry_count INTEGER DEFAULT 0,
ADD COLUMN next_retry_date TIMESTAMP,
ADD COLUMN next_billing_date TIMESTAMP;
```

---

## ⚠️ 重要注意事項

1. **測試環境與正式環境**：
   - 測試環境使用 `ccore.newebpay.com`
   - 正式環境使用 `core.newebpay.com`

2. **安全性**：
   - 所有藍新金流 API 金鑰必須儲存在 Supabase Edge Functions 環境變數
   - 前端不得直接呼叫藍新金流 API

3. **加密演算法**：
   - 使用 AES-256-CBC 加密
   - 檢查碼使用 SHA-256

4. **信用卡記憶功能**：
   - 必須取得使用者同意
   - Token 儲存必須符合 PCI DSS 規範

---

## 🔗 相關資源

- [藍新金流 API 文檔](https://www.newebpay.com/website/Page/content/download_api)
- [信用卡定期定額功能說明](https://www.newebpay.com/website/Page/content/download_api#5)
- [Supabase Edge Functions 文檔](https://supabase.com/docs/guides/functions)

---

## 📝 後續步驟

1. ⬜ 在藍新金流商店後台建立商店
2. ⬜ 設定 Supabase Edge Functions 環境變數
3. ⬜ 部署 `ezpay-charge` Edge Function
4. ⬜ 測試首次授權流程
5. ⬜ 測試定期扣款機制
6. ⬜ 測試付款失敗處理邏輯
7. ⬜ 建立監控儀表板追蹤付款狀態
