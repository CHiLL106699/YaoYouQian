# LINE Pay 訂閱整合指南

## 📋 概述

本文檔說明如何整合 LINE Pay 訂閱功能，實作首次授權、定期扣款與付款失敗處理邏輯。

---

## 🔑 前置準備

### 1. 取得 LINE Pay API 金鑰

1. 登入 [LINE Pay Developers Console](https://pay.line.me/portal/tw/main)
2. 建立 Merchant（商家）
3. 取得以下金鑰：
   - `Channel ID`
   - `Channel Secret`
4. 設定回調 URL（Callback URL）：
   - 測試環境：`https://your-domain.com/api/linepay/callback`
   - 正式環境：`https://your-domain.com/api/linepay/callback`

### 2. 設定環境變數

在 Supabase Edge Functions 中設定以下環境變數：

```bash
LINE_PAY_CHANNEL_ID=your_channel_id
LINE_PAY_CHANNEL_SECRET=your_channel_secret
LINE_PAY_SANDBOX_MODE=true  # 測試環境設為 true，正式環境設為 false
```

---

## 🚀 整合流程

### 階段 1：首次授權流程

#### 1.1 前端：導向 LINE Pay 授權頁面

```typescript
// client/src/pages/LinePaySubscription.tsx
const handleStartAuthorization = async () => {
  // 呼叫後端 API 取得 LINE Pay 授權 URL
  const { authorizationUrl } = await trpc.subscription.authorizeLinePay.mutateAsync({
    subscriptionPlan: 'professional', // 訂閱方案
    tenantId: currentTenantId,
  });

  // 導向 LINE Pay 授權頁面
  window.location.href = authorizationUrl;
};
```

#### 1.2 後端：建立 LINE Pay 授權請求

```typescript
// server/routers/subscriptionRouter.ts
authorizeLinePay: protectedProcedure
  .input(z.object({
    subscriptionPlan: z.enum(['basic', 'professional', 'enterprise']),
    tenantId: z.number(),
  }))
  .mutation(async ({ input }) => {
    // 呼叫 Supabase Edge Function
    const response = await fetch('https://ebkzsuckjnmpsxgggmzs.supabase.co/functions/v1/linepay-authorize', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY}`,
      },
      body: JSON.stringify({
        subscriptionPlan: input.subscriptionPlan,
        tenantId: input.tenantId,
      }),
    });

    const data = await response.json();
    return { authorizationUrl: data.authorizationUrl };
  }),
```

#### 1.3 Supabase Edge Function：呼叫 LINE Pay API

```typescript
// supabase/functions/linepay-authorize/index.ts
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';

serve(async (req) => {
  const { subscriptionPlan, tenantId } = await req.json();

  // 取得訂閱方案價格
  const planPrices = {
    basic: 999,
    professional: 2999,
    enterprise: 9999,
  };
  const amount = planPrices[subscriptionPlan];

  // 呼叫 LINE Pay Request API
  const response = await fetch('https://sandbox-api-pay.line.me/v3/payments/request', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-LINE-ChannelId': Deno.env.get('LINE_PAY_CHANNEL_ID')!,
      'X-LINE-ChannelSecret-Key': Deno.env.get('LINE_PAY_CHANNEL_SECRET')!,
    },
    body: JSON.stringify({
      amount,
      currency: 'TWD',
      orderId: `TENANT_${tenantId}_${Date.now()}`,
      packages: [{
        id: 'subscription',
        amount,
        products: [{
          name: `訂閱方案 - ${subscriptionPlan}`,
          quantity: 1,
          price: amount,
        }],
      }],
      redirectUrls: {
        confirmUrl: `https://your-domain.com/subscription/linepay?tenantId=${tenantId}`,
        cancelUrl: `https://your-domain.com/subscription/linepay?cancel=true`,
      },
      options: {
        payment: {
          capture: false, // 首次授權不扣款
        },
      },
    }),
  });

  const data = await response.json();

  return new Response(JSON.stringify({
    authorizationUrl: data.info.paymentUrl.web,
    transactionId: data.info.transactionId,
  }), {
    headers: { 'Content-Type': 'application/json' },
  });
});
```

#### 1.4 處理 LINE Pay 回調

```typescript
// 前端：接收回調參數
useEffect(() => {
  const urlParams = new URLSearchParams(window.location.search);
  const transactionId = urlParams.get('transactionId');
  const regKey = urlParams.get('regKey');

  if (transactionId && regKey) {
    handleLinePayCallback(transactionId, regKey);
  }
}, []);

const handleLinePayCallback = async (transactionId: string, regKey: string) => {
  // 呼叫後端 API 確認授權
  await trpc.subscription.confirmLinePay.mutateAsync({
    transactionId,
    regKey,
    tenantId: currentTenantId,
  });

  // 導向儀表板
  setLocation('/dashboard');
};
```

```typescript
// 後端：確認授權並儲存 regKey
confirmLinePay: protectedProcedure
  .input(z.object({
    transactionId: z.string(),
    regKey: z.string(),
    tenantId: z.number(),
  }))
  .mutation(async ({ input }) => {
    // 呼叫 LINE Pay Confirm API
    const response = await fetch('https://sandbox-api-pay.line.me/v3/payments/confirm', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-LINE-ChannelId': process.env.LINE_PAY_CHANNEL_ID!,
        'X-LINE-ChannelSecret-Key': process.env.LINE_PAY_CHANNEL_SECRET!,
      },
      body: JSON.stringify({
        transactionId: input.transactionId,
        amount: 0, // 首次授權不扣款
      }),
    });

    // 儲存 regKey 到資料庫
    await supabase
      .from('tenant_subscriptions')
      .update({
        linepay_reg_key: input.regKey,
        status: 'trial', // 試用期
        trial_end_date: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000), // 14 天後
      })
      .eq('tenant_id', input.tenantId);

    return { success: true };
  }),
```

---

### 階段 2：定期扣款機制

#### 2.1 建立定期扣款排程（使用 Supabase Cron Jobs 或外部排程）

```sql
-- 建立定期扣款函數
CREATE OR REPLACE FUNCTION process_subscription_payments()
RETURNS void AS $$
DECLARE
  subscription RECORD;
BEGIN
  -- 查詢所有需要扣款的訂閱（試用期結束且狀態為 active）
  FOR subscription IN
    SELECT * FROM tenant_subscriptions
    WHERE status = 'active'
    AND next_billing_date <= NOW()
    AND linepay_reg_key IS NOT NULL
  LOOP
    -- 呼叫 Edge Function 執行扣款
    PERFORM net.http_post(
      url := 'https://ebkzsuckjnmpsxgggmzs.supabase.co/functions/v1/linepay-charge',
      headers := jsonb_build_object('Content-Type', 'application/json'),
      body := jsonb_build_object(
        'tenantId', subscription.tenant_id,
        'regKey', subscription.linepay_reg_key,
        'amount', subscription.plan_price
      )
    );
  END LOOP;
END;
$$ LANGUAGE plpgsql;

-- 建立每日執行的 Cron Job
SELECT cron.schedule('process-subscription-payments', '0 2 * * *', 'SELECT process_subscription_payments()');
```

#### 2.2 Supabase Edge Function：執行定期扣款

```typescript
// supabase/functions/linepay-charge/index.ts
serve(async (req) => {
  const { tenantId, regKey, amount } = await req.json();

  // 呼叫 LINE Pay Subscription Charge API
  const response = await fetch('https://sandbox-api-pay.line.me/v3/payments/preapprovedPay/regKey/check', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-LINE-ChannelId': Deno.env.get('LINE_PAY_CHANNEL_ID')!,
      'X-LINE-ChannelSecret-Key': Deno.env.get('LINE_PAY_CHANNEL_SECRET')!,
    },
    body: JSON.stringify({
      regKey,
      amount,
      currency: 'TWD',
      orderId: `TENANT_${tenantId}_${Date.now()}`,
      productName: '訂閱方案月費',
    }),
  });

  const data = await response.json();

  if (data.returnCode === '0000') {
    // 扣款成功，記錄付款紀錄
    await supabase.from('subscription_payments').insert({
      tenant_id: tenantId,
      amount,
      payment_method: 'linepay',
      status: 'success',
      transaction_id: data.info.transactionId,
      paid_at: new Date(),
    });

    // 更新下次扣款日期
    await supabase.from('tenant_subscriptions').update({
      next_billing_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 天後
    }).eq('tenant_id', tenantId);

    return new Response(JSON.stringify({ success: true }), {
      headers: { 'Content-Type': 'application/json' },
    });
  } else {
    // 扣款失敗，處理錯誤
    throw new Error(`LINE Pay 扣款失敗: ${data.returnMessage}`);
  }
});
```

---

### 階段 3：付款失敗處理邏輯

#### 3.1 記錄付款失敗

```typescript
// 在 Edge Function 中處理扣款失敗
if (data.returnCode !== '0000') {
  // 記錄失敗紀錄
  await supabase.from('subscription_payments').insert({
    tenant_id: tenantId,
    amount,
    payment_method: 'linepay',
    status: 'failed',
    error_message: data.returnMessage,
    created_at: new Date(),
  });

  // 更新訂閱狀態為 payment_failed
  await supabase.from('tenant_subscriptions').update({
    status: 'payment_failed',
    payment_retry_count: subscription.payment_retry_count + 1,
  }).eq('tenant_id', tenantId);

  // 發送 LINE 通知給租戶管理員
  await sendLineNotification(tenantId, '付款失敗通知', `您的訂閱付款失敗，請更新付款方式。錯誤訊息：${data.returnMessage}`);
}
```

#### 3.2 自動重試機制

```typescript
// 在定期扣款函數中加入重試邏輯
FOR subscription IN
  SELECT * FROM tenant_subscriptions
  WHERE status = 'payment_failed'
  AND payment_retry_count < 3 -- 最多重試 3 次
  AND next_retry_date <= NOW()
LOOP
  -- 重試扣款
  PERFORM net.http_post(...);

  -- 更新下次重試時間（3 天後）
  UPDATE tenant_subscriptions
  SET next_retry_date = NOW() + INTERVAL '3 days'
  WHERE tenant_id = subscription.tenant_id;
END LOOP;
```

#### 3.3 停用訂閱

```typescript
// 超過重試次數後停用訂閱
FOR subscription IN
  SELECT * FROM tenant_subscriptions
  WHERE status = 'payment_failed'
  AND payment_retry_count >= 3
LOOP
  -- 停用訂閱
  UPDATE tenant_subscriptions
  SET status = 'suspended'
  WHERE tenant_id = subscription.tenant_id;

  -- 發送 LINE 通知
  PERFORM send_line_notification(
    subscription.tenant_id,
    '訂閱已停用',
    '您的訂閱因付款失敗已被停用，請聯絡客服或更新付款方式。'
  );
END LOOP;
```

---

## 📊 資料庫 Schema 更新

### tenant_subscriptions 表新增欄位

```sql
ALTER TABLE tenant_subscriptions
ADD COLUMN linepay_reg_key VARCHAR(255),
ADD COLUMN payment_retry_count INTEGER DEFAULT 0,
ADD COLUMN next_retry_date TIMESTAMP,
ADD COLUMN next_billing_date TIMESTAMP;
```

---

## ⚠️ 重要注意事項

1. **測試環境與正式環境**：
   - 測試環境使用 `sandbox-api-pay.line.me`
   - 正式環境使用 `api-pay.line.me`

2. **安全性**：
   - 所有 LINE Pay API 金鑰必須儲存在 Supabase Edge Functions 環境變數
   - 前端不得直接呼叫 LINE Pay API

3. **錯誤處理**：
   - 記錄所有付款失敗的詳細資訊
   - 提供清晰的錯誤訊息給租戶

4. **通知機制**：
   - 付款成功/失敗時發送 LINE 通知
   - 試用期即將結束時發送提醒

---

## 🔗 相關資源

- [LINE Pay API 文檔](https://pay.line.me/tw/developers/apis/onlineApis)
- [LINE Pay 訂閱功能說明](https://pay.line.me/tw/developers/techsupport/faq/overview)
- [Supabase Edge Functions 文檔](https://supabase.com/docs/guides/functions)

---

## 📝 後續步驟

1. ⬜ 在 LINE Pay Developers Console 建立 Merchant
2. ⬜ 設定 Supabase Edge Functions 環境變數
3. ⬜ 部署 `linepay-authorize` 和 `linepay-charge` Edge Functions
4. ⬜ 測試首次授權流程
5. ⬜ 測試定期扣款機制
6. ⬜ 測試付款失敗處理邏輯
7. ⬜ 建立監控儀表板追蹤付款狀態
