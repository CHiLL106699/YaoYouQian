/**
 * YaoYouQian 曜友仟管理雲 — 標準化種子資料
 * ============================================
 * 此檔案僅定義資料結構，不包含任何執行邏輯或敏感資訊。
 * 執行入口請參見 seed-run.ts
 */

const TENANT_ID = 1;

// ============================================
// 1. 術後護理衛教內容 (aftercare_contents)
//    按療程分類：雷射、注射、手術、保養
// ============================================

export const aftercareContents = [
  // === 雷射類 (3 筆) ===
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
    description: '飛梭雷射適用於痘疤、毛孔及膚質改善。',
    instructions: {
      dos: [
        '術後持續冰敷，每次 10-15 分鐘',
        '使用醫師開立的抗生素藥膏預防感染',
        '保持傷口清潔乾燥',
        '使用溫和的保濕產品修復肌膚屏障',
        '嚴格防曬至少 3 個月',
      ],
      donts: [
        '術後 3 天內避免碰水',
        '不要撕除脫皮部位，讓其自然脫落',
        '兩週內避免使用含酒精的保養品',
        '避免高溫環境（三溫暖、烤箱）',
        '一個月內避免其他雷射或換膚療程',
      ],
    },
    sort_order: 3,
    is_active: true,
  },

  // === 注射類 (3 筆) ===
  {
    tenant_id: TENANT_ID,
    category: '注射',
    treatment_name: '玻尿酸注射',
    description: '玻尿酸注射後的護理要點，確保填充效果持久。',
    instructions: {
      dos: [
        '術後 6 小時內可適度冰敷減少腫脹',
        '保持注射部位清潔',
        '輕柔洗臉，避免大力按壓注射區域',
        '正常飲食，多補充水分',
        '若有輕微瘀青屬正常現象，約 3-5 天消退',
      ],
      donts: [
        '24 小時內避免劇烈運動',
        '一週內避免高溫環境（三溫暖、溫泉）',
        '不要按摩或擠壓注射部位',
        '兩週內避免牙科治療',
        '避免飲酒以減少瘀青風險',
      ],
    },
    sort_order: 4,
    is_active: true,
  },
  {
    tenant_id: TENANT_ID,
    category: '注射',
    treatment_name: '肉毒桿菌注射',
    description: '肉毒桿菌注射後護理須知，幫助您維持最佳除皺效果。',
    instructions: {
      dos: [
        '注射後 4 小時內保持直立姿勢',
        '可在注射部位輕輕做表情運動，幫助藥物分布',
        '正常清潔保養即可',
        '效果約 3-7 天逐漸顯現',
        '建議 3-6 個月後回診評估是否需要補打',
      ],
      donts: [
        '注射後 4 小時內不要躺下或低頭',
        '24 小時內避免按摩注射部位',
        '一週內避免劇烈運動',
        '避免飲酒',
        '不要自行在注射部位熱敷',
      ],
    },
    sort_order: 5,
    is_active: true,
  },
  {
    tenant_id: TENANT_ID,
    category: '注射',
    treatment_name: '水光針注射',
    description: '水光針注射後護理須知，讓肌膚保持水潤光澤。',
    instructions: {
      dos: [
        '術後可適度冰敷緩解紅腫',
        '加強保濕，建議使用醫療級保濕面膜',
        '多喝水，由內而外補充水分',
        '使用溫和的潔面產品',
        '注射後 2-3 天紅點消退後可正常上妝',
      ],
      donts: [
        '術後 24 小時內避免碰水',
        '一週內避免使用含酸類或刺激性保養品',
        '避免高溫環境',
        '不要用手觸摸注射部位',
        '一週內避免游泳或泡澡',
      ],
    },
    sort_order: 6,
    is_active: true,
  },

  // === 手術類 (3 筆) ===
  {
    tenant_id: TENANT_ID,
    category: '手術',
    treatment_name: '雙眼皮手術',
    description: '雙眼皮手術後護理須知，幫助傷口快速恢復。',
    instructions: {
      dos: [
        '術後 48 小時內持續冰敷，每次 15 分鐘',
        '按時服用醫師開立的消炎藥與止痛藥',
        '保持傷口清潔，每日以生理食鹽水清潔',
        '睡覺時墊高枕頭，減少眼部腫脹',
        '按照醫囑時間回診拆線（約 5-7 天）',
      ],
      donts: [
        '術後一週內避免用力揉眼睛',
        '兩週內避免配戴隱形眼鏡',
        '一個月內避免化眼妝',
        '避免劇烈運動或彎腰低頭',
        '不要自行拆除紗布或縫線',
      ],
    },
    sort_order: 7,
    is_active: true,
  },
  {
    tenant_id: TENANT_ID,
    category: '手術',
    treatment_name: '隆鼻手術',
    description: '隆鼻手術後護理須知，確保術後恢復順利。',
    instructions: {
      dos: [
        '術後依醫囑冰敷鼻部周圍（避開傷口）',
        '按時服用抗生素與止痛藥',
        '保持頭部抬高，減少腫脹',
        '用棉花棒沾生理食鹽水清潔鼻孔',
        '飲食以流質或軟質食物為主',
      ],
      donts: [
        '術後一個月內避免戴眼鏡',
        '不要用力擤鼻涕或打噴嚏時捏鼻子',
        '避免碰撞鼻部',
        '兩週內避免劇烈運動',
        '一個月內避免趴睡',
      ],
    },
    sort_order: 8,
    is_active: true,
  },
  {
    tenant_id: TENANT_ID,
    category: '手術',
    treatment_name: '拉皮手術',
    description: '拉皮手術後護理須知，幫助您安全度過恢復期。',
    instructions: {
      dos: [
        '術後依醫囑穿戴彈性繃帶或頭套',
        '按時服用醫師開立的藥物',
        '保持傷口乾燥清潔',
        '充分休息，避免過度活動',
        '按照醫囑時間回診追蹤',
      ],
      donts: [
        '術後兩週內避免劇烈運動',
        '一個月內避免染燙頭髮',
        '不要自行拆除繃帶或引流管',
        '避免吸菸，影響傷口癒合',
        '避免長時間低頭或彎腰',
      ],
    },
    sort_order: 9,
    is_active: true,
  },

  // === 保養類 (3 筆) ===
  {
    tenant_id: TENANT_ID,
    category: '保養',
    treatment_name: '化學換膚（果酸煥膚）',
    description: '果酸煥膚後護理須知，幫助肌膚安全代謝更新。',
    instructions: {
      dos: [
        '術後使用溫和的保濕產品',
        '嚴格防曬，使用 SPF50+ 防曬乳',
        '多喝水保持肌膚水分',
        '使用醫師建議的修復產品',
        '若有輕微脫皮屬正常現象',
      ],
      donts: [
        '術後 3 天內避免使用含酸類產品',
        '不要撕除脫皮部位',
        '避免直接日曬',
        '一週內避免去角質',
        '避免使用含酒精或香料的保養品',
      ],
    },
    sort_order: 10,
    is_active: true,
  },
  {
    tenant_id: TENANT_ID,
    category: '保養',
    treatment_name: '微針治療',
    description: '微針治療後護理須知，促進膠原蛋白增生。',
    instructions: {
      dos: [
        '術後使用醫療級保濕精華液',
        '保持肌膚清潔與濕潤',
        '使用溫和的潔面產品',
        '加強防曬保護',
        '多補充蛋白質與維他命 C 幫助修復',
      ],
      donts: [
        '術後 24 小時內避免上妝',
        '3 天內避免使用含酸類或美白產品',
        '避免直接日曬',
        '不要用手觸摸治療部位',
        '一週內避免游泳或泡澡',
      ],
    },
    sort_order: 11,
    is_active: true,
  },
  {
    tenant_id: TENANT_ID,
    category: '保養',
    treatment_name: '導入療程（離子導入/超聲波導入）',
    description: '導入療程後護理須知，讓精華成分深層吸收。',
    instructions: {
      dos: [
        '療程後持續使用保濕產品鎖住水分',
        '可搭配醫師建議的居家保養品',
        '正常飲食，多喝水',
        '保持規律的保養習慣',
        '建議每 2-4 週進行一次療程以維持效果',
      ],
      donts: [
        '療程後 6 小時內避免上妝',
        '當天避免使用含酸類產品',
        '避免直接日曬',
        '不要使用過於刺激的保養品',
        '避免過度清潔導致肌膚屏障受損',
      ],
    },
    sort_order: 12,
    is_active: true,
  },
];

// ============================================
// 2. 醫美服務項目 (services) — 至少 10 項
// ============================================

export const serviceItems = [
  {
    tenant_id: TENANT_ID,
    name: '皮秒雷射',
    description: '利用皮秒級脈衝精準擊碎黑色素，有效改善斑點、膚色不均及刺青。恢復期短，適合各種膚質。',
    duration_minutes: 60,
    price: 8000,
    category: '雷射',
    is_active: true,
  },
  {
    tenant_id: TENANT_ID,
    name: '海芙音波（HIFU）',
    description: '利用高強度聚焦超音波深入 SMAS 筋膜層，達到非侵入式拉提緊緻效果，改善鬆弛下垂。',
    duration_minutes: 90,
    price: 25000,
    category: '雷射',
    is_active: true,
  },
  {
    tenant_id: TENANT_ID,
    name: '肉毒桿菌注射',
    description: '精準注射肉毒桿菌素，放鬆過度收縮的肌肉，有效改善動態紋（抬頭紋、魚尾紋、皺眉紋）。',
    duration_minutes: 30,
    price: 6000,
    category: '注射',
    is_active: true,
  },
  {
    tenant_id: TENANT_ID,
    name: '玻尿酸填充',
    description: '使用高品質玻尿酸進行面部填充，改善法令紋、淚溝、豐唇及面部輪廓雕塑。',
    duration_minutes: 45,
    price: 12000,
    category: '注射',
    is_active: true,
  },
  {
    tenant_id: TENANT_ID,
    name: '水光針注射',
    description: '將玻尿酸、維他命等營養成分直接注入真皮層，全面改善膚質、保濕度與光澤感。',
    duration_minutes: 45,
    price: 5000,
    category: '注射',
    is_active: true,
  },
  {
    tenant_id: TENANT_ID,
    name: '淨膚雷射',
    description: '溫和的雷射治療，有效改善毛孔粗大、膚色暗沉及輕微色素沉澱，午休美容首選。',
    duration_minutes: 30,
    price: 3500,
    category: '雷射',
    is_active: true,
  },
  {
    tenant_id: TENANT_ID,
    name: '飛梭雷射',
    description: '分段式雷射治療，有效改善痘疤、毛孔粗大及膚質不均，刺激膠原蛋白增生。',
    duration_minutes: 60,
    price: 6500,
    category: '雷射',
    is_active: true,
  },
  {
    tenant_id: TENANT_ID,
    name: '果酸煥膚',
    description: '使用醫療級果酸進行化學換膚，加速角質代謝，改善粉刺、痘痘及膚色不均。',
    duration_minutes: 40,
    price: 2500,
    category: '保養',
    is_active: true,
  },
  {
    tenant_id: TENANT_ID,
    name: '微針治療',
    description: '利用微細針頭在肌膚表面創造微通道，促進膠原蛋白增生，改善毛孔、細紋及疤痕。',
    duration_minutes: 60,
    price: 4500,
    category: '保養',
    is_active: true,
  },
  {
    tenant_id: TENANT_ID,
    name: '雙眼皮手術',
    description: '依據個人眼型與需求，採用縫合式或切割式手術方式，打造自然美麗的雙眼皮。',
    duration_minutes: 120,
    price: 35000,
    category: '手術',
    is_active: true,
  },
  {
    tenant_id: TENANT_ID,
    name: '埋線拉提',
    description: '使用可吸收式線材植入皮下組織，達到即時拉提效果，同時刺激膠原蛋白增生。',
    duration_minutes: 90,
    price: 30000,
    category: '手術',
    is_active: true,
  },
  {
    tenant_id: TENANT_ID,
    name: '保濕導入療程',
    description: '結合離子導入與超聲波技術，將高濃度保濕精華深層導入肌膚，即刻提升肌膚含水量。',
    duration_minutes: 50,
    price: 2000,
    category: '保養',
    is_active: true,
  },
];

// ============================================
// 3. 會員等級 (member_levels)
// ============================================

export const memberLevels = [
  {
    tenant_id: TENANT_ID,
    level_name: '一般會員',
    min_points: 0,
    discount_percentage: 0,
    benefits: '基本預約服務、術後護理衛教查詢',
  },
  {
    tenant_id: TENANT_ID,
    level_name: '銀卡會員',
    min_points: 5000,
    discount_percentage: 3,
    benefits: '享 97 折優惠、生日禮金 500 元、優先預約',
  },
  {
    tenant_id: TENANT_ID,
    level_name: '金卡會員',
    min_points: 20000,
    discount_percentage: 5,
    benefits: '享 95 折優惠、生日禮金 1000 元、優先預約、免費膚質檢測',
  },
  {
    tenant_id: TENANT_ID,
    level_name: '鑽石會員',
    min_points: 50000,
    discount_percentage: 8,
    benefits: '享 92 折優惠、生日禮金 2000 元、VIP 專屬預約時段、免費膚質檢測、專屬諮詢師',
  },
  {
    tenant_id: TENANT_ID,
    level_name: 'VIP 會員',
    min_points: 100000,
    discount_percentage: 10,
    benefits: '享 9 折優惠、生日禮金 5000 元、VIP 專屬預約時段、免費膚質檢測、專屬諮詢師、年度免費療程一次',
  },
];

// ============================================
// 4. 標準營業時段模板 (time_slot_templates)
//    day_of_week: 0=Sunday, 1=Monday, ..., 6=Saturday
// ============================================

export const timeSlotTemplates = [
  // 週一至週五 (day_of_week: 1-5) — 上午時段
  ...([1, 2, 3, 4, 5] as const).map((day) => ({
    tenant_id: TENANT_ID,
    name: `平日上午時段`,
    day_of_week: day,
    start_time: '09:00',
    end_time: '12:00',
    max_bookings: 3,
    is_active: true,
  })),
  // 週一至週五 (day_of_week: 1-5) — 下午時段
  ...([1, 2, 3, 4, 5] as const).map((day) => ({
    tenant_id: TENANT_ID,
    name: `平日下午時段`,
    day_of_week: day,
    start_time: '13:00',
    end_time: '17:00',
    max_bookings: 3,
    is_active: true,
  })),
  // 週一至週五 (day_of_week: 1-5) — 晚間時段
  ...([1, 2, 3, 4, 5] as const).map((day) => ({
    tenant_id: TENANT_ID,
    name: `平日晚間時段`,
    day_of_week: day,
    start_time: '18:00',
    end_time: '21:00',
    max_bookings: 2,
    is_active: true,
  })),
  // 週六 (day_of_week: 6) — 上午 + 下午
  {
    tenant_id: TENANT_ID,
    name: '週六上午時段',
    day_of_week: 6,
    start_time: '09:00',
    end_time: '12:00',
    max_bookings: 4,
    is_active: true,
  },
  {
    tenant_id: TENANT_ID,
    name: '週六下午時段',
    day_of_week: 6,
    start_time: '13:00',
    end_time: '17:00',
    max_bookings: 4,
    is_active: true,
  },
  // 週日 (day_of_week: 0) — 休診
  {
    tenant_id: TENANT_ID,
    name: '週日休診',
    day_of_week: 0,
    start_time: '00:00',
    end_time: '00:00',
    max_bookings: 0,
    is_active: false,
  },
];

// ============================================
// 5. 示範票券 (vouchers)
// ============================================

export const vouchers = [
  {
    tenant_id: TENANT_ID,
    voucher_code: 'WELCOME2026',
    voucher_type: 'discount',
    discount_value: 10,
    service_id: null,
    product_id: null,
    valid_from: '2026-01-01T00:00:00+08:00',
    valid_until: '2026-12-31T23:59:59+08:00',
    usage_limit: 100,
    usage_count: 0,
    is_active: true,
  },
  {
    tenant_id: TENANT_ID,
    voucher_code: 'BDAY500',
    voucher_type: 'discount',
    discount_value: 500,
    service_id: null,
    product_id: null,
    valid_from: '2026-01-01T00:00:00+08:00',
    valid_until: '2026-12-31T23:59:59+08:00',
    usage_limit: 50,
    usage_count: 0,
    is_active: true,
  },
  {
    tenant_id: TENANT_ID,
    voucher_code: 'LASER20OFF',
    voucher_type: 'discount',
    discount_value: 20,
    service_id: null,
    product_id: null,
    valid_from: '2026-02-01T00:00:00+08:00',
    valid_until: '2026-06-30T23:59:59+08:00',
    usage_limit: 30,
    usage_count: 0,
    is_active: true,
  },
  {
    tenant_id: TENANT_ID,
    voucher_code: 'REFER1000',
    voucher_type: 'discount',
    discount_value: 1000,
    service_id: null,
    product_id: null,
    valid_from: '2026-01-01T00:00:00+08:00',
    valid_until: '2026-12-31T23:59:59+08:00',
    usage_limit: 200,
    usage_count: 0,
    is_active: true,
  },
  {
    tenant_id: TENANT_ID,
    voucher_code: 'SUMMER2026',
    voucher_type: 'discount',
    discount_value: 15,
    service_id: null,
    product_id: null,
    valid_from: '2026-06-01T00:00:00+08:00',
    valid_until: '2026-08-31T23:59:59+08:00',
    usage_limit: 50,
    usage_count: 0,
    is_active: true,
  },
];
