import { z } from "zod";
import { router, protectedProcedure } from "../_core/trpc";
import { TRPCError } from "@trpc/server";
import { supabase } from "../supabaseClient";

export const campaignTemplateRouter = router({
  /**
   * 取得所有行銷模板
   */
  list: protectedProcedure
    .input(z.object({
      tenantId: z.number(),
      messageType: z.enum(["text", "flex", "image"]).optional(),
    }))
    .query(async ({ input }) => {
      let query = supabase
        .from("campaign_templates")
        .select("*")
        .eq("tenant_id", input.tenantId)
        .order("created_at", { ascending: false });

      if (input.messageType) {
        query = query.eq("message_type", input.messageType);
      }

      const { data, error } = await query;
      if (error) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: error.message });
      return data || [];
    }),

  /**
   * 取得單一模板
   */
  getById: protectedProcedure
    .input(z.object({
      id: z.number(),
      tenantId: z.number(),
    }))
    .query(async ({ input }) => {
      const { data, error } = await supabase
        .from("campaign_templates")
        .select("*")
        .eq("id", input.id)
        .eq("tenant_id", input.tenantId)
        .single();

      if (error) throw new TRPCError({ code: "NOT_FOUND", message: "模板不存在" });
      return data;
    }),

  /**
   * 建立行銷模板
   */
  create: protectedProcedure
    .input(z.object({
      tenantId: z.number(),
      templateName: z.string().min(1),
      messageType: z.enum(["text", "flex", "image"]),
      content: z.any(),
      category: z.string().optional(),
    }))
    .mutation(async ({ input }) => {
      const { data, error } = await supabase
        .from("campaign_templates")
        .insert({
          tenant_id: input.tenantId,
          template_name: input.templateName,
          message_type: input.messageType,
          content: input.content,
          category: input.category || null,
        })
        .select()
        .single();

      if (error) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: error.message });
      return { success: true, template: data };
    }),

  /**
   * 更新行銷模板
   */
  update: protectedProcedure
    .input(z.object({
      id: z.number(),
      tenantId: z.number(),
      templateName: z.string().min(1).optional(),
      messageType: z.enum(["text", "flex", "image"]).optional(),
      content: z.any().optional(),
      category: z.string().optional(),
    }))
    .mutation(async ({ input }) => {
      const updateData: Record<string, any> = { updated_at: new Date().toISOString() };
      if (input.templateName !== undefined) updateData.template_name = input.templateName;
      if (input.messageType !== undefined) updateData.message_type = input.messageType;
      if (input.content !== undefined) updateData.content = input.content;
      if (input.category !== undefined) updateData.category = input.category;

      const { data, error } = await supabase
        .from("campaign_templates")
        .update(updateData)
        .eq("id", input.id)
        .eq("tenant_id", input.tenantId)
        .select()
        .single();

      if (error) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: error.message });
      return { success: true, template: data };
    }),

  /**
   * 刪除行銷模板
   */
  delete: protectedProcedure
    .input(z.object({
      id: z.number(),
      tenantId: z.number(),
    }))
    .mutation(async ({ input }) => {
      const { error } = await supabase
        .from("campaign_templates")
        .delete()
        .eq("id", input.id)
        .eq("tenant_id", input.tenantId);

      if (error) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: error.message });
      return { success: true };
    }),
});
