#!/bin/bash

# Supabase 連線資訊
SUPABASE_URL="https://mrifutgtlquznfgbmild.supabase.co"
SUPABASE_SERVICE_ROLE_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1yaWZ1dGd0bHF1em5mZ2JtaWxkIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MDgzMTQ1OSwiZXhwIjoyMDg2NDA3NDU5fQ.r8aICB1OYPDPwUgNSdh4OH6Ok9nrNl_c2Z20szzJc0I"
DB_PASSWORD="Dora0423"

# PostgreSQL 連線字串
PG_CONNECTION="postgresql://postgres.mrifutgtlquznfgbmild:${DB_PASSWORD}@aws-0-ap-southeast-1.pooler.supabase.com:6543/postgres"

echo "開始執行 Migration 腳本..."

# 執行核心 Migration（001-008）
for i in {1..8}; do
  file=$(printf "supabase/migrations/%03d_*.sql" $i)
  if [ -f $file ]; then
    echo "執行: $file"
    PGPASSWORD=$DB_PASSWORD psql "$PG_CONNECTION" -f "$file" 2>&1 | grep -v "^$"
  fi
done

# 執行新增的 Migration（0-11 開頭的檔案）
for file in supabase/migrations/{0,1,2,3,4,5,6,7,8,9,10,11}_*.sql; do
  if [ -f "$file" ]; then
    echo "執行: $file"
    PGPASSWORD=$DB_PASSWORD psql "$PG_CONNECTION" -f "$file" 2>&1 | grep -v "^$"
  fi
done

echo "✅ 所有 Migration 腳本執行完成"
