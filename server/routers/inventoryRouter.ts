import { z } from "zod";
import { router, publicProcedure } from "../_core/trpc";
import { TRPCError } from "@trpc/server";
import { supabase } from "../supabaseClient";

export const inventoryRouter = router({
  /** 庫存列表（含低於安全水位篩選） */
  list: publicProcedure
    .input(
      z.object({
        tenantId: z.number(),
        category: z.string().optional(),
        search: z.string().optional(),
        lowStockOnly: z.boolean().optional(),
      })
    )
    .query(async ({ input }) => {
      let query = supabase
        .from("inventory")
        .select("*")
        .eq("tenant_id", input.tenantId)
        .order("item_name", { ascending: true });

      if (input.category) {
        query = query.eq("category", input.category);
      }
      if (input.search) {
        query = query.or(
          `item_name.ilike.%${input.search}%,sku.ilike.%${input.search}%`
        );
      }

      const { data, error } = await query;
      if (error) {
        throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: error.message });
      }

      let items = data || [];
      if (input.lowStockOnly) {
        items = items.filter(
          (item) => item.stock_quantity <= item.safety_threshold
        );
      }

      return items;
    }),

  getById: publicProcedure
    .input(z.object({ id: z.number() }))
    .query(async ({ input }) => {
      const { data, error } = await supabase
        .from("inventory")
        .select("*")
        .eq("id", input.id)
        .single();
      if (error) {
        throw new TRPCError({ code: "NOT_FOUND", message: error.message });
      }
      return data;
    }),

  /** 新增庫存品項 */
  create: publicProcedure
    .input(
      z.object({
        tenantId: z.number(),
        itemName: z.string().min(1),
        sku: z.string().optional(),
        category: z.string().optional(),
        unit: z.string().min(1),
        stockQuantity: z.number().int().min(0).optional(),
        safetyThreshold: z.number().int().min(0).optional(),
        costPrice: z.number().min(0).optional(),
        supplier: z.string().optional(),
      })
    )
    .mutation(async ({ input }) => {
      const { data, error } = await supabase
        .from("inventory")
        .insert({
          tenant_id: input.tenantId,
          item_name: input.itemName,
          sku: input.sku || null,
          category: input.category || null,
          unit: input.unit,
          stock_quantity: input.stockQuantity ?? 0,
          safety_threshold: input.safetyThreshold ?? 0,
          cost_price: input.costPrice ?? null,
          supplier: input.supplier || null,
        })
        .select()
        .single();
      if (error) {
        throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: error.message });
      }
      return data;
    }),

  /** 更新庫存品項 */
  update: publicProcedure
    .input(
      z.object({
        id: z.number(),
        tenantId: z.number(),
        itemName: z.string().min(1).optional(),
        sku: z.string().optional(),
        category: z.string().optional(),
        unit: z.string().optional(),
        safetyThreshold: z.number().int().min(0).optional(),
        costPrice: z.number().min(0).optional(),
        supplier: z.string().optional(),
      })
    )
    .mutation(async ({ input }) => {
      const { id, tenantId, ...fields } = input;
      const updateData: Record<string, unknown> = {};
      if (fields.itemName !== undefined) updateData.item_name = fields.itemName;
      if (fields.sku !== undefined) updateData.sku = fields.sku;
      if (fields.category !== undefined) updateData.category = fields.category;
      if (fields.unit !== undefined) updateData.unit = fields.unit;
      if (fields.safetyThreshold !== undefined) updateData.safety_threshold = fields.safetyThreshold;
      if (fields.costPrice !== undefined) updateData.cost_price = fields.costPrice;
      if (fields.supplier !== undefined) updateData.supplier = fields.supplier;
      updateData.updated_at = new Date().toISOString();

      const { data, error } = await supabase
        .from("inventory")
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

  /** 刪除庫存品項 */
  delete: publicProcedure
    .input(z.object({ id: z.number(), tenantId: z.number() }))
    .mutation(async ({ input }) => {
      const { error } = await supabase
        .from("inventory")
        .delete()
        .eq("id", input.id)
        .eq("tenant_id", input.tenantId);
      if (error) {
        throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: error.message });
      }
      return { success: true };
    }),

  /** 進貨登記 */
  restock: publicProcedure
    .input(
      z.object({
        id: z.number(),
        tenantId: z.number(),
        quantity: z.number().int().min(1),
        operatorId: z.number().optional(),
        notes: z.string().optional(),
      })
    )
    .mutation(async ({ input }) => {
      // 取得目前庫存
      const { data: item, error: getErr } = await supabase
        .from("inventory")
        .select("stock_quantity")
        .eq("id", input.id)
        .eq("tenant_id", input.tenantId)
        .single();
      if (getErr || !item) {
        throw new TRPCError({ code: "NOT_FOUND", message: "庫存品項不存在" });
      }

      const newQty = item.stock_quantity + input.quantity;

      // 更新庫存數量
      const { error: updateErr } = await supabase
        .from("inventory")
        .update({
          stock_quantity: newQty,
          last_restocked_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .eq("id", input.id)
        .eq("tenant_id", input.tenantId);
      if (updateErr) {
        throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: updateErr.message });
      }

      // 寫入異動記錄
      await supabase.from("inventory_transactions").insert({
        inventory_id: input.id,
        tenant_id: input.tenantId,
        transaction_type: "restock",
        quantity: input.quantity,
        operator_id: input.operatorId || null,
        notes: input.notes || null,
      });

      return { success: true, newQuantity: newQty };
    }),

  /** 手動調整庫存 */
  adjust: publicProcedure
    .input(
      z.object({
        id: z.number(),
        tenantId: z.number(),
        quantity: z.number().int(), // 正數增加，負數減少
        operatorId: z.number().optional(),
        notes: z.string().optional(),
      })
    )
    .mutation(async ({ input }) => {
      const { data: item, error: getErr } = await supabase
        .from("inventory")
        .select("stock_quantity, safety_threshold")
        .eq("id", input.id)
        .eq("tenant_id", input.tenantId)
        .single();
      if (getErr || !item) {
        throw new TRPCError({ code: "NOT_FOUND", message: "庫存品項不存在" });
      }

      const newQty = item.stock_quantity + input.quantity;
      if (newQty < 0) {
        throw new TRPCError({ code: "BAD_REQUEST", message: "調整後庫存不可為負數" });
      }

      const { error: updateErr } = await supabase
        .from("inventory")
        .update({
          stock_quantity: newQty,
          updated_at: new Date().toISOString(),
        })
        .eq("id", input.id)
        .eq("tenant_id", input.tenantId);
      if (updateErr) {
        throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: updateErr.message });
      }

      await supabase.from("inventory_transactions").insert({
        inventory_id: input.id,
        tenant_id: input.tenantId,
        transaction_type: "adjust",
        quantity: input.quantity,
        operator_id: input.operatorId || null,
        notes: input.notes || null,
      });

      // 檢查低庫存警示
      if (newQty <= item.safety_threshold) {
        await supabase.from("low_stock_alerts").insert({
          inventory_id: input.id,
          tenant_id: input.tenantId,
          current_stock: newQty,
          threshold: item.safety_threshold,
          alert_type: newQty === 0 ? "critical" : "warning",
        });
      }

      return { success: true, newQuantity: newQty };
    }),
});
