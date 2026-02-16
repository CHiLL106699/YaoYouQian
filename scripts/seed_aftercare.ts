import { config } from 'dotenv';
config({ override: true });
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ 缺少環境變數 SUPABASE_URL 或 SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

const TENANT_ID = 1;

const seedData = [
  // === 雷射類 ===
  {
    tenant_id: TENANT_ID,
    category: '雷射',
    treatment_name: '皮秒雷射',
    description: '皮秒雷射術後護理須知，幫助您達到最佳淡斑效果。',
    instructions: {
      dos: [
        '術後立即冰敷 15-20 分鐘，減少紅腫',
        '使用醫師建議的修復霜，每日 2-3 次',
        '加強防曬，使用 SPF50+ 防曬乳',
        '保持肌膚濕潤，使用溫和保濕產品',
        '飲食清淡，多補充維他命 C',
      ],
      donts: [
        '術後一週內避免使用含酸類保養品',
        '避免直接日曬，外出請戴帽子或撐傘',
        '不要摳抓結痂部位，讓其自然脫落',
        '一週內避免泡溫泉、三溫暖或游泳',
        '避免飲酒及辛辣刺激性食物',
      ],
    },
    sort_order: 1,
    is_active: true,
  },
  {
    tenant_id: TENANT_ID,
    category: '雷射',
    treatment_name: '淨膚雷射',
    description: '淨膚雷射適用於改善膚色不均、毛孔粗大等問題。',
    instructions: {
      dos: [
        '術後使用溫和洗面乳清潔',
        '加強保濕，建議使用玻尿酸精華液',
        '外出務必塗抹防曬乳並定時補擦',
        '可正常上妝，但建議使用礦物質彩妝',
        '多喝水，幫助肌膚修復',
      ],
      donts: [
        '48 小時內避免使用去角質產品',
        '一週內避免使用 A 酸、果酸等刺激性產品',
        '避免長時間曝曬於陽光下',
        '不要用過熱的水洗臉',
        '避免劇烈運動導致大量出汗',
      ],
    },
    sort_order: 2,
    is_active: true,
  },
  {
    tenant_id: TENANT_ID,
    category: '雷射',
    treatment_name: '飛梭雷射',
    description: '飛梭雷射可改善痘疤、毛孔及細紋，術後需特別注意修復。',
    instructions: {
      dos: [
        '術後立即冰敷，每次 10-15 分鐘',
        '使用醫師開立的抗生素藥膏預防感染',
        '保持傷口清潔乾燥',
        '使用溫和的修復保濕產品',
        '嚴格防曬至少 3 個月',
      ],
      donts: [
        '術後 3 天內避免碰水',
        '不要撕除脫皮或結痂',
        '兩週內避免化妝',
        '避免去角質或使用磨砂產品',
        '一個月內避免泡澡、游泳',
      ],
    },
    sort_order: 3,
    is_active: true,
  },

  // === 注射類 ===
  {
    tenant_id: TENANT_ID,
    category: '注射',
    treatment_name: '玻尿酸注射',
    description: '玻尿酸注射後的護理重點，確保填充效果持久自然。',
    instructions: {
      dos: [
        '術後 6 小時內可冰敷減少腫脹',
        '保持注射部位清潔',
        '正常作息，充足睡眠有助恢復',
        '若有輕微瘀青，可使用退瘀藥膏',
        '依醫師建議時間回診追蹤',
      ],
      donts: [
        '24 小時內避免觸摸或按壓注射部位',
        '一週內避免高溫環境（三溫暖、烤箱）',
        '兩週內避免劇烈運動',
        '避免趴睡或側壓注射部位',
        '一週內避免飲酒',
      ],
    },
    sort_order: 4,
    is_active: true,
  },
  {
    tenant_id: TENANT_ID,
    category: '注射',
    treatment_name: '肉毒桿菌注射',
    description: '肉毒桿菌注射後護理須知，幫助您達到最佳除皺效果。',
    instructions: {
      dos: [
        '注射後 4 小時內保持直立姿勢',
        '可適度做表情運動，幫助藥物均勻分布',
        '正常清潔保養即可',
        '效果約 3-7 天開始顯現，請耐心等待',
        '建議 2 週後回診評估效果',
      ],
      donts: [
        '注射後 4 小時內不要躺下或低頭',
        '24 小時內避免按摩注射部位',
        '一週內避免劇烈運動',
        '避免去三溫暖或泡溫泉',
        '不要自行按壓或揉捏注射區域',
      ],
    },
    sort_order: 5,
    is_active: true,
  },
  {
    tenant_id: TENANT_ID,
    category: '注射',
    treatment_name: '水光針注射',
    description: '水光針注射後的護理指南，讓肌膚保持水潤光澤。',
    instructions: {
      dos: [
        '術後當天可冰敷減少紅腫',
        '加強保濕，使用溫和的保濕面膜',
        '多喝水，由內而外補充水分',
        '使用修復型精華液加速恢復',
        '做好防曬工作',
      ],
      donts: [
        '術後 24 小時內避免化妝',
        '3 天內避免使用含酒精的保養品',
        '一週內避免去角質',
        '避免高溫環境和劇烈運動',
        '不要觸摸或擠壓注射部位的小丘疹',
      ],
    },
    sort_order: 6,
    is_active: true,
  },

  // === 手術類 ===
  {
    tenant_id: TENANT_ID,
    category: '手術',
    treatment_name: '雙眼皮手術',
    description: '雙眼皮手術後的完整護理指南，確保傷口癒合良好。',
    instructions: {
      dos: [
        '術後 48 小時內持續冰敷，每次 15 分鐘',
        '按時服用醫師開立的消炎止痛藥',
        '保持傷口清潔，每日以生理食鹽水清潔',
        '睡覺時墊高枕頭，減少眼部腫脹',
        '依照醫囑時間拆線（通常 5-7 天）',
      ],
      donts: [
        '術後一週內避免碰水（洗臉時避開眼部）',
        '不要揉眼睛或用力眨眼',
        '兩週內避免配戴隱形眼鏡',
        '一個月內避免化眼妝',
        '避免劇烈運動和彎腰提重物',
      ],
    },
    sort_order: 7,
    is_active: true,
  },
  {
    tenant_id: TENANT_ID,
    category: '手術',
    treatment_name: '隆鼻手術',
    description: '隆鼻手術後的護理要點，幫助您順利度過恢復期。',
    instructions: {
      dos: [
        '術後 72 小時內持續冰敷鼻部周圍',
        '按時服用抗生素和止痛藥',
        '保持頭部抬高，減少腫脹',
        '使用生理食鹽水清潔鼻腔',
        '依醫囑時間回診拆線和檢查',
      ],
      donts: [
        '術後一個月內避免戴眼鏡',
        '不要擤鼻涕或用力打噴嚏',
        '避免碰撞鼻部',
        '兩週內避免劇烈運動',
        '一個月內避免趴睡',
      ],
    },
    sort_order: 8,
    is_active: true,
  },

  // === 保養類 ===
  {
    tenant_id: TENANT_ID,
    category: '保養',
    treatment_name: '化學換膚（果酸煥膚）',
    description: '果酸煥膚後的護理須知，讓肌膚煥然一新。',
    instructions: {
      dos: [
        '術後使用溫和的洗面乳清潔',
        '大量使用保濕產品，維持肌膚水分',
        '嚴格防曬，使用 SPF50+ 物理性防曬',
        '可使用含神經醯胺的修復產品',
        '多喝水，幫助肌膚代謝',
      ],
      donts: [
        '術後 3 天內避免使用任何酸類產品',
        '一週內不要去角質或使用磨砂膏',
        '避免長時間日曬',
        '不要撕除脫皮',
        '避免使用含香料或酒精的保養品',
      ],
    },
    sort_order: 9,
    is_active: true,
  },
  {
    tenant_id: TENANT_ID,
    category: '保養',
    treatment_name: '微針治療',
    description: '微針治療後的護理指南，促進膠原蛋白增生。',
    instructions: {
      dos: [
        '術後立即使用修復面膜或生長因子精華',
        '保持肌膚濕潤，頻繁補充保濕',
        '使用溫和的潔面產品',
        '做好防曬工作',
        '多攝取蛋白質和維他命 C 幫助修復',
      ],
      donts: [
        '術後 24 小時內避免化妝',
        '3 天內避免使用含酸類或美白產品',
        '一週內避免游泳或泡溫泉',
        '不要曝曬於陽光下',
        '避免飲酒和辛辣食物',
      ],
    },
    sort_order: 10,
    is_active: true,
  },
];

async function main() {
  console.log(`準備插入 ${seedData.length} 筆衛教種子資料至 tenant_id=${TENANT_ID}...`);

  // 先清除舊的種子資料（避免重複）
  const { error: deleteError } = await supabase
    .from('aftercare_contents')
    .delete()
    .eq('tenant_id', TENANT_ID);

  if (deleteError) {
    console.error('清除舊資料失敗:', deleteError.message);
    return;
  }

  const { data, error } = await supabase
    .from('aftercare_contents')
    .insert(seedData)
    .select('id, treatment_name, category');

  if (error) {
    console.error('插入失敗:', error.message);
    return;
  }

  console.log(`成功插入 ${data.length} 筆衛教種子資料：`);
  for (const item of data) {
    console.log(`  [${item.category}] ${item.treatment_name} (id: ${item.id})`);
  }
}

main();
