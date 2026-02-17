/**
 * Gamification Router (coreRouter 層 — YOKAGE & YaoYouQian 共用)
 * 一番賞 (Ichiban Kuji) / 拉霸機 (Slot Machine) 遊戲化行銷
 */
import { z } from "zod";
import { publicProcedure, router, adminProcedure } from "../_core/trpc";

export const gamificationRouter = router({
  // === Campaign CRUD ===
  listCampaigns: publicProcedure
    .input(z.object({ tenantId: z.number() }))
    .query(async ({ input }) => {
      // TODO: DB query — return campaigns for tenant
      return [] as Array<{
        id: number;
        name: string;
        type: string;
        status: string;
        startDate: string | null;
        endDate: string | null;
        description: string | null;
      }>;
    }),

  getCampaign: publicProcedure
    .input(z.object({ id: z.number(), tenantId: z.number() }))
    .query(async ({ input }) => {
      // TODO: DB query — return single campaign with prizes
      return null as null | {
        id: number;
        name: string;
        type: string;
        status: string;
        description: string | null;
        startDate: string | null;
        endDate: string | null;
        maxPlaysPerUser: number;
        costPerPlay: number;
        prizes: Array<{
          id: number;
          name: string;
          probability: number;
          totalQuantity: number;
          remainingQuantity: number;
        }>;
      };
    }),

  createCampaign: adminProcedure
    .input(z.object({
      tenantId: z.number(),
      name: z.string().min(1),
      type: z.enum(["ichiban_kuji", "slot_machine"]),
      description: z.string().optional(),
      startDate: z.string().optional(),
      endDate: z.string().optional(),
      maxPlaysPerUser: z.number().min(1).default(1),
      costPerPlay: z.number().min(0).default(0),
    }))
    .mutation(async ({ input }) => {
      // TODO: DB insert
      return { success: true, id: 0 };
    }),

  updateCampaign: adminProcedure
    .input(z.object({
      id: z.number(),
      tenantId: z.number(),
      name: z.string().min(1).optional(),
      status: z.enum(["draft", "active", "ended"]).optional(),
      description: z.string().optional(),
      startDate: z.string().optional(),
      endDate: z.string().optional(),
      maxPlaysPerUser: z.number().min(1).optional(),
      costPerPlay: z.number().min(0).optional(),
    }))
    .mutation(async ({ input }) => {
      // TODO: DB update
      return { success: true };
    }),

  deleteCampaign: adminProcedure
    .input(z.object({ id: z.number(), tenantId: z.number() }))
    .mutation(async ({ input }) => {
      // TODO: DB delete
      return { success: true };
    }),

  // === Prize CRUD ===
  listPrizes: publicProcedure
    .input(z.object({ campaignId: z.number(), tenantId: z.number() }))
    .query(async ({ input }) => {
      // TODO: DB query
      return [] as Array<{
        id: number;
        name: string;
        probability: number;
        totalQuantity: number;
        remainingQuantity: number;
        prizeType: string;
        imageUrl: string | null;
      }>;
    }),

  upsertPrize: adminProcedure
    .input(z.object({
      id: z.number().optional(),
      campaignId: z.number(),
      tenantId: z.number(),
      name: z.string().min(1),
      probability: z.number().min(0).max(1),
      totalQuantity: z.number().min(0),
      remainingQuantity: z.number().min(0).optional(),
      prizeType: z.enum(["physical", "coupon", "points"]).default("physical"),
      description: z.string().optional(),
      imageUrl: z.string().optional(),
      prizeValue: z.string().optional(),
      sortOrder: z.number().optional(),
    }))
    .mutation(async ({ input }) => {
      // TODO: DB upsert
      return { success: true, id: 0 };
    }),

  deletePrize: adminProcedure
    .input(z.object({ id: z.number(), tenantId: z.number() }))
    .mutation(async ({ input }) => {
      // TODO: DB delete
      return { success: true };
    }),

  // === Play (抽獎 / 拉霸) ===
  play: publicProcedure
    .input(z.object({
      campaignId: z.number(),
      tenantId: z.number(),
      lineUserId: z.string().optional(),
      customerId: z.number().optional(),
    }))
    .mutation(async ({ input }) => {
      // TODO: Implement lottery logic
      // 1. Check campaign is active
      // 2. Check user play count < maxPlaysPerUser
      // 3. Calculate prize based on probability
      // 4. Decrement remaining quantity
      // 5. Insert play record
      return {
        isWin: false as boolean,
        prize: null as null | { id: number; name: string; prizeType: string },
      };
    }),

  // === Play History ===
  getPlayHistory: publicProcedure
    .input(z.object({
      tenantId: z.number(),
      campaignId: z.number().optional(),
      lineUserId: z.string().optional(),
      customerId: z.number().optional(),
      limit: z.number().min(1).max(100).default(20),
      offset: z.number().min(0).default(0),
    }))
    .query(async ({ input }) => {
      // TODO: DB query
      return {
        records: [] as Array<{
          id: number;
          campaignName: string;
          isWin: boolean;
          prizeName: string | null;
          playedAt: string;
        }>,
        total: 0,
      };
    }),
});
