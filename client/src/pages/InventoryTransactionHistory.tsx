import { useState } from 'react';
import { trpc } from '../lib/trpc';
import { Button } from '../components/ui/button';
import { Card } from '../components/ui/card';
import { Input } from '../components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { Badge } from '../components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../components/ui/table';
import { useTenant } from '../contexts/TenantContext';
import { Download, ArrowDown, ArrowUp, RotateCcw, Package } from 'lucide-react';

const TYPE_CONFIG: Record<string, { label: string; icon: typeof ArrowDown; color: string }> = {
  consume: { label: '療程扣減', icon: ArrowDown, color: 'text-red-600' },
  restock: { label: '進貨', icon: ArrowUp, color: 'text-green-600' },
  adjust: { label: '手動調整', icon: RotateCcw, color: 'text-blue-600' },
  return: { label: '退貨', icon: Package, color: 'text-orange-600' },
};

export default function InventoryTransactionHistory() {
  const { tenantId } = useTenant();
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  const transactionsQuery = trpc.inventoryTransaction.list.useQuery(
    {
      tenantId: tenantId!,
      transactionType: typeFilter !== 'all' ? (typeFilter as 'consume' | 'restock' | 'adjust' | 'return') : undefined,
      startDate: startDate || undefined,
      endDate: endDate || undefined,
      limit: 200,
    },
    { enabled: !!tenantId }
  );

  function handleExport() {
    const csvRows = [
      ['ID', '品名', 'SKU', '異動類型', '數量', '備註', '時間'].join(','),
    ];
    transactions.forEach((t) => {
      const inv = t.inventory as Record<string, unknown> | null;
      const typeLabel = TYPE_CONFIG[t.transaction_type as string]?.label || t.transaction_type;
      csvRows.push(
        [
          t.id,
          inv?.item_name || '',
          inv?.sku || '',
          typeLabel,
          t.quantity,
          ((t.notes as string) || '').replace(/,/g, '，'),
          t.created_at ? new Date(t.created_at as string).toLocaleString('zh-TW') : '',
        ].join(',')
      );
    });
    const blob = new Blob(['\uFEFF' + csvRows.join('\n')], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `inventory_transactions_${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  const transactions = (transactionsQuery.data || []) as Array<Record<string, unknown>>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">庫存異動歷史</h1>
        <Button variant="outline" onClick={handleExport}>
          <Download className="w-4 h-4 mr-2" />
          匯出 CSV
        </Button>
      </div>

      <Card className="p-4">
        <div className="flex flex-wrap gap-3">
          <Select value={typeFilter} onValueChange={setTypeFilter}>
            <SelectTrigger className="w-[160px]">
              <SelectValue placeholder="異動類型" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">全部類型</SelectItem>
              <SelectItem value="consume">療程扣減</SelectItem>
              <SelectItem value="restock">進貨</SelectItem>
              <SelectItem value="adjust">手動調整</SelectItem>
              <SelectItem value="return">退貨</SelectItem>
            </SelectContent>
          </Select>
          <Input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} className="w-[160px]" />
          <Input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} className="w-[160px]" />
        </div>
      </Card>

      <Card>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>時間</TableHead>
              <TableHead>品名</TableHead>
              <TableHead>SKU</TableHead>
              <TableHead>異動類型</TableHead>
              <TableHead className="text-right">數量</TableHead>
              <TableHead>單位</TableHead>
              <TableHead>備註</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {transactions.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center text-muted-foreground py-8">
                  尚無異動記錄
                </TableCell>
              </TableRow>
            ) : (
              transactions.map((t) => {
                const inv = t.inventory as Record<string, unknown> | null;
                const typeKey = t.transaction_type as string;
                const config = TYPE_CONFIG[typeKey] || { label: typeKey, color: 'text-gray-600' };
                const qty = Number(t.quantity);
                return (
                  <TableRow key={t.id as number}>
                    <TableCell className="text-sm">
                      {t.created_at
                        ? new Date(t.created_at as string).toLocaleString('zh-TW', {
                            year: 'numeric',
                            month: '2-digit',
                            day: '2-digit',
                            hour: '2-digit',
                            minute: '2-digit',
                          })
                        : '-'}
                    </TableCell>
                    <TableCell className="font-medium">{(inv?.item_name as string) || '-'}</TableCell>
                    <TableCell>{(inv?.sku as string) || '-'}</TableCell>
                    <TableCell>
                      <Badge variant="outline" className={config.color}>
                        {config.label}
                      </Badge>
                    </TableCell>
                    <TableCell className={`text-right font-bold ${qty > 0 ? 'text-green-600' : 'text-red-600'}`}>
                      {qty > 0 ? `+${qty}` : qty}
                    </TableCell>
                    <TableCell>{(inv?.unit as string) || '-'}</TableCell>
                    <TableCell className="max-w-[200px] truncate">{(t.notes as string) || '-'}</TableCell>
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
