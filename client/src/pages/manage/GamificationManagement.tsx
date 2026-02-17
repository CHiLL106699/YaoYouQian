/**
 * 管理後台 - 遊戲化行銷管理
 * 一番賞/拉霸活動設定、獎品管理
 */
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { Sparkles, Plus, Edit, Trash2, Gift, Star, Search, Calendar } from "lucide-react";

interface Campaign {
  id: number;
  name: string;
  type: "ichiban_kuji" | "slot_machine";
  status: "draft" | "active" | "ended";
  startDate: string;
  endDate: string;
  totalPlays: number;
}

interface Prize {
  id: number;
  campaignId: number;
  name: string;
  probability: number;
  quantity: number;
  remaining: number;
}

const MOCK_CAMPAIGNS: Campaign[] = [
  { id: 1, name: "春季美白大抽獎", type: "ichiban_kuji", status: "active", startDate: "2026-02-01", endDate: "2026-03-31", totalPlays: 156 },
  { id: 2, name: "幸運拉霸機", type: "slot_machine", status: "active", startDate: "2026-02-01", endDate: "2026-04-30", totalPlays: 89 },
  { id: 3, name: "週年慶抽獎", type: "ichiban_kuji", status: "draft", startDate: "2026-05-01", endDate: "2026-05-31", totalPlays: 0 },
];

const MOCK_PRIZES: Prize[] = [
  { id: 1, campaignId: 1, name: "玻尿酸療程折價券 NT$500", probability: 10, quantity: 50, remaining: 38 },
  { id: 2, campaignId: 1, name: "免費膠原蛋白面膜乙盒", probability: 15, quantity: 100, remaining: 72 },
  { id: 3, campaignId: 1, name: "美白導入療程 8 折券", probability: 5, quantity: 20, remaining: 15 },
  { id: 4, campaignId: 2, name: "大獎：療程折價券 NT$1000", probability: 3, quantity: 10, remaining: 8 },
  { id: 5, campaignId: 2, name: "小獎：保養品折價券 NT$200", probability: 20, quantity: 200, remaining: 165 },
];

const STATUS_MAP = {
  draft: { label: "草稿", className: "bg-gray-100 text-gray-700" },
  active: { label: "進行中", className: "bg-green-100 text-green-700" },
  ended: { label: "已結束", className: "bg-red-100 text-red-700" },
};

const TYPE_MAP = {
  ichiban_kuji: { label: "一番賞", icon: Gift },
  slot_machine: { label: "拉霸機", icon: Star },
};

export default function GamificationManagement() {
  const [search, setSearch] = useState("");
  const [showCampaignDialog, setShowCampaignDialog] = useState(false);
  const [showPrizeDialog, setShowPrizeDialog] = useState(false);
  const [selectedCampaignId, setSelectedCampaignId] = useState<number | null>(null);

  const filteredCampaigns = MOCK_CAMPAIGNS.filter(c =>
    c.name.toLowerCase().includes(search.toLowerCase())
  );

  const selectedPrizes = selectedCampaignId
    ? MOCK_PRIZES.filter(p => p.campaignId === selectedCampaignId)
    : [];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Sparkles className="h-6 w-6 text-purple-600" />
          <h1 className="text-2xl font-bold">遊戲化行銷管理</h1>
        </div>
        <Button className="bg-purple-600 hover:bg-purple-700" onClick={() => setShowCampaignDialog(true)}>
          <Plus className="h-4 w-4 mr-2" /> 新增活動
        </Button>
      </div>

      <Tabs defaultValue="campaigns">
        <TabsList>
          <TabsTrigger value="campaigns">活動管理</TabsTrigger>
          <TabsTrigger value="prizes">獎品管理</TabsTrigger>
        </TabsList>

        <TabsContent value="campaigns" className="space-y-4">
          <div className="relative max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input placeholder="搜尋活動..." value={search} onChange={e => setSearch(e.target.value)} className="pl-10" />
          </div>

          <Card>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>活動名稱</TableHead>
                  <TableHead>類型</TableHead>
                  <TableHead>狀態</TableHead>
                  <TableHead>活動期間</TableHead>
                  <TableHead>參與次數</TableHead>
                  <TableHead>操作</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredCampaigns.map(campaign => {
                  const status = STATUS_MAP[campaign.status];
                  const type = TYPE_MAP[campaign.type];
                  const TypeIcon = type.icon;
                  return (
                    <TableRow key={campaign.id}>
                      <TableCell className="font-medium">{campaign.name}</TableCell>
                      <TableCell>
                        <Badge variant="outline" className="gap-1">
                          <TypeIcon className="h-3 w-3" /> {type.label}
                        </Badge>
                      </TableCell>
                      <TableCell><Badge className={status.className}>{status.label}</Badge></TableCell>
                      <TableCell className="text-sm text-gray-600">
                        <Calendar className="h-3 w-3 inline mr-1" />
                        {campaign.startDate} ~ {campaign.endDate}
                      </TableCell>
                      <TableCell>{campaign.totalPlays}</TableCell>
                      <TableCell>
                        <div className="flex gap-1">
                          <Button size="sm" variant="ghost" onClick={() => setShowCampaignDialog(true)}>
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button size="sm" variant="ghost" className="text-red-500" onClick={() => toast.error("確認刪除？")}>
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </Card>
        </TabsContent>

        <TabsContent value="prizes" className="space-y-4">
          <div className="flex gap-4 items-center">
            <Select value={selectedCampaignId?.toString() || ""} onValueChange={v => setSelectedCampaignId(Number(v))}>
              <SelectTrigger className="w-64">
                <SelectValue placeholder="選擇活動" />
              </SelectTrigger>
              <SelectContent>
                {MOCK_CAMPAIGNS.map(c => (
                  <SelectItem key={c.id} value={c.id.toString()}>{c.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button variant="outline" onClick={() => setShowPrizeDialog(true)} disabled={!selectedCampaignId}>
              <Plus className="h-4 w-4 mr-2" /> 新增獎品
            </Button>
          </div>

          {selectedCampaignId ? (
            <Card>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>獎品名稱</TableHead>
                    <TableHead>中獎機率 (%)</TableHead>
                    <TableHead>總數量</TableHead>
                    <TableHead>剩餘數量</TableHead>
                    <TableHead>操作</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {selectedPrizes.map(prize => (
                    <TableRow key={prize.id}>
                      <TableCell className="font-medium">{prize.name}</TableCell>
                      <TableCell>{prize.probability}%</TableCell>
                      <TableCell>{prize.quantity}</TableCell>
                      <TableCell>
                        <Badge className={prize.remaining > 0 ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"}>
                          {prize.remaining}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-1">
                          <Button size="sm" variant="ghost"><Edit className="h-4 w-4" /></Button>
                          <Button size="sm" variant="ghost" className="text-red-500"><Trash2 className="h-4 w-4" /></Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                  {selectedPrizes.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center text-gray-400 py-8">此活動尚無獎品設定</TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </Card>
          ) : (
            <Card className="p-8 text-center text-gray-400">請先選擇一個活動</Card>
          )}
        </TabsContent>
      </Tabs>

      {/* Campaign Dialog */}
      <Dialog open={showCampaignDialog} onOpenChange={setShowCampaignDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>新增活動</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium">活動名稱</label>
              <Input placeholder="輸入活動名稱" />
            </div>
            <div>
              <label className="text-sm font-medium">活動類型</label>
              <Select>
                <SelectTrigger><SelectValue placeholder="選擇類型" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="ichiban_kuji">一番賞</SelectItem>
                  <SelectItem value="slot_machine">拉霸機</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium">開始日期</label>
                <Input type="date" />
              </div>
              <div>
                <label className="text-sm font-medium">結束日期</label>
                <Input type="date" />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCampaignDialog(false)}>取消</Button>
            <Button className="bg-purple-600 hover:bg-purple-700" onClick={() => { toast.success("活動已建立"); setShowCampaignDialog(false); }}>建立</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Prize Dialog */}
      <Dialog open={showPrizeDialog} onOpenChange={setShowPrizeDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>新增獎品</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium">獎品名稱</label>
              <Input placeholder="輸入獎品名稱" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium">中獎機率 (%)</label>
                <Input type="number" min="0" max="100" placeholder="10" />
              </div>
              <div>
                <label className="text-sm font-medium">數量</label>
                <Input type="number" min="1" placeholder="50" />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowPrizeDialog(false)}>取消</Button>
            <Button className="bg-purple-600 hover:bg-purple-700" onClick={() => { toast.success("獎品已新增"); setShowPrizeDialog(false); }}>新增</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
