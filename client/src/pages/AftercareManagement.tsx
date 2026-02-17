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
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Heart, Plus, Trash2 } from "lucide-react";

export default function AftercareManagement() {
  const { tenantId } = useTenant();
  const [page, setPage] = useState(1);
  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState({ treatment_name: "", instructions: "", follow_up_date: "" });
  const { data, isLoading, refetch, error } = trpc.aftercare.list.useQuery({ tenantId, page, pageSize: 20 });
  const createMut = trpc.aftercare.create.useMutation({ onSuccess() { toast.success("\u8a18\u9304\u5df2\u65b0\u589e"); setShowCreate(false); refetch(); } });
  const deleteMut = trpc.aftercare.delete.useMutation({ onSuccess() { toast.success("\u8a18\u9304\u5df2\u522a\u9664"); refetch(); } });
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
        <h1 className="text-2xl font-bold flex items-center gap-2"><Heart className="h-6 w-6" />\u8853\u5f8c\u8b77\u7406\u7ba1\u7406</h1>
        <Dialog open={showCreate} onOpenChange={setShowCreate}><DialogTrigger asChild><Button><Plus className="h-4 w-4 mr-2" />\u65b0\u589e\u8a18\u9304</Button></DialogTrigger>
          <DialogContent><DialogHeader><DialogTitle>\u65b0\u589e\u8853\u5f8c\u8b77\u7406\u8a18\u9304</DialogTitle></DialogHeader>
            <div className="space-y-3">
              <div><Label>\u7642\u7a0b\u540d\u7a31</Label><Input value={form.treatment_name} onChange={e => setForm({...form, treatment_name: e.target.value})} /></div>
              <div><Label>\u8b77\u7406\u8aaa\u660e</Label><Textarea value={form.instructions} onChange={e => setForm({...form, instructions: e.target.value})} /></div>
              <div><Label>\u56de\u8a3a\u65e5\u671f</Label><Input type="date" value={form.follow_up_date} onChange={e => setForm({...form, follow_up_date: e.target.value})} /></div>
            </div>
            <DialogFooter><Button onClick={() => createMut.mutate({ tenantId, data: { treatment_name: form.treatment_name, instructions: form.instructions, follow_up_date: form.follow_up_date || null } })} disabled={createMut.isPending}>{createMut.isPending ? "\u65b0\u589e\u4e2d..." : "\u78ba\u8a8d"}</Button></DialogFooter>
          </DialogContent></Dialog>
      </div>
      <Card><CardContent className="p-0"><Table><TableHeader><TableRow><TableHead>\u7642\u7a0b</TableHead><TableHead>\u72c0\u614b</TableHead><TableHead>\u56de\u8a3a\u65e5\u671f</TableHead><TableHead className="text-right">\u64cd\u4f5c</TableHead></TableRow></TableHeader>
        <TableBody>{isLoading ? <TableRow><TableCell colSpan={4} className="text-center py-8">\u8f09\u5165\u4e2d...</TableCell></TableRow> : items.length === 0 ? <TableRow><TableCell colSpan={4} className="text-center py-8 text-muted-foreground">\u5c1a\u7121\u8a18\u9304</TableCell></TableRow> : items.map((r: any) => (
          <TableRow key={r.id}><TableCell className="font-medium">{r.treatment_name || "\u672a\u547d\u540d"}</TableCell><TableCell><Badge variant={r.status === "completed" ? "default" : "outline"}>{r.status === "completed" ? "\u5df2\u5b8c\u6210" : "\u5f85\u8ffd\u8e64"}</Badge></TableCell><TableCell>{r.follow_up_date ? new Date(r.follow_up_date).toLocaleDateString() : "-"}</TableCell><TableCell className="text-right"><Button variant="ghost" size="sm" onClick={() => deleteMut.mutate({ tenantId, id: r.id })}><Trash2 className="h-4 w-4 text-destructive" /></Button></TableCell></TableRow>))}</TableBody></Table></CardContent></Card>
    </div>);
}
