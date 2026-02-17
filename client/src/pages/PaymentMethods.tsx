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
import { CreditCard, Plus, Trash2 } from "lucide-react";

export default function PaymentMethods() {
  const { tenantId } = useTenant();
  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState({ name: "", type: "cash" });
  const { data, isLoading, refetch, error } = trpc.paymentMethod.list.useQuery({ tenantId, page: 1, pageSize: 50 });
  const createMut = trpc.paymentMethod.create.useMutation({ onSuccess() { toast.success("\u4ed8\u6b3e\u65b9\u5f0f\u5df2\u65b0\u589e"); setShowCreate(false); refetch(); } });
  const deleteMut = trpc.paymentMethod.delete.useMutation({ onSuccess() { toast.success("\u5df2\u522a\u9664"); refetch(); } });
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
        <h1 className="text-2xl font-bold flex items-center gap-2"><CreditCard className="h-6 w-6" />\u4ed8\u6b3e\u65b9\u5f0f</h1>
        <Dialog open={showCreate} onOpenChange={setShowCreate}><DialogTrigger asChild><Button><Plus className="h-4 w-4 mr-2" />\u65b0\u589e</Button></DialogTrigger>
          <DialogContent><DialogHeader><DialogTitle>\u65b0\u589e\u4ed8\u6b3e\u65b9\u5f0f</DialogTitle></DialogHeader>
            <div className="space-y-3">
              <div><Label>\u540d\u7a31</Label><Input value={form.name} onChange={e => setForm({...form, name: e.target.value})} /></div>
              <div><Label>\u985e\u578b</Label><Select value={form.type} onValueChange={v => setForm({...form, type: v})}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="cash">\u73fe\u91d1</SelectItem><SelectItem value="credit_card">\u4fe1\u7528\u5361</SelectItem><SelectItem value="line_pay">LINE Pay</SelectItem><SelectItem value="transfer">\u8f49\u5e33</SelectItem></SelectContent></Select></div>
            </div>
            <DialogFooter><Button onClick={() => createMut.mutate({ tenantId, data: { name: form.name, type: form.type, is_active: true } })} disabled={createMut.isPending}>{createMut.isPending ? "\u65b0\u589e\u4e2d..." : "\u78ba\u8a8d"}</Button></DialogFooter>
          </DialogContent></Dialog>
      </div>
      <Card><CardContent className="p-0"><Table><TableHeader><TableRow><TableHead>\u540d\u7a31</TableHead><TableHead>\u985e\u578b</TableHead><TableHead>\u72c0\u614b</TableHead><TableHead className="text-right">\u64cd\u4f5c</TableHead></TableRow></TableHeader>
        <TableBody>{isLoading ? <TableRow><TableCell colSpan={4} className="text-center py-8">\u8f09\u5165\u4e2d...</TableCell></TableRow> : items.length === 0 ? <TableRow><TableCell colSpan={4} className="text-center py-8 text-muted-foreground">\u5c1a\u7121\u4ed8\u6b3e\u65b9\u5f0f</TableCell></TableRow> : items.map((m: any) => (
          <TableRow key={m.id}><TableCell className="font-medium">{m.name}</TableCell><TableCell>{m.type}</TableCell><TableCell><Badge variant={m.is_active ? "default" : "secondary"}>{m.is_active ? "\u555f\u7528" : "\u505c\u7528"}</Badge></TableCell><TableCell className="text-right"><Button variant="ghost" size="sm" onClick={() => deleteMut.mutate({ tenantId, id: m.id })}><Trash2 className="h-4 w-4 text-destructive" /></Button></TableCell></TableRow>))}</TableBody></Table></CardContent></Card>
    </div>);
}
