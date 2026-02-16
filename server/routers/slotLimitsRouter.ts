import { z } from "zod";
import { supabase } from "../supabaseClient";
import { router, publicProcedure, protectedProcedure } from "../_core/trpc";
import { TRPCError } from "@trpc/server";

export const slotLimitsRouter = router({
  getByDate: publicProcedure
    .input(z.object({
      tenantId: z.number(),
      date: z.string(),
    }))
    .query(async ({ input }) => {
      const { data, error } = await supabase
        .from('slot_limits')
        .select('*')
        .eq('tenant_id', input.tenantId)
        .eq('appointment_date', input.date);
      if (error) {
        throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: error.message });
      }
      return data || [];
    }),

  set: publicProcedure
    .input(z.object({
      tenantId: z.number(),
      date: z.string(),
      time: z.string(),
      maxCapacity: z.number(),
    }))
    .mutation(async ({ input }) => {
      // Check if already exists
      const { data: existing } = await supabase
        .from('slot_limits')
        .select('id')
        .eq('tenant_id', input.tenantId)
        .eq('appointment_date', input.date)
        .eq('time_slot', input.time)
        .maybeSingle();

      if (existing) {
        const { error } = await supabase
          .from('slot_limits')
          .update({ max_bookings: input.maxCapacity })
          .eq('id', existing.id);
        if (error) {
          throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: error.message });
        }
      } else {
        const { error } = await supabase
          .from('slot_limits')
          .insert({
            tenant_id: input.tenantId,
            appointment_date: input.date,
            time_slot: input.time,
            max_bookings: input.maxCapacity,
            current_bookings: 0,
          });
        if (error) {
          throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: error.message });
        }
      }
      return { success: true };
    }),

  delete: publicProcedure
    .input(z.object({
      tenantId: z.number(),
      date: z.string(),
      time: z.string(),
    }))
    .mutation(async ({ input }) => {
      const { error } = await supabase
        .from('slot_limits')
        .delete()
        .eq('tenant_id', input.tenantId)
        .eq('appointment_date', input.date)
        .eq('time_slot', input.time);
      if (error) {
        throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: error.message });
      }
      return { success: true };
    }),

  getBatchByDateRange: publicProcedure
    .input(z.object({
      tenantId: z.number(),
      startDate: z.string(),
      endDate: z.string(),
    }))
    .query(async ({ input }) => {
      const { data, error } = await supabase
        .from('slot_limits')
        .select('*')
        .eq('tenant_id', input.tenantId)
        .gte('appointment_date', input.startDate)
        .lte('appointment_date', input.endDate);
      if (error) {
        throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: error.message });
      }
      return data || [];
    }),
});
