import { z } from "zod";
import { router, publicProcedure } from "../_core/trpc";
import { TRPCError } from "@trpc/server";
import { supabase } from "../supabaseClient";

export const rescheduleApprovalRouter = router({
  listPending: publicProcedure
    .input(z.object({ tenantId: z.number() }))
    .query(async ({ input }) => {
      const { data, error } = await supabase
        .from('reschedule_approvals')
        .select('*')
        .eq('tenant_id', input.tenantId)
        .eq('status', 'pending')
        .order('created_at', { ascending: false });
      if (error) {
        throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: error.message });
      }
      return data || [];
    }),

  approve: publicProcedure
    .input(z.object({
      tenantId: z.number(),
      rescheduleId: z.number(),
      reviewedBy: z.number(),
    }))
    .mutation(async ({ input }) => {
      // 取得改期申請記錄
      const { data: reschedule, error: fetchErr } = await supabase
        .from('reschedule_approvals')
        .select('*')
        .eq('id', input.rescheduleId)
        .single();
      if (fetchErr || !reschedule) {
        throw new TRPCError({ code: 'NOT_FOUND', message: 'Reschedule request not found' });
      }

      // 更新審核狀態
      const { error: updateErr } = await supabase
        .from('reschedule_approvals')
        .update({
          status: 'approved',
          approved_by: String(input.reviewedBy),
          updated_at: new Date().toISOString(),
        })
        .eq('id', input.rescheduleId);
      if (updateErr) {
        throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: updateErr.message });
      }

      // 更新預約時間
      if (reschedule.appointment_id && reschedule.requested_date) {
        await supabase
          .from('appointments')
          .update({
            appointment_date: reschedule.requested_date,
            appointment_time: reschedule.requested_time,
          })
          .eq('id', reschedule.appointment_id);
      }

      return { success: true };
    }),

  reject: publicProcedure
    .input(z.object({
      tenantId: z.number(),
      rescheduleId: z.number(),
      reviewedBy: z.number(),
      reason: z.string(),
    }))
    .mutation(async ({ input }) => {
      const { error } = await supabase
        .from('reschedule_approvals')
        .update({
          status: 'rejected',
          approved_by: String(input.reviewedBy),
          notes: input.reason,
          updated_at: new Date().toISOString(),
        })
        .eq('id', input.rescheduleId)
        .eq('tenant_id', input.tenantId);
      if (error) {
        throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: error.message });
      }
      return { success: true };
    }),
});
