/**
 * Sprint 4: 升級到高配版頁面
 * 路徑: /manage/upgrade
 *
 * 顯示 YOKAGE 高配版的功能對比表，
 * 並提供升級按鈕觸發 plan_type 變更。
 */
import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { trpc } from "@/lib/trpc";
import { useTenant } from "@/contexts/TenantContext";
import { toast } from "sonner";
import {
  Crown,
  Check,
  X,
  Zap,
  ArrowUpRight,
  Loader2,
  Sparkles,
  Shield,
  Brain,
  BarChart3,
  Search,
  Store,
  Boxes,
  Megaphone,
} from "lucide-react";
import type { PlanType } from "../../../../shared/shared-types";
import { PLAN_DISPLAY_NAMES, PLAN_PRICES } from "../../../../shared/shared-types";

/** 方案 Badge 顏色 */
function PlanBadge({ plan }: { plan: PlanType }) {
  const colorMap: Record<string, string> = {
    yyq_basic: "bg-gray-500",
    yyq_advanced: "bg-blue-500",
    yokage_starter: "bg-purple-500",
    yokage_pro: "bg-amber-500",
  };
  return (
    <Badge className={`${colorMap[plan] || "bg-gray-500"} text-white`}>
      {PLAN_DISPLAY_NAMES[plan]}
    </Badge>
  );
}

/** YOKAGE Pro 專屬功能 icon */
const proFeatureIcons: Record<string, React.ReactNode> = {
  "AI 對話機器人": <Brain className="h-5 w-5 text-purple-500" />,
  "BI 儀表板": <BarChart3 className="h-5 w-5 text-blue-500" />,
  "A/B 測試": <Sparkles className="h-5 w-5 text-amber-500" />,
  "向量搜尋": <Search className="h-5 w-5 text-green-500" />,
  "EMR 電子病歷": <Shield className="h-5 w-5 text-red-500" />,
  "多店管理": <Store className="h-5 w-5 text-cyan-500" />,
  "進階庫存": <Boxes className="h-5 w-5 text-orange-500" />,
  "精準行銷": <Megaphone className="h-5 w-5 text-pink-500" />,
  "Rich Menu 編輯器": <Sparkles className="h-5 w-5 text-indigo-500" />,
};

export default function UpgradePlan() {
  const { tenantId } = useTenant();
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<PlanType | null>(null);

  const currentPlanQuery = trpc.upgrade.getCurrentPlan.useQuery(
    { tenantId: tenantId! },
    { enabled: !!tenantId }
  );

  const featureQuery = trpc.upgrade.getFeatureComparison.useQuery();

  const upgradeMutation = trpc.upgrade.upgradePlan.useMutation({
    onSuccess: (result) => {
      toast.success(result.message);
      setConfirmOpen(false);
      setSelectedPlan(null);
      currentPlanQuery.refetch();
    },
    onError: (error) => {
      toast.error(`升級失敗: ${error.message}`);
    },
  });

  const currentPlan = currentPlanQuery.data;
  const features = featureQuery.data;

  if (!tenantId) {
    return (
      <div className="p-6">
        <p className="text-muted-foreground">請先選擇租戶</p>
      </div>
    );
  }

  if (currentPlanQuery.isLoading || featureQuery.isLoading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  const handleUpgradeClick = (plan: PlanType) => {
    setSelectedPlan(plan);
    setConfirmOpen(true);
  };

  const handleConfirmUpgrade = () => {
    if (!selectedPlan || !tenantId) return;
    upgradeMutation.mutate({
      tenantId,
      targetPlan: selectedPlan,
      reason: "用戶從管理後台主動升級",
    });
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Crown className="h-6 w-6 text-amber-500" />
            升級方案
          </h1>
          <p className="text-muted-foreground mt-1">
            解鎖更多強大功能，提升您的業務效率
          </p>
        </div>
        {currentPlan && <PlanBadge plan={currentPlan.currentPlan} />}
      </div>

      {/* Current Plan Info */}
      {currentPlan && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">目前方案</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xl font-semibold">{currentPlan.currentPlanName}</p>
                <p className="text-sm text-muted-foreground mt-1">
                  已啟用 {currentPlan.enabledModules.length} 個模組
                </p>
              </div>
              <div className="text-right">
                <p className="text-2xl font-bold">
                  NT$ {currentPlan.currentPrice.toLocaleString()}
                </p>
                <p className="text-sm text-muted-foreground">/ 月</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Available Upgrades */}
      {currentPlan && currentPlan.availableUpgrades.length > 0 && (
        <div className="space-y-4">
          <h2 className="text-lg font-semibold">可升級方案</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {currentPlan.availableUpgrades.map((upgrade) => {
              const isProPlan = upgrade.plan === "yokage_pro";
              return (
                <Card
                  key={upgrade.plan}
                  className={`relative ${isProPlan ? "border-amber-500 border-2 shadow-lg" : ""}`}
                >
                  {isProPlan && (
                    <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                      <Badge className="bg-amber-500 text-white">
                        <Sparkles className="h-3 w-3 mr-1" />
                        推薦
                      </Badge>
                    </div>
                  )}
                  <CardHeader>
                    <CardTitle className="text-lg">{upgrade.name}</CardTitle>
                    <CardDescription>
                      {upgrade.modules.length} 個功能模組
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <p className="text-3xl font-bold">
                        NT$ {upgrade.price.toLocaleString()}
                      </p>
                      <p className="text-sm text-muted-foreground">/ 月</p>
                    </div>
                    <Separator />
                    <div className="space-y-2">
                      {upgrade.modules.slice(0, 8).map((mod) => (
                        <div key={mod} className="flex items-center gap-2 text-sm">
                          <Check className="h-4 w-4 text-green-500 shrink-0" />
                          <span>{mod}</span>
                        </div>
                      ))}
                      {upgrade.modules.length > 8 && (
                        <p className="text-xs text-muted-foreground">
                          還有 {upgrade.modules.length - 8} 個模組...
                        </p>
                      )}
                    </div>
                    <Button
                      className="w-full"
                      variant={isProPlan ? "default" : "outline"}
                      onClick={() => handleUpgradeClick(upgrade.plan)}
                    >
                      <ArrowUpRight className="h-4 w-4 mr-1" />
                      升級到 {upgrade.name}
                    </Button>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      )}

      {/* No upgrades available */}
      {currentPlan && currentPlan.availableUpgrades.length === 0 && (
        <Card>
          <CardContent className="p-8 text-center">
            <Crown className="h-12 w-12 text-amber-500 mx-auto mb-4" />
            <h3 className="text-lg font-semibold">您已是最高級方案</h3>
            <p className="text-muted-foreground mt-2">
              您目前使用的是 {currentPlan.currentPlanName}，已擁有所有功能。
            </p>
          </CardContent>
        </Card>
      )}

      {/* Feature Comparison Table */}
      {features && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Zap className="h-5 w-5 text-amber-500" />
              功能對比表
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[200px]">功能</TableHead>
                    <TableHead className="text-center">YYQ 基礎版</TableHead>
                    <TableHead className="text-center">YYQ 進階版</TableHead>
                    <TableHead className="text-center">YOKAGE 入門版</TableHead>
                    <TableHead className="text-center bg-amber-50 dark:bg-amber-950/20">
                      YOKAGE 高配版
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {features.comparisons.map((category) => (
                    <React.Fragment key={category.category}>
                      <TableRow>
                        <TableCell
                          colSpan={5}
                          className="bg-muted/50 font-semibold text-sm"
                        >
                          {category.category}
                        </TableCell>
                      </TableRow>
                      {category.features.map((feature) => (
                        <TableRow key={feature.name}>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              {proFeatureIcons[feature.name] || null}
                              <div>
                                <p className="font-medium text-sm">{feature.name}</p>
                                <p className="text-xs text-muted-foreground">
                                  {feature.description}
                                </p>
                              </div>
                            </div>
                          </TableCell>
                          <TableCell className="text-center">
                            {renderFeatureValue(feature.yyqBasic)}
                          </TableCell>
                          <TableCell className="text-center">
                            {renderFeatureValue(feature.yyqAdvanced)}
                          </TableCell>
                          <TableCell className="text-center">
                            {renderFeatureValue(feature.yokageStarter)}
                          </TableCell>
                          <TableCell className="text-center bg-amber-50/50 dark:bg-amber-950/10">
                            {renderFeatureValue(feature.yokagePro)}
                          </TableCell>
                        </TableRow>
                      ))}
                    </React.Fragment>
                  ))}
                </TableBody>
              </Table>
            </div>
            {/* Price Row */}
            <div className="mt-4 grid grid-cols-4 gap-2 text-center">
              {(["yyq_basic", "yyq_advanced", "yokage_starter", "yokage_pro"] as PlanType[]).map(
                (plan) => (
                  <div key={plan} className="p-3 rounded-lg bg-muted/30">
                    <p className="text-xs text-muted-foreground">{PLAN_DISPLAY_NAMES[plan]}</p>
                    <p className="text-lg font-bold mt-1">
                      NT$ {PLAN_PRICES[plan].toLocaleString()}
                    </p>
                    <p className="text-xs text-muted-foreground">/ 月</p>
                  </div>
                )
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Upgrade Confirmation Dialog */}
      <Dialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>確認升級方案</DialogTitle>
            <DialogDescription>
              {selectedPlan && currentPlan && (
                <>
                  您即將從{" "}
                  <strong>{currentPlan.currentPlanName}</strong> 升級到{" "}
                  <strong>{PLAN_DISPLAY_NAMES[selectedPlan]}</strong>。
                  <br />
                  <br />
                  升級後：
                  <ul className="list-disc list-inside mt-2 space-y-1">
                    <li>所有現有資料（客戶、預約、員工）將完整保留</li>
                    <li>
                      月費將調整為 NT${" "}
                      {PLAN_PRICES[selectedPlan].toLocaleString()}
                    </li>
                    <li>新功能模組將立即啟用</li>
                  </ul>
                </>
              )}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setConfirmOpen(false)}
              disabled={upgradeMutation.isPending}
            >
              取消
            </Button>
            <Button
              onClick={handleConfirmUpgrade}
              disabled={upgradeMutation.isPending}
            >
              {upgradeMutation.isPending ? (
                <>
                  <Loader2 className="h-4 w-4 mr-1 animate-spin" />
                  升級中...
                </>
              ) : (
                <>
                  <ArrowUpRight className="h-4 w-4 mr-1" />
                  確認升級
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

/** 渲染功能值（布林或字串） */
function renderFeatureValue(value: boolean | string) {
  if (typeof value === "boolean") {
    return value ? (
      <Check className="h-5 w-5 text-green-500 mx-auto" />
    ) : (
      <X className="h-5 w-5 text-gray-300 mx-auto" />
    );
  }
  return <span className="text-sm">{value}</span>;
}
