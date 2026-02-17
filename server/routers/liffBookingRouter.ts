/**
 * LIFF Booking Router (lineRouter 層 — YaoYouQian 專用)
 * LIFF 環境下的預約流程（選服務→選人員→選時段→確認）
 */
import { z } from "zod";
import { publicProcedure, router } from "../_core/trpc";
import { TRPCError } from "@trpc/server";
import { supabase } from "../supabaseClient";

export const liffBookingRouter = router({
  getAvailableServices: publicProcedure
    .input(z.object({ tenantId: z.number() }))
    .query(async ({ input }) => {
      const { data, error } = await supabase
        .from("services")
        .select("id, name, description, price, duration, category, image_url")
        .eq("tenant_id", input.tenantId)
        .eq("is_active", true)
        .order("category").order("name");
      if (error) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: error.message });
      return (data || []).map((s: any) => ({
        id: s.id as number, name: s.name as string,
        description: (s.description ?? null) as string | null,
        price: String(s.price), duration: s.duration as number,
        category: (s.category ?? null) as string | null,
        imageUrl: (s.image_url ?? null) as string | null,
      }));
    }),

  getAvailableStaff: publicProcedure
    .input(z.object({ tenantId: z.number(), serviceId: z.number(), date: z.string() }))
    .query(async ({ input }) => {
      const { data: staffList, error } = await supabase
        .from("staff").select("id, name, role_type, avatar_url")
        .eq("tenant_id", input.tenantId).eq("status", "active").order("name");
      if (error) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: error.message });
      const { data: schedules } = await supabase
        .from("staff_schedules").select("staff_id")
        .eq("tenant_id", input.tenantId).eq("date", input.date).neq("shift_type", "off");
      const scheduledIds = new Set((schedules || []).map((s: any) => s.staff_id));
      const filtered = scheduledIds.size > 0
        ? (staffList || []).filter((s: any) => scheduledIds.has(s.id))
        : (staffList || []);
      return filtered.map((s: any) => ({
        id: s.id as number, name: s.name as string,
        title: (s.role_type ?? null) as string | null,
        avatarUrl: (s.avatar_url ?? null) as string | null,
      }));
    }),

  getAvailableSlots: publicProcedure
    .input(z.object({ tenantId: z.number(), serviceId: z.number(), staffId: z.number().optional(), date: z.string() }))
    .query(async ({ input }) => {
      const { data: slotLimits } = await supabase
        .from("booking_slot_limits").select("time_slot, max_capacity, current_bookings, is_available")
        .eq("tenant_id", input.tenantId).eq("date", input.date);
      if (slotLimits && slotLimits.length > 0) {
        return slotLimits.map((sl: any) => ({
          time: sl.time_slot as string,
          available: sl.is_available && (sl.max_capacity - sl.current_bookings) > 0,
          remainingCapacity: Math.max(0, sl.max_capacity - sl.current_bookings),
        }));
      }
      const slots: Array<{ time: string; available: boolean; remainingCapacity: number }> = [];
      const cap = 3;
      const { data: appts } = await supabase
        .from("appointments").select("appointment_time")
        .eq("tenant_id", input.tenantId).eq("appointment_date", input.date).neq("status", "cancelled");
      const counts: Record<string, number> = {};
      (appts || []).forEach((a: any) => { counts[a.appointment_time] = (counts[a.appointment_time] || 0) + 1; });
      for (let h = 9; h < 18; h++) {
        for (const m of [0, 30]) {
          const time = `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
          const booked = counts[time] || 0;
          slots.push({ time, available: (cap - booked) > 0, remainingCapacity: Math.max(0, cap - booked) });
        }
      }
      return slots;
    }),

  createBooking: publicProcedure
    .input(z.object({
      tenantId: z.number(), customerId: z.number().optional(), lineUserId: z.string().optional(),
      serviceId: z.number(), staffId: z.number().optional(), date: z.string(), time: z.string(),
      customerName: z.string(), customerPhone: z.string(), notes: z.string().optional(),
    }))
    .mutation(async ({ input }) => {
      let customerId = input.customerId;
      if (!customerId && input.lineUserId) {
        const { data: existing } = await supabase.from("customers").select("id")
          .eq("tenant_id", input.tenantId).eq("line_user_id", input.lineUserId).single();
        if (existing) { customerId = existing.id; }
        else {
          const { data: nc, error: ce } = await supabase.from("customers")
            .insert({ tenant_id: input.tenantId, line_user_id: input.lineUserId, name: input.customerName, phone: input.customerPhone })
            .select("id").single();
          if (ce) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: ce.message });
          customerId = nc!.id;
        }
      }
      if (!customerId) {
        const { data: pc } = await supabase.from("customers").select("id")
          .eq("tenant_id", input.tenantId).eq("phone", input.customerPhone).single();
        if (pc) { customerId = pc.id; }
        else {
          const { data: nc, error: ce } = await supabase.from("customers")
            .insert({ tenant_id: input.tenantId, name: input.customerName, phone: input.customerPhone })
            .select("id").single();
          if (ce) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: ce.message });
          customerId = nc!.id;
        }
      }
      const { data: svc } = await supabase.from("services").select("name").eq("id", input.serviceId).single();
      const { data: appt, error: ae } = await supabase.from("appointments").insert({
        tenant_id: input.tenantId, customer_id: customerId, service_id: input.serviceId,
        staff_id: input.staffId || null, appointment_date: input.date, appointment_time: input.time,
        status: "pending", notes: input.notes || null, service: svc?.name || null,
        customer_name: input.customerName, customer_phone: input.customerPhone,
      }).select("id").single();
      if (ae) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: ae.message });
      return { success: true, appointmentId: appt!.id as number };
    }),

  cancelBooking: publicProcedure
    .input(z.object({ tenantId: z.number(), appointmentId: z.number(), lineUserId: z.string().optional(), reason: z.string().optional() }))
    .mutation(async ({ input }) => {
      const updateData: Record<string, unknown> = { status: "cancelled" };
      if (input.reason) updateData.notes = `取消原因: ${input.reason}`;
      const { error } = await supabase.from("appointments").update(updateData)
        .eq("id", input.appointmentId).eq("tenant_id", input.tenantId);
      if (error) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: error.message });
      return { success: true };
    }),

  rescheduleBooking: publicProcedure
    .input(z.object({ tenantId: z.number(), appointmentId: z.number(), lineUserId: z.string().optional(), newDate: z.string(), newTime: z.string() }))
    .mutation(async ({ input }) => {
      const { error } = await supabase.from("appointments")
        .update({ appointment_date: input.newDate, appointment_time: input.newTime, status: "pending" })
        .eq("id", input.appointmentId).eq("tenant_id", input.tenantId);
      if (error) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: error.message });
      return { success: true };
    }),
});
