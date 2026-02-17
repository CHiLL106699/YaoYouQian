/**
 * LIFF Shop Router (lineRouter 層 — YaoYouQian 專用)
 * LIFF 環境下的線上商城
 */
import { z } from "zod";
import { publicProcedure, router } from "../_core/trpc";

export const liffShopRouter = router({
  getProducts: publicProcedure
    .input(z.object({
      tenantId: z.number(),
      category: z.string().optional(),
      limit: z.number().min(1).max(50).default(20),
      offset: z.number().min(0).default(0),
    }))
    .query(async ({ input }) => {
      // TODO: DB query active products
      return {
        products: [] as Array<{
          id: number;
          name: string;
          description: string | null;
          price: string;
          stock: number;
          category: string | null;
          imageUrl: string | null;
        }>,
        total: 0,
      };
    }),

  getProduct: publicProcedure
    .input(z.object({ id: z.number(), tenantId: z.number() }))
    .query(async ({ input }) => {
      // TODO: DB query single product
      return null as null | {
        id: number;
        name: string;
        description: string | null;
        price: string;
        stock: number;
        imageUrl: string | null;
      };
    }),

  createOrder: publicProcedure
    .input(z.object({
      tenantId: z.number(),
      customerId: z.number().optional(),
      lineUserId: z.string().optional(),
      items: z.array(z.object({
        productId: z.number(),
        quantity: z.number().min(1),
      })),
      shippingAddress: z.string().optional(),
      notes: z.string().optional(),
    }))
    .mutation(async ({ input }) => {
      // TODO: Create order + order items
      return { success: true, orderId: 0, orderNumber: "" };
    }),

  getMyOrders: publicProcedure
    .input(z.object({
      tenantId: z.number(),
      lineUserId: z.string().optional(),
      customerId: z.number().optional(),
      limit: z.number().min(1).max(50).default(20),
      offset: z.number().min(0).default(0),
    }))
    .query(async ({ input }) => {
      // TODO: DB query orders
      return {
        orders: [] as Array<{
          id: number;
          orderNumber: string;
          totalAmount: string;
          status: string;
          createdAt: string;
        }>,
        total: 0,
      };
    }),
});
