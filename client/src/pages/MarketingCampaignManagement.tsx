/**
 * MarketingCampaignManagement.tsx
 * 會員分眾行銷管理頁面 — 標籤篩選、推播、統計完整流程
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
import { toast } from 'sonner';
import { Megaphone, Plus, Send, Clock, CheckCircle2, BarChart3, Users, Tag } from 'lucide-react';
import { format } from 'date-fns';

const STATUS_CONFIG: Record<string, { label: string; variant: 'default' | 'secondary' | 'outline' | 'destructive' }> = {
  draft: { label: '草稿', variant: 'outline' },
  scheduled: { label: '已排程', variant: 'secondary' },
  sent: { label: '已發送', variant: 'default' },
  failed: { label: '發送失敗', variant: 'destructive' },
};

export default function MarketingCampaignManagement() {
  const { tenantId } = useTenant();
  const [page, setPage] = useState(1);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);

  // 查詢行銷活動列表
  const { data: campaignsData, refetch, isLoading } = trpc.marketing.list.useQuery(
    { tenantId: tenantId!, page, limit: 20 },
    { enabled: !!tenantId }
  );

  // 查詢行銷活動統計
  const { data: stats } = trpc.marketing.stats.useQuery(
    { tenantId: tenantId! },
    { enabled: !!tenantId }
  );

  // 查詢可用標籤
  const { data: tagsData } = trpc.customerTag.list.useQuery(
    { tenantId: tenantId! },
    { enabled: !!tenantId }
  );

  // 建立行銷活動
  const createCampaign = trpc.marketing.create.useMutation({
    onSuccess: () => {
      toast.success('行銷活動建立成功');
      setIsCreateDialogOpen(false);
      resetForm();
      refetch();
    },
    onError: (error) => toast.error(`行銷活動建立失敗：${error.message}`),
  });

  // 發送行銷活動
  const sendCampaign = trpc.marketing.send.useMutation({
    onSuccess: (data) => {
      toast.success(`推播完成！目標 ${data.totalTargets} 人，成功 ${data.successCount} 人，失敗 ${data.failCount} 人`);
      refetch();
    },
    onError: (error) => toast.error(`推播失敗：${error.message}`),
  });

  const [formData, setFormData] = useState({
    campaignName: '',
    targetTags: [] as string[],
    targetMemberLevels: [] as string[],
    messageContent: '',
    scheduledAt: '',
  });

  const resetForm = () => {
    setFormData({
      campaignName: '',
      targetTags: [],
      targetMemberLevels: [],
      messageContent: '',
      scheduledAt: '',
    });
  };

  const toggleTag = (tag: string) => {
    setFormData(prev => ({
      ...prev,
      targetTags: prev.targetTags.includes(tag)
        ? prev.targetTags.filter(t => t !== tag)
        : [...prev.targetTags, tag],
    }));
  };

  const toggleLevel = (level: string) => {
    setFormData(prev => ({
      ...prev,
      targetMemberLevels: prev.targetMemberLevels.includes(level)
        ? prev.targetMemberLevels.filter(l => l !== level)
        : [...prev.targetMemberLevels, level],
    }));
  };

  const handleCreateCampaign = () => {
    if (!tenantId) return;
    if (!formData.campaignName.trim()) {
      toast.error('請輸入活動名稱');
      return;
    }
    if (!formData.messageContent.trim()) {
      toast.error('請輸入訊息內容');
      return;
    }
    createCampaign.mutate({
      tenantId,
      campaignName: formData.campaignName,
      targetTags: formData.targetTags.length > 0 ? formData.targetTags : undefined,
      targetMemberLevels: formData.targetMemberLevels.length > 0 ? formData.targetMemberLevels : undefined,
      messageContent: formData.messageContent,
      scheduledAt: formData.scheduledAt || undefined,
    });
  };

  const memberLevelOptions = ['一般會員', '銀卡', '金卡', '白金卡', 'VIP'];
  const availableTags = (tagsData?.items || []).map((t: any) => t.tag_name || t.name).filter(Boolean) as string[];
  const totalPages = Math.ceil((campaignsData?.total || 0) / 20);

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <Megaphone className="h-6 w-6" />
          會員分眾行銷
        </h1>
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              建立行銷活動
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle>建立新行銷活動</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 max-h-[60vh] overflow-y-auto">
              <div>
                <Label>活動名稱</Label>
                <Input
                  value={formData.campaignName}
                  onChange={(e) => setFormData({ ...formData, campaignName: e.target.value })}
                  placeholder="例如：春季優惠活動"
                />
              </div>

              <div>
                <Label className="flex items-center gap-1">
                  <Tag className="h-3 w-3" />
                  目標客戶標籤（點擊選擇）
                </Label>
                <div className="flex flex-wrap gap-2 mt-2">
                  {availableTags.length > 0 ? (
                    availableTags.map((tag: string) => (
                      <Badge
                        key={tag}
                        variant={formData.targetTags.includes(tag) ? 'default' : 'outline'}
                        className="cursor-pointer"
                        onClick={() => toggleTag(tag)}
                      >
                        {tag}
                      </Badge>
                    ))
                  ) : (
                    <p className="text-sm text-muted-foreground">尚無標籤，留空表示不限標籤</p>
                  )}
                </div>
              </div>

              <div>
                <Label className="flex items-center gap-1">
                  <Users className="h-3 w-3" />
                  目標會員等級（點擊選擇）
                </Label>
                <div className="flex flex-wrap gap-2 mt-2">
                  {memberLevelOptions.map((level) => (
                    <Badge
                      key={level}
                      variant={formData.targetMemberLevels.includes(level) ? 'default' : 'outline'}
                      className="cursor-pointer"
                      onClick={() => toggleLevel(level)}
                    >
                      {level}
                    </Badge>
                  ))}
                </div>
              </div>

              <div>
                <Label>訊息內容</Label>
                <Textarea
                  value={formData.messageContent}
                  onChange={(e) => setFormData({ ...formData, messageContent: e.target.value })}
                  placeholder="輸入要推播給客戶的 LINE 訊息內容"
                  rows={5}
                />
                <p className="text-xs text-muted-foreground mt-1">
                  字數：{formData.messageContent.length} / 5000
                </p>
              </div>

              <div>
                <Label>排程發送時間（選填，留空為草稿）</Label>
                <Input
                  type="datetime-local"
                  value={formData.scheduledAt}
                  onChange={(e) => setFormData({ ...formData, scheduledAt: e.target.value })}
                />
              </div>
            </div>
            <DialogFooter>
              <DialogClose asChild>
                <Button variant="outline">取消</Button>
              </DialogClose>
              <Button onClick={handleCreateCampaign} disabled={createCampaign.isPending}>
                建立活動
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* 行銷活動統計 */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>總活動數</CardDescription>
            <CardTitle className="text-3xl">{stats?.total_campaigns || 0}</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xs text-muted-foreground">
              <BarChart3 className="inline h-3 w-3 mr-1" />
              所有行銷活動
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>已發送</CardDescription>
            <CardTitle className="text-3xl text-green-600">{stats?.sent_campaigns || 0}</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xs text-muted-foreground">
              <CheckCircle2 className="inline h-3 w-3 mr-1 text-green-500" />
              已完成推播
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>已排程</CardDescription>
            <CardTitle className="text-3xl text-blue-600">{stats?.scheduled_campaigns || 0}</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xs text-muted-foreground">
              <Clock className="inline h-3 w-3 mr-1 text-blue-500" />
              等待發送
            </p>
          </CardContent>
        </Card>
      </div>

      {/* 行銷活動列表 */}
      <Card>
        <CardHeader>
          <CardTitle>行銷活動列表</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>活動名稱</TableHead>
                <TableHead>目標標籤</TableHead>
                <TableHead>目標等級</TableHead>
                <TableHead>狀態</TableHead>
                <TableHead>建立時間</TableHead>
                <TableHead className="text-right">操作</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8">載入中...</TableCell>
                </TableRow>
              ) : !campaignsData?.campaigns?.length ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                    尚無行銷活動，點擊「建立行銷活動」開始
                  </TableCell>
                </TableRow>
              ) : (
                campaignsData.campaigns.map((campaign: any) => {
                  const statusConfig = STATUS_CONFIG[campaign.status] || STATUS_CONFIG.draft;
                  return (
                    <TableRow key={campaign.id}>
                      <TableCell className="font-medium">{campaign.campaign_name}</TableCell>
                      <TableCell>
                        <div className="flex flex-wrap gap-1">
                          {campaign.target_tags?.length > 0
                            ? campaign.target_tags.map((tag: string) => (
                                <Badge key={tag} variant="outline" className="text-xs">{tag}</Badge>
                              ))
                            : <span className="text-muted-foreground text-sm">全部</span>
                          }
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-wrap gap-1">
                          {campaign.target_member_levels?.length > 0
                            ? campaign.target_member_levels.map((level: string) => (
                                <Badge key={level} variant="outline" className="text-xs">{level}</Badge>
                              ))
                            : <span className="text-muted-foreground text-sm">全部</span>
                          }
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant={statusConfig.variant}>{statusConfig.label}</Badge>
                      </TableCell>
                      <TableCell className="text-sm">
                        {campaign.created_at ? format(new Date(campaign.created_at), 'yyyy/MM/dd HH:mm') : '--'}
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          size="sm"
                          disabled={campaign.status === 'sent' || sendCampaign.isPending}
                          onClick={() => {
                            if (window.confirm(`確定要立即推播「${campaign.campaign_name}」嗎？\n此操作無法撤回。`)) {
                              sendCampaign.mutate({ tenantId: tenantId!, campaignId: campaign.id });
                            }
                          }}
                        >
                          <Send className="mr-1 h-3 w-3" />
                          {campaign.status === 'sent' ? '已發送' : '立即推播'}
                        </Button>
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>

          {/* 分頁 */}
          {totalPages > 1 && (
            <div className="flex justify-center gap-2 p-4 border-t">
              <Button onClick={() => setPage(page - 1)} disabled={page === 1} variant="outline" size="sm">
                上一頁
              </Button>
              <span className="flex items-center px-4 text-sm text-muted-foreground">
                第 {page} 頁 / 共 {totalPages} 頁
              </span>
              <Button onClick={() => setPage(page + 1)} disabled={page >= totalPages} variant="outline" size="sm">
                下一頁
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
