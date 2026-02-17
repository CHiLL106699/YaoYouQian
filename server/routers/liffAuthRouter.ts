/**
 * LIFF Auth Router (lineRouter 層 — YaoYouQian 專用)
 * LIFF 環境下的身份驗證
 */
import { z } from "zod";
import { publicProcedure, router } from "../_core/trpc";
import { TRPCError } from "@trpc/server";
import { supabase } from "../supabaseClient";

export const liffAuthRouter = router({
  verifyLiffToken: publicProcedure
    .input(z.object({ accessToken: z.string(), tenantId: z.number() }))
    .mutation(async ({ input }) => {
      try {
        // Verify LINE access token via LINE API
        const response = await fetch("https://api.line.me/oauth2/v2.1/verify", {
          method: "POST",
          headers: { "Content-Type": "application/x-www-form-urlencoded" },
          body: `access_token=${encodeURIComponent(input.accessToken)}`,
        });
        if (!response.ok) {
          return { valid: false, lineUserId: null as string | null, displayName: null as string | null };
        }
        // Get profile
        const profileRes = await fetch("https://api.line.me/v2/profile", {
          headers: { Authorization: `Bearer ${input.accessToken}` },
        });
        if (!profileRes.ok) {
          return { valid: false, lineUserId: null as string | null, displayName: null as string | null };
        }
        const profile = await profileRes.json() as { userId: string; displayName: string };
        return { valid: true, lineUserId: profile.userId, displayName: profile.displayName };
      } catch {
        return { valid: false, lineUserId: null as string | null, displayName: null as string | null };
      }
    }),

  getOrCreateCustomer: publicProcedure
    .input(z.object({ tenantId: z.number(), lineUserId: z.string(), displayName: z.string(), pictureUrl: z.string().optional() }))
    .mutation(async ({ input }) => {
      // Check if customer exists
      const { data: existing } = await supabase.from("customers").select("id, name")
        .eq("tenant_id", input.tenantId).eq("line_user_id", input.lineUserId).single();
      if (existing) {
        return { customerId: existing.id as number, isNew: false, name: existing.name as string };
      }
      // Create new customer
      const { data: newCust, error } = await supabase.from("customers").insert({
        tenant_id: input.tenantId, line_user_id: input.lineUserId,
        name: input.displayName, phone: "",
      }).select("id, name").single();
      if (error) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: error.message });
      return { customerId: newCust!.id as number, isNew: true, name: newCust!.name as string };
    }),
});
