import { describe, it, expect } from "vitest";

describe("LINE Service Configuration", () => {
  it("should have LINE_CHANNEL_ACCESS_TOKEN set", () => {
    const token = process.env.LINE_CHANNEL_ACCESS_TOKEN;
    expect(token).toBeDefined();
    expect(token!.length).toBeGreaterThan(10);
  });

  it("should have LINE_CHANNEL_SECRET set", () => {
    const secret = process.env.LINE_CHANNEL_SECRET;
    expect(secret).toBeDefined();
    expect(secret!.length).toBeGreaterThan(5);
  });

  it("should have LINE_CHANNEL_ID set", () => {
    const id = process.env.LINE_CHANNEL_ID;
    expect(id).toBeDefined();
    expect(id).toBe("2009110796");
  });

  it("should have LINE_USER_ID set", () => {
    const userId = process.env.LINE_USER_ID;
    expect(userId).toBeDefined();
    expect(userId).toMatch(/^U[0-9a-f]{32}$/);
  });

  it("should have LINE_BOT_BASIC_ID set", () => {
    const botId = process.env.LINE_BOT_BASIC_ID;
    expect(botId).toBeDefined();
    expect(botId).toBe("@693ywkdq");
  });

  it("should validate LINE Channel Access Token format", async () => {
    const token = process.env.LINE_CHANNEL_ACCESS_TOKEN;
    if (!token) return;

    // Validate token by calling LINE API to get bot info
    const response = await fetch("https://api.line.me/v2/bot/info", {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    // Token should be valid (200) or at least not malformed (not 400)
    expect(response.status).not.toBe(400);
    
    if (response.ok) {
      const data = await response.json();
      expect(data).toHaveProperty("userId");
      console.log("LINE Bot Info:", JSON.stringify(data, null, 2));
    }
  });
});
