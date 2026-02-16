# Debug Notes

## 租戶註冊錯誤 - 根因分析
- 錯誤訊息: `null value in column "owner_line_user_id" of relation "tenants" violates not-null constraint`
- 根因: tenantRouter.ts line 120-127 使用 supabase.from('tenants').insert() 但只傳入 name, subdomain, status
- 資料庫中 owner_line_user_id 欄位是 NOT NULL（雖然 drizzle schema 沒有 .notNull()，但 Supabase 可能有額外約束）
- 修復: 需要在 insert 中加入 owner_line_user_id 欄位，或修改資料庫約束允許 NULL

## Vite Import 錯誤
- DoseCalculation.tsx 引用了不存在的 @/contexts/AuthContext
- 需要修正為正確的 import 路徑
