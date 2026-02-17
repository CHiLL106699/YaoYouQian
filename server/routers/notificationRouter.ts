/**
 * Notification Router (coreRouter 層)
 * 通知管理
 */
import { z } from "zod";
import { publicProcedure, router, adminProcedure } from "../_core/trpc";
import { TRPCError } from "@trpc/server";
import { supabase } from "../supabaseClient";

export const notificationRouter = router({
  list: publicProcedure
    .input(z.object({ tenantId: z.number(), status: z.string().optional(), channel: z.string().optional(), limit: z.number().min(1).max(50).default(20), offset: z.number().min(0).default(0) }))
    .query(async ({ input }) => {
      let query = supabase.from("notifications")
        .select("id, target_type, target_id, title, content, channel, status, sent_at, created_at", { count: "exact" })
        .eq("tenant_id", input.tenantId);
      if (input.status) query = query.eq("status", input.status);
      if (input.channel) query = query.eq("channel", input.channel);
      const { data, error, count } = await query.order("created_at", { ascending: false }).range(input.offset, input.offset + input.limit - 1);
      if (error) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: error.message });
      return {
        notifications: (data || []).map((n: any) => ({
          id: n.id as number, targetType: n.target_type as string, targetId: (n.target_id ?? null) as number | null,
          title: n.title as string, content: n.content as string, channel: n.channel as string,
          status: n.status as string, sentAt: (n.sent_at ?? null) as string | null, createdAt: n.created_at as string,
        })),
        total: count || 0,
      };
    }),

  create: adminProcedure
    .input(z.object({ tenantId: z.number(), targetType: z.enum(["customer", "staff", "all"]), targetId: z.number().optional(), title: z.string(), content: z.string(), channel: z.enum(["line", "sms", "email", "push"]).default("line"), scheduledAt: z.string().optional() }))
    .mutation(async ({ input }) => {
      const { data, error } = await supabase.from("notifications").insert({
        tenant_id: input.tenantId, target_type: input.targetType, target_id: input.targetId || null,
        title: input.title, content: input.content, channel: input.channel, status: "pending",
      }).select("id").single();
      if (error) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: error.message });
      return { success: true, id: data!.id as number };
    }),

  send: adminProcedure
    .input(z.object({ tenantId: z.number(), notificationId: z.number() }))
    .mutation(async ({ input }) => {
      // In production, this would trigger LINE Messaging API via Edge Function
      const { error } = await supabase.from("notifications").update({ status: "sent", sent_at: new Date().toISOString() })
        .eq("id", input.notificationId).eq("tenant_id", input.tenantId);
      if (error) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: error.message });
      return { success: true };
    }),

  delete: adminProcedure
    .input(z.object({ tenantId: z.number(), notificationId: z.number() }))
    .mutation(async ({ input }) => {
      const { error } = await supabase.from("notifications").delete()
        .eq("id", input.notificationId).eq("tenant_id", input.tenantId);
      if (error) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: error.message });
      return { success: true };
    }),
});
