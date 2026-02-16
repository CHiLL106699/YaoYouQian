import { z } from "zod";
import { router, protectedProcedure } from "../_core/trpc";
import { TRPCError } from "@trpc/server";
import { supabase } from "../supabaseClient";

export const superAdminRouter = router({
  getAllTenants: protectedProcedure
    .input(z.object({
      page: z.number().default(1),
      pageSize: z.number().default(20),
      search: z.string().optional(),
    }))
    .query(async ({ input }) => {
      let query = supabase
        .from('tenants')
        .select('*, tenant_subscriptions(*)', { count: 'exact' });

      if (input.search) {
        query = query.or(`name.ilike.%${input.search}%,subdomain.ilike.%${input.search}%`);
      }

      const { data, error, count } = await query
        .range((input.page - 1) * input.pageSize, input.page * input.pageSize - 1)
        .order('created_at', { ascending: false });

      if (error) {
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: `查詢租戶清單失敗: ${error.message}`
        });
      }

      return {
        tenants: data || [],
        total: count || 0,
        page: input.page,
        pageSize: input.pageSize,
      };
    }),

  getStats: protectedProcedure
    .query(async () => {
      const { count: totalTenants } = await supabase
        .from('tenants')
        .select('*', { count: 'exact', head: true });

      const { count: activeTenants } = await supabase
        .from('tenant_subscriptions')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'active');

      const { data: revenueData } = await supabase
        .from('subscription_payments')
        .select('amount')
        .eq('status', 'success');

      const totalRevenue = revenueData?.reduce((sum, p) => sum + p.amount, 0) || 0;

      return {
        totalTenants: totalTenants || 0,
        activeTenants: activeTenants || 0,
        totalRevenue,
      };
    }),
});
