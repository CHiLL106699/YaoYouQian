import { describe, it, expect, afterAll } from "vitest";
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.VITE_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY!;

const adminClient = createClient(supabaseUrl, supabaseServiceKey, {
  auth: { autoRefreshToken: false, persistSession: false },
});

const anonClient = createClient(supabaseUrl, supabaseAnonKey);

const TEST_EMAIL = `tenant-auth-test-${Date.now()}@example.com`;
const TEST_PASSWORD = "TestPass123!";
let testUserId: string | null = null;
let testTenantId: number | null = null;

afterAll(async () => {
  // Cleanup: delete tenant and user
  if (testTenantId) {
    await adminClient.from("tenants").delete().eq("id", testTenantId);
  }
  if (testUserId) {
    await adminClient.auth.admin.deleteUser(testUserId);
  }
});

describe("Tenant Auth Flow", () => {
  it("should create user via admin.createUser with proper identity", async () => {
    const { data, error } = await adminClient.auth.admin.createUser({
      email: TEST_EMAIL,
      password: TEST_PASSWORD,
      email_confirm: true,
      user_metadata: {
        company_name: "Test Clinic",
        contact_person: "Test User",
        subscription_plan: "basic",
      },
    });

    expect(error).toBeNull();
    expect(data.user).toBeDefined();
    expect(data.user!.email).toBe(TEST_EMAIL);
    expect(data.user!.identities).toBeDefined();
    expect(data.user!.identities!.length).toBeGreaterThan(0);
    expect(data.user!.identities![0].provider).toBe("email");

    testUserId = data.user!.id;
  });

  it("should create tenant record linked to auth user", async () => {
    expect(testUserId).toBeTruthy();

    const { data, error } = await adminClient
      .from("tenants")
      .insert({
        name: "Test Clinic",
        subdomain: `test-clinic-${Date.now()}`,
        status: "trial",
        auth_user_id: testUserId,
        owner_email: TEST_EMAIL,
        owner_name: "Test User",
      })
      .select()
      .single();

    expect(error).toBeNull();
    expect(data).toBeDefined();
    expect(data!.auth_user_id).toBe(testUserId);
    testTenantId = data!.id;
  });

  it("should login successfully with signInWithPassword", async () => {
    const { data, error } = await anonClient.auth.signInWithPassword({
      email: TEST_EMAIL,
      password: TEST_PASSWORD,
    });

    expect(error).toBeNull();
    expect(data.user).toBeDefined();
    expect(data.user!.id).toBe(testUserId);
    expect(data.session).toBeDefined();
    expect(data.session!.access_token).toBeTruthy();
  });

  it("should query tenant data after login (RLS check)", async () => {
    // Login first to get authenticated session
    const { data: loginData } = await anonClient.auth.signInWithPassword({
      email: TEST_EMAIL,
      password: TEST_PASSWORD,
    });

    expect(loginData.session).toBeDefined();

    // Create authenticated client with the session token
    const authClient = createClient(supabaseUrl, supabaseAnonKey, {
      global: {
        headers: {
          Authorization: `Bearer ${loginData.session!.access_token}`,
        },
      },
    });

    // Query tenants - should return own tenant via RLS
    const { data: tenants, error } = await authClient
      .from("tenants")
      .select("id, name")
      .eq("auth_user_id", testUserId!)
      .single();

    expect(error).toBeNull();
    expect(tenants).toBeDefined();
    expect(tenants!.id).toBe(testTenantId);
    expect(tenants!.name).toBe("Test Clinic");
  });

  it("should also find tenant by owner_email fallback", async () => {
    const { data: loginData } = await anonClient.auth.signInWithPassword({
      email: TEST_EMAIL,
      password: TEST_PASSWORD,
    });

    const authClient = createClient(supabaseUrl, supabaseAnonKey, {
      global: {
        headers: {
          Authorization: `Bearer ${loginData.session!.access_token}`,
        },
      },
    });

    const { data: tenants, error } = await authClient
      .from("tenants")
      .select("id, name")
      .eq("owner_email", TEST_EMAIL)
      .single();

    expect(error).toBeNull();
    expect(tenants).toBeDefined();
    expect(tenants!.id).toBe(testTenantId);
  });

  it("should fail login with wrong password", async () => {
    const { error } = await anonClient.auth.signInWithPassword({
      email: TEST_EMAIL,
      password: "WrongPassword123!",
    });

    expect(error).toBeDefined();
    expect(error!.message).toBe("Invalid login credentials");
  });

  it("should fail login with non-existent email", async () => {
    const { error } = await anonClient.auth.signInWithPassword({
      email: "nonexistent@example.com",
      password: TEST_PASSWORD,
    });

    expect(error).toBeDefined();
    expect(error!.message).toBe("Invalid login credentials");
  });
});
