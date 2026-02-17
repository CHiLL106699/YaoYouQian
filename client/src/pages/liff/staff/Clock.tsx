/**
 * LIFF 員工打卡頁面
 * 上班打卡 / 下班打卡
 */
import { useState, useMemo, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Clock, LogIn, LogOut, MapPin, Info, CheckCircle2 } from "lucide-react";

export default function LiffStaffClock() {
  const searchParams = useMemo(() => new URLSearchParams(window.location.search), []);
  const tenantId = searchParams.get("tenantId");
  const staffId = searchParams.get("staffId");
  const [currentTime, setCurrentTime] = useState(new Date());
  const [clockedIn, setClockedIn] = useState(false);
  const [clockInTime, setClockInTime] = useState<string | null>(null);
  const [clockOutTime, setClockOutTime] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const handleClockIn = async () => {
    setIsLoading(true);
    // Simulate API call
    await new Promise(r => setTimeout(r, 500));
    const now = new Date().toLocaleTimeString("zh-TW", { hour: "2-digit", minute: "2-digit", second: "2-digit" });
    setClockedIn(true);
    setClockInTime(now);
    toast.success(`上班打卡成功 ${now}`);
    setIsLoading(false);
  };

  const handleClockOut = async () => {
    setIsLoading(true);
    await new Promise(r => setTimeout(r, 500));
    const now = new Date().toLocaleTimeString("zh-TW", { hour: "2-digit", minute: "2-digit", second: "2-digit" });
    setClockOutTime(now);
    toast.success(`下班打卡成功 ${now}`);
    setIsLoading(false);
  };

  if (!tenantId) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-br from-[#0a1628] to-[#1a2744] p-4 text-amber-400">
        <Info className="h-12 w-12" />
        <p className="mt-4 text-lg font-semibold">無效的頁面連結</p>
      </div>
    );
  }

  const timeStr = currentTime.toLocaleTimeString("zh-TW", { hour: "2-digit", minute: "2-digit", second: "2-digit" });
  const dateStr = currentTime.toLocaleDateString("zh-TW", { year: "numeric", month: "long", day: "numeric", weekday: "long" });

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0a1628] to-[#1a2744] flex flex-col items-center justify-center p-4">
      {/* Current Time */}
      <div className="text-center mb-8">
        <p className="text-gray-400 text-sm mb-1">{dateStr}</p>
        <p className="text-5xl font-mono font-bold text-white tracking-wider">{timeStr}</p>
      </div>

      {/* Clock Button */}
      <div className="mb-8">
        {!clockedIn ? (
          <Button
            size="lg"
            className="w-40 h-40 rounded-full bg-gradient-to-br from-green-500 to-green-700 hover:from-green-600 hover:to-green-800 text-white shadow-2xl shadow-green-500/30 flex flex-col items-center justify-center gap-2"
            onClick={handleClockIn}
            disabled={isLoading}
          >
            <LogIn className="h-10 w-10" />
            <span className="text-lg font-bold">上班打卡</span>
          </Button>
        ) : !clockOutTime ? (
          <Button
            size="lg"
            className="w-40 h-40 rounded-full bg-gradient-to-br from-red-500 to-red-700 hover:from-red-600 hover:to-red-800 text-white shadow-2xl shadow-red-500/30 flex flex-col items-center justify-center gap-2"
            onClick={handleClockOut}
            disabled={isLoading}
          >
            <LogOut className="h-10 w-10" />
            <span className="text-lg font-bold">下班打卡</span>
          </Button>
        ) : (
          <div className="w-40 h-40 rounded-full bg-gradient-to-br from-gray-600 to-gray-800 flex flex-col items-center justify-center gap-2 text-white">
            <CheckCircle2 className="h-10 w-10 text-green-400" />
            <span className="text-sm font-bold">今日已完成</span>
          </div>
        )}
      </div>

      {/* Today's Record */}
      <Card className="w-full max-w-sm bg-white/5 border-amber-400/20">
        <CardContent className="p-4">
          <h3 className="text-amber-400 font-semibold mb-3 flex items-center gap-2">
            <Clock className="h-4 w-4" /> 今日打卡記錄
          </h3>
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <span className="text-gray-400 text-sm">上班時間</span>
              {clockInTime ? (
                <Badge className="bg-green-500/20 text-green-300">{clockInTime}</Badge>
              ) : (
                <span className="text-gray-500 text-sm">尚未打卡</span>
              )}
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-400 text-sm">下班時間</span>
              {clockOutTime ? (
                <Badge className="bg-red-500/20 text-red-300">{clockOutTime}</Badge>
              ) : (
                <span className="text-gray-500 text-sm">尚未打卡</span>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
