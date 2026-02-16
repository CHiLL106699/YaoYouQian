# ============================================
# YaoYouQian 曜友仟管理雲 — Multi-stage Dockerfile
# ============================================

# --- Stage 1: Build ---
FROM node:22-alpine AS builder

WORKDIR /app

# 安裝 pnpm
RUN corepack enable && corepack prepare pnpm@10.4.1 --activate

# 複製 package 相關檔案
COPY package.json pnpm-lock.yaml ./
COPY patches/ ./patches/

# 安裝所有依賴（含 devDependencies，用於建構）
RUN pnpm install --frozen-lockfile

# 複製所有原始碼
COPY . .

# 建構前端靜態資源 + 後端 bundle
RUN pnpm build

# --- Stage 2: Production ---
FROM node:22-alpine AS production

WORKDIR /app

# 安裝 pnpm
RUN corepack enable && corepack prepare pnpm@10.4.1 --activate

# 複製 package 相關檔案
COPY package.json pnpm-lock.yaml ./
COPY patches/ ./patches/

# 僅安裝 production 依賴
RUN pnpm install --frozen-lockfile --prod

# 從 builder 階段複製建構產出物
COPY --from=builder /app/dist ./dist

# 非 root 使用者執行
RUN addgroup -g 1001 -S appgroup && \
    adduser -S appuser -u 1001 -G appgroup
USER appuser

# 暴露埠號
EXPOSE 3000

# 健康檢查
HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:3000/api/trpc/system.health || exit 1

# 啟動應用程式
ENV NODE_ENV=production
CMD ["node", "dist/index.js"]
