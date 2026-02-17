/**
 * YaoYouQian — 升級到高配版 (YOKAGE Pro) 頁面
 * /manage/upgrade
 */
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useTenant } from '@/contexts/TenantContext';
import { trpc } from '@/lib/trpc';
import {
  Sparkles, Bot, BarChart3, Palette, Search, Store,
  Package, Shield, CheckCircle2, ArrowRight, Loader2,
  Zap, Crown, Star, TrendingUp
} from 'lucide-react';

interface FeatureItem {
  icon: React.ElementType;
  title: string;
  description: string;
  tag?: string;
}

const YOKAGE_PRO_FEATURES: FeatureItem[] = [
  {
    icon: Bot,
    title: 'AI 智慧對話機器人',
    description: '整合 GPT 模型，自動回覆客戶諮詢、推薦療程、處理預約變更，24 小時不間斷服務。',
    tag: 'AI',
  },
  {
    icon: BarChart3,
    title: 'A/B 測試推播系統',
    description: '建立多版本推播訊息，自動分群測試，以數據驅動最佳行銷策略。',
    tag: '行銷',
  },
  {
    icon: Search,
    title: '向量搜尋引擎',
    description: '利用 Embedding 技術，實現語意搜尋客戶資料、病歷內容、商品描述，精準度遠超關鍵字搜尋。',
    tag: 'AI',
  },
  {
    icon: Palette,
    title: 'Rich Menu 視覺編輯器',
    description: '拖拉式設計 LINE 圖文選單，內建模板市集，無需設計師即可打造專業品牌形象。',
    tag: 'LINE',
  },
  {
    icon: Store,
    title: '多店管理中心',
    description: '一個帳號管理多家門市，跨店數據彙總、員工調度、庫存調撥。',
    tag: '企業',
  },
  {
    icon: Package,
    title: '進階庫存管理',
    description: '自動補貨提醒、批號追蹤、成本分析、供應商管理，完整 ERP 級庫存控制。',
    tag: 'ERP',
  },
  {
    icon: TrendingUp,
    title: 'BI 數據儀表板',
    description: '即時營收分析、客戶留存率、員工績效排行、療程熱度圖，一目了然的經營全貌。',
    tag: '分析',
  },
  {
    icon: Shield,
    title: '電子病歷系統 (EMR)',
    description: '符合法規的電子病歷管理，支援照片記錄、療程追蹤、同意書電子簽署。',
    tag: '醫療',
  },
];

const PLAN_COMPARISON = [
  { feature: '預約管理', basic: true, pro: true },
  { feature: '客戶管理', basic: true, pro: true },
  { feature: '員工排班', basic: true, pro: true },
  { feature: '一番賞 / 拉霸遊戲', basic: true, pro: true },
  { feature: 'LINE 推播通知', basic: true, pro: true },
  { feature: 'LIFF 會員中心', basic: true, pro: true },
  { feature: 'AI 對話機器人', basic: false, pro: true },
  { feature: 'A/B 測試推播', basic: false, pro: true },
  { feature: '向量語意搜尋', basic: false, pro: true },
  { feature: 'Rich Menu 編輯器', basic: false, pro: true },
  { feature: '多店管理', basic: false, pro: true },
  { feature: '進階庫存 (ERP)', basic: false, pro: true },
  { feature: 'BI 數據儀表板', basic: false, pro: true },
  { feature: '電子病歷 (EMR)', basic: false, pro: true },
  { feature: 'CRM 自動標籤', basic: false, pro: true },
  { feature: '分群推播', basic: false, pro: true },
];

export default function UpgradePage() {
  const { tenantId } = useTenant();
  const [upgradeRequested, setUpgradeRequested] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // 查詢當前租戶升級狀態
  const upgradeStatusQuery = trpc.tenant.getUpgradeStatus.useQuery(
    { tenantId: tenantId! },
    { enabled: !!tenantId }
  );

  const requestUpgradeMutation = trpc.tenant.requestUpgrade.useMutation({
    onSuccess: () => {
      setUpgradeRequested(true);
      setIsSubmitting(false);
      upgradeStatusQuery.refetch();
    },
    onError: () => {
      setIsSubmitting(false);
    },
  });

  const currentStatus = (upgradeStatusQuery.data as any)?.upgradeStatus;
  const currentPlan = (upgradeStatusQuery.data as any)?.planType || 'yyq_basic';
  const isPending = currentStatus === 'pending';
  const isApproved = currentStatus === 'approved';

  const handleRequestUpgrade = () => {
    if (!tenantId) return;
    setIsSubmitting(true);
    requestUpgradeMutation.mutate({ tenantId: tenantId });
  };

  return (
    <div className="p-6 space-y-8 max-w-6xl mx-auto">
      {/* Header */}
      <div className="text-center space-y-3">
        <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-gradient-to-r from-amber-100 to-yellow-100 rounded-full">
          <Crown className="h-4 w-4 text-amber-600" />
          <span className="text-sm font-medium text-amber-700">升級方案</span>
        </div>
        <h1 className="text-3xl font-bold bg-gradient-to-r from-gray-900 to-gray-600 bg-clip-text text-transparent">
          解鎖 YOKAGE 高配版全部功能
        </h1>
        <p className="text-gray-500 max-w-2xl mx-auto">
          從 YaoYouQian 基礎版無縫升級到 YOKAGE 高配版，保留所有現有數據，
          立即獲得 AI 對話、A/B 測試、向量搜尋等企業級功能。
        </p>
      </div>

      {/* Status Banner */}
      {isPending && (
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 flex items-center gap-3">
          <Loader2 className="h-5 w-5 text-amber-500 animate-spin" />
          <div>
            <p className="font-medium text-amber-800">升級請求已送出</p>
            <p className="text-sm text-amber-600">我們的團隊正在審核您的升級請求，通常在 1-2 個工作天內完成。</p>
          </div>
        </div>
      )}
      {isApproved && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-4 flex items-center gap-3">
          <CheckCircle2 className="h-5 w-5 text-green-500" />
          <div>
            <p className="font-medium text-green-800">升級已完成！</p>
            <p className="text-sm text-green-600">您的帳戶已升級為 YOKAGE 高配版，所有進階功能已啟用。</p>
          </div>
        </div>
      )}

      {/* Feature Grid */}
      <div>
        <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
          <Sparkles className="h-5 w-5 text-amber-500" />
          高配版獨家功能
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {YOKAGE_PRO_FEATURES.map((feature) => (
            <Card key={feature.title} className="hover:shadow-md transition-shadow border-gray-200">
              <CardContent className="p-5 space-y-3">
                <div className="flex items-start justify-between">
                  <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-indigo-50 to-purple-50 flex items-center justify-center">
                    <feature.icon className="h-5 w-5 text-indigo-600" />
                  </div>
                  {feature.tag && (
                    <Badge variant="secondary" className="text-xs">{feature.tag}</Badge>
                  )}
                </div>
                <h3 className="font-semibold text-sm">{feature.title}</h3>
                <p className="text-xs text-gray-500 leading-relaxed">{feature.description}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* Comparison Table */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">方案比較</CardTitle>
          <CardDescription>YaoYouQian 基礎版 vs YOKAGE 高配版</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-3 px-4 font-medium text-gray-600">功能</th>
                  <th className="text-center py-3 px-4 font-medium text-gray-600">
                    <div className="flex flex-col items-center gap-1">
                      <span>基礎版</span>
                      <Badge variant="outline" className="text-xs">目前方案</Badge>
                    </div>
                  </th>
                  <th className="text-center py-3 px-4 font-medium text-gray-600">
                    <div className="flex flex-col items-center gap-1">
                      <span>高配版</span>
                      <Badge className="text-xs bg-gradient-to-r from-amber-500 to-yellow-500 border-0">
                        <Star className="h-3 w-3 mr-1" />推薦
                      </Badge>
                    </div>
                  </th>
                </tr>
              </thead>
              <tbody>
                {PLAN_COMPARISON.map((row) => (
                  <tr key={row.feature} className="border-b last:border-0 hover:bg-gray-50">
                    <td className="py-3 px-4 text-gray-700">{row.feature}</td>
                    <td className="py-3 px-4 text-center">
                      {row.basic ? (
                        <CheckCircle2 className="h-5 w-5 text-green-500 mx-auto" />
                      ) : (
                        <span className="text-gray-300">—</span>
                      )}
                    </td>
                    <td className="py-3 px-4 text-center">
                      {row.pro ? (
                        <CheckCircle2 className="h-5 w-5 text-green-500 mx-auto" />
                      ) : (
                        <span className="text-gray-300">—</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* CTA */}
      <div className="text-center space-y-4 py-6">
        {!isPending && !isApproved && currentPlan !== 'yokage_pro' && (
          <>
            <Button
              size="lg"
              className="gap-2 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white px-8 py-6 text-lg rounded-xl shadow-lg"
              onClick={handleRequestUpgrade}
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <Loader2 className="h-5 w-5 animate-spin" />
              ) : (
                <Zap className="h-5 w-5" />
              )}
              {isSubmitting ? '提交中...' : '申請升級到高配版'}
              {!isSubmitting && <ArrowRight className="h-5 w-5" />}
            </Button>
            <p className="text-xs text-gray-400">
              升級後所有現有數據將完整保留，無需重新設定。
            </p>
          </>
        )}
        {upgradeRequested && (
          <p className="text-green-600 font-medium flex items-center justify-center gap-2">
            <CheckCircle2 className="h-5 w-5" />
            升級請求已成功送出！
          </p>
        )}
      </div>
    </div>
  );
}
