/**
 * LINE Pay Router (lineRouter 層 — YaoYouQian 專用)
 * LINE Pay 付款整合
 */
import { z } from "zod";
import { publicProcedure, router } from "../_core/trpc";

export const linePayRouter = router({
  requestPayment: publicProcedure
    .input(z.object({
      tenantId: z.number(),
      orderId: z.number(),
      amount: z.number(),
      currency: z.string().default("TWD"),
      orderName: z.string(),
    }))
    .mutation(async ({ input }) => {
      // TODO: Call LINE Pay Request API via Edge Function
      return {
        paymentUrl: null as string | null,
        transactionId: null as string | null,
      };
    }),

  confirmPayment: publicProcedure
    .input(z.object({
      tenantId: z.number(),
      transactionId: z.string(),
      amount: z.number(),
    }))
    .mutation(async ({ input }) => {
      // TODO: Call LINE Pay Confirm API via Edge Function
      return { success: false, message: "Not implemented" };
    }),

  getPaymentStatus: publicProcedure
    .input(z.object({
      tenantId: z.number(),
      transactionId: z.string(),
    }))
    .query(async ({ input }) => {
      // TODO: Query payment status
      return { status: "unknown" as string };
    }),
});
