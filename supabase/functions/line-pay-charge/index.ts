
import { serve } from 'https://deno.land/std@0.178.0/http/server.ts';

console.log('Hello from Functions!');

serve(async (req) => {
  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  };

  // Handle CORS preflight request
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    // 1. 驗證輸入參數
    const { regKey, amount, product_name } = await req.json();

    if (!regKey || typeof regKey !== 'string') {
      return new Response(JSON.stringify({ error: 'Missing or invalid regKey' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      });
    }

    if (!amount || typeof amount !== 'number' || amount <= 0) {
      return new Response(JSON.stringify({ error: 'Missing or invalid amount' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      });
    }

    if (!product_name || typeof product_name !== 'string') {
      return new Response(JSON.stringify({ error: 'Missing or invalid product_name' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      });
    }

    // 2. 取得環境變數
    const LINE_PAY_CHANNEL_ID = Deno.env.get('LINE_PAY_CHANNEL_ID');
    const LINE_PAY_CHANNEL_SECRET = Deno.env.get('LINE_PAY_CHANNEL_SECRET');
    // const LINE_MESSAGING_ACCESS_TOKEN = Deno.env.get('LINE_MESSAGING_ACCESS_TOKEN'); // 暫時用不到，但保留

    if (!LINE_PAY_CHANNEL_ID || !LINE_PAY_CHANNEL_SECRET) {
      throw new Error('LINE Pay environment variables are not set.');
    }

    // 3. 呼叫 LINE Pay 定期扣款 API
    const linePayApiUrl = 'https://api-pay.line.me/v2/payments/recurring/charge';
    const linePayHeaders = {
      'Content-Type': 'application/json',
      'X-LINE-ChannelId': LINE_PAY_CHANNEL_ID,
      'X-LINE-ChannelSecret': LINE_PAY_CHANNEL_SECRET,
    };

    const linePayBody = JSON.stringify({
      regKey: regKey,
      amount: amount,
      currency: 'TWD',
      productName: product_name,
      orderId: `ORDER-${Date.now()}` // 產生一個唯一的訂單 ID
    });

    const linePayResponse = await fetch(linePayApiUrl, {
      method: 'POST',
      headers: linePayHeaders,
      body: linePayBody,
    });

    const linePayResult = await linePayResponse.json();

    if (!linePayResponse.ok) {
      console.error('LINE Pay API Error:', linePayResult);
      return new Response(JSON.stringify({ error: 'LINE Pay API failed', details: linePayResult }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: linePayResponse.status,
      });
    }

    // 4. 回傳成功回應
    return new Response(JSON.stringify({ message: 'Recurring payment successful', data: linePayResult }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    });

  } catch (error) {
    console.error('Edge Function Error:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500,
    });
  }
});
