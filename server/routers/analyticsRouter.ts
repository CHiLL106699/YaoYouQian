import { z } from "zod";
import { router, publicProcedure } from "../_core/trpc";
import { TRPCError } from "@trpc/server";
import { supabase } from "../supabaseClient";

export const analyticsRouter = router({
  registrationTrend: publicProcedure
    .input(z.object({ tenantId: z.number(), days: z.number().optional() }))
    .query(async ({ input }) => {
      const days = input.days || 30;
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - days);
      const { data, error } = await supabase
        .from('customers').select('created_at')
        .eq('tenant_id', input.tenantId)
        .gte('created_at', startDate.toISOString());
      if (error) throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: error.message });
      const grouped: Record<string, number> = {};
      (data || []).forEach((row: any) => {
        const date = row.created_at?.split('T')[0] || 'unknown';
        grouped[date] = (grouped[date] || 0) + 1;
      });
      return Object.entries(grouped).map(([date, count]) => ({ date, count }));
    }),

  sourceStatistics: publicProcedure
    .input(z.object({ tenantId: z.number() }))
    .query(async () => []),

  revenueStats: publicProcedure
    .input(z.object({
      tenantId: z.number(), startDate: z.string().optional(), endDate: z.string().optional(),
    }))
    .query(async ({ input }) => {
      let query = supabase.from('orders').select('created_at, total_amount').eq('tenant_id', input.tenantId);
      if (input.startDate) query = query.gte('created_at', new Date(input.startDate).toISOString());
      if (input.endDate) query = query.lte('created_at', new Date(input.endDate).toISOString());
      const { data, error } = await query;
      if (error) throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: error.message });
      const grouped: Record<string, { totalRevenue: number; orderCount: number }> = {};
      (data || []).forEach((row: any) => {
        const date = row.created_at?.split('T')[0] || 'unknown';
        if (!grouped[date]) grouped[date] = { totalRevenue: 0, orderCount: 0 };
        grouped[date].totalRevenue += Number(row.total_amount || 0);
        grouped[date].orderCount += 1;
      });
      return Object.entries(grouped).map(([date, stats]) => ({ date, ...stats }));
    }),

  getRevenueReport: publicProcedure
    .input(z.object({
      tenantId: z.number(), period: z.enum(['week', 'month', 'year']), month: z.string().optional(),
    }))
    .query(async ({ input }) => {
      const now = new Date();
      let startDate: Date;
      if (input.period === 'week') { startDate = new Date(now); startDate.setDate(now.getDate() - 7); }
      else if (input.period === 'year') { startDate = new Date(now.getFullYear(), 0, 1); }
      else { startDate = new Date(now.getFullYear(), now.getMonth(), 1); }
      const { data: orders, error } = await supabase
        .from('orders').select('created_at, total_amount, status')
        .eq('tenant_id', input.tenantId)
        .gte('created_at', startDate.toISOString());
      if (error) throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: error.message });
      const completed = (orders || []).filter((o: any) => o.status !== 'cancelled');
      const totalRevenue = completed.reduce((s: number, o: any) => s + Number(o.total_amount || 0), 0);
      const transactionCount = completed.length;
      const avgOrderValue = transactionCount > 0 ? Math.round(totalRevenue / transactionCount) : 0;
      const daily: Record<string, number> = {};
      completed.forEach((o: any) => {
        const d = o.created_at?.split('T')[0] || 'unknown';
        daily[d] = (daily[d] || 0) + Number(o.total_amount || 0);
      });
      return {
        totalRevenue, transactionCount, avgOrderValue, revenueGrowth: 0,
        daily: Object.entries(daily).map(([date, revenue]) => ({ date, revenue })),
        byService: [] as { name: string; revenue: number; percentage: number }[],
      };
    }),

  getAppointmentReport: publicProcedure
    .input(z.object({
      tenantId: z.number(), period: z.enum(['week', 'month', 'year']), month: z.string().optional(),
    }))
    .query(async ({ input }) => {
      const now = new Date();
      let startDate: Date;
      if (input.period === 'week') { startDate = new Date(now); startDate.setDate(now.getDate() - 7); }
      else if (input.period === 'year') { startDate = new Date(now.getFullYear(), 0, 1); }
      else { startDate = new Date(now.getFullYear(), now.getMonth(), 1); }
      const { data, error } = await supabase
        .from('appointments').select('status, date, time_slot, service_id')
        .eq('tenant_id', input.tenantId)
        .gte('date', startDate.toISOString().split('T')[0]);
      if (error) throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: error.message });
      const apts = data || [];
      const total = apts.length;
      const completedCount = apts.filter((a: any) => a.status === 'completed').length;
      const cancelled = apts.filter((a: any) => a.status === 'cancelled').length;
      const completionRate = total > 0 ? Math.round((completedCount / total) * 100) : 0;
      return {
        total, completed: completedCount, cancelled, completionRate,
        popularServices: [] as { name: string; count: number }[],
        peakHours: [] as { hour: number; count: number }[],
      };
    }),

  getCustomerReport: publicProcedure
    .input(z.object({
      tenantId: z.number(), period: z.enum(['week', 'month', 'year']), month: z.string().optional(),
    }))
    .query(async ({ input }) => {
      const { data, error } = await supabase
        .from('customers').select('id, name, created_at, total_spent, visit_count')
        .eq('tenant_id', input.tenantId).order('total_spent', { ascending: false }).limit(100);
      if (error) throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: error.message });
      const customers = data || [];
      const totalCustomers = customers.length;
      const now = new Date();
      const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
      const newCustomers = customers.filter((c: any) => new Date(c.created_at) >= monthStart).length;
      return {
        totalCustomers, newCustomers,
        returningCustomers: totalCustomers - newCustomers,
        retentionRate: totalCustomers > 0 ? Math.round(((totalCustomers - newCustomers) / totalCustomers) * 100) : 0,
        topCustomers: customers.slice(0, 10).map((c: any) => ({
          name: c.name || '-', totalSpent: c.total_spent || 0, visitCount: c.visit_count || 0,
        })),
      };
    }),

  getStaffPerformance: publicProcedure
    .input(z.object({
      tenantId: z.number(), lineUserId: z.string(),
      period: z.enum(['week', 'month']), month: z.string().optional(),
    }))
    .query(async ({ input }) => {
      const { data: staffData } = await supabase
        .from('staff').select('id')
        .eq('tenant_id', input.tenantId).eq('line_user_id', input.lineUserId).single();
      if (!staffData) {
        return {
          revenue: '0', revenueGrowth: 0, customerCount: 0, appointmentCount: 0,
          avgRating: '-', avgPerCustomer: '0', targetAmount: null, targetProgress: 0, recentServices: [],
        };
      }
      const now = new Date();
      let startDate: Date;
      if (input.period === 'week') { startDate = new Date(now); startDate.setDate(now.getDate() - 7); }
      else { startDate = new Date(now.getFullYear(), now.getMonth(), 1); }
      const { data: apts } = await supabase
        .from('appointments').select('id, status, date, customer_id')
        .eq('tenant_id', input.tenantId).eq('staff_id', staffData.id)
        .gte('date', startDate.toISOString().split('T')[0]);
      const completed = (apts || []).filter((a: any) => a.status === 'completed');
      const uniqueCustomers = new Set(completed.map((a: any) => a.customer_id));
      return {
        revenue: '0', revenueGrowth: 0, customerCount: uniqueCustomers.size,
        appointmentCount: (apts || []).length, avgRating: '-', avgPerCustomer: '0',
        targetAmount: null, targetProgress: 0, recentServices: [],
      };
    }),
});
