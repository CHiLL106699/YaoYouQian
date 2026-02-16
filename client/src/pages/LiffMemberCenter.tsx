/**
 * LIFF 會員中心頁面 - 多租戶 SaaS 版本
 * 深藍底燙金字質感介面，適合手機瀏覽
 */
import { useState, useEffect, useMemo } from "react";
import { initLiff, getLiffProfile, type LiffProfile } from "@/lib/liff";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import { format } from "date-fns";
import { zhTW } from "date-fns/locale";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Loader2, User, Calendar, Ticket, MessageSquare, AlertCircle } from "lucide-react";

export default function LiffMemberCenter() {
  const searchParams = useMemo(() => new URLSearchParams(window.location.search), []);
  const tenantId = searchParams.get("tenantId");

  const [liffProfile, setLiffProfile] = useState<LiffProfile | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLiffLoading, setIsLiffLoading] = useState(true);

  useEffect(() => {
    const initialize = async () => {
      setIsLiffLoading(true);
      if (!tenantId) {
        setError("缺少診所 ID (tenantId)，請確認您是從正確的連結進入。");
        toast.error("無效的連結");
        setIsLiffLoading(false);
        return;
      }

      const liffId = import.meta.env.VITE_LIFF_ID;
      if (!liffId) {
        setError("LIFF 尚未設定，請聯繫診所。");
        setIsLiffLoading(false);
        return;
      }

      try {
        await initLiff(liffId);
        const profile = await getLiffProfile();
        setLiffProfile(profile);
      } catch (err) {
        console.error("LIFF Initialization failed", err);
        setError("LIFF 初始化失敗，請稍後再試。");
        toast.error("無法載入會員資料");
      } finally {
        setIsLiffLoading(false);
      }
    };

    initialize();
  }, [tenantId]);

  // 查詢客戶資料（完整資料：姓名、電話、會員等級等）
  const { data: customerData } = trpc.customer.getByLineUserId.useQuery(
    { lineUserId: liffProfile?.userId ?? "", tenantId: parseInt(tenantId || "0", 10) },
    { enabled: !!liffProfile?.userId && !!tenantId }
  );

  // 查詢預約記錄
  const { data: bookings, isLoading: isBookingsLoading } = trpc.booking.listByCustomer.useQuery(
    { lineUserId: liffProfile?.userId ?? "" },
    { enabled: !!liffProfile?.userId }
  );

  const customerInfo = customerData;

  if (isLiffLoading) {
    return (
      <div className="flex flex-col items-center justify-center h-screen bg-slate-900 text-white">
        <Loader2 className="w-12 h-12 animate-spin text-amber-400" />
        <p className="mt-4 text-lg">會員資料載入中...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-screen bg-slate-900 text-white p-4">
        <AlertCircle className="w-12 h-12 text-red-500" />
        <p className="mt-4 text-lg text-center">發生錯誤</p>
        <p className="text-sm text-gray-400 text-center mt-2">{error}</p>
        <Button onClick={() => window.location.reload()} className="mt-6">
          重試
        </Button>
      </div>
    );
  }

  const displayName = customerInfo?.name || liffProfile?.displayName || "會員";
  const memberId = customerInfo?.id ? `#${String(customerInfo.id).padStart(6, "0")}` : "--";

  // 分類預約
  const now = new Date();
  const upcomingBookings = (bookings || []).filter(
    (b: any) => new Date(b.appointment_date) >= now && b.status !== "cancelled"
  );
  const historyBookings = (bookings || []).filter(
    (b: any) => new Date(b.appointment_date) < now || b.status === "cancelled"
  );

  const getStatusBadge = (status: string) => {
    const config: Record<string, { label: string; className: string }> = {
      pending: { label: "待確認", className: "bg-yellow-500 text-black" },
      approved: { label: "已確認", className: "bg-green-500 text-white" },
      rejected: { label: "已拒絕", className: "bg-red-500 text-white" },
      cancelled: { label: "已取消", className: "bg-gray-500 text-white" },
      completed: { label: "已完成", className: "bg-blue-500 text-white" },
    };
    const c = config[status] || { label: status, className: "bg-gray-500 text-white" };
    return <Badge className={c.className}>{c.label}</Badge>;
  };

  return (
    <div className="min-h-screen bg-slate-900 text-white p-4 font-sans">
      {/* 會員卡 */}
      <Card className="bg-gradient-to-r from-slate-800 to-slate-700 border-amber-500/30 shadow-lg shadow-amber-500/10">
        <CardContent className="flex items-center space-x-4 p-6">
          <Avatar className="w-16 h-16 border-2 border-amber-400">
            <AvatarImage src={liffProfile?.pictureUrl} alt={displayName} />
            <AvatarFallback className="bg-slate-600 text-amber-300 text-xl">
              {displayName.charAt(0)}
            </AvatarFallback>
          </Avatar>
          <div>
            <h2 className="text-2xl font-bold text-amber-300">{displayName}</h2>
            <p className="text-sm text-gray-300">會員編號: {memberId}</p>
          </div>
        </CardContent>
      </Card>

      {/* 功能選單 */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 my-6">
        <Button
          variant="outline"
          className="flex-col h-20 bg-slate-800/50 border-amber-500/30 text-amber-300 hover:bg-slate-700"
          onClick={() => toast.info("個人資料功能即將上線")}
        >
          <User className="w-6 h-6 mb-1" />
          個人資料
        </Button>
        <Button
          variant="outline"
          className="flex-col h-20 bg-slate-800/50 border-amber-500/30 text-amber-300 hover:bg-slate-700"
          onClick={() => {
            const bookingUrl = `/booking?tenantId=${tenantId}`;
            window.location.href = bookingUrl;
          }}
        >
          <Calendar className="w-6 h-6 mb-1" />
          立即預約
        </Button>
        <Button
          variant="outline"
          className="flex-col h-20 bg-slate-800/50 border-amber-500/30 text-amber-300 hover:bg-slate-700"
          onClick={() => toast.info("票券功能即將上線")}
        >
          <Ticket className="w-6 h-6 mb-1" />
          我的票券
        </Button>
        <Button
          variant="outline"
          className="flex-col h-20 bg-slate-800/50 border-amber-500/30 text-amber-300 hover:bg-slate-700"
          onClick={() => toast.info("已為您轉接客服，請稍候")}
        >
          <MessageSquare className="w-6 h-6 mb-1" />
          聯絡客服
        </Button>
      </div>

      {/* 預約記錄 */}
      <Tabs defaultValue="upcoming" className="w-full">
        <TabsList className="grid w-full grid-cols-2 bg-slate-800/50">
          <TabsTrigger
            value="upcoming"
            className="text-amber-300 data-[state=active]:bg-slate-700 data-[state=active]:text-white"
          >
            即將到來 ({upcomingBookings.length})
          </TabsTrigger>
          <TabsTrigger
            value="history"
            className="text-amber-300 data-[state=active]:bg-slate-700 data-[state=active]:text-white"
          >
            歷史紀錄 ({historyBookings.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="upcoming">
          {isBookingsLoading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="w-6 h-6 animate-spin text-amber-400" />
            </div>
          ) : upcomingBookings.length === 0 ? (
            <p className="text-center text-gray-400 mt-8 py-8">目前沒有即將到來的預約</p>
          ) : (
            <div className="space-y-3 mt-4">
              {upcomingBookings.map((booking: any) => (
                <Card key={booking.id} className="bg-slate-800/70 border-amber-500/20">
                  <CardHeader className="pb-2">
                    <CardTitle className="flex justify-between items-center text-amber-400 text-base">
                      <span>{booking.service_name || "療程預約"}</span>
                      {getStatusBadge(booking.status)}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="text-sm text-gray-300 space-y-1">
                    <p>
                      日期:{" "}
                      {booking.appointment_date
                        ? format(new Date(booking.appointment_date), "yyyy/MM/dd (EEEE)", { locale: zhTW })
                        : "--"}
                    </p>
                    <p>時段: {booking.appointment_time || booking.time_slot || "--"}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="history">
          {isBookingsLoading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="w-6 h-6 animate-spin text-amber-400" />
            </div>
          ) : historyBookings.length === 0 ? (
            <p className="text-center text-gray-400 mt-8 py-8">沒有歷史預約記錄</p>
          ) : (
            <div className="space-y-3 mt-4">
              {historyBookings.map((booking: any) => (
                <Card key={booking.id} className="bg-slate-800/70 border-amber-500/20">
                  <CardHeader className="pb-2">
                    <CardTitle className="flex justify-between items-center text-amber-400 text-base">
                      <span>{booking.service_name || "療程預約"}</span>
                      {getStatusBadge(booking.status)}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="text-sm text-gray-300 space-y-1">
                    <p>
                      日期:{" "}
                      {booking.appointment_date
                        ? format(new Date(booking.appointment_date), "yyyy/MM/dd (EEEE)", { locale: zhTW })
                        : "--"}
                    </p>
                    <p>時段: {booking.appointment_time || booking.time_slot || "--"}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
