-- ============================================
-- Sprint 4: YOKAGE × YaoYouQian 統一 Seed 腳本
-- Date: 2026-02-17
-- Description: 建立兩個產品線的示範資料
-- ============================================

-- ============================================
-- 清理舊 Seed 資料（僅清理 seed 標記的資料）
-- ============================================
DELETE FROM "product_upgrade_logs" WHERE "upgrade_reason" = 'seed_data';
DELETE FROM "subscription_payments" WHERE "metadata"::text LIKE '%seed_data%';

-- ============================================
-- 1. 示範使用者
-- ============================================

-- Super Admin（跨產品線管理員）
INSERT INTO "users" ("openId", "name", "email", "role", "loginMethod")
VALUES ('seed_super_admin_001', 'Super Admin', 'admin@yokage.com', 'super_admin', 'email')
ON CONFLICT ("openId") DO UPDATE SET
  "name" = EXCLUDED."name",
  "email" = EXCLUDED."email",
  "role" = EXCLUDED."role";

-- YOKAGE 租戶管理員
INSERT INTO "users" ("openId", "name", "email", "role", "loginMethod")
VALUES ('seed_yokage_admin_001', '王大明', 'admin@yokage-demo.com', 'admin', 'email')
ON CONFLICT ("openId") DO UPDATE SET
  "name" = EXCLUDED."name",
  "email" = EXCLUDED."email",
  "role" = EXCLUDED."role";

-- YOKAGE 員工
INSERT INTO "users" ("openId", "name", "email", "role", "loginMethod")
VALUES ('seed_yokage_staff_001', '李美麗', 'staff@yokage-demo.com', 'staff', 'email')
ON CONFLICT ("openId") DO UPDATE SET
  "name" = EXCLUDED."name",
  "email" = EXCLUDED."email",
  "role" = EXCLUDED."role";

-- YaoYouQian 租戶管理員
INSERT INTO "users" ("openId", "name", "email", "role", "loginMethod", "lineUserId")
VALUES ('seed_yyq_admin_001', '陳小華', 'admin@yyq-demo.com', 'admin', 'line', 'U_seed_yyq_admin_line')
ON CONFLICT ("openId") DO UPDATE SET
  "name" = EXCLUDED."name",
  "email" = EXCLUDED."email",
  "role" = EXCLUDED."role",
  "lineUserId" = EXCLUDED."lineUserId";

-- YaoYouQian 員工
INSERT INTO "users" ("openId", "name", "email", "role", "loginMethod", "lineUserId")
VALUES ('seed_yyq_staff_001', '張小芳', 'staff@yyq-demo.com', 'staff', 'line', 'U_seed_yyq_staff_line')
ON CONFLICT ("openId") DO UPDATE SET
  "name" = EXCLUDED."name",
  "email" = EXCLUDED."email",
  "role" = EXCLUDED."role",
  "lineUserId" = EXCLUDED."lineUserId";

-- ============================================
-- 2. 示範租戶
-- ============================================

-- YOKAGE Pro 租戶
INSERT INTO "tenants" ("name", "slug", "email", "phone", "address", "planType", "sourceProduct", "enabledModules", "subscriptionPlan", "subscriptionStatus", "isActive")
VALUES (
  'YOKAGE 示範診所',
  'yokage-demo-clinic',
  'contact@yokage-demo.com',
  '02-2345-6789',
  '台北市信義區信義路五段7號',
  'yokage_pro',
  'yokage',
  '["appointment","customer","staff","schedule","clock","notification","tenant","auth","lineWebhook","gamification","biDashboard","emr","aiChatbot","richMenuEditor","abTest","vectorSearch","advancedInventory","advancedMarketing","multiStore"]',
  'pro',
  'active',
  true
)
ON CONFLICT ("slug") DO UPDATE SET
  "name" = EXCLUDED."name",
  "planType" = EXCLUDED."planType",
  "sourceProduct" = EXCLUDED."sourceProduct",
  "enabledModules" = EXCLUDED."enabledModules";

-- YaoYouQian Basic 租戶
INSERT INTO "tenants" ("name", "slug", "subdomain", "email", "phone", "address", "planType", "sourceProduct", "enabledModules", "subscriptionPlan", "subscriptionStatus", "isActive", "status", "owner_line_user_id")
VALUES (
  'YaoYouQian 示範美容院',
  'yyq-demo-salon',
  'yyq-demo',
  'contact@yyq-demo.com',
  '03-9876-5432',
  '台中市西屯區台灣大道三段99號',
  'yyq_basic',
  'yaoyouqian',
  '["appointment","customer","staff","schedule","clock","notification","tenant","auth","lineWebhook","gamification","liffAuth","linePay","liffBooking","liffShop","liffMember"]',
  'basic',
  'active',
  true,
  'active',
  'U_seed_yyq_admin_line'
)
ON CONFLICT ("slug") DO UPDATE SET
  "name" = EXCLUDED."name",
  "planType" = EXCLUDED."planType",
  "sourceProduct" = EXCLUDED."sourceProduct",
  "enabledModules" = EXCLUDED."enabledModules";

-- ============================================
-- 3. 租戶使用者關聯
-- ============================================

-- YOKAGE 租戶 — 管理員
INSERT INTO "organizationUsers" ("organizationId", "userId", "role")
SELECT t.id, u.id, 'admin'
FROM "tenants" t, "users" u
WHERE t."slug" = 'yokage-demo-clinic' AND u."openId" = 'seed_yokage_admin_001'
ON CONFLICT DO NOTHING;

-- YOKAGE 租戶 — 員工
INSERT INTO "organizationUsers" ("organizationId", "userId", "role")
SELECT t.id, u.id, 'staff'
FROM "tenants" t, "users" u
WHERE t."slug" = 'yokage-demo-clinic' AND u."openId" = 'seed_yokage_staff_001'
ON CONFLICT DO NOTHING;

-- YaoYouQian 租戶 — 管理員
INSERT INTO "organizationUsers" ("organizationId", "userId", "role")
SELECT t.id, u.id, 'admin'
FROM "tenants" t, "users" u
WHERE t."slug" = 'yyq-demo-salon' AND u."openId" = 'seed_yyq_admin_001'
ON CONFLICT DO NOTHING;

-- YaoYouQian 租戶 — 員工
INSERT INTO "organizationUsers" ("organizationId", "userId", "role")
SELECT t.id, u.id, 'staff'
FROM "tenants" t, "users" u
WHERE t."slug" = 'yyq-demo-salon' AND u."openId" = 'seed_yyq_staff_001'
ON CONFLICT DO NOTHING;

-- ============================================
-- 4. 示範客戶
-- ============================================

-- YOKAGE 租戶的客戶
INSERT INTO "customers" ("organizationId", "name", "phone", "email", "gender", "notes")
SELECT t.id, '林志玲', '0912-345-678', 'lin@example.com', 'female', 'VIP 客戶，偏好微整形'
FROM "tenants" t WHERE t."slug" = 'yokage-demo-clinic'
ON CONFLICT DO NOTHING;

INSERT INTO "customers" ("organizationId", "name", "phone", "email", "gender", "notes")
SELECT t.id, '周杰倫', '0923-456-789', 'jay@example.com', 'male', '定期保養客戶'
FROM "tenants" t WHERE t."slug" = 'yokage-demo-clinic'
ON CONFLICT DO NOTHING;

-- YaoYouQian 租戶的客戶
INSERT INTO "customers" ("organizationId", "name", "phone", "email", "gender", "notes", "lineUserId")
SELECT t.id, '蔡依林', '0934-567-890', 'jolin@example.com', 'female', '透過 LINE 預約', 'U_customer_jolin'
FROM "tenants" t WHERE t."slug" = 'yyq-demo-salon'
ON CONFLICT DO NOTHING;

INSERT INTO "customers" ("organizationId", "name", "phone", "email", "gender", "notes", "lineUserId")
SELECT t.id, '五月天阿信', '0945-678-901', 'ashin@example.com', 'male', '透過 LINE 預約', 'U_customer_ashin'
FROM "tenants" t WHERE t."slug" = 'yyq-demo-salon'
ON CONFLICT DO NOTHING;

-- ============================================
-- 5. 示範訂閱付款記錄
-- ============================================

-- YOKAGE Pro 租戶的付款
INSERT INTO "subscription_payments" ("tenant_id", "amount", "currency", "status", "payment_method", "period_start", "period_end", "metadata")
SELECT t.id, 4990.00, 'TWD', 'success', 'credit_card',
  date_trunc('month', now()), date_trunc('month', now()) + interval '1 month',
  '{"seed_data": true, "plan": "yokage_pro"}'::jsonb
FROM "tenants" t WHERE t."slug" = 'yokage-demo-clinic';

-- YaoYouQian Basic 租戶的付款
INSERT INTO "subscription_payments" ("tenant_id", "amount", "currency", "status", "payment_method", "period_start", "period_end", "metadata")
SELECT t.id, 990.00, 'TWD', 'success', 'line_pay',
  date_trunc('month', now()), date_trunc('month', now()) + interval '1 month',
  '{"seed_data": true, "plan": "yyq_basic"}'::jsonb
FROM "tenants" t WHERE t."slug" = 'yyq-demo-salon';

-- ============================================
-- 完成
-- ============================================
-- Seed 資料已建立：
-- - 5 個使用者（1 super_admin + 2 YOKAGE + 2 YaoYouQian）
-- - 2 個租戶（1 YOKAGE Pro + 1 YaoYouQian Basic）
-- - 4 個客戶（每個租戶 2 個）
-- - 2 筆訂閱付款記錄
