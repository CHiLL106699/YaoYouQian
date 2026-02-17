/**
 * 遊戲化行銷管理 — 活動設定、獎品管理、中獎紀錄、數據統計
 */
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { trpc } from '@/lib/trpc';
import { useTenant } from '@/contexts/TenantContext';
import { Loader2, Gift, Trophy, BarChart3, Plus, Settings, Users, Percent } from 'lucide-react';

export default function GamificationManagement() {
  const { tenantId } = useTenant();
  const [tab, setTab] = useState('campaigns');
  const [showCreateCampaign, setShowCreateCampaign] = useState(false);
  const [newCampaignName, setNewCampaignName] = useState('');
  const [newCampaignType, setNewCampaignType] = useState<'ichiban_kuji' | 'slot_machine'>('ichiban_kuji');

  const campaignsQuery = trpc.gamification.listCampaigns.useQuery(
    { tenantId: tenantId! },
    { enabled: !!tenantId }
  );
  const campaigns = (campaignsQuery.data || []) as any[];
  const firstCampaignId = campaigns[0]?.id || 0;
  const prizesQuery = trpc.gamification.listPrizes.useQuery(
    { tenantId: tenantId!, campaignId: firstCampaignId },
    { enabled: !!tenantId && firstCampaignId > 0 }
  );
  const recordsQuery = trpc.gamification.getPlayHistory.useQuery(
    { tenantId: tenantId!, limit: 50 },
    { enabled: !!tenantId }
  );
  const statsQuery = trpc.gamification.getCampaignStats.useQuery(
    { tenantId: tenantId!, campaignId: firstCampaignId },
    { enabled: !!tenantId && firstCampaignId > 0 }
  );
  const createCampaignMutation = trpc.gamification.createCampaign.useMutation();

  const prizes = (prizesQuery.data || []) as any[];
  const records = (recordsQuery.data as any)?.plays || [];
  const stats = statsQuery.data as any;

  const handleCreateCampaign = async () => {
    if (!newCampaignName) return;
    try {
      await createCampaignMutation.mutateAsync({
        tenantId: tenantId!, name: newCampaignName, type: newCampaignType as 'ichiban_kuji' | 'slot_machine',
      });
      campaignsQuery.refetch();
      setShowCreateCampaign(false);
      setNewCampaignName('');
    } catch (e: any) {
      alert(`建立失敗: ${e.message}`);
    }
  };

  return (
    <div className="p-6 space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">遊戲化行銷管理</h1>
        <Button className="bg-[#06C755] hover:bg-[#05a847] text-white" onClick={() => setShowCreateCampaign(!showCreateCampaign)}>
          <Plus className="h-4 w-4 mr-1" /> 新增活動
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Card><CardContent className="p-4 text-center"><p className="text-2xl font-bold">{campaigns.length}</p><p className="text-xs text-gray-400">活動數</p></CardContent></Card>
        <Card><CardContent className="p-4 text-center"><p className="text-2xl font-bold">{stats?.totalPlays || 0}</p><p className="text-xs text-gray-400">總抽獎次數</p></CardContent></Card>
        <Card><CardContent className="p-4 text-center"><p className="text-2xl font-bold">{stats?.totalWins || 0}</p><p className="text-xs text-gray-400">中獎次數</p></CardContent></Card>
        <Card><CardContent className="p-4 text-center"><p className="text-2xl font-bold">{stats?.winRate || '0'}%</p><p className="text-xs text-gray-400">中獎率</p></CardContent></Card>
      </div>

      {/* Create Campaign Form */}
      {showCreateCampaign && (
        <Card className="border-[#06C755]">
          <CardContent className="p-4 space-y-3">
            <h3 className="font-bold">新增活動</h3>
            <Input value={newCampaignName} onChange={e => setNewCampaignName(e.target.value)} placeholder="活動名稱" />
            <div className="flex gap-2">
              <Button variant={newCampaignType === 'ichiban_kuji' ? 'default' : 'outline'} size="sm" onClick={() => setNewCampaignType('ichiban_kuji')}>一番賞</Button>
              <Button variant={newCampaignType === 'slot_machine' ? 'default' : 'outline'} size="sm" onClick={() => setNewCampaignType('slot_machine')}>拉霸</Button>
            </div>
            <Button className="w-full bg-[#06C755] hover:bg-[#05a847] text-white" disabled={createCampaignMutation.isPending} onClick={handleCreateCampaign}>
              {createCampaignMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : '建立活動'}
            </Button>
          </CardContent>
        </Card>
      )}

      <Tabs value={tab} onValueChange={setTab}>
        <TabsList>
          <TabsTrigger value="campaigns"><Settings className="h-4 w-4 mr-1" /> 活動</TabsTrigger>
          <TabsTrigger value="prizes"><Gift className="h-4 w-4 mr-1" /> 獎品</TabsTrigger>
          <TabsTrigger value="records"><Trophy className="h-4 w-4 mr-1" /> 中獎紀錄</TabsTrigger>
        </TabsList>

        <TabsContent value="campaigns" className="mt-4">
          {campaignsQuery.isLoading ? (
            <div className="flex justify-center py-8"><Loader2 className="h-6 w-6 animate-spin" /></div>
          ) : campaigns.length === 0 ? (
            <p className="text-center text-gray-400 py-8">尚無活動</p>
          ) : (
            <div className="space-y-3">
              {campaigns.map((c: any) => (
                <Card key={c.id}>
                  <CardContent className="p-4 flex justify-between items-center">
                    <div>
                      <h3 className="font-medium">{c.name}</h3>
                      <div className="flex items-center gap-2 mt-1 text-xs text-gray-400">
                        <span>{c.type === 'gacha' ? '一番賞' : '拉霸'}</span>
                        <span>{c.startDate} ~ {c.endDate || '無限期'}</span>
                      </div>
                    </div>
                    <Badge className={c.status === 'active' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}>
                      {c.status === 'active' ? '進行中' : c.status === 'ended' ? '已結束' : '草稿'}
                    </Badge>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="prizes" className="mt-4">
          {prizesQuery.isLoading ? (
            <div className="flex justify-center py-8"><Loader2 className="h-6 w-6 animate-spin" /></div>
          ) : prizes.length === 0 ? (
            <p className="text-center text-gray-400 py-8">尚無獎品</p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {prizes.map((p: any) => (
                <Card key={p.id}>
                  <CardContent className="p-4 flex items-center gap-3">
                    <div className="w-12 h-12 rounded-lg bg-yellow-100 flex items-center justify-center">
                      <Gift className="h-6 w-6 text-yellow-500" />
                    </div>
                    <div className="flex-1">
                      <h3 className="font-medium text-sm">{p.name}</h3>
                      <div className="flex items-center gap-2 text-xs text-gray-400 mt-1">
                        <span className="flex items-center gap-1"><Percent className="h-3 w-3" /> {p.probability}%</span>
                        <span>庫存: {p.stock ?? '∞'}</span>
                      </div>
                    </div>
                    <Badge variant="outline">{p.grade || '-'}</Badge>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="records" className="mt-4">
          {recordsQuery.isLoading ? (
            <div className="flex justify-center py-8"><Loader2 className="h-6 w-6 animate-spin" /></div>
          ) : records.length === 0 ? (
            <p className="text-center text-gray-400 py-8">尚無中獎紀錄</p>
          ) : (
            <div className="space-y-2">
              {records.map((r: any) => (
                <Card key={r.id}>
                  <CardContent className="p-3 flex justify-between items-center">
                    <div>
                      <p className="text-sm font-medium">{r.customerName || '-'}</p>
                      <p className="text-xs text-gray-400">{r.campaignName} — {r.prizeName}</p>
                    </div>
                    <div className="text-right">
                      <Badge className={r.won ? 'bg-yellow-100 text-yellow-700' : 'bg-gray-100 text-gray-500'}>
                        {r.won ? '中獎' : '未中'}
                      </Badge>
                      <p className="text-[10px] text-gray-400 mt-1">{r.playedAt}</p>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
