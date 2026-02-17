/**
 * Sprint 4: 產品線升級 Router
 *
 * 處理 YaoYouQian → YOKAGE 的方案升級/降級。
 * 所有敏感操作均在後端執行，前端僅接收脫敏結果。
 */
import { z } from "zod";
import { router, protectedProcedure } from "../_core/trpc";
import { TRPCError } from "@trpc/server";
import { supabase } from "../supabaseClient";
import {
  PLAN_MODULES,
  UPGRADE_PATHS,
  PLAN_DISPLAY_NAMES,
  PLAN_PRICES,
  FEATURE_COMPARISONS,
  type PlanType,
  type SourceProduct,
} from "../../shared/shared-types";

/** 根據 planType 推導 sourceProduct */
function getSourceProduct(planType: PlanType): SourceProduct {
  return planType.startsWith("yokage") ? "yokage" : "yaoyouqian";
}

export const upgradeRouter = router({
  /**
   * 取得當前租戶的方案資訊
   */
  getCurrentPlan: protectedProcedure
    .input(z.object({ tenantId: z.number() }))
    .query(async ({ input }) => {
      const { data, error } = await supabase
        .from("tenants")
        .select("id, name, plan_type, enabled_modules, source_product, status")
        .eq("id", input.tenantId)
        .single();

      if (error || !data) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "找不到租戶資訊",
        });
      }

      const planType = (data.plan_type || "yyq_basic") as PlanType;
      const availableUpgrades = UPGRADE_PATHS[planType] || [];

      return {
        tenantId: data.id,
        tenantName: data.name,
        currentPlan: planType,
        currentPlanName: PLAN_DISPLAY_NAMES[planType],
        currentPrice: PLAN_PRICES[planType],
        sourceProduct: (data.source_product || "yaoyouqian") as SourceProduct,
        enabledModules: (data.enabled_modules as string[]) || [],
        availableUpgrades: availableUpgrades.map((p) => ({
          plan: p,
          name: PLAN_DISPLAY_NAMES[p],
          price: PLAN_PRICES[p],
          modules: PLAN_MODULES[p],
        })),
      };
    }),

  /**
   * 取得功能對比表（純靜態資料，無敏感資訊）
   */
  getFeatureComparison: protectedProcedure.query(() => {
    return {
      comparisons: FEATURE_COMPARISONS,
      plans: Object.entries(PLAN_DISPLAY_NAMES).map(([key, name]) => ({
        key: key as PlanType,
        name,
        price: PLAN_PRICES[key as PlanType],
      })),
    };
  }),

  /**
   * 執行方案升級
   *
   * 安全檢查：
   * 1. 驗證升級路徑合法性
   * 2. 使用 service_role 在後端執行 UPDATE
   * 3. 記錄升級日誌
   * 4. 自動更新 enabled_modules
   */
  upgradePlan: protectedProcedure
    .input(
      z.object({
        tenantId: z.number(),
        targetPlan: z.enum([
          "yokage_starter",
          "yokage_pro",
          "yyq_basic",
          "yyq_advanced",
        ]),
        reason: z.string().optional(),
      })
    )
    .mutation(async ({ input }) => {
      // 1. 取得當前租戶資訊
      const { data: tenant, error: fetchError } = await supabase
        .from("tenants")
        .select("id, name, plan_type, source_product, enabled_modules")
        .eq("id", input.tenantId)
        .single();

      if (fetchError || !tenant) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "找不到租戶資訊",
        });
      }

      const currentPlan = (tenant.plan_type || "yyq_basic") as PlanType;
      const targetPlan = input.targetPlan as PlanType;

      // 2. 驗證升級路徑
      const validUpgrades = UPGRADE_PATHS[currentPlan] || [];
      if (!validUpgrades.includes(targetPlan)) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: `不允許從 ${PLAN_DISPLAY_NAMES[currentPlan]} 升級到 ${PLAN_DISPLAY_NAMES[targetPlan]}`,
        });
      }

      // 3. 計算新的 enabled_modules
      const newModules = PLAN_MODULES[targetPlan] || [];
      const newSourceProduct = getSourceProduct(targetPlan);

      // 4. 執行升級（使用 service_role，繞過 RLS）
      const { error: updateError } = await supabase
        .from("tenants")
        .update({
          plan_type: targetPlan,
          source_product: newSourceProduct,
          enabled_modules: newModules,
          updated_at: new Date().toISOString(),
        })
        .eq("id", input.tenantId);

      if (updateError) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: `升級失敗: ${updateError.message}`,
        });
      }

      // 5. 記錄升級日誌
      await supabase.from("product_upgrade_logs").insert({
        tenant_id: input.tenantId,
        from_plan: currentPlan,
        to_plan: targetPlan,
        from_product: tenant.source_product || "yaoyouqian",
        to_product: newSourceProduct,
        upgrade_reason: input.reason || "用戶主動升級",
        metadata: {
          old_modules: tenant.enabled_modules,
          new_modules: newModules,
          timestamp: new Date().toISOString(),
        },
      });

      return {
        success: true,
        tenantId: input.tenantId,
        oldPlan: currentPlan,
        newPlan: targetPlan,
        oldProduct: tenant.source_product || "yaoyouqian",
        newProduct: newSourceProduct,
        enabledModules: newModules,
        message: `已成功從 ${PLAN_DISPLAY_NAMES[currentPlan]} 升級到 ${PLAN_DISPLAY_NAMES[targetPlan]}`,
      };
    }),
});
