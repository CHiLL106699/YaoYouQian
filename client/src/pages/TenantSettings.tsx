import { useState, useEffect } from "react";
import { trpc } from "@/lib/trpc";
import { useTenant } from "@/contexts/TenantContext";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Settings, Save } from "lucide-react";

export default function TenantSettings() {
  const { tenantId } = useTenant();
  const { data: tenant, isLoading, error } = trpc.tenant.getCurrent.useQuery({ tenantId });
  const updateMut = trpc.tenant.update.useMutation({ onSuccess() { toast.success("\u8a2d\u5b9a\u5df2\u66f4\u65b0"); } });
  const [form, setForm] = useState({ name: "", ownerName: "", ownerEmail: "", ownerPhone: "" });
  useEffect(() => {
    if (tenant) setForm({ name: tenant.name || "", ownerName: tenant.owner_name || "", ownerEmail: tenant.owner_email || "", ownerPhone: tenant.owner_phone || "" });
  }, [tenant]);
  if (isLoading) return <div className="flex items-center justify-center h-64"><p>\u8f09\u5165\u4e2d...</p></div>;
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
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold flex items-center gap-2"><Settings className="h-6 w-6" />\u8a3a\u6240\u8a2d\u5b9a</h1>
        <Button onClick={() => updateMut.mutate({ tenantId, name: form.name, ownerName: form.ownerName, ownerEmail: form.ownerEmail, ownerPhone: form.ownerPhone })} disabled={updateMut.isPending}><Save className="h-4 w-4 mr-2" />{updateMut.isPending ? "\u5132\u5b58\u4e2d..." : "\u5132\u5b58"}</Button>
      </div>
      <div className="grid gap-6 md:grid-cols-2">
        <Card><CardHeader><CardTitle>\u57fa\u672c\u8cc7\u8a0a</CardTitle></CardHeader><CardContent className="space-y-4">
          <div><Label>\u8a3a\u6240\u540d\u7a31</Label><Input value={form.name} onChange={e => setForm({...form, name: e.target.value})} /></div>
          <div><Label>\u8ca0\u8cac\u4eba</Label><Input value={form.ownerName} onChange={e => setForm({...form, ownerName: e.target.value})} /></div>
          <div><Label>Email</Label><Input value={form.ownerEmail} onChange={e => setForm({...form, ownerEmail: e.target.value})} /></div>
          <div><Label>\u96fb\u8a71</Label><Input value={form.ownerPhone} onChange={e => setForm({...form, ownerPhone: e.target.value})} /></div>
        </CardContent></Card>
        <Card><CardHeader><CardTitle>LINE \u6574\u5408</CardTitle></CardHeader><CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground">LINE Bot \u8a2d\u5b9a\u8acb\u806f\u7e6b\u7cfb\u7d71\u7ba1\u7406\u54e1\u3002</p>
          <div><Label>Channel ID</Label><Input disabled placeholder="\u7531\u7ba1\u7406\u54e1\u8a2d\u5b9a" /></div>
          <div><Label>Bot Basic ID</Label><Input disabled placeholder="\u7531\u7ba1\u7406\u54e1\u8a2d\u5b9a" /></div>
        </CardContent></Card>
      </div>
    </div>);
}
