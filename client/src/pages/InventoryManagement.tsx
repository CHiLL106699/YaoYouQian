import { useState } from 'react';
import { trpc } from '../lib/trpc';
import { Button } from '../components/ui/button';
import { Card } from '../components/ui/card';
import { Input } from '../components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '../components/ui/dialog';
import { Badge } from '../components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../components/ui/table';
import { useTenant } from '../contexts/TenantContext';
import { toast } from 'sonner';
import { Plus, Search, Edit, Trash2, Package, PackagePlus, ArrowUpDown } from 'lucide-react';

function getStockStatus(qty: number, threshold: number): { label: string; color: string; variant: 'default' | 'secondary' | 'destructive' | 'outline' } {
  if (qty === 0) return { label: '缺貨', color: 'bg-red-500', variant: 'destructive' };
  if (qty <= threshold) return { label: '低庫存', color: 'bg-yellow-500', variant: 'outline' };
  return { label: '正常', color: 'bg-green-500', variant: 'default' };
}

export default function InventoryManagement() {
  const { tenantId } = useTenant();
  const [search, setSearch] = useState('');
  const [lowStockOnly, setLowStockOnly] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [restockDialogOpen, setRestockDialogOpen] = useState(false);
  const [adjustDialogOpen, setAdjustDialogOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<Record<string, unknown> | null>(null);
  const [selectedItem, setSelectedItem] = useState<Record<string, unknown> | null>(null);
  const [form, setForm] = useState({
    itemName: '',
    sku: '',
    category: '',
    unit: '',
    stockQuantity: 0,
    safetyThreshold: 10,
    costPrice: 0,
    supplier: '',
  });
  const [restockQty, setRestockQty] = useState(0);
  const [restockNotes, setRestockNotes] = useState('');
  const [adjustQty, setAdjustQty] = useState(0);
  const [adjustNotes, setAdjustNotes] = useState('');

  const inventoryQuery = trpc.inventory.list.useQuery(
    { tenantId: tenantId!, search: search || undefined, lowStockOnly },
    { enabled: !!tenantId }
  );

  const createMutation = trpc.inventory.create.useMutation({
    onSuccess: () => { toast.success('庫存品項新增成功'); inventoryQuery.refetch(); closeDialog(); },
    onError: (err) => toast.error(err.message),
  });

  const updateMutation = trpc.inventory.update.useMutation({
    onSuccess: () => { toast.success('庫存品項更新成功'); inventoryQuery.refetch(); closeDialog(); },
    onError: (err) => toast.error(err.message),
  });

  const deleteMutation = trpc.inventory.delete.useMutation({
    onSuccess: () => { toast.success('庫存品項已刪除'); inventoryQuery.refetch(); },
    onError: (err) => toast.error(err.message),
  });

  const restockMutation = trpc.inventory.restock.useMutation({
    onSuccess: (data) => { toast.success(`進貨成功，目前庫存: ${data.newQuantity}`); inventoryQuery.refetch(); setRestockDialogOpen(false); },
    onError: (err) => toast.error(err.message),
  });

  const adjustMutation = trpc.inventory.adjust.useMutation({
    onSuccess: (data) => { toast.success(`調整成功，目前庫存: ${data.newQuantity}`); inventoryQuery.refetch(); setAdjustDialogOpen(false); },
    onError: (err) => toast.error(err.message),
  });

  function closeDialog() {
    setDialogOpen(false);
    setEditingItem(null);
    setForm({ itemName: '', sku: '', category: '', unit: '', stockQuantity: 0, safetyThreshold: 10, costPrice: 0, supplier: '' });
  }

  function openCreate() {
    setEditingItem(null);
    setForm({ itemName: '', sku: '', category: '', unit: '', stockQuantity: 0, safetyThreshold: 10, costPrice: 0, supplier: '' });
    setDialogOpen(true);
  }

  function openEdit(item: Record<string, unknown>) {
    setEditingItem(item);
    setForm({
      itemName: (item.item_name as string) || '',
      sku: (item.sku as string) || '',
      category: (item.category as string) || '',
      unit: (item.unit as string) || '',
      stockQuantity: Number(item.stock_quantity) || 0,
      safetyThreshold: Number(item.safety_threshold) || 10,
      costPrice: Number(item.cost_price) || 0,
      supplier: (item.supplier as string) || '',
    });
    setDialogOpen(true);
  }

  function openRestock(item: Record<string, unknown>) {
    setSelectedItem(item);
    setRestockQty(0);
    setRestockNotes('');
    setRestockDialogOpen(true);
  }

  function openAdjust(item: Record<string, unknown>) {
    setSelectedItem(item);
    setAdjustQty(0);
    setAdjustNotes('');
    setAdjustDialogOpen(true);
  }

  function handleSubmit() {
    if (!tenantId) return;
    if (editingItem) {
      updateMutation.mutate({
        id: editingItem.id as number,
        tenantId,
        itemName: form.itemName,
        sku: form.sku || undefined,
        category: form.category || undefined,
        unit: form.unit,
        safetyThreshold: form.safetyThreshold,
        costPrice: form.costPrice || undefined,
        supplier: form.supplier || undefined,
      });
    } else {
      createMutation.mutate({
        tenantId,
        itemName: form.itemName,
        sku: form.sku || undefined,
        category: form.category || undefined,
        unit: form.unit,
        stockQuantity: form.stockQuantity,
        safetyThreshold: form.safetyThreshold,
        costPrice: form.costPrice || undefined,
        supplier: form.supplier || undefined,
      });
    }
  }

  function handleRestock() {
    if (!tenantId || !selectedItem || restockQty <= 0) return;
    restockMutation.mutate({
      id: selectedItem.id as number,
      tenantId,
      quantity: restockQty,
      notes: restockNotes || undefined,
    });
  }

  function handleAdjust() {
    if (!tenantId || !selectedItem || adjustQty === 0) return;
    adjustMutation.mutate({
      id: selectedItem.id as number,
      tenantId,
      quantity: adjustQty,
      notes: adjustNotes || undefined,
    });
  }

  const items = (inventoryQuery.data || []) as Array<Record<string, unknown>>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">庫存管理</h1>
        <Button onClick={openCreate}>
          <Plus className="w-4 h-4 mr-2" />
          新增品項
        </Button>
      </div>

      <Card className="p-4">
        <div className="flex flex-wrap gap-3 items-center">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="搜尋品名、SKU..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9"
            />
          </div>
          <Button
            variant={lowStockOnly ? 'default' : 'outline'}
            onClick={() => setLowStockOnly(!lowStockOnly)}
          >
            {lowStockOnly ? '顯示全部' : '僅低庫存'}
          </Button>
        </div>
      </Card>

      <Card>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>狀態</TableHead>
              <TableHead>品名</TableHead>
              <TableHead>SKU</TableHead>
              <TableHead>分類</TableHead>
              <TableHead className="text-right">庫存量</TableHead>
              <TableHead className="text-right">安全水位</TableHead>
              <TableHead>單位</TableHead>
              <TableHead className="text-right">成本</TableHead>
              <TableHead>供應商</TableHead>
              <TableHead className="text-right">操作</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {items.length === 0 ? (
              <TableRow>
                <TableCell colSpan={10} className="text-center text-muted-foreground py-8">
                  尚無庫存品項
                </TableCell>
              </TableRow>
            ) : (
              items.map((item) => {
                const status = getStockStatus(Number(item.stock_quantity), Number(item.safety_threshold));
                return (
                  <TableRow key={item.id as number}>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <div className={`w-3 h-3 rounded-full ${status.color}`} />
                        <Badge variant={status.variant}>{status.label}</Badge>
                      </div>
                    </TableCell>
                    <TableCell className="font-medium">{item.item_name as string}</TableCell>
                    <TableCell>{(item.sku as string) || '-'}</TableCell>
                    <TableCell>{(item.category as string) || '-'}</TableCell>
                    <TableCell className="text-right font-bold">{Number(item.stock_quantity)}</TableCell>
                    <TableCell className="text-right">{Number(item.safety_threshold)}</TableCell>
                    <TableCell>{item.unit as string}</TableCell>
                    <TableCell className="text-right">
                      {item.cost_price ? `$${Number(item.cost_price).toLocaleString()}` : '-'}
                    </TableCell>
                    <TableCell>{(item.supplier as string) || '-'}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-1">
                        <Button variant="ghost" size="sm" title="進貨" onClick={() => openRestock(item)}>
                          <PackagePlus className="w-4 h-4 text-green-600" />
                        </Button>
                        <Button variant="ghost" size="sm" title="調整" onClick={() => openAdjust(item)}>
                          <ArrowUpDown className="w-4 h-4 text-blue-600" />
                        </Button>
                        <Button variant="ghost" size="sm" title="編輯" onClick={() => openEdit(item)}>
                          <Edit className="w-4 h-4" />
                        </Button>
                        <Button variant="ghost" size="sm" title="刪除" onClick={() => {
                          if (confirm('確定要刪除此品項？')) deleteMutation.mutate({ id: item.id as number, tenantId: tenantId! });
                        }}>
                          <Trash2 className="w-4 h-4 text-destructive" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </Card>

      {/* 新增/編輯品項 Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{editingItem ? '編輯品項' : '新增品項'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium">品名 *</label>
              <Input value={form.itemName} onChange={(e) => setForm({ ...form, itemName: e.target.value })} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-sm font-medium">SKU</label>
                <Input value={form.sku} onChange={(e) => setForm({ ...form, sku: e.target.value })} />
              </div>
              <div>
                <label className="text-sm font-medium">分類</label>
                <Input value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-sm font-medium">單位 *</label>
                <Input value={form.unit} onChange={(e) => setForm({ ...form, unit: e.target.value })} placeholder="例: ml, 支, 盒" />
              </div>
              {!editingItem && (
                <div>
                  <label className="text-sm font-medium">初始庫存</label>
                  <Input type="number" value={form.stockQuantity} onChange={(e) => setForm({ ...form, stockQuantity: Number(e.target.value) })} />
                </div>
              )}
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-sm font-medium">安全水位</label>
                <Input type="number" value={form.safetyThreshold} onChange={(e) => setForm({ ...form, safetyThreshold: Number(e.target.value) })} />
              </div>
              <div>
                <label className="text-sm font-medium">成本價</label>
                <Input type="number" value={form.costPrice} onChange={(e) => setForm({ ...form, costPrice: Number(e.target.value) })} />
              </div>
            </div>
            <div>
              <label className="text-sm font-medium">供應商</label>
              <Input value={form.supplier} onChange={(e) => setForm({ ...form, supplier: e.target.value })} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={closeDialog}>取消</Button>
            <Button onClick={handleSubmit} disabled={!form.itemName || !form.unit}>
              {editingItem ? '更新' : '新增'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 進貨 Dialog */}
      <Dialog open={restockDialogOpen} onOpenChange={setRestockDialogOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>進貨 - {selectedItem?.item_name as string}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">目前庫存: {Number(selectedItem?.stock_quantity)} {selectedItem?.unit as string}</p>
            <div>
              <label className="text-sm font-medium">進貨數量 *</label>
              <Input type="number" min={1} value={restockQty} onChange={(e) => setRestockQty(Number(e.target.value))} />
            </div>
            <div>
              <label className="text-sm font-medium">備註</label>
              <Input value={restockNotes} onChange={(e) => setRestockNotes(e.target.value)} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setRestockDialogOpen(false)}>取消</Button>
            <Button onClick={handleRestock} disabled={restockQty <= 0}>確認進貨</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 手動調整 Dialog */}
      <Dialog open={adjustDialogOpen} onOpenChange={setAdjustDialogOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>手動調整 - {selectedItem?.item_name as string}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">目前庫存: {Number(selectedItem?.stock_quantity)} {selectedItem?.unit as string}</p>
            <div>
              <label className="text-sm font-medium">調整數量（正數增加，負數減少）</label>
              <Input type="number" value={adjustQty} onChange={(e) => setAdjustQty(Number(e.target.value))} />
            </div>
            <div>
              <label className="text-sm font-medium">備註 *</label>
              <Input value={adjustNotes} onChange={(e) => setAdjustNotes(e.target.value)} placeholder="請說明調整原因" />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAdjustDialogOpen(false)}>取消</Button>
            <Button onClick={handleAdjust} disabled={adjustQty === 0}>確認調整</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
