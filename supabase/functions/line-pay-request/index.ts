import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';
import { config } from 'https://deno.land/x/dotenv@v3.2.2/mod.ts';

// Load environment variables from .env file (for local development)
// In Supabase Edge Functions, environment variables are automatically available.
if (Deno.env.get('DENO_ENV') !== 'production') {
  config({ export: true });
}

const LINE_PAY_CHANNEL_ID = Deno.env.get('LINE_PAY_CHANNEL_ID');
const LINE_PAY_CHANNEL_SECRET = Deno.env.get('LINE_PAY_CHANNEL_SECRET');
const LINE_PAY_API_BASE_URL = 'https://api-pay.line.me/v2/payments'; // LINE Pay API 正式環境

// CORS headers
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight request
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    if (req.method !== 'POST') {
      return new Response(JSON.stringify({ error: 'Method Not Allowed' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 405,
      });
    }

    if (!LINE_PAY_CHANNEL_ID || !LINE_PAY_CHANNEL_SECRET) {
      throw new Error('LINE_PAY_CHANNEL_ID or LINE_PAY_CHANNEL_SECRET is not set.');
    }

    const { amount, productName, orderId, currency = 'TWD', confirmUrl, cancelUrl } = await req.json();

    // Input validation
    if (!amount || typeof amount !== 'number' || amount <= 0) {
      return new Response(JSON.stringify({ error: 'Invalid amount' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      });
    }
    if (!productName || typeof productName !== 'string' || productName.trim() === '') {
      return new Response(JSON.stringify({ error: 'Invalid productName' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      });
    }
    if (!orderId || typeof orderId !== 'string' || orderId.trim() === '') {
      return new Response(JSON.stringify({ error: 'Invalid orderId' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      });
    }
    if (!confirmUrl || typeof confirmUrl !== 'string' || confirmUrl.trim() === '') {
      return new Response(JSON.stringify({ error: 'Invalid confirmUrl' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      });
    }
    if (!cancelUrl || typeof cancelUrl !== 'string' || cancelUrl.trim() === '') {
      return new Response(JSON.stringify({ error: 'Invalid cancelUrl' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      });
    }

    const requestBody = {
      amount,
      currency,
      orderId,
      packages: [
        {
          id: orderId,
          amount,
          name: productName,
          products: [
            {
              name: productName,
              quantity: 1,
              price: amount,
            },
          ],
        },
      ],
      redirectUrls: {
        confirmUrl,
        cancelUrl,
      },
      options: {
        payment: {
          payType: 'PREAPPROVED',
        },
      },
    };

    const linePayResponse = await fetch(`${LINE_PAY_API_BASE_URL}/request`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-LINE-ChannelId': LINE_PAY_CHANNEL_ID,
        'X-LINE-ChannelSecret': LINE_PAY_CHANNEL_SECRET,
      },
      body: JSON.stringify(requestBody),
    });

    const linePayData = await linePayResponse.json();

    if (linePayData.returnCode === '0000') {
      return new Response(JSON.stringify({ 
        success: true,
        paymentUrl: linePayData.info.paymentUrl.web,
        transactionId: linePayData.info.transactionId,
        regKey: linePayData.info.regKey, // PREAPPROVED 模式特有的 regKey
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      });
    } else {
      return new Response(JSON.stringify({
        success: false,
        error: linePayData.returnMessage,
        returnCode: linePayData.returnCode,
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      });
    }
  } catch (error) {
    console.error('Error:', error.message);
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500,
    });
  }
});
