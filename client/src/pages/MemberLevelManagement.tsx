import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { trpc } from "@/lib/trpc";
import { useTenant } from "@/contexts/TenantContext";
import { toast } from "sonner";

export default function MemberLevelManagement() {
  const { tenantId } = useTenant();
  const [page, setPage] = useState(1);
  const [showDialog, setShowDialog] = useState(false);
  const [formData, setFormData] = useState({ name: "", min_spending: "", discount_rate: "", description: "" });

  if (!tenantId) return <div className="container py-8 text-white">載入中...</div>;

  const { data, refetch } = trpc.memberLevel.list.useQuery({ tenantId, page, pageSize: 10 });
  const items = data?.items || [];
  const total = data?.total || 0;

  const createMutation = trpc.memberLevel.create.useMutation({
    onSuccess: () => {
      toast.success("會員等級已建立");
      setShowDialog(false);
      setFormData({ name: "", min_spending: "", discount_rate: "", description: "" });
      refetch();
    },
    onError: (err: any) => toast.error("建立失敗: " + err.message),
  });

  const deleteMutation = trpc.memberLevel.delete.useMutation({
    onSuccess: () => { toast.success("會員等級已刪除"); refetch(); },
    onError: (err: any) => toast.error("刪除失敗: " + err.message),
  });

  const handleCreate = () => {
    if (!formData.name) { toast.error("請填寫等級名稱"); return; }
    createMutation.mutate({
      tenantId,
      data: {
        name: formData.name,
        min_spending: formData.min_spending ? parseFloat(formData.min_spending) : 0,
        discount_rate: formData.discount_rate ? parseFloat(formData.discount_rate) : 100,
        description: formData.description || null,
      },
    });
  };

  const totalPages = Math.ceil(total / 10);

  return (
    <div className="container py-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-[#D4AF37]">會員等級管理</h1>
        <Button onClick={() => setShowDialog(true)} className="bg-[#D4AF37] hover:bg-[#B8941F] text-[#0A1628]">新增等級</Button>
      </div>

      <Card className="bg-[#0F1D32] border-[#D4AF37]/20">
        <Table>
          <TableHeader>
            <TableRow className="border-[#D4AF37]/20">
              <TableHead className="text-[#D4AF37]">ID</TableHead>
              <TableHead className="text-[#D4AF37]">等級名稱</TableHead>
              <TableHead className="text-[#D4AF37]">最低消費</TableHead>
              <TableHead className="text-[#D4AF37]">折扣率</TableHead>
              <TableHead className="text-[#D4AF37]">說明</TableHead>
              <TableHead className="text-[#D4AF37]">操作</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {items.length === 0 ? (
              <TableRow><TableCell colSpan={6} className="text-center text-gray-400 py-8">暫無會員等級</TableCell></TableRow>
            ) : items.map((item: any) => (
              <TableRow key={item.id} className="border-[#D4AF37]/10 hover:bg-[#0A1628]/50">
                <TableCell className="text-white">{item.id}</TableCell>
                <TableCell className="text-white font-medium">{item.name}</TableCell>
                <TableCell className="text-white">${item.min_spending || 0}</TableCell>
                <TableCell><Badge variant="secondary">{item.discount_rate || 100}%</Badge></TableCell>
                <TableCell className="text-white max-w-[200px] truncate">{item.description || "-"}</TableCell>
                <TableCell>
                  <Button size="sm" variant="destructive" onClick={() => {
                    if (confirm("確定要刪除此等級嗎？")) deleteMutation.mutate({ id: item.id, tenantId });
                  }}>刪除</Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Card>

      {totalPages > 1 && (
        <div className="flex justify-center gap-2 mt-4">
          <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage(p => p - 1)} className="text-[#D4AF37] border-[#D4AF37]/30">上一頁</Button>
          <span className="text-white py-2 px-3">{page} / {totalPages}</span>
          <Button variant="outline" size="sm" disabled={page >= totalPages} onClick={() => setPage(p => p + 1)} className="text-[#D4AF37] border-[#D4AF37]/30">下一頁</Button>
        </div>
      )}

      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent className="bg-[#0F1D32] border-[#D4AF37]/20 text-white">
          <DialogHeader><DialogTitle className="text-[#D4AF37]">新增會員等級</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="text-sm text-[#D4AF37] mb-1 block">等級名稱 *</label>
              <Input value={formData.name} onChange={e => setFormData(p => ({ ...p, name: e.target.value }))} className="bg-[#0A1628] border-[#D4AF37]/20 text-white" placeholder="如：銀卡會員" />
            </div>
            <div>
              <label className="text-sm text-[#D4AF37] mb-1 block">最低消費金額</label>
              <Input type="number" value={formData.min_spending} onChange={e => setFormData(p => ({ ...p, min_spending: e.target.value }))} className="bg-[#0A1628] border-[#D4AF37]/20 text-white" placeholder="0" />
            </div>
            <div>
              <label className="text-sm text-[#D4AF37] mb-1 block">折扣率 (%)</label>
              <Input type="number" min="0" max="100" value={formData.discount_rate} onChange={e => setFormData(p => ({ ...p, discount_rate: e.target.value }))} className="bg-[#0A1628] border-[#D4AF37]/20 text-white" placeholder="100" />
            </div>
            <div>
              <label className="text-sm text-[#D4AF37] mb-1 block">說明</label>
              <Textarea value={formData.description} onChange={e => setFormData(p => ({ ...p, description: e.target.value }))} className="bg-[#0A1628] border-[#D4AF37]/20 text-white" placeholder="等級說明" />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDialog(false)} className="text-white border-[#D4AF37]/30">取消</Button>
            <Button onClick={handleCreate} disabled={createMutation.isPending} className="bg-[#D4AF37] hover:bg-[#B8941F] text-[#0A1628]">
              {createMutation.isPending ? "建立中..." : "建立"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
