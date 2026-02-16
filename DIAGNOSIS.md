# YoCHiLLSAAS 診斷報告

## 資料庫狀態

### Supabase (PostgreSQL) - 已存在的表
| 表名 | 狀態 |
|------|------|
| tenants | EXISTS (owner_line_user_id NOT NULL 需修復) |
| customers | EXISTS |
| services | EXISTS |
| appointments | EXISTS |
| products | EXISTS |
| aftercare_records | EXISTS |
| weight_tracking | EXISTS |
| member_levels | EXISTS |
| coupons | EXISTS |
| referrals | EXISTS |
| payment_methods | EXISTS |
| customer_tags | EXISTS |
| error_logs | EXISTS |
| shop_orders | EXISTS |
| white_label_settings | EXISTS |

### Supabase (PostgreSQL) - 缺失的表
| 表名 | 用途 |
|------|------|
| tenant_subscriptions | 租戶訂閱管理 |
| tenant_settings | 租戶設定 |
| booking_slot_limits | 預約時段限制 |
| orders | 訂單 |
| order_items | 訂單項目 |
| time_slot_templates | 時段模板 |
| dose_calculations | 劑量計算 |
| approvals | 審核 |
| reschedule_approvals | 改期審核 |
| slot_limits | 時段限制 |
| member_promotions | 會員優惠 |

### Drizzle ORM (MySQL) - 用於 DATABASE_URL
- 16 個表定義在 drizzle/schema.ts
- 使用 mysqlTable（但 Supabase 是 PostgreSQL）
- 部分 Router 使用 Drizzle，部分使用 Supabase Client

## 關鍵問題

1. **租戶註冊失敗**: owner_line_user_id 在 Supabase 中是 NOT NULL，但 register mutation 沒有提供此欄位
2. **雙資料庫架構**: Drizzle ORM (MySQL) + Supabase Client (PostgreSQL) 混用
3. **缺失 11 個 Supabase 表**: 需要建立
4. **TenantContext 使用 owner_email 查詢**: 但 tenants 表沒有 owner_email 欄位

## 修復計劃
1. 修復 tenantRouter.register - 提供 owner_line_user_id 預設值
2. 建立缺失的 Supabase 表
3. 統一所有 Router 使用 Supabase Client（而非 Drizzle）
4. 修復 TenantContext 的查詢邏輯
