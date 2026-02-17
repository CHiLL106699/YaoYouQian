/**
 * LIFF Member Router (lineRouter 層 — YaoYouQian 專用)
 * 會員中心 API
 */
import { z } from "zod";
import { publicProcedure, router } from "../_core/trpc";
import { TRPCError } from "@trpc/server";
import { supabase } from "../supabaseClient";

export const liffMemberRouter = router({
  getProfile: publicProcedure
    .input(z.object({ tenantId: z.number(), lineUserId: z.string() }))
    .query(async ({ input }) => {
      const { data, error } = await supabase.from("customers").select("*")
        .eq("tenant_id", input.tenantId).eq("line_user_id", input.lineUserId).single();
      if (error && error.code !== "PGRST116") throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: error.message });
      if (!data) return { customerId: 0, name: "", phone: "", email: null as string | null, birthday: null as string | null, totalSpent: "0", visitCount: 0, memberLevel: null as string | null, points: 0 };
      return {
        customerId: data.id as number, name: data.name as string, phone: data.phone as string,
        email: (data.email ?? null) as string | null,
        birthday: data.birthday ? String(data.birthday).split("T")[0] : null,
        totalSpent: String(data.total_spent || "0"), visitCount: (data.visit_count || 0) as number,
        memberLevel: null as string | null, points: 0,
      };
    }),

  updateProfile: publicProcedure
    .input(z.object({ tenantId: z.number(), lineUserId: z.string(), name: z.string().optional(), phone: z.string().optional(), email: z.string().optional(), birthday: z.string().optional() }))
    .mutation(async ({ input }) => {
      const updateData: Record<string, unknown> = {};
      if (input.name) updateData.name = input.name;
      if (input.phone) updateData.phone = input.phone;
      if (input.email !== undefined) updateData.email = input.email || null;
      if (input.birthday !== undefined) updateData.birthday = input.birthday || null;
      const { error } = await supabase.from("customers").update(updateData)
        .eq("tenant_id", input.tenantId).eq("line_user_id", input.lineUserId);
      if (error) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: error.message });
      return { success: true };
    }),

  getTransactionHistory: publicProcedure
    .input(z.object({ tenantId: z.number(), lineUserId: z.string(), limit: z.number().min(1).max(50).default(20), offset: z.number().min(0).default(0) }))
    .query(async ({ input }) => {
      const { data: cust } = await supabase.from("customers").select("id")
        .eq("tenant_id", input.tenantId).eq("line_user_id", input.lineUserId).single();
      if (!cust) return { transactions: [] as Array<{ id: number; type: string; amount: string; description: string; date: string }>, total: 0 };
      const { data, error, count } = await supabase.from("orders")
        .select("id, order_number, total_amount, status, created_at", { count: "exact" })
        .eq("tenant_id", input.tenantId).eq("customer_id", cust.id)
        .order("created_at", { ascending: false }).range(input.offset, input.offset + input.limit - 1);
      if (error) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: error.message });
      return {
        transactions: (data || []).map((o: any) => ({
          id: o.id as number, type: "order", amount: String(o.total_amount),
          description: `訂單 ${o.order_number}`, date: String(o.created_at).split("T")[0],
        })),
        total: count || 0,
      };
    }),

  getMyAppointments: publicProcedure
    .input(z.object({ tenantId: z.number(), lineUserId: z.string(), status: z.enum(["upcoming", "history", "all"]).default("all"), limit: z.number().min(1).max(50).default(20), offset: z.number().min(0).default(0) }))
    .query(async ({ input }) => {
      const { data: cust } = await supabase.from("customers").select("id")
        .eq("tenant_id", input.tenantId).eq("line_user_id", input.lineUserId).single();
      if (!cust) return { appointments: [] as Array<{ id: number; serviceName: string; staffName: string | null; date: string; time: string; status: string; notes: string | null }>, total: 0 };
      let query = supabase.from("appointments")
        .select("id, service, customer_name, appointment_date, appointment_time, status, notes, staff_id", { count: "exact" })
        .eq("tenant_id", input.tenantId).eq("customer_id", cust.id);
      const today = new Date().toISOString().split("T")[0];
      if (input.status === "upcoming") query = query.gte("appointment_date", today).neq("status", "cancelled");
      else if (input.status === "history") query = query.lt("appointment_date", today);
      const { data, error, count } = await query.order("appointment_date", { ascending: false }).range(input.offset, input.offset + input.limit - 1);
      if (error) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: error.message });
      return {
        appointments: (data || []).map((a: any) => ({
          id: a.id as number, serviceName: (a.service || "未指定") as string,
          staffName: null as string | null,
          date: String(a.appointment_date).split("T")[0], time: a.appointment_time as string,
          status: a.status as string, notes: (a.notes ?? null) as string | null,
        })),
        total: count || 0,
      };
    }),

  cancelAppointment: publicProcedure
    .input(z.object({ tenantId: z.number(), lineUserId: z.string(), appointmentId: z.number(), reason: z.string().optional() }))
    .mutation(async ({ input }) => {
      const updateData: Record<string, unknown> = { status: "cancelled" };
      if (input.reason) updateData.notes = `取消原因: ${input.reason}`;
      const { error } = await supabase.from("appointments").update(updateData)
        .eq("id", input.appointmentId).eq("tenant_id", input.tenantId);
      if (error) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: error.message });
      return { success: true };
    }),

  rescheduleAppointment: publicProcedure
    .input(z.object({ tenantId: z.number(), lineUserId: z.string(), appointmentId: z.number(), newDate: z.string(), newTime: z.string() }))
    .mutation(async ({ input }) => {
      const { error } = await supabase.from("appointments")
        .update({ appointment_date: input.newDate, appointment_time: input.newTime, status: "pending" })
        .eq("id", input.appointmentId).eq("tenant_id", input.tenantId);
      if (error) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: error.message });
      return { success: true };
    }),

  getMyVouchers: publicProcedure
    .input(z.object({ tenantId: z.number(), lineUserId: z.string() }))
    .query(async ({ input }) => {
      const { data: cust } = await supabase.from("customers").select("id")
        .eq("tenant_id", input.tenantId).eq("line_user_id", input.lineUserId).single();
      if (!cust) return [] as Array<{ id: number; name: string; code: string; expiresAt: string | null; isUsed: boolean }>;
      // vouchers table may not exist yet - return empty
      return [] as Array<{ id: number; name: string; code: string; expiresAt: string | null; isUsed: boolean }>;
    }),
});
