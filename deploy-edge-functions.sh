#!/bin/bash

# Supabase Edge Functions 部署腳本
# 使用方式: ./deploy-edge-functions.sh

set -e

echo "🚀 開始部署 Supabase Edge Functions..."

# 檢查 Supabase CLI 是否已安裝
if ! command -v supabase &> /dev/null; then
    echo "❌ Supabase CLI 未安裝，正在安裝..."
    npm install -g supabase
fi

# 檢查是否已登入 Supabase
echo "📝 檢查 Supabase 登入狀態..."
if ! supabase projects list &> /dev/null; then
    echo "❌ 請先登入 Supabase CLI:"
    echo "   supabase login"
    exit 1
fi

# 設定專案 ID
PROJECT_REF="mrifutgtlquznfgbmild"
echo "📦 目標專案: $PROJECT_REF"

# 連結專案
echo "🔗 連結 Supabase 專案..."
supabase link --project-ref $PROJECT_REF

# 部署所有 Edge Functions
echo "📤 部署 Edge Functions..."

# 1. LINE Pay 授權請求
echo "  → 部署 line-pay-request..."
supabase functions deploy line-pay-request --project-ref $PROJECT_REF

# 2. LINE Pay 授權確認
echo "  → 部署 line-pay-confirm..."
supabase functions deploy line-pay-confirm --project-ref $PROJECT_REF

# 3. LINE Pay 定期扣款
echo "  → 部署 line-pay-charge..."
supabase functions deploy line-pay-charge --project-ref $PROJECT_REF

# 4. LINE 通知發送
echo "  → 部署 send-line-notification..."
supabase functions deploy send-line-notification --project-ref $PROJECT_REF

# 5. 批次審核通知
echo "  → 部署 send-batch-approval-notification..."
supabase functions deploy send-batch-approval-notification --project-ref $PROJECT_REF

# 6. 預約提醒
echo "  → 部署 send-booking-reminder..."
supabase functions deploy send-booking-reminder --project-ref $PROJECT_REF

echo "✅ 所有 Edge Functions 部署完成！"
echo ""
echo "📋 下一步：設定環境變數"
echo "   請在 Supabase Dashboard 中設定以下環境變數:"
echo "   - LINE_PAY_CHANNEL_ID"
echo "   - LINE_PAY_CHANNEL_SECRET"
echo "   - LINE_PAY_SANDBOX_MODE (測試環境設為 true)"
echo "   - LINE_MESSAGING_ACCESS_TOKEN"
echo "   - LINE_MESSAGING_CHANNEL_SECRET"
echo ""
echo "   設定路徑: https://supabase.com/dashboard/project/$PROJECT_REF/functions"
