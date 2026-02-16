/**
 * E2E 測試：行銷活動
 *
 * 覆蓋場景：
 * 1. 建立行銷活動 → 設定目標受眾 → 驗證推播邏輯
 */
import { describe, it, expect, beforeAll, afterAll } from "vitest";
import {
  getSupabase,
  createTestTenant,
  cleanupTestTenant,
  uniqueId,
  futureDate,
} from "./helpers";

describe("行銷活動 E2E", () => {
  const supabase = getSupabase();
  let tenantId: number;
  let customerIds: number[] = [];

  beforeAll(async () => {
    const tenant = await createTestTenant("marketing");
    tenantId = tenant.tenantId;

    // 建立測試客戶群
    const customers = [
      { name: "VIP客戶A", phone: "0911001001", member_level: "金卡會員" },
      { name: "VIP客戶B", phone: "0911001002", member_level: "金卡會員" },
      { name: "銀卡客戶C", phone: "0911001003", member_level: "銀卡會員" },
      { name: "一般客戶D", phone: "0911001004", member_level: "一般" },
      { name: "一般客戶E", phone: "0911001005", member_level: "一般" },
    ];

    for (const c of customers) {
      const { data } = await supabase
        .from("customers")
        .insert({ tenant_id: tenantId, ...c })
        .select("id")
        .single();
      customerIds.push(data!.id);
    }

    // 為部分客戶打標籤
    await supabase.from("customer_tags").insert([
      { tenant_id: tenantId, customer_id: customerIds[0], tag_name: "高消費" },
      { tenant_id: tenantId, customer_id: customerIds[1], tag_name: "高消費" },
      { tenant_id: tenantId, customer_id: customerIds[2], tag_name: "高消費" },
      { tenant_id: tenantId, customer_id: customerIds[0], tag_name: "美容愛好者" },
      { tenant_id: tenantId, customer_id: customerIds[3], tag_name: "美容愛好者" },
    ]);
  });

  afterAll(async () => {
    await cleanupTestTenant(tenantId);
  });

  it("應能建立行銷活動", async () => {
    const campaignName = `春季促銷_${uniqueId()}`;

    const { data: campaign, error } = await supabase
      .from("marketing_campaigns")
      .insert({
        tenant_id: tenantId,
        campaign_name: campaignName,
        target_tags: ["高消費"],
        target_member_levels: ["金卡會員"],
        message_content: "親愛的貴賓，春季限定優惠等您來體驗！",
        scheduled_at: futureDate(3),
        status: "draft",
      })
      .select("*")
      .single();

    expect(error).toBeNull();
    expect(campaign).toBeDefined();
    expect(campaign!.campaign_name).toBe(campaignName);
    expect(campaign!.target_tags).toContain("高消費");
    expect(campaign!.target_member_levels).toContain("金卡會員");
    expect(campaign!.status).toBe("draft");
  });

  it("應能設定目標受眾並驗證篩選邏輯（依標籤）", async () => {
    // 建立活動，目標標籤為「高消費」
    const { data: campaign } = await supabase
      .from("marketing_campaigns")
      .insert({
        tenant_id: tenantId,
        campaign_name: `標籤篩選測試_${uniqueId()}`,
        target_tags: ["高消費"],
        target_member_levels: [],
        message_content: "高消費客戶專屬優惠",
        scheduled_at: futureDate(5),
        status: "draft",
      })
      .select("*")
      .single();

    expect(campaign).toBeDefined();

    // 模擬推播邏輯：篩選出擁有「高消費」標籤的客戶
    const { data: targetCustomerTags } = await supabase
      .from("customer_tags")
      .select("customer_id")
      .eq("tenant_id", tenantId)
      .eq("tag_name", "高消費");

    const targetCustomerIds = [
      ...new Set(targetCustomerTags!.map((t) => t.customer_id)),
    ];

    // 應有 3 位客戶擁有「高消費」標籤
    expect(targetCustomerIds.length).toBe(3);
    expect(targetCustomerIds).toContain(customerIds[0]);
    expect(targetCustomerIds).toContain(customerIds[1]);
    expect(targetCustomerIds).toContain(customerIds[2]);
  });

  it("應能設定目標受眾並驗證篩選邏輯（依會員等級）", async () => {
    // 建立活動，目標等級為「金卡會員」
    const { data: campaign } = await supabase
      .from("marketing_campaigns")
      .insert({
        tenant_id: tenantId,
        campaign_name: `等級篩選測試_${uniqueId()}`,
        target_tags: [],
        target_member_levels: ["金卡會員"],
        message_content: "金卡會員專屬活動",
        scheduled_at: futureDate(5),
        status: "draft",
      })
      .select("*")
      .single();

    // 篩選出「金卡會員」等級的客戶
    const { data: goldMembers } = await supabase
      .from("customers")
      .select("id, name, member_level")
      .eq("tenant_id", tenantId)
      .eq("member_level", "金卡會員");

    expect(goldMembers!.length).toBe(2);
  });

  it("應能組合標籤與等級進行交叉篩選", async () => {
    // 建立活動，同時設定標籤和等級
    const { data: campaign } = await supabase
      .from("marketing_campaigns")
      .insert({
        tenant_id: tenantId,
        campaign_name: `交叉篩選測試_${uniqueId()}`,
        target_tags: ["美容愛好者"],
        target_member_levels: ["金卡會員"],
        message_content: "金卡美容愛好者專屬",
        scheduled_at: futureDate(5),
        status: "draft",
      })
      .select("*")
      .single();

    // 篩選擁有「美容愛好者」標籤的客戶
    const { data: taggedCustomers } = await supabase
      .from("customer_tags")
      .select("customer_id")
      .eq("tenant_id", tenantId)
      .eq("tag_name", "美容愛好者");

    const taggedIds = taggedCustomers!.map((t) => t.customer_id);

    // 在標籤客戶中，篩選「金卡會員」
    const { data: crossFiltered } = await supabase
      .from("customers")
      .select("id, name, member_level")
      .eq("tenant_id", tenantId)
      .eq("member_level", "金卡會員")
      .in("id", taggedIds);

    // 只有 customerIds[0]（VIP客戶A）同時擁有「美容愛好者」標籤和「金卡會員」等級
    expect(crossFiltered!.length).toBe(1);
    expect(crossFiltered![0].id).toBe(customerIds[0]);
  });

  it("應能更新活動狀態為已排程", async () => {
    const { data: campaign } = await supabase
      .from("marketing_campaigns")
      .insert({
        tenant_id: tenantId,
        campaign_name: `狀態更新測試_${uniqueId()}`,
        target_tags: ["高消費"],
        target_member_levels: [],
        message_content: "測試訊息",
        scheduled_at: futureDate(1),
        status: "draft",
      })
      .select("id")
      .single();

    // 更新為已排程
    const { error } = await supabase
      .from("marketing_campaigns")
      .update({ status: "scheduled" })
      .eq("id", campaign!.id);

    expect(error).toBeNull();

    // 驗證狀態
    const { data: updated } = await supabase
      .from("marketing_campaigns")
      .select("status")
      .eq("id", campaign!.id)
      .single();

    expect(updated!.status).toBe("scheduled");
  });

  it("應能模擬發送活動並記錄發送時間", async () => {
    const { data: campaign } = await supabase
      .from("marketing_campaigns")
      .insert({
        tenant_id: tenantId,
        campaign_name: `發送測試_${uniqueId()}`,
        target_tags: [],
        target_member_levels: ["一般"],
        message_content: "一般會員促銷通知",
        scheduled_at: new Date().toISOString(),
        status: "scheduled",
      })
      .select("id")
      .single();

    // 模擬發送：更新狀態和發送時間
    const sentAt = new Date().toISOString();
    const { error } = await supabase
      .from("marketing_campaigns")
      .update({
        status: "sent",
        sent_at: sentAt,
      })
      .eq("id", campaign!.id);

    expect(error).toBeNull();

    const { data: sent } = await supabase
      .from("marketing_campaigns")
      .select("status, sent_at")
      .eq("id", campaign!.id)
      .single();

    expect(sent!.status).toBe("sent");
    expect(sent!.sent_at).toBeDefined();
  });
});
