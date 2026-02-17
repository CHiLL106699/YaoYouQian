/**
 * LINE Webhook tRPC Router (coreRouter 層)
 * Note: The actual LINE webhook is handled via Express route in server/line/webhookRoute.ts
 * This router provides tRPC-based LINE webhook configuration and status endpoints.
 */
import { z } from "zod";
import { publicProcedure, router, adminProcedure } from "../_core/trpc";

export const lineWebhookTrpcRouter = router({
  getWebhookStatus: adminProcedure
    .input(z.object({ tenantId: z.number() }))
    .query(async ({ input }) => {
      // TODO: Check webhook configuration status
      return {
        configured: false,
        webhookUrl: `/api/line/webhook/${input.tenantId}`,
        lastReceived: null as string | null,
      };
    }),
});
