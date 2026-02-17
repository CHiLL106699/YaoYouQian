/**
 * LIFF Member Router (lineRouter 層 — YaoYouQian 專用)
 * LIFF 會員中心 API：會員資料、點數、消費紀錄、預約查詢/取消/修改
 */
import { z } from "zod";
import { publicProcedure, router } from "../_core/trpc";

export const liffMemberRouter = router({
  // 取得會員資料
  getProfile: publicProcedure
    .input(z.object({
      tenantId: z.number(),
      lineUserId: z.string(),
    }))
    .query(async ({ input }) => {
      // TODO: DB query customer by lineUserId
      return null as null | {
        id: number;
        name: string;
        phone: string;
        email: string | null;
        birthday: string | null;
        totalSpent: string;
        visitCount: number;
        memberLevel: string | null;
        points: number;
      };
    }),

  // 更新會員資料
  updateProfile: publicProcedure
    .input(z.object({
      tenantId: z.number(),
      lineUserId: z.string(),
      name: z.string().optional(),
      phone: z.string().optional(),
      email: z.string().optional(),
      birthday: z.string().optional(),
    }))
    .mutation(async ({ input }) => {
      // TODO: DB update
      return { success: true };
    }),

  // 取得消費紀錄
  getTransactionHistory: publicProcedure
    .input(z.object({
      tenantId: z.number(),
      lineUserId: z.string(),
      limit: z.number().min(1).max(50).default(20),
      offset: z.number().min(0).default(0),
    }))
    .query(async ({ input }) => {
      return {
        transactions: [] as Array<{
          id: number;
          type: string;
          amount: string;
          description: string;
          date: string;
        }>,
        total: 0,
      };
    }),

  // 取得我的預約（即將到來 + 歷史）
  getMyAppointments: publicProcedure
    .input(z.object({
      tenantId: z.number(),
      lineUserId: z.string(),
      status: z.enum(["upcoming", "history", "all"]).default("all"),
      limit: z.number().min(1).max(50).default(20),
      offset: z.number().min(0).default(0),
    }))
    .query(async ({ input }) => {
      // TODO: DB query appointments by lineUserId via customer table
      return {
        appointments: [] as Array<{
          id: number;
          serviceName: string;
          staffName: string | null;
          date: string;
          time: string;
          status: string;
          notes: string | null;
        }>,
        total: 0,
      };
    }),

  // 取消預約
  cancelAppointment: publicProcedure
    .input(z.object({
      tenantId: z.number(),
      lineUserId: z.string(),
      appointmentId: z.number(),
      reason: z.string().optional(),
    }))
    .mutation(async ({ input }) => {
      // TODO: Verify ownership + update status
      return { success: true };
    }),

  // 修改預約時間
  rescheduleAppointment: publicProcedure
    .input(z.object({
      tenantId: z.number(),
      lineUserId: z.string(),
      appointmentId: z.number(),
      newDate: z.string(),
      newTime: z.string(),
    }))
    .mutation(async ({ input }) => {
      // TODO: Verify ownership + create reschedule request
      return { success: true };
    }),

  // 取得我的票券
  getMyVouchers: publicProcedure
    .input(z.object({
      tenantId: z.number(),
      lineUserId: z.string(),
    }))
    .query(async ({ input }) => {
      return [] as Array<{
        id: number;
        name: string;
        code: string;
        expiresAt: string | null;
        isUsed: boolean;
      }>;
    }),
});
