
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';

interface LinePayConfirmRequest {
  transactionId: string;
  orderId: string;
  amount: number;
  currency: string;
}

interface LinePayConfirmResponse {
  returnCode: string;
  returnMessage: string;
  info?: {
    orderId: string;
    transactionId: string;
    regKey?: string;
  };
}

interface LinePayRegKeyResponse {
  returnCode: string;
  returnMessage: string;
  info?: {
    regKey: string;
  };
}

const LINE_PAY_CHANNEL_ID = Deno.env.get('LINE_PAY_CHANNEL_ID');
const LINE_PAY_CHANNEL_SECRET = Deno.env.get('LINE_PAY_CHANNEL_SECRET');
const LINE_MESSAGING_ACCESS_TOKEN = Deno.env.get('LINE_MESSAGING_ACCESS_TOKEN');

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
    const { transactionId, orderId, amount, currency }: LinePayConfirmRequest = await req.json();

    // 1. Validate input parameters
    if (!transactionId || !orderId || !amount || !currency) {
      return new Response(JSON.stringify({ error: 'Missing required parameters' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      });
    }

    if (!LINE_PAY_CHANNEL_ID || !LINE_PAY_CHANNEL_SECRET || !LINE_MESSAGING_ACCESS_TOKEN) {
      return new Response(JSON.stringify({ error: 'Server configuration error: Missing LINE Pay environment variables' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      });
    }

    // 2. Confirm LINE Pay payment
    const confirmResponse = await fetch(
      `https://api-pay.line.me/v2/payments/${transactionId}/confirm`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-LINE-ChannelId': LINE_PAY_CHANNEL_ID,
          'X-LINE-ChannelSecret': LINE_PAY_CHANNEL_SECRET,
        },
        body: JSON.stringify({
          amount: amount,
          currency: currency,
        }),
      },
    );

    const confirmResult: LinePayConfirmResponse = await confirmResponse.json();

    if (confirmResult.returnCode !== '0000') {
      console.error('LINE Pay Confirm Error:', confirmResult);
      return new Response(JSON.stringify({ error: 'LINE Pay payment confirmation failed', details: confirmResult }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      });
    }

    let regKey: string | undefined;

    // 3. If payment is confirmed, try to get regKey (optional, based on LINE Pay setup for recurring payments)
    // This part assumes regKey is needed for future recurring payments. Adjust if not applicable.
    if (confirmResult.info?.regKey) {
      regKey = confirmResult.info.regKey;
    } else {
      // Attempt to fetch regKey if not directly in confirm response (e.g., for pre-approved payments)
      // This is a placeholder. Actual regKey retrieval might be different based on LINE Pay API usage.
      // For simplicity, we'll assume it's either in confirmResult or not needed for this flow.
      // If a separate API call is needed to get regKey, it would go here.
      // Example (hypothetical, adjust according to actual LINE Pay API for regKey retrieval):
      // const regKeyResponse = await fetch(
      //   `https://api-pay.line.me/v2/payments/${transactionId}/regKey`,
      //   {
      //     method: 'GET',
      //     headers: {
      //       'X-LINE-ChannelId': LINE_PAY_CHANNEL_ID,
      //       'X-LINE-ChannelSecret': LINE_PAY_CHANNEL_SECRET,
      //     },
      //   },
      // );
      // const regKeyResult: LinePayRegKeyResponse = await regKeyResponse.json();
      // if (regKeyResult.returnCode === '0000' && regKeyResult.info?.regKey) {
      //   regKey = regKeyResult.info.regKey;
      // }
    }

    // 4. Return success response with regKey if available
    return new Response(JSON.stringify({
      returnCode: '0000',
      returnMessage: 'Payment confirmed successfully',
      info: {
        orderId: orderId,
        transactionId: transactionId,
        regKey: regKey,
      },
    }), {
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
