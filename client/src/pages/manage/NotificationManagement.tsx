/**
 * 管理後台 - 通知管理
 * 發送/管理通知
 */
import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { Bell, Plus, Search, Send, Clock, CheckCircle2, XCircle } from "lucide-react";

interface Notification {
  id: number;
  title: string;
  content: string;
  targetType: "all" | "customer" | "staff";
  channel: "line" | "sms" | "push";
  status: "sent" | "pending" | "failed";
  sentAt: string | null;
  createdAt: string;
}

const MOCK_NOTIFICATIONS: Notification[] = [
  { id: 1, title: "春季優惠通知", content: "全館美白療程 85 折起！", targetType: "customer", channel: "line", status: "sent", sentAt: "2026-02-15 10:00", createdAt: "2026-02-15" },
  { id: 2, title: "班表異動通知", content: "2/20 班表已更新，請確認。", targetType: "staff", channel: "line", status: "sent", sentAt: "2026-02-14 09:00", createdAt: "2026-02-14" },
  { id: 3, title: "預約提醒", content: "您明天有預約，請準時到診。", targetType: "customer", channel: "line", status: "pending", sentAt: null, createdAt: "2026-02-16" },
];

const STATUS_MAP = {
  sent: { label: "已發送", className: "bg-green-100 text-green-700", icon: CheckCircle2 },
  pending: { label: "待發送", className: "bg-yellow-100 text-yellow-700", icon: Clock },
  failed: { label: "失敗", className: "bg-red-100 text-red-700", icon: XCircle },
};

const TARGET_MAP = { all: "全部", customer: "客戶", staff: "員工" };
const CHANNEL_MAP = { line: "LINE", sms: "簡訊", push: "推播" };

export default function NotificationManagement() {
  const [search, setSearch] = useState("");
  const [showDialog, setShowDialog] = useState(false);

  const filtered = MOCK_NOTIFICATIONS.filter(n =>
    n.title.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Bell className="h-6 w-6 text-blue-600" />
          <h1 className="text-2xl font-bold">通知管理</h1>
        </div>
        <Button className="bg-blue-600 hover:bg-blue-700" onClick={() => setShowDialog(true)}>
          <Plus className="h-4 w-4 mr-2" /> 建立通知
        </Button>
      </div>

      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
        <Input placeholder="搜尋通知..." value={search} onChange={e => setSearch(e.target.value)} className="pl-10" />
      </div>

      <Card>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>標題</TableHead>
              <TableHead>對象</TableHead>
              <TableHead>管道</TableHead>
              <TableHead>狀態</TableHead>
              <TableHead>發送時間</TableHead>
              <TableHead>操作</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.map(notification => {
              const status = STATUS_MAP[notification.status];
              return (
                <TableRow key={notification.id}>
                  <TableCell>
                    <div>
                      <p className="font-medium">{notification.title}</p>
                      <p className="text-sm text-gray-500 truncate max-w-xs">{notification.content}</p>
                    </div>
                  </TableCell>
                  <TableCell><Badge variant="outline">{TARGET_MAP[notification.targetType]}</Badge></TableCell>
                  <TableCell><Badge variant="outline">{CHANNEL_MAP[notification.channel]}</Badge></TableCell>
                  <TableCell><Badge className={status.className}>{status.label}</Badge></TableCell>
                  <TableCell className="text-sm text-gray-600">{notification.sentAt || "-"}</TableCell>
                  <TableCell>
                    {notification.status === "pending" && (
                      <Button size="sm" variant="ghost" className="text-blue-600" onClick={() => toast.success("通知已發送")}>
                        <Send className="h-4 w-4" />
                      </Button>
                    )}
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </Card>

      {/* Create Notification Dialog */}
      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>建立通知</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium">標題</label>
              <Input placeholder="通知標題" />
            </div>
            <div>
              <label className="text-sm font-medium">內容</label>
              <Textarea placeholder="通知內容..." rows={3} />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium">發送對象</label>
                <Select>
                  <SelectTrigger><SelectValue placeholder="選擇對象" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">全部</SelectItem>
                    <SelectItem value="customer">客戶</SelectItem>
                    <SelectItem value="staff">員工</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-sm font-medium">發送管道</label>
                <Select>
                  <SelectTrigger><SelectValue placeholder="選擇管道" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="line">LINE</SelectItem>
                    <SelectItem value="sms">簡訊</SelectItem>
                    <SelectItem value="push">推播</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDialog(false)}>取消</Button>
            <Button className="bg-blue-600 hover:bg-blue-700" onClick={() => { toast.success("通知已建立"); setShowDialog(false); }}>
              <Send className="h-4 w-4 mr-2" /> 發送
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
