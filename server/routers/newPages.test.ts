import { describe, it, expect, vi } from "vitest";

// Test that all new router modules export correctly
describe("New Router Modules", () => {
  it("doseCalculationRouter exports a valid router", async () => {
    const mod = await import("./doseCalculationRouter");
    expect(mod.doseCalculationRouter).toBeDefined();
    expect(mod.doseCalculationRouter._def).toBeDefined();
  });

  it("approvalRouter exports a valid router", async () => {
    const mod = await import("./approvalRouter");
    expect(mod.approvalRouter).toBeDefined();
    expect(mod.approvalRouter._def).toBeDefined();
  });

  it("rescheduleApprovalRouter exports a valid router", async () => {
    const mod = await import("./rescheduleApprovalRouter");
    expect(mod.rescheduleApprovalRouter).toBeDefined();
    expect(mod.rescheduleApprovalRouter._def).toBeDefined();
  });

  it("slotLimitsRouter exports a valid router", async () => {
    const mod = await import("./slotLimitsRouter");
    expect(mod.slotLimitsRouter).toBeDefined();
    expect(mod.slotLimitsRouter._def).toBeDefined();
  });

  it("analyticsRouter exports a valid router", async () => {
    const mod = await import("./analyticsRouter");
    expect(mod.analyticsRouter).toBeDefined();
    expect(mod.analyticsRouter._def).toBeDefined();
  });

  it("serviceRouter exports a valid router", async () => {
    const mod = await import("./serviceRouter");
    expect(mod.serviceRouter).toBeDefined();
    expect(mod.serviceRouter._def).toBeDefined();
  });

  it("lineBindingRouter exports a valid router", async () => {
    const mod = await import("./lineBindingRouter");
    expect(mod.lineBindingRouter).toBeDefined();
    expect(mod.lineBindingRouter._def).toBeDefined();
  });
});

// Test that all routers have expected procedures
describe("Router Procedure Existence", () => {
  it("doseCalculationRouter has calculate, save, getHistory", async () => {
    const mod = await import("./doseCalculationRouter");
    const procedures = Object.keys(mod.doseCalculationRouter._def.procedures);
    expect(procedures).toContain("calculate");
    expect(procedures).toContain("save");
    expect(procedures).toContain("getHistory");
  });

  it("approvalRouter has listPending, approve, reject", async () => {
    const mod = await import("./approvalRouter");
    const procedures = Object.keys(mod.approvalRouter._def.procedures);
    expect(procedures).toContain("listPending");
    expect(procedures).toContain("approve");
    expect(procedures).toContain("reject");
  });

  it("rescheduleApprovalRouter has listPending, approve, reject", async () => {
    const mod = await import("./rescheduleApprovalRouter");
    const procedures = Object.keys(mod.rescheduleApprovalRouter._def.procedures);
    expect(procedures).toContain("listPending");
    expect(procedures).toContain("approve");
    expect(procedures).toContain("reject");
  });

  it("slotLimitsRouter has getByDate, set, delete", async () => {
    const mod = await import("./slotLimitsRouter");
    const procedures = Object.keys(mod.slotLimitsRouter._def.procedures);
    expect(procedures).toContain("getByDate");
    expect(procedures).toContain("set");
    expect(procedures).toContain("delete");
  });

  it("analyticsRouter has registrationTrend, sourceStatistics, revenueStats", async () => {
    const mod = await import("./analyticsRouter");
    const procedures = Object.keys(mod.analyticsRouter._def.procedures);
    expect(procedures).toContain("registrationTrend");
    expect(procedures).toContain("sourceStatistics");
    expect(procedures).toContain("revenueStats");
  });
});
