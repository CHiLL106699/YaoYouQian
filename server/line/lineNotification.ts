/**
 * LINE 通知模板 - 多租戶 SaaS 版本
 * 
 * 借鑑花花模板的 Flex Message 結構，改造為多租戶版本
 * 所有通知函數都接受 tenantId 作為第一個參數
 */

import { sendPushMessage, sendFlexMessage, sendTextMessage } from "./lineService";

// 狀態對應中文名稱
const STATUS_LABELS: Record<string, string> = {
  pending: "待確認",
  confirmed: "已確認",
  rescheduling: "需改期",
  cancelled: "已取消",
  completed: "已完成",
  paid: "已付款",
  shipped: "已出貨",
};

// 狀態對應顏色與 Emoji
function getStatusStyle(status: string) {
  switch (status) {
    case "confirmed": return { color: "#00C851", emoji: "✅" };
    case "cancelled": return { color: "#FF4444", emoji: "❌" };
    case "rescheduling": return { color: "#FF8800", emoji: "📅" };
    case "completed": return { color: "#33B5E5", emoji: "🎉" };
    case "pending": return { color: "#FFBB33", emoji: "⏳" };
    case "paid": return { color: "#00C851", emoji: "💰" };
    case "shipped": return { color: "#2196F3", emoji: "📦" };
    default: return { color: "#888888", emoji: "📋" };
  }
}

/**
 * 發送預約狀態更新通知
 */
export async function sendBookingStatusNotification(params: {
  tenantId: number;
  lineUserId: string;
  customerName: string;
  bookingDate: string;
  bookingTime: string;
  treatment: string;
  newStatus: string;
  notes?: string;
}): Promise<boolean> {
  const { tenantId, lineUserId, customerName, bookingDate, bookingTime, treatment, newStatus, notes } = params;
  const statusLabel = STATUS_LABELS[newStatus] || newStatus;
  const { color: statusColor, emoji: statusEmoji } = getStatusStyle(newStatus);

  const contents: any = {
    type: "bubble",
    header: {
      type: "box",
      layout: "vertical",
      backgroundColor: statusColor + "15",
      paddingAll: "lg",
      contents: [
        { type: "text", text: `${statusEmoji} 預約狀態更新`, weight: "bold", size: "lg", color: statusColor },
      ],
    },
    body: {
      type: "box",
      layout: "vertical",
      contents: [
        { type: "text", text: `${customerName} 您好`, weight: "bold", size: "md", margin: "none" },
        { type: "separator", margin: "md" },
        { type: "text", text: `您的預約狀態已更新為「${statusLabel}」`, size: "sm", color: "#666666", margin: "md", wrap: true },
        {
          type: "box", layout: "vertical", margin: "lg", spacing: "sm",
          contents: [
            { type: "box", layout: "baseline", spacing: "sm", contents: [
              { type: "text", text: "療程", color: "#aaaaaa", size: "sm", flex: 2 },
              { type: "text", text: treatment, wrap: true, color: "#666666", size: "sm", flex: 5 },
            ]},
            { type: "box", layout: "baseline", spacing: "sm", contents: [
              { type: "text", text: "日期", color: "#aaaaaa", size: "sm", flex: 2 },
              { type: "text", text: bookingDate, wrap: true, color: "#666666", size: "sm", flex: 5 },
            ]},
            { type: "box", layout: "baseline", spacing: "sm", contents: [
              { type: "text", text: "時段", color: "#aaaaaa", size: "sm", flex: 2 },
              { type: "text", text: bookingTime, wrap: true, color: "#666666", size: "sm", flex: 5 },
            ]},
            { type: "box", layout: "baseline", spacing: "sm", contents: [
              { type: "text", text: "狀態", color: "#aaaaaa", size: "sm", flex: 2 },
              { type: "text", text: statusLabel, wrap: true, color: statusColor, size: "sm", flex: 5, weight: "bold" },
            ]},
          ],
        },
        ...(notes ? [{
          type: "text" as const, text: `備註：${notes}`, size: "xs" as const, color: "#999999", margin: "lg" as const, wrap: true,
        }] : []),
      ],
    },
    footer: {
      type: "box", layout: "vertical",
      contents: [{ type: "text", text: "期待您的光臨！", size: "xs", color: "#aaaaaa", align: "center" }],
    },
  };

  const result = await sendFlexMessage(tenantId, lineUserId, `預約狀態更新：${statusLabel}`, contents);
  return result.success;
}

/**
 * 發送預約成功通知
 */
export async function sendBookingSuccessNotification(params: {
  tenantId: number;
  lineUserId: string;
  customerName: string;
  bookingDate: string;
  bookingTime: string;
  treatment: string;
  clinicName?: string;
}): Promise<boolean> {
  const { tenantId, lineUserId, customerName, bookingDate, bookingTime, treatment, clinicName } = params;

  const contents = {
    type: "bubble",
    header: {
      type: "box", layout: "vertical", backgroundColor: "#E8F5E9", paddingAll: "lg",
      contents: [{ type: "text", text: "✅ 預約成功", weight: "bold", size: "lg", color: "#2E7D32" }],
    },
    body: {
      type: "box", layout: "vertical",
      contents: [
        { type: "text", text: `${customerName} 您好`, weight: "bold", size: "md" },
        { type: "separator", margin: "md" },
        { type: "text", text: "您的預約已成功送出，請等待確認。", size: "sm", color: "#666666", margin: "md", wrap: true },
        {
          type: "box", layout: "vertical", margin: "lg", spacing: "sm",
          contents: [
            ...(clinicName ? [{ type: "box" as const, layout: "baseline" as const, spacing: "sm" as const, contents: [
              { type: "text" as const, text: "診所", color: "#aaaaaa", size: "sm" as const, flex: 2 },
              { type: "text" as const, text: clinicName, wrap: true, color: "#666666", size: "sm" as const, flex: 5 },
            ]}] : []),
            { type: "box", layout: "baseline", spacing: "sm", contents: [
              { type: "text", text: "療程", color: "#aaaaaa", size: "sm", flex: 2 },
              { type: "text", text: treatment, wrap: true, color: "#666666", size: "sm", flex: 5 },
            ]},
            { type: "box", layout: "baseline", spacing: "sm", contents: [
              { type: "text", text: "日期", color: "#aaaaaa", size: "sm", flex: 2 },
              { type: "text", text: bookingDate, wrap: true, color: "#666666", size: "sm", flex: 5 },
            ]},
            { type: "box", layout: "baseline", spacing: "sm", contents: [
              { type: "text", text: "時段", color: "#aaaaaa", size: "sm", flex: 2 },
              { type: "text", text: bookingTime, wrap: true, color: "#666666", size: "sm", flex: 5 },
            ]},
          ],
        },
      ],
    },
    footer: {
      type: "box", layout: "vertical",
      contents: [{ type: "text", text: "我們會盡快確認您的預約", size: "xs", color: "#aaaaaa", align: "center" }],
    },
  };

  const result = await sendFlexMessage(tenantId, lineUserId, "✅ 預約成功", contents);
  return result.success;
}

/**
 * 發送預約提醒通知（預約前一天）
 */
export async function sendAppointmentReminder(params: {
  tenantId: number;
  lineUserId: string;
  customerName: string;
  bookingDate: string;
  bookingTime: string;
  treatment: string;
  clinicName?: string;
  clinicAddress?: string;
}): Promise<boolean> {
  const { tenantId, lineUserId, customerName, bookingDate, bookingTime, treatment, clinicName, clinicAddress } = params;

  const contents = {
    type: "bubble",
    header: {
      type: "box", layout: "vertical", backgroundColor: "#FFF3E0", paddingAll: "lg",
      contents: [{ type: "text", text: "⏰ 預約提醒", weight: "bold", size: "lg", color: "#E65100" }],
    },
    body: {
      type: "box", layout: "vertical",
      contents: [
        { type: "text", text: `${customerName} 您好`, weight: "bold", size: "md" },
        { type: "separator", margin: "md" },
        { type: "text", text: "溫馨提醒：您明天有預約療程，請準時出席。", size: "sm", color: "#666666", margin: "md", wrap: true },
        {
          type: "box", layout: "vertical", margin: "lg", spacing: "sm",
          contents: [
            { type: "box", layout: "baseline", spacing: "sm", contents: [
              { type: "text", text: "療程", color: "#aaaaaa", size: "sm", flex: 2 },
              { type: "text", text: treatment, wrap: true, color: "#666666", size: "sm", flex: 5 },
            ]},
            { type: "box", layout: "baseline", spacing: "sm", contents: [
              { type: "text", text: "日期", color: "#aaaaaa", size: "sm", flex: 2 },
              { type: "text", text: bookingDate, wrap: true, color: "#E65100", size: "sm", flex: 5, weight: "bold" },
            ]},
            { type: "box", layout: "baseline", spacing: "sm", contents: [
              { type: "text", text: "時段", color: "#aaaaaa", size: "sm", flex: 2 },
              { type: "text", text: bookingTime, wrap: true, color: "#E65100", size: "sm", flex: 5, weight: "bold" },
            ]},
            ...(clinicName ? [{ type: "box" as const, layout: "baseline" as const, spacing: "sm" as const, contents: [
              { type: "text" as const, text: "診所", color: "#aaaaaa", size: "sm" as const, flex: 2 },
              { type: "text" as const, text: clinicName, wrap: true, color: "#666666", size: "sm" as const, flex: 5 },
            ]}] : []),
            ...(clinicAddress ? [{ type: "box" as const, layout: "baseline" as const, spacing: "sm" as const, contents: [
              { type: "text" as const, text: "地址", color: "#aaaaaa", size: "sm" as const, flex: 2 },
              { type: "text" as const, text: clinicAddress, wrap: true, color: "#666666", size: "sm" as const, flex: 5 },
            ]}] : []),
          ],
        },
      ],
    },
    footer: {
      type: "box", layout: "vertical",
      contents: [{ type: "text", text: "如需改期請提前聯繫我們", size: "xs", color: "#aaaaaa", align: "center" }],
    },
  };

  const result = await sendFlexMessage(tenantId, lineUserId, "⏰ 預約提醒", contents);
  return result.success;
}

/**
 * 發送商城訂單狀態通知
 */
export async function sendMallOrderStatusNotification(params: {
  tenantId: number;
  lineUserId: string;
  customerName: string;
  orderId: string;
  orderStatus: string;
  totalAmount: number;
  trackingNumber?: string;
}): Promise<boolean> {
  const { tenantId, lineUserId, customerName, orderId, orderStatus, totalAmount, trackingNumber } = params;
  const statusLabel = STATUS_LABELS[orderStatus] || orderStatus;
  const { color: statusColor, emoji: statusEmoji } = getStatusStyle(orderStatus);

  const bodyContents: any[] = [
    { type: "text", text: `${customerName} 您好`, weight: "bold", size: "md" },
    { type: "separator", margin: "md" },
    {
      type: "box", layout: "vertical", margin: "lg", spacing: "sm",
      contents: [
        { type: "box", layout: "baseline", spacing: "sm", contents: [
          { type: "text", text: "訂單編號", color: "#aaaaaa", size: "sm", flex: 3 },
          { type: "text", text: orderId, wrap: true, color: "#666666", size: "sm", flex: 5 },
        ]},
        { type: "box", layout: "baseline", spacing: "sm", contents: [
          { type: "text", text: "訂單金額", color: "#aaaaaa", size: "sm", flex: 3 },
          { type: "text", text: `NT$ ${totalAmount.toLocaleString()}`, wrap: true, color: "#666666", size: "sm", flex: 5 },
        ]},
        { type: "box", layout: "baseline", spacing: "sm", contents: [
          { type: "text", text: "訂單狀態", color: "#aaaaaa", size: "sm", flex: 3 },
          { type: "text", text: `${statusEmoji} ${statusLabel}`, wrap: true, color: statusColor, size: "sm", flex: 5, weight: "bold" },
        ]},
      ],
    },
  ];

  if (trackingNumber) {
    bodyContents.push({
      type: "box", layout: "baseline", spacing: "sm", margin: "md",
      contents: [
        { type: "text", text: "物流單號", color: "#aaaaaa", size: "sm", flex: 3 },
        { type: "text", text: trackingNumber, wrap: true, color: "#2196F3", size: "sm", flex: 5, weight: "bold" },
      ],
    });
  }

  const contents = {
    type: "bubble",
    header: {
      type: "box", layout: "vertical", backgroundColor: statusColor + "15", paddingAll: "lg",
      contents: [{ type: "text", text: `${statusEmoji} 訂單狀態更新`, weight: "bold", size: "lg", color: statusColor }],
    },
    body: { type: "box", layout: "vertical", contents: bodyContents },
    footer: {
      type: "box", layout: "vertical",
      contents: [{ type: "text", text: "感謝您的購買！", size: "xs", color: "#aaaaaa", align: "center" }],
    },
  };

  const result = await sendFlexMessage(tenantId, lineUserId, `訂單狀態更新：${statusLabel}`, contents);
  return result.success;
}

/**
 * 發送改期核准通知
 */
export async function sendRescheduleApprovedNotification(params: {
  tenantId: number;
  lineUserId: string;
  customerName: string;
  treatment: string;
  oldDate: string;
  oldTime: string;
  newDate: string;
  newTime: string;
}): Promise<boolean> {
  const { tenantId, lineUserId, customerName, treatment, oldDate, oldTime, newDate, newTime } = params;

  const contents = {
    type: "bubble",
    header: {
      type: "box", layout: "vertical", backgroundColor: "#E8F5E9", paddingAll: "lg",
      contents: [{ type: "text", text: "✅ 改期申請已通過", weight: "bold", size: "lg", color: "#2E7D32" }],
    },
    body: {
      type: "box", layout: "vertical",
      contents: [
        { type: "text", text: `${customerName} 您好`, weight: "bold", size: "md" },
        { type: "separator", margin: "md" },
        { type: "text", text: "您的改期申請已通過，新的預約時間如下：", size: "sm", color: "#666666", margin: "md", wrap: true },
        {
          type: "box", layout: "vertical", margin: "lg", spacing: "sm",
          contents: [
            { type: "box", layout: "baseline", spacing: "sm", contents: [
              { type: "text", text: "療程", color: "#aaaaaa", size: "sm", flex: 2 },
              { type: "text", text: treatment, wrap: true, color: "#666666", size: "sm", flex: 5 },
            ]},
            { type: "box", layout: "baseline", spacing: "sm", contents: [
              { type: "text", text: "原時間", color: "#aaaaaa", size: "sm", flex: 2 },
              { type: "text", text: `${oldDate} ${oldTime}`, wrap: true, color: "#999999", size: "sm", flex: 5, decoration: "line-through" },
            ]},
            { type: "box", layout: "baseline", spacing: "sm", contents: [
              { type: "text", text: "新時間", color: "#aaaaaa", size: "sm", flex: 2 },
              { type: "text", text: `${newDate} ${newTime}`, wrap: true, color: "#10B981", size: "sm", flex: 5, weight: "bold" },
            ]},
          ],
        },
      ],
    },
    footer: {
      type: "box", layout: "vertical",
      contents: [{ type: "text", text: "期待您的光臨！", size: "xs", color: "#aaaaaa", align: "center" }],
    },
  };

  const result = await sendFlexMessage(tenantId, lineUserId, "✅ 改期申請已通過", contents);
  return result.success;
}

/**
 * 發送改期拒絕通知
 */
export async function sendRescheduleRejectedNotification(params: {
  tenantId: number;
  lineUserId: string;
  customerName: string;
  treatment: string;
  bookingDate: string;
  bookingTime: string;
  reason: string;
}): Promise<boolean> {
  const { tenantId, lineUserId, customerName, treatment, bookingDate, bookingTime, reason } = params;

  const contents = {
    type: "bubble",
    header: {
      type: "box", layout: "vertical", backgroundColor: "#FFEBEE", paddingAll: "lg",
      contents: [{ type: "text", text: "❌ 改期申請未通過", weight: "bold", size: "lg", color: "#EF4444" }],
    },
    body: {
      type: "box", layout: "vertical",
      contents: [
        { type: "text", text: `${customerName} 您好`, weight: "bold", size: "md" },
        { type: "separator", margin: "md" },
        { type: "text", text: "很抱歉，您的改期申請未能通過。", size: "sm", color: "#666666", margin: "md" },
        {
          type: "box", layout: "vertical", margin: "lg", spacing: "sm",
          contents: [
            { type: "box", layout: "baseline", spacing: "sm", contents: [
              { type: "text", text: "療程", color: "#aaaaaa", size: "sm", flex: 2 },
              { type: "text", text: treatment, wrap: true, color: "#666666", size: "sm", flex: 5 },
            ]},
            { type: "box", layout: "baseline", spacing: "sm", contents: [
              { type: "text", text: "原時間", color: "#aaaaaa", size: "sm", flex: 2 },
              { type: "text", text: `${bookingDate} ${bookingTime}`, wrap: true, color: "#666666", size: "sm", flex: 5 },
            ]},
            { type: "box", layout: "baseline", spacing: "sm", contents: [
              { type: "text", text: "原因", color: "#aaaaaa", size: "sm", flex: 2 },
              { type: "text", text: reason, wrap: true, color: "#EF4444", size: "sm", flex: 5 },
            ]},
          ],
        },
        { type: "text", text: "您的預約時間維持不變，如需協助請聯繫我們。", size: "xs", color: "#999999", margin: "lg", wrap: true },
      ],
    },
    footer: {
      type: "box", layout: "vertical",
      contents: [{ type: "text", text: "感謝您的理解", size: "xs", color: "#aaaaaa", align: "center" }],
    },
  };

  const result = await sendFlexMessage(tenantId, lineUserId, "❌ 改期申請未通過", contents);
  return result.success;
}

/**
 * 發送預約審核通知給管理員/群組
 */
export async function sendApprovalNotificationToOwner(params: {
  tenantId: number;
  ownerLineUserId: string;
  customerName: string;
  customerPhone: string;
  treatment: string;
  bookingDate: string;
  bookingTime: string;
  notes?: string;
}): Promise<boolean> {
  const { tenantId, ownerLineUserId, customerName, customerPhone, treatment, bookingDate, bookingTime, notes } = params;

  const contents = {
    type: "bubble",
    header: {
      type: "box", layout: "vertical", backgroundColor: "#E3F2FD", paddingAll: "lg",
      contents: [{ type: "text", text: "🔔 新預約待審核", weight: "bold", size: "lg", color: "#1565C0" }],
    },
    body: {
      type: "box", layout: "vertical",
      contents: [
        {
          type: "box", layout: "vertical", spacing: "sm",
          contents: [
            { type: "box", layout: "baseline", spacing: "sm", contents: [
              { type: "text", text: "客戶", color: "#aaaaaa", size: "sm", flex: 2 },
              { type: "text", text: customerName, wrap: true, color: "#333333", size: "sm", flex: 5, weight: "bold" },
            ]},
            { type: "box", layout: "baseline", spacing: "sm", contents: [
              { type: "text", text: "電話", color: "#aaaaaa", size: "sm", flex: 2 },
              { type: "text", text: customerPhone, wrap: true, color: "#666666", size: "sm", flex: 5 },
            ]},
            { type: "box", layout: "baseline", spacing: "sm", contents: [
              { type: "text", text: "療程", color: "#aaaaaa", size: "sm", flex: 2 },
              { type: "text", text: treatment, wrap: true, color: "#666666", size: "sm", flex: 5 },
            ]},
            { type: "box", layout: "baseline", spacing: "sm", contents: [
              { type: "text", text: "日期", color: "#aaaaaa", size: "sm", flex: 2 },
              { type: "text", text: bookingDate, wrap: true, color: "#666666", size: "sm", flex: 5 },
            ]},
            { type: "box", layout: "baseline", spacing: "sm", contents: [
              { type: "text", text: "時段", color: "#aaaaaa", size: "sm", flex: 2 },
              { type: "text", text: bookingTime, wrap: true, color: "#666666", size: "sm", flex: 5 },
            ]},
            ...(notes ? [{ type: "box" as const, layout: "baseline" as const, spacing: "sm" as const, contents: [
              { type: "text" as const, text: "備註", color: "#aaaaaa", size: "sm" as const, flex: 2 },
              { type: "text" as const, text: notes, wrap: true, color: "#666666", size: "sm" as const, flex: 5 },
            ]}] : []),
          ],
        },
      ],
    },
    footer: {
      type: "box", layout: "vertical",
      contents: [{ type: "text", text: "請至後台審核此預約", size: "xs", color: "#aaaaaa", align: "center" }],
    },
  };

  const result = await sendFlexMessage(tenantId, ownerLineUserId, "🔔 新預約待審核", contents);
  return result.success;
}

/**
 * 發送術後護理圖卡
 */
export async function sendAftercareCard(params: {
  tenantId: number;
  lineUserId: string;
  treatmentName: string;
  instructions: string[];
  imageUrl?: string;
}): Promise<boolean> {
  const { tenantId, lineUserId, treatmentName, instructions, imageUrl } = params;

  const instructionContents = instructions.map((inst, idx) => ({
    type: "box" as const,
    layout: "horizontal" as const,
    spacing: "sm" as const,
    margin: "sm" as const,
    contents: [
      { type: "text" as const, text: `${idx + 1}.`, color: "#E91E63", size: "sm" as const, flex: 1 },
      { type: "text" as const, text: inst, wrap: true, color: "#666666", size: "sm" as const, flex: 9 },
    ],
  }));

  const contents: any = {
    type: "bubble",
    ...(imageUrl ? {
      hero: {
        type: "image",
        url: imageUrl,
        size: "full",
        aspectRatio: "20:13",
        aspectMode: "cover",
      },
    } : {}),
    header: {
      type: "box", layout: "vertical", backgroundColor: "#FCE4EC", paddingAll: "lg",
      contents: [
        { type: "text", text: "💊 術後護理須知", weight: "bold", size: "lg", color: "#C2185B" },
        { type: "text", text: treatmentName, size: "sm", color: "#E91E63", margin: "sm" },
      ],
    },
    body: {
      type: "box", layout: "vertical",
      contents: instructionContents,
    },
    footer: {
      type: "box", layout: "vertical",
      contents: [{ type: "text", text: "如有不適請立即聯繫我們", size: "xs", color: "#aaaaaa", align: "center" }],
    },
  };

  const result = await sendFlexMessage(tenantId, lineUserId, `💊 ${treatmentName} 術後護理須知`, contents);
  return result.success;
}

/**
 * 發送會員等級升級通知
 */
export async function sendMemberLevelUpNotification(params: {
  tenantId: number;
  lineUserId: string;
  customerName: string;
  newLevel: string;
  benefits: string[];
}): Promise<boolean> {
  const { tenantId, lineUserId, customerName, newLevel, benefits } = params;

  const benefitContents = benefits.map(b => ({
    type: "text" as const, text: `✨ ${b}`, size: "sm" as const, color: "#666666", margin: "sm" as const, wrap: true,
  }));

  const contents = {
    type: "bubble",
    header: {
      type: "box", layout: "vertical", backgroundColor: "#FFF8E1", paddingAll: "lg",
      contents: [{ type: "text", text: "🎉 會員等級升級", weight: "bold", size: "lg", color: "#F57F17" }],
    },
    body: {
      type: "box", layout: "vertical",
      contents: [
        { type: "text", text: `恭喜 ${customerName}！`, weight: "bold", size: "md" },
        { type: "separator", margin: "md" },
        { type: "text", text: `您已升級為 ${newLevel} 會員`, size: "md", color: "#F57F17", margin: "md", weight: "bold" },
        { type: "text", text: "專屬權益：", size: "sm", color: "#333333", margin: "lg", weight: "bold" },
        ...benefitContents,
      ],
    },
    footer: {
      type: "box", layout: "vertical",
      contents: [{ type: "text", text: "感謝您的支持！", size: "xs", color: "#aaaaaa", align: "center" }],
    },
  };

  const result = await sendFlexMessage(tenantId, lineUserId, "🎉 會員等級升級", contents);
  return result.success;
}

/**
 * 發送生日祝賀與優惠券
 */
export async function sendBirthdayCouponNotification(params: {
  tenantId: number;
  lineUserId: string;
  customerName: string;
  couponCode: string;
  discount: string;
  expiryDate: string;
}): Promise<boolean> {
  const { tenantId, lineUserId, customerName, couponCode, discount, expiryDate } = params;

  const contents = {
    type: "bubble",
    header: {
      type: "box", layout: "vertical", backgroundColor: "#F3E5F5", paddingAll: "lg",
      contents: [{ type: "text", text: "🎂 生日快樂！", weight: "bold", size: "xl", color: "#7B1FA2" }],
    },
    body: {
      type: "box", layout: "vertical",
      contents: [
        { type: "text", text: `親愛的 ${customerName}`, weight: "bold", size: "md" },
        { type: "text", text: "祝您生日快樂！送您一份專屬優惠：", size: "sm", color: "#666666", margin: "md", wrap: true },
        { type: "separator", margin: "lg" },
        {
          type: "box", layout: "vertical", margin: "lg", backgroundColor: "#F3E5F5", cornerRadius: "md", paddingAll: "lg",
          contents: [
            { type: "text", text: discount, size: "xl", color: "#7B1FA2", weight: "bold", align: "center" },
            { type: "text", text: `優惠碼：${couponCode}`, size: "md", color: "#9C27B0", align: "center", margin: "md", weight: "bold" },
            { type: "text", text: `有效期限：${expiryDate}`, size: "xs", color: "#999999", align: "center", margin: "sm" },
          ],
        },
      ],
    },
    footer: {
      type: "box", layout: "vertical",
      contents: [{ type: "text", text: "期待您的光臨 💕", size: "xs", color: "#aaaaaa", align: "center" }],
    },
  };

  const result = await sendFlexMessage(tenantId, lineUserId, "🎂 生日快樂！專屬優惠送給您", contents);
  return result.success;
}

/**
 * 發送取消通知給管理員
 */
export async function sendCancellationNotificationToOwner(params: {
  tenantId: number;
  ownerLineUserId: string;
  customerName: string;
  treatment: string;
  bookingDate: string;
  bookingTime: string;
  reason?: string;
}): Promise<boolean> {
  const { tenantId, ownerLineUserId, customerName, treatment, bookingDate, bookingTime, reason } = params;

  const contents = {
    type: "bubble",
    header: {
      type: "box", layout: "vertical", backgroundColor: "#FFEBEE", paddingAll: "lg",
      contents: [{ type: "text", text: "⚠️ 預約取消通知", weight: "bold", size: "lg", color: "#C62828" }],
    },
    body: {
      type: "box", layout: "vertical",
      contents: [
        {
          type: "box", layout: "vertical", spacing: "sm",
          contents: [
            { type: "box", layout: "baseline", spacing: "sm", contents: [
              { type: "text", text: "客戶", color: "#aaaaaa", size: "sm", flex: 2 },
              { type: "text", text: customerName, color: "#333333", size: "sm", flex: 5, weight: "bold" },
            ]},
            { type: "box", layout: "baseline", spacing: "sm", contents: [
              { type: "text", text: "療程", color: "#aaaaaa", size: "sm", flex: 2 },
              { type: "text", text: treatment, color: "#666666", size: "sm", flex: 5 },
            ]},
            { type: "box", layout: "baseline", spacing: "sm", contents: [
              { type: "text", text: "時間", color: "#aaaaaa", size: "sm", flex: 2 },
              { type: "text", text: `${bookingDate} ${bookingTime}`, color: "#666666", size: "sm", flex: 5 },
            ]},
            ...(reason ? [{ type: "box" as const, layout: "baseline" as const, spacing: "sm" as const, contents: [
              { type: "text" as const, text: "原因", color: "#aaaaaa", size: "sm" as const, flex: 2 },
              { type: "text" as const, text: reason, wrap: true, color: "#C62828", size: "sm" as const, flex: 5 },
            ]}] : []),
          ],
        },
      ],
    },
  };

  const result = await sendFlexMessage(tenantId, ownerLineUserId, "⚠️ 預約取消通知", contents);
  return result.success;
}
