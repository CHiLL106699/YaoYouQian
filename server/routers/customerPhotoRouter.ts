import { router, protectedProcedure } from "../_core/trpc";
import { z } from "zod";
import { supabase } from "../supabaseClient";

export const customerPhotoRouter = router({
  list: protectedProcedure
    .input(z.object({
      tenantId: z.number(),
      customerId: z.number().optional(),
    }))
    .query(async ({ input }) => {
      let query = supabase
        .from('customer_photos')
        .select('*, customers(name), services(name)')
        .eq('tenant_id', input.tenantId);
      
      if (input.customerId) {
        query = query.eq('customer_id', input.customerId);
      }
      
      const { data, error } = await query.order('upload_date', { ascending: false });
      if (error) throw new Error(error.message);
      return data || [];
    }),

  create: protectedProcedure
    .input(z.object({
      tenantId: z.number(),
      customerId: z.number(),
      serviceId: z.number().optional(),
      photoUrl: z.string(),
      photoType: z.enum(['before', 'after', 'during']),
      notes: z.string().optional(),
    }))
    .mutation(async ({ input }) => {
      const { data, error } = await supabase
        .from('customer_photos')
        .insert([input])
        .select()
        .single();
      
      if (error) throw new Error(error.message);
      return data;
    }),

  delete: protectedProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ input }) => {
      const { error } = await supabase
        .from('customer_photos')
        .delete()
        .eq('id', input.id);
      
      if (error) throw new Error(error.message);
      return { success: true };
    }),
});
