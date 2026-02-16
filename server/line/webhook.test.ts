import { describe, it, expect } from "vitest";
import { verifyWebhookSignature } from "./lineService";
import { createHmac } from "crypto";

describe("LINE Webhook", () => {
  const channelSecret = "test-secret-key-12345";

  function makeSignature(body: string, secret: string): string {
    return createHmac("sha256", secret).update(body).digest("base64");
  }

  it("should verify valid signature", () => {
    const body = '{"events":[]}';
    const sig = makeSignature(body, channelSecret);
    expect(verifyWebhookSignature(body, sig, channelSecret)).toBe(true);
  });

  it("should reject invalid signature", () => {
    const body = '{"events":[]}';
    expect(verifyWebhookSignature(body, "invalid-sig", channelSecret)).toBe(false);
  });

  it("should reject tampered body", () => {
    const body = '{"events":[]}';
    const sig = makeSignature(body, channelSecret);
    const tampered = '{"events":[{"type":"hack"}]}';
    expect(verifyWebhookSignature(tampered, sig, channelSecret)).toBe(false);
  });

  it("should handle empty body", () => {
    const body = "";
    const sig = makeSignature(body, channelSecret);
    expect(verifyWebhookSignature(body, sig, channelSecret)).toBe(true);
  });

  it("should handle Japanese text in body", () => {
    const body = '{"events":[{"message":{"text":"術後護理"}}]}';
    const sig = makeSignature(body, channelSecret);
    expect(verifyWebhookSignature(body, sig, channelSecret)).toBe(true);
  });
});

describe("LINE Notification Templates", () => {
  it("should import notification module without errors", async () => {
    const mod = await import("./lineNotification");
    expect(mod.sendAftercareCard).toBeDefined();
    expect(mod.sendBookingSuccessNotification).toBeDefined();
    expect(mod.sendAppointmentReminder).toBeDefined();
    expect(mod.sendMallOrderStatusNotification).toBeDefined();
  });

  it("should have all expected notification functions", async () => {
    const mod = await import("./lineNotification");
    const expectedFunctions = [
      "sendBookingStatusNotification",
      "sendBookingSuccessNotification",
      "sendAppointmentReminder",
      "sendMallOrderStatusNotification",
      "sendRescheduleApprovedNotification",
      "sendRescheduleRejectedNotification",
      "sendApprovalNotificationToOwner",
      "sendAftercareCard",
      "sendMemberLevelUpNotification",
      "sendBirthdayCouponNotification",
      "sendCancellationNotificationToOwner",
    ];
    for (const fn of expectedFunctions) {
      expect(typeof (mod as any)[fn]).toBe("function");
    }
  });
});
