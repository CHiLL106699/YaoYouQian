import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { initLiff, getLiffProfile, closeLiffWindow } from '../../lib/liff';
import { trpc } from '../../lib/trpc';
import { useLiffTenant } from '@/hooks/useLiffTenant';

const LIFF_ID = '2008825551-rJQAl3AY'; // 替換為實際的 LIFF ID

const BookingForm: React.FC = () => {
  const { tenantId } = useLiffTenant();
  const [currentStep, setCurrentStep] = useState(1);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [selectedTimeSlot, setSelectedTimeSlot] = useState<string | null>(null);
  const [bookingDetails, setBookingDetails] = useState<{ name: string; phone: string; notes: string } | null>(null);
  const [liffInitialized, setLiffInitialized] = useState(false);
  const [liffError, setLiffError] = useState<string | null>(null);
  const [userProfile, setUserProfile] = useState<{ displayName: string; userId: string } | null>(null);
  const [loadingLiff, setLoadingLiff] = useState(true);

  // tRPC hooks
  const availableSlotsQuery = trpc.booking.getAvailableSlots.useQuery(
    { 
      tenantId,
      date: selectedDate?.toISOString().split('T')[0] || '' 
    },
    { enabled: !!selectedDate }
  );
  const submitBookingMutation = trpc.booking.submitBooking.useMutation();

  useEffect(() => {
    const initialize = async () => {
      setLoadingLiff(true);
      const timeout = setTimeout(() => {
        setLiffError('連線逾時，錯誤代碼：LIFF_TIMEOUT');
        setLoadingLiff(false);
      }, 15000); // 15秒 timeout

      try {
        const success = await initLiff(LIFF_ID);
        clearTimeout(timeout);
        if (success) {
          setLiffInitialized(true);
          const profile = await getLiffProfile();
          if (profile) {
            setUserProfile(profile);
            // 自動帶入會員資料
            setBookingDetails({ name: profile.displayName, phone: '', notes: '' });
          }
        } else {
          setLiffError('LIFF 初始化失敗');
        }
      } catch (error: any) {
        clearTimeout(timeout);
        setLiffError(`LIFF 初始化異常: ${error.message}`);
      } finally {
        setLoadingLiff(false);
      }
    };
    initialize();
  }, []);

  const handleDateSelect = (date: Date) => {
    setSelectedDate(date);
    setCurrentStep(2);
  };

  const handleTimeSlotSelect = (time: string) => {
    setSelectedTimeSlot(time);
    setCurrentStep(3);
  };

  const handleBookingDetailsSubmit = async (data: { name: string; phone: string; notes: string }) => {
    setBookingDetails(data);
    if (selectedDate && selectedTimeSlot && userProfile) {
      try {
        await submitBookingMutation.mutateAsync({
          tenantId,
          date: selectedDate.toISOString().split('T')[0],
          timeSlot: selectedTimeSlot,
          name: data.name,
          phone: data.phone,
          notes: data.notes || '',
          lineUserId: userProfile.userId,
        });
        alert('預約成功！我們將透過 LINE 通知您審核結果');
        closeLiffWindow(); // 提交成功後關閉 LIFF 視窗
      } catch (error: any) {
        console.error('提交預約失敗:', error);
        alert(`預約失敗，請稍後再試。錯誤: ${error.message}`);
      }
    }
  };

  if (loadingLiff) {
    return <div className="min-h-screen flex items-center justify-center">載入 LIFF 中...</div>;
  }

  if (liffError) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-4 text-red-600">
        <p className="text-lg font-bold">系統維護中，請稍後再試，或直接聯繫官方帳號。</p>
        {window.location.search.includes('debug_mode=true') && (
          <p className="text-sm mt-2">除錯資訊: {liffError}</p>
        )}
      </div>
    );
  }

  if (!liffInitialized) {
    return <div className="min-h-screen flex items-center justify-center text-red-600">LIFF 未初始化，請檢查配置。</div>;
  }

  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="text-center">LINE LIFF 預約表單</CardTitle>
        </CardHeader>
        <CardContent>
          {currentStep === 1 && (
            <div className="space-y-4">
              <Label>選擇預約日期</Label>
              <Calendar mode="single" selected={selectedDate || undefined} onSelect={(date) => date && handleDateSelect(date)} className="rounded-md border" />
            </div>
          )}
          {currentStep === 2 && (
            <div className="space-y-4">
              <Label>選擇時段</Label>
              <div className="grid grid-cols-2 gap-2">
                {['09:00', '10:00', '11:00', '14:00', '15:00', '16:00'].map(time => (
                  <Button key={time} variant="outline" onClick={() => handleTimeSlotSelect(time)}>{time}</Button>
                ))}
              </div>
            </div>
          )}
          {currentStep === 3 && (
            <div className="space-y-4">
              <div>
                <Label>姓名</Label>
                <Input defaultValue={bookingDetails?.name} onChange={(e) => setBookingDetails({...bookingDetails!, name: e.target.value})} />
              </div>
              <div>
                <Label>電話</Label>
                <Input defaultValue={bookingDetails?.phone} onChange={(e) => setBookingDetails({...bookingDetails!, phone: e.target.value})} />
              </div>
              <div>
                <Label>備註</Label>
                <Textarea defaultValue={bookingDetails?.notes} onChange={(e) => setBookingDetails({...bookingDetails!, notes: e.target.value})} />
              </div>
              <Button className="w-full" onClick={() => handleBookingDetailsSubmit(bookingDetails!)}>確認預約</Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default BookingForm;
