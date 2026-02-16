#!/usr/bin/env bash
# ============================================
# YaoYouQian 曜友仟管理雲 — 生產環境部署腳本
# ============================================
# 使用方式：bash scripts/deploy.sh
# ============================================

set -euo pipefail

# 顏色定義
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

log_info()  { echo -e "${GREEN}[INFO]${NC}  $*"; }
log_warn()  { echo -e "${YELLOW}[WARN]${NC}  $*"; }
log_error() { echo -e "${RED}[ERROR]${NC} $*"; }

# 切換到專案根目錄
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_DIR="$(dirname "$SCRIPT_DIR")"
cd "$PROJECT_DIR"

log_info "開始部署 YaoYouQian 曜友仟管理雲..."
log_info "專案目錄: $PROJECT_DIR"

# --- Step 1: 檢查必要檔案 ---
if [ ! -f ".env" ]; then
  log_error ".env 檔案不存在。請先複製 .env.production 為 .env 並填入實際值。"
  log_error "  cp .env.production .env"
  exit 1
fi

if [ ! -f "docker-compose.yml" ]; then
  log_error "docker-compose.yml 檔案不存在。"
  exit 1
fi

# --- Step 2: 拉取最新程式碼 ---
log_info "拉取最新程式碼..."
git pull origin main || {
  log_warn "Git pull 失敗，可能有未提交的變更。繼續使用本地程式碼..."
}

# --- Step 3: 停止舊容器 ---
log_info "停止並移除舊容器..."
docker compose down --remove-orphans || true

# --- Step 4: 建構並啟動新容器 ---
log_info "建構並啟動新容器..."
docker compose up -d --build

# --- Step 5: 等待服務啟動 ---
log_info "等待服務啟動..."
sleep 5

# --- Step 6: 健康檢查 ---
log_info "執行健康檢查..."
bash "$SCRIPT_DIR/health-check.sh"
HEALTH_EXIT=$?

if [ $HEALTH_EXIT -eq 0 ]; then
  log_info "========================================="
  log_info "  部署成功完成！"
  log_info "========================================="
  docker compose ps
else
  log_error "健康檢查失敗！請檢查容器日誌："
  log_error "  docker compose logs --tail=50 app"
  exit 1
fi
