import { z } from "zod";
import { router, publicProcedure } from "../_core/trpc";
import { TRPCError } from "@trpc/server";
import { supabase } from "../supabaseClient";

export const serviceRouter = router({
  list: publicProcedure
    .input(z.object({
      tenantId: z.number(),
      category: z.string().optional(),
      isActive: z.boolean().optional(),
    }))
    .query(async ({ input }) => {
      let query = supabase
        .from('services')
        .select('*')
        .eq('tenant_id', input.tenantId)
        .order('created_at', { ascending: false });
      if (input.category) {
        query = query.eq('category', input.category);
      }
      if (input.isActive !== undefined) {
        query = query.eq('is_active', input.isActive);
      }
      const { data, error } = await query;
      if (error) {
        throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: error.message });
      }
      return data || [];
    }),

  create: publicProcedure
    .input(z.object({
      tenantId: z.number(),
      name: z.string().min(1),
      description: z.string().optional(),
      price: z.number().min(0),
      duration: z.number().min(1),
      category: z.string().min(1),
      imageUrl: z.string().nullable().optional(),
    }))
    .mutation(async ({ input }) => {
      const { data, error } = await supabase
        .from('services')
        .insert({
          tenant_id: input.tenantId,
          name: input.name,
          description: input.description || null,
          price: input.price,
          duration_minutes: input.duration,
          category: input.category || null,
          image_url: input.imageUrl || null,
          is_active: true,
        })
        .select('id')
        .single();
      if (error) {
        throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: error.message });
      }
      return { success: true, serviceId: data?.id };
    }),

  update: publicProcedure
    .input(z.object({
      tenantId: z.number(),
      serviceId: z.number(),
      name: z.string().min(1),
      description: z.string().optional(),
      price: z.number().min(0),
      duration: z.number().min(1),
      category: z.string().min(1),
      imageUrl: z.string().nullable().optional(),
    }))
    .mutation(async ({ input }) => {
      const { error } = await supabase
        .from('services')
        .update({
          name: input.name,
          description: input.description || null,
          price: input.price,
          duration_minutes: input.duration,
          category: input.category,
          image_url: input.imageUrl || null,
        })
        .eq('id', input.serviceId)
        .eq('tenant_id', input.tenantId);
      if (error) {
        throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: error.message });
      }
      return { success: true };
    }),

  delete: publicProcedure
    .input(z.object({
      tenantId: z.number(),
      serviceId: z.number(),
    }))
    .mutation(async ({ input }) => {
      const { error } = await supabase
        .from('services')
        .delete()
        .eq('id', input.serviceId)
        .eq('tenant_id', input.tenantId);
      if (error) {
        throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: error.message });
      }
      return { success: true };
    }),

  toggleStatus: publicProcedure
    .input(z.object({
      tenantId: z.number(),
      serviceId: z.number(),
      isActive: z.boolean(),
    }))
    .mutation(async ({ input }) => {
      const { error } = await supabase
        .from('services')
        .update({ is_active: input.isActive })
        .eq('id', input.serviceId)
        .eq('tenant_id', input.tenantId);
      if (error) {
        throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: error.message });
      }
      return { success: true };
    }),
});
