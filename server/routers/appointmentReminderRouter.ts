import { z } from "zod";
import { router, protectedProcedure } from "../_core/trpc";
import { TRPCError } from "@trpc/server";
import { supabase } from "../supabaseClient";
import { sendFlexMessage } from "../line/lineService";
import { buildReminderFlexMessage } from "../cron/reminderScheduler";

export const appointmentReminderRouter = router({
  /** 查詢提醒歷史（分頁 + 狀態篩選） */
  list: protectedProcedure
    .input(z.object({
      tenantId: z.number(),
      appointmentId: z.number().optional(),
      status: z.enum(["pending", "sent", "failed", "skipped"]).optional(),
      reminderType: z.enum(["24h", "2h", "custom"]).optional(),
      page: z.number().default(1),
      pageSize: z.number().default(20),
    }))
    .query(async ({ input }) => {
      let query = supabase
        .from("appointment_reminders")
        .select("*, appointments!appointment_reminders_appointment_id_fkey(id, appointment_date, appointment_time, customers!appointments_customer_id_fkey(id, name, phone, line_user_id))", { count: "exact" })
        .eq("tenant_id", input.tenantId);

      if (input.appointmentId) query = query.eq("appointment_id", input.appointmentId);
      if (input.status) query = query.eq("status", input.status);
      if (input.reminderType) query = query.eq("reminder_type", input.reminderType);

      const { data, error, count } = await query
        .range((input.page - 1) * input.pageSize, input.page * input.pageSize - 1)
        .order("created_at", { ascending: false });

      if (error) {
        throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: `查詢提醒歷史失敗: ${error.message}` });
      }

      return { reminders: data || [], total: count || 0, page: input.page, pageSize: input.pageSize };
    }),

  /** 手動觸發提醒（重新發送） */
  sendManual: protectedProcedure
    .input(z.object({
      tenantId: z.number(),
      appointmentId: z.number(),
      reminderType: z.enum(["24h", "2h", "custom"]).default("custom"),
      channel: z.enum(["line", "sms", "email"]).default("line"),
    }))
    .mutation(async ({ input }) => {
      // 取得預約與客戶資訊
      const { data: appointment, error: aptErr } = await supabase
        .from("appointments")
        .select("*, customers!appointments_customer_id_fkey(id, name, phone, line_user_id)")
        .eq("id", input.appointmentId)
        .eq("tenant_id", input.tenantId)
        .single();

      if (aptErr || !appointment) {
        throw new TRPCError({ code: "NOT_FOUND", message: "預約不存在" });
      }

      const customer = (appointment as any).customers;
      if (!customer?.line_user_id && input.channel === "line") {
        throw new TRPCError({ code: "BAD_REQUEST", message: "客戶未綁定 LINE，無法發送 LINE 提醒" });
      }

      // 建立提醒記錄
      const { data: reminder, error: insertErr } = await supabase
        .from("appointment_reminders")
        .insert({
          appointment_id: input.appointmentId,
          tenant_id: input.tenantId,
          reminder_type: input.reminderType,
          channel: input.channel,
          status: "pending",
        })
        .select()
        .single();

      if (insertErr) {
        throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: `建立提醒記錄失敗: ${insertErr.message}` });
      }

      // 發送 LINE 提醒
      if (input.channel === "line" && customer?.line_user_id) {
        try {
          const flexContents = buildReminderFlexMessage({
            customerName: customer.name,
            appointmentDate: appointment.appointment_date,
            appointmentTime: appointment.appointment_time,
            reminderType: input.reminderType,
          });

          const result = await sendFlexMessage(
            input.tenantId,
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

          return { success: result.success, reminderId: reminder.id, error: result.error };
        } catch (err) {
          await supabase
            .from("appointment_reminders")
            .update({ status: "failed", error_message: String(err), sent_at: new Date().toISOString() })
            .eq("id", reminder.id);

          return { success: false, reminderId: reminder.id, error: String(err) };
        }
      }

      return { success: true, reminderId: reminder.id };
    }),

  /** 取得提醒統計 */
  stats: protectedProcedure
    .input(z.object({ tenantId: z.number() }))
    .query(async ({ input }) => {
      const { data, error } = await supabase
        .from("appointment_reminders")
        .select("status")
        .eq("tenant_id", input.tenantId);

      if (error) {
        throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: `查詢統計失敗: ${error.message}` });
      }

      const stats = { total: 0, sent: 0, failed: 0, pending: 0, skipped: 0 };
      for (const row of data || []) {
        stats.total++;
        if (row.status === "sent") stats.sent++;
        else if (row.status === "failed") stats.failed++;
        else if (row.status === "pending") stats.pending++;
        else if (row.status === "skipped") stats.skipped++;
      }
      return stats;
    }),
});
