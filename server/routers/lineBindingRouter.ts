import { z } from "zod";
import { router, publicProcedure } from "../_core/trpc";
import { TRPCError } from "@trpc/server";
import { supabase } from "../supabaseClient";

/**
 * LINE User ID 自動繫定邏輯 Router
 */
export const lineBindingRouter = router({
  checkBinding: publicProcedure
    .input(z.object({
      tenantId: z.number(),
      lineUserId: z.string().min(1),
    }))
    .query(async ({ input }) => {
      const { data, error } = await supabase
        .from('customers')
        .select('id, name, phone, email')
        .eq('tenant_id', input.tenantId)
        .eq('line_user_id', input.lineUserId)
        .limit(1)
        .maybeSingle();
      if (error) {
        throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: error.message });
      }
      if (!data) {
        return { isBound: false, customer: null };
      }
      return { isBound: true, customer: data };
    }),

  createBinding: publicProcedure
    .input(z.object({
      tenantId: z.number(),
      lineUserId: z.string().min(1),
      name: z.string().min(1),
      phone: z.string().min(1),
      email: z.string().email().optional(),
    }))
    .mutation(async ({ input }) => {
      // 1. 檢查該 LINE User ID 是否已繫定
      const { data: existing } = await supabase
        .from('customers')
        .select('id')
        .eq('tenant_id', input.tenantId)
        .eq('line_user_id', input.lineUserId)
        .maybeSingle();
      if (existing) {
        return { success: true, customerId: existing.id, message: '該 LINE 帳號已繫定客戶資料' };
      }

      // 2. 檢查電話是否已存在
      const { data: existingPhone } = await supabase
        .from('customers')
        .select('id')
        .eq('tenant_id', input.tenantId)
        .eq('phone', input.phone)
        .maybeSingle();
      if (existingPhone) {
        await supabase
          .from('customers')
          .update({ line_user_id: input.lineUserId })
          .eq('id', existingPhone.id);
        return { success: true, customerId: existingPhone.id, message: 'LINE 帳號已成功繫定到現有客戶資料' };
      }

      // 3. 建立新客戶
      const { data: newCustomer, error } = await supabase
        .from('customers')
        .insert({
          tenant_id: input.tenantId,
          name: input.name,
          phone: input.phone,
          email: input.email || null,
          line_user_id: input.lineUserId,
          total_spent: 0,
          visit_count: 0,
        })
        .select('id')
        .single();
      if (error) {
        throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: error.message });
      }
      return { success: true, customerId: newCustomer?.id, message: '新客戶資料建立成功並已繫定 LINE 帳號' };
    }),

  updateBinding: publicProcedure
    .input(z.object({
      tenantId: z.number(),
      customerId: z.number(),
      lineUserId: z.string().min(1),
    }))
    .mutation(async ({ input }) => {
      const { error } = await supabase
        .from('customers')
        .update({ line_user_id: input.lineUserId })
        .eq('id', input.customerId)
        .eq('tenant_id', input.tenantId);
      if (error) {
        throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: error.message });
      }
      return { success: true, message: 'LINE 帳號繫定更新成功' };
    }),

  unbind: publicProcedure
    .input(z.object({
      tenantId: z.number(),
      customerId: z.number(),
    }))
    .mutation(async ({ input }) => {
      const { error } = await supabase
        .from('customers')
        .update({ line_user_id: null })
        .eq('id', input.customerId)
        .eq('tenant_id', input.tenantId);
      if (error) {
        throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: error.message });
      }
      return { success: true, message: 'LINE 帳號繫定已解除' };
    }),
});
