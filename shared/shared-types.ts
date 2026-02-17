/**
 * ============================================
 * Sprint 4: YOKAGE × YaoYouQian 共用型別定義
 * ============================================
 *
 * 此檔案定義兩個產品線共用的 TypeScript 型別。
 * 兩個專案都應引用此檔案，確保型別一致性。
 *
 * 注意：此檔案不依賴 Drizzle ORM，純 TypeScript 型別定義，
 * 確保前後端都能安全引用。
 */

// ============================================
// 產品線與方案型別
// ============================================

/** 產品線方案類型 */
export type PlanType = 'yokage_starter' | 'yokage_pro' | 'yyq_basic' | 'yyq_advanced';

/** 來源產品 */
export type SourceProduct = 'yokage' | 'yaoyouqian';

/** 使用者角色 */
export type UserRole = 'super_admin' | 'admin' | 'staff' | 'user';

/** 訂閱狀態 */
export type SubscriptionStatus = 'active' | 'past_due' | 'cancelled' | 'suspended' | 'trial';

// ============================================
// Plan → Module 映射（Feature Gating 共用）
// ============================================

/** 各方案可用模組映射表 */
export const PLAN_MODULES: Record<PlanType, string[]> = {
  yokage_starter: [
    'appointment', 'customer', 'staff', 'schedule', 'clock',
    'notification', 'tenant', 'auth', 'lineWebhook', 'gamification',
  ],
  yokage_pro: [
    // 繼承 starter 所有模組
    'appointment', 'customer', 'staff', 'schedule', 'clock',
    'notification', 'tenant', 'auth', 'lineWebhook', 'gamification',
    // Pro 專屬
    'biDashboard', 'emr', 'aiChatbot', 'richMenuEditor', 'abTest',
    'vectorSearch', 'advancedInventory', 'advancedMarketing', 'multiStore',
  ],
  yyq_basic: [
    'appointment', 'customer', 'staff', 'schedule', 'clock',
    'notification', 'tenant', 'auth', 'lineWebhook', 'gamification',
    // LINE 基礎
    'liffAuth', 'linePay', 'liffBooking', 'liffShop', 'liffMember',
  ],
  yyq_advanced: [
    // 繼承 yyq_basic 所有模組
    'appointment', 'customer', 'staff', 'schedule', 'clock',
    'notification', 'tenant', 'auth', 'lineWebhook', 'gamification',
    'liffAuth', 'linePay', 'liffBooking', 'liffShop', 'liffMember',
    // 進階功能
    'biDashboard', 'advancedMarketing',
  ],
};

// ============================================
// 產品線資訊
// ============================================

/** 產品線定義 */
export interface ProductLineInfo {
  key: SourceProduct;
  name: string;
  description: string;
  plans: PlanType[];
}

/** 產品線清單 */
export const PRODUCT_LINES: ProductLineInfo[] = [
  {
    key: 'yokage',
    name: 'YOKAGE',
    description: '高配版 SaaS — 全功能企業級美業管理平台',
    plans: ['yokage_starter', 'yokage_pro'],
  },
  {
    key: 'yaoyouqian',
    name: 'YaoYouQian 要有錢',
    description: 'LINE 專用版 — 以 LINE 為核心的輕量美業管理',
    plans: ['yyq_basic', 'yyq_advanced'],
  },
];

/** 方案顯示名稱 */
export const PLAN_DISPLAY_NAMES: Record<PlanType, string> = {
  yokage_starter: 'YOKAGE 入門版',
  yokage_pro: 'YOKAGE 高配版',
  yyq_basic: 'YaoYouQian 基礎版',
  yyq_advanced: 'YaoYouQian 進階版',
};

/** 方案價格（月費，TWD） */
export const PLAN_PRICES: Record<PlanType, number> = {
  yokage_starter: 1990,
  yokage_pro: 4990,
  yyq_basic: 990,
  yyq_advanced: 1990,
};

// ============================================
// 升級路徑定義
// ============================================

/** 允許的升級路徑 */
export const UPGRADE_PATHS: Record<PlanType, PlanType[]> = {
  yyq_basic: ['yyq_advanced', 'yokage_starter', 'yokage_pro'],
  yyq_advanced: ['yokage_starter', 'yokage_pro'],
  yokage_starter: ['yokage_pro'],
  yokage_pro: [], // 最高級方案，無升級路徑
};

/** 允許的降級路徑 */
export const DOWNGRADE_PATHS: Record<PlanType, PlanType[]> = {
  yokage_pro: ['yokage_starter', 'yyq_advanced', 'yyq_basic'],
  yokage_starter: ['yyq_advanced', 'yyq_basic'],
  yyq_advanced: ['yyq_basic'],
  yyq_basic: [], // 最低級方案，無降級路徑
};

/** 判斷是否為有效的升級路徑 */
export function isValidUpgrade(from: PlanType, to: PlanType): boolean {
  return UPGRADE_PATHS[from]?.includes(to) ?? false;
}

/** 判斷是否為有效的降級路徑 */
export function isValidDowngrade(from: PlanType, to: PlanType): boolean {
  return DOWNGRADE_PATHS[from]?.includes(to) ?? false;
}

// ============================================
// YOKAGE Pro 專屬功能（升級頁面用）
// ============================================

export interface FeatureComparison {
  category: string;
  features: {
    name: string;
    description: string;
    yyqBasic: boolean | string;
    yyqAdvanced: boolean | string;
    yokageStarter: boolean | string;
    yokagePro: boolean | string;
  }[];
}

export const FEATURE_COMPARISONS: FeatureComparison[] = [
  {
    category: '基礎功能',
    features: [
      { name: '預約管理', description: '線上預約、排班管理', yyqBasic: true, yyqAdvanced: true, yokageStarter: true, yokagePro: true },
      { name: '客戶管理', description: 'CRM 客戶資料庫', yyqBasic: true, yyqAdvanced: true, yokageStarter: true, yokagePro: true },
      { name: '員工管理', description: '員工資料與排班', yyqBasic: true, yyqAdvanced: true, yokageStarter: true, yokagePro: true },
      { name: '打卡系統', description: '員工出勤管理', yyqBasic: true, yyqAdvanced: true, yokageStarter: true, yokagePro: true },
    ],
  },
  {
    category: 'LINE 整合',
    features: [
      { name: 'LIFF 預約', description: 'LINE 內嵌預約頁面', yyqBasic: true, yyqAdvanced: true, yokageStarter: false, yokagePro: true },
      { name: 'LINE Pay', description: 'LINE Pay 金流整合', yyqBasic: true, yyqAdvanced: true, yokageStarter: false, yokagePro: true },
      { name: 'LINE 會員中心', description: 'LIFF 會員管理', yyqBasic: true, yyqAdvanced: true, yokageStarter: false, yokagePro: true },
      { name: 'Rich Menu 編輯器', description: '動態 Rich Menu 管理', yyqBasic: false, yyqAdvanced: false, yokageStarter: false, yokagePro: true },
    ],
  },
  {
    category: '進階功能',
    features: [
      { name: 'BI 儀表板', description: '商業智慧分析報表', yyqBasic: false, yyqAdvanced: true, yokageStarter: false, yokagePro: true },
      { name: '精準行銷', description: '智能標籤與自動行銷', yyqBasic: false, yyqAdvanced: true, yokageStarter: false, yokagePro: true },
      { name: 'EMR 電子病歷', description: '療程記錄與影像管理', yyqBasic: false, yyqAdvanced: false, yokageStarter: false, yokagePro: true },
      { name: 'AI 對話機器人', description: 'AI 驅動的客服機器人', yyqBasic: false, yyqAdvanced: false, yokageStarter: false, yokagePro: true },
      { name: 'A/B 測試', description: '推播訊息 A/B 測試', yyqBasic: false, yyqAdvanced: false, yokageStarter: false, yokagePro: true },
      { name: '向量搜尋', description: 'AI 語意搜尋客戶資料', yyqBasic: false, yyqAdvanced: false, yokageStarter: false, yokagePro: true },
      { name: '多店管理', description: '跨分店統一管理', yyqBasic: false, yyqAdvanced: false, yokageStarter: false, yokagePro: true },
      { name: '進階庫存', description: 'BOM 物料與庫存追蹤', yyqBasic: false, yyqAdvanced: false, yokageStarter: false, yokagePro: true },
    ],
  },
];

// ============================================
// 共用 API 回應型別
// ============================================

/** 產品線總覽統計 */
export interface ProductLineStats {
  product: SourceProduct;
  productName: string;
  totalTenants: number;
  activeTenants: number;
  totalRevenue: number;
  planBreakdown: Record<PlanType, number>;
}

/** 租戶搜尋結果 */
export interface TenantSearchResult {
  id: number;
  name: string;
  slug: string | null;
  subdomain: string | null;
  planType: PlanType | null;
  sourceProduct: SourceProduct | null;
  isActive: boolean | null;
  createdAt: string;
  customerCount?: number;
  appointmentCount?: number;
}

/** 升級/降級請求 */
export interface PlanChangeRequest {
  tenantId: number;
  fromPlan: PlanType;
  toPlan: PlanType;
  reason?: string;
}

/** 升級/降級結果 */
export interface PlanChangeResult {
  success: boolean;
  tenantId: number;
  oldPlan: PlanType;
  newPlan: PlanType;
  oldProduct: SourceProduct;
  newProduct: SourceProduct;
  enabledModules: string[];
  message: string;
}
