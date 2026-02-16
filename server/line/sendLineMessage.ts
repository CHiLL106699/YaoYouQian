/**
 * sendLineMessage 相容層
 * 
 * 此模組為向後相容而存在，將舊的 sendLineMessage 呼叫
 * 轉發到新的多租戶 lineService 模組
 */

import { sendPushMessage, sendFlexMessage, sendTextMessage } from "./lineService";

/**
 * 發送 LINE 訊息（相容舊版 API）
 * 注意：此函數需要 tenantId，若未提供則使用預設值 0（系統級）
 */
export async function sendLineMessage(
  lineUserId: string,
  message: any,
  tenantId: number = 0
): Promise<{ success: boolean; error?: string }> {
  if (message.type === "flex") {
    return sendFlexMessage(tenantId, lineUserId, message.altText || "通知", message.contents);
  } else if (message.type === "text") {
    return sendTextMessage(tenantId, lineUserId, message.text);
  } else {
    return sendPushMessage(tenantId, lineUserId, [message]);
  }
}

export default sendLineMessage;
