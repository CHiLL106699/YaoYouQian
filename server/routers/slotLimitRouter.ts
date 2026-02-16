import { z } from "zod";
import { router, protectedProcedure } from "../_core/trpc";
import { TRPCError } from "@trpc/server";
import { supabase } from "../supabaseClient";

export const slotLimitRouter = router({
  getByDate: protectedProcedure
    .input(z.object({
      tenantId: z.number(),
      date: z.string(),
    }))
    .query(async ({ input }) => {
      const { data, error } = await supabase
        .from('booking_slot_limits')
        .select('*')
        .eq('tenant_id', input.tenantId)
        .eq('date', input.date);

      if (error) {
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: `查詢時段上限失敗: ${error.message}`
        });
      }

      return data || [];
    }),

  setLimit: protectedProcedure
    .input(z.object({
      tenantId: z.number(),
      date: z.string(),
      timeSlot: z.string(),
      maxBookings: z.number(),
    }))
    .mutation(async ({ input }) => {
      const { data, error } = await supabase
        .from('booking_slot_limits')
        .upsert({
          tenant_id: input.tenantId,
          date: input.date,
          time_slot: input.timeSlot,
          max_bookings: input.maxBookings,
        })
        .select()
        .single();

      if (error) {
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: `設定時段上限失敗: ${error.message}`
        });
      }

      return { success: true, slotLimit: data };
    }),
});
