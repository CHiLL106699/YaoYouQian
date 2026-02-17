/**
 * YoCHiLLSAAS - Customer Booking Form with LINE Binding
 * 客戶端預約表單（整合 LINE User ID 自動繫定邏輯）
 * 已整合動態服務項目列表與可用時段 API
 */

import { useState, useEffect, useMemo } from 'react';
import { initLiff, getLiffProfile } from '@/lib/liff';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import { Calendar as CalendarIcon, Clock, User, Phone, FileText, CheckCircle, Lock, Loader2 } from 'lucide-react';
import { format } from 'date-fns';
import { zhTW } from 'date-fns/locale';

export default function BookingForm() {
  const [date, setDate] = useState<Date | undefined>(undefined);
  const [time, setTime] = useState<string>("");
  const [service, setService] = useState<string>("");
  const [name, setName] = useState<string>("");
  const [phone, setPhone] = useState<string>("");
  const [email, setEmail] = useState<string>("");
  const [notes, setNotes] = useState<string>("");
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [lineUserId, setLineUserId] = useState<string>("");
  const [isLiffReady, setIsLiffReady] = useState(false);
  const [isFormLocked, setIsFormLocked] = useState(false);
  const [customerId, setCustomerId] = useState<number | null>(null);

  // 從路由參數或環境變數取得 tenantId
  const urlParams = new URLSearchParams(window.location.search);
  const tenantId = parseInt(urlParams.get('tenantId') || import.meta.env.VITE_DEFAULT_TENANT_ID || '1', 10);

  // 初始化 LIFF SDK 並檢查繫定狀態
  useEffect(() => {
    const liffId = import.meta.env.VITE_LIFF_ID;
    if (!liffId) {
      console.warn('[LIFF] LIFF ID not configured');
      setIsLiffReady(true);
      return;
    }

    initLiff(liffId).then(async (success) => {
      if (success) {
        const profile = await getLiffProfile();
        setLineUserId(profile.userId);
        // LIFF Profile loaded (production: no console output)

        // 檢查 LINE User ID 是否已繫定客戶資料
        try {
          const response = await fetch(`/api/trpc/lineBinding.checkBinding?input=${encodeURIComponent(JSON.stringify({ tenantId, lineUserId: profile.userId }))}`);
          const bindingResult = await response.json();

          if (bindingResult.isBound && bindingResult.customer) {
            setName(bindingResult.customer.name);
            setPhone(bindingResult.customer.phone);
            setEmail(bindingResult.customer.email || '');
            setCustomerId(bindingResult.customer.id);
            setIsFormLocked(true);
            toast.success(`歡迎回來，${bindingResult.customer.name}！`);
          } else {
            setName(profile.displayName);
          }
        } catch (error) {
          console.error('[LINE Binding] Check failed:', error);
          setName(profile.displayName);
        }
      }
      setIsLiffReady(true);
    }).catch((error) => {
      console.error('[LIFF] Initialization error:', error);
      setIsLiffReady(true);
    });
  }, []);

  // 動態查詢服務項目列表
  const { data: serviceList } = trpc.service.list.useQuery(
    { tenantId, isActive: true },
    { enabled: !!tenantId }
  );

  // 將服務列表轉為選項，若無資料則使用預設選項
  const serviceOptions = useMemo(() => {
    if (serviceList && serviceList.length > 0) {
      return serviceList.map((s: any) => ({
        value: s.name,
        label: `${s.name}${s.duration_minutes ? ` (${s.duration_minutes}分鐘)` : ''}`,
      }));
    }
    // 預設服務選項（當資料庫無服務時的 fallback）
    return [
      { value: '臉部保養', label: '臉部保養' },
      { value: '身體護理', label: '身體護理' },
      { value: '美容諮詢', label: '美容諮詢' },
      { value: '其他療程', label: '其他療程' },
    ];
  }, [serviceList]);

  // 動態查詢可用時段（當日期選定後觸發）
  const selectedDateStr = date ? format(date, 'yyyy-MM-dd') : '';
  const { data: availableSlots, isLoading: isSlotsLoading } = trpc.booking.getAvailableSlots.useQuery(
    { tenantId, date: selectedDateStr },
    { enabled: !!selectedDateStr && !!tenantId }
  );

  // 當日期變更時，清空已選時段
  useEffect(() => {
    setTime("");
  }, [date]);

  // 建立預約 Mutation
  const createBooking = trpc.booking.submitBooking.useMutation({
    onSuccess: async () => {
      toast.success("預約申請已送出！");
      setIsSubmitted(true);

      // 若尚未繫定，建立繫定關係
      if (!isFormLocked && lineUserId) {
        try {
          await fetch('/api/trpc/lineBinding.createBinding', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ tenantId, lineUserId, name, phone, email: email || undefined }),
          });
          console.log('[LINE Binding] Binding created successfully');
        } catch (error) {
          console.error('[LINE Binding] Failed to create binding:', error);
        }
      }
    },
    onError: (error: any) => {
      toast.error(`預約失敗：${error.message}`);
    }
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!date || !time || !service || !name || !phone) {
      toast.error("請填寫所有必填欄位");
      return;
    }

    createBooking.mutate({
      tenantId,
      lineUserId: lineUserId || undefined,
      name,
      phone,
      date: format(date, 'yyyy-MM-dd'),
      timeSlot: time,
      notes: notes || undefined,
    });
  };

  if (!isLiffReady) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#0a1929] via-[#0f2942] to-[#1e4976] flex items-center justify-center">
        <div className="text-[#d4af37] text-xl">載入中...</div>
      </div>
    );
  }

  if (isSubmitted) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#0a1929] via-[#0f2942] to-[#1e4976] flex items-center justify-center p-4">
        <Card className="w-full max-w-md bg-[#0f2942] border-[#d4af37]">
          <CardHeader className="text-center">
            <CheckCircle className="w-16 h-16 text-[#d4af37] mx-auto mb-4" />
            <CardTitle className="text-2xl text-[#d4af37]">預約成功！</CardTitle>
            <CardDescription className="text-white">
              我們已收到您的預約申請，稍後將透過 LINE 通知您確認結果。
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button 
              onClick={() => setIsSubmitted(false)} 
              className="w-full bg-[#d4af37] text-[#0a1929] hover:bg-[#f4cf57]"
            >
              返回預約表單
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0a1929] via-[#0f2942] to-[#1e4976] p-4 md:p-8">
      <div className="max-w-3xl mx-auto">
        <Card className="bg-[#0f2942] border-[#d4af37]">
          <CardHeader>
            <CardTitle className="text-3xl text-[#d4af37] flex items-center gap-2">
              <CalendarIcon className="w-8 h-8" />
              線上預約
            </CardTitle>
            <CardDescription className="text-white">
              請填寫以下資訊完成預約申請
              {isFormLocked && (
                <span className="flex items-center gap-1 text-[#d4af37] mt-2">
                  <Lock className="w-4 h-4" />
                  已自動帶入您的客戶資料
                </span>
              )}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* 客戶資訊 */}
              <div className="space-y-4">
                <h3 className="text-xl font-semibold text-[#d4af37] flex items-center gap-2">
                  <User className="w-5 h-5" />
                  客戶資訊
                </h3>
                <div>
                  <Label htmlFor="name" className="text-[#d4af37]">姓名 *</Label>
                  <Input
                    id="name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    disabled={isFormLocked}
                    required
                    className="bg-[#0a1929] border-[#d4af37] text-white disabled:opacity-70"
                  />
                </div>
                <div>
                  <Label htmlFor="phone" className="text-[#d4af37]">電話 *</Label>
                  <Input
                    id="phone"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    disabled={isFormLocked}
                    required
                    className="bg-[#0a1929] border-[#d4af37] text-white disabled:opacity-70"
                  />
                </div>
                <div>
                  <Label htmlFor="email" className="text-[#d4af37]">Email（選填）</Label>
                  <Input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    disabled={isFormLocked}
                    className="bg-[#0a1929] border-[#d4af37] text-white disabled:opacity-70"
                  />
                </div>
              </div>

              {/* 預約資訊 */}
              <div className="space-y-4">
                <h3 className="text-xl font-semibold text-[#d4af37] flex items-center gap-2">
                  <Clock className="w-5 h-5" />
                  預約資訊
                </h3>
                <div>
                  <Label htmlFor="service" className="text-[#d4af37]">服務項目 *</Label>
                  <Select value={service} onValueChange={setService} required>
                    <SelectTrigger className="bg-[#0a1929] border-[#d4af37] text-white">
                      <SelectValue placeholder="請選擇服務項目" />
                    </SelectTrigger>
                    <SelectContent className="bg-[#0f2942] border-[#d4af37]">
                      {serviceOptions.map((s) => (
                        <SelectItem key={s.value} value={s.value} className="text-white hover:bg-[#1e4976]">
                          {s.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label className="text-[#d4af37]">預約日期 *</Label>
                  <Calendar
                    mode="single"
                    selected={date}
                    onSelect={setDate}
                    locale={zhTW}
                    disabled={(d) => d < new Date(new Date().setHours(0, 0, 0, 0))}
                    className="bg-[#0a1929] border-[#d4af37] rounded-md p-3"
                  />
                </div>
                <div>
                  <Label htmlFor="time" className="text-[#d4af37]">預約時段 *</Label>
                  {!date ? (
                    <p className="text-sm text-gray-400 mt-1">請先選擇日期以查看可用時段</p>
                  ) : isSlotsLoading ? (
                    <div className="flex items-center gap-2 text-[#d4af37] mt-2">
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span className="text-sm">載入可用時段中...</span>
                    </div>
                  ) : (
                    <Select value={time} onValueChange={setTime} required>
                      <SelectTrigger className="bg-[#0a1929] border-[#d4af37] text-white">
                        <SelectValue placeholder="請選擇時段" />
                      </SelectTrigger>
                      <SelectContent className="bg-[#0f2942] border-[#d4af37]">
                        {availableSlots && availableSlots.length > 0 ? (
                          availableSlots.map((slot: any) => (
                            <SelectItem
                              key={slot.time}
                              value={slot.time}
                              disabled={!slot.isAvailable}
                              className={`text-white hover:bg-[#1e4976] ${!slot.isAvailable ? 'opacity-50' : ''}`}
                            >
                              {slot.time} {slot.isAvailable ? `（剩餘 ${slot.available} 名額）` : '（已額滿）'}
                            </SelectItem>
                          ))
                        ) : (
                          <SelectItem value="__none__" disabled className="text-gray-400">
                            該日無可用時段
                          </SelectItem>
                        )}
                      </SelectContent>
                    </Select>
                  )}
                </div>
              </div>

              {/* 備註 */}
              <div>
                <Label htmlFor="notes" className="text-[#d4af37] flex items-center gap-2">
                  <FileText className="w-5 h-5" />
                  備註（選填）
                </Label>
                <Textarea
                  id="notes"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="如有特殊需求請在此註明"
                  className="bg-[#0a1929] border-[#d4af37] text-white"
                />
              </div>

              <Button
                type="submit"
                disabled={createBooking.isPending || !date || !time}
                className="w-full bg-[#d4af37] text-[#0a1929] hover:bg-[#f4cf57] text-lg py-6"
              >
                {createBooking.isPending ? "送出中..." : "確認預約"}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
