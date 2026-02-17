/**
 * Gamification Router (coreRouter 層)
 * 一番賞 / 拉霸 遊戲化行銷
 */
import { z } from "zod";
import { publicProcedure, router, adminProcedure } from "../_core/trpc";
import { TRPCError } from "@trpc/server";
import { supabase } from "../supabaseClient";

export const gamificationRouter = router({
  // 取得活動列表
  listCampaigns: publicProcedure
    .input(z.object({ tenantId: z.number(), status: z.string().optional() }))
    .query(async ({ input }) => {
      let query = supabase.from("gamification_campaigns")
        .select("id, name, type, status, description, start_date, end_date, max_plays_per_user, cost_per_play, image_url, settings, created_at")
        .eq("tenant_id", input.tenantId);
      if (input.status) query = query.eq("status", input.status);
      const { data, error } = await query.order("created_at", { ascending: false });
      if (error) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: error.message });
      return (data || []).map((c: any) => ({
        id: c.id as number, name: c.name as string, type: c.type as string,
        status: c.status as string, description: (c.description ?? null) as string | null,
        startDate: c.start_date ? String(c.start_date) : null, endDate: c.end_date ? String(c.end_date) : null,
        maxPlaysPerUser: c.max_plays_per_user as number, costPerPlay: c.cost_per_play as number,
        imageUrl: (c.image_url ?? null) as string | null,
      }));
    }),

  // 取得活動獎品
  listPrizes: publicProcedure
    .input(z.object({ campaignId: z.number(), tenantId: z.number() }))
    .query(async ({ input }) => {
      const { data, error } = await supabase.from("gamification_prizes")
        .select("id, name, description, image_url, probability, total_quantity, remaining_quantity, prize_type, prize_value, sort_order")
        .eq("campaign_id", input.campaignId).eq("tenant_id", input.tenantId).order("sort_order");
      if (error) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: error.message });
      return (data || []).map((p: any) => ({
        id: p.id as number, name: p.name as string, description: (p.description ?? null) as string | null,
        imageUrl: (p.image_url ?? null) as string | null, probability: Number(p.probability),
        totalQuantity: p.total_quantity as number, remainingQuantity: p.remaining_quantity as number,
        prizeType: p.prize_type as string, prizeValue: (p.prize_value ?? null) as string | null,
      }));
    }),

  // 抽獎
  play: publicProcedure
    .input(z.object({ tenantId: z.number(), campaignId: z.number(), customerId: z.number().optional(), lineUserId: z.string().optional() }))
    .mutation(async ({ input }) => {
      // Check campaign is active
      const { data: campaign, error: ce } = await supabase.from("gamification_campaigns").select("*")
        .eq("id", input.campaignId).eq("tenant_id", input.tenantId).eq("status", "active").single();
      if (ce || !campaign) throw new TRPCError({ code: "NOT_FOUND", message: "活動不存在或已結束" });

      // Check play count
      if (campaign.max_plays_per_user && input.lineUserId) {
        const { count } = await supabase.from("gamification_plays").select("id", { count: "exact", head: true })
          .eq("campaign_id", input.campaignId).eq("line_user_id", input.lineUserId);
        if ((count || 0) >= campaign.max_plays_per_user) throw new TRPCError({ code: "BAD_REQUEST", message: "已達最大抽獎次數" });
      }

      // Get available prizes
      const { data: prizes } = await supabase.from("gamification_prizes").select("*")
        .eq("campaign_id", input.campaignId).eq("tenant_id", input.tenantId).gt("remaining_quantity", 0).order("sort_order");

      let wonPrize = null;
      const rand = Math.random();
      let cumulative = 0;
      for (const prize of (prizes || [])) {
        cumulative += Number(prize.probability);
        if (rand < cumulative && prize.remaining_quantity > 0) {
          wonPrize = prize;
          break;
        }
      }

      if (wonPrize) {
        // Decrement remaining quantity
        await supabase.from("gamification_prizes").update({ remaining_quantity: wonPrize.remaining_quantity - 1 }).eq("id", wonPrize.id);
        // Record play
        await supabase.from("gamification_plays").insert({
          campaign_id: input.campaignId, tenant_id: input.tenantId,
          customer_id: input.customerId || null, line_user_id: input.lineUserId || null,
          prize_id: wonPrize.id, is_win: true,
        });
        return {
          isWin: true,
          prize: { id: wonPrize.id as number, name: wonPrize.name as string, imageUrl: (wonPrize.image_url ?? null) as string | null, prizeType: wonPrize.prize_type as string },
        };
      } else {
        await supabase.from("gamification_plays").insert({
          campaign_id: input.campaignId, tenant_id: input.tenantId,
          customer_id: input.customerId || null, line_user_id: input.lineUserId || null,
          prize_id: null, is_win: false,
        });
        return { isWin: false, prize: null };
      }
    }),

  // 取得中獎紀錄
  getPlayHistory: publicProcedure
    .input(z.object({ tenantId: z.number(), campaignId: z.number().optional(), lineUserId: z.string().optional(), limit: z.number().min(1).max(50).default(20), offset: z.number().min(0).default(0) }))
    .query(async ({ input }) => {
      let query = supabase.from("gamification_plays")
        .select("id, campaign_id, customer_id, line_user_id, prize_id, is_win, played_at", { count: "exact" })
        .eq("tenant_id", input.tenantId);
      if (input.campaignId) query = query.eq("campaign_id", input.campaignId);
      if (input.lineUserId) query = query.eq("line_user_id", input.lineUserId);
      const { data, error, count } = await query.order("played_at", { ascending: false }).range(input.offset, input.offset + input.limit - 1);
      if (error) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: error.message });
      return {
        plays: (data || []).map((p: any) => ({
          id: p.id as number, campaignId: p.campaign_id as number, isWin: p.is_win as boolean,
          prizeId: (p.prize_id ?? null) as number | null, playedAt: String(p.played_at),
        })),
        total: count || 0,
      };
    }),

  // Admin: 建立活動
  createCampaign: adminProcedure
    .input(z.object({ tenantId: z.number(), name: z.string(), type: z.enum(["ichiban_kuji", "slot_machine"]), description: z.string().optional(), startDate: z.string().optional(), endDate: z.string().optional(), maxPlaysPerUser: z.number().optional(), costPerPlay: z.number().optional(), imageUrl: z.string().optional() }))
    .mutation(async ({ input }) => {
      const { data, error } = await supabase.from("gamification_campaigns").insert({
        tenant_id: input.tenantId, name: input.name, type: input.type, status: "draft",
        description: input.description || null, start_date: input.startDate || null, end_date: input.endDate || null,
        max_plays_per_user: input.maxPlaysPerUser || 1, cost_per_play: input.costPerPlay || 0, image_url: input.imageUrl || null,
      }).select("id").single();
      if (error) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: error.message });
      return { success: true, id: data!.id as number };
    }),

  updateCampaign: adminProcedure
    .input(z.object({ id: z.number(), tenantId: z.number(), name: z.string().optional(), status: z.enum(["draft", "active", "ended"]).optional(), description: z.string().optional(), startDate: z.string().optional(), endDate: z.string().optional(), maxPlaysPerUser: z.number().optional(), costPerPlay: z.number().optional(), imageUrl: z.string().optional() }))
    .mutation(async ({ input }) => {
      const updateData: Record<string, unknown> = {};
      if (input.name) updateData.name = input.name;
      if (input.status) updateData.status = input.status;
      if (input.description !== undefined) updateData.description = input.description;
      if (input.startDate !== undefined) updateData.start_date = input.startDate;
      if (input.endDate !== undefined) updateData.end_date = input.endDate;
      if (input.maxPlaysPerUser !== undefined) updateData.max_plays_per_user = input.maxPlaysPerUser;
      if (input.costPerPlay !== undefined) updateData.cost_per_play = input.costPerPlay;
      if (input.imageUrl !== undefined) updateData.image_url = input.imageUrl;
      const { error } = await supabase.from("gamification_campaigns").update(updateData)
        .eq("id", input.id).eq("tenant_id", input.tenantId);
      if (error) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: error.message });
      return { success: true };
    }),

  // Admin: 管理獎品
  createPrize: adminProcedure
    .input(z.object({ tenantId: z.number(), campaignId: z.number(), name: z.string(), description: z.string().optional(), imageUrl: z.string().optional(), probability: z.number(), totalQuantity: z.number(), prizeType: z.enum(["physical", "coupon", "points"]).default("physical"), prizeValue: z.string().optional(), sortOrder: z.number().optional() }))
    .mutation(async ({ input }) => {
      const { data, error } = await supabase.from("gamification_prizes").insert({
        campaign_id: input.campaignId, tenant_id: input.tenantId, name: input.name,
        description: input.description || null, image_url: input.imageUrl || null,
        probability: String(input.probability), total_quantity: input.totalQuantity,
        remaining_quantity: input.totalQuantity, prize_type: input.prizeType,
        prize_value: input.prizeValue || null, sort_order: input.sortOrder || 0,
      }).select("id").single();
      if (error) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: error.message });
      return { success: true, id: data!.id as number };
    }),

  // Admin: 取得活動統計
  getCampaignStats: adminProcedure
    .input(z.object({ tenantId: z.number(), campaignId: z.number() }))
    .query(async ({ input }) => {
      const { count: totalPlays } = await supabase.from("gamification_plays").select("id", { count: "exact", head: true })
        .eq("campaign_id", input.campaignId).eq("tenant_id", input.tenantId);
      const { count: totalWins } = await supabase.from("gamification_plays").select("id", { count: "exact", head: true })
        .eq("campaign_id", input.campaignId).eq("tenant_id", input.tenantId).eq("is_win", true);
      return { totalPlays: totalPlays || 0, totalWins: totalWins || 0, winRate: (totalPlays || 0) > 0 ? ((totalWins || 0) / (totalPlays || 1)) : 0 };
    }),
});
