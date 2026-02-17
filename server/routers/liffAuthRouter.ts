/**
 * LIFF Auth Router (lineRouter 層 — YaoYouQian 專用)
 * LIFF 環境下的身份驗證
 */
import { z } from "zod";
import { publicProcedure, router } from "../_core/trpc";

export const liffAuthRouter = router({
  verifyLiffToken: publicProcedure
    .input(z.object({
      accessToken: z.string(),
      tenantId: z.number(),
    }))
    .mutation(async ({ input }) => {
      // TODO: Verify LINE access token via LINE API
      // POST https://api.line.me/oauth2/v2.1/verify
      return {
        valid: false,
        lineUserId: null as string | null,
        displayName: null as string | null,
      };
    }),

  getOrCreateCustomer: publicProcedure
    .input(z.object({
      tenantId: z.number(),
      lineUserId: z.string(),
      displayName: z.string(),
      pictureUrl: z.string().optional(),
    }))
    .mutation(async ({ input }) => {
      // TODO: Find or create customer by lineUserId
      return {
        customerId: 0,
        isNew: false,
        name: input.displayName,
      };
    }),
});
