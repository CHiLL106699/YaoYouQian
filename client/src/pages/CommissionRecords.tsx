import { useState } from 'react';
import { trpc } from '../lib/trpc';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Input } from '../components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { Badge } from '../components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../components/ui/table';
import { useTenant } from '../contexts/TenantContext';
import { toast } from 'sonner';
import { Calculator, Search, Download } from 'lucide-react';

const ROLE_LABELS: Record<string, string> = {
  consultant: '諮詢師',
  doctor: '醫師',
  nurse: '護理師',
  admin: '行政',
};

const STATUS_LABELS: Record<string, string> = {
  pending: '待確認',
  partial: '部分發放',
  paid: '已發放',
  cancelled: '已取消',
};

export default function CommissionRecords() {
  const { tenantId } = useTenant();
  const [staffFilter, setStaffFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [calcOrderId, setCalcOrderId] = useState('');
  const [calcOrderAmount, setCalcOrderAmount] = useState('');

  const recordsQuery = trpc.commissionRecord.list.useQuery(
    {
      tenantId: tenantId!,
      staffId: staffFilter !== 'all' ? Number(staffFilter) : undefined,
      status: statusFilter !== 'all' ? (statusFilter as 'pending' | 'partial' | 'paid' | 'cancelled') : undefined,
      startDate: startDate || undefined,
      endDate: endDate || undefined,
    },
    { enabled: !!tenantId }
  );

  const staffQuery = trpc.staff.list.useQuery(
    { tenantId: tenantId!, status: 'active' },
    { enabled: !!tenantId }
  );

  const calculateMutation = trpc.commissionRecord.calculate.useMutation({
    onSuccess: (data) => {
      toast.success(`分潤計算完成，共產生 ${data.created} 筆記錄`);
      recordsQuery.refetch();
      setCalcOrderId('');
      setCalcOrderAmount('');
    },
    onError: (err) => toast.error(err.message),
  });

  const updateStatusMutation = trpc.commissionRecord.updateStatus.useMutation({
    onSuccess: () => {
      toast.success('分潤狀態已更新');
      recordsQuery.refetch();
    },
    onError: (err) => toast.error(err.message),
  });

  const batchPayMutation = trpc.commissionRecord.batchPay.useMutation({
    onSuccess: (data) => {
      toast.success(`已標記 ${data.updated} 筆為已發放`);
      recordsQuery.refetch();
    },
    onError: (err) => toast.error(err.message),
  });

  function handleCalculate() {
    if (!tenantId || !calcOrderId || !calcOrderAmount) return;
    calculateMutation.mutate({ tenantId, orderId: Number(calcOrderId), orderAmount: Number(calcOrderAmount) });
  }

  function handleBatchPay() {
    if (!tenantId) return;
    const pendingIds = records
      .filter((r) => (r.status as string) === 'pending')
      .map((r) => r.id as number);
    if (pendingIds.length === 0) {
      toast.info('沒有待發放的記錄');
      return;
    }
    batchPayMutation.mutate({ ids: pendingIds, tenantId });
  }

  function handleExport() {
    const csvRows = [
      ['ID', '員工', '角色', '訂單ID', '金額', '比率', '狀態', '日期'].join(','),
    ];
    records.forEach((r) => {
      const staff = r.staff as Record<string, unknown> | null;
      const staffName = staff?.name || String(r.staff_id);
      csvRows.push(
        [
          r.id,
          staffName,
          ROLE_LABELS[(r.role_type as string) || ''] || r.role_type || '',
          r.order_id || '',
          r.amount || '',
          r.rate || '',
          STATUS_LABELS[r.status as string] || r.status,
          r.created_at ? new Date(r.created_at as string).toLocaleDateString('zh-TW') : '',
        ].join(',')
      );
    });
    const blob = new Blob(['\uFEFF' + csvRows.join('\n')], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `commission_records_${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  const records = (recordsQuery.data || []) as Array<Record<string, unknown>>;
  const staffList = (staffQuery.data || []) as Array<Record<string, unknown>>;

  const totalCommission = records.reduce((sum, r) => sum + Number(r.amount || 0), 0);
  const pendingCount = records.filter((r) => r.status === 'pending').length;
  const paidCount = records.filter((r) => r.status === 'paid').length;
  const cancelledCount = records.filter((r) => r.status === 'cancelled').length;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">分潤記錄</h1>
        <div className="flex gap-2">
          <Button variant="outline" onClick={handleExport}>
            <Download className="w-4 h-4 mr-2" />
            匯出 CSV
          </Button>
          <Button variant="outline" onClick={handleBatchPay}>
            全部標記已發放
          </Button>
        </div>
      </div>

      {/* 統計卡片 */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm text-muted-foreground">總分潤金額</CardTitle></CardHeader>
          <CardContent><p className="text-2xl font-bold">${totalCommission.toLocaleString()}</p></CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm text-muted-foreground">待發放</CardTitle></CardHeader>
          <CardContent><p className="text-2xl font-bold text-yellow-600">{pendingCount}</p></CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm text-muted-foreground">已發放</CardTitle></CardHeader>
          <CardContent><p className="text-2xl font-bold text-green-600">{paidCount}</p></CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm text-muted-foreground">已取消</CardTitle></CardHeader>
          <CardContent><p className="text-2xl font-bold text-red-600">{cancelledCount}</p></CardContent>
        </Card>
      </div>

      {/* 手動計算分潤 */}
      <Card className="p-4">
        <div className="flex items-end gap-3">
          <div className="flex-1">
            <label className="text-sm font-medium">訂單 ID</label>
            <Input
              type="number"
              placeholder="輸入訂單 ID"
              value={calcOrderId}
              onChange={(e) => setCalcOrderId(e.target.value)}
            />
          </div>
          <div className="flex-1">
            <label className="text-sm font-medium">訂單金額</label>
            <Input
              type="number"
              placeholder="輸入訂單金額"
              value={calcOrderAmount}
              onChange={(e) => setCalcOrderAmount(e.target.value)}
            />
          </div>
          <Button onClick={handleCalculate} disabled={!calcOrderId || !calcOrderAmount || calculateMutation.isPending}>
            <Calculator className="w-4 h-4 mr-2" />
            計算分潤
          </Button>
        </div>
      </Card>

      {/* 篩選 */}
      <Card className="p-4">
        <div className="flex flex-wrap gap-3">
          <Select value={staffFilter} onValueChange={setStaffFilter}>
            <SelectTrigger className="w-[160px]">
              <SelectValue placeholder="員工篩選" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">全部員工</SelectItem>
              {staffList.map((s) => (
                <SelectItem key={s.id as number} value={String(s.id)}>
                  {String(s.name)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-[140px]">
              <SelectValue placeholder="狀態篩選" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">全部狀態</SelectItem>
              <SelectItem value="pending">待發放</SelectItem>
              <SelectItem value="paid">已發放</SelectItem>
              <SelectItem value="partial">部分發放</SelectItem>
              <SelectItem value="cancelled">已取消</SelectItem>
            </SelectContent>
          </Select>
          <Input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} className="w-[160px]" />
          <Input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} className="w-[160px]" />
        </div>
      </Card>

      {/* 記錄表格 */}
      <Card>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>員工</TableHead>
              <TableHead>角色</TableHead>
              <TableHead>訂單 ID</TableHead>
              <TableHead>分潤金額</TableHead>
              <TableHead>比率</TableHead>
              <TableHead>狀態</TableHead>
              <TableHead>日期</TableHead>
              <TableHead className="text-right">操作</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {records.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} className="text-center text-muted-foreground py-8">
                  尚無分潤記錄
                </TableCell>
              </TableRow>
            ) : (
              records.map((r) => {
                const staff = r.staff as Record<string, unknown> | null;
                const staffName = staff?.name ? String(staff.name) : `#${r.staff_id}`;
                return (
                  <TableRow key={r.id as number}>
                    <TableCell className="font-medium">{staffName}</TableCell>
                    <TableCell>
                      <Badge variant="outline">{ROLE_LABELS[String(r.role_type || '')] || String(r.role_type || '-')}</Badge>
                    </TableCell>
                    <TableCell>#{String(r.order_id)}</TableCell>
                    <TableCell className="font-bold text-green-700">${Number(r.amount).toLocaleString()}</TableCell>
                    <TableCell>{r.rate ? `${(Number(r.rate) * 100).toFixed(1)}%` : '-'}</TableCell>
                    <TableCell>
                      <Badge
                        variant={
                          r.status === 'paid' ? 'default' : r.status === 'cancelled' ? 'destructive' : 'outline'
                        }
                      >
                        {STATUS_LABELS[r.status as string] || String(r.status)}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {r.created_at ? new Date(r.created_at as string).toLocaleDateString('zh-TW') : '-'}
                    </TableCell>
                    <TableCell className="text-right">
                      {r.status === 'pending' && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => updateStatusMutation.mutate({ id: r.id as number, tenantId: tenantId!, status: 'paid' })}
                        >
                          標記已發放
                        </Button>
                      )}
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </Card>
    </div>
  );
}
