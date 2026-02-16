import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Calendar } from "@/components/ui/calendar";
import { format } from "date-fns";
import liff from "@line/liff";
import { trpc } from "@/lib/trpc";
import { useLiffTenant } from "@/hooks/useLiffTenant";

interface Appointment {
  id: string;
  service: string;
  date: string;
}

const MyAppointments: React.FC = () => {
  const { tenantId } = useLiffTenant();
  const [lineUserId, setLineUserId] = useState<string | null>(null);
  const [selectedAppointment, setSelectedAppointment] = useState<Appointment | null>(null);
  const [isCancelDialogOpen, setIsCancelDialogOpen] = useState(false);
  const [isRescheduleDialogOpen, setIsRescheduleDialogOpen] = useState(false);
  const [newDate, setNewDate] = useState<Date | undefined>(new Date());
  const [liffError, setLiffError] = useState<string | null>(null);
  const [isLiffReady, setIsLiffReady] = useState(false);

  useEffect(() => {
    const initLiffApp = async () => {
      try {
        await liff.init({
          liffId: import.meta.env.VITE_LIFF_ID,
          withLoginOnExternalBrowser: true,
        });
        if (!liff.isLoggedIn()) {
          liff.login();
          return;
        }
        const profile = await liff.getProfile();
        setLineUserId(profile.userId);
        setIsLiffReady(true);
      } catch (err: any) {
        setLiffError(err.toString());
      }
    };
    initLiffApp();
  }, []);

  // 使用 tRPC 查詢我的預約
  const { data: rawAppointments, isLoading, error, refetch } = trpc.appointment.list.useQuery(
    { tenantId, page: 1, pageSize: 50 },
    { enabled: isLiffReady }
  );

  const appointments: Appointment[] = (rawAppointments?.appointments || []).map((a: any) => ({
    id: String(a.id),
    service: a.customers?.name ? `${a.service_name || '預約'}` : (a.service_name || '預約'),
    date: `${a.appointment_date}T${a.appointment_time || '00:00'}`,
  }));

  const handleCancel = (appointment: Appointment) => {
    setSelectedAppointment(appointment);
    setIsCancelDialogOpen(true);
  };

  const handleReschedule = (appointment: Appointment) => {
    setSelectedAppointment(appointment);
    setIsRescheduleDialogOpen(true);
  };

  const confirmCancel = () => {
    // 呼叫後端取消預約 API
    console.log("取消預約:", selectedAppointment);
    setIsCancelDialogOpen(false);
    refetch();
  };

  const confirmReschedule = () => {
    // 呼叫後端改期 API
    console.log("改期預約:", selectedAppointment, "至", newDate);
    setIsRescheduleDialogOpen(false);
    refetch();
  };

  if (liffError) {
    return (
      <div className="min-h-screen bg-red-100 p-4 flex items-center justify-center">
        <p className="text-red-700">LIFF 初始化失敗: {liffError}</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 p-4 sm:p-6 lg:p-8">
      <header className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">我的預約</h1>
      </header>
      <main>
        {isLoading && <div className="text-center text-gray-500">載入中...</div>}
        {error && <div className="text-center text-red-500">錯誤: {error.message}</div>}
        {!isLoading && !error && appointments.length === 0 && (
          <div className="text-center text-gray-500">目前沒有任何預約。</div>
        )}
        <div className="space-y-4">
          {appointments.map((appointment) => (
            <Card key={appointment.id}>
              <CardHeader>
                <CardTitle>{appointment.service}</CardTitle>
              </CardHeader>
              <CardContent>
                <p>日期: {format(new Date(appointment.date), "yyyy/MM/dd")}</p>
                <p>時間: {format(new Date(appointment.date), "HH:mm")}</p>
              </CardContent>
              <CardFooter className="flex justify-end space-x-2">
                <Button variant="outline" onClick={() => handleCancel(appointment)}>取消</Button>
                <Button onClick={() => handleReschedule(appointment)}>改期</Button>
              </CardFooter>
            </Card>
          ))}
        </div>
      </main>

      {/* 取消預約 Dialog */}
      <Dialog open={isCancelDialogOpen} onOpenChange={setIsCancelDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>確認取消預約？</DialogTitle>
            <DialogDescription>
              您確定要取消「{selectedAppointment?.service}」這個預約嗎？此操作無法復原。
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setIsCancelDialogOpen(false)}>關閉</Button>
            <Button variant="destructive" onClick={confirmCancel}>確認取消</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 改期預約 Dialog */}
      <Dialog open={isRescheduleDialogOpen} onOpenChange={setIsRescheduleDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>申請改期</DialogTitle>
            <DialogDescription>
              請選擇您希望改期的日期。
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <Calendar
              mode="single"
              selected={newDate}
              onSelect={setNewDate}
              className="rounded-md border"
            />
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setIsRescheduleDialogOpen(false)}>關閉</Button>
            <Button onClick={confirmReschedule}>確認改期</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default MyAppointments;
