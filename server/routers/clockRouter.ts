/**
 * Clock Router (coreRouter 層)
 * 員工打卡管理
 */
import { z } from "zod";
import { publicProcedure, router } from "../_core/trpc";
import { TRPCError } from "@trpc/server";
import { supabase } from "../supabaseClient";

export const clockRouter = router({
  clockIn: publicProcedure
    .input(z.object({ tenantId: z.number(), staffId: z.number(), location: z.string().optional() }))
    .mutation(async ({ input }) => {
      const today = new Date().toISOString().split("T")[0];
      // Check if already clocked in today
      const { data: existing } = await supabase.from("clock_records").select("id")
        .eq("tenant_id", input.tenantId).eq("staff_id", input.staffId).eq("date", today).single();
      if (existing) throw new TRPCError({ code: "BAD_REQUEST", message: "今日已打卡上班" });
      const now = new Date().toISOString();
      const { data, error } = await supabase.from("clock_records").insert({
        tenant_id: input.tenantId, staff_id: input.staffId, clock_in: now,
        date: today, location: input.location || null,
      }).select("id, clock_in").single();
      if (error) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: error.message });
      return { success: true, clockIn: data!.clock_in as string };
    }),

  clockOut: publicProcedure
    .input(z.object({ tenantId: z.number(), staffId: z.number(), location: z.string().optional() }))
    .mutation(async ({ input }) => {
      const today = new Date().toISOString().split("T")[0];
      const { data: existing } = await supabase.from("clock_records").select("id, clock_out")
        .eq("tenant_id", input.tenantId).eq("staff_id", input.staffId).eq("date", today).single();
      if (!existing) throw new TRPCError({ code: "BAD_REQUEST", message: "尚未打卡上班" });
      if (existing.clock_out) throw new TRPCError({ code: "BAD_REQUEST", message: "今日已打卡下班" });
      const now = new Date().toISOString();
      const { error } = await supabase.from("clock_records").update({ clock_out: now })
        .eq("id", existing.id);
      if (error) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: error.message });
      return { success: true, clockOut: now };
    }),

  getTodayRecord: publicProcedure
    .input(z.object({ tenantId: z.number(), staffId: z.number() }))
    .query(async ({ input }) => {
      const today = new Date().toISOString().split("T")[0];
      const { data, error } = await supabase.from("clock_records").select("id, clock_in, clock_out, date, location")
        .eq("tenant_id", input.tenantId).eq("staff_id", input.staffId).eq("date", today).single();
      if (error && error.code !== "PGRST116") throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: error.message });
      if (!data) return null;
      return {
        id: data.id as number, clockIn: (data.clock_in ?? null) as string | null,
        clockOut: (data.clock_out ?? null) as string | null, date: data.date as string,
        location: (data.location ?? null) as string | null,
      };
    }),

  listRecords: publicProcedure
    .input(z.object({ tenantId: z.number(), staffId: z.number().optional(), startDate: z.string().optional(), endDate: z.string().optional(), limit: z.number().min(1).max(100).default(30), offset: z.number().min(0).default(0) }))
    .query(async ({ input }) => {
      let query = supabase.from("clock_records").select("id, staff_id, clock_in, clock_out, date, location", { count: "exact" })
        .eq("tenant_id", input.tenantId);
      if (input.staffId) query = query.eq("staff_id", input.staffId);
      if (input.startDate) query = query.gte("date", input.startDate);
      if (input.endDate) query = query.lte("date", input.endDate);
      const { data, error, count } = await query.order("date", { ascending: false }).range(input.offset, input.offset + input.limit - 1);
      if (error) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: error.message });
      return {
        records: (data || []).map((r: any) => ({
          id: r.id as number, staffId: r.staff_id as number, staffName: "" as string,
          clockIn: (r.clock_in ?? null) as string | null, clockOut: (r.clock_out ?? null) as string | null,
          date: r.date as string, location: (r.location ?? null) as string | null,
        })),
        total: count || 0,
      };
    }),
});
