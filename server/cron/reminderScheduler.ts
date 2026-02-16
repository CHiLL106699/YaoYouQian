/**
 * 預約提醒排程器
 *
 * 功能：
 * 1. 掃描未來 24 小時的預約 → 發送 LINE 提醒（Flex Message 卡片）
 * 2. 掃描未來 2 小時的預約 → 發送 LINE 最後提醒
 * 3. 記錄每次發送結果到 appointment_reminders 表
 *
 * 此模組提供排程邏輯函式，可由 cron job 或 Edge Function 呼叫。
 */

import { supabase } from "../supabaseClient";
import { sendFlexMessage } from "../line/lineService";

interface ReminderFlexParams {
  customerName: string;
  appointmentDate: string;
  appointmentTime: string;
  reminderType: "24h" | "2h" | "custom";
  clinicName?: string;
  clinicAddress?: string;
  notes?: string;
}

/**
 * 建構預約提醒 Flex Message 卡片
 */
export function buildReminderFlexMessage(params: ReminderFlexParams) {
  const {
    customerName,
    appointmentDate,
    appointmentTime,
    reminderType,
    clinicName = "曜友仟診所",
    clinicAddress = "",
    notes = "",
  } = params;

  const isUrgent = reminderType === "2h";
  const headerText = isUrgent ? "⏰ 預約即將開始" : "📅 預約提醒通知";
  const headerColor = isUrgent ? "#FF6B6B" : "#4ECDC4";

  const bodyContents: any[] = [
    {
      type: "text",
      text: `${customerName} 您好`,
      weight: "bold",
      size: "lg",
      margin: "md",
    },
    {
      type: "text",
      text: isUrgent
        ? "您的預約即將在 2 小時內開始，請準時到達！"
        : "溫馨提醒您明天有一個預約，請記得準時前往。",
      size: "sm",
      color: "#666666",
      wrap: true,
      margin: "md",
    },
    { type: "separator", margin: "lg" },
    {
      type: "box",
      layout: "vertical",
      margin: "lg",
      spacing: "sm",
      contents: [
        {
          type: "box",
          layout: "horizontal",
          contents: [
            { type: "text", text: "日期", size: "sm", color: "#AAAAAA", flex: 2 },
            { type: "text", text: appointmentDate, size: "sm", color: "#333333", flex: 5, wrap: true },
          ],
        },
        {
          type: "box",
          layout: "horizontal",
          contents: [
            { type: "text", text: "時間", size: "sm", color: "#AAAAAA", flex: 2 },
            { type: "text", text: appointmentTime, size: "sm", color: "#333333", flex: 5 },
          ],
        },
        ...(clinicAddress
          ? [
              {
                type: "box" as const,
                layout: "horizontal" as const,
                contents: [
                  { type: "text" as const, text: "地點", size: "sm" as const, color: "#AAAAAA", flex: 2 },
                  { type: "text" as const, text: clinicAddress, size: "sm" as const, color: "#333333", flex: 5, wrap: true },
                ],
              },
            ]
          : []),
      ],
    },
  ];

  if (notes) {
    bodyContents.push({
      type: "box",
      layout: "vertical",
      margin: "lg",
      contents: [
        { type: "text", text: "注意事項", size: "sm", color: "#AAAAAA" },
        { type: "text", text: notes, size: "sm", color: "#666666", wrap: true, margin: "sm" },
      ],
    });
  }

  return {
    type: "bubble",
    header: {
      type: "box",
      layout: "vertical",
      backgroundColor: headerColor,
      paddingAll: "lg",
      contents: [
        {
          type: "text",
          text: headerText,
          color: "#FFFFFF",
          weight: "bold",
          size: "lg",
        },
        {
          type: "text",
          text: clinicName,
          color: "#FFFFFFCC",
          size: "sm",
          margin: "sm",
        },
      ],
    },
    body: {
      type: "box",
      layout: "vertical",
      contents: bodyContents,
    },
    footer: {
      type: "box",
      layout: "vertical",
      spacing: "sm",
      paddingAll: "lg",
      contents: [
        {
          type: "text",
          text: "如需取消或改期，請提前聯繫我們",
          size: "xs",
          color: "#AAAAAA",
          align: "center",
        },
      ],
    },
  };
}

/**
 * 掃描並發送指定時間範圍內的預約提醒
 * @param hoursAhead - 提前幾小時掃描（24 或 2）
 * @param reminderType - 提醒類型
 */
export async function scanAndSendReminders(
  hoursAhead: number,
  reminderType: "24h" | "2h"
): Promise<{ sent: number; failed: number; skipped: number }> {
  const now = new Date();
  const targetTime = new Date(now.getTime() + hoursAhead * 60 * 60 * 1000);

  // 計算掃描範圍（前後 30 分鐘的窗口）
  const windowStart = new Date(targetTime.getTime() - 30 * 60 * 1000);
  const windowEnd = new Date(targetTime.getTime() + 30 * 60 * 1000);

  const startDate = windowStart.toISOString().split("T")[0];
  const endDate = windowEnd.toISOString().split("T")[0];

  // 查詢範圍內的預約
  const { data: appointments, error } = await supabase
    .from("appointments")
    .select("*, customers!appointments_customer_id_fkey(id, name, phone, line_user_id)")
    .in("status", ["approved", "pending"])
    .gte("appointment_date", startDate)
    .lte("appointment_date", endDate);

  if (error) {
    console.error(`[ReminderScheduler] 查詢預約失敗: ${error.message}`);
    return { sent: 0, failed: 0, skipped: 0 };
  }

  let sent = 0;
  let failed = 0;
  let skipped = 0;

  for (const apt of appointments || []) {
    const customer = (apt as any).customers;
    if (!customer?.line_user_id) {
      skipped++;
      continue;
    }

    // 檢查是否已發送過同類型提醒
    const { data: existing } = await supabase
      .from("appointment_reminders")
      .select("id")
      .eq("appointment_id", apt.id)
      .eq("reminder_type", reminderType)
      .eq("status", "sent")
      .limit(1);

    if (existing && existing.length > 0) {
      skipped++;
      continue;
    }

    // 建立提醒記錄
    const { data: reminder, error: insertErr } = await supabase
      .from("appointment_reminders")
      .insert({
        appointment_id: apt.id,
        tenant_id: apt.tenant_id,
        reminder_type: reminderType,
        channel: "line",
        status: "pending",
      })
      .select()
      .single();

    if (insertErr || !reminder) {
      failed++;
      continue;
    }

    // 發送 Flex Message
    try {
      const flexContents = buildReminderFlexMessage({
        customerName: customer.name,
        appointmentDate: apt.appointment_date,
        appointmentTime: apt.appointment_time || "待確認",
        reminderType,
      });

      const result = await sendFlexMessage(
        apt.tenant_id,
        customer.line_user_id,
        "預約提醒通知",
        flexContents
      );

      await supabase
        .from("appointment_reminders")
        .update({
          status: result.success ? "sent" : "failed",
          sent_at: new Date().toISOString(),
          error_message: result.error || null,
        })
        .eq("id", reminder.id);

      if (result.success) sent++;
      else failed++;
    } catch (err) {
      await supabase
        .from("appointment_reminders")
        .update({ status: "failed", error_message: String(err), sent_at: new Date().toISOString() })
        .eq("id", reminder.id);
      failed++;
    }
  }

  console.log(`[ReminderScheduler] ${reminderType} 提醒完成: sent=${sent}, failed=${failed}, skipped=${skipped}`);
  return { sent, failed, skipped };
}

/**
 * 執行完整的提醒排程（由 cron 呼叫）
 */
export async function runReminderSchedule(): Promise<void> {
  console.log("[ReminderScheduler] 開始執行提醒排程...");

  const result24h = await scanAndSendReminders(24, "24h");
  console.log(`[ReminderScheduler] 24h 提醒: ${JSON.stringify(result24h)}`);

  const result2h = await scanAndSendReminders(2, "2h");
  console.log(`[ReminderScheduler] 2h 提醒: ${JSON.stringify(result2h)}`);

  console.log("[ReminderScheduler] 排程執行完畢");
}
