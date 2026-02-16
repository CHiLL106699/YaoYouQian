/**
 * MarketingCampaignManagement.tsx
 * 會員分眾行銷管理頁面
 */

import { useState } from 'react';
import { trpc } from '@/lib/trpc';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';

export default function MarketingCampaignManagement() {
  const [tenantId] = useState(1); // TODO: 從 context 取得
  const [page, setPage] = useState(1);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);

  // 查詢行銷活動列表
  const { data: campaignsData, refetch } = trpc.marketing.list.useQuery({
    tenantId,
    page,
    limit: 20,
  });

  // 查詢行銷活動統計
  const { data: stats } = trpc.marketing.stats.useQuery({ tenantId });

  // 建立行銷活動
  const createCampaign = trpc.marketing.create.useMutation({
    onSuccess: () => {
      toast.success('行銷活動建立成功');
      setIsCreateDialogOpen(false);
      refetch();
    },
    onError: (error) => {
      toast.error(`行銷活動建立失敗：${error.message}`);
    },
  });

  // 發送行銷活動
  const sendCampaign = trpc.marketing.send.useMutation({
    onSuccess: (data) => {
      toast.success(`行銷活動已發送！成功：${data.successCount}，失敗：${data.failCount}`);
      refetch();
    },
    onError: (error) => {
      toast.error(`行銷活動發送失敗：${error.message}`);
    },
  });

  const [formData, setFormData] = useState({
    campaignName: '',
    targetTags: '',
    targetMemberLevels: '',
    messageContent: '',
    scheduledAt: '',
  });

  const handleCreateCampaign = () => {
    createCampaign.mutate({
      tenantId,
      campaignName: formData.campaignName,
      targetTags: formData.targetTags ? formData.targetTags.split(',').map(t => t.trim()) : [],
      targetMemberLevels: formData.targetMemberLevels ? formData.targetMemberLevels.split(',').map(l => l.trim()) : [],
      messageContent: formData.messageContent,
      scheduledAt: formData.scheduledAt || undefined,
    });
  };

  return (
    <div className="container py-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">會員分眾行銷</h1>
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button>建立行銷活動</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>建立新行銷活動</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label>活動名稱</Label>
                <Input
                  value={formData.campaignName}
                  onChange={(e) => setFormData({ ...formData, campaignName: e.target.value })}
                  placeholder="例如：春季優惠活動"
                />
              </div>
              <div>
                <Label>目標客戶標籤（逗號分隔）</Label>
                <Input
                  value={formData.targetTags}
                  onChange={(e) => setFormData({ ...formData, targetTags: e.target.value })}
                  placeholder="例如：VIP,高消費客戶"
                />
              </div>
              <div>
                <Label>目標會員等級（逗號分隔）</Label>
                <Input
                  value={formData.targetMemberLevels}
                  onChange={(e) => setFormData({ ...formData, targetMemberLevels: e.target.value })}
                  placeholder="例如：金卡,銀卡"
                />
              </div>
              <div>
                <Label>訊息內容</Label>
                <Textarea
                  value={formData.messageContent}
                  onChange={(e) => setFormData({ ...formData, messageContent: e.target.value })}
                  placeholder="輸入要發送給客戶的訊息內容"
                  rows={5}
                />
              </div>
              <div>
                <Label>排程發送時間（選填）</Label>
                <Input
                  type="datetime-local"
                  value={formData.scheduledAt}
                  onChange={(e) => setFormData({ ...formData, scheduledAt: e.target.value })}
                />
              </div>
              <Button onClick={handleCreateCampaign} className="w-full">
                建立行銷活動
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* 行銷活動統計 */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        <Card>
          <CardHeader>
            <CardTitle>總活動數</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">{stats?.total_campaigns || 0}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>已發送</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">{stats?.sent_campaigns || 0}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>已排程</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">{stats?.scheduled_campaigns || 0}</p>
          </CardContent>
        </Card>
      </div>

      {/* 行銷活動列表 */}
      <Card>
        <CardHeader>
          <CardTitle>行銷活動列表</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {campaignsData?.campaigns.map((campaign: any) => (
              <div key={campaign.id} className="flex justify-between items-center p-4 border rounded">
                <div>
                  <p className="font-bold">{campaign.campaign_name}</p>
                  <p className="text-sm text-muted-foreground">
                    目標標籤：{campaign.target_tags?.join(', ') || '無'}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    目標等級：{campaign.target_member_levels?.join(', ') || '無'}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    狀態：{campaign.status === 'draft' ? '草稿' : campaign.status === 'scheduled' ? '已排程' : campaign.status === 'sent' ? '已發送' : '失敗'}
                  </p>
                  {campaign.scheduled_at && (
                    <p className="text-sm text-muted-foreground">
                      排程時間：{new Date(campaign.scheduled_at).toLocaleString()}
                    </p>
                  )}
                </div>
                <div className="flex gap-2">
                  <Button
                    onClick={() => {
                      if (confirm('確定要發送此行銷活動嗎？')) {
                        sendCampaign.mutate({
                          tenantId,
                          campaignId: campaign.id,
                        });
                      }
                    }}
                    disabled={campaign.status === 'sent'}
                  >
                    {campaign.status === 'sent' ? '已發送' : '立即發送'}
                  </Button>
                </div>
              </div>
            ))}
          </div>

          {/* 分頁 */}
          <div className="flex justify-center gap-2 mt-4">
            <Button
              onClick={() => setPage(page - 1)}
              disabled={page === 1}
              variant="outline"
            >
              上一頁
            </Button>
            <span className="flex items-center px-4">
              第 {page} 頁 / 共 {Math.ceil((campaignsData?.total || 0) / 20)} 頁
            </span>
            <Button
              onClick={() => setPage(page + 1)}
              disabled={page >= Math.ceil((campaignsData?.total || 0) / 20)}
              variant="outline"
            >
              下一頁
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
