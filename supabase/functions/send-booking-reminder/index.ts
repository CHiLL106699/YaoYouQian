import { serve } from 'https://deno.land/std@0.178.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.42.0';

interface Booking {
  id: string;
  user_id: string;
  booking_date: string; // ISO 8601 format
  line_user_id: string; // LINE user ID to send message to
  service_name: string;
}

interface LineMessage {
  to: string;
  messages: Array<{
    type: string;
    text: string;
  }>;
}

// 載入環境變數
const LINE_MESSAGING_ACCESS_TOKEN = Deno.env.get('LINE_MESSAGING_ACCESS_TOKEN');
const SUPABASE_URL = Deno.env.get('SUPABASE_URL');
const SUPABASE_ANON_KEY = Deno.env.get('SUPABASE_ANON_KEY');

// 驗證環境變數
if (!LINE_MESSAGING_ACCESS_TOKEN) {
  console.error('Missing LINE_MESSAGING_ACCESS_TOKEN environment variable.');
  Deno.exit(1);
}
if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  console.error('Missing SUPABASE_URL or SUPABASE_ANON_KEY environment variables.');
  Deno.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

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
    // 驗證請求方法
    if (req.method !== 'POST') {
      return new Response(JSON.stringify({ error: 'Method Not Allowed' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 405,
      });
    }

    // 獲取明天的日期
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const tomorrowDateString = tomorrow.toISOString().split('T')[0]; // YYYY-MM-DD

    // 從 Supabase 查詢明天的預約
    const { data: bookings, error: dbError } = await supabase
      .from('bookings')
      .select('id, user_id, booking_date, line_user_id, service_name')
      .eq('booking_date', tomorrowDateString);

    if (dbError) {
      console.error('Error fetching bookings:', dbError);
      return new Response(JSON.stringify({ error: 'Failed to fetch bookings', details: dbError.message }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      });
    }

    if (!bookings || bookings.length === 0) {
      return new Response(JSON.stringify({ message: 'No bookings found for tomorrow.' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      });
    }

    let successfulReminders = 0;
    let failedReminders = 0;
    const errors: string[] = [];

    for (const booking of bookings as Booking[]) {
      if (!booking.line_user_id) {
        console.warn(`Booking ${booking.id} has no LINE user ID. Skipping reminder.`);
        failedReminders++;
        errors.push(`Booking ${booking.id}: No LINE user ID.`);
        continue;
      }

      const message: LineMessage = {
        to: booking.line_user_id,
        messages: [
          {
            type: 'text',
            text: `親愛的顧客，提醒您，您預約的 ${booking.service_name} 服務將於明天 ${booking.booking_date} 進行。期待您的光臨！`,
          },
        ],
      };

      try {
        const lineResponse = await fetch('https://api.line.me/v2/bot/message/push',
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${LINE_MESSAGING_ACCESS_TOKEN}`,
            },
            body: JSON.stringify(message),
          },
        );

        if (lineResponse.ok) {
          successfulReminders++;
        } else {
          const errorData = await lineResponse.json();
          console.error(`Failed to send LINE reminder for booking ${booking.id}:`, errorData);
          failedReminders++;
          errors.push(`Booking ${booking.id}: ${JSON.stringify(errorData)}`);
        }
      } catch (lineError) {
        console.error(`Exception sending LINE reminder for booking ${booking.id}:`, lineError);
        failedReminders++;
        errors.push(`Booking ${booking.id}: ${lineError instanceof Error ? lineError.message : String(lineError)}`);
      }
    }

    return new Response(JSON.stringify({
      message: 'Booking reminders processed.',
      successfulReminders,
      failedReminders,
      errors,
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    });
  } catch (error) {
    console.error('Unhandled error:', error);
    return new Response(JSON.stringify({ error: 'Internal Server Error', details: error instanceof Error ? error.message : String(error) }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500,
    });
  }
});
