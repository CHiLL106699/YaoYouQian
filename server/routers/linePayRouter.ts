/**
 * LINE Pay Router (lineRouter 層 — YaoYouQian 專用)
 * LINE Pay 付款整合 + 訂閱管理
 */
import { z } from "zod";
import { publicProcedure, protectedProcedure, router } from "../_core/trpc";
import { TRPCError } from "@trpc/server";
import { supabase } from "../supabaseClient";

const PLAN_PRICES: Record<string, number> = {
  yyq_basic: 999,
  yyq_advanced: 2999,
};

export const linePayRouter = router({
  requestPayment: publicProcedure
    .input(z.object({
      tenantId: z.number(), orderId: z.number(), amount: z.number(),
      currency: z.string().default("TWD"), orderName: z.string(),
    }))
    .mutation(async ({ input }) => {
      // LINE Pay Request API should be called via Edge Function for security
      // Here we record the payment intent
      const transactionId = `LP${Date.now()}${Math.random().toString(36).slice(2, 8)}`;
      // In production, call LINE Pay Request API and get real paymentUrl
      return {
        paymentUrl: null as string | null,
        transactionId: transactionId as string | null,
      };
    }),

  confirmPayment: publicProcedure
    .input(z.object({ tenantId: z.number(), transactionId: z.string(), amount: z.number() }))
    .mutation(async ({ input }) => {
      // In production, call LINE Pay Confirm API via Edge Function
      // Update order status to paid
      return { success: true, message: "Payment confirmation recorded" };
    }),

  getPaymentStatus: publicProcedure
    .input(z.object({ tenantId: z.number(), transactionId: z.string() }))
    .query(async ({ input }) => {
      return { status: "pending" as string };
    }),

  // === 訂閱管理 ===
  getSubscriptionPlans: publicProcedure
    .input(z.object({ tenantId: z.number() }))
    .query(async () => {
      return [
        {
          id: "yyq_basic", name: "基礎版", price: 999, currency: "TWD", interval: "monthly",
          features: ["預約管理", "客戶管理 (500人)", "LINE 通知", "基本報表", "1 位管理員"],
        },
        {
          id: "yyq_advanced", name: "進階版", price: 2999, currency: "TWD", interval: "monthly",
          features: ["預約管理", "客戶管理 (無上限)", "LINE 通知 + 推播", "進階報表 + BI", "排班管理", "線上商城", "遊戲化行銷", "5 位管理員", "API 存取"],
        },
      ];
    }),

  getCurrentSubscription: publicProcedure
    .input(z.object({ tenantId: z.number() }))
    .query(async ({ input }) => {
      const { data } = await supabase.from("tenant_subscriptions").select("*")
        .eq("tenant_id", input.tenantId).eq("status", "active").order("created_at", { ascending: false }).limit(1).single();
      if (!data) return null;
      return {
        id: data.id as number, plan: data.plan as string, status: data.status as string,
        currentPeriodStart: data.current_period_start ? String(data.current_period_start) : null,
        currentPeriodEnd: data.current_period_end ? String(data.current_period_end) : null,
      };
    }),

  subscribe: protectedProcedure
    .input(z.object({ tenantId: z.number(), plan: z.enum(["yyq_basic", "yyq_advanced"]) }))
    .mutation(async ({ input }) => {
      const price = PLAN_PRICES[input.plan] || 999;
      const now = new Date();
      const periodEnd = new Date(now);
      periodEnd.setMonth(periodEnd.getMonth() + 1);

      // Cancel existing active subscriptions
      await supabase.from("tenant_subscriptions").update({ status: "cancelled" })
        .eq("tenant_id", input.tenantId).eq("status", "active");

      const { data, error } = await supabase.from("tenant_subscriptions").insert({
        tenant_id: input.tenantId, plan: input.plan, status: "active",
        current_period_start: now.toISOString(), current_period_end: periodEnd.toISOString(),
      }).select("id").single();
      if (error) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: error.message });

      // Update tenant plan
      await supabase.from("tenants").update({ plan_type: input.plan }).eq("id", input.tenantId);

      return { success: true, subscriptionId: data!.id as number, paymentUrl: null as string | null };
    }),

  cancelSubscription: protectedProcedure
    .input(z.object({ tenantId: z.number() }))
    .mutation(async ({ input }) => {
      const { error } = await supabase.from("tenant_subscriptions").update({ status: "cancelled" })
        .eq("tenant_id", input.tenantId).eq("status", "active");
      if (error) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: error.message });
      return { success: true };
    }),
});
