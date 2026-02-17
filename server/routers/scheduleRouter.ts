/**
 * Schedule Router (coreRouter 層)
 * 員工排班管理
 */
import { z } from "zod";
import { publicProcedure, router, adminProcedure } from "../_core/trpc";

export const scheduleRouter = router({
  listSchedules: publicProcedure
    .input(z.object({
      tenantId: z.number(),
      staffId: z.number().optional(),
      startDate: z.string().optional(),
      endDate: z.string().optional(),
    }))
    .query(async ({ input }) => {
      // TODO: DB query
      return [] as Array<{
        id: number;
        staffId: number;
        staffName: string;
        date: string;
        startTime: string;
        endTime: string;
        shiftType: string;
      }>;
    }),

  getMySchedule: publicProcedure
    .input(z.object({
      tenantId: z.number(),
      staffId: z.number(),
      month: z.string(), // YYYY-MM
    }))
    .query(async ({ input }) => {
      // TODO: DB query
      return [] as Array<{
        id: number;
        date: string;
        startTime: string;
        endTime: string;
        shiftType: string;
        notes: string | null;
      }>;
    }),

  createSchedule: adminProcedure
    .input(z.object({
      tenantId: z.number(),
      staffId: z.number(),
      date: z.string(),
      startTime: z.string(),
      endTime: z.string(),
      shiftType: z.enum(["normal", "overtime", "off"]).default("normal"),
      notes: z.string().optional(),
    }))
    .mutation(async ({ input }) => {
      // TODO: DB insert
      return { success: true, id: 0 };
    }),

  updateSchedule: adminProcedure
    .input(z.object({
      id: z.number(),
      tenantId: z.number(),
      startTime: z.string().optional(),
      endTime: z.string().optional(),
      shiftType: z.enum(["normal", "overtime", "off"]).optional(),
      notes: z.string().optional(),
    }))
    .mutation(async ({ input }) => {
      // TODO: DB update
      return { success: true };
    }),

  deleteSchedule: adminProcedure
    .input(z.object({ id: z.number(), tenantId: z.number() }))
    .mutation(async ({ input }) => {
      // TODO: DB delete
      return { success: true };
    }),
});
