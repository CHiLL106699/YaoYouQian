/**
 * 排班管理 — 週視圖、拖曳排班
 */
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { trpc } from '@/lib/trpc';
import { useTenant } from '@/contexts/TenantContext';
import { Loader2, ChevronLeft, ChevronRight, Plus, X, Clock, User } from 'lucide-react';

export default function ScheduleManagement() {
  const { tenantId } = useTenant();
  const [weekOffset, setWeekOffset] = useState(0);
  const [showAddForm, setShowAddForm] = useState(false);
  const [addDate, setAddDate] = useState('');
  const [addStaffId, setAddStaffId] = useState('');
  const [addStart, setAddStart] = useState('09:00');
  const [addEnd, setAddEnd] = useState('18:00');

  const getWeekRange = (offset: number) => {
    const now = new Date();
    const start = new Date(now);
    start.setDate(now.getDate() - now.getDay() + 1 + offset * 7);
    const end = new Date(start);
    end.setDate(start.getDate() + 6);
    return { startDate: start.toISOString().split('T')[0], endDate: end.toISOString().split('T')[0] };
  };

  const range = getWeekRange(weekOffset);
  const scheduleQuery = trpc.schedule.listSchedules.useQuery(
    { tenantId: tenantId!, startDate: range.startDate, endDate: range.endDate },
    { enabled: !!tenantId }
  );
  const staffQuery = trpc.staff.list.useQuery(
    { tenantId: tenantId! },
    { enabled: !!tenantId }
  );
  const addMutation = trpc.schedule.createSchedule.useMutation();
  const deleteMutation = trpc.schedule.deleteSchedule.useMutation();

  const schedules = (scheduleQuery.data || []) as any[];
  const staffList = (staffQuery.data as any)?.staff || staffQuery.data || [];
  const dayNames = ['一', '二', '三', '四', '五', '六', '日'];

  const getDaysInWeek = () => {
    const start = new Date(range.startDate);
    return Array.from({ length: 7 }, (_, i) => {
      const d = new Date(start);
      d.setDate(start.getDate() + i);
      return d.toISOString().split('T')[0];
    });
  };

  const handleAdd = async () => {
    if (!addDate || !addStaffId) return;
    try {
      await addMutation.mutateAsync({
        tenantId: tenantId!, staffId: parseInt(addStaffId), date: addDate,
        startTime: addStart, endTime: addEnd, shiftType: 'normal' as const,
      });
      scheduleQuery.refetch();
      setShowAddForm(false);
    } catch (e: unknown) {
      alert(`新增失敗: ${(e as Error).message}`);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('確定刪除此班次？')) return;
    try {
      await deleteMutation.mutateAsync({ tenantId: tenantId!, id });
      scheduleQuery.refetch();
    } catch (e: unknown) {
      alert(`刪除失敗: ${(e as Error).message}`);
    }
  };

  const days = getDaysInWeek();

  return (
    <div className="p-6 space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">排班管理</h1>
        <Button className="bg-[#06C755] hover:bg-[#05a847] text-white" onClick={() => setShowAddForm(!showAddForm)}>
          <Plus className="h-4 w-4 mr-1" /> 新增班次
        </Button>
      </div>

      {/* Week Navigation */}
      <div className="flex items-center justify-center gap-4">
        <Button variant="ghost" size="sm" onClick={() => setWeekOffset(w => w - 1)}><ChevronLeft className="h-4 w-4" /></Button>
        <span className="font-medium">{range.startDate} ~ {range.endDate}</span>
        <Button variant="ghost" size="sm" onClick={() => setWeekOffset(w => w + 1)}><ChevronRight className="h-4 w-4" /></Button>
        <Button variant="outline" size="sm" onClick={() => setWeekOffset(0)}>本週</Button>
      </div>

      {/* Add Form */}
      {showAddForm && (
        <Card className="border-[#06C755]">
          <CardContent className="p-4 grid grid-cols-2 md:grid-cols-5 gap-3 items-end">
            <div>
              <label className="text-xs text-gray-500">日期</label>
              <Input type="date" value={addDate} onChange={e => setAddDate(e.target.value)} />
            </div>
            <div>
              <label className="text-xs text-gray-500">員工</label>
              <select className="w-full border rounded-md p-2 text-sm" value={addStaffId} onChange={e => setAddStaffId(e.target.value)}>
                <option value="">選擇員工</option>
                {(staffList as any[]).map((s: any) => (
                  <option key={s.id} value={s.id}>{s.name || s.display_name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-xs text-gray-500">開始</label>
              <Input type="time" value={addStart} onChange={e => setAddStart(e.target.value)} />
            </div>
            <div>
              <label className="text-xs text-gray-500">結束</label>
              <Input type="time" value={addEnd} onChange={e => setAddEnd(e.target.value)} />
            </div>
            <Button className="bg-[#06C755] hover:bg-[#05a847] text-white" disabled={addMutation.isPending} onClick={handleAdd}>
              {addMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : '確認新增'}
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Week Grid */}
      {scheduleQuery.isLoading ? (
        <div className="flex justify-center py-8"><Loader2 className="h-6 w-6 animate-spin" /></div>
      ) : (
        <div className="grid grid-cols-7 gap-2">
          {days.map((date, i) => {
            const isToday = date === new Date().toISOString().split('T')[0];
            const daySchedules = schedules.filter(s => s.date === date);
            return (
              <Card key={date} className={isToday ? 'border-[#06C755] border-2' : ''}>
                <CardHeader className="p-2 pb-1">
                  <div className="text-center">
                    <p className={`text-xs font-bold ${isToday ? 'text-[#06C755]' : 'text-gray-400'}`}>{dayNames[i]}</p>
                    <p className="text-sm font-medium">{date.slice(5)}</p>
                  </div>
                </CardHeader>
                <CardContent className="p-2 space-y-1 min-h-[80px]">
                  {daySchedules.length === 0 ? (
                    <p className="text-[10px] text-gray-300 text-center">無班次</p>
                  ) : (
                    daySchedules.map((s, j) => (
                      <div key={j} className="bg-green-50 rounded p-1 text-[10px] relative group">
                        <div className="flex items-center gap-1">
                          <User className="h-3 w-3 text-[#06C755]" />
                          <span className="truncate">{s.staffName || '-'}</span>
                        </div>
                        <div className="flex items-center gap-1 text-gray-400">
                          <Clock className="h-2 w-2" />
                          <span>{s.startTime}-{s.endTime}</span>
                        </div>
                        <button className="absolute top-0 right-0 opacity-0 group-hover:opacity-100 p-0.5" onClick={() => handleDelete(s.id)}>
                          <X className="h-3 w-3 text-red-400" />
                        </button>
                      </div>
                    ))
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
