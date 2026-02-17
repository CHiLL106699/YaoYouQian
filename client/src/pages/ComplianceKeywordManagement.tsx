/**
 * ComplianceKeywordManagement.tsx
 * 醫療法規警示詞庫管理 — CRUD 操作 + 即時合規檢查測試
 */
import { useState } from 'react';
import { trpc } from '@/lib/trpc';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter, DialogClose } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from 'sonner';
import ComplianceChecker from '@/components/ComplianceChecker';
import { ShieldAlert, Plus, Trash2, Edit, FlaskConical } from 'lucide-react';

export default function ComplianceKeywordManagement() {
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [selectedKeyword, setSelectedKeyword] = useState<any>(null);
  const [testContent, setTestContent] = useState('');

  // Form state
  const [keyword, setKeyword] = useState('');
  const [severity, setSeverity] = useState<'warning' | 'blocked'>('warning');
  const [regulationRef, setRegulationRef] = useState('');
  const [description, setDescription] = useState('');

  // Queries
  const { data: keywords, refetch, isLoading, error } = trpc.compliance.listKeywords.useQuery({});

  // Mutations
  const createMutation = trpc.compliance.createKeyword.useMutation({
    onSuccess: () => {
      toast.success('警示詞新增成功');
      setIsCreateOpen(false);
      resetForm();
      refetch();
    },
    onError: (err) => toast.error(`新增失敗：${err.message}`),
  });

  const updateMutation = trpc.compliance.updateKeyword.useMutation({
    onSuccess: () => {
      toast.success('警示詞更新成功');
      setIsEditOpen(false);
      resetForm();
      refetch();
    },
    onError: (err) => toast.error(`更新失敗：${err.message}`),
  });

  const deleteMutation = trpc.compliance.deleteKeyword.useMutation({
    onSuccess: () => {
      toast.success('警示詞已刪除');
      refetch();
    },
    onError: (err) => toast.error(`刪除失敗：${err.message}`),
  });

  const resetForm = () => {
    setKeyword('');
    setSeverity('warning');
    setRegulationRef('');
    setDescription('');
    setSelectedKeyword(null);
  };

  const handleCreate = () => {
    if (!keyword.trim()) return;
    createMutation.mutate({
      keyword: keyword.trim(),
      severity,
      regulationReference: regulationRef || undefined,
      description: description || undefined,
    });
  };

  const handleUpdate = () => {
    if (!selectedKeyword) return;
    updateMutation.mutate({
      id: selectedKeyword.id,
      keyword: keyword.trim() || undefined,
      severity,
      regulationReference: regulationRef || undefined,
      description: description || undefined,
    });
  };

  const handleDelete = (kw: any) => {
    if (confirm(`確定要刪除警示詞「${kw.keyword}」？`)) {
      deleteMutation.mutate({ id: kw.id });
    }
  };

  const openEdit = (kw: any) => {
    setSelectedKeyword(kw);
    setKeyword(kw.keyword);
    setSeverity(kw.severity);
    setRegulationRef(kw.regulation_reference || '');
    setDescription(kw.description || '');
    setIsEditOpen(true);
  };

  const blockedCount = (keywords || []).filter((k: any) => k.severity === 'blocked').length;
  const warningCount = (keywords || []).filter((k: any) => k.severity === 'warning').length;

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
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <ShieldAlert className="h-6 w-6" />醫療法規警示詞庫
        </h1>
        <Dialog open={isCreateOpen} onOpenChange={(open) => { setIsCreateOpen(open); if (!open) resetForm(); }}>
          <DialogTrigger asChild>
            <Button><Plus className="h-4 w-4 mr-1" />新增警示詞</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>新增警示詞</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label>警示詞</Label>
                <Input value={keyword} onChange={(e) => setKeyword(e.target.value)} placeholder="例如：買一送一" />
              </div>
              <div>
                <Label>嚴重等級</Label>
                <Select value={severity} onValueChange={(v) => setSeverity(v as any)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="warning">警告（黃色，允許發送）</SelectItem>
                    <SelectItem value="blocked">禁止（紅色，阻擋發送）</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>法規依據（選填）</Label>
                <Input value={regulationRef} onChange={(e) => setRegulationRef(e.target.value)} placeholder="例如：醫療法第86條" />
              </div>
              <div>
                <Label>說明（選填）</Label>
                <Textarea value={description} onChange={(e) => setDescription(e.target.value)} placeholder="為什麼此用語違規" rows={2} />
              </div>
            </div>
            <DialogFooter>
              <DialogClose asChild><Button variant="outline">取消</Button></DialogClose>
              <Button onClick={handleCreate} disabled={!keyword.trim() || createMutation.isPending}>
                {createMutation.isPending ? '新增中...' : '新增'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-muted-foreground">總警示詞數</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{(keywords || []).length}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-muted-foreground text-red-600">禁止用語</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-red-600">{blockedCount}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-muted-foreground text-yellow-600">警告用語</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-yellow-600">{warningCount}</p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="keywords">
        <TabsList>
          <TabsTrigger value="keywords">警示詞列表</TabsTrigger>
          <TabsTrigger value="test">合規檢查測試</TabsTrigger>
        </TabsList>

        <TabsContent value="keywords">
          <Card>
            <CardHeader>
              <CardTitle>警示詞列表</CardTitle>
              <CardDescription>管理醫療廣告法規警示詞庫</CardDescription>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <p className="text-center py-8 text-muted-foreground">載入中...</p>
              ) : !(keywords as any[])?.length ? (
                <p className="text-center py-8 text-muted-foreground">尚未建立任何警示詞</p>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>警示詞</TableHead>
                      <TableHead>等級</TableHead>
                      <TableHead>法規依據</TableHead>
                      <TableHead>說明</TableHead>
                      <TableHead className="text-right">操作</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {(keywords as any[]).map((kw: any) => (
                      <TableRow key={kw.id}>
                        <TableCell className="font-medium">{kw.keyword}</TableCell>
                        <TableCell>
                          <Badge variant={kw.severity === 'blocked' ? 'destructive' : 'secondary'}>
                            {kw.severity === 'blocked' ? '禁止' : '警告'}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-muted-foreground">{kw.regulation_reference || '-'}</TableCell>
                        <TableCell className="text-muted-foreground max-w-[200px] truncate">{kw.description || '-'}</TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-1">
                            <Button variant="ghost" size="sm" onClick={() => openEdit(kw)}>
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button variant="ghost" size="sm" onClick={() => handleDelete(kw)}>
                              <Trash2 className="h-4 w-4 text-destructive" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="test">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FlaskConical className="h-5 w-5" />合規檢查測試
              </CardTitle>
              <CardDescription>輸入文字內容，即時檢查是否包含違規用語</CardDescription>
            </CardHeader>
            <CardContent>
              <ComplianceChecker content={testContent} onChange={setTestContent} />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Edit Dialog */}
      <Dialog open={isEditOpen} onOpenChange={(open) => { setIsEditOpen(open); if (!open) resetForm(); }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>編輯警示詞</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>警示詞</Label>
              <Input value={keyword} onChange={(e) => setKeyword(e.target.value)} />
            </div>
            <div>
              <Label>嚴重等級</Label>
              <Select value={severity} onValueChange={(v) => setSeverity(v as any)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="warning">警告（黃色，允許發送）</SelectItem>
                  <SelectItem value="blocked">禁止（紅色，阻擋發送）</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>法規依據</Label>
              <Input value={regulationRef} onChange={(e) => setRegulationRef(e.target.value)} />
            </div>
            <div>
              <Label>說明</Label>
              <Textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={2} />
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
    </div>
  );
}
