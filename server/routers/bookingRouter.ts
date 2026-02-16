import { z } from "zod";
import { router, publicProcedure } from "../_core/trpc";
import { TRPCError } from "@trpc/server";
import { supabase } from "../supabaseClient";

export const bookingRouter = router({
  getAvailableSlots: publicProcedure
    .input(z.object({
      tenantId: z.number(),
      date: z.string(),
    }))
    .query(async ({ input }) => {
      // 取得該日期的時段上限設定
      const { data: slotLimits } = await supabase
        .from('booking_slot_limits')
        .select('*')
        .eq('tenant_id', input.tenantId)
        .eq('date', input.date);

      // 取得該日期已有的預約數量
      const { data: appointments } = await supabase
        .from('appointments')
        .select('appointment_time')
        .eq('tenant_id', input.tenantId)
        .eq('appointment_date', input.date)
        .neq('status', 'cancelled');

      // 預設時段（9:00-18:00，每小時一個時段）
      const defaultSlots = [
        '09:00', '10:00', '11:00', '12:00', 
        '13:00', '14:00', '15:00', '16:00', '17:00'
      ];

      // 計算每個時段的可用數量
      const availableSlots = defaultSlots.map(slot => {
        const limit = slotLimits?.find(l => l.time_slot === slot)?.max_bookings || 5;
        const booked = appointments?.filter(a => a.appointment_time === slot).length || 0;
        return {
          time: slot,
          available: limit - booked,
          isAvailable: (limit - booked) > 0,
        };
      });

      return availableSlots;
    }),

  submitBooking: publicProcedure
    .input(z.object({
      tenantId: z.number(),
      date: z.string(),
      timeSlot: z.string(),
      name: z.string().min(1, '姓名不能為空'),
      phone: z.string().min(1, '電話不能為空'),
      notes: z.string().optional(),
      lineUserId: z.string().optional(),
    }))
    .mutation(async ({ input }) => {
      // 1. 檢查客戶是否已存在
      let customerId: number;
      let existingCustomer = null;
      
      if (input.lineUserId) {
        // 如果有 LINE User ID，優先用 LINE User ID 查詢
        const { data } = await supabase
          .from('customers')
          .select('id')
          .eq('tenant_id', input.tenantId)
          .eq('line_user_id', input.lineUserId)
          .single();
        existingCustomer = data;
      } else {
        // 如果沒有 LINE User ID，用手機號碼查詢
        const { data } = await supabase
          .from('customers')
          .select('id')
          .eq('tenant_id', input.tenantId)
          .eq('phone', input.phone)
          .single();
        existingCustomer = data;
      }

      if (existingCustomer) {
        customerId = existingCustomer.id;
      } else {
        // 建立新客戶
        const { data: newCustomer, error: customerError } = await supabase
          .from('customers')
          .insert({
            tenant_id: input.tenantId,
            name: input.name,
            phone: input.phone,
            line_user_id: input.lineUserId,
          })
          .select()
          .single();

        if (customerError || !newCustomer) {
          throw new TRPCError({
            code: 'INTERNAL_SERVER_ERROR',
            message: `建立客戶資料失敗: ${customerError?.message}`
          });
        }

        customerId = newCustomer.id;
      }

      // 2. 建立預約資料
      // 將 date (YYYY-MM-DD) 和 timeSlot (HH:MM) 合併為 timestamp
      const appointmentTimestamp = `${input.date}T${input.timeSlot}:00+08:00`;
      
      const { data: appointment, error: appointmentError } = await supabase
        .from('appointments')
        .insert({
          tenant_id: input.tenantId,
          customer_id: customerId,
          appointment_date: input.date,
          appointment_time: appointmentTimestamp,
          status: 'pending',
          notes: input.notes,
        })
        .select()
        .single();

      if (appointmentError || !appointment) {
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: `建立預約失敗: ${appointmentError?.message}`
        });
      }

      // 3. 發送 LINE 通知（透過 Edge Function）
      // TODO: 呼叫 LINE Messaging API Edge Function 發送預約確認通知

      // 3. 如果有 LINE User ID，發送 LINE 通知
      if (input.lineUserId) {
        try {
          const { sendBookingConfirmation } = await import('../_core/lineMessaging');
          await sendBookingConfirmation({
            userId: input.lineUserId,
            bookingId: appointment.id.toString(),
            serviceName: '預約服務', // TODO: 從資料庫取得真實服務名稱
            appointmentDate: input.date,
            appointmentTime: input.timeSlot,
            customerName: input.name,
          });
          console.log('[LINE] Booking confirmation sent to:', input.lineUserId);
        } catch (error) {
          console.error('[LINE] Failed to send booking confirmation:', error);
          // 不阻斷預約流程，僅記錄錯誤
        }
      }

      return { success: true, appointmentId: appointment.id };
    }),

  listByCustomer: publicProcedure
    .input(z.object({
      lineUserId: z.string().optional(),
    }))
    .query(async ({ input }) => {
      // 1. 查詢客戶 ID
      const { data: customer } = await supabase
        .from('customers')
        .select('id, tenant_id')
        .eq('line_user_id', input.lineUserId)
        .single();

      if (!customer) {
        return [];
      }

      // 2. 查詢該客戶的所有預約
      const { data: appointments, error } = await supabase
        .from('appointments')
        .select('*')
        .eq('customer_id', customer.id)
        .order('appointment_date', { ascending: false });

      if (error) {
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: `查詢預約失敗: ${error.message}`
        });
      }

      return appointments || [];
    }),

  cancel: publicProcedure
    .input(z.object({
      appointmentId: z.number(),
    }))
    .mutation(async ({ input }) => {
      const { error } = await supabase
        .from('appointments')
        .update({ status: 'cancelled' })
        .eq('id', input.appointmentId);

      if (error) {
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: `取消預約失敗: ${error.message}`
        });
      }

      // TODO: 發送 LINE 通知

      return { success: true };
    }),
});
