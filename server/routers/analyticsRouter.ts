import { z } from "zod";
import { router, publicProcedure } from "../_core/trpc";
import { TRPCError } from "@trpc/server";
import { supabase } from "../supabaseClient";

export const analyticsRouter = router({
  /**
   * 取得客戶註冊趨勢
   */
  registrationTrend: publicProcedure
    .input(z.object({
      tenantId: z.number(),
      days: z.number().optional(),
    }))
    .query(async ({ input }) => {
      const days = input.days || 30;
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - days);

      const { data, error } = await supabase
        .from('customers')
        .select('created_at')
        .eq('tenant_id', input.tenantId)
        .gte('created_at', startDate.toISOString());
      if (error) {
        throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: error.message });
      }
      const grouped: Record<string, number> = {};
      (data || []).forEach((row: any) => {
        const date = row.created_at?.split('T')[0] || 'unknown';
        grouped[date] = (grouped[date] || 0) + 1;
      });
      return Object.entries(grouped).map(([date, count]) => ({ date, count }));
    }),

  /**
   * 取得客戶來源統計
   */
  sourceStatistics: publicProcedure
    .input(z.object({ tenantId: z.number() }))
    .query(async () => {
      // TODO: customers 表沒有 source 欄位
      return [];
    }),

  /**
   * 取得營收統計
   */
  revenueStats: publicProcedure
    .input(z.object({
      tenantId: z.number(),
      startDate: z.string().optional(),
      endDate: z.string().optional(),
    }))
    .query(async ({ input }) => {
      let query = supabase
        .from('orders')
        .select('created_at, total_amount')
        .eq('tenant_id', input.tenantId);
      if (input.startDate) {
        query = query.gte('created_at', new Date(input.startDate).toISOString());
      }
      if (input.endDate) {
        query = query.lte('created_at', new Date(input.endDate).toISOString());
      }
      const { data, error } = await query;
      if (error) {
        throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: error.message });
      }
      const grouped: Record<string, { totalRevenue: number; orderCount: number }> = {};
      (data || []).forEach((row: any) => {
        const date = row.created_at?.split('T')[0] || 'unknown';
        if (!grouped[date]) grouped[date] = { totalRevenue: 0, orderCount: 0 };
        grouped[date].totalRevenue += Number(row.total_amount || 0);
        grouped[date].orderCount += 1;
      });
      return Object.entries(grouped).map(([date, stats]) => ({ date, ...stats }));
    }),
});
