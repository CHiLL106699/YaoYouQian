/**
 * LIFF 員工業績 — 業績統計、排名、目標達成率
 */
import React, { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { trpc } from '@/lib/trpc';
import LiffLayout from '@/components/LiffLayout';
import { Loader2, TrendingUp, DollarSign, Users, Target, Award } from 'lucide-react';

function PerformanceContent({ profile, tenantId }: { profile: { displayName: string; userId: string }; tenantId: number }) {
  const [period, setPeriod] = useState<'week' | 'month'>('month');

  const now = new Date();
  const monthStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;

  const statsQuery = trpc.analytics.getStaffPerformance.useQuery(
    { tenantId, lineUserId: profile.userId, period, month: monthStr },
  );

  const stats = statsQuery.data;

  return (
    <div className="p-4 pb-20">
      {/* Period Toggle */}
      <div className="flex gap-2 mb-4">
        <Button variant={period === 'week' ? 'default' : 'outline'} size="sm"
          className={period === 'week' ? 'bg-[#06C755] hover:bg-[#05a847] text-white' : ''}
          onClick={() => setPeriod('week')}>本週</Button>
        <Button variant={period === 'month' ? 'default' : 'outline'} size="sm"
          className={period === 'month' ? 'bg-[#06C755] hover:bg-[#05a847] text-white' : ''}
          onClick={() => setPeriod('month')}>本月</Button>
      </div>

      {statsQuery.isLoading ? (
        <div className="flex justify-center py-8"><Loader2 className="h-6 w-6 animate-spin text-[#06C755]" /></div>
      ) : (
        <>
          {/* Revenue Card */}
          <Card className="bg-gradient-to-br from-[#06C755] to-[#04a045] text-white mb-4">
            <CardContent className="p-5">
              <div className="flex items-center gap-2 mb-2">
                <DollarSign className="h-5 w-5" />
                <span className="text-sm text-white/80">{period === 'week' ? '本週' : '本月'}業績</span>
              </div>
              <p className="text-3xl font-bold">NT${stats?.revenue || '0'}</p>
              {stats?.revenueGrowth !== undefined && (
                <div className="flex items-center gap-1 mt-2 text-sm">
                  <TrendingUp className="h-4 w-4" />
                  <span className={stats.revenueGrowth >= 0 ? 'text-white' : 'text-red-200'}>
                    {stats.revenueGrowth >= 0 ? '+' : ''}{stats.revenueGrowth}%
                  </span>
                  <span className="text-white/60 text-xs">vs 上期</span>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Stats Grid */}
          <div className="grid grid-cols-2 gap-3 mb-4">
            <Card>
              <CardContent className="p-4 text-center">
                <Users className="h-5 w-5 text-blue-500 mx-auto mb-1" />
                <p className="text-2xl font-bold">{stats?.customerCount || 0}</p>
                <p className="text-xs text-gray-400">服務人次</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4 text-center">
                <Target className="h-5 w-5 text-orange-500 mx-auto mb-1" />
                <p className="text-2xl font-bold">{stats?.appointmentCount || 0}</p>
                <p className="text-xs text-gray-400">預約數</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4 text-center">
                <Award className="h-5 w-5 text-yellow-500 mx-auto mb-1" />
                <p className="text-2xl font-bold">{stats?.avgRating || '-'}</p>
                <p className="text-xs text-gray-400">平均評分</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4 text-center">
                <DollarSign className="h-5 w-5 text-[#06C755] mx-auto mb-1" />
                <p className="text-2xl font-bold">NT${stats?.avgPerCustomer || '0'}</p>
                <p className="text-xs text-gray-400">客單價</p>
              </CardContent>
            </Card>
          </div>

          {/* Target Progress */}
          {stats?.targetAmount && (
            <Card className="mb-4">
              <CardContent className="p-4">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm font-medium">目標達成率</span>
                  <span className="text-sm font-bold text-[#06C755]">{stats.targetProgress || 0}%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-3">
                  <div className="bg-[#06C755] h-3 rounded-full transition-all" style={{ width: `${Math.min(100, stats.targetProgress || 0)}%` }} />
                </div>
                <div className="flex justify-between text-xs text-gray-400 mt-1">
                  <span>NT$0</span>
                  <span>目標 NT${stats.targetAmount}</span>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Recent Services */}
          {stats?.recentServices && (stats.recentServices as any[]).length > 0 && (
            <>
              <h3 className="font-bold text-sm mb-2">近期服務</h3>
              <div className="space-y-2">
                {(stats.recentServices as any[]).map((svc: any, i: number) => (
                  <Card key={i}>
                    <CardContent className="p-3 flex justify-between items-center">
                      <div>
                        <p className="text-sm font-medium">{svc.serviceName}</p>
                        <p className="text-xs text-gray-400">{svc.date} {svc.customerName}</p>
                      </div>
                      <span className="text-sm font-bold text-[#06C755]">NT${svc.amount}</span>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </>
          )}
        </>
      )}
    </div>
  );
}

export default function StaffPerformance() {
  return <LiffLayout title="我的業績">{(props) => <PerformanceContent {...props} />}</LiffLayout>;
}
