/**
 * Clock Router (coreRouter 層)
 * 員工打卡管理
 */
import { z } from "zod";
import { publicProcedure, router, adminProcedure } from "../_core/trpc";

export const clockRouter = router({
  clockIn: publicProcedure
    .input(z.object({
      tenantId: z.number(),
      staffId: z.number(),
      location: z.string().optional(),
      notes: z.string().optional(),
    }))
    .mutation(async ({ input }) => {
      // TODO: DB insert clock_in record
      return { success: true, id: 0, clockIn: new Date().toISOString() };
    }),

  clockOut: publicProcedure
    .input(z.object({
      tenantId: z.number(),
      staffId: z.number(),
      recordId: z.number(),
      location: z.string().optional(),
      notes: z.string().optional(),
    }))
    .mutation(async ({ input }) => {
      // TODO: DB update clock_out
      return { success: true, clockOut: new Date().toISOString() };
    }),

  getTodayRecord: publicProcedure
    .input(z.object({
      tenantId: z.number(),
      staffId: z.number(),
    }))
    .query(async ({ input }) => {
      // TODO: DB query today's clock record
      return null as null | {
        id: number;
        clockIn: string | null;
        clockOut: string | null;
        date: string;
        location: string | null;
      };
    }),

  listRecords: publicProcedure
    .input(z.object({
      tenantId: z.number(),
      staffId: z.number().optional(),
      startDate: z.string().optional(),
      endDate: z.string().optional(),
      limit: z.number().min(1).max(100).default(30),
      offset: z.number().min(0).default(0),
    }))
    .query(async ({ input }) => {
      // TODO: DB query
      return {
        records: [] as Array<{
          id: number;
          staffId: number;
          staffName: string;
          clockIn: string | null;
          clockOut: string | null;
          date: string;
          location: string | null;
        }>,
        total: 0,
      };
    }),
});
