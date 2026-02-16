import { z } from "zod";
import { router, protectedProcedure } from "../_core/trpc";
import { TRPCError } from "@trpc/server";
import { supabase } from "../supabaseClient";

export const rescheduleRouter = router({
  list: protectedProcedure
    .input(z.object({
      tenantId: z.number(),
      page: z.number().default(1),
      pageSize: z.number().default(20),
      status: z.enum(['pending', 'approved', 'rejected']).optional(),
    }))
    .query(async ({ input }) => {
      let query = supabase
        .from('reschedule_requests')
        .select('*, appointments(*), customers(*)', { count: 'exact' })
        .eq('tenant_id', input.tenantId);

      if (input.status) {
        query = query.eq('status', input.status);
      }

      const { data, error, count } = await query
        .range((input.page - 1) * input.pageSize, input.page * input.pageSize - 1)
        .order('created_at', { ascending: false });

      if (error) {
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: `查詢改期申請清單失敗: ${error.message}`
        });
      }

      return {
        requests: data || [],
        total: count || 0,
        page: input.page,
        pageSize: input.pageSize,
      };
    }),

  approve: protectedProcedure
    .input(z.object({
      requestId: z.number(),
      tenantId: z.number(),
    }))
    .mutation(async ({ input }) => {
      const { data: request, error: fetchError } = await supabase
        .from('reschedule_requests')
        .select('*')
        .eq('id', input.requestId)
        .eq('tenant_id', input.tenantId)
        .single();

      if (fetchError || !request) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: '找不到改期申請'
        });
      }

      await supabase
        .from('appointments')
        .update({
          appointment_date: request.new_date,
          appointment_time: request.new_time,
        })
        .eq('id', request.appointment_id);

      const { data, error } = await supabase
        .from('reschedule_requests')
        .update({ status: 'approved' })
        .eq('id', input.requestId)
        .select()
        .single();

      if (error) {
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: `審核改期申請失敗: ${error.message}`
        });
      }

      return { success: true, request: data };
    }),
});
