/**
 * Schedule Router (coreRouter 層)
 * 員工排班管理
 */
import { z } from "zod";
import { publicProcedure, router, adminProcedure } from "../_core/trpc";
import { TRPCError } from "@trpc/server";
import { supabase } from "../supabaseClient";

export const scheduleRouter = router({
  listSchedules: publicProcedure
    .input(z.object({ tenantId: z.number(), staffId: z.number().optional(), startDate: z.string().optional(), endDate: z.string().optional() }))
    .query(async ({ input }) => {
      let query = supabase.from("staff_schedules")
        .select("id, staff_id, date, start_time, end_time, shift_type, notes")
        .eq("tenant_id", input.tenantId);
      if (input.staffId) query = query.eq("staff_id", input.staffId);
      if (input.startDate) query = query.gte("date", input.startDate);
      if (input.endDate) query = query.lte("date", input.endDate);
      const { data, error } = await query.order("date").order("start_time");
      if (error) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: error.message });
      return (data || []).map((s: any) => ({
        id: s.id as number, staffId: s.staff_id as number, staffName: "" as string,
        date: s.date as string, startTime: s.start_time as string, endTime: s.end_time as string,
        shiftType: s.shift_type as string,
      }));
    }),

  getMySchedule: publicProcedure
    .input(z.object({ tenantId: z.number(), staffId: z.number(), month: z.string() }))
    .query(async ({ input }) => {
      const startDate = `${input.month}-01`;
      const [y, m] = input.month.split("-").map(Number);
      const lastDay = new Date(y, m, 0).getDate();
      const endDate = `${input.month}-${String(lastDay).padStart(2, "0")}`;
      const { data, error } = await supabase.from("staff_schedules")
        .select("id, date, start_time, end_time, shift_type, notes")
        .eq("tenant_id", input.tenantId).eq("staff_id", input.staffId)
        .gte("date", startDate).lte("date", endDate).order("date").order("start_time");
      if (error) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: error.message });
      return (data || []).map((s: any) => ({
        id: s.id as number, date: s.date as string, startTime: s.start_time as string,
        endTime: s.end_time as string, shiftType: s.shift_type as string,
        notes: (s.notes ?? null) as string | null,
      }));
    }),

  createSchedule: adminProcedure
    .input(z.object({ tenantId: z.number(), staffId: z.number(), date: z.string(), startTime: z.string(), endTime: z.string(), shiftType: z.enum(["normal", "overtime", "off"]).default("normal"), notes: z.string().optional() }))
    .mutation(async ({ input }) => {
      const { data, error } = await supabase.from("staff_schedules").insert({
        tenant_id: input.tenantId, staff_id: input.staffId, date: input.date,
        start_time: input.startTime, end_time: input.endTime,
        shift_type: input.shiftType, notes: input.notes || null,
      }).select("id").single();
      if (error) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: error.message });
      return { success: true, id: data!.id as number };
    }),

  updateSchedule: adminProcedure
    .input(z.object({ id: z.number(), tenantId: z.number(), startTime: z.string().optional(), endTime: z.string().optional(), shiftType: z.enum(["normal", "overtime", "off"]).optional(), notes: z.string().optional() }))
    .mutation(async ({ input }) => {
      const updateData: Record<string, unknown> = {};
      if (input.startTime) updateData.start_time = input.startTime;
      if (input.endTime) updateData.end_time = input.endTime;
      if (input.shiftType) updateData.shift_type = input.shiftType;
      if (input.notes !== undefined) updateData.notes = input.notes;
      const { error } = await supabase.from("staff_schedules").update(updateData)
        .eq("id", input.id).eq("tenant_id", input.tenantId);
      if (error) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: error.message });
      return { success: true };
    }),

  deleteSchedule: adminProcedure
    .input(z.object({ id: z.number(), tenantId: z.number() }))
    .mutation(async ({ input }) => {
      const { error } = await supabase.from("staff_schedules").delete()
        .eq("id", input.id).eq("tenant_id", input.tenantId);
      if (error) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: error.message });
      return { success: true };
    }),
});
