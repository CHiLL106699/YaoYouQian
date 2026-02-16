#!/usr/bin/env bash
# ============================================
# YaoYouQian 曜友仟管理雲 — 健康檢查腳本
# ============================================
# 使用方式：bash scripts/health-check.sh [URL] [MAX_RETRIES]
# 預設 URL: http://localhost:3000
# 預設重試次數: 10
# ============================================

set -euo pipefail

# 顏色定義
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

log_info()  { echo -e "${GREEN}[INFO]${NC}  $*"; }
log_warn()  { echo -e "${YELLOW}[WARN]${NC}  $*"; }
log_error() { echo -e "${RED}[ERROR]${NC} $*"; }

BASE_URL="${1:-http://localhost:3000}"
MAX_RETRIES="${2:-10}"
RETRY_INTERVAL=3

# --- 健康檢查端點 ---
HEALTH_ENDPOINT="${BASE_URL}/api/trpc/system.health"

log_info "開始健康檢查..."
log_info "目標端點: ${HEALTH_ENDPOINT}"
log_info "最大重試次數: ${MAX_RETRIES}"

RETRY_COUNT=0
while [ $RETRY_COUNT -lt "$MAX_RETRIES" ]; do
  RETRY_COUNT=$((RETRY_COUNT + 1))

  HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" --max-time 5 "$HEALTH_ENDPOINT" 2>/dev/null || echo "000")

  if [ "$HTTP_CODE" = "200" ]; then
    log_info "健康檢查通過！(HTTP ${HTTP_CODE})"

    # 額外檢查首頁是否可存取
    HOMEPAGE_CODE=$(curl -s -o /dev/null -w "%{http_code}" --max-time 5 "$BASE_URL" 2>/dev/null || echo "000")
    if [ "$HOMEPAGE_CODE" = "200" ]; then
      log_info "首頁可正常存取 (HTTP ${HOMEPAGE_CODE})"
    else
      log_warn "首頁回應異常 (HTTP ${HOMEPAGE_CODE})，但 API 健康檢查已通過"
    fi

    log_info "========================================="
    log_info "  所有健康檢查通過！"
    log_info "========================================="
    exit 0
  fi

  log_warn "嘗試 ${RETRY_COUNT}/${MAX_RETRIES} — HTTP ${HTTP_CODE}，${RETRY_INTERVAL} 秒後重試..."
  sleep $RETRY_INTERVAL
done

log_error "========================================="
log_error "  健康檢查失敗！已達最大重試次數。"
log_error "========================================="
log_error "請檢查："
log_error "  1. 容器是否正在運行: docker compose ps"
log_error "  2. 容器日誌: docker compose logs --tail=100 app"
log_error "  3. 環境變數是否正確設定"
exit 1
