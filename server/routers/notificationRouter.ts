/**
 * Notification Router (coreRouter 層)
 * 通知管理
 */
import { z } from "zod";
import { publicProcedure, router, adminProcedure } from "../_core/trpc";

export const notificationRouter = router({
  list: publicProcedure
    .input(z.object({
      tenantId: z.number(),
      targetType: z.enum(["customer", "staff", "all"]).optional(),
      status: z.enum(["pending", "sent", "failed"]).optional(),
      limit: z.number().min(1).max(100).default(20),
      offset: z.number().min(0).default(0),
    }))
    .query(async ({ input }) => {
      // TODO: DB query
      return {
        notifications: [] as Array<{
          id: number;
          title: string;
          content: string;
          targetType: string;
          channel: string;
          status: string;
          sentAt: string | null;
          createdAt: string;
        }>,
        total: 0,
      };
    }),

  create: adminProcedure
    .input(z.object({
      tenantId: z.number(),
      targetType: z.enum(["customer", "staff", "all"]),
      targetId: z.number().optional(),
      title: z.string().min(1),
      content: z.string().min(1),
      channel: z.enum(["line", "sms", "email", "push"]).default("line"),
    }))
    .mutation(async ({ input }) => {
      // TODO: DB insert + trigger send
      return { success: true, id: 0 };
    }),

  send: adminProcedure
    .input(z.object({ id: z.number(), tenantId: z.number() }))
    .mutation(async ({ input }) => {
      // TODO: Send notification via channel
      return { success: true };
    }),

  delete: adminProcedure
    .input(z.object({ id: z.number(), tenantId: z.number() }))
    .mutation(async ({ input }) => {
      // TODO: DB delete
      return { success: true };
    }),
});
