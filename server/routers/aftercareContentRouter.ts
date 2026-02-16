/**
 * 衛教內容管理 Router - 多租戶 SaaS 版本
 * 管理 aftercare_contents 表（租戶級衛教圖卡內容）
 * 後台管理員可 CRUD 衛教內容，LINE Bot 會自動使用這些內容回覆圖卡
 */
import { router, protectedProcedure } from "../_core/trpc";
import { z } from "zod";
import { supabase } from "../supabaseClient";

export const aftercareContentRouter = router({
  /** 列出租戶的所有衛教內容 */
  list: protectedProcedure
    .input(z.object({ tenantId: z.number() }))
    .query(async ({ input }) => {
      const { data, error } = await supabase
        .from("aftercare_contents")
        .select("*")
        .eq("tenant_id", input.tenantId)
        .order("sort_order", { ascending: true });
      if (error) throw new Error(error.message);
      return data || [];
    }),

  /** 取得單一衛教內容 */
  getById: protectedProcedure
    .input(z.object({ id: z.number(), tenantId: z.number() }))
    .query(async ({ input }) => {
      const { data, error } = await supabase
        .from("aftercare_contents")
        .select("*")
        .eq("id", input.id)
        .eq("tenant_id", input.tenantId)
        .single();
      if (error) throw new Error(error.message);
      return data;
    }),

  /** 新增衛教內容 */
  create: protectedProcedure
    .input(z.object({
      tenantId: z.number(),
      category: z.string().default("general"),
      treatmentName: z.string(),
      description: z.string().optional(),
      instructions: z.array(z.string()),
      imageUrl: z.string().optional(),
      sortOrder: z.number().default(0),
    }))
    .mutation(async ({ input }) => {
      const { data, error } = await supabase
        .from("aftercare_contents")
        .insert({
          tenant_id: input.tenantId,
          category: input.category,
          treatment_name: input.treatmentName,
          description: input.description || "",
          instructions: input.instructions,
          image_url: input.imageUrl || null,
          sort_order: input.sortOrder,
          is_active: true,
        })
        .select()
        .single();
      if (error) throw new Error(error.message);
      return data;
    }),

  /** 更新衛教內容 */
  update: protectedProcedure
    .input(z.object({
      id: z.number(),
      tenantId: z.number(),
      category: z.string().optional(),
      treatmentName: z.string().optional(),
      description: z.string().optional(),
      instructions: z.array(z.string()).optional(),
      imageUrl: z.string().nullable().optional(),
      sortOrder: z.number().optional(),
      isActive: z.boolean().optional(),
    }))
    .mutation(async ({ input }) => {
      const updateData: any = { updated_at: new Date().toISOString() };
      if (input.category !== undefined) updateData.category = input.category;
      if (input.treatmentName !== undefined) updateData.treatment_name = input.treatmentName;
      if (input.description !== undefined) updateData.description = input.description;
      if (input.instructions !== undefined) updateData.instructions = input.instructions;
      if (input.imageUrl !== undefined) updateData.image_url = input.imageUrl;
      if (input.sortOrder !== undefined) updateData.sort_order = input.sortOrder;
      if (input.isActive !== undefined) updateData.is_active = input.isActive;

      const { data, error } = await supabase
        .from("aftercare_contents")
        .update(updateData)
        .eq("id", input.id)
        .eq("tenant_id", input.tenantId)
        .select()
        .single();
      if (error) throw new Error(error.message);
      return data;
    }),

  /** 刪除衛教內容 */
  delete: protectedProcedure
    .input(z.object({ id: z.number(), tenantId: z.number() }))
    .mutation(async ({ input }) => {
      const { error } = await supabase
        .from("aftercare_contents")
        .delete()
        .eq("id", input.id)
        .eq("tenant_id", input.tenantId);
      if (error) throw new Error(error.message);
      return { success: true };
    }),

  /** 批次更新排序 */
  updateOrder: protectedProcedure
    .input(z.object({
      tenantId: z.number(),
      items: z.array(z.object({ id: z.number(), sortOrder: z.number() })),
    }))
    .mutation(async ({ input }) => {
      for (const item of input.items) {
        await supabase
          .from("aftercare_contents")
          .update({ sort_order: item.sortOrder })
          .eq("id", item.id)
          .eq("tenant_id", input.tenantId);
      }
      return { success: true };
    }),
});
