/**
 * LIFF 預約詳情
 */
import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { trpc } from '@/lib/trpc';
import LiffLayout from '@/components/LiffLayout';
import { useRoute } from 'wouter';
import { Loader2, Calendar, Clock, User, MapPin, ArrowLeft } from 'lucide-react';

const statusColor: Record<string, string> = {
  pending: 'bg-yellow-100 text-yellow-700', confirmed: 'bg-green-100 text-green-700',
  completed: 'bg-blue-100 text-blue-700', cancelled: 'bg-gray-100 text-gray-500',
};
const statusLabel: Record<string, string> = {
  pending: '待確認', confirmed: '已確認', completed: '已完成', cancelled: '已取消',
};

function DetailContent({ tenantId }: { profile: { displayName: string; userId: string }; tenantId: number }) {
  const [, routeParams] = useRoute('/liff/appointment/:id');
  const appointmentId = parseInt((routeParams as any)?.id || '0', 10);

  const query = trpc.appointment.getById.useQuery(
    { appointmentId: appointmentId },
    { enabled: appointmentId > 0 }
  );

  const apt = query.data;

  if (query.isLoading) {
    return <div className="flex justify-center py-12"><Loader2 className="h-6 w-6 animate-spin text-[#06C755]" /></div>;
  }

  if (!apt) {
    return <div className="p-6 text-center text-gray-400">找不到此預約</div>;
  }

  return (
    <div className="p-4 pb-20">
      <button onClick={() => window.history.back()} className="flex items-center text-sm text-gray-500 mb-4">
        <ArrowLeft className="h-4 w-4 mr-1" /> 返回
      </button>
      <Card>
        <CardContent className="p-5 space-y-4">
          <div className="flex justify-between items-center">
            <h2 className="text-lg font-bold">{(apt as any).service_name || '預約詳情'}</h2>
            <Badge className={statusColor[(apt as any).status] || 'bg-gray-100'}>{statusLabel[(apt as any).status] || (apt as any).status}</Badge>
          </div>
          <div className="space-y-3 text-sm">
            <div className="flex items-center gap-2 text-gray-600"><Calendar className="h-4 w-4 text-[#06C755]" /><span>{(apt as any).date}</span></div>
            <div className="flex items-center gap-2 text-gray-600"><Clock className="h-4 w-4 text-[#06C755]" /><span>{(apt as any).time || (apt as any).time_slot}</span></div>
            {(apt as any).staff_name && <div className="flex items-center gap-2 text-gray-600"><User className="h-4 w-4 text-[#06C755]" /><span>{(apt as any).staff_name}</span></div>}
            {(apt as any).notes && <div className="bg-gray-50 rounded-lg p-3 text-xs text-gray-500">{(apt as any).notes}</div>}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export default function LiffAppointmentDetail() {
  return <LiffLayout title="預約詳情">{(props) => <DetailContent {...props} />}</LiffLayout>;
}
