/**
 * LINE Messaging API 多租戶服務
 * 
 * SaaS 架構：
 * 1. 預設使用系統環境變數中的 LINE Channel（SAASGOCHILL）
 * 2. 每個租戶可在 tenant_settings 中設定自己的 LINE Channel 憑證
 * 3. 發送訊息時，先查詢租戶的 LINE 設定，若無則使用系統預設
 * 
 * 借鑑花花模板 lineNotification.ts，改造為多租戶版本
 */

import { supabase } from "../supabaseClient";
import { createHmac } from "crypto";

// LINE Messaging API 端點
const LINE_API_BASE = "https://api.line.me/v2/bot";

// 系統預設 LINE 憑證（從環境變數取得）
const SYSTEM_LINE_CHANNEL_ACCESS_TOKEN = process.env.LINE_CHANNEL_ACCESS_TOKEN || "";
const SYSTEM_LINE_CHANNEL_SECRET = process.env.LINE_CHANNEL_SECRET || "";
const SYSTEM_LINE_CHANNEL_ID = process.env.LINE_CHANNEL_ID || "";

/**
 * LINE Channel 憑證介面
 */
export interface LineChannelCredentials {
  channelId: string;
  channelSecret: string;
  channelAccessToken: string;
  botBasicId?: string;
}

/**
 * LINE 訊息類型
 */
export interface LineMessage {
  type: string;
  text?: string;
  altText?: string;
  contents?: any;
}

/**
 * 取得租戶的 LINE Channel 憑證
 * 優先使用租戶自己的設定，若無則使用系統預設
 */
export async function getLineCredentials(tenantId: number): Promise<LineChannelCredentials> {
  try {
    // 優先查詢 tenant_line_configs 表（專用 LINE 設定表）
    const { data: lineConfig } = await supabase
      .from("tenant_line_configs")
      .select("*")
      .eq("tenant_id", tenantId)
      .single();
    if (lineConfig?.channel_access_token) {
      return {
        channelId: lineConfig.channel_id || SYSTEM_LINE_CHANNEL_ID,
        channelSecret: lineConfig.channel_secret || SYSTEM_LINE_CHANNEL_SECRET,
        channelAccessToken: lineConfig.channel_access_token,
        botBasicId: lineConfig.bot_basic_id || "",
      };
    }
    // 備援：查詢 tenant_settings 的 notification_settings
    const { data: settings } = await supabase
      .from("tenant_settings")
      .select("notification_settings")
      .eq("tenant_id", tenantId)
      .single();
    if (settings?.notification_settings?.line) {
      const lineCfg = settings.notification_settings.line;
      if (lineCfg.channel_access_token) {
        return {
          channelId: lineCfg.channel_id || SYSTEM_LINE_CHANNEL_ID,
          channelSecret: lineCfg.channel_secret || SYSTEM_LINE_CHANNEL_SECRET,
          channelAccessToken: lineCfg.channel_access_token,
          botBasicId: lineCfg.bot_basic_id || "",
        };
      }
    }
  } catch (err) {
    console.warn(`[LINE] Failed to get tenant ${tenantId} LINE credentials, using system default`);
  }

  // 使用系統預設
  return {
    channelId: SYSTEM_LINE_CHANNEL_ID,
    channelSecret: SYSTEM_LINE_CHANNEL_SECRET,
    channelAccessToken: SYSTEM_LINE_CHANNEL_ACCESS_TOKEN,
    botBasicId: "",
  };
}

/**
 * 發送 Push Message 給指定用戶
 * 多租戶版本：根據 tenantId 取得對應的 LINE Channel 憑證
 */
export async function sendPushMessage(
  tenantId: number,
  userId: string,
  messages: LineMessage[]
): Promise<{ success: boolean; error?: string }> {
  const credentials = await getLineCredentials(tenantId);

  if (!credentials.channelAccessToken) {
    console.error(`[LINE] No channel access token for tenant ${tenantId}`);
    return { success: false, error: "LINE_CHANNEL_ACCESS_TOKEN is not configured" };
  }

  try {
    const response = await fetch(`${LINE_API_BASE}/message/push`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${credentials.channelAccessToken}`,
      },
      body: JSON.stringify({
        to: userId,
        messages,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`[LINE] Push message error for tenant ${tenantId}:`, response.status, errorText);
      return { success: false, error: errorText };
    }

    return { success: true };
  } catch (error) {
    console.error(`[LINE] Push message exception for tenant ${tenantId}:`, error);
    return { success: false, error: String(error) };
  }
}

/**
 * 發送文字訊息
 */
export async function sendTextMessage(
  tenantId: number,
  lineUserId: string,
  text: string
): Promise<{ success: boolean; error?: string }> {
  return sendPushMessage(tenantId, lineUserId, [{ type: "text", text }]);
}

/**
 * 發送 Flex Message
 */
export async function sendFlexMessage(
  tenantId: number,
  lineUserId: string,
  altText: string,
  contents: any
): Promise<{ success: boolean; error?: string }> {
  return sendPushMessage(tenantId, lineUserId, [
    { type: "flex", altText, contents },
  ]);
}

/**
 * 發送 Reply Message（用於 Webhook 回覆）
 */
export async function sendReplyMessage(
  tenantId: number,
  replyToken: string,
  messages: LineMessage[]
): Promise<{ success: boolean; error?: string }> {
  const credentials = await getLineCredentials(tenantId);

  if (!credentials.channelAccessToken) {
    return { success: false, error: "LINE_CHANNEL_ACCESS_TOKEN is not configured" };
  }

  try {
    const response = await fetch(`${LINE_API_BASE}/message/reply`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${credentials.channelAccessToken}`,
      },
      body: JSON.stringify({
        replyToken,
        messages,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`[LINE] Reply message error:`, response.status, errorText);
      return { success: false, error: errorText };
    }

    return { success: true };
  } catch (error) {
    console.error(`[LINE] Reply message exception:`, error);
    return { success: false, error: String(error) };
  }
}

/**
 * 取得用戶 Profile
 */
export async function getUserProfile(
  tenantId: number,
  lineUserId: string
): Promise<{ displayName: string; userId: string; pictureUrl?: string; statusMessage?: string } | null> {
  const credentials = await getLineCredentials(tenantId);

  if (!credentials.channelAccessToken) return null;

  try {
    const response = await fetch(`${LINE_API_BASE}/profile/${lineUserId}`, {
      headers: {
        Authorization: `Bearer ${credentials.channelAccessToken}`,
      },
    });

    if (!response.ok) return null;
    return await response.json();
  } catch {
    return null;
  }
}

/**
 * 驗證 Webhook 簽名
 */
export function verifyWebhookSignature(
  body: string,
  signature: string,
  channelSecret: string
): boolean {
  const hash = createHmac("sha256", channelSecret)
    .update(body)
    .digest("base64");
  return hash === signature;
}
