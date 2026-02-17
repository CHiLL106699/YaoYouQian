
import { z } from "zod";
import { router, publicProcedure, protectedProcedure } from "../_core/trpc";
import { supabase } from "../supabaseClient";
import { TRPCError } from "@trpc/server";

export const orderRouter = router({
  list: protectedProcedure
    .input(z.object({ tenantId: z.number() }))
    .query(async ({ input }) => {
    const { data, error } = await supabase.from('orders').select('*, customers(name, line_user_id)').eq('tenant_id', input.tenantId).order('created_at', { ascending: false });
    if (error) {
      throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: error.message });
    }
    return data;
  }),

  getById: protectedProcedure
    .input(z.object({ id: z.number() }))
    .query(async ({ input }) => {
      const { data, error } = await supabase.from('orders').select('*, order_items(*), customers(*)').eq('id', input.id).single();
      if (error) {
        throw new TRPCError({ code: 'NOT_FOUND', message: error.message });
      }
      return data;
    }),

  getByCustomerId: protectedProcedure
    .input(z.object({ customerId: z.number() }))
    .query(async ({ input }) => {
      const { data, error } = await supabase.from('orders').select('*').eq('customer_id', input.customerId).order('created_at', { ascending: false });
      if (error) {
        throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: error.message });
      }
      return data;
    }),

  getByDateRange: protectedProcedure
    .input(z.object({
      startDate: z.string(),
      endDate: z.string(),
    }))
    .query(async ({ input }) => {
      const { data, error } = await supabase.from('orders').select('*, customers(name)')
        .gte('created_at', new Date(input.startDate).toISOString())
        .lte('created_at', new Date(input.endDate).toISOString())
        .order('created_at', { ascending: false });

      if (error) {
        throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: error.message });
      }
      return data;
    }),

  getLatestByCustomer: protectedProcedure
    .input(z.object({ customerId: z.number() }))
    .query(async ({ input }) => {
      const { data, error } = await supabase.from('orders').select('*').eq('customer_id', input.customerId).order('created_at', { ascending: false }).limit(1).single();
      if (error) {
        // It's okay if no order is found, return null
        if (error.code === 'PGRST116') return null;
        throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: error.message });
      }
      return data;
    }),

  create: publicProcedure
    .input(z.object({
      customerId: z.number(),
      type: z.enum(['booking', 'delivery']),
      totalAmount: z.string(),
      details: z.string().optional(),
      orderItems: z.array(z.object({
        product_name: z.string(),
        quantity: z.number(),
        price: z.string(),
      })).optional(),
    }))
    .mutation(async ({ input }) => {
      const { customerId, orderItems, ...orderData } = input;
      const { data: order, error } = await supabase.from('orders').insert({
        customer_id: customerId,
        ...orderData,
      }).select().single();

      if (error) {
        throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: `Failed to create order: ${error.message}` });
      }

      if (orderItems && orderItems.length > 0) {
        const itemsToInsert = orderItems.map(item => ({ ...item, order_id: order.id }));
        const { error: itemsError } = await supabase.from('order_items').insert(itemsToInsert);
        if (itemsError) {
          // TODO: Rollback order creation or handle partial failure
          throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: `Failed to create order items: ${itemsError.message}` });
        }
      }

      // Handle '猛健樂' specific logic
      if (input.details && input.details.includes('猛健樂')) {
        // This logic might need to be adapted based on the new schema and requirements
        // For now, we assume a separate table 'treatment_plans' exists.
      }

      return order;
    }),

  update: protectedProcedure
    .input(z.object({
      id: z.number(),
      totalAmount: z.string().optional(),
      details: z.string().optional(),
      status: z.string().optional(),
      shipping_address: z.string().optional(),
      tracking_number: z.string().optional(),
    }))
    .mutation(async ({ input }) => {
      const { id, ...updateData } = input;
      const { data, error } = await supabase.from('orders').update(updateData).eq('id', id).select().single();

      if (error) {
        throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: error.message });
      }
      return data;
    }),

  delete: protectedProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ input }) => {
      const { error } = await supabase.from('orders').delete().eq('id', input.id);
      if (error) {
        throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: error.message });
      }
      return { success: true };
    }),

  updateStatus: protectedProcedure
    .input(z.object({ 
      tenantId: z.number(),
      orderId: z.number(), 
      status: z.enum(['pending', 'paid', 'shipped', 'completed', 'cancelled']),
      trackingNumber: z.string().optional(),
      notifyCustomer: z.boolean().optional(),
    }))
    .mutation(async ({ input }) => {
      const updateData: any = { status: input.status };
      if (input.trackingNumber) updateData.tracking_number = input.trackingNumber;
      const { data: updatedOrder, error } = await supabase.from('orders').update(updateData).eq('id', input.orderId).eq('tenant_id', input.tenantId).select('*, customers(line_user_id)').single();

      if (error) {
        throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: error.message });
      }

      if (input.notifyCustomer && updatedOrder && updatedOrder.customers?.line_user_id) {
        // await sendOrderStatusUpdate(updatedOrder.customers.line_user_id, updatedOrder.id, input.status);
      }

      return updatedOrder;
    }),

  // Aggregation endpoints - returning mock data for now
  getOrderStats: protectedProcedure.query(async () => {
    // TODO: Implement with Supabase RPC
    return {
      totalOrders: 0,
      totalRevenue: '0',
      pendingOrders: 0,
    };
  }),

  getMonthlyRevenue: protectedProcedure.query(async () => {
    // TODO: Implement with Supabase RPC
    return [];
  }),
  
  search: protectedProcedure
    .input(z.object({ query: z.string() }))
    .query(async ({ input }) => {
      if (!input.query) return [];
      const { data, error } = await supabase
        .from('orders')
        .select('*, customers(name)')
        .or(`order_number.ilike.%${input.query}%,details.ilike.%${input.query}%,customers.name.ilike.%${input.query}%`);

      if (error) {
        throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: error.message });
      }
      return data;
    }),
});

export type OrderRouter = typeof orderRouter;
