/**
 * LIFF 預約表單 — 完整流程
 * 選服務→選人員→選時段→填寫資料→確認→完成通知
 */
import React, { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { trpc } from '@/lib/trpc';
import { closeLiffWindow } from '@/lib/liff';
import LiffLayout from '@/components/LiffLayout';
import { Loader2, CheckCircle, ArrowLeft, Calendar, Clock, User, Scissors } from 'lucide-react';

type Step = 'service' | 'staff' | 'date' | 'time' | 'info' | 'confirm' | 'done';

function BookingContent({ profile, tenantId }: { profile: { displayName: string; userId: string }; tenantId: number }) {
  const [step, setStep] = useState<Step>('service');
  const [selectedService, setSelectedService] = useState<{ id: number; name: string; price: string; duration: number } | null>(null);
  const [selectedStaff, setSelectedStaff] = useState<{ id: number; name: string } | null>(null);
  const [selectedDate, setSelectedDate] = useState('');
  const [selectedTime, setSelectedTime] = useState('');
  const [name, setName] = useState(profile.displayName);
  const [phone, setPhone] = useState('');
  const [notes, setNotes] = useState('');

  const servicesQuery = trpc.line.liffBooking.getAvailableServices.useQuery({ tenantId });
  const staffQuery = trpc.line.liffBooking.getAvailableStaff.useQuery(
    { tenantId, serviceId: selectedService?.id || 0, date: selectedDate },
    { enabled: !!selectedService && !!selectedDate }
  );
  const slotsQuery = trpc.line.liffBooking.getAvailableSlots.useQuery(
    { tenantId, serviceId: selectedService?.id || 0, staffId: selectedStaff?.id, date: selectedDate },
    { enabled: !!selectedService && !!selectedDate }
  );
  const createMutation = trpc.line.liffBooking.createBooking.useMutation();

  const handleSubmit = async () => {
    if (!selectedService || !selectedDate || !selectedTime || !name || !phone) return;
    try {
      await createMutation.mutateAsync({
        tenantId, lineUserId: profile.userId, serviceId: selectedService.id,
        staffId: selectedStaff?.id, date: selectedDate, time: selectedTime,
        customerName: name, customerPhone: phone, notes,
      });
      setStep('done');
    } catch (e: unknown) {
      alert(`預約失敗: ${(e as Error).message}`);
    }
  };

  // 生成未來 14 天日期
  const dates = Array.from({ length: 14 }, (_, i) => {
    const d = new Date(); d.setDate(d.getDate() + i);
    return d.toISOString().split('T')[0];
  });

  const goBack = () => {
    const steps: Step[] = ['service', 'staff', 'date', 'time', 'info', 'confirm'];
    const idx = steps.indexOf(step);
    if (idx > 0) setStep(steps[idx - 1]);
  };

  if (step === 'done') {
    return (
      <div className="p-6 flex flex-col items-center justify-center min-h-[60vh]">
        <CheckCircle className="h-16 w-16 text-[#06C755] mb-4" />
        <h2 className="text-xl font-bold text-gray-800 mb-2">預約成功！</h2>
        <p className="text-gray-500 text-sm text-center mb-6">我們將透過 LINE 通知您審核結果</p>
        <div className="bg-white rounded-xl p-4 w-full max-w-sm shadow-sm space-y-2 text-sm">
          <div className="flex justify-between"><span className="text-gray-400">服務</span><span className="font-medium">{selectedService?.name}</span></div>
          <div className="flex justify-between"><span className="text-gray-400">日期</span><span className="font-medium">{selectedDate}</span></div>
          <div className="flex justify-between"><span className="text-gray-400">時間</span><span className="font-medium">{selectedTime}</span></div>
          {selectedStaff && <div className="flex justify-between"><span className="text-gray-400">服務人員</span><span className="font-medium">{selectedStaff.name}</span></div>}
        </div>
        <Button className="mt-6 bg-[#06C755] hover:bg-[#05a847] text-white" onClick={() => closeLiffWindow()}>關閉</Button>
      </div>
    );
  }

  return (
    <div className="p-4 pb-24">
      {/* Progress */}
      <div className="flex items-center gap-1 mb-4 px-2">
        {['服務', '人員', '日期', '時段', '資料', '確認'].map((label, i) => {
          const steps: Step[] = ['service', 'staff', 'date', 'time', 'info', 'confirm'];
          const active = steps.indexOf(step) >= i;
          return (
            <div key={label} className="flex-1 flex flex-col items-center">
              <div className={`h-1.5 w-full rounded-full ${active ? 'bg-[#06C755]' : 'bg-gray-200'}`} />
              <span className={`text-[10px] mt-1 ${active ? 'text-[#06C755] font-medium' : 'text-gray-300'}`}>{label}</span>
            </div>
          );
        })}
      </div>

      {step !== 'service' && (
        <button onClick={goBack} className="flex items-center text-sm text-gray-500 mb-3 hover:text-gray-700">
          <ArrowLeft className="h-4 w-4 mr-1" /> 上一步
        </button>
      )}

      {/* Step: Service */}
      {step === 'service' && (
        <div className="space-y-3">
          <h2 className="text-lg font-bold flex items-center gap-2"><Scissors className="h-5 w-5 text-[#06C755]" /> 選擇服務</h2>
          {servicesQuery.isLoading ? (
            <div className="flex justify-center py-8"><Loader2 className="h-6 w-6 animate-spin text-[#06C755]" /></div>
          ) : (
            <div className="space-y-2">
              {(servicesQuery.data || []).map(svc => (
                <Card key={svc.id} className={`cursor-pointer transition-all border-2 ${selectedService?.id === svc.id ? 'border-[#06C755] bg-green-50' : 'border-transparent hover:border-gray-200'}`}
                  onClick={() => { setSelectedService({ id: svc.id, name: svc.name, price: svc.price, duration: svc.duration }); setStep('date'); }}>
                  <CardContent className="p-3 flex justify-between items-center">
                    <div>
                      <p className="font-medium text-sm">{svc.name}</p>
                      {svc.description && <p className="text-xs text-gray-400 mt-0.5 line-clamp-1">{svc.description}</p>}
                      <p className="text-xs text-gray-400 mt-0.5">{svc.duration} 分鐘</p>
                    </div>
                    <span className="text-[#06C755] font-bold text-sm">NT${svc.price}</span>
                  </CardContent>
                </Card>
              ))}
              {(servicesQuery.data || []).length === 0 && <p className="text-center text-gray-400 py-8">暫無可預約服務</p>}
            </div>
          )}
        </div>
      )}

      {/* Step: Date */}
      {step === 'date' && (
        <div className="space-y-3">
          <h2 className="text-lg font-bold flex items-center gap-2"><Calendar className="h-5 w-5 text-[#06C755]" /> 選擇日期</h2>
          <div className="grid grid-cols-2 gap-2">
            {dates.map(d => {
              const dayOfWeek = ['日', '一', '二', '三', '四', '五', '六'][new Date(d).getDay()];
              return (
                <Button key={d} variant={selectedDate === d ? 'default' : 'outline'}
                  className={selectedDate === d ? 'bg-[#06C755] hover:bg-[#05a847] text-white' : ''}
                  onClick={() => { setSelectedDate(d); setStep('staff'); }}>
                  {d.slice(5)} ({dayOfWeek})
                </Button>
              );
            })}
          </div>
        </div>
      )}

      {/* Step: Staff */}
      {step === 'staff' && (
        <div className="space-y-3">
          <h2 className="text-lg font-bold flex items-center gap-2"><User className="h-5 w-5 text-[#06C755]" /> 選擇人員</h2>
          {staffQuery.isLoading ? (
            <div className="flex justify-center py-8"><Loader2 className="h-6 w-6 animate-spin text-[#06C755]" /></div>
          ) : (
            <div className="space-y-2">
              <Button variant="outline" className="w-full justify-start" onClick={() => { setSelectedStaff(null); setStep('time'); }}>
                不指定人員
              </Button>
              {(staffQuery.data || []).map(s => (
                <Button key={s.id} variant="outline" className={`w-full justify-start ${selectedStaff?.id === s.id ? 'border-[#06C755] bg-green-50' : ''}`}
                  onClick={() => { setSelectedStaff({ id: s.id, name: s.name }); setStep('time'); }}>
                  {s.name} {s.title && <span className="text-gray-400 ml-2 text-xs">{s.title}</span>}
                </Button>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Step: Time */}
      {step === 'time' && (
        <div className="space-y-3">
          <h2 className="text-lg font-bold flex items-center gap-2"><Clock className="h-5 w-5 text-[#06C755]" /> 選擇時段</h2>
          <p className="text-xs text-gray-400">{selectedDate}</p>
          {slotsQuery.isLoading ? (
            <div className="flex justify-center py-8"><Loader2 className="h-6 w-6 animate-spin text-[#06C755]" /></div>
          ) : (
            <div className="grid grid-cols-3 gap-2">
              {(slotsQuery.data || []).map(slot => (
                <Button key={slot.time} variant={selectedTime === slot.time ? 'default' : 'outline'}
                  disabled={!slot.available}
                  className={`text-sm ${selectedTime === slot.time ? 'bg-[#06C755] hover:bg-[#05a847] text-white' : ''} ${!slot.available ? 'opacity-40' : ''}`}
                  onClick={() => { setSelectedTime(slot.time); setStep('info'); }}>
                  {slot.time}
                </Button>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Step: Info */}
      {step === 'info' && (
        <div className="space-y-4">
          <h2 className="text-lg font-bold">填寫資料</h2>
          <div><Label>姓名 *</Label><Input value={name} onChange={e => setName(e.target.value)} placeholder="請輸入姓名" /></div>
          <div><Label>電話 *</Label><Input value={phone} onChange={e => setPhone(e.target.value)} placeholder="請輸入電話" type="tel" /></div>
          <div><Label>備註</Label><Textarea value={notes} onChange={e => setNotes(e.target.value)} placeholder="特殊需求或備註" rows={3} /></div>
          <Button className="w-full bg-[#06C755] hover:bg-[#05a847] text-white" disabled={!name || !phone}
            onClick={() => setStep('confirm')}>下一步</Button>
        </div>
      )}

      {/* Step: Confirm */}
      {step === 'confirm' && (
        <div className="space-y-4">
          <h2 className="text-lg font-bold">確認預約</h2>
          <Card>
            <CardContent className="p-4 space-y-3 text-sm">
              <div className="flex justify-between"><span className="text-gray-400">服務</span><span className="font-medium">{selectedService?.name}</span></div>
              <div className="flex justify-between"><span className="text-gray-400">日期</span><span className="font-medium">{selectedDate}</span></div>
              <div className="flex justify-between"><span className="text-gray-400">時間</span><span className="font-medium">{selectedTime}</span></div>
              {selectedStaff && <div className="flex justify-between"><span className="text-gray-400">人員</span><span className="font-medium">{selectedStaff.name}</span></div>}
              <div className="flex justify-between"><span className="text-gray-400">姓名</span><span className="font-medium">{name}</span></div>
              <div className="flex justify-between"><span className="text-gray-400">電話</span><span className="font-medium">{phone}</span></div>
              {notes && <div className="flex justify-between"><span className="text-gray-400">備註</span><span className="font-medium">{notes}</span></div>}
              <div className="flex justify-between border-t pt-2"><span className="text-gray-400">費用</span><span className="font-bold text-[#06C755]">NT${selectedService?.price}</span></div>
            </CardContent>
          </Card>
          <Button className="w-full bg-[#06C755] hover:bg-[#05a847] text-white h-12 text-base font-bold"
            disabled={createMutation.isPending}
            onClick={handleSubmit}>
            {createMutation.isPending ? <Loader2 className="h-5 w-5 animate-spin" /> : '確認預約'}
          </Button>
        </div>
      )}
    </div>
  );
}

export default function LiffBookingForm() {
  return <LiffLayout title="線上預約">{(props) => <BookingContent {...props} />}</LiffLayout>;
}
