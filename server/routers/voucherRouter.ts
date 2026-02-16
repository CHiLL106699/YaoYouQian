/**
 * voucherRouter.ts
 * 票券系統 tRPC Router
 */

import { z } from 'zod';
import { router, protectedProcedure } from '../_core/trpc';
import { supabase } from '../supabaseClient';
import { TRPCError } from '@trpc/server';

export const voucherRouter = router({
  // 列出所有票券
  list: protectedProcedure
    .input(z.object({
      tenantId: z.number(),
      page: z.number().default(1),
      limit: z.number().default(20),
    }))
    .query(async ({ input }) => {
      const offset = (input.page - 1) * input.limit;
      
      const { data: vouchers, error } = await supabase
        .from('vouchers')
        .select('*')
        .eq('tenant_id', input.tenantId)
        .order('created_at', { ascending: false })
        .range(offset, offset + input.limit - 1);

      if (error) throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: error.message });

      const { count } = await supabase
        .from('vouchers')
        .select('*', { count: 'exact', head: true })
        .eq('tenant_id', input.tenantId);

      return {
        vouchers: vouchers || [],
        total: count || 0,
        page: input.page,
        limit: input.limit,
      };
    }),

  // 建立票券
  create: protectedProcedure
    .input(z.object({
      tenantId: z.number(),
      voucherCode: z.string(),
      voucherType: z.enum(['service', 'product', 'discount']),
      discountValue: z.number().optional(),
      serviceId: z.number().optional(),
      productId: z.number().optional(),
      validFrom: z.string(),
      validUntil: z.string(),
      usageLimit: z.number().optional(),
    }))
    .mutation(async ({ input }) => {
      const { data, error } = await supabase
        .from('vouchers')
        .insert({
          tenant_id: input.tenantId,
          voucher_code: input.voucherCode,
          voucher_type: input.voucherType,
          discount_value: input.discountValue || null,
          service_id: input.serviceId || null,
          product_id: input.productId || null,
          valid_from: input.validFrom,
          valid_until: input.validUntil,
          usage_limit: input.usageLimit || null,
        })
        .select()
        .single();

      if (error) throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: error.message });

      return { success: true, voucher: data };
    }),

  // 核銷票券
  redeem: protectedProcedure
    .input(z.object({
      tenantId: z.number(),
      voucherCode: z.string(),
      customerId: z.number(),
    }))
    .mutation(async ({ input }) => {
      // 查詢票券
      const { data: voucher, error } = await supabase
        .from('vouchers')
        .select('*')
        .eq('tenant_id', input.tenantId)
        .eq('voucher_code', input.voucherCode)
        .eq('is_active', true)
        .single();

      if (error || !voucher) {
        throw new TRPCError({ code: 'NOT_FOUND', message: '票券不存在或已失效' });
      }

      // 檢查有效期限
      const now = new Date();
      if (new Date(voucher.valid_from) > now || new Date(voucher.valid_until) < now) {
        throw new TRPCError({ code: 'BAD_REQUEST', message: '票券已過期或尚未生效' });
      }

      // 檢查使用次數
      if (voucher.usage_limit && voucher.usage_count >= voucher.usage_limit) {
        throw new TRPCError({ code: 'BAD_REQUEST', message: '票券使用次數已達上限' });
      }

      // 更新使用次數
      const { error: updateError } = await supabase
        .from('vouchers')
        .update({ usage_count: voucher.usage_count + 1, updated_at: new Date().toISOString() })
        .eq('id', voucher.id);

      if (updateError) throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: updateError.message });

      return { success: true, voucher };
    }),

  // 票券統計
  stats: protectedProcedure
    .input(z.object({
      tenantId: z.number(),
    }))
    .query(async ({ input }) => {
      const { data: vouchers, error } = await supabase
        .from('vouchers')
        .select('is_active, usage_count')
        .eq('tenant_id', input.tenantId);

      if (error) throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: error.message });

      const totalVouchers = vouchers?.length || 0;
      const activeVouchers = vouchers?.filter(v => v.is_active).length || 0;
      const totalUsage = vouchers?.reduce((sum, v) => sum + (v.usage_count || 0), 0) || 0;

      return {
        total_vouchers: totalVouchers,
        active_vouchers: activeVouchers,
        total_usage: totalUsage,
      };
    }),
});
