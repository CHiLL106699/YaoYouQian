
import React, { useEffect, useState } from 'react';
import liff from '@line/liff';
import { trpc } from '@/lib/trpc';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
// import { QRCodeSVG } from 'qrcode.react'; // 暫時註解，需安裝套件
import { Loader2 } from 'lucide-react';

interface AppointmentDetailProps {
  appointmentId: string;
}

const AppointmentDetail: React.FC<AppointmentDetailProps> = ({ appointmentId }) => {
  const [liffError, setLiffError] = useState<string | null>(null);
  const [isLiffInitialized, setIsLiffInitialized] = useState(false);

  useEffect(() => {
    const initLiff = async () => {
      try {
        await liff.init({
          liffId: import.meta.env.VITE_LIFF_ID, // 從環境變數獲取 LIFF ID
        });
        setIsLiffInitialized(true);
      } catch (error: any) {
        setLiffError(error.toString());
      }
    };

    initLiff();
  }, []);

  // const { data: appointment, isLoading, error } = trpc.appointment.getById.useQuery(
  //   { id: appointmentId },
  //   { enabled: isLiffInitialized }
  // );
  
  // 模擬資料
  const appointment = {
    id: appointmentId,
    serviceName: '精油按摩',
    date: '2024-07-20T14:00:00',
    time: '14:00',
    userName: '王小明',
    status: '已確認'
  };
  const isLoading = false;
  const error = null;

  if (liffError) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen p-4 bg-red-100 text-red-800">
        <h1 className="text-2xl font-bold mb-4">LIFF 初始化失敗</h1>
        <p>{liffError}</p>
      </div>
    );
  }

  if (isLoading || !isLiffInitialized) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen">
        <Loader2 className="h-12 w-12 animate-spin text-blue-500" />
        <p className="mt-4 text-lg text-gray-600">載入中...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen p-4 bg-red-100 text-red-800">
        <h1 className="text-2xl font-bold mb-4">載入預約詳情失敗</h1>
        <p>{String(error)}</p>
        <Button onClick={() => window.location.reload()} className="mt-4">重試</Button>
      </div>
    );
  }

  if (!appointment) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen p-4 bg-yellow-100 text-yellow-800">
        <h1 className="text-2xl font-bold mb-4">找不到預約資訊</h1>
        <p>請確認預約 ID 是否正確。</p>
      </div>
    );
  }

  const appointmentUrl = `https://your-domain.com/appointment/${appointment.id}`;

  return (
    <div className="min-h-screen bg-gray-50 p-4 flex flex-col items-center">
      <Card className="w-full max-w-md shadow-lg rounded-lg">
        <CardHeader className="bg-blue-600 text-white rounded-t-lg p-4">
          <CardTitle className="text-2xl font-bold text-center">預約詳情</CardTitle>
        </CardHeader>
        <CardContent className="p-6 space-y-6">
          <div className="text-center">
            <h2 className="text-xl font-semibold text-gray-800 mb-2">預約項目：{appointment.serviceName}</h2>
            <p className="text-gray-600">日期：{new Date(appointment.date).toLocaleDateString()}</p>
            <p className="text-gray-600">時間：{appointment.time}</p>
            <p className="text-gray-600">預約人：{appointment.userName}</p>
            <p className="text-gray-600">狀態：<span className="font-medium text-green-600">{appointment.status}</span></p>
          </div>

          <div className="flex flex-col items-center space-y-4">
            <h3 className="text-lg font-semibold text-gray-800">您的預約 QR Code</h3>
            <div className="p-2 bg-white border border-gray-200 rounded-lg shadow-sm">
              {/* <QRCodeSVG value={appointmentUrl} size={200} level="H" /> */}
              <div className="w-[200px] h-[200px] bg-gray-200 flex items-center justify-center">
                <p className="text-sm text-gray-500">需安裝 qrcode.react</p>
              </div>
            </div>
            <p className="text-sm text-gray-500 text-center">請於報到時出示此 QR Code</p>
          </div>

          <div className="flex justify-center mt-6">
            <Button 
              onClick={() => liff.shareTargetPicker([
                {
                  type: 'text',
                  text: `我的預約詳情：\n項目：${appointment.serviceName}\n日期：${new Date(appointment.date).toLocaleDateString()}\n時間：${appointment.time}\n詳情連結：${appointmentUrl}`,
                },
              ])}
              className="w-full bg-green-500 hover:bg-green-600 text-white font-bold py-2 px-4 rounded"
            >
              分享預約詳情
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default AppointmentDetail;
