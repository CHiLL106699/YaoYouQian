/**
 * LINE 設定管理 Router - 多租戶 SaaS 版本
 * 管理 tenant_line_configs 表（每個租戶的 LINE Channel 設定）
 */
import { router, protectedProcedure } from "../_core/trpc";
import { z } from "zod";
import { supabase } from "../supabaseClient";

export const lineConfigRouter = router({
  /** 取得租戶的 LINE 設定 */
  get: protectedProcedure
    .input(z.object({ tenantId: z.number() }))
    .query(async ({ input }) => {
      const { data } = await supabase
        .from("tenant_line_configs")
        .select("*")
        .eq("tenant_id", input.tenantId)
        .single();
      // 脫敏：不回傳完整的 channel_secret 和 access_token
      if (data) {
        return {
          ...data,
          channel_secret: data.channel_secret ? "****" + data.channel_secret.slice(-4) : null,
          channel_access_token: data.channel_access_token ? "****" + data.channel_access_token.slice(-8) : null,
        };
      }
      return null;
    }),

  /** 更新或建立租戶的 LINE 設定 */
  upsert: protectedProcedure
    .input(z.object({
      tenantId: z.number(),
      channelId: z.string().optional(),
      channelSecret: z.string().optional(),
      channelAccessToken: z.string().optional(),
      botBasicId: z.string().optional(),
      liffId: z.string().optional(),
      bookingUrl: z.string().optional(),
      webhookActive: z.boolean().optional(),
    }))
    .mutation(async ({ input }) => {
      const updateData: any = { updated_at: new Date().toISOString() };
      if (input.channelId !== undefined) updateData.channel_id = input.channelId;
      if (input.channelSecret !== undefined) updateData.channel_secret = input.channelSecret;
      if (input.channelAccessToken !== undefined) updateData.channel_access_token = input.channelAccessToken;
      if (input.botBasicId !== undefined) updateData.bot_basic_id = input.botBasicId;
      if (input.liffId !== undefined) updateData.liff_id = input.liffId;
      if (input.bookingUrl !== undefined) updateData.booking_url = input.bookingUrl;
      if (input.webhookActive !== undefined) updateData.webhook_active = input.webhookActive;

      const { data, error } = await supabase
        .from("tenant_line_configs")
        .upsert({
          tenant_id: input.tenantId,
          ...updateData,
        }, { onConflict: "tenant_id" })
        .select()
        .single();
      if (error) throw new Error(error.message);
      // 脫敏回傳
      return {
        ...data,
        channel_secret: data.channel_secret ? "****" + data.channel_secret.slice(-4) : null,
        channel_access_token: data.channel_access_token ? "****" + data.channel_access_token.slice(-8) : null,
      };
    }),

  /** 測試 LINE Bot 連線 */
  testConnection: protectedProcedure
    .input(z.object({ tenantId: z.number() }))
    .mutation(async ({ input }) => {
      const { data: config } = await supabase
        .from("tenant_line_configs")
        .select("channel_access_token")
        .eq("tenant_id", input.tenantId)
        .single();

      const token = config?.channel_access_token || process.env.LINE_CHANNEL_ACCESS_TOKEN;
      if (!token) return { success: false, error: "未設定 LINE Channel Access Token" };

      try {
        const res = await fetch("https://api.line.me/v2/bot/info", {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (res.ok) {
          const botInfo = await res.json();
          return { success: true, botName: botInfo.displayName, botId: botInfo.userId };
        }
        return { success: false, error: `LINE API 回傳 ${res.status}` };
      } catch (err) {
        return { success: false, error: String(err) };
      }
    }),

  /** 取得 Webhook URL */
  getWebhookUrl: protectedProcedure
    .input(z.object({ tenantId: z.number() }))
    .query(async ({ input }) => {
      // Webhook URL 格式：https://{domain}/api/line/webhook/{tenantId}
      return {
        webhookUrl: `/api/line/webhook/${input.tenantId}`,
        note: "請在 LINE Developers Console 設定此 Webhook URL（需加上完整域名）",
      };
    }),
});
