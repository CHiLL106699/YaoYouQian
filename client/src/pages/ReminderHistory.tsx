/**
 * 提醒發送歷史頁面
 * - 列表展示所有提醒記錄
 * - 狀態篩選（已發送 / 失敗 / 待發送 / 已跳過）
 * - 重新發送失敗的提醒
 */
import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { trpc } from "@/lib/trpc";
import { History, RefreshCw, Send, AlertCircle, CheckCircle2, Clock, SkipForward, BarChart3 } from "lucide-react";
import { toast } from "sonner";

const statusConfig: Record<string, { label: string; variant: "default" | "secondary" | "destructive" | "outline"; icon: React.ElementType }> = {
  sent: { label: "已發送", variant: "default", icon: CheckCircle2 },
  failed: { label: "失敗", variant: "destructive", icon: AlertCircle },
  pending: { label: "待發送", variant: "secondary", icon: Clock },
  skipped: { label: "已跳過", variant: "outline", icon: SkipForward },
};

const reminderTypeLabels: Record<string, string> = {
  "24h": "24 小時前",
  "2h": "2 小時前",
  custom: "自訂",
};

export default function ReminderHistory() {
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [typeFilter, setTypeFilter] = useState<string>("all");
  const [page, setPage] = useState(1);
  const tenantId = 1; // TODO: 從 context 取得

  // 查詢提醒歷史
  const remindersQuery = trpc.appointmentReminder.list.useQuery({
    tenantId,
    status: statusFilter !== "all" ? statusFilter as any : undefined,
    reminderType: typeFilter !== "all" ? typeFilter as any : undefined,
    page,
    pageSize: 20,
  });

  // 查詢統計
  const statsQuery = trpc.appointmentReminder.stats.useQuery({ tenantId });

  // 手動重新發送
  const sendManualMutation = trpc.appointmentReminder.sendManual.useMutation({
    onSuccess: (result) => {
      if (result.success) {
        toast.success("提醒已重新發送");
        remindersQuery.refetch();
        statsQuery.refetch();
      } else {
        toast.error(`發送失敗: ${result.error}`);
      }
    },
    onError: (error) => {
      toast.error(`發送失敗: ${error.message}`);
    },
  });

  const handleResend = (appointmentId: number) => {
    sendManualMutation.mutate({
      tenantId,
      appointmentId,
      reminderType: "custom",
      channel: "line",
    });
  };

  const stats = statsQuery.data || { total: 0, sent: 0, failed: 0, pending: 0, skipped: 0 };
  const reminders = remindersQuery.data?.reminders || [];
  const total = remindersQuery.data?.total || 0;
  const totalPages = Math.ceil(total / 20);

  return (
    <div className="space-y-6">
      {/* 頁面標題 */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
          <History className="h-6 w-6" />
          提醒發送歷史
        </h1>
        <p className="text-muted-foreground mt-1">
          查看所有預約提醒的發送記錄與狀態
        </p>
      </div>

      {/* 統計卡片 */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">總計發送</p>
                <p className="text-2xl font-bold">{stats.total}</p>
              </div>
              <BarChart3 className="h-8 w-8 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">成功</p>
                <p className="text-2xl font-bold text-green-600">{stats.sent}</p>
              </div>
              <CheckCircle2 className="h-8 w-8 text-green-600" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">失敗</p>
                <p className="text-2xl font-bold text-red-600">{stats.failed}</p>
              </div>
              <AlertCircle className="h-8 w-8 text-red-600" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">待發送</p>
                <p className="text-2xl font-bold text-yellow-600">{stats.pending}</p>
              </div>
              <Clock className="h-8 w-8 text-yellow-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* 篩選與列表 */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>發送記錄</CardTitle>
              <CardDescription>共 {total} 筆記錄</CardDescription>
            </div>
            <div className="flex gap-2">
              <Select value={statusFilter} onValueChange={(v) => { setStatusFilter(v); setPage(1); }}>
                <SelectTrigger className="w-[140px]">
                  <SelectValue placeholder="狀態篩選" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">全部狀態</SelectItem>
                  <SelectItem value="sent">已發送</SelectItem>
                  <SelectItem value="failed">失敗</SelectItem>
                  <SelectItem value="pending">待發送</SelectItem>
                  <SelectItem value="skipped">已跳過</SelectItem>
                </SelectContent>
              </Select>
              <Select value={typeFilter} onValueChange={(v) => { setTypeFilter(v); setPage(1); }}>
                <SelectTrigger className="w-[140px]">
                  <SelectValue placeholder="類型篩選" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">全部類型</SelectItem>
                  <SelectItem value="24h">24 小時前</SelectItem>
                  <SelectItem value="2h">2 小時前</SelectItem>
                  <SelectItem value="custom">自訂</SelectItem>
                </SelectContent>
              </Select>
              <Button variant="outline" size="icon" onClick={() => remindersQuery.refetch()}>
                <RefreshCw className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {remindersQuery.isLoading ? (
            <div className="flex items-center justify-center py-12">
              <RefreshCw className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : reminders.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
              <History className="h-12 w-12 mb-4" />
              <p>尚無提醒記錄</p>
            </div>
          ) : (
            <>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>預約資訊</TableHead>
                    <TableHead>提醒類型</TableHead>
                    <TableHead>通道</TableHead>
                    <TableHead>狀態</TableHead>
                    <TableHead>發送時間</TableHead>
                    <TableHead className="text-right">操作</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {reminders.map((reminder: any) => {
                    const apt = reminder.appointments;
                    const customer = apt?.customers;
                    const sc = statusConfig[reminder.status] || statusConfig.pending;
                    const StatusIcon = sc.icon;

                    return (
                      <TableRow key={reminder.id}>
                        <TableCell>
                          <div>
                            <p className="font-medium">{customer?.name || "未知客戶"}</p>
                            <p className="text-sm text-muted-foreground">
                              {apt?.appointment_date} {apt?.appointment_time}
                            </p>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline">
                            {reminderTypeLabels[reminder.reminder_type] || reminder.reminder_type}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Badge variant="secondary">{reminder.channel.toUpperCase()}</Badge>
                        </TableCell>
                        <TableCell>
                          <Badge variant={sc.variant} className="gap-1">
                            <StatusIcon className="h-3 w-3" />
                            {sc.label}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {reminder.sent_at
                            ? new Date(reminder.sent_at).toLocaleString("zh-TW")
                            : "-"}
                        </TableCell>
                        <TableCell className="text-right">
                          {reminder.status === "failed" && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleResend(reminder.appointment_id)}
                              disabled={sendManualMutation.isPending}
                            >
                              <Send className="h-3 w-3 mr-1" />
                              重發
                            </Button>
                          )}
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>

              {/* 分頁 */}
              {totalPages > 1 && (
                <div className="flex items-center justify-between mt-4">
                  <p className="text-sm text-muted-foreground">
                    第 {page} / {totalPages} 頁
                  </p>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={page <= 1}
                      onClick={() => setPage(p => p - 1)}
                    >
                      上一頁
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={page >= totalPages}
                      onClick={() => setPage(p => p + 1)}
                    >
                      下一頁
                    </Button>
                  </div>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
