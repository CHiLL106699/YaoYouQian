/**
 * LIFF 員工打卡 — GPS 定位、打卡記錄、當月出勤統計
 */
import React, { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { trpc } from '@/lib/trpc';
import LiffLayout from '@/components/LiffLayout';
import { Loader2, MapPin, Clock as ClockIcon, LogIn, LogOut, Calendar } from 'lucide-react';

function ClockContent({ profile, tenantId }: { profile: { displayName: string; userId: string }; tenantId: number }) {
  const [location, setLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [locError, setLocError] = useState<string | null>(null);
  const [gettingLoc, setGettingLoc] = useState(false);

  const todayStr = new Date().toISOString().split('T')[0];
  const monthStr = todayStr.slice(0, 7);

  const todayRecords = trpc.clock.getTodayRecord.useQuery({ tenantId, staffId: 0 }, { enabled: false });
  const monthRecords = trpc.clock.listRecords.useQuery({ tenantId, limit: 30 });
  const clockInMutation = trpc.clock.clockIn.useMutation();
  const clockOutMutation = trpc.clock.clockOut.useMutation();

  useEffect(() => {
    getLocation();
  }, []);

  const getLocation = () => {
    setGettingLoc(true);
    setLocError(null);
    if (!navigator.geolocation) {
      setLocError('此裝置不支援定位');
      setGettingLoc(false);
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => { setLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude }); setGettingLoc(false); },
      (err) => { setLocError(`定位失敗: ${err.message}`); setGettingLoc(false); },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  const handleClockIn = async () => {
    try {
      await clockInMutation.mutateAsync({
        tenantId, staffId: 0,
        location: location ? `${location.lat},${location.lng}` : undefined,
      });
      monthRecords.refetch();
    } catch (e: unknown) {
      alert(`打卡失敗: ${(e as Error).message}`);
    }
  };

  const handleClockOut = async () => {
    try {
      await clockOutMutation.mutateAsync({
        tenantId, staffId: 0,
        location: location ? `${location.lat},${location.lng}` : undefined,
      });
      monthRecords.refetch();
    } catch (e: unknown) {
      alert(`打卡失敗: ${(e as Error).message}`);
    }
  };

  const allRecords = ((monthRecords.data as any)?.records || []) as any[];
  const records = allRecords.filter((r: any) => r.date === todayStr);
  const monthData = allRecords.filter((r: any) => r.date?.startsWith(monthStr));
  const stats = { totalDays: monthData.length, lateDays: 0, onTimeDays: monthData.length, absentDays: 0 };
  const now = new Date();
  const timeStr = now.toLocaleTimeString('zh-TW', { hour: '2-digit', minute: '2-digit' });

  return (
    <div className="p-4 pb-20">
      {/* Current Time */}
      <div className="text-center mb-6">
        <p className="text-4xl font-bold text-gray-800">{timeStr}</p>
        <p className="text-sm text-gray-400 mt-1">{todayStr}</p>
      </div>

      {/* GPS Status */}
      <Card className="mb-4">
        <CardContent className="p-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <MapPin className={`h-4 w-4 ${location ? 'text-[#06C755]' : 'text-gray-300'}`} />
            <span className="text-sm">{location ? `${location.lat.toFixed(4)}, ${location.lng.toFixed(4)}` : locError || '定位中...'}</span>
          </div>
          <Button variant="ghost" size="sm" onClick={getLocation} disabled={gettingLoc}>
            {gettingLoc ? <Loader2 className="h-4 w-4 animate-spin" /> : '重新定位'}
          </Button>
        </CardContent>
      </Card>

      {/* Clock Buttons */}
      <div className="grid grid-cols-2 gap-3 mb-6">
        <Button className="h-20 bg-[#06C755] hover:bg-[#05a847] text-white flex-col gap-1"
          disabled={clockInMutation.isPending || !location}
          onClick={handleClockIn}>
          {clockInMutation.isPending ? <Loader2 className="h-6 w-6 animate-spin" /> : <LogIn className="h-6 w-6" />}
          <span className="text-sm font-bold">上班打卡</span>
        </Button>
        <Button className="h-20 bg-orange-500 hover:bg-orange-600 text-white flex-col gap-1"
          disabled={clockOutMutation.isPending || !location}
          onClick={handleClockOut}>
          {clockOutMutation.isPending ? <Loader2 className="h-6 w-6 animate-spin" /> : <LogOut className="h-6 w-6" />}
          <span className="text-sm font-bold">下班打卡</span>
        </Button>
      </div>

      {/* Today Records */}
      <h3 className="font-bold text-sm mb-2 flex items-center gap-1"><ClockIcon className="h-4 w-4 text-[#06C755]" /> 今日打卡紀錄</h3>
      {todayRecords.isLoading ? (
        <div className="flex justify-center py-4"><Loader2 className="h-5 w-5 animate-spin text-[#06C755]" /></div>
      ) : records.length === 0 ? (
        <p className="text-center text-gray-400 py-4 text-sm">今日尚未打卡</p>
      ) : (
        <div className="space-y-2 mb-6">
          {records.map((r, i) => (
            <Card key={i}>
              <CardContent className="p-3 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  {r.type === 'clock_in' ? <LogIn className="h-4 w-4 text-[#06C755]" /> : <LogOut className="h-4 w-4 text-orange-500" />}
                  <span className="text-sm">{r.type === 'clock_in' ? '上班' : '下班'}</span>
                </div>
                <span className="text-sm font-medium">{r.time}</span>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Monthly Stats */}
      <h3 className="font-bold text-sm mb-2 flex items-center gap-1"><Calendar className="h-4 w-4 text-[#06C755]" /> 當月出勤統計</h3>
      {monthRecords.isLoading ? (
        <div className="flex justify-center py-4"><Loader2 className="h-5 w-5 animate-spin text-[#06C755]" /></div>
      ) : (
        <div className="grid grid-cols-3 gap-3">
          <Card><CardContent className="p-3 text-center"><p className="text-xl font-bold text-[#06C755]">{stats?.totalDays || 0}</p><p className="text-xs text-gray-400">出勤天數</p></CardContent></Card>
          <Card><CardContent className="p-3 text-center"><p className="text-xl font-bold text-yellow-500">{stats?.lateDays || 0}</p><p className="text-xs text-gray-400">遲到</p></CardContent></Card>
          <Card><CardContent className="p-3 text-center"><p className="text-xl font-bold text-blue-500">{stats?.onTimeDays || 0}</p><p className="text-xs text-gray-400">準時</p></CardContent></Card>
        </div>
      )}
    </div>
  );
}

export default function StaffClock() {
  return <LiffLayout title="員工打卡">{(props) => <ClockContent {...props} />}</LiffLayout>;
}
