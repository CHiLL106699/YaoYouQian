import { useState } from 'react';
import { trpc } from '../lib/trpc';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Input } from '../components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '../components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../components/ui/table';
import { useTenant } from '../contexts/TenantContext';
import { toast } from 'sonner';
import { Plus, Trash2, Edit, ClipboardList } from 'lucide-react';

export default function ServiceMaterialManagement() {
  const { tenantId } = useTenant();
  const [selectedServiceId, setSelectedServiceId] = useState<string>('');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingMaterial, setEditingMaterial] = useState<Record<string, unknown> | null>(null);
  const [form, setForm] = useState({
    inventoryId: '',
    quantityPerUse: 1,
    unit: '',
    notes: '',
  });

  const servicesQuery = trpc.service.list.useQuery(
    { tenantId: tenantId! },
    { enabled: !!tenantId }
  );

  const materialsQuery = trpc.serviceMaterial.listByService.useQuery(
    { serviceId: Number(selectedServiceId), tenantId: tenantId! },
    { enabled: !!tenantId && !!selectedServiceId }
  );

  const inventoryQuery = trpc.inventory.list.useQuery(
    { tenantId: tenantId! },
    { enabled: !!tenantId }
  );

  const createMutation = trpc.serviceMaterial.create.useMutation({
    onSuccess: () => { toast.success('物料項目新增成功'); materialsQuery.refetch(); closeDialog(); },
    onError: (err) => toast.error(err.message),
  });

  const updateMutation = trpc.serviceMaterial.update.useMutation({
    onSuccess: () => { toast.success('物料項目更新成功'); materialsQuery.refetch(); closeDialog(); },
    onError: (err) => toast.error(err.message),
  });

  const deleteMutation = trpc.serviceMaterial.delete.useMutation({
    onSuccess: () => { toast.success('物料項目已移除'); materialsQuery.refetch(); },
    onError: (err) => toast.error(err.message),
  });

  function closeDialog() {
    setDialogOpen(false);
    setEditingMaterial(null);
    setForm({ inventoryId: '', quantityPerUse: 1, unit: '', notes: '' });
  }

  function openCreate() {
    if (!selectedServiceId) {
      toast.error('請先選擇療程');
      return;
    }
    setEditingMaterial(null);
    setForm({ inventoryId: '', quantityPerUse: 1, unit: '', notes: '' });
    setDialogOpen(true);
  }

  function openEdit(mat: Record<string, unknown>) {
    setEditingMaterial(mat);
    setForm({
      inventoryId: String(mat.inventory_id),
      quantityPerUse: Number(mat.quantity_per_use) || 1,
      unit: (mat.unit as string) || '',
      notes: (mat.notes as string) || '',
    });
    setDialogOpen(true);
  }

  function handleSubmit() {
    if (!tenantId || !selectedServiceId) return;
    if (editingMaterial) {
      updateMutation.mutate({
        id: editingMaterial.id as number,
        tenantId,
        quantityPerUse: form.quantityPerUse,
        unit: form.unit || undefined,
        notes: form.notes || undefined,
      });
    } else {
      createMutation.mutate({
        serviceId: Number(selectedServiceId),
        inventoryId: Number(form.inventoryId),
        tenantId,
        quantityPerUse: form.quantityPerUse,
        unit: form.unit,
        notes: form.notes || undefined,
      });
    }
  }

  const services = (servicesQuery.data || []) as Array<Record<string, unknown>>;
  const materials = (materialsQuery.data || []) as Array<Record<string, unknown>>;
  const inventoryItems = (inventoryQuery.data || []) as Array<Record<string, unknown>>;

  const selectedService = services.find((s) => String(s.id) === selectedServiceId);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">BOM 物料清單設定</h1>
      </div>

      <Card className="p-4">
        <div className="flex items-end gap-3">
          <div className="flex-1">
            <label className="text-sm font-medium">選擇療程</label>
            <Select value={selectedServiceId} onValueChange={setSelectedServiceId}>
              <SelectTrigger>
                <SelectValue placeholder="請選擇療程" />
              </SelectTrigger>
              <SelectContent>
                {services.map((svc) => (
                  <SelectItem key={svc.id as number} value={String(svc.id)}>
                    {svc.name as string}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <Button onClick={openCreate} disabled={!selectedServiceId}>
            <Plus className="w-4 h-4 mr-2" />
            新增耗材
          </Button>
        </div>
      </Card>

      {selectedServiceId ? (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ClipboardList className="w-5 h-5" />
              {selectedService ? (selectedService.name as string) : ''} - 物料清單
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>耗材品名</TableHead>
                  <TableHead>SKU</TableHead>
                  <TableHead className="text-right">每次用量</TableHead>
                  <TableHead>單位</TableHead>
                  <TableHead className="text-right">目前庫存</TableHead>
                  <TableHead>備註</TableHead>
                  <TableHead className="text-right">操作</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {materials.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center text-muted-foreground py-8">
                      此療程尚未設定物料清單
                    </TableCell>
                  </TableRow>
                ) : (
                  materials.map((mat) => {
                    const inv = mat.inventory as Record<string, unknown> | null;
                    return (
                      <TableRow key={mat.id as number}>
                        <TableCell className="font-medium">{inv?.item_name as string || '-'}</TableCell>
                        <TableCell>{(inv?.sku as string) || '-'}</TableCell>
                        <TableCell className="text-right font-bold">{Number(mat.quantity_per_use)}</TableCell>
                        <TableCell>{(mat.unit as string) || (inv?.unit as string) || '-'}</TableCell>
                        <TableCell className="text-right">{inv ? Number(inv.stock_quantity) : '-'}</TableCell>
                        <TableCell>{(mat.notes as string) || '-'}</TableCell>
                        <TableCell className="text-right">
                          <Button variant="ghost" size="sm" onClick={() => openEdit(mat)}>
                            <Edit className="w-4 h-4" />
                          </Button>
                          <Button variant="ghost" size="sm" onClick={() => {
                            if (confirm('確定要移除此耗材？')) deleteMutation.mutate({ id: mat.id as number, tenantId: tenantId! });
                          }}>
                            <Trash2 className="w-4 h-4 text-destructive" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      ) : (
        <Card className="p-8 text-center text-muted-foreground">
          請先選擇療程以查看或設定物料清單
        </Card>
      )}

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{editingMaterial ? '編輯物料項目' : '新增物料項目'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            {!editingMaterial && (
              <div>
                <label className="text-sm font-medium">選擇耗材 *</label>
                <Select value={form.inventoryId} onValueChange={(v) => {
                  const inv = inventoryItems.find((i) => String(i.id) === v);
                  setForm({ ...form, inventoryId: v, unit: inv ? (inv.unit as string) : form.unit });
                }}>
                  <SelectTrigger><SelectValue placeholder="選擇耗材品項" /></SelectTrigger>
                  <SelectContent>
                    {inventoryItems.map((inv) => (
                      <SelectItem key={inv.id as number} value={String(inv.id)}>
                        {String(inv.item_name)} ({String(inv.sku || '無SKU')}) - 庫存: {Number(inv.stock_quantity)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-sm font-medium">每次用量 *</label>
                <Input type="number" min={0.01} step={0.01} value={form.quantityPerUse} onChange={(e) => setForm({ ...form, quantityPerUse: Number(e.target.value) })} />
              </div>
              <div>
                <label className="text-sm font-medium">單位</label>
                <Input value={form.unit} onChange={(e) => setForm({ ...form, unit: e.target.value })} />
              </div>
            </div>
            <div>
              <label className="text-sm font-medium">備註</label>
              <Input value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={closeDialog}>取消</Button>
            <Button onClick={handleSubmit} disabled={!editingMaterial && !form.inventoryId}>
              {editingMaterial ? '更新' : '新增'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
