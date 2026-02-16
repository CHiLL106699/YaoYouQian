import { z } from "zod";
import { router, publicProcedure } from "../_core/trpc";
import { TRPCError } from "@trpc/server";
import { supabase } from "../supabaseClient";

export const approvalRouter = router({
  listPending: publicProcedure
    .input(z.object({ tenantId: z.number() }))
    .query(async ({ input }) => {
      const { data, error } = await supabase
        .from('approvals')
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
      approvalId: z.number(),
      reviewedBy: z.number(),
    }))
    .mutation(async ({ input }) => {
      const { error } = await supabase
        .from('approvals')
        .update({
          status: 'approved',
          approved_by: String(input.reviewedBy),
          updated_at: new Date().toISOString(),
        })
        .eq('id', input.approvalId)
        .eq('tenant_id', input.tenantId);
      if (error) {
        throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: error.message });
      }
      return { success: true };
    }),

  reject: publicProcedure
    .input(z.object({
      tenantId: z.number(),
      approvalId: z.number(),
      reviewedBy: z.number(),
      reason: z.string(),
    }))
    .mutation(async ({ input }) => {
      const { error } = await supabase
        .from('approvals')
        .update({
          status: 'rejected',
          approved_by: String(input.reviewedBy),
          notes: input.reason,
          updated_at: new Date().toISOString(),
        })
        .eq('id', input.approvalId)
        .eq('tenant_id', input.tenantId);
      if (error) {
        throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: error.message });
      }
      return { success: true };
    }),
});
