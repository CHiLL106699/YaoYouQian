import { z } from "zod";
import { router, protectedProcedure } from "../_core/trpc";
import { TRPCError } from "@trpc/server";
import { supabase } from "../supabaseClient";

export const whiteLabelRouter = router({
  getSettings: protectedProcedure
    .input(z.object({
      tenantId: z.number(),
    }))
    .query(async ({ input }) => {
      const { data, error } = await supabase
        .from('tenant_settings')
        .select('*')
        .eq('tenant_id', input.tenantId)
        .single();

      if (error) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: '找不到白標化設定'
        });
      }

      return data;
    }),

  updateSettings: protectedProcedure
    .input(z.object({
      tenantId: z.number(),
      primaryColor: z.string().optional(),
      logoUrl: z.string().optional(),
      customDomain: z.string().optional(),
    }))
    .mutation(async ({ input }) => {
      const { tenantId, ...updateData } = input;

      const { data, error } = await supabase
        .from('tenant_settings')
        .update({
          primary_color: updateData.primaryColor,
          logo_url: updateData.logoUrl,
          custom_domain: updateData.customDomain,
        })
        .eq('tenant_id', tenantId)
        .select()
        .single();

      if (error) {
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: `更新白標化設定失敗: ${error.message}`
        });
      }

      return { success: true, settings: data };
    }),
});
