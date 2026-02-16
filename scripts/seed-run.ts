/**
 * YaoYouQian 曜友仟管理雲 — 種子資料執行器
 * ============================================
 * 使用方式：pnpm seed
 * 
 * 此腳本會從環境變數讀取 Supabase 連線資訊，
 * 並將 seed.ts 中定義的標準化資料寫入對應的資料表。
 * 
 * 安全機制：
 * - 使用 upsert 避免重複寫入
 * - 對 services 表先清除舊的測試資料再寫入
 * - 所有操作使用 service_role_key（僅限伺服器端執行）
 */

import { config } from 'dotenv';
config({ override: true });
import { createClient } from '@supabase/supabase-js';
import {
  aftercareContents,
  serviceItems,
  memberLevels,
  timeSlotTemplates,
  vouchers,
} from './seed';

// --- 從環境變數讀取連線資訊（不硬編碼） ---
const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ 缺少環境變數 SUPABASE_URL 或 SUPABASE_SERVICE_ROLE_KEY');
  console.error('   請確認 .env 檔案已正確設定。');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: { autoRefreshToken: false, persistSession: false },
});

// --- 顏色輸出 ---
const green = (s: string) => `\x1b[32m${s}\x1b[0m`;
const red = (s: string) => `\x1b[31m${s}\x1b[0m`;
const yellow = (s: string) => `\x1b[33m${s}\x1b[0m`;

async function seedTable(tableName: string, data: Record<string, unknown>[], options?: { clearFirst?: boolean }) {
  console.log(`\n${yellow(`[${tableName}]`)} 開始寫入 ${data.length} 筆資料...`);

  if (options?.clearFirst) {
    console.log(`  ⚠️  先清除 tenant_id=1 的舊資料...`);
    const { error: deleteError } = await supabase
      .from(tableName)
      .delete()
      .eq('tenant_id', 1);
    if (deleteError) {
      console.error(`  ${red('❌')} 清除失敗: ${deleteError.message}`);
      return false;
    }
    console.log(`  ✅ 舊資料已清除`);
  }

  const { data: result, error } = await supabase
    .from(tableName)
    .upsert(data, { onConflict: 'id', ignoreDuplicates: false })
    .select();

  if (error) {
    // 如果 upsert 因為沒有 id 欄位衝突而失敗，改用 insert
    console.log(`  ⚠️  upsert 失敗，嘗試 insert...`);
    const { data: insertResult, error: insertError } = await supabase
      .from(tableName)
      .insert(data)
      .select();

    if (insertError) {
      console.error(`  ${red('❌')} 寫入失敗: ${insertError.message}`);
      return false;
    }
    console.log(`  ${green('✅')} 成功寫入 ${insertResult?.length ?? 0} 筆`);
    return true;
  }

  console.log(`  ${green('✅')} 成功寫入 ${result?.length ?? 0} 筆`);
  return true;
}

async function main() {
  console.log('============================================');
  console.log(' YaoYouQian 曜友仟管理雲 — 種子資料寫入');
  console.log('============================================');
  console.log(`目標: ${supabaseUrl}`);

  let allSuccess = true;

  // 1. aftercare_contents — 清除舊資料再寫入
  const ok1 = await seedTable('aftercare_contents', aftercareContents, { clearFirst: true });
  allSuccess = allSuccess && ok1;

  // 2. services — 清除舊的測試資料再寫入標準化資料
  const ok2 = await seedTable('services', serviceItems, { clearFirst: true });
  allSuccess = allSuccess && ok2;

  // 3. member_levels — 清除舊資料再寫入
  const ok3 = await seedTable('member_levels', memberLevels, { clearFirst: true });
  allSuccess = allSuccess && ok3;

  // 4. time_slot_templates — 清除舊資料再寫入
  const ok4 = await seedTable('time_slot_templates', timeSlotTemplates, { clearFirst: true });
  allSuccess = allSuccess && ok4;

  // 5. vouchers — 清除舊資料再寫入
  const ok5 = await seedTable('vouchers', vouchers, { clearFirst: true });
  allSuccess = allSuccess && ok5;

  console.log('\n============================================');
  if (allSuccess) {
    console.log(green(' ✅ 所有種子資料寫入完成！'));
  } else {
    console.log(red(' ❌ 部分資料寫入失敗，請檢查上方錯誤訊息。'));
    process.exit(1);
  }
  console.log('============================================');
}

main().catch((err) => {
  console.error(red('❌ 執行失敗:'), err);
  process.exit(1);
});
