import { serve } from 'std/http/server.ts';

interface NotificationPayload {
  reservationId: string;
  userName: string;
  serviceName: string;
  appointmentTime: string;
  status: 'approved' | 'rejected';
  reason?: string;
}

interface RequestPayload {
  notifications: NotificationPayload[];
}

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Helper function to send LINE message
async function sendLineMessage(accessToken: string, userId: string, message: string): Promise<Response> {
  return fetch('https://api.line.me/v2/bot/message/push', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${accessToken}`,
    },
    body: JSON.stringify({
      to: userId,
      messages: [
        {
          type: 'text',
          text: message,
        },
      ],
    }),
  });
}

serve(async (req) => {
  // Handle CORS preflight request
  if (req.method === 'OPTIONS') {
    return new Response('ok', {
      headers: CORS_HEADERS,
    });
  }

  try {
    // 1. 驗證請求方法
    if (req.method !== 'POST') {
      return new Response(JSON.stringify({ error: 'Method Not Allowed' }), {
        status: 405,
        headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' },
      });
    }

    // 2. 驗證並解析請求體
    const { notifications } = (await req.json()) as RequestPayload;

    if (!notifications || !Array.isArray(notifications) || notifications.length === 0) {
      return new Response(JSON.stringify({ error: 'Invalid request payload: notifications array is required and cannot be empty.' }), {
        status: 400,
        headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' },
      });
    }

    // 3. 獲取環境變數
    const LINE_MESSAGING_ACCESS_TOKEN = Deno.env.get('LINE_MESSAGING_ACCESS_TOKEN');

    if (!LINE_MESSAGING_ACCESS_TOKEN) {
      throw new Error('Missing LINE_MESSAGING_ACCESS_TOKEN environment variable.');
    }

    const results = [];

    // 4. 處理批次通知
    for (const notification of notifications) {
      const { reservationId, userName, serviceName, appointmentTime, status, reason } = notification;

      // 簡易的輸入參數驗證
      if (!reservationId || !userName || !serviceName || !appointmentTime || !status) {
        results.push({
          reservationId,
          success: false,
          error: 'Invalid notification payload: missing required fields.',
        });
        continue;
      }

      let message = '';
      if (status === 'approved') {
        message = `親愛的 ${userName}，您的預約已審核通過！\n服務項目：${serviceName}\n預約時間：${appointmentTime}\n預約編號：${reservationId}`;
      } else if (status === 'rejected') {
        message = `親愛的 ${userName}，您的預約已被拒絕。\n服務項目：${serviceName}\n預約時間：${appointmentTime}\n原因：${reason || '無'}\n預約編號：${reservationId}`;
      } else {
        results.push({
          reservationId,
          success: false,
          error: 'Invalid status. Must be \'approved\' or \'rejected\'.',
        });
        continue;
      }

      // 這裡需要一個方法來獲取用戶的 LINE userId。由於沒有資料庫，這裡假設 userName 可以作為 userId。
      // 在實際應用中，您需要從資料庫中查詢用戶的 LINE userId。
      const userId = userName; // ⚠️ 實際應用中需替換為真實的 LINE userId

      try {
        const lineResponse = await sendLineMessage(LINE_MESSAGING_ACCESS_TOKEN, userId, message);
        const lineResponseData = await lineResponse.json();

        if (lineResponse.ok) {
          results.push({
            reservationId,
            success: true,
            message: 'LINE notification sent successfully.',
            lineResponse: lineResponseData,
          });
        } else {
          results.push({
            reservationId,
            success: false,
            error: `Failed to send LINE notification: ${lineResponse.statusText}`,
            lineResponse: lineResponseData,
          });
        }
      } catch (lineError) {
        console.error(`Error sending LINE message for reservation ${reservationId}:`, lineError);
        results.push({
          reservationId,
          success: false,
          error: `Exception when sending LINE notification: ${lineError.message}`,
        });
      }
    }

    // 5. 回傳結果
    return new Response(JSON.stringify({ success: true, results }), {
      headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' },
      status: 200,
    });

  } catch (error) {
    console.error('Edge Function error:', error.message);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' },
    });
  }
});
