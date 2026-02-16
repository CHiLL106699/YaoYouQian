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
import { Plus, Search, Edit, Trash2, UserPlus } from 'lucide-react';

const ROLE_LABELS: Record<string, string> = {
  consultant: '諮詢師',
  doctor: '醫師',
  nurse: '護理師',
  admin: '行政',
};

const STATUS_LABELS: Record<string, string> = {
  active: '在職',
  inactive: '停用',
  archived: '已歸檔',
};

export default function StaffManagement() {
  const { tenantId } = useTenant();
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingStaff, setEditingStaff] = useState<Record<string, unknown> | null>(null);
  const [form, setForm] = useState({
    name: '',
    roleType: 'consultant' as string,
    phone: '',
    email: '',
    lineUserId: '',
    baseSalary: 0,
  });

  const staffQuery = trpc.staff.list.useQuery(
    {
      tenantId: tenantId!,
      search: search || undefined,
      roleType: roleFilter !== 'all' ? (roleFilter as 'consultant' | 'doctor' | 'nurse' | 'admin') : undefined,
      status: statusFilter !== 'all' ? (statusFilter as 'active' | 'inactive' | 'archived') : undefined,
    },
    { enabled: !!tenantId }
  );

  const createMutation = trpc.staff.create.useMutation({
    onSuccess: () => {
      toast.success('員工新增成功');
      staffQuery.refetch();
      closeDialog();
    },
    onError: (err) => toast.error(err.message),
  });

  const updateMutation = trpc.staff.update.useMutation({
    onSuccess: () => {
      toast.success('員工更新成功');
      staffQuery.refetch();
      closeDialog();
    },
    onError: (err) => toast.error(err.message),
  });

  const deleteMutation = trpc.staff.delete.useMutation({
    onSuccess: () => {
      toast.success('員工已刪除');
      staffQuery.refetch();
    },
    onError: (err) => toast.error(err.message),
  });

  function closeDialog() {
    setDialogOpen(false);
    setEditingStaff(null);
    setForm({ name: '', roleType: 'consultant', phone: '', email: '', lineUserId: '', baseSalary: 0 });
  }

  function openCreate() {
    setEditingStaff(null);
    setForm({ name: '', roleType: 'consultant', phone: '', email: '', lineUserId: '', baseSalary: 0 });
    setDialogOpen(true);
  }

  function openEdit(staff: Record<string, unknown>) {
    setEditingStaff(staff);
    setForm({
      name: (staff.name as string) || '',
      roleType: (staff.role_type as string) || 'consultant',
      phone: (staff.phone as string) || '',
      email: (staff.email as string) || '',
      lineUserId: (staff.line_user_id as string) || '',
      baseSalary: Number(staff.base_salary) || 0,
    });
    setDialogOpen(true);
  }

  function handleSubmit() {
    if (!tenantId) return;
    if (editingStaff) {
      updateMutation.mutate({
        id: editingStaff.id as number,
        tenantId,
        name: form.name,
        roleType: form.roleType as 'consultant' | 'doctor' | 'nurse' | 'admin',
        phone: form.phone || undefined,
        email: form.email || undefined,
        lineUserId: form.lineUserId || undefined,
        baseSalary: form.baseSalary,
      });
    } else {
      createMutation.mutate({
        tenantId,
        name: form.name,
        roleType: form.roleType as 'consultant' | 'doctor' | 'nurse' | 'admin',
        phone: form.phone || undefined,
        email: form.email || undefined,
        lineUserId: form.lineUserId || undefined,
        baseSalary: form.baseSalary,
      });
    }
  }

  function handleDelete(id: number) {
    if (!tenantId) return;
    if (confirm('確定要刪除此員工？')) {
      deleteMutation.mutate({ id, tenantId });
    }
  }

  const staff = staffQuery.data || [];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">員工管理</h1>
        <Button onClick={openCreate}>
          <UserPlus className="w-4 h-4 mr-2" />
          新增員工
        </Button>
      </div>

      <Card className="p-4">
        <div className="flex flex-wrap gap-3">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="搜尋姓名、電話、Email..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9"
            />
          </div>
          <Select value={roleFilter} onValueChange={setRoleFilter}>
            <SelectTrigger className="w-[140px]">
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
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-[140px]">
              <SelectValue placeholder="狀態篩選" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">全部狀態</SelectItem>
              <SelectItem value="active">在職</SelectItem>
              <SelectItem value="inactive">停用</SelectItem>
              <SelectItem value="archived">已歸檔</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </Card>

      <Card>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>姓名</TableHead>
              <TableHead>角色</TableHead>
              <TableHead>電話</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>底薪</TableHead>
              <TableHead>狀態</TableHead>
              <TableHead className="text-right">操作</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {staff.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center text-muted-foreground py-8">
                  尚無員工資料
                </TableCell>
              </TableRow>
            ) : (
              staff.map((s: Record<string, unknown>) => (
                <TableRow key={s.id as number}>
                  <TableCell className="font-medium">{s.name as string}</TableCell>
                  <TableCell>
                    <Badge variant="outline">{ROLE_LABELS[s.role_type as string] || String(s.role_type)}</Badge>
                  </TableCell>
                  <TableCell>{(s.phone as string) || '-'}</TableCell>
                  <TableCell>{(s.email as string) || '-'}</TableCell>
                  <TableCell>${Number(s.base_salary).toLocaleString()}</TableCell>
                  <TableCell>
                    <Badge variant={(s.status as string) === 'active' ? 'default' : 'secondary'}>
                      {STATUS_LABELS[s.status as string] || String(s.status)}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <Button variant="ghost" size="sm" onClick={() => openEdit(s)}>
                      <Edit className="w-4 h-4" />
                    </Button>
                    <Button variant="ghost" size="sm" onClick={() => handleDelete(s.id as number)}>
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
            <DialogTitle>{editingStaff ? '編輯員工' : '新增員工'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium">姓名 *</label>
              <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
            </div>
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
              <label className="text-sm font-medium">電話</label>
              <Input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
            </div>
            <div>
              <label className="text-sm font-medium">Email</label>
              <Input value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
            </div>
            <div>
              <label className="text-sm font-medium">LINE User ID</label>
              <Input value={form.lineUserId} onChange={(e) => setForm({ ...form, lineUserId: e.target.value })} />
            </div>
            <div>
              <label className="text-sm font-medium">底薪</label>
              <Input type="number" value={form.baseSalary} onChange={(e) => setForm({ ...form, baseSalary: Number(e.target.value) })} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={closeDialog}>取消</Button>
            <Button onClick={handleSubmit} disabled={!form.name}>
              {editingStaff ? '更新' : '新增'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
