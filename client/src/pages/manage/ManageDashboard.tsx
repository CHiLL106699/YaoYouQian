/**
 * 管理後台首頁 — 今日概覽、快速操作
 */
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { trpc } from '@/lib/trpc';
import { useTenant } from '@/contexts/TenantContext';
import { useLocation } from 'wouter';
import { Loader2, Calendar, Users, DollarSign, Clock, TrendingUp, Bell, Settings, Package, Scissors, BarChart3 } from 'lucide-react';

export default function ManageDashboard() {
  const { tenantId } = useTenant();
  const [, setLocation] = useLocation();
  const todayStr = new Date().toISOString().split('T')[0];

  const appointmentsQuery = trpc.appointment.list.useQuery(
    { tenantId: tenantId!, startDate: todayStr, endDate: todayStr },
    { enabled: !!tenantId }
  );
  const customersQuery = trpc.customer.list.useQuery(
    { tenantId: tenantId!, page: 1, pageSize: 1 },
    { enabled: !!tenantId }
  );

  const appointments = (appointmentsQuery.data as any)?.appointments || (appointmentsQuery.data as any)?.data || [];
  const totalCustomers = (customersQuery.data as any)?.total || 0;
  const pendingCount = (appointments as any[]).filter((a: any) => a.status === 'pending').length;
  const confirmedCount = (appointments as any[]).filter((a: any) => a.status === 'confirmed').length;

  const quickLinks = [
    { icon: Calendar, label: '預約管理', path: '/manage/appointments', color: 'text-blue-500' },
    { icon: Users, label: '客戶管理', path: '/manage/customers', color: 'text-green-500' },
    { icon: Scissors, label: '服務管理', path: '/manage/services', color: 'text-purple-500' },
    { icon: Package, label: '商品管理', path: '/manage/products', color: 'text-orange-500' },
    { icon: Clock, label: '排班管理', path: '/manage/schedule', color: 'text-cyan-500' },
    { icon: Bell, label: '通知管理', path: '/manage/notifications', color: 'text-yellow-500' },
    { icon: BarChart3, label: '報表分析', path: '/manage/reports', color: 'text-indigo-500' },
    { icon: Settings, label: '系統設定', path: '/manage/settings', color: 'text-gray-500' },
  ];

  return (
    <div className="p-6 space-y-6">
      <h1 className="text-2xl font-bold">管理後台</h1>

      {/* Today Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center"><Calendar className="h-5 w-5 text-blue-500" /></div>
            <div><p className="text-2xl font-bold">{(appointments as any[]).length}</p><p className="text-xs text-gray-400">今日預約</p></div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-yellow-100 flex items-center justify-center"><Clock className="h-5 w-5 text-yellow-500" /></div>
            <div><p className="text-2xl font-bold">{pendingCount}</p><p className="text-xs text-gray-400">待確認</p></div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-green-100 flex items-center justify-center"><TrendingUp className="h-5 w-5 text-green-500" /></div>
            <div><p className="text-2xl font-bold">{confirmedCount}</p><p className="text-xs text-gray-400">已確認</p></div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-purple-100 flex items-center justify-center"><Users className="h-5 w-5 text-purple-500" /></div>
            <div><p className="text-2xl font-bold">{totalCustomers}</p><p className="text-xs text-gray-400">總客戶數</p></div>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <Card>
        <CardHeader><CardTitle className="text-lg">快速操作</CardTitle></CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {quickLinks.map(link => (
              <Button key={link.path} variant="outline" className="h-20 flex-col gap-2" onClick={() => setLocation(link.path)}>
                <link.icon className={`h-6 w-6 ${link.color}`} />
                <span className="text-xs">{link.label}</span>
              </Button>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Today's Appointments */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-lg">今日預約</CardTitle>
          <Button variant="ghost" size="sm" onClick={() => setLocation('/manage/appointments')}>查看全部</Button>
        </CardHeader>
        <CardContent>
          {appointmentsQuery.isLoading ? (
            <div className="flex justify-center py-4"><Loader2 className="h-5 w-5 animate-spin" /></div>
          ) : (appointments as any[]).length === 0 ? (
            <p className="text-center text-gray-400 py-4">今日無預約</p>
          ) : (
            <div className="space-y-2">
              {(appointments as any[]).slice(0, 5).map((apt: any) => (
                <div key={apt.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div>
                    <p className="text-sm font-medium">{apt.customer_name || apt.customerName || '-'}</p>
                    <p className="text-xs text-gray-400">{apt.service_name || apt.serviceName || '-'}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-medium">{apt.time || apt.time_slot || '-'}</p>
                    <p className={`text-xs ${apt.status === 'confirmed' ? 'text-green-500' : apt.status === 'pending' ? 'text-yellow-500' : 'text-gray-400'}`}>
                      {apt.status === 'confirmed' ? '已確認' : apt.status === 'pending' ? '待確認' : apt.status}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
