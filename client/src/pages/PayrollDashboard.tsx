import { useState } from 'react';
import { trpc } from '../lib/trpc';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Input } from '../components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { Badge } from '../components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../components/ui/table';
import { Button } from '../components/ui/button';
import { useTenant } from '../contexts/TenantContext';
import { Download, DollarSign, Users, TrendingUp } from 'lucide-react';

const ROLE_LABELS: Record<string, string> = {
  consultant: '諮詢師',
  doctor: '醫師',
  nurse: '護理師',
  admin: '行政',
};

export default function PayrollDashboard() {
  const { tenantId } = useTenant();
  const now = new Date();
  const [year, setYear] = useState(now.getFullYear().toString());
  const [month, setMonth] = useState((now.getMonth() + 1).toString().padStart(2, '0'));

  const startDate = `${year}-${month}-01`;
  const endDate = `${year}-${month}-${new Date(Number(year), Number(month), 0).getDate()}`;

  const staffQuery = trpc.staff.list.useQuery(
    { tenantId: tenantId!, status: 'active' },
    { enabled: !!tenantId }
  );

  const recordsQuery = trpc.commissionRecord.list.useQuery(
    { tenantId: tenantId!, startDate, endDate },
    { enabled: !!tenantId }
  );

  const staffList = (staffQuery.data || []) as Array<Record<string, unknown>>;
  const records = (recordsQuery.data || []) as Array<Record<string, unknown>>;

  // 彙總每位員工的薪資
  const payrollSummary = staffList.map((staff) => {
    const staffRecords = records.filter((r) => r.staff_id === staff.id);
    const totalCommission = staffRecords.reduce((sum, r) => sum + Number(r.commission_amount || 0), 0);
    const baseSalary = Number(staff.base_salary || 0);
    const totalPay = baseSalary + totalCommission;
    const orderCount = staffRecords.length;

    return {
      id: staff.id as number,
      name: staff.name as string,
      roleType: staff.role_type as string,
      baseSalary,
      totalCommission,
      totalPay,
      orderCount,
      pendingCount: staffRecords.filter((r) => r.status === 'pending').length,
      confirmedCount: staffRecords.filter((r) => r.status === 'confirmed').length,
      paidCount: staffRecords.filter((r) => r.status === 'paid').length,
    };
  });

  const grandTotalPay = payrollSummary.reduce((sum, s) => sum + s.totalPay, 0);
  const grandTotalCommission = payrollSummary.reduce((sum, s) => sum + s.totalCommission, 0);
  const grandTotalBase = payrollSummary.reduce((sum, s) => sum + s.baseSalary, 0);

  function handleExport() {
    const csvRows = [
      ['員工', '角色', '底薪', '分潤合計', '總薪資', '訂單數', '待確認', '已確認', '已發放'].join(','),
    ];
    payrollSummary.forEach((s) => {
      csvRows.push(
        [
          s.name,
          ROLE_LABELS[s.roleType] || s.roleType,
          s.baseSalary,
          s.totalCommission,
          s.totalPay,
          s.orderCount,
          s.pendingCount,
          s.confirmedCount,
          s.paidCount,
        ].join(',')
      );
    });
    csvRows.push(['', '', grandTotalBase, grandTotalCommission, grandTotalPay, '', '', '', ''].join(','));
    const blob = new Blob(['\uFEFF' + csvRows.join('\n')], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `payroll_${year}_${month}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">薪資總表</h1>
        <div className="flex gap-2 items-center">
          <Select value={year} onValueChange={setYear}>
            <SelectTrigger className="w-[100px]"><SelectValue /></SelectTrigger>
            <SelectContent>
              {[2024, 2025, 2026, 2027].map((y) => (
                <SelectItem key={y} value={y.toString()}>{y} 年</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={month} onValueChange={setMonth}>
            <SelectTrigger className="w-[90px]"><SelectValue /></SelectTrigger>
            <SelectContent>
              {Array.from({ length: 12 }, (_, i) => {
                const m = (i + 1).toString().padStart(2, '0');
                return <SelectItem key={m} value={m}>{m} 月</SelectItem>;
              })}
            </SelectContent>
          </Select>
          <Button variant="outline" onClick={handleExport}>
            <Download className="w-4 h-4 mr-2" />
            匯出
          </Button>
        </div>
      </div>

      {/* 統計卡片 */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-muted-foreground flex items-center gap-2">
              <DollarSign className="w-4 h-4" /> 總薪資支出
            </CardTitle>
          </CardHeader>
          <CardContent><p className="text-2xl font-bold">${grandTotalPay.toLocaleString()}</p></CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-muted-foreground flex items-center gap-2">
              <TrendingUp className="w-4 h-4" /> 總分潤
            </CardTitle>
          </CardHeader>
          <CardContent><p className="text-2xl font-bold text-green-600">${grandTotalCommission.toLocaleString()}</p></CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-muted-foreground flex items-center gap-2">
              <Users className="w-4 h-4" /> 在職人數
            </CardTitle>
          </CardHeader>
          <CardContent><p className="text-2xl font-bold">{staffList.length}</p></CardContent>
        </Card>
      </div>

      {/* 薪資明細表 */}
      <Card>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>員工</TableHead>
              <TableHead>角色</TableHead>
              <TableHead className="text-right">底薪</TableHead>
              <TableHead className="text-right">分潤合計</TableHead>
              <TableHead className="text-right">總薪資</TableHead>
              <TableHead className="text-center">訂單數</TableHead>
              <TableHead className="text-center">分潤狀態</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {payrollSummary.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center text-muted-foreground py-8">
                  尚無員工資料
                </TableCell>
              </TableRow>
            ) : (
              <>
                {payrollSummary.map((s) => (
                  <TableRow key={s.id}>
                    <TableCell className="font-medium">{s.name}</TableCell>
                    <TableCell>
                      <Badge variant="outline">{ROLE_LABELS[s.roleType] || s.roleType}</Badge>
                    </TableCell>
                    <TableCell className="text-right">${s.baseSalary.toLocaleString()}</TableCell>
                    <TableCell className="text-right text-green-700">${s.totalCommission.toLocaleString()}</TableCell>
                    <TableCell className="text-right font-bold">${s.totalPay.toLocaleString()}</TableCell>
                    <TableCell className="text-center">{s.orderCount}</TableCell>
                    <TableCell className="text-center">
                      <div className="flex gap-1 justify-center">
                        {s.pendingCount > 0 && <Badge variant="outline" className="text-yellow-600">{s.pendingCount} 待確認</Badge>}
                        {s.confirmedCount > 0 && <Badge variant="secondary">{s.confirmedCount} 已確認</Badge>}
                        {s.paidCount > 0 && <Badge variant="default">{s.paidCount} 已發放</Badge>}
                        {s.orderCount === 0 && <span className="text-muted-foreground text-sm">-</span>}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
                <TableRow className="bg-muted/50 font-bold">
                  <TableCell colSpan={2}>合計</TableCell>
                  <TableCell className="text-right">${grandTotalBase.toLocaleString()}</TableCell>
                  <TableCell className="text-right text-green-700">${grandTotalCommission.toLocaleString()}</TableCell>
                  <TableCell className="text-right">${grandTotalPay.toLocaleString()}</TableCell>
                  <TableCell colSpan={2}></TableCell>
                </TableRow>
              </>
            )}
          </TableBody>
        </Table>
      </Card>
    </div>
  );
}
