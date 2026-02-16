import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { useTenant } from "@/contexts/TenantContext";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Plus, Pencil, Trash2, Package } from "lucide-react";

export default function ProductManagement() {
  const { tenantId } = useTenant();
  const [page, setPage] = useState(1);
  const [showCreate, setShowCreate] = useState(false);
  const [editItem, setEditItem] = useState<any>(null);
  const [form, setForm] = useState({ name: "", description: "", price: "", stock: "", category: "general" });

  const { data, isLoading, refetch } = trpc.shop.list.useQuery({ tenantId, page, pageSize: 20 });
  const createMut = trpc.shop.create.useMutation({ onSuccess() { toast.success("商品已新增"); setShowCreate(false); resetForm(); refetch(); } });
  const updateMut = trpc.shop.update.useMutation({ onSuccess() { toast.success("商品已更新"); setEditItem(null); refetch(); } });
  const deleteMut = trpc.shop.delete.useMutation({ onSuccess() { toast.success("商品已刪除"); refetch(); } });

  const items: any[] = data?.items || [];
  const resetForm = () => setForm({ name: "", description: "", price: "", stock: "", category: "general" });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold flex items-center gap-2"><Package className="h-6 w-6" />商品管理</h1>
        <Dialog open={showCreate} onOpenChange={(o) => { setShowCreate(o); if (!o) resetForm(); }}>
          <DialogTrigger asChild><Button><Plus className="h-4 w-4 mr-2" />新增商品</Button></DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>新增商品</DialogTitle></DialogHeader>
            <div className="space-y-3">
              <div><Label>名稱</Label><Input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} /></div>
              <div><Label>描述</Label><Textarea value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} /></div>
              <div className="grid grid-cols-2 gap-3">
                <div><Label>價格</Label><Input type="number" value={form.price} onChange={e => setForm({ ...form, price: e.target.value })} /></div>
                <div><Label>庫存</Label><Input type="number" value={form.stock} onChange={e => setForm({ ...form, stock: e.target.value })} /></div>
              </div>
            </div>
            <DialogFooter>
              <Button onClick={() => createMut.mutate({ tenantId, data: { name: form.name, description: form.description, price: parseFloat(form.price) || 0, stock: parseInt(form.stock) || 0, category: form.category } })} disabled={createMut.isPending}>
                {createMut.isPending ? "新增中..." : "確認"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
      <Card><CardContent className="p-0">
        <Table>
          <TableHeader><TableRow><TableHead>名稱</TableHead><TableHead>價格</TableHead><TableHead>庫存</TableHead><TableHead>分類</TableHead><TableHead className="text-right">操作</TableHead></TableRow></TableHeader>
          <TableBody>
            {isLoading ? <TableRow><TableCell colSpan={5} className="text-center py-8">載入中...</TableCell></TableRow>
            : items.length === 0 ? <TableRow><TableCell colSpan={5} className="text-center py-8 text-muted-foreground">尚無商品</TableCell></TableRow>
            : items.map((item: any) => (
              <TableRow key={item.id}>
                <TableCell className="font-medium">{item.name}</TableCell>
                <TableCell>NT$ {(item.price || 0).toLocaleString()}</TableCell>
                <TableCell>{item.stock}</TableCell>
                <TableCell><Badge variant="outline">{item.category || "一般"}</Badge></TableCell>
                <TableCell className="text-right space-x-1">
                  <Button variant="ghost" size="sm" onClick={() => { setEditItem(item); setForm({ name: item.name || "", description: item.description || "", price: String(item.price || ""), stock: String(item.stock || ""), category: item.category || "general" }); }}><Pencil className="h-4 w-4" /></Button>
                  <Button variant="ghost" size="sm" onClick={() => deleteMut.mutate({ tenantId, id: item.id })}><Trash2 className="h-4 w-4 text-destructive" /></Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent></Card>
      <Dialog open={!!editItem} onOpenChange={o => { if (!o) setEditItem(null); }}>
        <DialogContent>
          <DialogHeader><DialogTitle>編輯商品</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div><Label>名稱</Label><Input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} /></div>
            <div><Label>描述</Label><Textarea value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} /></div>
            <div className="grid grid-cols-2 gap-3">
              <div><Label>價格</Label><Input type="number" value={form.price} onChange={e => setForm({ ...form, price: e.target.value })} /></div>
              <div><Label>庫存</Label><Input type="number" value={form.stock} onChange={e => setForm({ ...form, stock: e.target.value })} /></div>
            </div>
          </div>
          <DialogFooter>
            <Button onClick={() => editItem && updateMut.mutate({ tenantId, id: editItem.id, data: { name: form.name, description: form.description, price: parseFloat(form.price) || 0, stock: parseInt(form.stock) || 0, category: form.category } })} disabled={updateMut.isPending}>
              {updateMut.isPending ? "更新中..." : "確認"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
