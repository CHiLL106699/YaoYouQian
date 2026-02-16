import { router, protectedProcedure } from "../_core/trpc";
import { z } from "zod";
import { supabase } from "../supabaseClient";

export const revenueRouter = router({
  getByDateRange: protectedProcedure
    .input(z.object({
      startDate: z.string(),
      endDate: z.string(),
      tenantId: z.number(),
    }))
    .query(async ({ input }) => {
      const { data, error } = await supabase
        .from('appointments')
        .select('*')
        .eq('tenant_id', input.tenantId)
        .gte('appointment_date', input.startDate)
        .lte('appointment_date', input.endDate)
        .eq('status', 'completed');
      
      if (error) throw new Error(error.message);
      return data || [];
    }),

  getMonthlyStats: protectedProcedure
    .input(z.object({
      year: z.number(),
      month: z.number(),
      tenantId: z.number(),
    }))
    .query(async ({ input }) => {
      const startDate = new Date(input.year, input.month - 1, 1).toISOString();
      const endDate = new Date(input.year, input.month, 0, 23, 59, 59).toISOString();
      
      const { data, error } = await supabase
        .from('appointments')
        .select('appointment_date, total_fee')
        .eq('tenant_id', input.tenantId)
        .gte('appointment_date', startDate)
        .lte('appointment_date', endDate)
        .eq('status', 'completed');
      
      if (error) throw new Error(error.message);
      
      const totalRevenue = data?.reduce((sum, apt) => sum + parseFloat(apt.total_fee || '0'), 0) || 0;
      const count = data?.length || 0;
      
      return { totalRevenue, count, averageRevenue: count > 0 ? totalRevenue / count : 0 };
    }),
});
