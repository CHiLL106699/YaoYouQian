import { describe, expect, it } from "vitest";

describe("LINE Messaging API Connection", () => {
  it("should have LINE_CHANNEL_ACCESS_TOKEN environment variable", () => {
    expect(process.env.LINE_CHANNEL_ACCESS_TOKEN).toBeDefined();
    expect(process.env.LINE_CHANNEL_ACCESS_TOKEN).not.toBe("");
  });

  it("should validate LINE Messaging API credentials", async () => {
    const accessToken = process.env.LINE_CHANNEL_ACCESS_TOKEN;
    
    if (!accessToken) {
      throw new Error("LINE_CHANNEL_ACCESS_TOKEN is not set");
    }

    // 測試 LINE Messaging API 連線（使用 Get Bot Info API）
    const response = await fetch("https://api.line.me/v2/bot/info", {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });

    expect(response.status).toBe(200);
    
    const data = await response.json();
    expect(data).toHaveProperty("userId");
    expect(data).toHaveProperty("basicId");
  });
});
