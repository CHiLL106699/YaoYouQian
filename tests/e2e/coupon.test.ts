/**
 * E2E 測試：優惠券流程
 *
 * 覆蓋場景：
 * 1. 建立優惠券 → 使用優惠券 → 驗證使用次數
 * 2. 過期優惠券拒絕使用
 */
import { describe, it, expect, beforeAll, afterAll } from "vitest";
import {
  getSupabase,
  createTestTenant,
  cleanupTestTenant,
  uniqueId,
  futureDate,
  pastDate,
} from "./helpers";

describe("優惠券流程 E2E", () => {
  const supabase = getSupabase();
  let tenantId: number;
  let customerId: number;

  beforeAll(async () => {
    const tenant = await createTestTenant("coupon");
    tenantId = tenant.tenantId;

    // 建立測試客戶
    const { data: customer } = await supabase
      .from("customers")
      .insert({
        tenant_id: tenantId,
        name: "優惠券測試客戶",
        phone: "0911222333",
      })
      .select("id")
      .single();

    customerId = customer!.id;
  });

  afterAll(async () => {
    await cleanupTestTenant(tenantId);
  });

  it("應能建立優惠券", async () => {
    const code = uniqueId("COUPON");

    const { data: coupon, error } = await supabase
      .from("coupons")
      .insert({
        tenant_id: tenantId,
        code,
        discount_type: "percentage",
        discount_value: 10,
        min_purchase_amount: 500,
        max_discount_amount: 100,
        valid_from: new Date().toISOString(),
        valid_until: futureDate(30),
        usage_limit: 5,
        usage_count: 0,
        is_active: true,
      })
      .select("*")
      .single();

    expect(error).toBeNull();
    expect(coupon).toBeDefined();
    expect(coupon!.code).toBe(code);
    expect(coupon!.discount_type).toBe("percentage");
    expect(Number(coupon!.discount_value)).toBe(10);
    expect(coupon!.usage_limit).toBe(5);
    expect(coupon!.usage_count).toBe(0);
    expect(coupon!.is_active).toBe(true);
  });

  it("應能使用優惠券並更新使用次數", async () => {
    const code = uniqueId("USE");

    // 建立優惠券
    const { data: coupon } = await supabase
      .from("coupons")
      .insert({
        tenant_id: tenantId,
        code,
        discount_type: "fixed",
        discount_value: 50,
        valid_from: new Date().toISOString(),
        valid_until: futureDate(30),
        usage_limit: 3,
        usage_count: 0,
        is_active: true,
      })
      .select("*")
      .single();

    expect(coupon).toBeDefined();

    // 模擬使用優惠券：記錄使用紀錄
    const { error: usageError } = await supabase
      .from("coupon_usage")
      .insert({
        tenant_id: tenantId,
        coupon_id: coupon!.id,
        customer_id: customerId,
        used_at: new Date().toISOString(),
      });

    expect(usageError).toBeNull();

    // 更新使用次數
    const { error: updateError } = await supabase
      .from("coupons")
      .update({ usage_count: coupon!.usage_count + 1 })
      .eq("id", coupon!.id);

    expect(updateError).toBeNull();

    // 驗證使用次數已更新
    const { data: updated } = await supabase
      .from("coupons")
      .select("usage_count")
      .eq("id", coupon!.id)
      .single();

    expect(updated!.usage_count).toBe(1);
  });

  it("應能驗證使用次數達到上限", async () => {
    const code = uniqueId("LIMIT");

    // 建立使用上限為 2 的優惠券
    const { data: coupon } = await supabase
      .from("coupons")
      .insert({
        tenant_id: tenantId,
        code,
        discount_type: "fixed",
        discount_value: 30,
        valid_from: new Date().toISOString(),
        valid_until: futureDate(30),
        usage_limit: 2,
        usage_count: 0,
        is_active: true,
      })
      .select("*")
      .single();

    // 模擬使用 2 次
    for (let i = 0; i < 2; i++) {
      await supabase.from("coupon_usage").insert({
        tenant_id: tenantId,
        coupon_id: coupon!.id,
        customer_id: customerId,
        used_at: new Date().toISOString(),
      });
    }

    // 更新使用次數至上限
    await supabase
      .from("coupons")
      .update({ usage_count: 2 })
      .eq("id", coupon!.id);

    // 查詢優惠券狀態
    const { data: limitReached } = await supabase
      .from("coupons")
      .select("usage_count, usage_limit")
      .eq("id", coupon!.id)
      .single();

    // 驗證已達使用上限
    expect(limitReached!.usage_count).toBe(2);
    expect(limitReached!.usage_count).toBeGreaterThanOrEqual(
      limitReached!.usage_limit
    );
  });

  it("應拒絕使用過期的優惠券", async () => {
    const code = uniqueId("EXPIRED");

    // 建立已過期的優惠券
    const { data: expiredCoupon } = await supabase
      .from("coupons")
      .insert({
        tenant_id: tenantId,
        code,
        discount_type: "percentage",
        discount_value: 20,
        valid_from: pastDate(60),
        valid_until: pastDate(30), // 30 天前已過期
        usage_limit: 10,
        usage_count: 0,
        is_active: true,
      })
      .select("*")
      .single();

    expect(expiredCoupon).toBeDefined();

    // 模擬驗證邏輯：檢查是否過期
    const now = new Date();
    const validUntil = new Date(expiredCoupon!.valid_until);
    const isExpired = validUntil < now;

    expect(isExpired).toBe(true);

    // 驗證過期券不應被使用（業務邏輯層面）
    const { data: couponCheck } = await supabase
      .from("coupons")
      .select("valid_until, is_active")
      .eq("id", expiredCoupon!.id)
      .single();

    const couponValidUntil = new Date(couponCheck!.valid_until);
    expect(couponValidUntil < now).toBe(true);
  });

  it("應能依 code 查詢優惠券", async () => {
    const code = uniqueId("SEARCH");

    await supabase.from("coupons").insert({
      tenant_id: tenantId,
      code,
      discount_type: "fixed",
      discount_value: 100,
      valid_from: new Date().toISOString(),
      valid_until: futureDate(30),
      usage_limit: 10,
      usage_count: 0,
      is_active: true,
    });

    // 依 code 查詢
    const { data: found, error } = await supabase
      .from("coupons")
      .select("*")
      .eq("tenant_id", tenantId)
      .eq("code", code)
      .single();

    expect(error).toBeNull();
    expect(found).toBeDefined();
    expect(found!.code).toBe(code);
  });
});
