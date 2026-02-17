import { z } from "zod";
import { router, protectedProcedure } from "../_core/trpc";
import { TRPCError } from "@trpc/server";
import { supabase } from "../supabaseClient";

export const smartTagRouter = router({
  /**
   * 取得所有智能標籤
   */
  list: protectedProcedure
    .input(z.object({
      tenantId: z.number(),
    }))
    .query(async ({ input }) => {
      const { data: tags, error } = await supabase
        .from("smart_tags")
        .select("*")
        .eq("tenant_id", input.tenantId)
        .order("created_at", { ascending: false });

      if (error) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: error.message });

      // 取得每個標籤的客戶數量
      const tagIds = (tags || []).map((t: any) => t.id);
      const { data: tagCounts } = await supabase
        .from("customer_smart_tags")
        .select("tag_id")
        .eq("tenant_id", input.tenantId)
        .in("tag_id", tagIds.length > 0 ? tagIds : [0]);

      const countMap: Record<number, number> = {};
      (tagCounts || []).forEach((tc: any) => {
        countMap[tc.tag_id] = (countMap[tc.tag_id] || 0) + 1;
      });

      return (tags || []).map((tag: any) => ({
        ...tag,
        customerCount: countMap[tag.id] || 0,
      }));
    }),

  /**
   * 建立智能標籤
   */
  create: protectedProcedure
    .input(z.object({
      tenantId: z.number(),
      tagName: z.string().min(1),
      tagCategory: z.enum(["behavior", "interest", "status", "custom"]),
      autoRule: z.any().optional(),
      color: z.string().default("#6366f1"),
      description: z.string().optional(),
    }))
    .mutation(async ({ input }) => {
      const { data, error } = await supabase
        .from("smart_tags")
        .insert({
          tenant_id: input.tenantId,
          tag_name: input.tagName,
          tag_category: input.tagCategory,
          auto_rule: input.autoRule || null,
          color: input.color,
          description: input.description || null,
        })
        .select()
        .single();

      if (error) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: error.message });
      return { success: true, tag: data };
    }),

  /**
   * 更新智能標籤
   */
  update: protectedProcedure
    .input(z.object({
      id: z.number(),
      tenantId: z.number(),
      tagName: z.string().min(1).optional(),
      tagCategory: z.enum(["behavior", "interest", "status", "custom"]).optional(),
      autoRule: z.any().optional(),
      color: z.string().optional(),
      description: z.string().optional(),
    }))
    .mutation(async ({ input }) => {
      const updateData: Record<string, unknown> = { updated_at: new Date().toISOString() };
      if (input.tagName !== undefined) updateData.tag_name = input.tagName;
      if (input.tagCategory !== undefined) updateData.tag_category = input.tagCategory;
      if (input.autoRule !== undefined) updateData.auto_rule = input.autoRule;
      if (input.color !== undefined) updateData.color = input.color;
      if (input.description !== undefined) updateData.description = input.description;

      const { data, error } = await supabase
        .from("smart_tags")
        .update(updateData)
        .eq("id", input.id)
        .eq("tenant_id", input.tenantId)
        .select()
        .single();

      if (error) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: error.message });
      return { success: true, tag: data };
    }),

  /**
   * 刪除智能標籤
   */
  delete: protectedProcedure
    .input(z.object({
      id: z.number(),
      tenantId: z.number(),
    }))
    .mutation(async ({ input }) => {
      // 先刪除關聯
      await supabase
        .from("customer_smart_tags")
        .delete()
        .eq("tag_id", input.id)
        .eq("tenant_id", input.tenantId);

      const { error } = await supabase
        .from("smart_tags")
        .delete()
        .eq("id", input.id)
        .eq("tenant_id", input.tenantId);

      if (error) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: error.message });
      return { success: true };
    }),

  /**
   * 取得標籤下的客戶列表
   */
  getTagCustomers: protectedProcedure
    .input(z.object({
      tagId: z.number(),
      tenantId: z.number(),
      page: z.number().default(1),
      limit: z.number().default(20),
    }))
    .query(async ({ input }) => {
      const offset = (input.page - 1) * input.limit;

      const { data: tagLinks, error } = await supabase
        .from("customer_smart_tags")
        .select("customer_id, applied_at, applied_by")
        .eq("tag_id", input.tagId)
        .eq("tenant_id", input.tenantId)
        .range(offset, offset + input.limit - 1);

      if (error) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: error.message });

      const customerIds = (tagLinks || []).map((l: any) => l.customer_id);
      if (customerIds.length === 0) return { customers: [], total: 0 };

      const { data: customers } = await supabase
        .from("customers")
        .select("id, name, phone, line_user_id")
        .in("id", customerIds);

      const { count } = await supabase
        .from("customer_smart_tags")
        .select("*", { count: "exact", head: true })
        .eq("tag_id", input.tagId)
        .eq("tenant_id", input.tenantId);

      const customerMap = new Map((customers || []).map((c: any) => [c.id, c]));

      return {
        customers: (tagLinks || []).map((link: any) => ({
          ...customerMap.get(link.customer_id),
          appliedAt: link.applied_at,
          appliedBy: link.applied_by,
        })),
        total: count || 0,
      };
    }),

  /**
   * 手動為客戶添加標籤
   */
  assignTag: protectedProcedure
    .input(z.object({
      tenantId: z.number(),
      tagId: z.number(),
      customerIds: z.array(z.number()),
    }))
    .mutation(async ({ input }) => {
      const rows = input.customerIds.map(cid => ({
        customer_id: cid,
        tag_id: input.tagId,
        tenant_id: input.tenantId,
        applied_by: "manual",
      }));

      const { error } = await supabase
        .from("customer_smart_tags")
        .upsert(rows, { onConflict: "customer_id,tag_id" });

      if (error) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: error.message });
      return { success: true, assignedCount: input.customerIds.length };
    }),

  /**
   * 移除客戶標籤
   */
  removeTag: protectedProcedure
    .input(z.object({
      tenantId: z.number(),
      tagId: z.number(),
      customerIds: z.array(z.number()),
    }))
    .mutation(async ({ input }) => {
      const { error } = await supabase
        .from("customer_smart_tags")
        .delete()
        .eq("tag_id", input.tagId)
        .eq("tenant_id", input.tenantId)
        .in("customer_id", input.customerIds);

      if (error) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: error.message });
      return { success: true };
    }),

  /**
   * 根據受眾標籤預覽目標客戶數
   */
  previewAudience: protectedProcedure
    .input(z.object({
      tenantId: z.number(),
      tagIds: z.array(z.number()),
    }))
    .query(async ({ input }) => {
      if (input.tagIds.length === 0) return { count: 0, customers: [] };

      const { data, error } = await supabase
        .from("customer_smart_tags")
        .select("customer_id")
        .eq("tenant_id", input.tenantId)
        .in("tag_id", input.tagIds);

      if (error) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: error.message });

      const uniqueIds = Array.from(new Set((data || []).map((d: any) => d.customer_id)));

      const { data: customers } = await supabase
        .from("customers")
        .select("id, name, phone, line_user_id")
        .in("id", uniqueIds.length > 0 ? uniqueIds : [0]);

      const lineReachable = (customers || []).filter((c: any) => c.line_user_id).length;

      return {
        count: uniqueIds.length,
        lineReachable,
        customers: (customers || []).slice(0, 50),
      };
    }),
});
