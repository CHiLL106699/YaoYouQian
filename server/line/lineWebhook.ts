/**
 * LINE Webhook 處理 - 多租戶 SaaS 版本
 * 
 * 功能：
 * 1. 處理來自六宮格圖文選單的精確匹配訊息
 *    - 立即預約 → 回覆預約卡片 (Flex Message)
 *    - 會員中心 → 回覆會員中心卡片 (Flex Message)
 *    - 聯絡我們 → 回覆診所資訊卡片 (Flex Message)
 *    - 醫美配送/案例見證 → 回覆「敬請期待」
 * 2. 術後護理 → 關鍵字觸發衛教圖卡 Flex Message
 * 3. Follow/Unfollow → 自動建立/停用客戶記錄
 * 4. Postback → 處理圖卡按鈕回調
 * 
 * SaaS 架構：POST /api/line/webhook/:tenantId
 */
import { supabase } from "../supabaseClient";
import { sendReplyMessage, getLineCredentials, verifyWebhookSignature } from "./lineService";
import { sendAftercareCard } from "./lineNotification";

interface LineWebhookEvent {
  type: string;
  replyToken?: string;
  source: { type: string; userId?: string; groupId?: string; roomId?: string };
  message?: { type: string; text?: string; id?: string };
  postback?: { data: string; params?: any };
  timestamp?: number;
}

/**
 * 處理多個 Webhook 事件
 */
export async function handleWebhookEvents(tenantId: number, events: LineWebhookEvent[]): Promise<void> {
  for (const event of events) {
    try {
      switch (event.type) {
        case "follow": await handleFollowEvent(tenantId, event); break;
        case "unfollow": await handleUnfollowEvent(tenantId, event); break;
        case "message": await handleMessageEvent(tenantId, event); break;
        case "postback": await handlePostbackEvent(tenantId, event); break;
        default: console.log(`[Webhook] Unhandled event type: ${event.type}`);
      }
    } catch (err) {
      console.error(`[Webhook] Error handling ${event.type} for tenant ${tenantId}:`, err);
    }
  }
}

/**
 * 處理 Follow 事件
 */
async function handleFollowEvent(tenantId: number, event: LineWebhookEvent): Promise<void> {
  const lineUserId = event.source.userId;
  if (!lineUserId) return;

  const { data: existing } = await supabase
    .from("customers")
    .select("id")
    .eq("tenant_id", tenantId)
    .eq("line_user_id", lineUserId)
    .single();

  if (!existing) {
    await supabase.from("customers").insert({
      tenant_id: tenantId,
      line_user_id: lineUserId,
      name: "LINE 用戶",
      source: "line_follow",
    });
  }

  if (event.replyToken) {
    await sendReplyMessage(tenantId, event.replyToken, [{
      type: "text",
      text: "歡迎加入！👋\n\n請使用下方選單開始使用各項服務：\n📋 立即預約\n💊 術後護理\n👤 會員中心\n💬 聯絡我們",
    }]);
  }
}

/**
 * 處理 Unfollow 事件
 */
async function handleUnfollowEvent(tenantId: number, event: LineWebhookEvent): Promise<void> {
  const lineUserId = event.source.userId;
  if (!lineUserId) return;
  await supabase
    .from("customers")
    .update({ status: "inactive" })
    .eq("tenant_id", tenantId)
    .eq("line_user_id", lineUserId);
}

/**
 * 處理訊息事件 - 優先處理圖文選單的精確匹配，再處理關鍵字
 */
async function handleMessageEvent(tenantId: number, event: LineWebhookEvent): Promise<void> {
  if (event.message?.type !== "text" || !event.message.text) return;
  const text = event.message.text.trim();
  const lineUserId = event.source.userId;
  if (!lineUserId || !event.replyToken) return;

  // 優先處理來自圖文選單的精確匹配
  switch (text) {
    case "立即預約":
      await replyBookingCard(tenantId, event.replyToken);
      return;
    case "會員中心":
      await replyMemberCenterCard(tenantId, event.replyToken);
      return;
    case "聯絡我們":
      await replyContactCard(tenantId, event.replyToken);
      return;
    case "術後護理":
      await replyAftercareMenu(tenantId, event.replyToken);
      return;
    case "醫美配送":
    case "案例見證":
      await sendReplyMessage(tenantId, event.replyToken, [{
        type: "text",
        text: "此功能即將上線，敬請期待！✨",
      }]);
      return;
  }

  // 處理關鍵字匹配
  if (text.includes("術後") || text.includes("護理") || text.includes("衛教")) {
    await replyAftercareMenu(tenantId, event.replyToken);
    return;
  }

  // 預約關鍵字 (作為備用)
  if (text.includes("預約") || text.includes("掛號") || text.includes("時段")) {
    await replyBookingCard(tenantId, event.replyToken);
    return;
  }

  // 聯絡客服關鍵字 (作為備用)
  if (text.includes("聯絡") || text.includes("客服") || text.includes("問題")) {
    await sendReplyMessage(tenantId, event.replyToken, [{
      type: "text",
      text: "感謝您的訊息！我們的客服人員會盡快回覆您 💬\n如有緊急狀況，請直接撥打診所電話。",
    }]);
    return;
  }
  // 其他訊息不自動回覆，避免干擾
}

/**
 * 回覆術後護理衛教圖卡選單
 */
async function replyAftercareMenu(tenantId: number, replyToken: string): Promise<void> {
  const { data: contents } = await supabase
    .from("aftercare_contents")
    .select("*")
    .eq("tenant_id", tenantId)
    .eq("is_active", true)
    .order("sort_order", { ascending: true })
    .limit(10);

  if (!contents || contents.length === 0) {
    await sendReplyMessage(tenantId, replyToken, [{
      type: "text",
      text: "目前尚未設定術後護理衛教內容，請聯繫診所了解更多 💊",
    }]);
    return;
  }

  const bubbles = contents.map((item: any) => {
    const instructions = Array.isArray(item.instructions) ? item.instructions : [];
    const previewText = instructions.slice(0, 2).join("、") || item.description || "點擊查看詳細護理須知";

    const bubble: any = {
      type: "bubble",
      size: "kilo",
      header: {
        type: "box", layout: "vertical", backgroundColor: "#FCE4EC", paddingAll: "lg",
        contents: [
          { type: "text", text: "💊 術後護理", size: "xs", color: "#E91E63" },
          { type: "text", text: item.treatment_name, weight: "bold", size: "lg", color: "#C2185B", margin: "sm" },
        ],
      },
      body: {
        type: "box", layout: "vertical", spacing: "sm",
        contents: [
          { type: "text", text: previewText, wrap: true, size: "sm", color: "#666666" },
          { type: "text", text: `共 ${instructions.length} 項護理須知`, size: "xs", color: "#999999", margin: "md" },
        ],
      },
      footer: {
        type: "box", layout: "vertical",
        contents: [{
          type: "button", style: "primary", color: "#E91E63",
          action: {
            type: "postback",
            label: "查看完整護理須知",
            data: `action=aftercare&content_id=${item.id}`,
          },
        }],
      },
    };

    if (item.image_url) {
      bubble.hero = {
        type: "image", url: item.image_url, size: "full",
        aspectRatio: "20:13", aspectMode: "cover",
      };
    }
    return bubble;
  });

  await sendReplyMessage(tenantId, replyToken, [{
    type: "flex",
    altText: "💊 術後護理衛教選單",
    contents: { type: "carousel", contents: bubbles },
  }]);
}

/**
 * 取得租戶的 LIFF URL
 */
async function getLiffUrl(tenantId: number, path: string): Promise<string> {
  const { data: lineConfig } = await supabase
    .from("tenant_line_configs")
    .select("liff_id, booking_url, base_url")
    .eq("tenant_id", tenantId)
    .single();

  // 優先使用 booking_url (若為預約頁面且有設定)
  if (path.startsWith("/booking") && lineConfig?.booking_url) {
    return lineConfig.booking_url;
  }

  // 否則，使用 LIFF ID 和 base_url 組合
  if (lineConfig?.liff_id) {
    const baseUrl = lineConfig.base_url || process.env.DEFAULT_BASE_URL || "";
    const liffUri = `${baseUrl}${path}`.replace(/\/\//g, "/").replace("https:/", "https://");
    return `https://liff.line.me/${lineConfig.liff_id}?liff.uri=${encodeURIComponent(liffUri)}`;
  }
  
  // 備用方案
  return process.env.DEFAULT_BOOKING_URL || "#";
}

/**
 * 回覆預約卡片
 */
async function replyBookingCard(tenantId: number, replyToken: string): Promise<void> {
  const bookingPath = `/booking?tenantId=${tenantId}`;
  const bookingUrl = await getLiffUrl(tenantId, bookingPath);

  const bubble = {
    type: "bubble",
    hero: {
      type: "image",
      url: "https://storage.googleapis.com/manus-prod-bucket-public/default/booking_card_hero.png",
      size: "full", aspectRatio: "20:13", aspectMode: "cover",
      action: { type: "uri", label: "預約", uri: bookingUrl },
    },
    body: {
      type: "box", layout: "vertical", spacing: "md",
      contents: [
        { type: "text", text: "立即預約您的美麗時光", weight: "bold", size: "xl" },
        {
          type: "box", layout: "vertical", margin: "lg", spacing: "sm",
          contents: [
            { type: "box", layout: "baseline", spacing: "sm", contents: [
              { type: "icon", url: "https://storage.googleapis.com/manus-prod-bucket-public/default/check-circle-icon.png", size: "sm" },
              { type: "text", text: "線上查看可預約時段", size: "sm", color: "#555555", flex: 0, wrap: true },
            ]},
            { type: "box", layout: "baseline", spacing: "sm", contents: [
              { type: "icon", url: "https://storage.googleapis.com/manus-prod-bucket-public/default/check-circle-icon.png", size: "sm" },
              { type: "text", text: "選擇您偏好的服務與時間", size: "sm", color: "#555555", flex: 0, wrap: true },
            ]},
          ],
        },
      ],
    },
    footer: {
      type: "box", layout: "vertical", spacing: "sm", flex: 0,
      contents: [{
        type: "button", style: "primary", height: "sm",
        action: { type: "uri", label: "立即預約", uri: bookingUrl },
      }],
    },
  };

  await sendReplyMessage(tenantId, replyToken, [{
    type: "flex",
    altText: "📋 預約療程 - 點擊查看可預約時段",
    contents: bubble,
  }]);
}

/**
 * 回覆會員中心卡片
 */
async function replyMemberCenterCard(tenantId: number, replyToken: string): Promise<void> {
  const memberPath = `/liff/member?tenantId=${tenantId}`;
  const memberUrl = await getLiffUrl(tenantId, memberPath);

  const bubble = {
    type: "bubble",
    hero: {
      type: "image",
      url: "https://storage.googleapis.com/manus-prod-bucket-public/default/member_card_hero.png",
      size: "full", aspectRatio: "20:13", aspectMode: "cover",
      action: { type: "uri", label: "會員中心", uri: memberUrl },
    },
    body: {
      type: "box", layout: "vertical", spacing: "md",
      contents: [
        { type: "text", text: "您的專屬會員中心", weight: "bold", size: "xl" },
        {
          type: "box", layout: "vertical", margin: "lg", spacing: "sm",
          contents: [
            { type: "box", layout: "baseline", spacing: "sm", contents: [
              { type: "icon", url: "https://storage.googleapis.com/manus-prod-bucket-public/default/check-circle-icon.png", size: "sm" },
              { type: "text", text: "查詢您的預約紀錄", size: "sm", color: "#555555", flex: 0, wrap: true },
            ]},
            { type: "box", layout: "baseline", spacing: "sm", contents: [
              { type: "icon", url: "https://storage.googleapis.com/manus-prod-bucket-public/default/check-circle-icon.png", size: "sm" },
              { type: "text", text: "管理您的會員資料", size: "sm", color: "#555555", flex: 0, wrap: true },
            ]},
          ],
        },
      ],
    },
    footer: {
      type: "box", layout: "vertical", spacing: "sm", flex: 0,
      contents: [{
        type: "button", style: "primary", height: "sm",
        action: { type: "uri", label: "進入會員中心", uri: memberUrl },
      }],
    },
  };

  await sendReplyMessage(tenantId, replyToken, [{
    type: "flex",
    altText: "👤 會員中心 - 管理您的預約與資料",
    contents: bubble,
  }]);
}

/**
 * 回覆聯絡我們卡片
 */
async function replyContactCard(tenantId: number, replyToken: string): Promise<void> {
  const { data: settings } = await supabase
    .from("tenant_settings")
    .select("clinic_name, clinic_phone, clinic_address, business_hours")
    .eq("tenant_id", tenantId)
    .single();

  if (!settings) {
    await sendReplyMessage(tenantId, replyToken, [{ type: "text", text: "抱歉，目前無法取得診所資訊。" }]);
    return;
  }

  const bubble = {
    type: "bubble",
    header: {
      type: "box", layout: "vertical",
      contents: [
        { type: "text", text: settings.clinic_name || "聯絡我們", weight: "bold", size: "xl" }
      ]
    },
    body: {
      type: "box", layout: "vertical", spacing: "md",
      contents: [
        {
          type: "box", layout: "horizontal", spacing: "md",
          contents: [
            { type: "text", text: "電話", color: "#aaaaaa", size: "sm", flex: 2 },
            { type: "text", text: settings.clinic_phone || "-", color: "#666666", size: "sm", flex: 5, wrap: true, action: { type: "uri", label: "撥打電話", uri: `tel:${settings.clinic_phone}` } }
          ]
        },
        {
          type: "box", layout: "horizontal", spacing: "md",
          contents: [
            { type: "text", text: "地址", color: "#aaaaaa", size: "sm", flex: 2 },
            { type: "text", text: settings.clinic_address || "-", color: "#666666", size: "sm", flex: 5, wrap: true, action: { type: "uri", label: "查看地圖", uri: `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(settings.clinic_address || "")}` } }
          ]
        },
        {
          type: "box", layout: "horizontal", spacing: "md",
          contents: [
            { type: "text", text: "營業時間", color: "#aaaaaa", size: "sm", flex: 2 },
            { type: "text", text: settings.business_hours || "-", color: "#666666", size: "sm", flex: 5, wrap: true }
          ]
        }
      ]
    },
    footer: {
      type: "box", layout: "vertical", spacing: "sm",
      contents: [
        {
          type: "button", style: "link", height: "sm",
          action: { type: "uri", label: "撥打電話", uri: `tel:${settings.clinic_phone}` }
        },
        {
          type: "button", style: "link", height: "sm",
          action: { type: "uri", label: "查看地圖", uri: `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(settings.clinic_address || "")}` }
        }
      ]
    }
  };

  await sendReplyMessage(tenantId, replyToken, [{
    type: "flex",
    altText: `診所資訊：${settings.clinic_name}`,
    contents: bubble,
  }]);
}

/**
 * 處理 Postback 事件（圖卡按鈕回調）
 */
async function handlePostbackEvent(tenantId: number, event: LineWebhookEvent): Promise<void> {
  if (!event.postback?.data || !event.source.userId) return;
  const params = new URLSearchParams(event.postback.data);
  const action = params.get("action");
  const lineUserId = event.source.userId;

  switch (action) {
    case "aftercare": {
      const contentId = params.get("content_id");
      if (contentId) {
        const { data: content } = await supabase
          .from("aftercare_contents")
          .select("*")
          .eq("id", contentId)
          .eq("tenant_id", tenantId)
          .single();

        if (content) {
          await sendAftercareCard({
            tenantId,
            lineUserId,
            treatmentName: content.treatment_name,
            instructions: Array.isArray(content.instructions) ? content.instructions : ["請遵照醫師指示"],
            imageUrl: content.image_url,
          });
        }
      }
      break;
    }
    case "booking_confirm": {
      if (event.replyToken) {
        await sendReplyMessage(tenantId, event.replyToken, [{
          type: "text", text: "✅ 已收到您的確認，感謝您！",
        }]);
      }
      break;
    }
    default:
      console.log(`[Webhook] Unknown postback action: ${action}`);
  }
}

/**
 * 驗證並處理 Webhook 請求（供 Express route handler 使用）
 */
export async function processWebhookRequest(
  tenantId: number,
  body: string,
  signature: string
): Promise<{ success: boolean; error?: string }> {
  const credentials = await getLineCredentials(tenantId);
  if (!credentials.channelSecret) {
      return { success: false, error: "LINE channel secret is not configured for this tenant." };
  }
  if (!verifyWebhookSignature(body, signature, credentials.channelSecret)) {
    return { success: false, error: "Invalid signature" };
  }
  const parsed = JSON.parse(body);
  const events: LineWebhookEvent[] = parsed.events || [];
  // 非同步處理，立即回傳 200 OK
  handleWebhookEvents(tenantId, events).catch(err => {
      console.error(`[Webhook] Unhandled exception in event processing for tenant ${tenantId}:`, err);
  });
  return { success: true };
}
