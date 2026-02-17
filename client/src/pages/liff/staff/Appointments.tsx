/**
 * LIFF 員工今日預約 — 時間軸視圖、客戶資訊、服務項目
 */
import React, { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { trpc } from '@/lib/trpc';
import LiffLayout from '@/components/LiffLayout';
import { Loader2, Clock, User, Phone, ChevronLeft, ChevronRight, CheckCircle } from 'lucide-react';

const statusColor: Record<string, string> = {
  pending: 'bg-yellow-100 text-yellow-700', confirmed: 'bg-green-100 text-green-700',
  completed: 'bg-blue-100 text-blue-700', cancelled: 'bg-gray-100 text-gray-500', in_progress: 'bg-purple-100 text-purple-700',
};
const statusLabel: Record<string, string> = {
  pending: '待確認', confirmed: '已確認', completed: '已完成', cancelled: '已取消', in_progress: '進行中',
};

function AppointmentsContent({ profile, tenantId }: { profile: { displayName: string; userId: string }; tenantId: number }) {
  const [dateOffset, setDateOffset] = useState(0);
  const getDate = (offset: number) => {
    const d = new Date(); d.setDate(d.getDate() + offset);
    return d.toISOString().split('T')[0];
  };
  const dateStr = getDate(dateOffset);

  const query = trpc.appointment.list.useQuery({ tenantId, startDate: dateStr, endDate: dateStr });
  const completeMutation = trpc.appointment.approve.useMutation();

  const appointments = ((query.data as any)?.appointments || (query.data as any)?.data || []) as any[];

  const handleComplete = async (id: number) => {
    try {
      await completeMutation.mutateAsync({ appointmentId: id, tenantId });
      query.refetch();
    } catch (e: any) {
      alert(`更新失敗: ${e.message}`);
    }
  };

  return (
    <div className="p-4 pb-20">
      {/* Date Navigation */}
      <div className="flex items-center justify-between mb-4">
        <Button variant="ghost" size="sm" onClick={() => setDateOffset(d => d - 1)}><ChevronLeft className="h-4 w-4" /></Button>
        <div className="text-center">
          <p className="font-bold">{dateOffset === 0 ? '今天' : dateOffset === 1 ? '明天' : dateOffset === -1 ? '昨天' : dateStr}</p>
          <p className="text-xs text-gray-400">{dateStr}</p>
        </div>
        <Button variant="ghost" size="sm" onClick={() => setDateOffset(d => d + 1)}><ChevronRight className="h-4 w-4" /></Button>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-3 gap-2 mb-4">
        <Card><CardContent className="p-2 text-center"><p className="text-lg font-bold">{(appointments as any[]).length}</p><p className="text-[10px] text-gray-400">總預約</p></CardContent></Card>
        <Card><CardContent className="p-2 text-center"><p className="text-lg font-bold text-green-500">{(appointments as any[]).filter((a: any) => a.status === 'confirmed').length}</p><p className="text-[10px] text-gray-400">已確認</p></CardContent></Card>
        <Card><CardContent className="p-2 text-center"><p className="text-lg font-bold text-blue-500">{(appointments as any[]).filter((a: any) => a.status === 'completed').length}</p><p className="text-[10px] text-gray-400">已完成</p></CardContent></Card>
      </div>

      {/* Timeline */}
      {query.isLoading ? (
        <div className="flex justify-center py-8"><Loader2 className="h-6 w-6 animate-spin text-[#06C755]" /></div>
      ) : (appointments as any[]).length === 0 ? (
        <p className="text-center text-gray-400 py-8">今日無預約</p>
      ) : (
        <div className="relative">
          <div className="absolute left-4 top-0 bottom-0 w-0.5 bg-gray-200" />
          <div className="space-y-4">
            {(appointments as any[]).sort((a: any, b: any) => (a.time || a.time_slot || '').localeCompare(b.time || b.time_slot || '')).map((apt: any) => (
              <div key={apt.id} className="relative pl-10">
                <div className="absolute left-2.5 w-3 h-3 rounded-full bg-[#06C755] border-2 border-white" />
                <Card>
                  <CardContent className="p-3">
                    <div className="flex justify-between items-start mb-2">
                      <div className="flex items-center gap-1 text-sm font-bold text-[#06C755]">
                        <Clock className="h-3 w-3" /> {apt.time || apt.time_slot || '-'}
                      </div>
                      <Badge className={statusColor[apt.status] || 'bg-gray-100'}>{statusLabel[apt.status] || apt.status}</Badge>
                    </div>
                    <p className="text-sm font-medium">{apt.service_name || apt.serviceName || '-'}</p>
                    <div className="flex items-center gap-3 mt-2 text-xs text-gray-500">
                      <span className="flex items-center gap-1"><User className="h-3 w-3" /> {apt.customer_name || apt.customerName || '-'}</span>
                      {(apt.customer_phone || apt.customerPhone) && (
                        <span className="flex items-center gap-1"><Phone className="h-3 w-3" /> {apt.customer_phone || apt.customerPhone}</span>
                      )}
                    </div>
                    {apt.notes && <p className="text-xs text-gray-400 mt-1 bg-gray-50 rounded p-2">{apt.notes}</p>}
                    {apt.status === 'confirmed' && (
                      <Button size="sm" className="mt-2 bg-[#06C755] hover:bg-[#05a847] text-white text-xs h-7"
                        disabled={completeMutation.isPending} onClick={() => handleComplete(apt.id)}>
                        <CheckCircle className="h-3 w-3 mr-1" /> 完成服務
                      </Button>
                    )}
                  </CardContent>
                </Card>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export default function StaffAppointments() {
  return <LiffLayout title="今日預約">{(props) => <AppointmentsContent {...props} />}</LiffLayout>;
}
