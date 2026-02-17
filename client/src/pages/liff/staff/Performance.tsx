/**
 * LIFF 員工業績頁面
 * 本月業績統計
 */
import { useMemo } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { TrendingUp, Users, Calendar, DollarSign, Info, Award, Target } from "lucide-react";

const MOCK_STATS = {
  totalRevenue: 186000,
  appointmentCount: 42,
  customerCount: 28,
  completionRate: 95,
  topServices: [
    { name: "玻尿酸注射", count: 12, revenue: 72000 },
    { name: "淨膚雷射", count: 10, revenue: 45000 },
    { name: "肉毒桿菌", count: 8, revenue: 36000 },
    { name: "美白導入", count: 7, revenue: 21000 },
    { name: "皮秒雷射", count: 5, revenue: 12000 },
  ],
};

export default function LiffStaffPerformance() {
  const searchParams = useMemo(() => new URLSearchParams(window.location.search), []);
  const tenantId = searchParams.get("tenantId");
  const currentMonth = new Date().toLocaleDateString("zh-TW", { year: "numeric", month: "long" });

  if (!tenantId) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-br from-[#0a1628] to-[#1a2744] p-4 text-amber-400">
        <Info className="h-12 w-12" />
        <p className="mt-4 text-lg font-semibold">無效的頁面連結</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0a1628] to-[#1a2744] p-4">
      <div className="flex items-center gap-2 mb-2">
        <TrendingUp className="h-6 w-6 text-amber-400" />
        <h1 className="text-xl font-bold text-amber-400">我的業績</h1>
      </div>
      <p className="text-gray-400 text-sm mb-6">{currentMonth}</p>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 gap-3 mb-6">
        <Card className="bg-gradient-to-br from-amber-500/20 to-amber-600/10 border-amber-400/30">
          <CardContent className="p-4 text-center">
            <DollarSign className="h-6 w-6 text-amber-400 mx-auto mb-1" />
            <p className="text-2xl font-bold text-amber-400">NT${(MOCK_STATS.totalRevenue / 10000).toFixed(1)}萬</p>
            <p className="text-gray-400 text-xs mt-1">本月營收</p>
          </CardContent>
        </Card>
        <Card className="bg-gradient-to-br from-blue-500/20 to-blue-600/10 border-blue-400/30">
          <CardContent className="p-4 text-center">
            <Calendar className="h-6 w-6 text-blue-400 mx-auto mb-1" />
            <p className="text-2xl font-bold text-blue-400">{MOCK_STATS.appointmentCount}</p>
            <p className="text-gray-400 text-xs mt-1">預約數</p>
          </CardContent>
        </Card>
        <Card className="bg-gradient-to-br from-green-500/20 to-green-600/10 border-green-400/30">
          <CardContent className="p-4 text-center">
            <Users className="h-6 w-6 text-green-400 mx-auto mb-1" />
            <p className="text-2xl font-bold text-green-400">{MOCK_STATS.customerCount}</p>
            <p className="text-gray-400 text-xs mt-1">服務客戶</p>
          </CardContent>
        </Card>
        <Card className="bg-gradient-to-br from-purple-500/20 to-purple-600/10 border-purple-400/30">
          <CardContent className="p-4 text-center">
            <Target className="h-6 w-6 text-purple-400 mx-auto mb-1" />
            <p className="text-2xl font-bold text-purple-400">{MOCK_STATS.completionRate}%</p>
            <p className="text-gray-400 text-xs mt-1">完成率</p>
          </CardContent>
        </Card>
      </div>

      {/* Top Services */}
      <Card className="bg-white/5 border-amber-400/20">
        <CardContent className="p-4">
          <h3 className="text-amber-400 font-semibold mb-3 flex items-center gap-2">
            <Award className="h-4 w-4" /> 服務排行
          </h3>
          <div className="space-y-3">
            {MOCK_STATS.topServices.map((service, i) => (
              <div key={service.name} className="flex items-center gap-3">
                <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                  i === 0 ? "bg-amber-400 text-black" : i === 1 ? "bg-gray-300 text-black" : i === 2 ? "bg-amber-700 text-white" : "bg-gray-600 text-gray-300"
                }`}>{i + 1}</span>
                <div className="flex-1">
                  <div className="flex justify-between items-center">
                    <span className="text-white text-sm">{service.name}</span>
                    <span className="text-amber-400 text-sm font-mono">NT${service.revenue.toLocaleString()}</span>
                  </div>
                  <div className="w-full bg-white/10 rounded-full h-1.5 mt-1">
                    <div
                      className="bg-gradient-to-r from-amber-400 to-amber-600 h-1.5 rounded-full"
                      style={{ width: `${(service.revenue / MOCK_STATS.topServices[0].revenue) * 100}%` }}
                    />
                  </div>
                </div>
                <Badge className="bg-white/10 text-gray-300 text-xs">{service.count}次</Badge>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
