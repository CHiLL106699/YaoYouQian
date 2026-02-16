/**
 * SlotCalculatorManagement.tsx
 * 時段自動計算管理頁面 — 根據服務時長自動計算可用時段，避免預約衝突
 */

import { useState } from 'react';
import { trpc } from '@/lib/trpc';
import { useTenant } from '@/contexts/TenantContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { Clock, Calculator, CalendarDays, CheckCircle2, XCircle } from 'lucide-react';

export default function SlotCalculatorManagement() {
  const { tenantId } = useTenant();
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [serviceId, setServiceId] = useState<string>('');
  const [startTime, setStartTime] = useState('09:00');
  const [endTime, setEndTime] = useState('18:00');

  // 查詢服務列表
  const { data: services } = trpc.service.list.useQuery(
    { tenantId: tenantId! },
    { enabled: !!tenantId }
  );

  // 查詢可用時段
  const { data: availableSlots, isLoading: isSlotsLoading } = trpc.slotCalculator.calculate.useQuery(
    {
      tenantId: tenantId!,
      date: selectedDate,
      serviceId: Number(serviceId),
      startTime,
      endTime,
    },
    { enabled: !!tenantId && !!serviceId && !!selectedDate }
  );

  // 批次計算
  const [batchFormData, setBatchFormData] = useState({
    startDate: '',
    endDate: '',
    startTime: '09:00',
    endTime: '18:00',
  });
  const [batchResult, setBatchResult] = useState<any>(null);
  const utils = trpc.useUtils();

  const handleBatchCalculate = async () => {
    if (!tenantId || !serviceId) {
      toast.error('請先選擇服務項目');
      return;
    }
    if (!batchFormData.startDate || !batchFormData.endDate) {
      toast.error('請選擇開始和結束日期');
      return;
    }
    try {
      const result = await utils.slotCalculator.calculateBatch.fetch({
        tenantId,
        serviceId: Number(serviceId),
        startDate: batchFormData.startDate,
        endDate: batchFormData.endDate,
        startTime: batchFormData.startTime,
        endTime: batchFormData.endTime,
      });
      setBatchResult(result);
      toast.success(`成功計算 ${result.results.length} 天的可用時段`);
    } catch (error: any) {
      toast.error(`時段計算失敗：${error.message}`);
    }
  };

  const selectedService = services?.find((s: any) => s.id === Number(serviceId));

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold flex items-center gap-2">
        <Calculator className="h-6 w-6" />
        時段自動計算
      </h1>

      {/* 服務選擇 */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5" />
            服務項目選擇
          </CardTitle>
          <CardDescription>選擇服務項目後，系統會根據療程時長自動計算可預約時段，並排除已有預約的衝突時段。</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label>服務項目</Label>
              <Select value={serviceId} onValueChange={setServiceId}>
                <SelectTrigger>
                  <SelectValue placeholder="請選擇服務項目" />
                </SelectTrigger>
                <SelectContent>
                  {services?.map((service: any) => (
                    <SelectItem key={service.id} value={String(service.id)}>
                      {service.name} ({service.duration_minutes || 60} 分鐘)
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            {selectedService && (
              <div className="flex items-center gap-2">
                <Badge variant="outline" className="text-sm">
                  療程時長：{selectedService.duration_minutes || 60} 分鐘
                </Badge>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* 單日查詢 */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CalendarDays className="h-5 w-5" />
            單日可用時段查詢
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
            <div>
              <Label>選擇日期</Label>
              <Input
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
              />
            </div>
            <div>
              <Label>營業開始時間</Label>
              <Input
                type="time"
                value={startTime}
                onChange={(e) => setStartTime(e.target.value)}
              />
            </div>
            <div>
              <Label>營業結束時間</Label>
              <Input
                type="time"
                value={endTime}
                onChange={(e) => setEndTime(e.target.value)}
              />
            </div>
          </div>

          {!serviceId ? (
            <p className="text-muted-foreground text-center py-4">請先選擇服務項目</p>
          ) : isSlotsLoading ? (
            <p className="text-center py-4">計算中...</p>
          ) : availableSlots && availableSlots.available_slots.length > 0 ? (
            <div>
              <div className="flex items-center gap-2 mb-3">
                <h3 className="font-semibold">可用時段</h3>
                <Badge variant="default">{availableSlots.available_slots.length} 個時段</Badge>
                <Badge variant="outline">每段 {availableSlots.duration_minutes} 分鐘</Badge>
              </div>
              <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-2">
                {availableSlots.available_slots.map((slot: string, index: number) => (
                  <div
                    key={index}
                    className="p-3 border rounded-lg text-center bg-green-50 dark:bg-green-950 border-green-300 dark:border-green-700"
                  >
                    <p className="font-bold text-green-700 dark:text-green-300">{slot}</p>
                    <div className="flex items-center justify-center gap-1 mt-1">
                      <CheckCircle2 className="h-3 w-3 text-green-500" />
                      <span className="text-xs text-green-600 dark:text-green-400">可預約</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="text-center py-8">
              <XCircle className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
              <p className="text-muted-foreground">此日期無可用時段（可能已被預約佔滿）</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* 批次計算 */}
      <Card>
        <CardHeader>
          <CardTitle>批次時段計算</CardTitle>
          <CardDescription>一次計算多天的可用時段，方便規劃排程</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
            <div>
              <Label>開始日期</Label>
              <Input
                type="date"
                value={batchFormData.startDate}
                onChange={(e) => setBatchFormData({ ...batchFormData, startDate: e.target.value })}
              />
            </div>
            <div>
              <Label>結束日期</Label>
              <Input
                type="date"
                value={batchFormData.endDate}
                onChange={(e) => setBatchFormData({ ...batchFormData, endDate: e.target.value })}
              />
            </div>
            <div>
              <Label>開始時間</Label>
              <Input
                type="time"
                value={batchFormData.startTime}
                onChange={(e) => setBatchFormData({ ...batchFormData, startTime: e.target.value })}
              />
            </div>
            <div>
              <Label>結束時間</Label>
              <Input
                type="time"
                value={batchFormData.endTime}
                onChange={(e) => setBatchFormData({ ...batchFormData, endTime: e.target.value })}
              />
            </div>
          </div>
          <Button onClick={handleBatchCalculate} disabled={!serviceId}>
            <Calculator className="mr-2 h-4 w-4" />
            批次計算
          </Button>

          {batchResult && (
            <div className="mt-6 space-y-3">
              <h3 className="font-semibold">計算結果</h3>
              {batchResult.results.map((dayResult: any) => (
                <div key={dayResult.date} className="flex items-center gap-4 p-3 border rounded-lg">
                  <div className="font-mono font-bold w-28">{dayResult.date}</div>
                  <div className="flex-1">
                    {dayResult.available_slots.length > 0 ? (
                      <div className="flex flex-wrap gap-1">
                        {dayResult.available_slots.map((slot: string) => (
                          <Badge key={slot} variant="outline" className="text-xs">{slot}</Badge>
                        ))}
                      </div>
                    ) : (
                      <span className="text-muted-foreground text-sm">無可用時段</span>
                    )}
                  </div>
                  <Badge variant={dayResult.available_slots.length > 0 ? 'default' : 'secondary'}>
                    {dayResult.available_slots.length} 個
                  </Badge>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
