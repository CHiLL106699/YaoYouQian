/**
 * LIFF Booking Router (lineRouter 層 — YaoYouQian 專用)
 * LIFF 環境下的預約流程（選服務→選人員→選時段→確認）
 */
import { z } from "zod";
import { publicProcedure, router } from "../_core/trpc";

export const liffBookingRouter = router({
  // Step 1: 取得可預約服務列表
  getAvailableServices: publicProcedure
    .input(z.object({ tenantId: z.number() }))
    .query(async ({ input }) => {
      // TODO: DB query active services
      return [] as Array<{
        id: number;
        name: string;
        description: string | null;
        price: string;
        duration: number;
        category: string | null;
        imageUrl: string | null;
      }>;
    }),

  // Step 2: 取得可預約人員
  getAvailableStaff: publicProcedure
    .input(z.object({
      tenantId: z.number(),
      serviceId: z.number(),
      date: z.string(),
    }))
    .query(async ({ input }) => {
      // TODO: DB query available staff for service on date
      return [] as Array<{
        id: number;
        name: string;
        title: string | null;
        avatarUrl: string | null;
      }>;
    }),

  // Step 3: 取得可預約時段
  getAvailableSlots: publicProcedure
    .input(z.object({
      tenantId: z.number(),
      serviceId: z.number(),
      staffId: z.number().optional(),
      date: z.string(),
    }))
    .query(async ({ input }) => {
      // TODO: Calculate available slots
      return [] as Array<{
        time: string;
        available: boolean;
        remainingCapacity: number;
      }>;
    }),

  // Step 4: 建立預約
  createBooking: publicProcedure
    .input(z.object({
      tenantId: z.number(),
      customerId: z.number().optional(),
      lineUserId: z.string().optional(),
      serviceId: z.number(),
      staffId: z.number().optional(),
      date: z.string(),
      time: z.string(),
      customerName: z.string(),
      customerPhone: z.string(),
      notes: z.string().optional(),
    }))
    .mutation(async ({ input }) => {
      // TODO: Create appointment + update slot count
      return { success: true, appointmentId: 0 };
    }),

  // 取消預約
  cancelBooking: publicProcedure
    .input(z.object({
      tenantId: z.number(),
      appointmentId: z.number(),
      lineUserId: z.string().optional(),
      reason: z.string().optional(),
    }))
    .mutation(async ({ input }) => {
      // TODO: Update appointment status to cancelled
      return { success: true };
    }),

  // 修改預約時間
  rescheduleBooking: publicProcedure
    .input(z.object({
      tenantId: z.number(),
      appointmentId: z.number(),
      lineUserId: z.string().optional(),
      newDate: z.string(),
      newTime: z.string(),
    }))
    .mutation(async ({ input }) => {
      // TODO: Create reschedule request or directly update
      return { success: true };
    }),
});
