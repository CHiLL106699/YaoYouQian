/**
 * YoCHiLLSAAS - My Bookings Page
 * 我的預約管理頁面（深藍底燙金字質感介面）
 */

import { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import { Calendar, Clock, FileText, XCircle, RefreshCw, CheckCircle, AlertCircle } from 'lucide-react';
import { format } from 'date-fns';
import { zhTW } from 'date-fns/locale';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

export default function MyBookings() {
  const [selectedBooking, setSelectedBooking] = useState<any>(null);
  const [showCancelDialog, setShowCancelDialog] = useState(false);

  // 查詢我的預約（TODO: 使用真實的 LINE User ID）
  const { data: bookings, refetch, error } = trpc.booking.listByCustomer.useQuery({
    lineUserId: 'test-user-id',
  });

  // 取消預約 Mutation
  const cancelBooking = trpc.booking.cancel.useMutation({
    onSuccess: () => {
      toast.success("預約已取消");
      setShowCancelDialog(false);
      setSelectedBooking(null);
      refetch();
    },
    onError: (error: any) => {
      toast.error(`取消失敗：${error.message}`);
    }
  });

  const handleCancelClick = (booking: any) => {
    setSelectedBooking(booking);
    setShowCancelDialog(true);
  };

  const handleConfirmCancel = () => {
    if (selectedBooking) {
      cancelBooking.mutate({ appointmentId: selectedBooking.id });
    }
  };

  // 狀態顏色與文字
  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return <Badge variant="outline" className="border-yellow-500 text-yellow-500">待確認</Badge>;
      case 'approved':
        return <Badge variant="outline" className="border-green-500 text-green-500">已確認</Badge>;
      case 'completed':
        return <Badge variant="outline" className="border-blue-500 text-blue-500">已完成</Badge>;
      case 'cancelled':
        return <Badge variant="outline" className="border-red-500 text-red-500">已取消</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  // 分類預約：即將到來 vs 歷史記錄
  const upcomingBookings = bookings?.filter((b: any) => 
    ['pending', 'approved'].includes(b.status) && 
    new Date(b.appointment_date) >= new Date()
  ) || [];

  const pastBookings = bookings?.filter((b: any) => 
    ['completed', 'cancelled'].includes(b.status) ||
    new Date(b.appointment_date) < new Date()
  ) || [];

  if (error) {

    return (

      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">

        <p className="text-destructive">載入資料時發生錯誤</p>

        <p className="text-sm text-muted-foreground">{error.message}</p>

        <Button variant="outline" onClick={() => window.location.reload()}>重試</Button>

      </div>

    );

  }


  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0a1929] via-[#0f2942] to-[#1e4976] py-8 px-4">
      <div className="container max-w-6xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gold mb-2">我的預約</h1>
          <p className="text-muted-foreground">查看與管理您的所有預約記錄</p>
        </div>

        {/* Upcoming Bookings */}
        <section className="mb-8">
          <h2 className="text-xl font-bold text-gold mb-4 flex items-center gap-2">
            <Calendar className="w-5 h-5" />
            即將到來的預約
          </h2>
          {upcomingBookings.length === 0 ? (
            <Card className="luxury-card">
              <CardContent className="py-12 text-center">
                <AlertCircle className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground">目前沒有即將到來的預約</p>
                <Button className="btn-gold mt-4" onClick={() => window.location.href = '/booking'}>
                  立即預約
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {upcomingBookings.map((booking: any) => (
                <Card key={booking.id} className="luxury-card">
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div>
                        <CardTitle className="text-gold-solid text-lg">
                          {booking.service || '預約服務'}
                        </CardTitle>
                        <CardDescription className="mt-1">
                          預約編號：#{booking.id}
                        </CardDescription>
                      </div>
                      {getStatusBadge(booking.status)}
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="flex items-center gap-2 text-sm text-foreground">
                      <Calendar className="w-4 h-4 text-primary" />
                      <span>{format(new Date(booking.appointment_date), 'yyyy年MM月dd日 (E)', { locale: zhTW })}</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-foreground">
                      <Clock className="w-4 h-4 text-primary" />
                      <span>{booking.appointment_time}</span>
                    </div>
                    {booking.notes && (
                      <div className="flex items-start gap-2 text-sm text-foreground">
                        <FileText className="w-4 h-4 text-primary mt-0.5" />
                        <span className="text-muted-foreground">{booking.notes}</span>
                      </div>
                    )}
                    <div className="flex gap-2 pt-2">
                      {booking.status === 'pending' && (
                        <Button
                          variant="outline"
                          size="sm"
                          className="flex-1 border-red-500/50 text-red-500 hover:bg-red-500/10"
                          onClick={() => handleCancelClick(booking)}
                        >
                          <XCircle className="w-4 h-4 mr-1" />
                          取消預約
                        </Button>
                      )}
                      {booking.status === 'approved' && (
                        <Button
                          variant="outline"
                          size="sm"
                          className="flex-1 border-gold/50 text-gold hover:bg-gold/10"
                        >
                          <RefreshCw className="w-4 h-4 mr-1" />
                          申請改期
                        </Button>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </section>

        {/* Past Bookings */}
        <section>
          <h2 className="text-xl font-bold text-gold mb-4 flex items-center gap-2">
            <CheckCircle className="w-5 h-5" />
            歷史記錄
          </h2>
          {pastBookings.length === 0 ? (
            <Card className="luxury-card">
              <CardContent className="py-12 text-center">
                <FileText className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground">目前沒有歷史預約記錄</p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-3">
              {pastBookings.map((booking: any) => (
                <Card key={booking.id} className="luxury-card">
                  <CardContent className="py-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div>
                          <p className="font-semibold text-foreground">{booking.service || '預約服務'}</p>
                          <p className="text-sm text-muted-foreground">
                            {format(new Date(booking.appointment_date), 'yyyy/MM/dd')} {booking.appointment_time}
                          </p>
                        </div>
                      </div>
                      {getStatusBadge(booking.status)}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </section>
      </div>

      {/* Cancel Confirmation Dialog */}
      <Dialog open={showCancelDialog} onOpenChange={setShowCancelDialog}>
        <DialogContent className="luxury-card">
          <DialogHeader>
            <DialogTitle className="text-gold-solid">確認取消預約</DialogTitle>
            <DialogDescription>
              您確定要取消此預約嗎？此操作無法復原。
            </DialogDescription>
          </DialogHeader>
          {selectedBooking && (
            <div className="space-y-2 py-4 text-sm text-foreground">
              <p><span className="text-muted-foreground">服務項目：</span>{selectedBooking.service}</p>
              <p><span className="text-muted-foreground">預約日期：</span>{format(new Date(selectedBooking.appointment_date), 'yyyy年MM月dd日', { locale: zhTW })}</p>
              <p><span className="text-muted-foreground">預約時段：</span>{selectedBooking.appointment_time}</p>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCancelDialog(false)}>
              返回
            </Button>
            <Button
              variant="destructive"
              onClick={handleConfirmCancel}
              disabled={cancelBooking.isPending}
            >
              {cancelBooking.isPending ? "取消中..." : "確認取消"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
