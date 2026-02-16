/**
 * 曜友仟管理雲 - Super Admin Dashboard
 * 管理員專用儀表板：租戶管理、訂閱管理、系統監控
 */

import { useState } from 'react';
import { Building2, Users, TrendingUp, AlertCircle, Search, Ban, CheckCircle } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { trpc } from '@/lib/trpc';

export default function SuperAdminDashboard() {
  const [searchTerm, setSearchTerm] = useState('');

  // 使用 tRPC 查詢租戶列表
  const { data: tenantsData, isLoading } = trpc.superAdmin.getAllTenants.useQuery({ page: 1, pageSize: 100 });
  const { data: statsData } = trpc.superAdmin.getStats.useQuery();

  const tenants = tenantsData?.tenants || [];
  const stats = statsData || { totalTenants: 0, activeTenants: 0, totalRevenue: 0 };

  // 過濾租戶列表
  const filteredTenants = tenants.filter((tenant: any) =>
    tenant.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (tenant.owner_email && tenant.owner_email.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0a1929] via-[#0f2942] to-[#1e4976]">
      {/* Header */}
      <header className="border-b border-gold/20 bg-[#0a1929]/80 backdrop-blur-sm">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <img 
              src="https://files.manuscdn.com/user_upload_by_module/session_file/310519663168407203/RRXvLlBPQmxCFsOU.jpg" 
              alt="FLOS 曜診所 Logo" 
              className="w-12 h-12"
            />
            <h1 className="text-2xl font-bold text-gold">曜友仟管理雲 管理後台</h1>
          </div>
          <Button variant="outline" className="border-gold/30 text-gold hover:bg-gold/10">
            登出
          </Button>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card className="luxury-card">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-gold-solid">總租戶數</CardTitle>
              <Building2 className="w-4 h-4 text-blue-400" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-foreground">{stats.totalTenants}</div>
              <p className="text-xs text-muted-foreground mt-1">
                活躍: {stats.activeTenants}
              </p>
            </CardContent>
          </Card>

          <Card className="luxury-card">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-gold-solid">試用中</CardTitle>
              <Users className="w-4 h-4 text-purple-400" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-foreground">{tenants.filter((t: any) => t.status === 'trial').length}</div>
              <p className="text-xs text-muted-foreground mt-1">
                14 天免費試用
              </p>
            </CardContent>
          </Card>

          <Card className="luxury-card">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-gold-solid">付費訂閱</CardTitle>
              <TrendingUp className="w-4 h-4 text-green-400" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-foreground">{tenants.filter((t: any) => t.status === 'active').length}</div>
              <p className="text-xs text-muted-foreground mt-1">
                月營收: ${stats.totalRevenue}
              </p>
            </CardContent>
          </Card>

          <Card className="luxury-card">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-gold-solid">錯誤日誌</CardTitle>
              <AlertCircle className="w-4 h-4 text-red-400" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-foreground">0</div>
              <p className="text-xs text-muted-foreground mt-1">
                過去 24 小時
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Tenant Management */}
        <Card className="luxury-card">
          <CardHeader>
            <CardTitle className="text-gold-solid">租戶管理</CardTitle>
            <CardDescription className="text-muted-foreground">
              查看與管理所有租戶的訂閱狀態
            </CardDescription>
          </CardHeader>
          <CardContent>
            {/* Search Bar */}
            <div className="flex items-center gap-2 mb-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="搜尋租戶名稱或 Email..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 bg-[#0a1929]/50 border-gold/20 text-foreground placeholder:text-muted-foreground"
                />
              </div>
            </div>

            {/* Tenant Table */}
            {isLoading ? (
              <div className="text-center py-8 text-muted-foreground">載入中...</div>
            ) : filteredTenants.length > 0 ? (
              <Table>
                <TableHeader>
                  <TableRow className="border-gold/20">
                    <TableHead className="text-gold-solid">租戶名稱</TableHead>
                    <TableHead className="text-gold-solid">子網域</TableHead>
                    <TableHead className="text-gold-solid">訂閱方案</TableHead>
                    <TableHead className="text-gold-solid">狀態</TableHead>
                    <TableHead className="text-gold-solid">建立時間</TableHead>
                    <TableHead className="text-gold-solid text-right">操作</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredTenants.map((tenant: any) => (
                    <TableRow key={tenant.id} className="border-gold/10">
                      <TableCell className="font-medium text-foreground">{tenant.name}</TableCell>
                      <TableCell className="text-muted-foreground">{tenant.subdomain}</TableCell>
                      <TableCell className="text-muted-foreground">{tenant.subscription_plan || 'N/A'}</TableCell>
                      <TableCell>
                        <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${
                          tenant.status === 'active' ? 'bg-green-500/20 text-green-400' :
                          tenant.status === 'trial' ? 'bg-blue-500/20 text-blue-400' :
                          'bg-red-500/20 text-red-400'
                        }`}>
                          {tenant.status === 'active' && <CheckCircle className="w-3 h-3" />}
                          {tenant.status === 'suspended' && <Ban className="w-3 h-3" />}
                          {tenant.status === 'active' ? '活躍' : tenant.status === 'trial' ? '試用' : '已停用'}
                        </span>
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {new Date(tenant.created_at).toLocaleDateString('zh-TW')}
                      </TableCell>
                      <TableCell className="text-right">
                        <Button 
                          variant="outline" 
                          size="sm"
                          className="border-gold/30 text-gold hover:bg-gold/10"
                        >
                          查看詳情
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                {searchTerm ? '找不到符合條件的租戶' : '尚無租戶資料'}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
