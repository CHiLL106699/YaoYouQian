/**
 * LIFF Shop Router (lineRouter 層 — YaoYouQian 專用)
 * LIFF 環境下的線上商城
 */
import { z } from "zod";
import { publicProcedure, router } from "../_core/trpc";
import { TRPCError } from "@trpc/server";
import { supabase } from "../supabaseClient";

export const liffShopRouter = router({
  getProducts: publicProcedure
    .input(z.object({ tenantId: z.number(), category: z.string().optional(), limit: z.number().min(1).max(50).default(20), offset: z.number().min(0).default(0) }))
    .query(async ({ input }) => {
      let query = supabase.from("products")
        .select("id, name, description, price, stock, category, image_url", { count: "exact" })
        .eq("tenant_id", input.tenantId).eq("is_active", true);
      if (input.category) query = query.eq("category", input.category);
      const { data, error, count } = await query.order("created_at", { ascending: false }).range(input.offset, input.offset + input.limit - 1);
      if (error) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: error.message });
      return {
        products: (data || []).map((p: any) => ({
          id: p.id as number, name: p.name as string,
          description: (p.description ?? null) as string | null,
          price: String(p.price), stock: p.stock as number,
          category: (p.category ?? null) as string | null,
          imageUrl: (p.image_url ?? null) as string | null,
        })),
        total: count || 0,
      };
    }),

  getProduct: publicProcedure
    .input(z.object({ id: z.number(), tenantId: z.number() }))
    .query(async ({ input }) => {
      const { data, error } = await supabase.from("products").select("*")
        .eq("id", input.id).eq("tenant_id", input.tenantId).eq("is_active", true).single();
      if (error) { if (error.code === "PGRST116") return null; throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: error.message }); }
      return data ? {
        id: data.id as number, name: data.name as string,
        description: (data.description ?? null) as string | null,
        price: String(data.price), stock: data.stock as number,
        imageUrl: (data.image_url ?? null) as string | null,
      } : null;
    }),

  createOrder: publicProcedure
    .input(z.object({
      tenantId: z.number(), customerId: z.number().optional(), lineUserId: z.string().optional(),
      items: z.array(z.object({ productId: z.number(), quantity: z.number().min(1) })),
      shippingAddress: z.string().optional(), notes: z.string().optional(),
    }))
    .mutation(async ({ input }) => {
      let customerId = input.customerId;
      if (!customerId && input.lineUserId) {
        const { data: cust } = await supabase.from("customers").select("id")
          .eq("tenant_id", input.tenantId).eq("line_user_id", input.lineUserId).single();
        customerId = cust?.id;
      }
      if (!customerId) throw new TRPCError({ code: "BAD_REQUEST", message: "無法識別客戶" });

      // 計算總金額
      let totalAmount = 0;
      const orderItemsData: Array<{ product_id: number; product_name: string; quantity: number; price: string; subtotal: string }> = [];
      for (const item of input.items) {
        const { data: prod } = await supabase.from("products").select("id, name, price, stock")
          .eq("id", item.productId).eq("tenant_id", input.tenantId).single();
        if (!prod) throw new TRPCError({ code: "NOT_FOUND", message: `商品 ${item.productId} 不存在` });
        if (prod.stock < item.quantity) throw new TRPCError({ code: "BAD_REQUEST", message: `${prod.name} 庫存不足` });
        const price = Number(prod.price);
        const subtotal = price * item.quantity;
        totalAmount += subtotal;
        orderItemsData.push({ product_id: prod.id, product_name: prod.name, quantity: item.quantity, price: String(price), subtotal: String(subtotal) });
      }

      const orderNumber = `YYQ${Date.now()}${Math.random().toString(36).slice(2, 6).toUpperCase()}`;
      const { data: order, error: oe } = await supabase.from("orders").insert({
        tenant_id: input.tenantId, customer_id: customerId, order_number: orderNumber,
        total_amount: String(totalAmount), status: "pending",
        shipping_address: input.shippingAddress || null, notes: input.notes || null,
      }).select("id, order_number").single();
      if (oe) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: oe.message });

      // 建立訂單明細
      if (orderItemsData.length > 0) {
        const items = orderItemsData.map(i => ({ ...i, order_id: order!.id }));
        await supabase.from("order_items").insert(items);
      }

      // 扣庫存 (直接更新)
      for (const item of input.items) {
        const { data: prod } = await supabase.from("products").select("stock").eq("id", item.productId).single();
        if (prod) {
          await supabase.from("products").update({ stock: Math.max(0, (prod.stock as number) - item.quantity) }).eq("id", item.productId);
        }
      }

      return { success: true, orderId: order!.id as number, orderNumber: order!.order_number as string };
    }),

  getMyOrders: publicProcedure
    .input(z.object({ tenantId: z.number(), lineUserId: z.string().optional(), customerId: z.number().optional(), limit: z.number().min(1).max(50).default(20), offset: z.number().min(0).default(0) }))
    .query(async ({ input }) => {
      let custId = input.customerId;
      if (!custId && input.lineUserId) {
        const { data: c } = await supabase.from("customers").select("id")
          .eq("tenant_id", input.tenantId).eq("line_user_id", input.lineUserId).single();
        custId = c?.id;
      }
      if (!custId) return { orders: [] as Array<{ id: number; orderNumber: string; totalAmount: string; status: string; createdAt: string }>, total: 0 };
      const { data, error, count } = await supabase.from("orders")
        .select("id, order_number, total_amount, status, created_at", { count: "exact" })
        .eq("tenant_id", input.tenantId).eq("customer_id", custId)
        .order("created_at", { ascending: false }).range(input.offset, input.offset + input.limit - 1);
      if (error) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: error.message });
      return {
        orders: (data || []).map((o: any) => ({
          id: o.id as number, orderNumber: o.order_number as string,
          totalAmount: String(o.total_amount), status: o.status as string,
          createdAt: String(o.created_at).split("T")[0],
        })),
        total: count || 0,
      };
    }),
});
