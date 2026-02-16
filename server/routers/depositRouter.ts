import { router, protectedProcedure } from "../_core/trpc";
import { z } from "zod";
import { supabase } from "../supabaseClient";

export const depositRouter = router({
  list: protectedProcedure
    .input(z.object({
      tenantId: z.number(),
      status: z.enum(['pending', 'paid', 'refunded', 'forfeited']).optional(),
    }))
    .query(async ({ input }) => {
      let query = supabase
        .from('deposits')
        .select('*, customers(name, phone), appointments(appointment_date, appointment_time)')
        .eq('tenant_id', input.tenantId);
      
      if (input.status) {
        query = query.eq('status', input.status);
      }
      
      const { data, error } = await query.order('created_at', { ascending: false });
      if (error) throw new Error(error.message);
      return data || [];
    }),

  create: protectedProcedure
    .input(z.object({
      tenantId: z.number(),
      customerId: z.number(),
      appointmentId: z.number().optional(),
      amount: z.number(),
      paymentMethod: z.string().optional(),
      notes: z.string().optional(),
    }))
    .mutation(async ({ input }) => {
      const { data, error } = await supabase
        .from('deposits')
        .insert([{ ...input, status: 'pending' }])
        .select()
        .single();
      
      if (error) throw new Error(error.message);
      return data;
    }),

  updateStatus: protectedProcedure
    .input(z.object({
      id: z.number(),
      status: z.enum(['pending', 'paid', 'refunded', 'forfeited']),
    }))
    .mutation(async ({ input }) => {
      const updateData: any = { status: input.status, updated_at: new Date().toISOString() };
      if (input.status === 'paid') {
        updateData.paid_at = new Date().toISOString();
      }
      
      const { data, error } = await supabase
        .from('deposits')
        .update(updateData)
        .eq('id', input.id)
        .select()
        .single();
      
      if (error) throw new Error(error.message);
      return data;
    }),
});
