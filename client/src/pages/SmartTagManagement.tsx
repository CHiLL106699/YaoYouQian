/**
 * SmartTagManagement.tsx
 * 智能標籤管理 — 標籤列表含色標、新增標籤含自動規則設定、查看標籤下的客戶
 */
import { useState } from 'react';
import { trpc } from '@/lib/trpc';
import { useTenant } from '@/contexts/TenantContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter, DialogClose } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';
import { Tag, Plus, Users, Trash2, Edit, Eye, Palette } from 'lucide-react';

const CATEGORY_MAP: Record<string, { label: string; variant: 'default' | 'secondary' | 'outline' | 'destructive' }> = {
  behavior: { label: '行為', variant: 'default' },
  interest: { label: '興趣', variant: 'secondary' },
  status: { label: '狀態', variant: 'outline' },
  custom: { label: '自訂', variant: 'destructive' },
};

const COLOR_OPTIONS = [
  '#6366f1', '#8b5cf6', '#ec4899', '#ef4444', '#f97316',
  '#eab308', '#22c55e', '#14b8a6', '#06b6d4', '#3b82f6',
];

type AutoRule = {
  type: string;
  condition: string;
  value: string;
};

export default function SmartTagManagement() {
  const { tenantId } = useTenant();
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isCustomersOpen, setIsCustomersOpen] = useState(false);
  const [selectedTag, setSelectedTag] = useState<any>(null);
  const [customerPage, setCustomerPage] = useState(1);

  // Form state
  const [tagName, setTagName] = useState('');
  const [tagCategory, setTagCategory] = useState<'behavior' | 'interest' | 'status' | 'custom'>('custom');
  const [tagColor, setTagColor] = useState('#6366f1');
  const [tagDescription, setTagDescription] = useState('');
  const [autoRules, setAutoRules] = useState<AutoRule[]>([]);

  // Queries
  const { data: tags, refetch, isLoading, error } = trpc.smartTag.list.useQuery(
    { tenantId: tenantId! },
    { enabled: !!tenantId }
  );

  const { data: tagCustomers } = trpc.smartTag.getTagCustomers.useQuery(
    { tagId: selectedTag?.id || 0, tenantId: tenantId!, page: customerPage, limit: 20 },
    { enabled: !!selectedTag && isCustomersOpen && !!tenantId }
  );

  // Mutations
  const createMutation = trpc.smartTag.create.useMutation({
    onSuccess: () => {
      toast.success('標籤建立成功');
      setIsCreateOpen(false);
      resetForm();
      refetch();
    },
    onError: (err) => toast.error(`建立失敗：${err.message}`),
  });

  const updateMutation = trpc.smartTag.update.useMutation({
    onSuccess: () => {
      toast.success('標籤更新成功');
      setIsEditOpen(false);
      resetForm();
      refetch();
    },
    onError: (err) => toast.error(`更新失敗：${err.message}`),
  });

  const deleteMutation = trpc.smartTag.delete.useMutation({
    onSuccess: () => {
      toast.success('標籤已刪除');
      refetch();
    },
    onError: (err) => toast.error(`刪除失敗：${err.message}`),
  });

  const resetForm = () => {
    setTagName('');
    setTagCategory('custom');
    setTagColor('#6366f1');
    setTagDescription('');
    setAutoRules([]);
    setSelectedTag(null);
  };

  const handleCreate = () => {
    if (!tenantId || !tagName.trim()) return;
    createMutation.mutate({
      tenantId,
      tagName: tagName.trim(),
      tagCategory,
      color: tagColor,
      description: tagDescription || undefined,
      autoRule: autoRules.length > 0 ? autoRules : undefined,
    });
  };

  const handleUpdate = () => {
    if (!tenantId || !selectedTag) return;
    updateMutation.mutate({
      id: selectedTag.id,
      tenantId,
      tagName: tagName.trim() || undefined,
      tagCategory,
      color: tagColor,
      description: tagDescription || undefined,
      autoRule: autoRules.length > 0 ? autoRules : undefined,
    });
  };

  const handleDelete = (tag: any) => {
    if (!tenantId) return;
    if (confirm(`確定要刪除標籤「${tag.tag_name}」？此操作無法復原。`)) {
      deleteMutation.mutate({ id: tag.id, tenantId });
    }
  };

  const openEdit = (tag: any) => {
    setSelectedTag(tag);
    setTagName(tag.tag_name);
    setTagCategory(tag.tag_category || 'custom');
    setTagColor(tag.color || '#6366f1');
    setTagDescription(tag.description || '');
    setAutoRules(Array.isArray(tag.auto_rule) ? tag.auto_rule : []);
    setIsEditOpen(true);
  };

  const openCustomers = (tag: any) => {
    setSelectedTag(tag);
    setCustomerPage(1);
    setIsCustomersOpen(true);
  };

  const addAutoRule = () => {
    setAutoRules([...autoRules, { type: 'visit_count', condition: 'gte', value: '' }]);
  };

  const updateAutoRule = (index: number, field: keyof AutoRule, value: string) => {
    const updated = [...autoRules];
    updated[index] = { ...updated[index], [field]: value };
    setAutoRules(updated);
  };

  const removeAutoRule = (index: number) => {
    setAutoRules(autoRules.filter((_, i) => i !== index));
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <Tag className="h-6 w-6" />智能標籤管理
        </h1>
        <Dialog open={isCreateOpen} onOpenChange={(open) => { setIsCreateOpen(open); if (!open) resetForm(); }}>
          <DialogTrigger asChild>
            <Button><Plus className="h-4 w-4 mr-1" />新增標籤</Button>
          </DialogTrigger>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle>新增智能標籤</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label>標籤名稱</Label>
                <Input value={tagName} onChange={(e) => setTagName(e.target.value)} placeholder="例如：高消費客戶" />
              </div>
              <div>
                <Label>分類</Label>
                <Select value={tagCategory} onValueChange={(v) => setTagCategory(v as any)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="behavior">行為</SelectItem>
                    <SelectItem value="interest">興趣</SelectItem>
                    <SelectItem value="status">狀態</SelectItem>
                    <SelectItem value="custom">自訂</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>色標</Label>
                <div className="flex gap-2 mt-1">
                  {COLOR_OPTIONS.map((c) => (
                    <button
                      key={c}
                      className={`w-8 h-8 rounded-full border-2 transition-all ${tagColor === c ? 'border-foreground scale-110' : 'border-transparent'}`}
                      style={{ backgroundColor: c }}
                      onClick={() => setTagColor(c)}
                    />
                  ))}
                </div>
              </div>
              <div>
                <Label>描述</Label>
                <Textarea value={tagDescription} onChange={(e) => setTagDescription(e.target.value)} placeholder="標籤用途說明（選填）" rows={2} />
              </div>
              <div>
                <div className="flex items-center justify-between">
                  <Label>自動規則</Label>
                  <Button variant="outline" size="sm" onClick={addAutoRule}><Plus className="h-3 w-3 mr-1" />新增規則</Button>
                </div>
                {autoRules.map((rule, i) => (
                  <div key={i} className="flex items-center gap-2 mt-2">
                    <Select value={rule.type} onValueChange={(v) => updateAutoRule(i, 'type', v)}>
                      <SelectTrigger className="w-[140px]"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="visit_count">到訪次數</SelectItem>
                        <SelectItem value="total_spent">累計消費</SelectItem>
                        <SelectItem value="last_visit_days">最後到訪天數</SelectItem>
                        <SelectItem value="service_type">療程類型</SelectItem>
                      </SelectContent>
                    </Select>
                    <Select value={rule.condition} onValueChange={(v) => updateAutoRule(i, 'condition', v)}>
                      <SelectTrigger className="w-[80px]"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="gte">≥</SelectItem>
                        <SelectItem value="lte">≤</SelectItem>
                        <SelectItem value="eq">＝</SelectItem>
                        <SelectItem value="contains">包含</SelectItem>
                      </SelectContent>
                    </Select>
                    <Input className="flex-1" value={rule.value} onChange={(e) => updateAutoRule(i, 'value', e.target.value)} placeholder="值" />
                    <Button variant="ghost" size="sm" onClick={() => removeAutoRule(i)}>
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </div>
                ))}
              </div>
            </div>
            <DialogFooter>
              <DialogClose asChild><Button variant="outline">取消</Button></DialogClose>
              <Button onClick={handleCreate} disabled={!tagName.trim() || createMutation.isPending}>
                {createMutation.isPending ? '建立中...' : '建立'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Tag List */}
      <Card>
        <CardHeader>
          <CardTitle>標籤列表</CardTitle>
          <CardDescription>共 {tags?.length || 0} 個標籤</CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <p className="text-center py-8 text-muted-foreground">載入中...</p>
          ) : !tags?.length ? (
            <p className="text-center py-8 text-muted-foreground">尚未建立任何標籤</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>標籤</TableHead>
                  <TableHead>分類</TableHead>
                  <TableHead>描述</TableHead>
                  <TableHead className="text-right">客戶數</TableHead>
                  <TableHead className="text-right">規則</TableHead>
                  <TableHead className="text-right">操作</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {tags.map((tag: any) => {
                  const cat = CATEGORY_MAP[tag.tag_category] || CATEGORY_MAP.custom;
                  if (error) {
                    return (
                      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
                        <p className="text-destructive">載入資料時發生錯誤</p>
                        <p className="text-sm text-muted-foreground">{error.message}</p>
                        <Button variant="outline" onClick={() => window.location.reload()}>重試</Button>
                      </div>
                    );
                  }

                  return (
                    <TableRow key={tag.id}>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <div className="w-3 h-3 rounded-full shrink-0" style={{ backgroundColor: tag.color || '#6366f1' }} />
                          <span className="font-medium">{tag.tag_name}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant={cat.variant}>{cat.label}</Badge>
                      </TableCell>
                      <TableCell className="text-muted-foreground max-w-[200px] truncate">
                        {tag.description || '-'}
                      </TableCell>
                      <TableCell className="text-right">
                        <Badge variant="outline" className="cursor-pointer" onClick={() => openCustomers(tag)}>
                          <Users className="h-3 w-3 mr-1" />{tag.customerCount}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        {tag.auto_rule ? (
                          <Badge variant="secondary">自動</Badge>
                        ) : (
                          <span className="text-muted-foreground text-sm">手動</span>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-1">
                          <Button variant="ghost" size="sm" onClick={() => openCustomers(tag)}>
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="sm" onClick={() => openEdit(tag)}>
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="sm" onClick={() => handleDelete(tag)}>
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Edit Dialog */}
      <Dialog open={isEditOpen} onOpenChange={(open) => { setIsEditOpen(open); if (!open) resetForm(); }}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>編輯標籤</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>標籤名稱</Label>
              <Input value={tagName} onChange={(e) => setTagName(e.target.value)} />
            </div>
            <div>
              <Label>分類</Label>
              <Select value={tagCategory} onValueChange={(v) => setTagCategory(v as any)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="behavior">行為</SelectItem>
                  <SelectItem value="interest">興趣</SelectItem>
                  <SelectItem value="status">狀態</SelectItem>
                  <SelectItem value="custom">自訂</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>色標</Label>
              <div className="flex gap-2 mt-1">
                {COLOR_OPTIONS.map((c) => (
                  <button
                    key={c}
                    className={`w-8 h-8 rounded-full border-2 transition-all ${tagColor === c ? 'border-foreground scale-110' : 'border-transparent'}`}
                    style={{ backgroundColor: c }}
                    onClick={() => setTagColor(c)}
                  />
                ))}
              </div>
            </div>
            <div>
              <Label>描述</Label>
              <Textarea value={tagDescription} onChange={(e) => setTagDescription(e.target.value)} rows={2} />
            </div>
          </div>
          <DialogFooter>
            <DialogClose asChild><Button variant="outline">取消</Button></DialogClose>
            <Button onClick={handleUpdate} disabled={updateMutation.isPending}>
              {updateMutation.isPending ? '更新中...' : '更新'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Customers Dialog */}
      <Dialog open={isCustomersOpen} onOpenChange={setIsCustomersOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>
              {selectedTag && (
                <span className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full" style={{ backgroundColor: selectedTag.color || '#6366f1' }} />
                  「{selectedTag.tag_name}」的客戶
                </span>
              )}
            </DialogTitle>
          </DialogHeader>
          <div>
            {!tagCustomers?.customers?.length ? (
              <p className="text-center py-8 text-muted-foreground">此標籤下尚無客戶</p>
            ) : (
              <>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>姓名</TableHead>
                      <TableHead>電話</TableHead>
                      <TableHead>LINE</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {tagCustomers.customers.map((c: any) => (
                      <TableRow key={c.id}>
                        <TableCell className="font-medium">{c.name}</TableCell>
                        <TableCell>{c.phone || '-'}</TableCell>
                        <TableCell>
                          {c.line_user_id ? (
                            <Badge variant="default" className="text-xs">已綁定</Badge>
                          ) : (
                            <Badge variant="outline" className="text-xs">未綁定</Badge>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
                <div className="flex items-center justify-between mt-4">
                  <span className="text-sm text-muted-foreground">共 {tagCustomers.total} 人</span>
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" disabled={customerPage <= 1} onClick={() => setCustomerPage(p => p - 1)}>上一頁</Button>
                    <Button variant="outline" size="sm" disabled={(tagCustomers.customers?.length || 0) < 20} onClick={() => setCustomerPage(p => p + 1)}>下一頁</Button>
                  </div>
                </div>
              </>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
