/**
 * E2E 測試：會員等級
 *
 * 覆蓋場景：
 * 1. 建立會員等級 → 客戶升級 → 驗證等級權益
 */
import { describe, it, expect, beforeAll, afterAll } from "vitest";
import {
  getSupabase,
  createTestTenant,
  cleanupTestTenant,
  uniqueId,
} from "./helpers";

describe("會員等級 E2E", () => {
  const supabase = getSupabase();
  let tenantId: number;

  beforeAll(async () => {
    const tenant = await createTestTenant("member-level");
    tenantId = tenant.tenantId;
  });

  afterAll(async () => {
    await cleanupTestTenant(tenantId);
  });

  it("應能建立多個會員等級", async () => {
    const levels = [
      {
        tenant_id: tenantId,
        level_name: "一般會員",
        min_points: 0,
        discount_percentage: 0,
        benefits: "基本服務",
      },
      {
        tenant_id: tenantId,
        level_name: "銀卡會員",
        min_points: 1000,
        discount_percentage: 5,
        benefits: "95 折優惠、生日禮",
      },
      {
        tenant_id: tenantId,
        level_name: "金卡會員",
        min_points: 5000,
        discount_percentage: 10,
        benefits: "9 折優惠、生日禮、專屬客服",
      },
      {
        tenant_id: tenantId,
        level_name: "鑽石會員",
        min_points: 20000,
        discount_percentage: 15,
        benefits: "85 折優惠、生日禮、專屬客服、免費停車",
      },
    ];

    const { data, error } = await supabase
      .from("member_levels")
      .insert(levels)
      .select("*");

    expect(error).toBeNull();
    expect(data!.length).toBe(4);

    // 驗證排序正確
    const sorted = data!.sort(
      (a, b) => a.min_points - b.min_points
    );
    expect(sorted[0].level_name).toBe("一般會員");
    expect(sorted[3].level_name).toBe("鑽石會員");
  });

  it("應能依積分判斷客戶所屬等級", async () => {
    // 建立客戶（積分 1500，應為 銀卡會員，基於第一個測試建立的等級）
    const { data: customer } = await supabase
      .from("customers")
      .insert({
        tenant_id: tenantId,
        name: "等級測試客戶",
        phone: "0911222333",
        points: 1500,
        member_level: "一般",
      })
      .select("id, points")
      .single();

    expect(customer).toBeDefined();

    // 查詢所有等級，依 min_points 降序排列
    const { data: levels } = await supabase
      .from("member_levels")
      .select("*")
      .eq("tenant_id", tenantId)
      .order("min_points", { ascending: false });

    // 找出客戶應屬的等級（積分 1500 >= 1000 銀卡會員）
    const customerPoints = customer!.points || 0;
    const matchedLevel = levels!.find(
      (l) => customerPoints >= l.min_points
    );

    expect(matchedLevel).toBeDefined();
    expect(matchedLevel!.level_name).toBe("銀卡會員");
  });

  it("應能將客戶升級到更高等級", async () => {
    // 建立客戶
    const { data: customer } = await supabase
      .from("customers")
      .insert({
        tenant_id: tenantId,
        name: "升級測試客戶",
        phone: "0922333444",
        member_level: "一般會員",
        points: 100,
      })
      .select("id")
      .single();

    // 模擬客戶消費累積積分
    const newPoints = 6000;
    const { error: updateError } = await supabase
      .from("customers")
      .update({
        points: newPoints,
        member_level: "金卡會員",
        updated_at: new Date().toISOString(),
      })
      .eq("id", customer!.id);

    expect(updateError).toBeNull();

    // 驗證升級結果
    const { data: upgraded } = await supabase
      .from("customers")
      .select("member_level, points")
      .eq("id", customer!.id)
      .single();

    expect(upgraded!.member_level).toBe("金卡會員");
    expect(upgraded!.points).toBe(newPoints);
  });

  it("應能驗證等級權益（折扣百分比）", async () => {
    // 建立等級
    const { data: level } = await supabase
      .from("member_levels")
      .insert({
        tenant_id: tenantId,
        level_name: "VIP_TEST",
        min_points: 10000,
        discount_percentage: 20,
        benefits: "8 折優惠、所有服務免費升級",
      })
      .select("*")
      .single();

    expect(level).toBeDefined();
    expect(Number(level!.discount_percentage)).toBe(20);

    // 模擬計算折扣金額
    const originalPrice = 1000;
    const discountRate = Number(level!.discount_percentage) / 100;
    const discountedPrice = originalPrice * (1 - discountRate);

    expect(discountedPrice).toBe(800);
  });

  it("應能更新會員等級設定", async () => {
    const { data: level } = await supabase
      .from("member_levels")
      .insert({
        tenant_id: tenantId,
        level_name: "待更新等級",
        min_points: 3000,
        discount_percentage: 8,
        benefits: "舊權益",
      })
      .select("id")
      .single();

    // 更新等級
    const { error } = await supabase
      .from("member_levels")
      .update({
        level_name: "已更新等級",
        discount_percentage: 12,
        benefits: "新權益：12 折優惠、免費配送",
      })
      .eq("id", level!.id);

    expect(error).toBeNull();

    const { data: updated } = await supabase
      .from("member_levels")
      .select("*")
      .eq("id", level!.id)
      .single();

    expect(updated!.level_name).toBe("已更新等級");
    expect(Number(updated!.discount_percentage)).toBe(12);
    expect(updated!.benefits).toContain("免費配送");
  });

  it("應能刪除會員等級", async () => {
    const { data: level } = await supabase
      .from("member_levels")
      .insert({
        tenant_id: tenantId,
        level_name: "待刪除等級",
        min_points: 99999,
        discount_percentage: 50,
        benefits: "測試用",
      })
      .select("id")
      .single();

    const { error } = await supabase
      .from("member_levels")
      .delete()
      .eq("id", level!.id);

    expect(error).toBeNull();

    const { data: deleted } = await supabase
      .from("member_levels")
      .select("id")
      .eq("id", level!.id);

    expect(deleted!.length).toBe(0);
  });
});
