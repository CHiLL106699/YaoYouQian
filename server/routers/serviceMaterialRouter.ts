import { z } from "zod";
import { router, publicProcedure } from "../_core/trpc";
import { TRPCError } from "@trpc/server";
import { supabase } from "../supabaseClient";

export const serviceMaterialRouter = router({
  /** 查詢某療程的物料清單 */
  listByService: publicProcedure
    .input(
      z.object({
        serviceId: z.number(),
        tenantId: z.number(),
      })
    )
    .query(async ({ input }) => {
      const { data, error } = await supabase
        .from("service_materials")
        .select("*, inventory(item_name, sku, unit, stock_quantity)")
        .eq("service_id", input.serviceId)
        .eq("tenant_id", input.tenantId)
        .order("created_at", { ascending: true });
      if (error) {
        throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: error.message });
      }
      return data || [];
    }),

  /** 查詢所有物料清單（含療程資訊） */
  listAll: publicProcedure
    .input(z.object({ tenantId: z.number() }))
    .query(async ({ input }) => {
      const { data, error } = await supabase
        .from("service_materials")
        .select("*, inventory(item_name, sku, unit, stock_quantity)")
        .eq("tenant_id", input.tenantId)
        .order("service_id", { ascending: true });
      if (error) {
        throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: error.message });
      }
      return data || [];
    }),

  /** 新增物料項目到療程 */
  create: publicProcedure
    .input(
      z.object({
        serviceId: z.number(),
        inventoryId: z.number(),
        tenantId: z.number(),
        quantityPerUse: z.number().min(0.01),
        unit: z.string().min(1),
        notes: z.string().optional(),
      })
    )
    .mutation(async ({ input }) => {
      const { data, error } = await supabase
        .from("service_materials")
        .insert({
          service_id: input.serviceId,
          inventory_id: input.inventoryId,
          tenant_id: input.tenantId,
          quantity_per_use: input.quantityPerUse,
          unit: input.unit,
          notes: input.notes || null,
        })
        .select()
        .single();
      if (error) {
        if (error.code === "23505") {
          throw new TRPCError({
            code: "CONFLICT",
            message: "此療程已包含該耗材項目",
          });
        }
        throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: error.message });
      }
      return data;
    }),

  /** 更新物料用量 */
  update: publicProcedure
    .input(
      z.object({
        id: z.number(),
        tenantId: z.number(),
        quantityPerUse: z.number().min(0.01).optional(),
        unit: z.string().optional(),
        notes: z.string().optional(),
      })
    )
    .mutation(async ({ input }) => {
      const { id, tenantId, ...fields } = input;
      const updateData: Record<string, unknown> = {};
      if (fields.quantityPerUse !== undefined) updateData.quantity_per_use = fields.quantityPerUse;
      if (fields.unit !== undefined) updateData.unit = fields.unit;
      if (fields.notes !== undefined) updateData.notes = fields.notes;

      const { data, error } = await supabase
        .from("service_materials")
        .update(updateData)
        .eq("id", id)
        .eq("tenant_id", tenantId)
        .select()
        .single();
      if (error) {
        throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: error.message });
      }
      return data;
    }),

  /** 刪除物料項目 */
  delete: publicProcedure
    .input(z.object({ id: z.number(), tenantId: z.number() }))
    .mutation(async ({ input }) => {
      const { error } = await supabase
        .from("service_materials")
        .delete()
        .eq("id", input.id)
        .eq("tenant_id", input.tenantId);
      if (error) {
        throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: error.message });
      }
      return { success: true };
    }),
});
