/**
 * SlotCalculatorManagement.tsx
 * 時段自動計算管理頁面
 */

import { useState } from 'react';
import { trpc } from '@/lib/trpc';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';

export default function SlotCalculatorManagement() {
  const [tenantId] = useState(1); // TODO: 從 context 取得
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [serviceId, setServiceId] = useState<number | null>(null);

  // 查詢服務列表
  const { data: services } = trpc.service.list.useQuery({ tenantId });

  // 查詢可用時段
  const { data: availableSlots, refetch } = trpc.slotCalculator.calculate.useQuery({
    tenantId,
    date: selectedDate,
    serviceId: serviceId || 1, // TODO: 從下拉選單取得
    startTime: '09:00',
    endTime: '18:00',
  }, {
    enabled: !!selectedDate,
  });

  // 批次生成時段
  const [batchResult, setBatchResult] = useState<any>(null);
  const utils = trpc.useUtils();
  const generateSlots = async () => {
    try {
      const result = await utils.slotCalculator.calculateBatch.fetch({
        tenantId,
        serviceId: serviceId || 1,
        startDate: batchFormData.startDate,
        endDate: batchFormData.endDate,
        startTime: batchFormData.startTime,
        endTime: batchFormData.endTime,
      });
      setBatchResult(result);
      toast.success(`成功計算 ${result.results.length} 天的時段`);
      refetch();
    } catch (error: any) {
      toast.error(`時段計算失敗：${error.message}`);
    }
  };

  const [batchFormData, setBatchFormData] = useState({
    startDate: '',
    endDate: '',
    startTime: '09:00',
    endTime: '18:00',
    slotDuration: 60,
    maxCapacity: 3,
  });

  const handleGenerateSlots = () => {
    if (!batchFormData.startDate || !batchFormData.endDate) {
      toast.error('請選擇開始和結束日期');
      return;
    }
    generateSlots();
  };

  return (
    <div className="container py-8">
      <h1 className="text-3xl font-bold mb-6">時段自動計算</h1>

      {/* 批次生成時段 */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>批次生成時段</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-4">
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
            <div>
              <Label>時段長度（分鐘）</Label>
              <Input
                type="number"
                value={batchFormData.slotDuration}
                onChange={(e) => setBatchFormData({ ...batchFormData, slotDuration: Number(e.target.value) })}
              />
            </div>
            <div>
              <Label>每時段人數上限</Label>
              <Input
                type="number"
                value={batchFormData.maxCapacity}
                onChange={(e) => setBatchFormData({ ...batchFormData, maxCapacity: Number(e.target.value) })}
              />
            </div>
          </div>
          <Button onClick={handleGenerateSlots} className="mt-4 w-full">
            批次生成時段
          </Button>
        </CardContent>
      </Card>

      {/* 查詢可用時段 */}
      <Card>
        <CardHeader>
          <CardTitle>查詢可用時段</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-4 mb-4">
            <div>
              <Label>選擇日期</Label>
              <Input
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
              />
            </div>
            <div>
              <Label>選擇服務（選填）</Label>
              <select
                className="w-full p-2 border rounded"
                value={serviceId || ''}
                onChange={(e) => setServiceId(e.target.value ? Number(e.target.value) : null)}
              >
                <option value="">全部服務</option>
                {services?.map((service: any) => (
                  <option key={service.id} value={service.id}>
                    {service.service_name} ({service.duration_minutes}分鐘)
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* 可用時段列表 */}
          <div className="space-y-2">
            <h3 className="font-bold">可用時段列表</h3>
            {availableSlots && availableSlots.available_slots.length > 0 ? (
              <div className="grid grid-cols-4 gap-2">
                {availableSlots.available_slots.map((slot: string, index: number) => (
                  <div
                    key={index}
                    className="p-2 border rounded text-center bg-green-50 border-green-300"
                  >
                    <p className="font-bold">{slot}</p>
                    <p className="text-sm text-muted-foreground">可預約</p>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-muted-foreground">此日期無可用時段</p>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
