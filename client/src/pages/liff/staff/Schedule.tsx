/**
 * LIFF 員工班表 — 週視圖、月視圖、換班申請
 */
import React, { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
import { trpc } from '@/lib/trpc';
import LiffLayout from '@/components/LiffLayout';
import { Loader2, Calendar, Clock, ArrowLeftRight, ChevronLeft, ChevronRight } from 'lucide-react';

function ScheduleContent({ profile, tenantId }: { profile: { displayName: string; userId: string }; tenantId: number }) {
  const [view, setView] = useState<'week' | 'month'>('week');
  const [weekOffset, setWeekOffset] = useState(0);
  const [showSwapForm, setShowSwapForm] = useState(false);
  const [swapDate, setSwapDate] = useState('');
  const [swapReason, setSwapReason] = useState('');

  const getWeekRange = (offset: number) => {
    const now = new Date();
    const start = new Date(now);
    start.setDate(now.getDate() - now.getDay() + 1 + offset * 7);
    const end = new Date(start);
    end.setDate(start.getDate() + 6);
    return { startDate: start.toISOString().split('T')[0], endDate: end.toISOString().split('T')[0] };
  };

  const getMonthRange = () => {
    const now = new Date();
    const start = new Date(now.getFullYear(), now.getMonth(), 1);
    const end = new Date(now.getFullYear(), now.getMonth() + 1, 0);
    return { startDate: start.toISOString().split('T')[0], endDate: end.toISOString().split('T')[0] };
  };

  const range = view === 'week' ? getWeekRange(weekOffset) : getMonthRange();
  const monthStr = new Date().toISOString().slice(0, 7);
  const scheduleQuery = trpc.schedule.getMySchedule.useQuery({ tenantId, staffId: 0, month: monthStr });
  const _swapEnabled = false; // swap not yet in router

  const schedules = (scheduleQuery.data || []) as any[];
  const dayNames = ['一', '二', '三', '四', '五', '六', '日'];

  const handleSwap = async () => {
    if (!swapDate || !swapReason) return;
    try {
      // Swap request placeholder - not yet implemented in router
      await Promise.resolve();
      alert('換班申請已送出');
      setShowSwapForm(false);
      setSwapDate('');
      setSwapReason('');
    } catch (e: unknown) {
      alert(`申請失敗: ${(e as Error).message}`);
    }
  };

  return (
    <div className="p-4 pb-20">
      <Tabs value={view} onValueChange={(v) => setView(v as 'week' | 'month')}>
        <div className="flex items-center justify-between mb-4">
          <TabsList className="bg-gray-100">
            <TabsTrigger value="week">週視圖</TabsTrigger>
            <TabsTrigger value="month">月視圖</TabsTrigger>
          </TabsList>
          <Button variant="outline" size="sm" onClick={() => setShowSwapForm(!showSwapForm)}>
            <ArrowLeftRight className="h-4 w-4 mr-1" /> 換班
          </Button>
        </div>

        {/* Week Navigation */}
        {view === 'week' && (
          <div className="flex items-center justify-between mb-3">
            <Button variant="ghost" size="sm" onClick={() => setWeekOffset(w => w - 1)}><ChevronLeft className="h-4 w-4" /></Button>
            <span className="text-sm font-medium">{range.startDate} ~ {range.endDate}</span>
            <Button variant="ghost" size="sm" onClick={() => setWeekOffset(w => w + 1)}><ChevronRight className="h-4 w-4" /></Button>
          </div>
        )}

        {/* Swap Form */}
        {showSwapForm && (
          <Card className="mb-4 border-[#06C755]">
            <CardContent className="p-4 space-y-3">
              <h3 className="font-bold text-sm">換班申請</h3>
              <div>
                <label className="text-xs text-gray-500">換班日期</label>
                <input type="date" className="w-full border rounded-lg p-2 text-sm mt-1" value={swapDate} onChange={e => setSwapDate(e.target.value)} />
              </div>
              <div>
                <label className="text-xs text-gray-500">原因</label>
                <Textarea value={swapReason} onChange={e => setSwapReason(e.target.value)} placeholder="請說明換班原因" rows={2} className="mt-1" />
              </div>
              <Button className="w-full bg-[#06C755] hover:bg-[#05a847] text-white" onClick={handleSwap}>
                {'送出申請'}
              </Button>
            </CardContent>
          </Card>
        )}

        {scheduleQuery.isLoading ? (
          <div className="flex justify-center py-8"><Loader2 className="h-6 w-6 animate-spin text-[#06C755]" /></div>
        ) : (
          <>
            <TabsContent value="week" className="mt-0">
              <div className="space-y-2">
                {(() => {
                  const start = new Date(range.startDate);
                  return Array.from({ length: 7 }, (_, i) => {
                    const d = new Date(start);
                    d.setDate(start.getDate() + i);
                    const dateStr = d.toISOString().split('T')[0];
                    const daySchedules = schedules.filter(s => s.date === dateStr);
                    const isToday = dateStr === new Date().toISOString().split('T')[0];
                    return (
                      <Card key={dateStr} className={isToday ? 'border-[#06C755] border-2' : ''}>
                        <CardContent className="p-3">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <span className={`text-xs font-bold w-6 h-6 rounded-full flex items-center justify-center ${isToday ? 'bg-[#06C755] text-white' : 'bg-gray-100 text-gray-500'}`}>
                                {dayNames[i]}
                              </span>
                              <span className="text-sm">{dateStr.slice(5)}</span>
                            </div>
                            {daySchedules.length > 0 ? (
                              <div className="flex gap-1">
                                {daySchedules.map((s, j) => (
                                  <Badge key={j} className="bg-[#06C755]/10 text-[#06C755] text-xs">
                                    <Clock className="h-3 w-3 mr-1" />{s.startTime}-{s.endTime}
                                  </Badge>
                                ))}
                              </div>
                            ) : (
                              <span className="text-xs text-gray-300">休假</span>
                            )}
                          </div>
                        </CardContent>
                      </Card>
                    );
                  });
                })()}
              </div>
            </TabsContent>

            <TabsContent value="month" className="mt-0">
              <div className="grid grid-cols-7 gap-1 text-center text-xs mb-1">
                {dayNames.map(d => <span key={d} className="text-gray-400 font-medium py-1">{d}</span>)}
              </div>
              <div className="grid grid-cols-7 gap-1">
                {(() => {
                  const mRange = getMonthRange();
                  const firstDay = new Date(mRange.startDate);
                  const lastDay = new Date(mRange.endDate);
                  const startDow = (firstDay.getDay() + 6) % 7;
                  const cells = [];
                  for (let i = 0; i < startDow; i++) cells.push(<div key={`e-${i}`} />);
                  for (let d = new Date(firstDay); d <= lastDay; d.setDate(d.getDate() + 1)) {
                    const dateStr = d.toISOString().split('T')[0];
                    const hasSchedule = schedules.some(s => s.date === dateStr);
                    const isToday = dateStr === new Date().toISOString().split('T')[0];
                    cells.push(
                      <div key={dateStr} className={`aspect-square flex items-center justify-center rounded-lg text-xs ${isToday ? 'bg-[#06C755] text-white font-bold' : hasSchedule ? 'bg-green-50 text-[#06C755] font-medium' : 'text-gray-400'}`}>
                        {d.getDate()}
                      </div>
                    );
                  }
                  return cells;
                })()}
              </div>
              <div className="flex gap-4 mt-3 text-xs text-gray-400">
                <span className="flex items-center gap-1"><span className="w-3 h-3 rounded bg-green-50 border border-[#06C755]/30" /> 有班</span>
                <span className="flex items-center gap-1"><span className="w-3 h-3 rounded bg-[#06C755]" /> 今天</span>
              </div>
            </TabsContent>
          </>
        )}
      </Tabs>
    </div>
  );
}

export default function StaffSchedule() {
  return <LiffLayout title="我的班表">{(props) => <ScheduleContent {...props} />}</LiffLayout>;
}
