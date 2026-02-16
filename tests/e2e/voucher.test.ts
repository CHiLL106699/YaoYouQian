/**
 * E2E 測試：票券流程
 *
 * 覆蓋場景：
 * 1. 發行票券 → 核銷票券 → 統計票券使用率
 */
import { describe, it, expect, beforeAll, afterAll } from "vitest";
import {
  getSupabase,
  createTestTenant,
  cleanupTestTenant,
  uniqueId,
  futureDate,
} from "./helpers";

describe("票券流程 E2E", () => {
  const supabase = getSupabase();
  let tenantId: number;

  beforeAll(async () => {
    const tenant = await createTestTenant("voucher");
    tenantId = tenant.tenantId;
  });

  afterAll(async () => {
    await cleanupTestTenant(tenantId);
  });

  it("應能發行票券", async () => {
    const voucherCode = uniqueId("VCH");

    const { data: voucher, error } = await supabase
      .from("vouchers")
      .insert({
        tenant_id: tenantId,
        voucher_code: voucherCode,
        voucher_type: "service",
        discount_value: 500,
        valid_from: new Date().toISOString(),
        valid_until: futureDate(90),
        usage_limit: 1,
        usage_count: 0,
        is_active: true,
      })
      .select("*")
      .single();

    expect(error).toBeNull();
    expect(voucher).toBeDefined();
    expect(voucher!.voucher_code).toBe(voucherCode);
    expect(voucher!.voucher_type).toBe("service");
    expect(Number(voucher!.discount_value)).toBe(500);
    expect(voucher!.usage_count).toBe(0);
    expect(voucher!.is_active).toBe(true);
  });

  it("應能核銷票券（更新使用次數與狀態）", async () => {
    const voucherCode = uniqueId("REDEEM");

    // 發行票券
    const { data: voucher } = await supabase
      .from("vouchers")
      .insert({
        tenant_id: tenantId,
        voucher_code: voucherCode,
        voucher_type: "product",
        discount_value: 200,
        valid_from: new Date().toISOString(),
        valid_until: futureDate(60),
        usage_limit: 1,
        usage_count: 0,
        is_active: true,
      })
      .select("*")
      .single();

    expect(voucher).toBeDefined();

    // 核銷票券：更新使用次數
    const { error: redeemError } = await supabase
      .from("vouchers")
      .update({
        usage_count: 1,
        is_active: false, // 單次使用券核銷後停用
      })
      .eq("id", voucher!.id);

    expect(redeemError).toBeNull();

    // 驗證核銷結果
    const { data: redeemed } = await supabase
      .from("vouchers")
      .select("*")
      .eq("id", voucher!.id)
      .single();

    expect(redeemed!.usage_count).toBe(1);
    expect(redeemed!.is_active).toBe(false);
  });

  it("應能批量發行票券並統計使用率", async () => {
    const batchPrefix = uniqueId("BATCH");
    const totalVouchers = 5;
    const voucherIds: number[] = [];

    // 批量發行
    for (let i = 0; i < totalVouchers; i++) {
      const { data } = await supabase
        .from("vouchers")
        .insert({
          tenant_id: tenantId,
          voucher_code: `${batchPrefix}_${i}`,
          voucher_type: "service",
          discount_value: 100,
          valid_from: new Date().toISOString(),
          valid_until: futureDate(30),
          usage_limit: 1,
          usage_count: 0,
          is_active: true,
        })
        .select("id")
        .single();

      voucherIds.push(data!.id);
    }

    expect(voucherIds.length).toBe(totalVouchers);

    // 核銷其中 3 張
    const redeemCount = 3;
    for (let i = 0; i < redeemCount; i++) {
      await supabase
        .from("vouchers")
        .update({ usage_count: 1, is_active: false })
        .eq("id", voucherIds[i]);
    }

    // 統計使用率
    const { data: allVouchers } = await supabase
      .from("vouchers")
      .select("id, usage_count, is_active")
      .in("id", voucherIds);

    const usedCount = allVouchers!.filter((v) => v.usage_count > 0).length;
    const usageRate = usedCount / totalVouchers;

    expect(usedCount).toBe(redeemCount);
    expect(usageRate).toBeCloseTo(0.6, 2); // 3/5 = 60%
  });

  it("應能依 voucher_code 查詢票券", async () => {
    const code = uniqueId("FIND");

    await supabase.from("vouchers").insert({
      tenant_id: tenantId,
      voucher_code: code,
      voucher_type: "service",
      discount_value: 300,
      valid_from: new Date().toISOString(),
      valid_until: futureDate(30),
      usage_limit: 1,
      usage_count: 0,
      is_active: true,
    });

    const { data: found, error } = await supabase
      .from("vouchers")
      .select("*")
      .eq("tenant_id", tenantId)
      .eq("voucher_code", code)
      .single();

    expect(error).toBeNull();
    expect(found).toBeDefined();
    expect(found!.voucher_code).toBe(code);
  });

  it("應能區分不同類型的票券", async () => {
    const serviceCode = uniqueId("SVC");
    const productCode = uniqueId("PRD");

    await supabase.from("vouchers").insert([
      {
        tenant_id: tenantId,
        voucher_code: serviceCode,
        voucher_type: "service",
        discount_value: 500,
        valid_from: new Date().toISOString(),
        valid_until: futureDate(30),
        usage_limit: 1,
        usage_count: 0,
        is_active: true,
      },
      {
        tenant_id: tenantId,
        voucher_code: productCode,
        voucher_type: "product",
        discount_value: 200,
        valid_from: new Date().toISOString(),
        valid_until: futureDate(30),
        usage_limit: 1,
        usage_count: 0,
        is_active: true,
      },
    ]);

    // 依類型篩選
    const { data: serviceVouchers } = await supabase
      .from("vouchers")
      .select("*")
      .eq("tenant_id", tenantId)
      .eq("voucher_type", "service")
      .in("voucher_code", [serviceCode, productCode]);

    const { data: productVouchers } = await supabase
      .from("vouchers")
      .select("*")
      .eq("tenant_id", tenantId)
      .eq("voucher_type", "product")
      .in("voucher_code", [serviceCode, productCode]);

    expect(serviceVouchers!.length).toBe(1);
    expect(serviceVouchers![0].voucher_code).toBe(serviceCode);
    expect(productVouchers!.length).toBe(1);
    expect(productVouchers![0].voucher_code).toBe(productCode);
  });
});
