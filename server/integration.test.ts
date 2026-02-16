import { describe, it, expect, beforeAll } from "vitest";
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.VITE_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

describe("YoCHiLLSAAS 整合測試", () => {
  let supabase: ReturnType<typeof createClient>;

  beforeAll(() => {
    supabase = createClient(supabaseUrl, supabaseServiceKey);
  });

  it("應該能夠連線到 Supabase 資料庫", async () => {
    const { data, error } = await supabase.from("tenants").select("count");
    expect(error).toBeNull();
    expect(data).toBeDefined();
  });

  it("應該能夠查詢 tenants 資料表", async () => {
    const { data, error } = await supabase
      .from("tenants")
      .select("*")
      .limit(1);
    
    expect(error).toBeNull();
    expect(Array.isArray(data)).toBe(true);
  });

  it("應該能夠查詢 appointments 資料表", async () => {
    const { data, error } = await supabase
      .from("appointments")
      .select("*")
      .limit(1);
    
    expect(error).toBeNull();
    expect(Array.isArray(data)).toBe(true);
  });

  it("應該能夠查詢 customers 資料表", async () => {
    const { data, error } = await supabase
      .from("customers")
      .select("*")
      .limit(1);
    
    expect(error).toBeNull();
    expect(Array.isArray(data)).toBe(true);
  });

  it("應該能夠查詢新增的 weight_tracking 資料表", async () => {
    const { data, error } = await supabase
      .from("weight_tracking")
      .select("*")
      .limit(1);
    
    expect(error).toBeNull();
    expect(Array.isArray(data)).toBe(true);
  });

  it("應該能夠查詢新增的 products 資料表", async () => {
    const { data, error } = await supabase
      .from("products")
      .select("*")
      .limit(1);
    
    expect(error).toBeNull();
    expect(Array.isArray(data)).toBe(true);
  });

  it("應該能夠查詢新增的 coupons 資料表", async () => {
    const { data, error } = await supabase
      .from("coupons")
      .select("*")
      .limit(1);
    
    expect(error).toBeNull();
    expect(Array.isArray(data)).toBe(true);
  });

  it("應該能夠查詢新增的 member_levels 資料表", async () => {
    const { data, error } = await supabase
      .from("member_levels")
      .select("*")
      .limit(1);
    
    expect(error).toBeNull();
    expect(Array.isArray(data)).toBe(true);
  });

  it("應該能夠查詢新增的 referrals 資料表", async () => {
    const { data, error } = await supabase
      .from("referrals")
      .select("*")
      .limit(1);
    
    expect(error).toBeNull();
    expect(Array.isArray(data)).toBe(true);
  });

  it("應該能夠查詢新增的 error_logs 資料表", async () => {
    const { data, error } = await supabase
      .from("error_logs")
      .select("*")
      .limit(1);
    
    expect(error).toBeNull();
    expect(Array.isArray(data)).toBe(true);
  });
});
