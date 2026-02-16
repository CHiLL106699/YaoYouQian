import { z } from "zod";
import { router, protectedProcedure } from "../_core/trpc";
import { TRPCError } from "@trpc/server";
import { supabase } from "../supabaseClient";


export const appointmentRouter = router({
  list: protectedProcedure
    .input(z.object({
      tenantId: z.number(),
      page: z.number().default(1),
      pageSize: z.number().default(20),
      status: z.enum(['pending', 'approved', 'rejected', 'cancelled']).optional(),
      startDate: z.string().optional(), // YYYY-MM-DD 格式
      endDate: z.string().optional(),   // YYYY-MM-DD 格式
    }))
    .query(async ({ input }) => {
      let query = supabase
        .from('appointments')
        .select('*, customers(*)', { count: 'exact' })
        .eq('tenant_id', input.tenantId);

      if (input.status) {
        query = query.eq('status', input.status);
      }

      if (input.startDate) {
        query = query.gte('appointment_date', input.startDate);
      }

      if (input.endDate) {
        query = query.lte('appointment_date', input.endDate);
      }

      const { data, error, count } = await query
        .range((input.page - 1) * input.pageSize, input.page * input.pageSize - 1)
        .order('appointment_date', { ascending: false });

      if (error) {
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: `查詢預約清單失敗: ${error.message}`
        });
      }

      return {
        appointments: data || [],
        total: count || 0,
        page: input.page,
        pageSize: input.pageSize,
      };
    }),

  approve: protectedProcedure
    .input(z.object({
      appointmentId: z.number(),
      tenantId: z.number(),
    }))
    .mutation(async ({ input }) => {
      const { data, error } = await supabase
        .from('appointments')
        .update({ status: 'approved' })
        .eq('id', input.appointmentId)
        .eq('tenant_id', input.tenantId)
        .select('*, customers(*)')
        .single();

      if (error) {
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: `審核預約失敗: ${error.message}`
        });
      }

      // 發送 LINE 通知
      try {
        const customer = (data as any).customers;
        if (customer && customer.line_user_id) {
          const notificationMessage = `您的預約已獲批准！\n預約時間: ${data.appointment_date} ${data.appointment_time}`;

          await fetch(`${process.env.VITE_SUPABASE_URL}/functions/v1/send-line-notification`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY}`
            },
            body: JSON.stringify({
              userId: customer.line_user_id,
              message: notificationMessage
            })
          });
        }
      } catch (notificationError) {
        console.error('LINE 通知發送失敗:', notificationError);
      }

      return { success: true, appointment: data };
    }),

  reject: protectedProcedure
    .input(z.object({
      appointmentId: z.number(),
      tenantId: z.number(),
      reason: z.string().optional(),
    }))
    .mutation(async ({ input }) => {
      const { data, error } = await supabase
        .from('appointments')
        .update({ 
          status: 'rejected',
          rejection_reason: input.reason 
        })
        .eq('id', input.appointmentId)
        .eq('tenant_id', input.tenantId)
        .select('*, customers(*)')
        .single();

      if (error) {
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: `拒絕預約失敗: ${error.message}`
        });
      }

      // 發送 LINE 通知
      try {
        const customer = (data as any).customers;
        if (customer && customer.line_user_id) {
          const notificationMessage = `很抱歉，您的預約已被拒絕。\n原因: ${input.reason || '時段已滿'}`;

          await fetch(`${process.env.VITE_SUPABASE_URL}/functions/v1/send-line-notification`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY}`
            },
            body: JSON.stringify({
              userId: customer.line_user_id,
              message: notificationMessage
            })
          });
        }
      } catch (notificationError) {
        console.error('LINE 通知發送失敗:', notificationError);
      }

      return { success: true, appointment: data };
    }),
});
