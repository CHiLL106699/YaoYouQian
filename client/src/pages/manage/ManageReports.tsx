/**
 * 報表分析 — 營收、預約、客戶分析
 */
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { trpc } from '@/lib/trpc';
import { useTenant } from '@/contexts/TenantContext';
import { Loader2, DollarSign, Calendar, Users, TrendingUp, TrendingDown, BarChart3, PieChart } from 'lucide-react';

export default function ManageReports() {
  const { tenantId } = useTenant();
  const [tab, setTab] = useState('revenue');
  const [period, setPeriod] = useState<'week' | 'month' | 'year'>('month');

  const now = new Date();
  const monthStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;

  const revenueQuery = trpc.analytics.getRevenueReport.useQuery(
    { tenantId: tenantId!, period, month: monthStr },
    { enabled: !!tenantId }
  );
  const appointmentQuery = trpc.analytics.getAppointmentReport.useQuery(
    { tenantId: tenantId!, period, month: monthStr },
    { enabled: !!tenantId }
  );
  const customerQuery = trpc.analytics.getCustomerReport.useQuery(
    { tenantId: tenantId!, period, month: monthStr },
    { enabled: !!tenantId }
  );

  const revenue = revenueQuery.data;
  const appointmentStats = appointmentQuery.data;
  const customerStats = customerQuery.data;

  return (
    <div className="p-6 space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">報表分析</h1>
        <div className="flex gap-2">
          {(['week', 'month', 'year'] as const).map(p => (
            <Button key={p} variant={period === p ? 'default' : 'outline'} size="sm"
              className={period === p ? 'bg-[#06C755] hover:bg-[#05a847] text-white' : ''}
              onClick={() => setPeriod(p)}>
              {p === 'week' ? '本週' : p === 'month' ? '本月' : '本年'}
            </Button>
          ))}
        </div>
      </div>

      <Tabs value={tab} onValueChange={setTab}>
        <TabsList>
          <TabsTrigger value="revenue"><DollarSign className="h-4 w-4 mr-1" /> 營收</TabsTrigger>
          <TabsTrigger value="appointments"><Calendar className="h-4 w-4 mr-1" /> 預約</TabsTrigger>
          <TabsTrigger value="customers"><Users className="h-4 w-4 mr-1" /> 客戶</TabsTrigger>
        </TabsList>

        {/* Revenue Tab */}
        <TabsContent value="revenue" className="mt-4 space-y-4">
          {revenueQuery.isLoading ? (
            <div className="flex justify-center py-8"><Loader2 className="h-6 w-6 animate-spin" /></div>
          ) : (
            <>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card className="bg-gradient-to-br from-[#06C755] to-[#04a045] text-white">
                  <CardContent className="p-5">
                    <p className="text-sm text-white/80">總營收</p>
                    <p className="text-3xl font-bold mt-1">NT${revenue?.totalRevenue || '0'}</p>
                    {revenue?.revenueGrowth !== undefined && (
                      <div className="flex items-center gap-1 mt-2 text-sm">
                        {revenue.revenueGrowth >= 0 ? <TrendingUp className="h-4 w-4" /> : <TrendingDown className="h-4 w-4" />}
                        <span>{revenue.revenueGrowth >= 0 ? '+' : ''}{revenue.revenueGrowth}%</span>
                      </div>
                    )}
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-5">
                    <p className="text-sm text-gray-400">平均客單價</p>
                    <p className="text-3xl font-bold mt-1">NT${revenue?.avgOrderValue || '0'}</p>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-5">
                    <p className="text-sm text-gray-400">交易筆數</p>
                    <p className="text-3xl font-bold mt-1">{revenue?.transactionCount || 0}</p>
                  </CardContent>
                </Card>
              </div>

              {/* Revenue by Service */}
              {revenue?.byService && (revenue.byService as any[]).length > 0 && (
                <Card>
                  <CardHeader><CardTitle className="text-lg flex items-center gap-2"><PieChart className="h-5 w-5" /> 各服務營收</CardTitle></CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {(revenue.byService as any[]).map((s: any, i: number) => (
                        <div key={i}>
                          <div className="flex justify-between text-sm mb-1">
                            <span>{s.name}</span>
                            <span className="font-medium">NT${s.revenue}</span>
                          </div>
                          <div className="w-full bg-gray-100 rounded-full h-2">
                            <div className="bg-[#06C755] h-2 rounded-full" style={{ width: `${s.percentage || 0}%` }} />
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Daily Revenue */}
              {revenue?.daily && (revenue.daily as any[]).length > 0 && (
                <Card>
                  <CardHeader><CardTitle className="text-lg flex items-center gap-2"><BarChart3 className="h-5 w-5" /> 每日營收</CardTitle></CardHeader>
                  <CardContent>
                    <div className="flex items-end gap-1 h-40">
                      {(revenue.daily as any[]).map((d: any, i: number) => {
                        const maxVal = Math.max(...(revenue.daily as any[]).map((x: any) => x.revenue || 0));
                        const height = maxVal > 0 ? ((d.revenue || 0) / maxVal) * 100 : 0;
                        return (
                          <div key={i} className="flex-1 flex flex-col items-center gap-1">
                            <div className="w-full bg-[#06C755]/20 rounded-t relative" style={{ height: `${height}%`, minHeight: '2px' }}>
                              <div className="absolute inset-0 bg-[#06C755] rounded-t" />
                            </div>
                            <span className="text-[8px] text-gray-400">{d.date?.slice(5) || ''}</span>
                          </div>
                        );
                      })}
                    </div>
                  </CardContent>
                </Card>
              )}
            </>
          )}
        </TabsContent>

        {/* Appointments Tab */}
        <TabsContent value="appointments" className="mt-4 space-y-4">
          {appointmentQuery.isLoading ? (
            <div className="flex justify-center py-8"><Loader2 className="h-6 w-6 animate-spin" /></div>
          ) : (
            <>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <Card><CardContent className="p-4 text-center"><p className="text-2xl font-bold">{appointmentStats?.total || 0}</p><p className="text-xs text-gray-400">總預約</p></CardContent></Card>
                <Card><CardContent className="p-4 text-center"><p className="text-2xl font-bold text-green-500">{appointmentStats?.completed || 0}</p><p className="text-xs text-gray-400">已完成</p></CardContent></Card>
                <Card><CardContent className="p-4 text-center"><p className="text-2xl font-bold text-red-500">{appointmentStats?.cancelled || 0}</p><p className="text-xs text-gray-400">已取消</p></CardContent></Card>
                <Card><CardContent className="p-4 text-center"><p className="text-2xl font-bold text-blue-500">{appointmentStats?.completionRate || '0'}%</p><p className="text-xs text-gray-400">完成率</p></CardContent></Card>
              </div>

              {/* Popular Services */}
              {appointmentStats?.popularServices && (appointmentStats.popularServices as any[]).length > 0 && (
                <Card>
                  <CardHeader><CardTitle className="text-lg">熱門服務</CardTitle></CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      {(appointmentStats.popularServices as any[]).map((s: any, i: number) => (
                        <div key={i} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                          <div className="flex items-center gap-2">
                            <span className="w-6 h-6 rounded-full bg-[#06C755] text-white text-xs flex items-center justify-center">{i + 1}</span>
                            <span className="text-sm">{s.name}</span>
                          </div>
                          <span className="text-sm font-medium">{s.count} 次</span>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Peak Hours */}
              {appointmentStats?.peakHours && (appointmentStats.peakHours as any[]).length > 0 && (
                <Card>
                  <CardHeader><CardTitle className="text-lg">尖峰時段</CardTitle></CardHeader>
                  <CardContent>
                    <div className="flex items-end gap-1 h-32">
                      {(appointmentStats.peakHours as any[]).map((h: any, i: number) => {
                        const maxVal = Math.max(...(appointmentStats.peakHours as any[]).map((x: any) => x.count || 0));
                        const height = maxVal > 0 ? ((h.count || 0) / maxVal) * 100 : 0;
                        return (
                          <div key={i} className="flex-1 flex flex-col items-center gap-1">
                            <div className="w-full rounded-t" style={{ height: `${height}%`, minHeight: '2px', backgroundColor: height > 70 ? '#06C755' : '#d1d5db' }} />
                            <span className="text-[8px] text-gray-400">{h.hour}:00</span>
                          </div>
                        );
                      })}
                    </div>
                  </CardContent>
                </Card>
              )}
            </>
          )}
        </TabsContent>

        {/* Customers Tab */}
        <TabsContent value="customers" className="mt-4 space-y-4">
          {customerQuery.isLoading ? (
            <div className="flex justify-center py-8"><Loader2 className="h-6 w-6 animate-spin" /></div>
          ) : (
            <>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <Card><CardContent className="p-4 text-center"><p className="text-2xl font-bold">{customerStats?.totalCustomers || 0}</p><p className="text-xs text-gray-400">總客戶</p></CardContent></Card>
                <Card><CardContent className="p-4 text-center"><p className="text-2xl font-bold text-green-500">{customerStats?.newCustomers || 0}</p><p className="text-xs text-gray-400">新客戶</p></CardContent></Card>
                <Card><CardContent className="p-4 text-center"><p className="text-2xl font-bold text-blue-500">{customerStats?.returningCustomers || 0}</p><p className="text-xs text-gray-400">回訪客戶</p></CardContent></Card>
                <Card><CardContent className="p-4 text-center"><p className="text-2xl font-bold text-purple-500">{customerStats?.retentionRate || '0'}%</p><p className="text-xs text-gray-400">留存率</p></CardContent></Card>
              </div>

              {/* Top Customers */}
              {customerStats?.topCustomers && (customerStats.topCustomers as any[]).length > 0 && (
                <Card>
                  <CardHeader><CardTitle className="text-lg">VIP 客戶</CardTitle></CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      {(customerStats.topCustomers as any[]).map((c: any, i: number) => (
                        <div key={i} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                          <div className="flex items-center gap-2">
                            <span className="w-6 h-6 rounded-full bg-yellow-400 text-white text-xs flex items-center justify-center">{i + 1}</span>
                            <span className="text-sm">{c.name}</span>
                          </div>
                          <div className="text-right">
                            <p className="text-sm font-medium">NT${c.totalSpent}</p>
                            <p className="text-[10px] text-gray-400">{c.visitCount} 次</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}
            </>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
