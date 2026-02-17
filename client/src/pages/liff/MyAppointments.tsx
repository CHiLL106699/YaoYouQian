/**
 * LIFF 我的預約 — 查詢/取消/修改
 */
import React, { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { trpc } from '@/lib/trpc';
import LiffLayout from '@/components/LiffLayout';
import { Loader2, Calendar, X, Clock, User } from 'lucide-react';

const statusColor: Record<string, string> = {
  pending: 'bg-yellow-100 text-yellow-700', confirmed: 'bg-green-100 text-green-700',
  completed: 'bg-blue-100 text-blue-700', cancelled: 'bg-gray-100 text-gray-500',
};
const statusLabel: Record<string, string> = {
  pending: '待確認', confirmed: '已確認', completed: '已完成', cancelled: '已取消',
};

function AppointmentsContent({ profile, tenantId }: { profile: { displayName: string; userId: string }; tenantId: number }) {
  const [filter, setFilter] = useState<'all' | 'upcoming' | 'history'>('all');

  const query = trpc.line.liffMember.getMyAppointments.useQuery({ tenantId, lineUserId: profile.userId, status: filter });
  const cancelMutation = trpc.line.liffMember.cancelAppointment.useMutation();

  const handleCancel = async (id: number) => {
    if (!confirm('確定要取消此預約嗎？')) return;
    try {
      await cancelMutation.mutateAsync({ tenantId, lineUserId: profile.userId, appointmentId: id });
      query.refetch();
    } catch (e: any) {
      alert(`取消失敗: ${e.message}`);
    }
  };

  return (
    <div className="p-4 pb-20">
      <div className="flex gap-2 mb-4 overflow-x-auto">
        {(['all', 'upcoming', 'history'] as const).map(f => (
          <Button key={f} variant={filter === f ? 'default' : 'outline'} size="sm"
            className={filter === f ? 'bg-[#06C755] hover:bg-[#05a847] text-white' : ''}
            onClick={() => setFilter(f)}>
            {f === 'all' ? '全部' : f === 'upcoming' ? '即將到來' : '已完成'}
          </Button>
        ))}
      </div>

      {query.isLoading ? (
        <div className="flex justify-center py-8"><Loader2 className="h-6 w-6 animate-spin text-[#06C755]" /></div>
      ) : (query.data?.appointments || []).length === 0 ? (
        <p className="text-center text-gray-400 py-8">暫無預約紀錄</p>
      ) : (
        <div className="space-y-3">
          {(query.data?.appointments || []).map(apt => (
            <Card key={apt.id}>
              <CardContent className="p-4">
                <div className="flex justify-between items-start mb-2">
                  <h3 className="font-medium text-sm">{apt.serviceName}</h3>
                  <Badge className={statusColor[apt.status] || 'bg-gray-100'}>{statusLabel[apt.status] || apt.status}</Badge>
                </div>
                <div className="space-y-1 text-xs text-gray-500">
                  <div className="flex items-center gap-1"><Calendar className="h-3 w-3" /> {apt.date}</div>
                  <div className="flex items-center gap-1"><Clock className="h-3 w-3" /> {apt.time}</div>
                  {apt.staffName && <div className="flex items-center gap-1"><User className="h-3 w-3" /> {apt.staffName}</div>}
                </div>
                {(apt.status === 'pending' || apt.status === 'confirmed') && (
                  <Button variant="ghost" size="sm" className="mt-2 text-red-500 text-xs h-7" onClick={() => handleCancel(apt.id)}>
                    <X className="h-3 w-3 mr-1" /> 取消預約
                  </Button>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

export default function LiffMyAppointments() {
  return <LiffLayout title="我的預約">{(props) => <AppointmentsContent {...props} />}</LiffLayout>;
}
