/**
 * LIFF 員工今日預約頁面
 */
import { useMemo } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Calendar, Clock, User, Info } from "lucide-react";

const STATUS_MAP: Record<string, { label: string; className: string }> = {
  pending: { label: "待確認", className: "bg-yellow-500/20 text-yellow-300" },
  approved: { label: "已確認", className: "bg-green-500/20 text-green-300" },
  completed: { label: "已完成", className: "bg-blue-500/20 text-blue-300" },
  cancelled: { label: "已取消", className: "bg-red-500/20 text-red-300" },
};

const MOCK_APPOINTMENTS = [
  { id: 1, time: "09:00", customerName: "王小明", service: "玻尿酸注射", status: "approved", notes: "第二次療程" },
  { id: 2, time: "10:30", customerName: "李美麗", service: "淨膚雷射", status: "approved", notes: null },
  { id: 3, time: "13:00", customerName: "張大華", service: "肉毒桿菌", status: "pending", notes: "初診" },
  { id: 4, time: "14:30", customerName: "陳小芳", service: "美白導入", status: "approved", notes: null },
  { id: 5, time: "16:00", customerName: "林志偉", service: "皮秒雷射", status: "pending", notes: "敏感肌膚" },
];

export default function LiffStaffAppointments() {
  const searchParams = useMemo(() => new URLSearchParams(window.location.search), []);
  const tenantId = searchParams.get("tenantId");
  const today = new Date().toLocaleDateString("zh-TW", { year: "numeric", month: "long", day: "numeric", weekday: "long" });

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
        <Calendar className="h-6 w-6 text-amber-400" />
        <h1 className="text-xl font-bold text-amber-400">今日預約</h1>
      </div>
      <p className="text-gray-400 text-sm mb-4">{today}</p>

      <div className="flex items-center gap-2 mb-4">
        <Badge className="bg-amber-500/20 text-amber-300">共 {MOCK_APPOINTMENTS.length} 筆預約</Badge>
      </div>

      <div className="space-y-3">
        {MOCK_APPOINTMENTS.map(apt => {
          const statusInfo = STATUS_MAP[apt.status] || STATUS_MAP.pending;
          return (
            <Card key={apt.id} className="bg-white/5 border-amber-400/20">
              <CardContent className="p-4">
                <div className="flex items-start justify-between">
                  <div className="flex gap-3">
                    <div className="text-center min-w-[50px]">
                      <Clock className="h-4 w-4 text-amber-400 mx-auto mb-1" />
                      <p className="text-white font-mono font-bold text-sm">{apt.time}</p>
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <User className="h-3.5 w-3.5 text-gray-400" />
                        <span className="text-white font-medium">{apt.customerName}</span>
                      </div>
                      <p className="text-amber-400/80 text-sm mt-0.5">{apt.service}</p>
                      {apt.notes && <p className="text-gray-500 text-xs mt-1">{apt.notes}</p>}
                    </div>
                  </div>
                  <Badge className={statusInfo.className}>{statusInfo.label}</Badge>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
