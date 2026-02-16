/**
 * LIFF 預約詳情頁面
 * 顯示單筆預約的完整資訊與 QR Code
 */

import React, { useEffect, useState } from 'react';
import liff from '@line/liff';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Loader2, Calendar, Clock, User, ArrowLeft, Share2 } from 'lucide-react';
import { useLocation } from 'wouter';
import { trpc } from '@/lib/trpc';

interface AppointmentDetailProps {
  params: { id: string };
}

const AppointmentDetail: React.FC<AppointmentDetailProps> = ({ params }) => {
  const appointmentId = params.id;
  const [, navigate] = useLocation();
  const [liffError, setLiffError] = useState<string | null>(null);
  const [isLiffInitialized, setIsLiffInitialized] = useState(false);

  useEffect(() => {
    const initLiff = async () => {
      try {
        const liffId = import.meta.env.VITE_LIFF_ID;
        if (liffId) {
          await liff.init({ liffId });
        }
        setIsLiffInitialized(true);
      } catch (error: any) {
        setLiffError(error.toString());
        setIsLiffInitialized(true);
      }
    };
    initLiff();
  }, []);

  // 透過 tRPC 取得預約詳情
  const { data: rawAppointment, isLoading } = trpc.appointment.getById.useQuery(
    { appointmentId: Number(appointmentId) },
    { enabled: !!appointmentId && isLiffInitialized }
  );

  const appointment = rawAppointment ? {
    id: String(rawAppointment.id),
    serviceName: (rawAppointment as any).services?.name || '未知服務',
    date: rawAppointment.appointment_date,
    time: rawAppointment.appointment_time,
    userName: (rawAppointment as any).customers?.name || '未知',
    status: rawAppointment.status === 'approved' ? '已確認' : rawAppointment.status === 'pending' ? '待確認' : rawAppointment.status === 'cancelled' ? '已取消' : '已完成',
  } : null;

  const statusMap: Record<string, { label: string; variant: 'default' | 'secondary' | 'outline' | 'destructive' }> = {
    已確認: { label: '已確認', variant: 'default' },
    待確認: { label: '待確認', variant: 'secondary' },
    已取消: { label: '已取消', variant: 'destructive' },
    已完成: { label: '已完成', variant: 'outline' },
  };

  if (liffError) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen p-4 bg-red-50">
        <h1 className="text-xl font-bold text-red-600 mb-2">LIFF 初始化失敗</h1>
        <p className="text-red-500 text-sm">{liffError}</p>
      </div>
    );
  }

  if (isLoading || !isLiffInitialized) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen">
        <Loader2 className="h-10 w-10 animate-spin text-blue-500" />
        <p className="mt-3 text-gray-500">載入中...</p>
      </div>
    );
  }

  if (!appointment) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen p-4">
        <h1 className="text-xl font-bold text-gray-700 mb-2">找不到預約資訊</h1>
        <p className="text-gray-500 text-sm">請確認預約 ID 是否正確。</p>
        <Button onClick={() => navigate('/liff/appointments')} className="mt-4" variant="outline">
          返回預約列表
        </Button>
      </div>
    );
  }

  const statusConfig = statusMap[appointment.status] || statusMap['待確認'];

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-md mx-auto">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => navigate('/liff/appointments')}
          className="mb-4"
        >
          <ArrowLeft className="h-4 w-4 mr-1" />
          返回列表
        </Button>

        <Card className="shadow-lg">
          <CardHeader className="bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-t-lg">
            <CardTitle className="text-xl text-center">預約詳情</CardTitle>
          </CardHeader>
          <CardContent className="p-6 space-y-4">
            <div className="text-center">
              <h2 className="text-lg font-semibold">{appointment.serviceName}</h2>
              <Badge variant={statusConfig.variant} className="mt-2">
                {statusConfig.label}
              </Badge>
            </div>

            <div className="space-y-3 pt-4 border-t">
              <div className="flex items-center gap-3">
                <Calendar className="h-5 w-5 text-blue-500" />
                <div>
                  <p className="text-sm text-gray-500">預約日期</p>
                  <p className="font-medium">{new Date(appointment.date).toLocaleDateString('zh-TW')}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Clock className="h-5 w-5 text-blue-500" />
                <div>
                  <p className="text-sm text-gray-500">預約時段</p>
                  <p className="font-medium">{appointment.time}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <User className="h-5 w-5 text-blue-500" />
                <div>
                  <p className="text-sm text-gray-500">預約人</p>
                  <p className="font-medium">{appointment.userName}</p>
                </div>
              </div>
            </div>

            <div className="pt-4 border-t">
              <p className="text-center text-sm text-gray-400 mb-3">預約編號：{appointment.id}</p>
              <Button
                onClick={() => {
                  if (liff.isInClient()) {
                    liff.shareTargetPicker([
                      {
                        type: 'text',
                        text: `我的預約詳情：\n項目：${appointment.serviceName}\n日期：${new Date(appointment.date).toLocaleDateString('zh-TW')}\n時間：${appointment.time}`,
                      },
                    ]).catch(() => {});
                  }
                }}
                className="w-full"
                variant="outline"
              >
                <Share2 className="h-4 w-4 mr-2" />
                分享預約詳情
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default AppointmentDetail;
