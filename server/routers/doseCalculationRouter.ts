import { z } from "zod";
import { router, publicProcedure } from "../_core/trpc";
import { TRPCError } from "@trpc/server";
import { supabase } from "../supabaseClient";

export const doseCalculationRouter = router({
  calculate: publicProcedure
    .input(z.object({
      tenantId: z.number(),
      customerId: z.number(),
      weight: z.number(),
      productType: z.string(),
      dosagePerKg: z.number().optional(),
    }))
    .mutation(async ({ input }) => {
      const dosagePerKg = input.dosagePerKg || 0.1;
      const calculatedDosage = input.weight * dosagePerKg;
      return {
        success: true,
        dosage: calculatedDosage,
        unit: "ml",
        weight: input.weight,
        productType: input.productType,
      };
    }),

  save: publicProcedure
    .input(z.object({
      tenantId: z.number(),
      customerId: z.number(),
      weight: z.number(),
      productType: z.string(),
      dosage: z.number(),
      notes: z.string().optional(),
    }))
    .mutation(async ({ input }) => {
      const { error } = await supabase
        .from('dose_calculations')
        .insert({
          tenant_id: input.tenantId,
          customer_id: input.customerId,
          product_name: input.productType,
          dose_amount: input.dosage,
          unit: 'ml',
          notes: input.notes || null,
        });
      if (error) {
        throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: `儲存劑量計算失敗: ${error.message}` });
      }
      return { success: true };
    }),

  getHistory: publicProcedure
    .input(z.object({
      tenantId: z.number(),
      customerId: z.number(),
    }))
    .query(async ({ input }) => {
      const { data, error } = await supabase
        .from('dose_calculations')
        .select('*')
        .eq('tenant_id', input.tenantId)
        .eq('customer_id', input.customerId)
        .order('created_at', { ascending: false });
      if (error) {
        throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: `取得劑量計算歷史失敗: ${error.message}` });
      }
      return data || [];
    }),
});
