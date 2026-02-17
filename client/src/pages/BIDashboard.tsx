/**
 * BIDashboard.tsx
 * BI 數據儀表板 — 營收概覽、療程分析、客戶分析、員工績效、預約分析
 */
import { useState } from 'react';
import { trpc } from '@/lib/trpc';
import { useTenant } from '@/contexts/TenantContext';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from 'sonner';
import {
  BarChart3, TrendingUp, TrendingDown, Users, DollarSign,
  Calendar, Download, Activity, UserCheck, Clock
} from 'lucide-react';

export default function BIDashboard() {
  const { tenantId } = useTenant();
  const [period, setPeriod] = useState<'day' | 'week' | 'month' | 'year'>('month');

  // KPI 摘要
  const { data: kpi, isLoading: kpiLoading, error } = trpc.biDashboard.getKPISummary.useQuery(
    { tenantId: tenantId! },
    { enabled: !!tenantId }
  );

  // 營收概覽
  const { data: revenue, isLoading: revenueLoading } = trpc.biDashboard.getRevenueOverview.useQuery(
    { tenantId: tenantId!, period },
    { enabled: !!tenantId }
  );

  // 療程分析
  const { data: serviceAnalytics } = trpc.biDashboard.getServiceAnalytics.useQuery(
    { tenantId: tenantId! },
    { enabled: !!tenantId }
  );

  // 客戶分析
  const { data: customerAnalytics } = trpc.biDashboard.getCustomerAnalytics.useQuery(
    { tenantId: tenantId!, days: 90 },
    { enabled: !!tenantId }
  );

  // 員工績效
  const { data: staffPerformance } = trpc.biDashboard.getStaffPerformance.useQuery(
    { tenantId: tenantId! },
    { enabled: !!tenantId }
  );

  // 預約分析
  const { data: appointmentAnalytics } = trpc.biDashboard.getAppointmentAnalytics.useQuery(
    { tenantId: tenantId!, days: 30 },
    { enabled: !!tenantId }
  );

  // 熱門療程
  const { data: topServices } = trpc.biDashboard.getTopServices.useQuery(
    { tenantId: tenantId!, limit: 5 },
    { enabled: !!tenantId }
  );

  // 匯出報表
  const exportMutation = trpc.biDashboard.exportReport.useMutation({
    onSuccess: (data) => {
      const blob = new Blob([data.csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = data.fileName;
      a.click();
      URL.revokeObjectURL(url);
      toast.success('報表匯出成功');
    },
    onError: (err) => toast.error(`匯出失敗：${err.message}`),
  });

  const handleExport = (reportType: 'revenue' | 'appointments' | 'customers' | 'services') => {
    if (!tenantId) return;
    exportMutation.mutate({ tenantId, reportType });
  };

  const formatCurrency = (n: number) => `NT$ ${n.toLocaleString()}`;

  const GrowthBadge = ({ value }: { value: number }) => (
    <Badge variant={value >= 0 ? 'default' : 'destructive'} className="ml-2 text-xs">
      {value >= 0 ? <TrendingUp className="h-3 w-3 mr-1" /> : <TrendingDown className="h-3 w-3 mr-1" />}
      {value >= 0 ? '+' : ''}{value}%
    </Badge>
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <BarChart3 className="h-6 w-6" />BI 數據儀表板
        </h1>
        <div className="flex items-center gap-2">
          <Select value={period} onValueChange={(v) => setPeriod(v as any)}>
            <SelectTrigger className="w-[120px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="day">按日</SelectItem>
              <SelectItem value="week">按週</SelectItem>
              <SelectItem value="month">按月</SelectItem>
              <SelectItem value="year">按年</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline" size="sm" onClick={() => handleExport('revenue')}>
            <Download className="h-4 w-4 mr-1" />匯出營收
          </Button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-muted-foreground flex items-center gap-1">
              <DollarSign className="h-4 w-4" />本月營收
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{kpiLoading ? '...' : formatCurrency(kpi?.monthlyRevenue || 0)}</p>
            {kpi && <GrowthBadge value={kpi.revenueGrowth} />}
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-muted-foreground flex items-center gap-1">
              <Calendar className="h-4 w-4" />本月預約
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{kpiLoading ? '...' : (kpi?.monthlyAppointments || 0)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-muted-foreground flex items-center gap-1">
              <Users className="h-4 w-4" />總客戶數
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{kpiLoading ? '...' : (kpi?.totalCustomers || 0)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-muted-foreground flex items-center gap-1">
              <UserCheck className="h-4 w-4" />本月新客
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{kpiLoading ? '...' : (kpi?.newCustomers || 0)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-muted-foreground flex items-center gap-1">
              <Activity className="h-4 w-4" />回訪率
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{customerAnalytics?.returnRate || 0}%</p>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="revenue" className="space-y-4">
        <TabsList>
          <TabsTrigger value="revenue">營收趨勢</TabsTrigger>
          <TabsTrigger value="services">療程分析</TabsTrigger>
          <TabsTrigger value="customers">客戶分析</TabsTrigger>
          <TabsTrigger value="staff">員工績效</TabsTrigger>
          <TabsTrigger value="appointments">預約分析</TabsTrigger>
        </TabsList>

        {/* 營收趨勢 */}
        <TabsContent value="revenue">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            <Card className="lg:col-span-2">
              <CardHeader>
                <CardTitle>營收趨勢</CardTitle>
                <CardDescription>
                  總營收 {formatCurrency(revenue?.totalRevenue || 0)} | 訂單數 {revenue?.orderCount || 0} | 客單價 {formatCurrency(revenue?.averageOrderValue || 0)}
                </CardDescription>
              </CardHeader>
              <CardContent>
                {revenueLoading ? (
                  <p className="text-center py-8 text-muted-foreground">載入中...</p>
                ) : !revenue?.trend?.length ? (
                  <p className="text-center py-8 text-muted-foreground">尚無數據</p>
                ) : (
                  <div className="space-y-2 max-h-[400px] overflow-y-auto">
                    {revenue.trend.map((d, i) => {
                      const maxRev = Math.max(...revenue.trend.map(t => t.revenue));
                      const pct = maxRev > 0 ? (d.revenue / maxRev) * 100 : 0;
                      return (
                        <div key={i} className="flex items-center gap-3 text-sm">
                          <span className="text-muted-foreground w-24 shrink-0">{d.date}</span>
                          <div className="flex-1 bg-muted rounded-full h-6 overflow-hidden">
                            <div
                              className="bg-primary h-full rounded-full flex items-center justify-end pr-2 text-xs text-primary-foreground font-medium"
                              style={{ width: `${Math.max(pct, 8)}%` }}
                            >
                              {formatCurrency(d.revenue)}
                            </div>
                          </div>
                          <span className="text-muted-foreground w-16 text-right">{d.orderCount} 單</span>
                        </div>
                      );
                    })}
                  </div>
                )}
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle>熱門療程 TOP 5</CardTitle>
              </CardHeader>
              <CardContent>
                {!topServices?.length ? (
                  <p className="text-center py-8 text-muted-foreground">尚無數據</p>
                ) : (
                  <div className="space-y-3">
                    {topServices.map((s, i) => (
                      <div key={s.serviceId} className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Badge variant={i === 0 ? 'default' : 'outline'} className="w-6 h-6 flex items-center justify-center p-0">
                            {i + 1}
                          </Badge>
                          <span className="text-sm truncate max-w-[120px]">{s.name}</span>
                        </div>
                        <span className="text-sm font-medium">{formatCurrency(s.revenue)}</span>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* 療程分析 */}
        <TabsContent value="services">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>療程分析</CardTitle>
                <CardDescription>各療程營收佔比與轉換率</CardDescription>
              </div>
              <Button variant="outline" size="sm" onClick={() => handleExport('services')}>
                <Download className="h-4 w-4 mr-1" />匯出
              </Button>
            </CardHeader>
            <CardContent>
              {!serviceAnalytics?.length ? (
                <p className="text-center py-8 text-muted-foreground">尚無數據</p>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>療程名稱</TableHead>
                      <TableHead className="text-right">預約數</TableHead>
                      <TableHead className="text-right">完成數</TableHead>
                      <TableHead className="text-right">營收</TableHead>
                      <TableHead className="text-right">營收佔比</TableHead>
                      <TableHead className="text-right">轉換率</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {serviceAnalytics.map((s) => (
                      <TableRow key={s.serviceId}>
                        <TableCell className="font-medium">{s.serviceName}</TableCell>
                        <TableCell className="text-right">{s.appointmentCount}</TableCell>
                        <TableCell className="text-right">{s.completedCount}</TableCell>
                        <TableCell className="text-right">{formatCurrency(s.revenue)}</TableCell>
                        <TableCell className="text-right">
                          <Badge variant="outline">{s.revenuePercent}%</Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <Badge variant={s.conversionRate >= 70 ? 'default' : s.conversionRate >= 40 ? 'secondary' : 'destructive'}>
                            {s.conversionRate}%
                          </Badge>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* 客戶分析 */}
        <TabsContent value="customers">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle>客戶概覽</CardTitle>
                  <CardDescription>近 90 天客戶數據</CardDescription>
                </div>
                <Button variant="outline" size="sm" onClick={() => handleExport('customers')}>
                  <Download className="h-4 w-4 mr-1" />匯出
                </Button>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-4">
                  <div className="text-center p-4 bg-muted rounded-lg">
                    <p className="text-3xl font-bold">{customerAnalytics?.totalCustomers || 0}</p>
                    <p className="text-sm text-muted-foreground mt-1">總客戶數</p>
                  </div>
                  <div className="text-center p-4 bg-muted rounded-lg">
                    <p className="text-3xl font-bold">{customerAnalytics?.newCustomersInPeriod || 0}</p>
                    <p className="text-sm text-muted-foreground mt-1">新增客戶</p>
                  </div>
                  <div className="text-center p-4 bg-muted rounded-lg">
                    <p className="text-3xl font-bold">{customerAnalytics?.returnRate || 0}%</p>
                    <p className="text-sm text-muted-foreground mt-1">回訪率</p>
                  </div>
                  <div className="text-center p-4 bg-muted rounded-lg">
                    <p className="text-3xl font-bold">{customerAnalytics?.returningCustomers || 0}</p>
                    <p className="text-sm text-muted-foreground mt-1">回訪客戶</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle>新客趨勢</CardTitle>
              </CardHeader>
              <CardContent>
                {!customerAnalytics?.newCustomerTrend?.length ? (
                  <p className="text-center py-8 text-muted-foreground">尚無數據</p>
                ) : (
                  <div className="space-y-2 max-h-[300px] overflow-y-auto">
                    {customerAnalytics.newCustomerTrend.slice(-14).map((d, i) => (
                      <div key={i} className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground">{d.date}</span>
                        <Badge variant="outline">{d.count} 人</Badge>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* 員工績效 */}
        <TabsContent value="staff">
          <Card>
            <CardHeader>
              <CardTitle>員工績效</CardTitle>
              <CardDescription>各員工預約數、完成率、營收貢獻</CardDescription>
            </CardHeader>
            <CardContent>
              {!staffPerformance?.length ? (
                <p className="text-center py-8 text-muted-foreground">尚無數據</p>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>員工</TableHead>
                      <TableHead className="text-right">總預約</TableHead>
                      <TableHead className="text-right">已完成</TableHead>
                      <TableHead className="text-right">完成率</TableHead>
                      <TableHead className="text-right">營收貢獻</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {staffPerformance.map((s) => (
                      <TableRow key={s.staffName}>
                        <TableCell className="font-medium">{s.staffName}</TableCell>
                        <TableCell className="text-right">{s.totalAppointments}</TableCell>
                        <TableCell className="text-right">{s.completedAppointments}</TableCell>
                        <TableCell className="text-right">
                          <Badge variant={s.completionRate >= 80 ? 'default' : s.completionRate >= 50 ? 'secondary' : 'destructive'}>
                            {s.completionRate}%
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right font-medium">{formatCurrency(s.revenue)}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* 預約分析 */}
        <TabsContent value="appointments">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle>預約概覽</CardTitle>
                  <CardDescription>近 30 天預約數據</CardDescription>
                </div>
                <Button variant="outline" size="sm" onClick={() => handleExport('appointments')}>
                  <Download className="h-4 w-4 mr-1" />匯出
                </Button>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-4 mb-6">
                  <div className="text-center p-4 bg-muted rounded-lg">
                    <p className="text-3xl font-bold">{appointmentAnalytics?.totalAppointments || 0}</p>
                    <p className="text-sm text-muted-foreground mt-1">總預約數</p>
                  </div>
                  <div className="text-center p-4 bg-muted rounded-lg">
                    <p className="text-3xl font-bold text-destructive">{appointmentAnalytics?.noShowRate || 0}%</p>
                    <p className="text-sm text-muted-foreground mt-1">爽約率</p>
                  </div>
                </div>
                {appointmentAnalytics?.statusDistribution?.length ? (
                  <div className="space-y-2">
                    <p className="text-sm font-medium">狀態分佈</p>
                    {appointmentAnalytics.statusDistribution.map((s) => (
                      <div key={s.status} className="flex items-center justify-between text-sm">
                        <span className="capitalize">{s.status}</span>
                        <Badge variant="outline">{s.count}</Badge>
                      </div>
                    ))}
                  </div>
                ) : null}
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle>尖峰時段熱力圖</CardTitle>
                <CardDescription>依星期 × 時段的預約密度</CardDescription>
              </CardHeader>
              <CardContent>
                {!appointmentAnalytics?.heatmapData?.length ? (
                  <p className="text-center py-8 text-muted-foreground">尚無數據</p>
                ) : (
                  <div className="overflow-x-auto">
                    <div className="min-w-[500px]">
                      {/* Header row */}
                      <div className="flex gap-1 mb-1">
                        <div className="w-8" />
                        {Array.from({ length: 14 }, (_, i) => i + 8).map(h => (
                          <div key={h} className="flex-1 text-center text-xs text-muted-foreground">
                            {h}
                          </div>
                        ))}
                      </div>
                      {/* Data rows */}
                      {['日', '一', '二', '三', '四', '五', '六'].map(day => {
                        const dayData = appointmentAnalytics.heatmapData.filter(d => d.day === day);
                        return (
                          <div key={day} className="flex gap-1 mb-1">
                            <div className="w-8 text-xs text-muted-foreground flex items-center">{day}</div>
                            {Array.from({ length: 14 }, (_, i) => {
                              const hour = `${String(i + 8).padStart(2, '0')}:00`;
                              const item = dayData.find(d => d.hour === hour);
                              const count = item?.count || 0;
                              const maxCount = Math.max(...appointmentAnalytics.heatmapData.map(d => d.count), 1);
                              const intensity = count / maxCount;
                              if (error) {
                                return (
                                  <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
                                    <p className="text-destructive">載入資料時發生錯誤</p>
                                    <p className="text-sm text-muted-foreground">{error.message}</p>
                                    <Button variant="outline" onClick={() => window.location.reload()}>重試</Button>
                                  </div>
                                );
                              }

                              return (
                                <div
                                  key={hour}
                                  className="flex-1 h-8 rounded text-xs flex items-center justify-center"
                                  style={{
                                    backgroundColor: count > 0
                                      ? `rgba(99, 102, 241, ${0.15 + intensity * 0.85})`
                                      : 'hsl(var(--muted))',
                                    color: intensity > 0.5 ? 'white' : 'inherit',
                                  }}
                                  title={`${day} ${hour}: ${count} 筆`}
                                >
                                  {count > 0 ? count : ''}
                                </div>
                              );
                            })}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
