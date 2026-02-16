import { z } from "zod";
import { router, protectedProcedure } from "../_core/trpc";
import { TRPCError } from "@trpc/server";
import { supabase } from "../supabaseClient";

export const subscriptionRouter = router({
  /**
   * 取得當前訂閱資訊
   */
  getCurrent: protectedProcedure
    .input(z.object({
      tenantId: z.number(),
    }))
    .query(async ({ input }) => {
      const { data: subscription, error } = await supabase
        .from('tenant_subscriptions')
        .select('*')
        .eq('tenant_id', input.tenantId)
        .single();

      if (error) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: '找不到訂閱資料'
        });
      }

      return subscription;
    }),

  /**
   * 取得付款記錄
   */
  getPayments: protectedProcedure
    .input(z.object({
      tenantId: z.number(),
      page: z.number().default(1),
      pageSize: z.number().default(20),
    }))
    .query(async ({ input }) => {
      const { data: payments, error, count } = await supabase
        .from('subscription_payments')
        .select('*', { count: 'exact' })
        .eq('tenant_id', input.tenantId)
        .range((input.page - 1) * input.pageSize, input.page * input.pageSize - 1)
        .order('created_at', { ascending: false });

      if (error) {
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: `查詢付款記錄失敗: ${error.message}`
        });
      }

      return {
        payments: payments || [],
        total: count || 0,
        page: input.page,
        pageSize: input.pageSize,
      };
    }),

  /**
   * 更新訂閱方案
   */
  updatePlan: protectedProcedure
    .input(z.object({
      tenantId: z.number(),
      planName: z.enum(['basic', 'professional', 'enterprise']),
    }))
    .mutation(async ({ input }) => {
      const planPrices = {
        basic: 999,
        professional: 2999,
        enterprise: 9999,
      };

      const { data, error } = await supabase
        .from('tenant_subscriptions')
        .update({
          plan_name: input.planName,
          plan_price: planPrices[input.planName],
        })
        .eq('tenant_id', input.tenantId)
        .select()
        .single();

      if (error) {
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: `更新訂閱方案失敗: ${error.message}`
        });
      }

      return { success: true, subscription: data };
    }),

  /**
   * 取消訂閱
   */
  cancel: protectedProcedure
    .input(z.object({
      tenantId: z.number(),
    }))
    .mutation(async ({ input }) => {
      const { data, error } = await supabase
        .from('tenant_subscriptions')
        .update({
          status: 'cancelled',
        })
        .eq('tenant_id', input.tenantId)
        .select()
        .single();

      if (error) {
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: `取消訂閱失敗: ${error.message}`
        });
      }

      return { success: true, subscription: data };
    }),
});
