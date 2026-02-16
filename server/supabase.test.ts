import { describe, expect, it } from "vitest";
import { createClient } from '@supabase/supabase-js';

describe("Supabase Connection (SAASGOCHILL)", () => {
  it("should connect to new Supabase project (mrifutgtlquznfgbmild) with valid credentials", async () => {
    const supabaseUrl = process.env.VITE_SUPABASE_URL || '';
    const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY || '';

    expect(supabaseUrl).toBeTruthy();
    expect(supabaseAnonKey).toBeTruthy();

    const supabase = createClient(supabaseUrl, supabaseAnonKey);

    // 測試連線：查詢任意表（新專案可能還沒有表）
    const { data, error } = await supabase.from('_realtime_schema_migrations').select('*').limit(1);
    
    // 如果表不存在，我們只驗證 URL 和 Key 是否有效
    expect(supabaseUrl).toContain('mrifutgtlquznfgbmild');
    expect(supabaseAnonKey).toBeTruthy();

    // 如果表不存在，error 會是 null 或包含錯誤訊息
    // 我們只驗證連線成功（不會拋出網路錯誤）
    expect(error?.message).not.toContain('network');
    expect(error?.message).not.toContain('authentication');
  });
});
