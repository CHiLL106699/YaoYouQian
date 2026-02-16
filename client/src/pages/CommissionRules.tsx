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
import { Plus, Edit, Trash2 } from 'lucide-react';

const ROLE_LABELS: Record<string, string> = {
  consultant: '諮詢師',
  doctor: '醫師',
  nurse: '護理師',
  admin: '行政',
};

const CONDITION_LABELS: Record<string, string> = {
  immediate: '立即生效',
  deferred: '遞延',
  milestone: '里程碑',
};

export default function CommissionRules() {
  const { tenantId } = useTenant();
  const [roleFilter, setRoleFilter] = useState<string>('all');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingRule, setEditingRule] = useState<Record<string, unknown> | null>(null);
  const [form, setForm] = useState({
    roleType: 'consultant' as string,
    serviceId: undefined as number | undefined,
    commissionRate: 0,
    conditionType: 'immediate' as string,
    description: '',
  });

  const rulesQuery = trpc.commissionRule.list.useQuery(
    {
      tenantId: tenantId!,
      roleType: roleFilter !== 'all' ? (roleFilter as 'consultant' | 'doctor' | 'nurse' | 'admin') : undefined,
    },
    { enabled: !!tenantId }
  );

  const servicesQuery = trpc.service.list.useQuery(
    { tenantId: tenantId! },
    { enabled: !!tenantId }
  );

  const createMutation = trpc.commissionRule.create.useMutation({
    onSuccess: () => {
      toast.success('分潤規則新增成功');
      rulesQuery.refetch();
      closeDialog();
    },
    onError: (err) => toast.error(err.message),
  });

  const updateMutation = trpc.commissionRule.update.useMutation({
    onSuccess: () => {
      toast.success('分潤規則更新成功');
      rulesQuery.refetch();
      closeDialog();
    },
    onError: (err) => toast.error(err.message),
  });

  const deleteMutation = trpc.commissionRule.delete.useMutation({
    onSuccess: () => {
      toast.success('分潤規則已刪除');
      rulesQuery.refetch();
    },
    onError: (err) => toast.error(err.message),
  });

  function closeDialog() {
    setDialogOpen(false);
    setEditingRule(null);
    setForm({ roleType: 'consultant', serviceId: undefined, commissionRate: 0, conditionType: 'immediate', description: '' });
  }

  function openCreate() {
    setEditingRule(null);
    setForm({ roleType: 'consultant', serviceId: undefined, commissionRate: 0, conditionType: 'immediate', description: '' });
    setDialogOpen(true);
  }

  function openEdit(rule: Record<string, unknown>) {
    setEditingRule(rule);
    setForm({
      roleType: (rule.role_type as string) || 'consultant',
      serviceId: rule.service_id as number | undefined,
      commissionRate: Number(rule.commission_rate) || 0,
      conditionType: (rule.condition_type as string) || 'immediate',
      description: (rule.description as string) || '',
    });
    setDialogOpen(true);
  }

  function handleSubmit() {
    if (!tenantId) return;
    if (editingRule) {
      updateMutation.mutate({
        id: editingRule.id as number,
        tenantId,
        roleType: form.roleType as 'consultant' | 'doctor' | 'nurse' | 'admin',
        serviceId: form.serviceId ?? null,
        commissionRate: form.commissionRate,
        conditionType: form.conditionType as 'immediate' | 'deferred' | 'milestone',
        description: form.description || undefined,
      });
    } else {
      createMutation.mutate({
        tenantId,
        roleType: form.roleType as 'consultant' | 'doctor' | 'nurse' | 'admin',
        commissionRate: form.commissionRate,
        serviceId: form.serviceId ?? null,
        conditionType: form.conditionType as 'immediate' | 'deferred' | 'milestone',
        description: form.description || undefined,
      });
    }
  }

  function handleDelete(id: number) {
    if (!tenantId) return;
    if (confirm('確定要刪除此分潤規則？')) {
      deleteMutation.mutate({ id, tenantId });
    }
  }

  const rules = rulesQuery.data || [];
  const services = (servicesQuery.data || []) as Array<Record<string, unknown>>;

  function getServiceName(serviceId: unknown): string {
    if (!serviceId) return '全部療程';
    const svc = services.find((s) => s.id === serviceId);
    return svc ? String(svc.name) : `療程 #${serviceId}`;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">分潤規則設定</h1>
        <Button onClick={openCreate}>
          <Plus className="w-4 h-4 mr-2" />
          新增規則
        </Button>
      </div>

      <Card className="p-4">
        <div className="flex gap-3">
          <Select value={roleFilter} onValueChange={setRoleFilter}>
            <SelectTrigger className="w-[160px]">
              <SelectValue placeholder="角色篩選" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">全部角色</SelectItem>
              <SelectItem value="consultant">諮詢師</SelectItem>
              <SelectItem value="doctor">醫師</SelectItem>
              <SelectItem value="nurse">護理師</SelectItem>
              <SelectItem value="admin">行政</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </Card>

      <Card>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>角色</TableHead>
              <TableHead>適用療程</TableHead>
              <TableHead>分潤比率</TableHead>
              <TableHead>條件類型</TableHead>
              <TableHead>說明</TableHead>
              <TableHead className="text-right">操作</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rules.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center text-muted-foreground py-8">
                  尚無分潤規則
                </TableCell>
              </TableRow>
            ) : (
              (rules as Array<Record<string, unknown>>).map((rule) => (
                <TableRow key={rule.id as number}>
                  <TableCell>
                    <Badge variant="outline">{ROLE_LABELS[String(rule.role_type)] || String(rule.role_type)}</Badge>
                  </TableCell>
                  <TableCell>{getServiceName(rule.service_id)}</TableCell>
                  <TableCell className="font-bold">
                    {(Number(rule.commission_rate) * 100).toFixed(1)}%
                  </TableCell>
                  <TableCell>
                    <Badge variant="secondary">
                      {CONDITION_LABELS[String(rule.condition_type)] || String(rule.condition_type)}
                    </Badge>
                  </TableCell>
                  <TableCell className="max-w-[200px] truncate">{String(rule.description || '-')}</TableCell>
                  <TableCell className="text-right">
                    <Button variant="ghost" size="sm" onClick={() => openEdit(rule)}>
                      <Edit className="w-4 h-4" />
                    </Button>
                    <Button variant="ghost" size="sm" onClick={() => handleDelete(rule.id as number)}>
                      <Trash2 className="w-4 h-4 text-destructive" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </Card>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{editingRule ? '編輯分潤規則' : '新增分潤規則'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium">角色 *</label>
              <Select value={form.roleType} onValueChange={(v) => setForm({ ...form, roleType: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="consultant">諮詢師</SelectItem>
                  <SelectItem value="doctor">醫師</SelectItem>
                  <SelectItem value="nurse">護理師</SelectItem>
                  <SelectItem value="admin">行政</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-sm font-medium">適用療程（留空 = 全部）</label>
              <Select
                value={form.serviceId?.toString() || 'all'}
                onValueChange={(v) => setForm({ ...form, serviceId: v === 'all' ? undefined : Number(v) })}
              >
                <SelectTrigger><SelectValue placeholder="全部療程" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">全部療程</SelectItem>
                  {services.map((svc) => (
                    <SelectItem key={svc.id as number} value={String(svc.id)}>
                      {String(svc.name)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-sm font-medium">分潤比率 *（0~1，例如 0.1 = 10%）</label>
              <Input
                type="number"
                step={0.01}
                min={0}
                max={1}
                value={form.commissionRate}
                onChange={(e) => setForm({ ...form, commissionRate: Number(e.target.value) })}
              />
            </div>
            <div>
              <label className="text-sm font-medium">條件類型</label>
              <Select value={form.conditionType} onValueChange={(v) => setForm({ ...form, conditionType: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="immediate">立即生效</SelectItem>
                  <SelectItem value="deferred">遞延</SelectItem>
                  <SelectItem value="milestone">里程碑</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-sm font-medium">說明</label>
              <Input
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                placeholder="規則說明（選填）"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={closeDialog}>取消</Button>
            <Button onClick={handleSubmit} disabled={form.commissionRate <= 0 || form.commissionRate > 1}>
              {editingRule ? '更新' : '新增'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
