/**
 * LIFF 一番賞/拉霸 — 抽獎動畫、獎品展示、中獎紀錄
 */
import React, { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { trpc } from '@/lib/trpc';
import LiffLayout from '@/components/LiffLayout';
import { Loader2, Gift, Trophy, Star, Sparkles, History } from 'lucide-react';

function GamificationContent({ profile, tenantId }: { profile: { displayName: string; userId: string }; tenantId: number }) {
  const [selectedCampaign, setSelectedCampaign] = useState<number | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [result, setResult] = useState<{ isWin: boolean; prize: { name: string; imageUrl: string | null } | null } | null>(null);
  const [tab, setTab] = useState('campaigns');

  const campaignsQuery = trpc.gamification.listCampaigns.useQuery({ tenantId, status: 'active' });
  const prizesQuery = trpc.gamification.listPrizes.useQuery(
    { campaignId: selectedCampaign || 0, tenantId },
    { enabled: !!selectedCampaign }
  );
  const historyQuery = trpc.gamification.getPlayHistory.useQuery(
    { tenantId, lineUserId: profile.userId },
    { enabled: tab === 'history' }
  );
  const playMutation = trpc.gamification.play.useMutation();

  const handlePlay = async (campaignId: number) => {
    setIsPlaying(true);
    setResult(null);
    // Animation delay
    await new Promise(r => setTimeout(r, 2000));
    try {
      const res = await playMutation.mutateAsync({ tenantId, campaignId, lineUserId: profile.userId });
      setResult(res);
    } catch (e: any) {
      alert(e.message);
    } finally {
      setIsPlaying(false);
    }
  };

  return (
    <div className="p-4 pb-20">
      <Tabs value={tab} onValueChange={setTab}>
        <TabsList className="grid w-full grid-cols-2 bg-gray-100 mb-4">
          <TabsTrigger value="campaigns"><Gift className="h-4 w-4 mr-1" /> 活動</TabsTrigger>
          <TabsTrigger value="history"><History className="h-4 w-4 mr-1" /> 紀錄</TabsTrigger>
        </TabsList>

        <TabsContent value="campaigns">
          {/* Result Modal */}
          {result && (
            <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4" onClick={() => setResult(null)}>
              <div className="bg-white rounded-2xl p-6 max-w-sm w-full text-center animate-in zoom-in-95" onClick={e => e.stopPropagation()}>
                {result.isWin ? (
                  <>
                    <div className="relative mb-4">
                      <Sparkles className="h-16 w-16 text-yellow-400 mx-auto animate-pulse" />
                    </div>
                    <h3 className="text-xl font-bold text-yellow-600 mb-2">恭喜中獎！</h3>
                    <p className="text-lg font-bold">{result.prize?.name}</p>
                    {result.prize?.imageUrl && <img src={result.prize.imageUrl} className="w-32 h-32 object-cover rounded-xl mx-auto mt-3" />}
                  </>
                ) : (
                  <>
                    <Star className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                    <h3 className="text-xl font-bold text-gray-500 mb-2">再接再厲！</h3>
                    <p className="text-sm text-gray-400">下次一定會中獎的</p>
                  </>
                )}
                <Button className="mt-6 bg-[#06C755] hover:bg-[#05a847] text-white" onClick={() => setResult(null)}>確認</Button>
              </div>
            </div>
          )}

          {/* Playing Animation */}
          {isPlaying && (
            <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center">
              <div className="text-center">
                <div className="relative w-24 h-24 mx-auto mb-4">
                  <Gift className="h-24 w-24 text-[#06C755] animate-bounce" />
                </div>
                <p className="text-white text-lg font-bold animate-pulse">抽獎中...</p>
              </div>
            </div>
          )}

          {campaignsQuery.isLoading ? (
            <div className="flex justify-center py-8"><Loader2 className="h-6 w-6 animate-spin text-[#06C755]" /></div>
          ) : (campaignsQuery.data || []).length === 0 ? (
            <p className="text-center text-gray-400 py-8">暫無進行中的活動</p>
          ) : (
            <div className="space-y-4">
              {(campaignsQuery.data || []).map(campaign => (
                <Card key={campaign.id} className="overflow-hidden">
                  {campaign.imageUrl && (
                    <div className="w-full h-40 bg-gray-100">
                      <img src={campaign.imageUrl} className="w-full h-full object-cover" />
                    </div>
                  )}
                  <CardContent className="p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <Badge className="bg-[#06C755] text-white">{campaign.type === 'ichiban_kuji' ? '一番賞' : '拉霸'}</Badge>
                      <h3 className="font-bold">{campaign.name}</h3>
                    </div>
                    {campaign.description && <p className="text-sm text-gray-500 mb-3">{campaign.description}</p>}
                    <div className="flex justify-between items-center text-xs text-gray-400 mb-3">
                      {campaign.costPerPlay > 0 && <span>消耗 {campaign.costPerPlay} 點</span>}
                      <span>每人最多 {campaign.maxPlaysPerUser} 次</span>
                    </div>

                    {/* Prize Preview */}
                    <Button variant="ghost" size="sm" className="text-xs text-[#06C755] mb-2 p-0"
                      onClick={() => setSelectedCampaign(selectedCampaign === campaign.id ? null : campaign.id)}>
                      <Trophy className="h-3 w-3 mr-1" /> {selectedCampaign === campaign.id ? '收起獎品' : '查看獎品'}
                    </Button>
                    {selectedCampaign === campaign.id && (
                      <div className="grid grid-cols-3 gap-2 mb-3">
                        {prizesQuery.isLoading ? (
                          <Loader2 className="h-4 w-4 animate-spin text-[#06C755] col-span-3 mx-auto" />
                        ) : (
                          (prizesQuery.data || []).map(prize => (
                            <div key={prize.id} className="text-center">
                              <div className="w-full aspect-square bg-gray-100 rounded-lg flex items-center justify-center mb-1 overflow-hidden">
                                {prize.imageUrl ? <img src={prize.imageUrl} className="w-full h-full object-cover" /> : <Gift className="h-6 w-6 text-gray-300" />}
                              </div>
                              <p className="text-[10px] truncate">{prize.name}</p>
                              <p className="text-[10px] text-gray-400">剩 {prize.remainingQuantity}</p>
                            </div>
                          ))
                        )}
                      </div>
                    )}

                    <Button className="w-full bg-gradient-to-r from-yellow-400 to-orange-500 hover:from-yellow-500 hover:to-orange-600 text-white font-bold h-12"
                      disabled={isPlaying} onClick={() => handlePlay(campaign.id)}>
                      <Gift className="h-5 w-5 mr-2" /> 立即抽獎
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="history">
          {historyQuery.isLoading ? (
            <div className="flex justify-center py-8"><Loader2 className="h-6 w-6 animate-spin text-[#06C755]" /></div>
          ) : (historyQuery.data?.plays || []).length === 0 ? (
            <p className="text-center text-gray-400 py-8">暫無抽獎紀錄</p>
          ) : (
            <div className="space-y-2">
              {(historyQuery.data?.plays || []).map(play => (
                <Card key={play.id}>
                  <CardContent className="p-3 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      {play.isWin ? <Trophy className="h-5 w-5 text-yellow-500" /> : <Star className="h-5 w-5 text-gray-300" />}
                      <div>
                        <p className="text-sm font-medium">{play.isWin ? '中獎' : '未中獎'}</p>
                        <p className="text-xs text-gray-400">{new Date(play.playedAt).toLocaleString('zh-TW')}</p>
                      </div>
                    </div>
                    {play.isWin && <Badge className="bg-yellow-100 text-yellow-700">中獎</Badge>}
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

export default function LiffGamification() {
  return <LiffLayout title="幸運抽獎">{(props) => <GamificationContent {...props} />}</LiffLayout>;
}
