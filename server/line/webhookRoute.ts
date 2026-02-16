/**
 * LINE Webhook Express 路由 - 多租戶 SaaS 版本
 * 
 * 路由格式：POST /api/line/webhook/:tenantId
 * 每個租戶有獨立的 Webhook URL，方便各診所設定自己的 LINE Bot
 * 
 * 也支援通用路由：POST /api/line/webhook（使用系統預設租戶）
 */
import { Router, Request, Response } from "express";
import { processWebhookRequest } from "./lineWebhook";

const lineWebhookRouter = Router();

/**
 * 多租戶 Webhook 端點
 * LINE Developers Console 設定：
 *   https://{domain}/api/line/webhook/{tenantId}
 */
lineWebhookRouter.post("/webhook/:tenantId", async (req: Request, res: Response) => {
  try {
    const tenantId = parseInt(req.params.tenantId, 10);
    if (isNaN(tenantId)) {
      res.status(400).json({ error: "Invalid tenantId" });
      return;
    }

    const signature = req.headers["x-line-signature"] as string;
    if (!signature) {
      res.status(401).json({ error: "Missing X-Line-Signature" });
      return;
    }

    // LINE Webhook 需要 raw body 來驗證簽名
    const rawBody = (req as any).rawBody || (typeof req.body === "string" ? req.body : JSON.stringify(req.body));

    const result = await processWebhookRequest(tenantId, rawBody, signature);

    if (result.success) {
      res.status(200).json({ status: "ok" });
    } else {
      console.error(`[Webhook] Failed for tenant ${tenantId}:`, result.error);
      res.status(403).json({ error: result.error });
    }
  } catch (err) {
    console.error("[Webhook] Unexpected error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

/**
 * 通用 Webhook 端點（使用系統預設租戶 ID = 1）
 * 用於 SAASGOCHILL 主 Bot
 */
lineWebhookRouter.post("/webhook", async (req: Request, res: Response) => {
  try {
    const signature = req.headers["x-line-signature"] as string;
    if (!signature) {
      res.status(401).json({ error: "Missing X-Line-Signature" });
      return;
    }

    const rawBody = (req as any).rawBody || (typeof req.body === "string" ? req.body : JSON.stringify(req.body));
    // 預設使用租戶 ID = 1（系統管理員租戶）
    const result = await processWebhookRequest(1, rawBody, signature);

    if (result.success) {
      res.status(200).json({ status: "ok" });
    } else {
      res.status(403).json({ error: result.error });
    }
  } catch (err) {
    console.error("[Webhook] Unexpected error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

/**
 * Webhook 健康檢查端點
 */
lineWebhookRouter.get("/webhook/health", (_req: Request, res: Response) => {
  res.status(200).json({
    status: "ok",
    service: "LINE Webhook - YoCHiLLSAAS",
    timestamp: new Date().toISOString(),
  });
});

export { lineWebhookRouter };
