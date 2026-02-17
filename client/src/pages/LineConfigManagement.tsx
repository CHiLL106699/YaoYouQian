import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { useTenant } from "@/contexts/TenantContext";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";

export default function LineConfigManagement() {
  const { tenantId } = useTenant();
  const [form, setForm] = useState({
    channelId: "", channelSecret: "", channelAccessToken: "",
    botBasicId: "", liffId: "", bookingUrl: "",
  });

  const { data: config, refetch, error } = trpc.lineConfig.get.useQuery(
    { tenantId: tenantId || 0 },
    { enabled: (tenantId || 0) > 0 }
  );

  const { data: webhookInfo } = trpc.lineConfig.getWebhookUrl.useQuery(
    { tenantId: tenantId || 0 },
    { enabled: (tenantId || 0) > 0 }
  );

  const upsertMutation = trpc.lineConfig.upsert.useMutation({
    onSuccess: () => { toast.success("LINE 設定已更新"); refetch(); },
    onError: (e: any) => toast.error(e.message),
  });

  const testMutation = trpc.lineConfig.testConnection.useMutation({
    onSuccess: (result) => {
      if (result.success) toast.success(`連線成功！Bot: ${result.botName}`);
      else toast.error(`連線失敗：${result.error}`);
    },
    onError: (e: any) => toast.error(e.message),
  });

  function handleSave() {
    const updates: any = { tenantId: tenantId || 0 };
    if (form.channelId) updates.channelId = form.channelId;
    if (form.channelSecret) updates.channelSecret = form.channelSecret;
    if (form.channelAccessToken) updates.channelAccessToken = form.channelAccessToken;
    if (form.botBasicId) updates.botBasicId = form.botBasicId;
    if (form.liffId) updates.liffId = form.liffId;
    if (form.bookingUrl) updates.bookingUrl = form.bookingUrl;
    upsertMutation.mutate(updates);
  }

  const webhookUrl = webhookInfo?.webhookUrl
    ? `${window.location.origin}${webhookInfo.webhookUrl}`
    : "";

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
      <div>
        <h1 className="text-2xl font-bold">LINE Bot 設定</h1>
        <p className="text-muted-foreground">設定您的 LINE Official Account 連線資訊</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Webhook URL</CardTitle>
          <CardDescription>請在 LINE Developers Console 設定以下 Webhook URL</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex gap-2">
            <Input value={webhookUrl} readOnly className="font-mono text-sm" />
            <Button variant="outline" onClick={() => { navigator.clipboard.writeText(webhookUrl); toast.success("已複製"); }}>
              複製
            </Button>
          </div>
          <p className="text-xs text-muted-foreground mt-2">
            前往 LINE Developers Console → Messaging API → Webhook URL，貼上此網址並啟用 Webhook
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>目前設定</CardTitle>
          <CardDescription>
            {config ? "已設定 LINE Channel（敏感資訊已脫敏顯示）" : "尚未設定，將使用系統預設的 LINE Channel"}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {config ? (
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div><span className="text-muted-foreground">Channel ID：</span>{config.channel_id || "未設定"}</div>
              <div><span className="text-muted-foreground">Channel Secret：</span>{config.channel_secret || "未設定"}</div>
              <div><span className="text-muted-foreground">Access Token：</span>{config.channel_access_token || "未設定"}</div>
              <div><span className="text-muted-foreground">Bot Basic ID：</span>{config.bot_basic_id || "未設定"}</div>
              <div><span className="text-muted-foreground">LIFF ID：</span>{config.liff_id || "未設定"}</div>
              <div><span className="text-muted-foreground">預約 URL：</span>{config.booking_url || "預設（flos-public-schedule）"}</div>
            </div>
          ) : (
            <p className="text-muted-foreground">使用系統預設 LINE Channel（SAASGOCHILL）</p>
          )}
          <Button variant="outline" className="mt-4" onClick={() => testMutation.mutate({ tenantId: tenantId || 0 })}
            disabled={testMutation.isPending}>
            {testMutation.isPending ? "測試中..." : "測試 LINE Bot 連線"}
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>更新 LINE Channel 設定</CardTitle>
          <CardDescription>填入您的 LINE Official Account 憑證（留空的欄位不會更新）</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div><Label>Channel ID</Label><Input value={form.channelId} onChange={(e) => setForm({ ...form, channelId: e.target.value })} placeholder="留空不更新" /></div>
            <div><Label>Channel Secret</Label><Input type="password" value={form.channelSecret} onChange={(e) => setForm({ ...form, channelSecret: e.target.value })} placeholder="留空不更新" /></div>
            <div><Label>Channel Access Token</Label><Input type="password" value={form.channelAccessToken} onChange={(e) => setForm({ ...form, channelAccessToken: e.target.value })} placeholder="留空不更新" /></div>
            <div><Label>Bot Basic ID</Label><Input value={form.botBasicId} onChange={(e) => setForm({ ...form, botBasicId: e.target.value })} placeholder="例：@693ywkdq" /></div>
            <div><Label>LIFF ID</Label><Input value={form.liffId} onChange={(e) => setForm({ ...form, liffId: e.target.value })} placeholder="留空不更新" /></div>
            <div><Label>預約頁面 URL</Label><Input value={form.bookingUrl} onChange={(e) => setForm({ ...form, bookingUrl: e.target.value })} placeholder="預設：flos-public-schedule.netlify.app" /></div>
          </div>
          <Button onClick={handleSave} disabled={upsertMutation.isPending}>
            {upsertMutation.isPending ? "儲存中..." : "儲存設定"}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
