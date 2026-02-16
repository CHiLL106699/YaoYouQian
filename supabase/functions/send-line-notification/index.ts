
import { serve } from "https://deno.land/std@0.178.0/http/server.ts";

// 引入 zod 進行輸入驗證
import { z } from "https://deno.land/x/zod@v3.22.4/mod.ts";

// 定義輸入參數的 Schema
const RequestSchema = z.object({
  to: z.string().min(1, "'to' 參數為必填，且不能為空。"),
  message: z.string().min(1, "'message' 參數為必填，且不能為空。").max(2000, "'message' 長度不能超過 2000 字元。"),
  messageType: z.enum(["text", "flex", "sticker"]).default("text"),
  notificationType: z.string().optional(),
});

serve(async (req) => {
  // 設置 CORS 標頭
  const corsHeaders = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  };

  // 處理 OPTIONS 請求 (CORS preflight)
  if (req.method === "OPTIONS") {
    return new Response("ok", {
      headers: corsHeaders,
    });
  }

  try {
    // 驗證 LINE_MESSAGING_ACCESS_TOKEN 環境變數
    const LINE_MESSAGING_ACCESS_TOKEN = Deno.env.get("LINE_MESSAGING_ACCESS_TOKEN");
    if (!LINE_MESSAGING_ACCESS_TOKEN) {
      throw new Error("Missing LINE_MESSAGING_ACCESS_TOKEN environment variable.");
    }

    const { to, message, messageType, notificationType } = RequestSchema.parse(await req.json());

    // 根據 messageType 構建 LINE 訊息物件
    let lineMessage: any;
    switch (messageType) {
      case "text":
        lineMessage = {
          type: "text",
          text: message,
        };
        break;
      // TODO: 根據實際需求擴展 flex 和 sticker 訊息類型
      default:
        throw new Error(`Unsupported messageType: ${messageType}`);
    }

    const lineApiUrl = "https://api.line.me/v2/bot/message/push";
    const lineApiResponse = await fetch(lineApiUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${LINE_MESSAGING_ACCESS_TOKEN}`,
      },
      body: JSON.stringify({
        to: to,
        messages: [lineMessage],
      }),
    });

    if (!lineApiResponse.ok) {
      const errorData = await lineApiResponse.json();
      console.error("LINE API Error:", errorData);
      throw new Error(`LINE API responded with status ${lineApiResponse.status}: ${JSON.stringify(errorData)}`);
    }

    return new Response(JSON.stringify({ message: "Notification sent successfully!", notificationType }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error) {
    console.error("Error in send-line-notification:", error.message);

    // 處理 Zod 驗證錯誤
    if (error instanceof z.ZodError) {
      return new Response(JSON.stringify({ error: "Invalid input", details: error.errors }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 400,
      });
    }

    // 處理其他錯誤
    return new Response(JSON.stringify({ error: error.message || "Internal Server Error" }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});
