import { describe, expect, it } from "vitest";
import { appRouter } from "./routers";

describe("appRouter", () => {
  it("should have all expected routers registered", () => {
    const procedures = Object.keys(appRouter._def.procedures);
    // Check core routers exist
    expect(procedures).toContain("auth.me");
    expect(procedures).toContain("auth.logout");
    expect(procedures).toContain("tenant.register");
    expect(procedures).toContain("tenant.getCurrent");
    expect(procedures).toContain("tenant.getDashboardStats");
  });

  it("should have shop router", () => {
    const procedures = Object.keys(appRouter._def.procedures);
    expect(procedures).toContain("shop.list");
    expect(procedures).toContain("shop.create");
  });

  it("should have customer router", () => {
    const procedures = Object.keys(appRouter._def.procedures);
    expect(procedures).toContain("customer.list");
  });

  it("should have appointment router", () => {
    const procedures = Object.keys(appRouter._def.procedures);
    expect(procedures).toContain("appointment.list");
  });

  it("should have aftercare router", () => {
    const procedures = Object.keys(appRouter._def.procedures);
    expect(procedures).toContain("aftercare.list");
  });

  it("should have orders router", () => {
    const procedures = Object.keys(appRouter._def.procedures);
    expect(procedures).toContain("orders.list");
  });

  it("should have analytics router", () => {
    const procedures = Object.keys(appRouter._def.procedures);
    expect(procedures).toContain("analytics.revenueStats");
    expect(procedures).toContain("analytics.registrationTrend");
  });

  it("should have coupon router", () => {
    const procedures = Object.keys(appRouter._def.procedures);
    expect(procedures).toContain("coupon.list");
    expect(procedures).toContain("coupon.create");
  });

  it("should have referral router", () => {
    const procedures = Object.keys(appRouter._def.procedures);
    expect(procedures).toContain("referral.list");
  });

  it("should have paymentMethod router", () => {
    const procedures = Object.keys(appRouter._def.procedures);
    expect(procedures).toContain("paymentMethod.list");
  });

  it("should have memberPromo router", () => {
    const procedures = Object.keys(appRouter._def.procedures);
    expect(procedures).toContain("memberPromo.list");
  });

  it("should have errorLog router", () => {
    const procedures = Object.keys(appRouter._def.procedures);
    expect(procedures).toContain("errorLog.list");
  });
});
