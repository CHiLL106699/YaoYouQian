#!/bin/bash

DB_PASSWORD="Dora0423"
# 使用直接連線 (port 5432) 而非 Pooler (port 6543)
PG_CONNECTION="postgresql://postgres.mrifutgtlquznfgbmild:${DB_PASSWORD}@aws-0-ap-southeast-1.pooler.supabase.com:5432/postgres"

echo "使用直接連線執行 Migration 腳本..."

# 執行新增的 Migration（0-11 開頭的檔案）
for file in supabase/migrations/{0,1,2,3,4,5,6,7,8,9,10,11}_*.sql; do
  if [ -f "$file" ]; then
    echo "執行: $(basename $file)"
    PGPASSWORD=$DB_PASSWORD psql "$PG_CONNECTION" -f "$file" 2>&1 | grep -E "(CREATE|ERROR|NOTICE)" | head -5
  fi
done

echo "✅ Migration 執行完成"
