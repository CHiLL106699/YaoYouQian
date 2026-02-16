/**
 * E2E 測試：租戶管理
 *
 * 覆蓋場景：
 * 1. 租戶註冊 → 登入（查詢） → 設定 → 訂閱方案
 */
import { describe, it, expect, afterAll } from "vitest";
import {
  getSupabase,
  cleanupTestTenant,
  E2E_TENANT_PREFIX,
  futureDate,
} from "./helpers";

describe("租戶管理 E2E", () => {
  const supabase = getSupabase();
  const createdTenantIds: number[] = [];

  afterAll(async () => {
    for (const id of createdTenantIds) {
      await cleanupTestTenant(id);
    }
  });

  it("應能註冊新租戶", async () => {
    const subdomain = `${E2E_TENANT_PREFIX}reg-${Date.now()}`.slice(0, 60);

    const { data: tenant, error } = await supabase
      .from("tenants")
      .insert({
        name: "E2E 註冊測試診所",
        subdomain,
        status: "trial",
        owner_email: "register-test@example.com",
        owner_name: "測試管理員",
        owner_phone: "0911000111",
      })
      .select("*")
      .single();

    expect(error).toBeNull();
    expect(tenant).toBeDefined();
    expect(tenant!.name).toBe("E2E 註冊測試診所");
    expect(tenant!.status).toBe("trial");
    expect(tenant!.owner_email).toBe("register-test@example.com");
    expect(tenant!.owner_name).toBe("測試管理員");

    createdTenantIds.push(tenant!.id);
  });

  it("應能查詢租戶資訊（模擬登入後取得）", async () => {
    const subdomain = `${E2E_TENANT_PREFIX}qry-${Date.now()}`.slice(0, 60);

    const { data: tenant } = await supabase
      .from("tenants")
      .insert({
        name: "查詢測試診所",
        subdomain,
        status: "active",
        owner_email: "query@example.com",
        owner_name: "查詢管理員",
      })
      .select("id")
      .single();

    createdTenantIds.push(tenant!.id);

    // 依 subdomain 查詢（模擬登入後取得租戶資訊）
    const { data: found, error } = await supabase
      .from("tenants")
      .select("*")
      .eq("subdomain", subdomain)
      .single();

    expect(error).toBeNull();
    expect(found!.name).toBe("查詢測試診所");
    expect(found!.subdomain).toBe(subdomain);
  });

  it("應能更新租戶設定", async () => {
    const subdomain = `${E2E_TENANT_PREFIX}set-${Date.now()}`.slice(0, 60);

    const { data: tenant } = await supabase
      .from("tenants")
      .insert({
        name: "設定測試診所",
        subdomain,
        status: "active",
      })
      .select("id")
      .single();

    createdTenantIds.push(tenant!.id);

    // 建立租戶設定
    const { data: settings, error: settingsError } = await supabase
      .from("tenant_settings")
      .insert({
        tenant_id: tenant!.id,
        primary_color: "#d4af37",
      })
      .select("*")
      .single();

    expect(settingsError).toBeNull();
    expect(settings!.primary_color).toBe("#d4af37");

    // 更新設定
    const { error: updateError } = await supabase
      .from("tenant_settings")
      .update({
        primary_color: "#8B5CF6",
        logo_url: "https://example.com/logo.png",
      })
      .eq("tenant_id", tenant!.id);

    expect(updateError).toBeNull();

    // 驗證更新
    const { data: updated } = await supabase
      .from("tenant_settings")
      .select("*")
      .eq("tenant_id", tenant!.id)
      .single();

    expect(updated!.primary_color).toBe("#8B5CF6");
    expect(updated!.logo_url).toBe("https://example.com/logo.png");
  });

  it("應能建立訂閱方案", async () => {
    const subdomain = `${E2E_TENANT_PREFIX}sub-${Date.now()}`.slice(0, 60);

    const { data: tenant } = await supabase
      .from("tenants")
      .insert({
        name: "訂閱測試診所",
        subdomain,
        status: "trial",
      })
      .select("id")
      .single();

    createdTenantIds.push(tenant!.id);

    const { data: subscription, error } = await supabase
      .from("tenant_subscriptions")
      .insert({
        tenant_id: tenant!.id,
        plan: "professional",
        status: "active",
        current_period_start: new Date().toISOString(),
        current_period_end: futureDate(30),
      })
      .select("*")
      .single();

    expect(error).toBeNull();
    expect(subscription).toBeDefined();
    expect(subscription!.plan).toBe("professional");
    expect(subscription!.status).toBe("active");
  });

  it("應能升級訂閱方案", async () => {
    const subdomain = `${E2E_TENANT_PREFIX}upg-${Date.now()}`.slice(0, 60);

    const { data: tenant } = await supabase
      .from("tenants")
      .insert({
        name: "升級測試診所",
        subdomain,
        status: "active",
      })
      .select("id")
      .single();

    createdTenantIds.push(tenant!.id);

    const { data: subscription } = await supabase
      .from("tenant_subscriptions")
      .insert({
        tenant_id: tenant!.id,
        plan: "basic",
        status: "active",
        current_period_start: new Date().toISOString(),
        current_period_end: futureDate(30),
      })
      .select("id")
      .single();

    // 升級到 enterprise
    const { error: upgradeError } = await supabase
      .from("tenant_subscriptions")
      .update({ plan: "enterprise" })
      .eq("id", subscription!.id);

    expect(upgradeError).toBeNull();

    const { data: upgraded } = await supabase
      .from("tenant_subscriptions")
      .select("plan")
      .eq("id", subscription!.id)
      .single();

    expect(upgraded!.plan).toBe("enterprise");
  });

  it("應能取消訂閱", async () => {
    const subdomain = `${E2E_TENANT_PREFIX}can-${Date.now()}`.slice(0, 60);

    const { data: tenant } = await supabase
      .from("tenants")
      .insert({
        name: "取消訂閱測試",
        subdomain,
        status: "active",
      })
      .select("id")
      .single();

    createdTenantIds.push(tenant!.id);

    const { data: subscription } = await supabase
      .from("tenant_subscriptions")
      .insert({
        tenant_id: tenant!.id,
        plan: "professional",
        status: "active",
        current_period_start: new Date().toISOString(),
        current_period_end: futureDate(30),
      })
      .select("id")
      .single();

    const { error } = await supabase
      .from("tenant_subscriptions")
      .update({ status: "cancelled" })
      .eq("id", subscription!.id);

    expect(error).toBeNull();

    const { data: cancelled } = await supabase
      .from("tenant_subscriptions")
      .select("status")
      .eq("id", subscription!.id)
      .single();

    expect(cancelled!.status).toBe("cancelled");
  });

  it("應能依 subdomain 查詢租戶", async () => {
    const subdomain = `${E2E_TENANT_PREFIX}fnd-${Date.now()}`.slice(0, 60);

    const { data: tenant } = await supabase
      .from("tenants")
      .insert({
        name: "Subdomain 查詢測試",
        subdomain,
        status: "active",
      })
      .select("id")
      .single();

    createdTenantIds.push(tenant!.id);

    const { data: found, error } = await supabase
      .from("tenants")
      .select("*")
      .eq("subdomain", subdomain)
      .single();

    expect(error).toBeNull();
    expect(found!.name).toBe("Subdomain 查詢測試");
  });

  it("應能列出所有測試租戶", async () => {
    const { data: tenants, error } = await supabase
      .from("tenants")
      .select("id, name, subdomain, status")
      .like("subdomain", `${E2E_TENANT_PREFIX}%`)
      .order("created_at", { ascending: false });

    expect(error).toBeNull();
    expect(tenants!.length).toBeGreaterThanOrEqual(1);
  });
});
