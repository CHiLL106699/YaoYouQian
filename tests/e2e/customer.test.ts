/**
 * E2E 測試：客戶管理
 *
 * 覆蓋場景：
 * 1. 建立客戶 → 更新客戶資料 → 打標籤 → 依標籤篩選
 */
import { describe, it, expect, beforeAll, afterAll } from "vitest";
import {
  getSupabase,
  createTestTenant,
  cleanupTestTenant,
  uniqueId,
} from "./helpers";

describe("客戶管理 E2E", () => {
  const supabase = getSupabase();
  let tenantId: number;

  beforeAll(async () => {
    const tenant = await createTestTenant("customer");
    tenantId = tenant.tenantId;
  });

  afterAll(async () => {
    await cleanupTestTenant(tenantId);
  });

  it("應能建立客戶", async () => {
    const name = `測試客戶_${uniqueId()}`;

    const { data: customer, error } = await supabase
      .from("customers")
      .insert({
        tenant_id: tenantId,
        name,
        phone: "0912111222",
        email: "customer-test@example.com",
        member_level: "一般",
      })
      .select("*")
      .single();

    expect(error).toBeNull();
    expect(customer).toBeDefined();
    expect(customer!.name).toBe(name);
    expect(customer!.phone).toBe("0912111222");
    expect(customer!.member_level).toBe("一般");
  });

  it("應能更新客戶資料", async () => {
    // 建立客戶
    const { data: customer } = await supabase
      .from("customers")
      .insert({
        tenant_id: tenantId,
        name: "待更新客戶",
        phone: "0933444555",
      })
      .select("id")
      .single();

    expect(customer).toBeDefined();

    // 更新客戶資料
    const { error: updateError } = await supabase
      .from("customers")
      .update({
        name: "已更新客戶",
        email: "updated@example.com",
        phone: "0966777888",
        updated_at: new Date().toISOString(),
      })
      .eq("id", customer!.id)
      .eq("tenant_id", tenantId);

    expect(updateError).toBeNull();

    // 驗證更新結果
    const { data: updated } = await supabase
      .from("customers")
      .select("*")
      .eq("id", customer!.id)
      .single();

    expect(updated!.name).toBe("已更新客戶");
    expect(updated!.email).toBe("updated@example.com");
    expect(updated!.phone).toBe("0966777888");
  });

  it("應能為客戶打標籤", async () => {
    // 建立客戶
    const { data: customer } = await supabase
      .from("customers")
      .insert({
        tenant_id: tenantId,
        name: "標籤測試客戶",
        phone: "0911333444",
      })
      .select("id")
      .single();

    // 打標籤
    const tags = ["VIP", "常客", "敏感肌"];
    for (const tag of tags) {
      const { error } = await supabase.from("customer_tags").insert({
        tenant_id: tenantId,
        customer_id: customer!.id,
        tag_name: tag,
      });
      expect(error).toBeNull();
    }

    // 查詢客戶的標籤
    const { data: customerTags, error } = await supabase
      .from("customer_tags")
      .select("tag_name")
      .eq("tenant_id", tenantId)
      .eq("customer_id", customer!.id);

    expect(error).toBeNull();
    expect(customerTags!.length).toBe(3);

    const tagNames = customerTags!.map((t) => t.tag_name);
    expect(tagNames).toContain("VIP");
    expect(tagNames).toContain("常客");
    expect(tagNames).toContain("敏感肌");
  });

  it("應能依標籤篩選客戶", async () => {
    // 建立多個客戶
    const customers: number[] = [];
    for (let i = 0; i < 3; i++) {
      const { data } = await supabase
        .from("customers")
        .insert({
          tenant_id: tenantId,
          name: `篩選客戶_${i}`,
          phone: `091${i}000111`,
        })
        .select("id")
        .single();
      customers.push(data!.id);
    }

    // 為前 2 個客戶打上「高消費」標籤
    for (let i = 0; i < 2; i++) {
      await supabase.from("customer_tags").insert({
        tenant_id: tenantId,
        customer_id: customers[i],
        tag_name: "高消費",
      });
    }

    // 為第 3 個客戶打上「新客」標籤
    await supabase.from("customer_tags").insert({
      tenant_id: tenantId,
      customer_id: customers[2],
      tag_name: "新客",
    });

    // 依「高消費」標籤篩選
    const { data: highSpenders } = await supabase
      .from("customer_tags")
      .select("customer_id")
      .eq("tenant_id", tenantId)
      .eq("tag_name", "高消費");

    expect(highSpenders!.length).toBe(2);
    const highSpenderIds = highSpenders!.map((t) => t.customer_id);
    expect(highSpenderIds).toContain(customers[0]);
    expect(highSpenderIds).toContain(customers[1]);
    expect(highSpenderIds).not.toContain(customers[2]);
  });

  it("應能刪除客戶標籤", async () => {
    // 建立客戶
    const { data: customer } = await supabase
      .from("customers")
      .insert({
        tenant_id: tenantId,
        name: "刪除標籤測試",
        phone: "0977888999",
      })
      .select("id")
      .single();

    // 打標籤
    await supabase.from("customer_tags").insert({
      tenant_id: tenantId,
      customer_id: customer!.id,
      tag_name: "待刪除",
    });

    // 刪除標籤
    const { error: deleteError } = await supabase
      .from("customer_tags")
      .delete()
      .eq("tenant_id", tenantId)
      .eq("customer_id", customer!.id)
      .eq("tag_name", "待刪除");

    expect(deleteError).toBeNull();

    // 驗證已刪除
    const { data: remaining } = await supabase
      .from("customer_tags")
      .select("*")
      .eq("tenant_id", tenantId)
      .eq("customer_id", customer!.id)
      .eq("tag_name", "待刪除");

    expect(remaining!.length).toBe(0);
  });

  it("應能搜尋客戶（依姓名或電話）", async () => {
    const uniqueName = `搜尋專用_${uniqueId()}`;

    await supabase.from("customers").insert({
      tenant_id: tenantId,
      name: uniqueName,
      phone: "0988776655",
    });

    // 依姓名搜尋
    const { data: byName } = await supabase
      .from("customers")
      .select("*")
      .eq("tenant_id", tenantId)
      .ilike("name", `%${uniqueName}%`);

    expect(byName!.length).toBeGreaterThanOrEqual(1);
    expect(byName![0].name).toBe(uniqueName);

    // 依電話搜尋
    const { data: byPhone } = await supabase
      .from("customers")
      .select("*")
      .eq("tenant_id", tenantId)
      .eq("phone", "0988776655");

    expect(byPhone!.length).toBeGreaterThanOrEqual(1);
  });
});
