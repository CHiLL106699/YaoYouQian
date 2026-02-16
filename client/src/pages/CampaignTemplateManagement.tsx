/**
 * CampaignTemplateManagement.tsx
 * 行銷模板管理 — 模板列表、Flex Message 視覺化編輯器、預覽
 */
import { useState } from 'react';
import { trpc } from '@/lib/trpc';
import { useTenant } from '@/contexts/TenantContext';
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
import { FileText, Plus, Trash2, Edit, Eye, MessageSquare, Image, Type } from 'lucide-react';

const TYPE_MAP: Record<string, { label: string; icon: any }> = {
  text: { label: '純文字', icon: Type },
  flex: { label: 'Flex Message', icon: MessageSquare },
  image: { label: '圖片', icon: Image },
};

export default function CampaignTemplateManagement() {
  const { tenantId } = useTenant();
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState<any>(null);

  // Form state
  const [templateName, setTemplateName] = useState('');
  const [messageType, setMessageType] = useState<'text' | 'flex' | 'image'>('text');
  const [textContent, setTextContent] = useState('');
  const [flexJson, setFlexJson] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [category, setCategory] = useState('');

  // Flex builder state
  const [flexTitle, setFlexTitle] = useState('');
  const [flexBody, setFlexBody] = useState('');
  const [flexFooter, setFlexFooter] = useState('');
  const [flexHeroUrl, setFlexHeroUrl] = useState('');
  const [flexButtonLabel, setFlexButtonLabel] = useState('');
  const [flexButtonUrl, setFlexButtonUrl] = useState('');

  // Queries
  const { data: templates, refetch, isLoading } = trpc.campaignTemplate.list.useQuery(
    { tenantId: tenantId! },
    { enabled: !!tenantId }
  );

  // Mutations
  const createMutation = trpc.campaignTemplate.create.useMutation({
    onSuccess: () => {
      toast.success('模板建立成功');
      setIsCreateOpen(false);
      resetForm();
      refetch();
    },
    onError: (err) => toast.error(`建立失敗：${err.message}`),
  });

  const updateMutation = trpc.campaignTemplate.update.useMutation({
    onSuccess: () => {
      toast.success('模板更新成功');
      setIsEditOpen(false);
      resetForm();
      refetch();
    },
    onError: (err) => toast.error(`更新失敗：${err.message}`),
  });

  const deleteMutation = trpc.campaignTemplate.delete.useMutation({
    onSuccess: () => {
      toast.success('模板已刪除');
      refetch();
    },
    onError: (err) => toast.error(`刪除失敗：${err.message}`),
  });

  const resetForm = () => {
    setTemplateName('');
    setMessageType('text');
    setTextContent('');
    setFlexJson('');
    setImageUrl('');
    setCategory('');
    setFlexTitle('');
    setFlexBody('');
    setFlexFooter('');
    setFlexHeroUrl('');
    setFlexButtonLabel('');
    setFlexButtonUrl('');
    setSelectedTemplate(null);
  };

  const buildContent = () => {
    switch (messageType) {
      case 'text':
        return { text: textContent };
      case 'flex':
        if (flexJson.trim()) {
          try {
            return JSON.parse(flexJson);
          } catch {
            toast.error('Flex JSON 格式錯誤');
            return null;
          }
        }
        // Build from visual editor
        return {
          altText: flexTitle || templateName,
          contents: {
            type: 'bubble',
            ...(flexHeroUrl ? {
              hero: {
                type: 'image',
                url: flexHeroUrl,
                size: 'full',
                aspectRatio: '20:13',
                aspectMode: 'cover',
              }
            } : {}),
            header: {
              type: 'box',
              layout: 'vertical',
              contents: [{ type: 'text', text: flexTitle || '標題', weight: 'bold', size: 'xl' }],
            },
            body: {
              type: 'box',
              layout: 'vertical',
              contents: [{ type: 'text', text: flexBody || '內容', wrap: true }],
            },
            ...(flexFooter || flexButtonLabel ? {
              footer: {
                type: 'box',
                layout: 'vertical',
                contents: [
                  ...(flexFooter ? [{ type: 'text', text: flexFooter, size: 'sm', color: '#999999' }] : []),
                  ...(flexButtonLabel ? [{
                    type: 'button',
                    action: { type: 'uri', label: flexButtonLabel, uri: flexButtonUrl || 'https://example.com' },
                    style: 'primary',
                  }] : []),
                ],
              }
            } : {}),
          },
        };
      case 'image':
        return { imageUrl };
      default:
        return {};
    }
  };

  const handleCreate = () => {
    if (!tenantId || !templateName.trim()) return;
    const content = buildContent();
    if (!content) return;
    createMutation.mutate({
      tenantId,
      templateName: templateName.trim(),
      messageType,
      content,
      category: category || undefined,
    });
  };

  const handleUpdate = () => {
    if (!tenantId || !selectedTemplate) return;
    const content = buildContent();
    if (!content) return;
    updateMutation.mutate({
      id: selectedTemplate.id,
      tenantId,
      templateName: templateName.trim() || undefined,
      messageType,
      content,
      category: category || undefined,
    });
  };

  const handleDelete = (tpl: any) => {
    if (!tenantId) return;
    if (confirm(`確定要刪除模板「${tpl.template_name}」？`)) {
      deleteMutation.mutate({ id: tpl.id, tenantId });
    }
  };

  const openEdit = (tpl: any) => {
    setSelectedTemplate(tpl);
    setTemplateName(tpl.template_name);
    setMessageType(tpl.message_type || 'text');
    setCategory(tpl.category || '');
    const content = tpl.content as any;
    if (tpl.message_type === 'text') {
      setTextContent(content?.text || (typeof content === 'string' ? content : ''));
    } else if (tpl.message_type === 'flex') {
      setFlexJson(JSON.stringify(content, null, 2));
    } else if (tpl.message_type === 'image') {
      setImageUrl(content?.imageUrl || '');
    }
    setIsEditOpen(true);
  };

  const openPreview = (tpl: any) => {
    setSelectedTemplate(tpl);
    setIsPreviewOpen(true);
  };

  const renderFlexPreview = (content: any) => {
    if (!content) return <p className="text-muted-foreground">無內容</p>;
    const bubble = content.contents || content;
    return (
      <div className="border rounded-lg overflow-hidden max-w-[300px] mx-auto bg-white">
        {bubble.hero && bubble.hero.url && (
          <div className="w-full h-32 bg-muted flex items-center justify-center overflow-hidden">
            <img src={bubble.hero.url} alt="" className="w-full h-full object-cover" onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }} />
          </div>
        )}
        {bubble.header?.contents?.[0]?.text && (
          <div className="px-4 pt-3 pb-1">
            <p className="font-bold text-lg">{bubble.header.contents[0].text}</p>
          </div>
        )}
        {bubble.body?.contents?.[0]?.text && (
          <div className="px-4 py-2">
            <p className="text-sm text-gray-700">{bubble.body.contents[0].text}</p>
          </div>
        )}
        {bubble.footer?.contents && (
          <div className="px-4 pb-3 space-y-2">
            {bubble.footer.contents.map((item: any, i: number) => {
              if (item.type === 'button') {
                return (
                  <div key={i} className="bg-primary text-primary-foreground text-center py-2 rounded text-sm font-medium">
                    {item.action?.label || '按鈕'}
                  </div>
                );
              }
              if (item.type === 'text') {
                return <p key={i} className="text-xs text-gray-500">{item.text}</p>;
              }
              return null;
            })}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <FileText className="h-6 w-6" />行銷模板管理
        </h1>
        <Dialog open={isCreateOpen} onOpenChange={(open) => { setIsCreateOpen(open); if (!open) resetForm(); }}>
          <DialogTrigger asChild>
            <Button><Plus className="h-4 w-4 mr-1" />新增模板</Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>新增行銷模板</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>模板名稱</Label>
                  <Input value={templateName} onChange={(e) => setTemplateName(e.target.value)} placeholder="例如：週年慶推播" />
                </div>
                <div>
                  <Label>分類</Label>
                  <Input value={category} onChange={(e) => setCategory(e.target.value)} placeholder="例如：促銷、通知" />
                </div>
              </div>
              <div>
                <Label>訊息類型</Label>
                <Select value={messageType} onValueChange={(v) => setMessageType(v as any)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="text">純文字</SelectItem>
                    <SelectItem value="flex">Flex Message</SelectItem>
                    <SelectItem value="image">圖片</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {messageType === 'text' && (
                <div>
                  <Label>文字內容</Label>
                  <Textarea value={textContent} onChange={(e) => setTextContent(e.target.value)} placeholder="輸入推播文字內容..." rows={5} />
                </div>
              )}

              {messageType === 'flex' && (
                <Tabs defaultValue="visual">
                  <TabsList>
                    <TabsTrigger value="visual">視覺化編輯</TabsTrigger>
                    <TabsTrigger value="json">JSON 編輯</TabsTrigger>
                  </TabsList>
                  <TabsContent value="visual" className="space-y-3">
                    <div>
                      <Label>標題</Label>
                      <Input value={flexTitle} onChange={(e) => setFlexTitle(e.target.value)} placeholder="Flex 訊息標題" />
                    </div>
                    <div>
                      <Label>主圖 URL（選填）</Label>
                      <Input value={flexHeroUrl} onChange={(e) => setFlexHeroUrl(e.target.value)} placeholder="https://..." />
                    </div>
                    <div>
                      <Label>內容</Label>
                      <Textarea value={flexBody} onChange={(e) => setFlexBody(e.target.value)} placeholder="Flex 訊息內容" rows={3} />
                    </div>
                    <div>
                      <Label>底部文字（選填）</Label>
                      <Input value={flexFooter} onChange={(e) => setFlexFooter(e.target.value)} placeholder="附註文字" />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label>按鈕文字（選填）</Label>
                        <Input value={flexButtonLabel} onChange={(e) => setFlexButtonLabel(e.target.value)} placeholder="立即查看" />
                      </div>
                      <div>
                        <Label>按鈕連結</Label>
                        <Input value={flexButtonUrl} onChange={(e) => setFlexButtonUrl(e.target.value)} placeholder="https://..." />
                      </div>
                    </div>
                  </TabsContent>
                  <TabsContent value="json">
                    <div>
                      <Label>Flex Message JSON</Label>
                      <Textarea value={flexJson} onChange={(e) => setFlexJson(e.target.value)} placeholder='{"altText":"...","contents":{...}}' rows={10} className="font-mono text-sm" />
                    </div>
                  </TabsContent>
                </Tabs>
              )}

              {messageType === 'image' && (
                <div>
                  <Label>圖片 URL</Label>
                  <Input value={imageUrl} onChange={(e) => setImageUrl(e.target.value)} placeholder="https://..." />
                  {imageUrl && (
                    <div className="mt-2 border rounded overflow-hidden max-w-[200px]">
                      <img src={imageUrl} alt="preview" className="w-full" onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }} />
                    </div>
                  )}
                </div>
              )}
            </div>
            <DialogFooter>
              <DialogClose asChild><Button variant="outline">取消</Button></DialogClose>
              <Button onClick={handleCreate} disabled={!templateName.trim() || createMutation.isPending}>
                {createMutation.isPending ? '建立中...' : '建立'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Template List */}
      <Card>
        <CardHeader>
          <CardTitle>模板列表</CardTitle>
          <CardDescription>共 {templates?.length || 0} 個模板</CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <p className="text-center py-8 text-muted-foreground">載入中...</p>
          ) : !templates?.length ? (
            <p className="text-center py-8 text-muted-foreground">尚未建立任何模板</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>模板名稱</TableHead>
                  <TableHead>類型</TableHead>
                  <TableHead>分類</TableHead>
                  <TableHead>建立時間</TableHead>
                  <TableHead className="text-right">操作</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {templates.map((tpl: any) => {
                  const typeInfo = TYPE_MAP[tpl.message_type] || TYPE_MAP.text;
                  const Icon = typeInfo.icon;
                  return (
                    <TableRow key={tpl.id}>
                      <TableCell className="font-medium">{tpl.template_name}</TableCell>
                      <TableCell>
                        <Badge variant="outline" className="gap-1">
                          <Icon className="h-3 w-3" />{typeInfo.label}
                        </Badge>
                      </TableCell>
                      <TableCell>{tpl.category || '-'}</TableCell>
                      <TableCell className="text-muted-foreground">
                        {tpl.created_at ? new Date(tpl.created_at).toLocaleDateString('zh-TW') : '-'}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-1">
                          <Button variant="ghost" size="sm" onClick={() => openPreview(tpl)}>
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="sm" onClick={() => openEdit(tpl)}>
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="sm" onClick={() => handleDelete(tpl)}>
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
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>編輯模板</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>模板名稱</Label>
                <Input value={templateName} onChange={(e) => setTemplateName(e.target.value)} />
              </div>
              <div>
                <Label>分類</Label>
                <Input value={category} onChange={(e) => setCategory(e.target.value)} />
              </div>
            </div>
            <div>
              <Label>訊息類型</Label>
              <Select value={messageType} onValueChange={(v) => setMessageType(v as any)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="text">純文字</SelectItem>
                  <SelectItem value="flex">Flex Message</SelectItem>
                  <SelectItem value="image">圖片</SelectItem>
                </SelectContent>
              </Select>
            </div>
            {messageType === 'text' && (
              <div>
                <Label>文字內容</Label>
                <Textarea value={textContent} onChange={(e) => setTextContent(e.target.value)} rows={5} />
              </div>
            )}
            {messageType === 'flex' && (
              <div>
                <Label>Flex Message JSON</Label>
                <Textarea value={flexJson} onChange={(e) => setFlexJson(e.target.value)} rows={10} className="font-mono text-sm" />
              </div>
            )}
            {messageType === 'image' && (
              <div>
                <Label>圖片 URL</Label>
                <Input value={imageUrl} onChange={(e) => setImageUrl(e.target.value)} />
              </div>
            )}
          </div>
          <DialogFooter>
            <DialogClose asChild><Button variant="outline">取消</Button></DialogClose>
            <Button onClick={handleUpdate} disabled={updateMutation.isPending}>
              {updateMutation.isPending ? '更新中...' : '更新'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Preview Dialog */}
      <Dialog open={isPreviewOpen} onOpenChange={setIsPreviewOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>模板預覽：{selectedTemplate?.template_name}</DialogTitle>
          </DialogHeader>
          <div className="py-4">
            {selectedTemplate?.message_type === 'text' && (
              <div className="bg-muted p-4 rounded-lg">
                <p className="whitespace-pre-wrap">{(selectedTemplate.content as any)?.text || JSON.stringify(selectedTemplate.content)}</p>
              </div>
            )}
            {selectedTemplate?.message_type === 'flex' && renderFlexPreview(selectedTemplate.content)}
            {selectedTemplate?.message_type === 'image' && (
              <div className="text-center">
                <img
                  src={(selectedTemplate.content as any)?.imageUrl}
                  alt="preview"
                  className="max-w-full rounded"
                  onError={(e) => { (e.target as HTMLImageElement).src = ''; }}
                />
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
