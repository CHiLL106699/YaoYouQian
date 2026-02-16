import { useState } from 'react';
import { trpc } from '../lib/trpc';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../components/ui/table';
import { useTenant } from '../contexts/TenantContext';
import { toast } from 'sonner';
import { AlertTriangle, CheckCircle, Bell } from 'lucide-react';

export default function LowStockAlerts() {
  const { tenantId } = useTenant();
  const [unresolvedOnly, setUnresolvedOnly] = useState(true);

  const alertsQuery = trpc.inventoryTransaction.lowStockAlerts.useQuery(
    { tenantId: tenantId!, unresolvedOnly },
    { enabled: !!tenantId }
  );

  const resolveMutation = trpc.inventoryTransaction.resolveAlert.useMutation({
    onSuccess: () => { toast.success('警示已標記為已處理'); alertsQuery.refetch(); },
    onError: (err) => toast.error(err.message),
  });

  const batchResolveMutation = trpc.inventoryTransaction.batchResolveAlerts.useMutation({
    onSuccess: (data) => { toast.success(`已處理 ${data.resolved} 筆警示`); alertsQuery.refetch(); },
    onError: (err) => toast.error(err.message),
  });

  function handleBatchResolve() {
    if (!tenantId) return;
    const unresolvedIds = alerts
      .filter((a) => !a.resolved_at)
      .map((a) => a.id as number);
    if (unresolvedIds.length === 0) {
      toast.info('沒有未處理的警示');
      return;
    }
    batchResolveMutation.mutate({ ids: unresolvedIds, tenantId });
  }

  const alerts = (alertsQuery.data || []) as Array<Record<string, unknown>>;
  const criticalCount = alerts.filter((a) => a.alert_type === 'critical' && !a.resolved_at).length;
  const warningCount = alerts.filter((a) => a.alert_type === 'warning' && !a.resolved_at).length;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">低庫存警示</h1>
        <div className="flex gap-2">
          <Button
            variant={unresolvedOnly ? 'default' : 'outline'}
            onClick={() => setUnresolvedOnly(!unresolvedOnly)}
          >
            {unresolvedOnly ? '顯示全部' : '僅未處理'}
          </Button>
          <Button variant="outline" onClick={handleBatchResolve}>
            <CheckCircle className="w-4 h-4 mr-2" />
            全部標記已處理
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card className="border-red-200">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-red-600 flex items-center gap-2">
              <AlertTriangle className="w-4 h-4" /> 嚴重缺貨
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-red-600">{criticalCount}</p>
          </CardContent>
        </Card>
        <Card className="border-yellow-200">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-yellow-600 flex items-center gap-2">
              <Bell className="w-4 h-4" /> 低庫存警告
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-yellow-600">{warningCount}</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>警示等級</TableHead>
              <TableHead>品名</TableHead>
              <TableHead>SKU</TableHead>
              <TableHead className="text-right">目前庫存</TableHead>
              <TableHead className="text-right">安全水位</TableHead>
              <TableHead>單位</TableHead>
              <TableHead>警示時間</TableHead>
              <TableHead>狀態</TableHead>
              <TableHead className="text-right">操作</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {alerts.length === 0 ? (
              <TableRow>
                <TableCell colSpan={9} className="text-center text-muted-foreground py-8">
                  {unresolvedOnly ? '目前沒有未處理的低庫存警示' : '尚無低庫存警示記錄'}
                </TableCell>
              </TableRow>
            ) : (
              alerts.map((alert) => {
                const inv = alert.inventory as Record<string, unknown> | null;
                const isCritical = alert.alert_type === 'critical';
                const isResolved = !!alert.resolved_at;
                return (
                  <TableRow key={alert.id as number} className={isResolved ? 'opacity-60' : ''}>
                    <TableCell>
                      <Badge variant={isCritical ? 'destructive' : 'outline'} className={isCritical ? '' : 'text-yellow-600 border-yellow-400'}>
                        {isCritical ? '嚴重' : '警告'}
                      </Badge>
                    </TableCell>
                    <TableCell className="font-medium">{(inv?.item_name as string) || '-'}</TableCell>
                    <TableCell>{(inv?.sku as string) || '-'}</TableCell>
                    <TableCell className={`text-right font-bold ${isCritical ? 'text-red-600' : 'text-yellow-600'}`}>
                      {Number(alert.current_stock)}
                    </TableCell>
                    <TableCell className="text-right">{Number(alert.threshold)}</TableCell>
                    <TableCell>{(inv?.unit as string) || '-'}</TableCell>
                    <TableCell className="text-sm">
                      {alert.created_at
                        ? new Date(alert.created_at as string).toLocaleString('zh-TW', {
                            month: '2-digit',
                            day: '2-digit',
                            hour: '2-digit',
                            minute: '2-digit',
                          })
                        : '-'}
                    </TableCell>
                    <TableCell>
                      <Badge variant={isResolved ? 'secondary' : 'outline'}>
                        {isResolved ? '已處理' : '未處理'}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      {!isResolved && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => resolveMutation.mutate({ id: alert.id as number, tenantId: tenantId! })}
                        >
                          <CheckCircle className="w-4 h-4 mr-1" />
                          已處理
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
