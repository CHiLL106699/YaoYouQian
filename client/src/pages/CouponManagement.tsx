import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { useTenant } from "@/contexts/TenantContext";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Ticket, Plus, Trash2 } from "lucide-react";

export default function CouponManagement() {
  const { tenantId } = useTenant();
  const [page, setPage] = useState(1);
  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState({ code: "", name: "", discount_type: "percentage", discount_value: "", expires_at: "" });
  const { data, isLoading, refetch, error } = trpc.coupon.list.useQuery({ tenantId, page, pageSize: 20 });
  const createMut = trpc.coupon.create.useMutation({ onSuccess() { toast.success("\u512a\u60e0\u5238\u5df2\u65b0\u589e"); setShowCreate(false); refetch(); } });
  const deleteMut = trpc.coupon.delete.useMutation({ onSuccess() { toast.success("\u5df2\u522a\u9664"); refetch(); } });
  const items: any[] = data?.items || [];
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
        <h1 className="text-2xl font-bold flex items-center gap-2"><Ticket className="h-6 w-6" />\u512a\u60e0\u5238\u7ba1\u7406</h1>
        <Dialog open={showCreate} onOpenChange={setShowCreate}><DialogTrigger asChild><Button><Plus className="h-4 w-4 mr-2" />\u65b0\u589e\u512a\u60e0\u5238</Button></DialogTrigger>
          <DialogContent><DialogHeader><DialogTitle>\u65b0\u589e\u512a\u60e0\u5238</DialogTitle></DialogHeader>
            <div className="space-y-3">
              <div><Label>\u512a\u60e0\u78bc</Label><Input value={form.code} onChange={e => setForm({...form, code: e.target.value})} placeholder="\u4f8b\uff1aWELCOME10" /></div>
              <div><Label>\u540d\u7a31</Label><Input value={form.name} onChange={e => setForm({...form, name: e.target.value})} /></div>
              <div className="grid grid-cols-2 gap-3">
                <div><Label>\u6298\u6263\u985e\u578b</Label><Select value={form.discount_type} onValueChange={v => setForm({...form, discount_type: v})}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="percentage">\u767e\u5206\u6bd4</SelectItem><SelectItem value="fixed">\u56fa\u5b9a\u91d1\u984d</SelectItem></SelectContent></Select></div>
                <div><Label>\u6298\u6263\u503c</Label><Input type="number" value={form.discount_value} onChange={e => setForm({...form, discount_value: e.target.value})} /></div>
              </div>
              <div><Label>\u5230\u671f\u65e5</Label><Input type="date" value={form.expires_at} onChange={e => setForm({...form, expires_at: e.target.value})} /></div>
            </div>
            <DialogFooter><Button onClick={() => createMut.mutate({ tenantId, data: { code: form.code, name: form.name, discount_type: form.discount_type, discount_value: parseFloat(form.discount_value) || 0, expires_at: form.expires_at || null } })} disabled={createMut.isPending}>{createMut.isPending ? "\u65b0\u589e\u4e2d..." : "\u78ba\u8a8d"}</Button></DialogFooter>
          </DialogContent></Dialog>
      </div>
      <Card><CardContent className="p-0"><Table><TableHeader><TableRow><TableHead>\u512a\u60e0\u78bc</TableHead><TableHead>\u540d\u7a31</TableHead><TableHead>\u6298\u6263</TableHead><TableHead>\u4f7f\u7528\u6b21\u6578</TableHead><TableHead>\u5230\u671f\u65e5</TableHead><TableHead className="text-right">\u64cd\u4f5c</TableHead></TableRow></TableHeader>
        <TableBody>{isLoading ? <TableRow><TableCell colSpan={6} className="text-center py-8">\u8f09\u5165\u4e2d...</TableCell></TableRow> : items.length === 0 ? <TableRow><TableCell colSpan={6} className="text-center py-8 text-muted-foreground">\u5c1a\u7121\u512a\u60e0\u5238</TableCell></TableRow> : items.map((c: any) => (
          <TableRow key={c.id}><TableCell className="font-mono font-medium">{c.code}</TableCell><TableCell>{c.name}</TableCell><TableCell>{c.discount_type === "percentage" ? c.discount_value + "%" : "NT$ " + c.discount_value}</TableCell><TableCell>{c.used_count || 0} / {c.max_uses || "\u221e"}</TableCell><TableCell>{c.expires_at ? new Date(c.expires_at).toLocaleDateString() : "\u7121\u671f\u9650"}</TableCell><TableCell className="text-right"><Button variant="ghost" size="sm" onClick={() => deleteMut.mutate({ tenantId, id: c.id })}><Trash2 className="h-4 w-4 text-destructive" /></Button></TableCell></TableRow>))}</TableBody></Table></CardContent></Card>
    </div>);
}
