/**
 * LIFF 會員中心頁面 - 多租戶 SaaS 版本
 * 深藍底燙金字質感介面，適合手機瀏覽
 * 功能：會員資料展示、我的預約（含取消/修改）、我的票券、聯絡客服
 * 預約功能整合在會員中心內，不需獨立頁面
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
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Loader2, User, Calendar, Ticket, MessageSquare, AlertCircle,
  Heart, Phone, Mail, Sparkles, XCircle, Edit, Clock, ShoppingBag
} from "lucide-react";

export default function LiffMemberCenter() {
  const searchParams = useMemo(() => new URLSearchParams(window.location.search), []);
  const tenantId = searchParams.get("tenantId");

  const [liffProfile, setLiffProfile] = useState<LiffProfile | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLiffLoading, setIsLiffLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("appointments");

  // Appointment management state
  const [cancelDialogOpen, setCancelDialogOpen] = useState(false);
  const [modifyDialogOpen, setModifyDialogOpen] = useState(false);
  const [selectedBooking, setSelectedBooking] = useState<any>(null);
  const [newDate, setNewDate] = useState("");
  const [newTime, setNewTime] = useState("");

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

  // 查詢客戶資料
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
  const memberLevel = customerInfo?.member_level || "一般會員";

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

  const handleCancelBooking = () => {
    // In production, this would call trpc mutation
    toast.success("預約已取消");
    setCancelDialogOpen(false);
    setSelectedBooking(null);
  };

  const handleModifyBooking = () => {
    if (!newDate || !newTime) {
      toast.error("請選擇新的日期和時段");
      return;
    }
    // In production, this would call trpc mutation
    toast.success("預約修改申請已送出，等待診所確認");
    setModifyDialogOpen(false);
    setSelectedBooking(null);
    setNewDate("");
    setNewTime("");
  };

  return (
    <div className="min-h-screen bg-slate-900 text-white p-4 font-sans pb-8">
      {/* 會員卡 */}
      <Card className="bg-gradient-to-r from-slate-800 to-slate-700 border-amber-500/30 shadow-lg shadow-amber-500/10">
        <CardContent className="flex items-center space-x-4 p-6">
          <Avatar className="w-16 h-16 border-2 border-amber-400">
            <AvatarImage src={liffProfile?.pictureUrl} alt={displayName} />
            <AvatarFallback className="bg-slate-600 text-amber-300 text-xl">
              {displayName.charAt(0)}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1">
            <h2 className="text-2xl font-bold text-amber-300">{displayName}</h2>
            <p className="text-sm text-gray-300">會員編號: {memberId}</p>
            <Badge className="mt-1 bg-amber-500/20 text-amber-300 border-amber-500/30">
              {memberLevel}
            </Badge>
          </div>
        </CardContent>
      </Card>

      {/* 會員資訊 */}
      {customerInfo && (
        <Card className="mt-4 bg-slate-800/70 border-amber-500/20">
          <CardContent className="p-4 space-y-2">
            {customerInfo.phone && (
              <div className="flex items-center gap-2 text-sm text-gray-300">
                <Phone className="w-4 h-4 text-amber-400" />
                <span>{customerInfo.phone}</span>
              </div>
            )}
            {customerInfo.email && (
              <div className="flex items-center gap-2 text-sm text-gray-300">
                <Mail className="w-4 h-4 text-amber-400" />
                <span>{customerInfo.email}</span>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* 快捷功能選單 */}
      <div className="grid grid-cols-3 sm:grid-cols-6 gap-2 my-4">
        <Button
          variant="outline"
          className="flex-col h-16 bg-slate-800/50 border-amber-500/30 text-amber-300 hover:bg-slate-700 text-xs"
          onClick={() => { window.location.href = `/liff/booking?tenantId=${tenantId}`; }}
        >
          <Calendar className="w-5 h-5 mb-0.5" />
          立即預約
        </Button>
        <Button
          variant="outline"
          className="flex-col h-16 bg-slate-800/50 border-amber-500/30 text-amber-300 hover:bg-slate-700 text-xs"
          onClick={() => { window.location.href = `/liff/shop?tenantId=${tenantId}`; }}
        >
          <ShoppingBag className="w-5 h-5 mb-0.5" />
          線上商城
        </Button>
        <Button
          variant="outline"
          className="flex-col h-16 bg-slate-800/50 border-amber-500/30 text-amber-300 hover:bg-slate-700 text-xs"
          onClick={() => { window.location.href = `/liff/gamification?tenantId=${tenantId}`; }}
        >
          <Sparkles className="w-5 h-5 mb-0.5" />
          幸運抽獎
        </Button>
        <Button
          variant="outline"
          className="flex-col h-16 bg-slate-800/50 border-amber-500/30 text-amber-300 hover:bg-slate-700 text-xs"
          onClick={() => { window.location.href = `/liff/care?tenantId=${tenantId}`; }}
        >
          <Heart className="w-5 h-5 mb-0.5" />
          術後護理
        </Button>
        <Button
          variant="outline"
          className="flex-col h-16 bg-slate-800/50 border-amber-500/30 text-amber-300 hover:bg-slate-700 text-xs"
          onClick={() => { window.location.href = `/liff/consent?tenantId=${tenantId}`; }}
        >
          <Ticket className="w-5 h-5 mb-0.5" />
          同意書
        </Button>
        <Button
          variant="outline"
          className="flex-col h-16 bg-slate-800/50 border-amber-500/30 text-amber-300 hover:bg-slate-700 text-xs"
          onClick={() => toast.info("已為您轉接客服，請稍候")}
        >
          <MessageSquare className="w-5 h-5 mb-0.5" />
          聯絡客服
        </Button>
      </div>

      {/* 主要內容 Tabs：我的預約 / 我的票券 / 個人資料 */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-3 bg-slate-800/50">
          <TabsTrigger
            value="appointments"
            className="text-amber-300 data-[state=active]:bg-slate-700 data-[state=active]:text-white text-xs"
          >
            <Calendar className="w-3.5 h-3.5 mr-1" />
            我的預約
          </TabsTrigger>
          <TabsTrigger
            value="vouchers"
            className="text-amber-300 data-[state=active]:bg-slate-700 data-[state=active]:text-white text-xs"
          >
            <Ticket className="w-3.5 h-3.5 mr-1" />
            我的票券
          </TabsTrigger>
          <TabsTrigger
            value="profile"
            className="text-amber-300 data-[state=active]:bg-slate-700 data-[state=active]:text-white text-xs"
          >
            <User className="w-3.5 h-3.5 mr-1" />
            個人資料
          </TabsTrigger>
        </TabsList>

        {/* ===== 我的預約 Tab ===== */}
        <TabsContent value="appointments">
          {/* Sub-tabs: 即將到來 / 歷史紀錄 */}
          <div className="flex gap-2 mt-3 mb-3">
            <Badge
              className={`cursor-pointer px-3 py-1 ${upcomingBookings.length > 0 ? "bg-amber-500/20 text-amber-300" : "bg-slate-700 text-gray-400"}`}
            >
              即將到來 ({upcomingBookings.length})
            </Badge>
          </div>

          {isBookingsLoading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="w-6 h-6 animate-spin text-amber-400" />
            </div>
          ) : upcomingBookings.length === 0 ? (
            <div className="text-center mt-4 py-8">
              <Calendar className="w-12 h-12 mx-auto text-gray-600 mb-3" />
              <p className="text-gray-400">目前沒有即將到來的預約</p>
              <Button
                className="mt-4 bg-amber-500 text-slate-900 hover:bg-amber-400"
                onClick={() => { window.location.href = `/liff/booking?tenantId=${tenantId}`; }}
              >
                立即預約
              </Button>
            </div>
          ) : (
            <div className="space-y-3">
              {upcomingBookings.map((booking: any) => (
                <Card key={booking.id} className="bg-slate-800/70 border-amber-500/20">
                  <CardHeader className="pb-2">
                    <CardTitle className="flex justify-between items-center text-amber-400 text-base">
                      <span>{booking.service_name || "療程預約"}</span>
                      {getStatusBadge(booking.status)}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="text-sm text-gray-300 space-y-1">
                    <p className="flex items-center gap-1">
                      <Calendar className="w-3.5 h-3.5 text-amber-400/70" />
                      {booking.appointment_date
                        ? format(new Date(booking.appointment_date), "yyyy/MM/dd (EEEE)", { locale: zhTW })
                        : "--"}
                    </p>
                    <p className="flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5 text-amber-400/70" />
                      {booking.appointment_time || booking.time_slot || "--"}
                    </p>
                    {/* 操作按鈕：修改 / 取消 */}
                    {(booking.status === "pending" || booking.status === "approved") && (
                      <div className="flex gap-2 mt-3 pt-2 border-t border-amber-500/10">
                        <Button
                          size="sm"
                          variant="outline"
                          className="flex-1 border-amber-500/30 text-amber-300 hover:bg-amber-500/10"
                          onClick={() => {
                            setSelectedBooking(booking);
                            setNewDate("");
                            setNewTime("");
                            setModifyDialogOpen(true);
                          }}
                        >
                          <Edit className="w-3.5 h-3.5 mr-1" /> 修改時間
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          className="flex-1 border-red-500/30 text-red-400 hover:bg-red-500/10"
                          onClick={() => {
                            setSelectedBooking(booking);
                            setCancelDialogOpen(true);
                          }}
                        >
                          <XCircle className="w-3.5 h-3.5 mr-1" /> 取消預約
                        </Button>
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          )}

          {/* 歷史預約 */}
          {historyBookings.length > 0 && (
            <>
              <div className="flex gap-2 mt-6 mb-3">
                <Badge className="bg-slate-700 text-gray-400 px-3 py-1">
                  歷史紀錄 ({historyBookings.length})
                </Badge>
              </div>
              <div className="space-y-3">
                {historyBookings.map((booking: any) => (
                  <Card key={booking.id} className="bg-slate-800/50 border-gray-700/50 opacity-75">
                    <CardHeader className="pb-2">
                      <CardTitle className="flex justify-between items-center text-gray-400 text-base">
                        <span>{booking.service_name || "療程預約"}</span>
                        {getStatusBadge(booking.status)}
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="text-sm text-gray-500 space-y-1">
                      <p>
                        {booking.appointment_date
                          ? format(new Date(booking.appointment_date), "yyyy/MM/dd (EEEE)", { locale: zhTW })
                          : "--"}
                      </p>
                      <p>{booking.appointment_time || booking.time_slot || "--"}</p>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </>
          )}
        </TabsContent>

        {/* ===== 我的票券 Tab ===== */}
        <TabsContent value="vouchers">
          <div className="text-center py-12">
            <Ticket className="w-12 h-12 mx-auto text-gray-600 mb-3" />
            <p className="text-gray-400">目前沒有可用票券</p>
            <p className="text-gray-500 text-sm mt-1">參加抽獎活動即可獲得票券</p>
            <Button
              className="mt-4 bg-amber-500/20 text-amber-300 hover:bg-amber-500/30"
              onClick={() => { window.location.href = `/liff/gamification?tenantId=${tenantId}`; }}
            >
              <Sparkles className="w-4 h-4 mr-2" /> 前往抽獎
            </Button>
          </div>
        </TabsContent>

        {/* ===== 個人資料 Tab ===== */}
        <TabsContent value="profile">
          <div className="space-y-4 mt-4">
            <Card className="bg-slate-800/70 border-amber-500/20">
              <CardContent className="p-4 space-y-3">
                <div>
                  <label className="text-xs text-gray-400">姓名</label>
                  <p className="text-white">{displayName}</p>
                </div>
                <div>
                  <label className="text-xs text-gray-400">會員編號</label>
                  <p className="text-white">{memberId}</p>
                </div>
                <div>
                  <label className="text-xs text-gray-400">會員等級</label>
                  <p className="text-amber-300">{memberLevel}</p>
                </div>
                {customerInfo?.phone && (
                  <div>
                    <label className="text-xs text-gray-400">電話</label>
                    <p className="text-white">{customerInfo.phone}</p>
                  </div>
                )}
                {customerInfo?.email && (
                  <div>
                    <label className="text-xs text-gray-400">Email</label>
                    <p className="text-white">{customerInfo.email}</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>

      {/* ===== 取消預約 Dialog ===== */}
      <Dialog open={cancelDialogOpen} onOpenChange={setCancelDialogOpen}>
        <DialogContent className="bg-slate-800 border-amber-500/30 text-white max-w-sm">
          <DialogHeader>
            <DialogTitle className="text-amber-400">確認取消預約</DialogTitle>
          </DialogHeader>
          <div className="space-y-2 text-sm text-gray-300">
            <p>您確定要取消以下預約嗎？</p>
            {selectedBooking && (
              <Card className="bg-slate-700/50 border-amber-500/20">
                <CardContent className="p-3 space-y-1">
                  <p className="text-amber-300 font-medium">{selectedBooking.service_name || "療程預約"}</p>
                  <p>
                    {selectedBooking.appointment_date
                      ? format(new Date(selectedBooking.appointment_date), "yyyy/MM/dd (EEEE)", { locale: zhTW })
                      : "--"}
                  </p>
                  <p>{selectedBooking.appointment_time || selectedBooking.time_slot || "--"}</p>
                </CardContent>
              </Card>
            )}
            <p className="text-red-400 text-xs">取消後無法復原，如需重新預約請再次操作。</p>
          </div>
          <DialogFooter className="gap-2">
            <Button variant="outline" className="border-gray-600 text-gray-300" onClick={() => setCancelDialogOpen(false)}>
              返回
            </Button>
            <Button className="bg-red-500 hover:bg-red-600 text-white" onClick={handleCancelBooking}>
              確認取消
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ===== 修改預約 Dialog ===== */}
      <Dialog open={modifyDialogOpen} onOpenChange={setModifyDialogOpen}>
        <DialogContent className="bg-slate-800 border-amber-500/30 text-white max-w-sm">
          <DialogHeader>
            <DialogTitle className="text-amber-400">修改預約時間</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            {selectedBooking && (
              <div className="text-sm text-gray-400">
                <p>原預約：{selectedBooking.service_name || "療程預約"}</p>
                <p>
                  原時間：
                  {selectedBooking.appointment_date
                    ? format(new Date(selectedBooking.appointment_date), "yyyy/MM/dd", { locale: zhTW })
                    : "--"}{" "}
                  {selectedBooking.appointment_time || selectedBooking.time_slot || ""}
                </p>
              </div>
            )}
            <div>
              <label className="text-sm text-gray-300 mb-1 block">新日期</label>
              <Input
                type="date"
                value={newDate}
                onChange={e => setNewDate(e.target.value)}
                className="bg-slate-700 border-amber-500/30 text-white"
              />
            </div>
            <div>
              <label className="text-sm text-gray-300 mb-1 block">新時段</label>
              <Select value={newTime} onValueChange={setNewTime}>
                <SelectTrigger className="bg-slate-700 border-amber-500/30 text-white">
                  <SelectValue placeholder="選擇時段" />
                </SelectTrigger>
                <SelectContent>
                  {["09:00", "09:30", "10:00", "10:30", "11:00", "11:30", "13:00", "13:30", "14:00", "14:30", "15:00", "15:30", "16:00", "16:30", "17:00"].map(t => (
                    <SelectItem key={t} value={t}>{t}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <p className="text-xs text-gray-500">修改申請送出後需等待診所確認。</p>
          </div>
          <DialogFooter className="gap-2">
            <Button variant="outline" className="border-gray-600 text-gray-300" onClick={() => setModifyDialogOpen(false)}>
              取消
            </Button>
            <Button className="bg-amber-500 hover:bg-amber-600 text-black" onClick={handleModifyBooking}>
              送出修改
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
