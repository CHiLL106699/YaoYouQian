import { z } from "zod";
import { router, publicProcedure } from "../_core/trpc";
import { TRPCError } from "@trpc/server";
import { supabase } from "../supabaseClient";

export const inventoryTransactionRouter = router({
  /** 查詢庫存異動記錄 */
  list: publicProcedure
    .input(
      z.object({
        tenantId: z.number(),
        inventoryId: z.number().optional(),
        transactionType: z
          .enum(["consume", "restock", "adjust", "return"])
          .optional(),
        startDate: z.string().optional(),
        endDate: z.string().optional(),
        limit: z.number().int().min(1).max(500).optional(),
        offset: z.number().int().min(0).optional(),
      })
    )
    .query(async ({ input }) => {
      let query = supabase
        .from("inventory_transactions")
        .select("*, inventory(item_name, sku, unit)")
        .eq("tenant_id", input.tenantId)
        .order("created_at", { ascending: false });

      if (input.inventoryId) {
        query = query.eq("inventory_id", input.inventoryId);
      }
      if (input.transactionType) {
        query = query.eq("transaction_type", input.transactionType);
      }
      if (input.startDate) {
        query = query.gte("created_at", input.startDate);
      }
      if (input.endDate) {
        query = query.lte("created_at", input.endDate);
      }

      const limit = input.limit || 100;
      const offset = input.offset || 0;
      query = query.range(offset, offset + limit - 1);

      const { data, error } = await query;
      if (error) {
        throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: error.message });
      }
      return data || [];
    }),

  /**
   * 療程完成自動扣減：
   * 1. 根據 service_materials 找出所有對應耗材
   * 2. 自動扣減 inventory.stock_quantity
   * 3. 寫入 inventory_transactions
   * 4. 扣減後檢查 stock_quantity < safety_threshold → 自動建立 low_stock_alerts
   */
  consumeByService: publicProcedure
    .input(
      z.object({
        tenantId: z.number(),
        serviceId: z.number(),
        orderId: z.number().optional(),
        operatorId: z.number().optional(),
        notes: z.string().optional(),
      })
    )
    .mutation(async ({ input }) => {
      // 1. 取得此療程的物料清單
      const { data: materials, error: matErr } = await supabase
        .from("service_materials")
        .select("*, inventory(id, item_name, stock_quantity, safety_threshold)")
        .eq("service_id", input.serviceId)
        .eq("tenant_id", input.tenantId);

      if (matErr) {
        throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: matErr.message });
      }
      if (!materials || materials.length === 0) {
        return { deducted: 0, alerts: 0, details: [] };
      }

      const details: Array<{
        inventoryId: number;
        itemName: string;
        deducted: number;
        remaining: number;
        alert: boolean;
      }> = [];
      let alertCount = 0;

      // 2. 逐一扣減
      for (const mat of materials) {
        const inv = mat.inventory as {
          id: number;
          item_name: string;
          stock_quantity: number;
          safety_threshold: number;
        } | null;
        if (!inv) continue;

        const deductQty = Math.ceil(Number(mat.quantity_per_use));
        const newQty = Math.max(0, inv.stock_quantity - deductQty);

        // 更新庫存
        await supabase
          .from("inventory")
          .update({
            stock_quantity: newQty,
            updated_at: new Date().toISOString(),
          })
          .eq("id", inv.id)
          .eq("tenant_id", input.tenantId);

        // 寫入異動記錄
        await supabase.from("inventory_transactions").insert({
          inventory_id: inv.id,
          tenant_id: input.tenantId,
          transaction_type: "consume",
          quantity: -deductQty,
          reference_id: input.orderId || null,
          reference_type: input.orderId ? "order" : null,
          operator_id: input.operatorId || null,
          notes:
            input.notes ||
            `療程完成自動扣減 (service_id: ${input.serviceId})`,
        });

        // 檢查低庫存
        let hasAlert = false;
        if (newQty <= inv.safety_threshold) {
          await supabase.from("low_stock_alerts").insert({
            inventory_id: inv.id,
            tenant_id: input.tenantId,
            current_stock: newQty,
            threshold: inv.safety_threshold,
            alert_type: newQty === 0 ? "critical" : "warning",
          });
          hasAlert = true;
          alertCount++;
        }

        details.push({
          inventoryId: inv.id,
          itemName: inv.item_name,
          deducted: deductQty,
          remaining: newQty,
          alert: hasAlert,
        });
      }

      return {
        deducted: details.length,
        alerts: alertCount,
        details,
      };
    }),

  /** 低庫存警示列表 */
  lowStockAlerts: publicProcedure
    .input(
      z.object({
        tenantId: z.number(),
        unresolvedOnly: z.boolean().optional(),
      })
    )
    .query(async ({ input }) => {
      let query = supabase
        .from("low_stock_alerts")
        .select("*, inventory(item_name, sku, unit, stock_quantity, safety_threshold)")
        .eq("tenant_id", input.tenantId)
        .order("created_at", { ascending: false });

      if (input.unresolvedOnly) {
        query = query.is("resolved_at", null);
      }

      const { data, error } = await query;
      if (error) {
        throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: error.message });
      }
      return data || [];
    }),

  /** 標記警示已處理 */
  resolveAlert: publicProcedure
    .input(z.object({ id: z.number(), tenantId: z.number() }))
    .mutation(async ({ input }) => {
      const { data, error } = await supabase
        .from("low_stock_alerts")
        .update({ resolved_at: new Date().toISOString() })
        .eq("id", input.id)
        .eq("tenant_id", input.tenantId)
        .select()
        .single();
      if (error) {
        throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: error.message });
      }
      return data;
    }),

  /** 批次標記已處理 */
  batchResolveAlerts: publicProcedure
    .input(z.object({ ids: z.array(z.number()), tenantId: z.number() }))
    .mutation(async ({ input }) => {
      const { data, error } = await supabase
        .from("low_stock_alerts")
        .update({ resolved_at: new Date().toISOString() })
        .in("id", input.ids)
        .eq("tenant_id", input.tenantId)
        .select();
      if (error) {
        throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: error.message });
      }
      return { resolved: data?.length || 0 };
    }),
});
