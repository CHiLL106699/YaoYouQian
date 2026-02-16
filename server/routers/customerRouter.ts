import { z } from "zod";
import { router, protectedProcedure } from "../_core/trpc";
import { TRPCError } from "@trpc/server";
import { supabase } from "../supabaseClient";

export const customerRouter = router({
  list: protectedProcedure
    .input(z.object({
      tenantId: z.number(),
      page: z.number().default(1),
      pageSize: z.number().default(20),
      search: z.string().optional(),
    }))
    .query(async ({ input }) => {
      let query = supabase
        .from('customers')
        .select('*', { count: 'exact' })
        .eq('tenant_id', input.tenantId);

      if (input.search) {
        query = query.or(`name.ilike.%${input.search}%,phone.ilike.%${input.search}%`);
      }

      const { data, error, count } = await query
        .range((input.page - 1) * input.pageSize, input.page * input.pageSize - 1)
        .order('created_at', { ascending: false });

      if (error) {
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: `查詢客戶清單失敗: ${error.message}`
        });
      }

      return {
        customers: data || [],
        total: count || 0,
        page: input.page,
        pageSize: input.pageSize,
      };
    }),

  getByLineUserId: protectedProcedure
    .input(z.object({
      lineUserId: z.string(),
      tenantId: z.number(),
    }))
    .query(async ({ input }) => {
      const { data, error } = await supabase
        .from('customers')
        .select('*')
        .eq('tenant_id', input.tenantId)
        .eq('line_user_id', input.lineUserId)
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          // 未找到客戶，回傳 null
          return null;
        }
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: `查詢客戶資料失敗: ${error.message}`
        });
      }

      return data;
    }),

  getById: protectedProcedure
    .input(z.object({
      customerId: z.number(),
      tenantId: z.number(),
    }))
    .query(async ({ input }) => {
      const { data, error } = await supabase
        .from('customers')
        .select('*, appointments(*)')
        .eq('id', input.customerId)
        .eq('tenant_id', input.tenantId)
        .single();

      if (error || !data) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: '找不到客戶資料'
        });
      }

      return data;
    }),

  create: protectedProcedure
    .input(z.object({
      tenantId: z.number(),
      name: z.string().min(1, '姓名不能為空'),
      phone: z.string().min(1, '電話不能為空'),
      email: z.string().email('無效的 Email 格式').optional(),
      lineUserId: z.string().optional(),
      memberLevel: z.string().optional(),
    }))
    .mutation(async ({ input }) => {
      const { data, error } = await supabase
        .from('customers')
        .insert([{
          tenant_id: input.tenantId,
          name: input.name,
          phone: input.phone,
          email: input.email,
          line_user_id: input.lineUserId,
          member_level: input.memberLevel || '一般',
        }])
        .select()
        .single();

      if (error) {
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: `新增客戶失敗: ${error.message}`
        });
      }

      return data;
    }),

  update: protectedProcedure
    .input(z.object({
      customerId: z.number(),
      tenantId: z.number(),
      name: z.string().min(1).optional(),
      phone: z.string().min(1).optional(),
      email: z.string().email().optional(),
      memberLevel: z.string().optional(),
    }))
    .mutation(async ({ input }) => {
      const { customerId, tenantId, ...updateData } = input;
      
      const { data, error } = await supabase
        .from('customers')
        .update({
          name: updateData.name,
          phone: updateData.phone,
          email: updateData.email,
          member_level: updateData.memberLevel,
          updated_at: new Date().toISOString(),
        })
        .eq('id', customerId)
        .eq('tenant_id', tenantId)
        .select()
        .single();

      if (error) {
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: `更新客戶失敗: ${error.message}`
        });
      }

      return data;
    }),

  delete: protectedProcedure
    .input(z.object({
      customerId: z.number(),
      tenantId: z.number(),
    }))
    .mutation(async ({ input }) => {
      const { error } = await supabase
        .from('customers')
        .delete()
        .eq('id', input.customerId)
        .eq('tenant_id', input.tenantId);

      if (error) {
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: `刪除客戶失敗: ${error.message}`
        });
      }

      return { success: true };
    }),
});
