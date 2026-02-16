import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { trpc } from "@/lib/trpc";
import { useTenant } from "@/contexts/TenantContext";
import { toast } from "sonner";

const WEEKDAYS = ["日","一","二","三","四","五","六"];

export default function TimeSlotTemplateManagement() {
  const { tenantId } = useTenant();
  const [page, setPage] = useState(1);
  const [showDialog, setShowDialog] = useState(false);
  const [formData, setFormData] = useState({ name: "", day_of_week: "1", start_time: "09:00", end_time: "18:00", interval_minutes: "30", max_capacity: "5" });

  if (!tenantId) return <div className="container py-8 text-white">載入中...</div>;

  const { data, refetch } = trpc.timeSlotTemplate.list.useQuery({ tenantId, page, pageSize: 10 });
  const items = data?.items || [];
  const total = data?.total || 0;

  const createMutation = trpc.timeSlotTemplate.create.useMutation({
    onSuccess: () => {
      toast.success("時段模板已建立");
      setShowDialog(false);
      setFormData({ name: "", day_of_week: "1", start_time: "09:00", end_time: "18:00", interval_minutes: "30", max_capacity: "5" });
      refetch();
    },
    onError: (err: any) => toast.error("建立失敗: " + err.message),
  });

  const deleteMutation = trpc.timeSlotTemplate.delete.useMutation({
    onSuccess: () => { toast.success("時段模板已刪除"); refetch(); },
    onError: (err: any) => toast.error("刪除失敗: " + err.message),
  });

  const handleCreate = () => {
    if (!formData.name) { toast.error("請填寫模板名稱"); return; }
    createMutation.mutate({
      tenantId,
      data: {
        name: formData.name,
        day_of_week: parseInt(formData.day_of_week),
        start_time: formData.start_time,
        end_time: formData.end_time,
        interval_minutes: parseInt(formData.interval_minutes),
        max_capacity: parseInt(formData.max_capacity),
      },
    });
  };

  const totalPages = Math.ceil(total / 10);

  return (
    <div className="container py-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-[#D4AF37]">時段模板管理</h1>
        <Button onClick={() => setShowDialog(true)} className="bg-[#D4AF37] hover:bg-[#B8941F] text-[#0A1628]">新增模板</Button>
      </div>

      <Card className="bg-[#0F1D32] border-[#D4AF37]/20">
        <Table>
          <TableHeader>
            <TableRow className="border-[#D4AF37]/20">
              <TableHead className="text-[#D4AF37]">模板名稱</TableHead>
              <TableHead className="text-[#D4AF37]">星期</TableHead>
              <TableHead className="text-[#D4AF37]">開始時間</TableHead>
              <TableHead className="text-[#D4AF37]">結束時間</TableHead>
              <TableHead className="text-[#D4AF37]">間隔(分)</TableHead>
              <TableHead className="text-[#D4AF37]">容量</TableHead>
              <TableHead className="text-[#D4AF37]">操作</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {items.length === 0 ? (
              <TableRow><TableCell colSpan={7} className="text-center text-gray-400 py-8">暫無時段模板</TableCell></TableRow>
            ) : items.map((item: any) => (
              <TableRow key={item.id} className="border-[#D4AF37]/10 hover:bg-[#0A1628]/50">
                <TableCell className="text-white font-medium">{item.name}</TableCell>
                <TableCell><Badge variant="secondary">週{WEEKDAYS[item.day_of_week] || item.day_of_week}</Badge></TableCell>
                <TableCell className="text-white">{item.start_time}</TableCell>
                <TableCell className="text-white">{item.end_time}</TableCell>
                <TableCell className="text-white">{item.interval_minutes} 分</TableCell>
                <TableCell className="text-white">{item.max_capacity}</TableCell>
                <TableCell>
                  <Button size="sm" variant="destructive" onClick={() => {
                    if (confirm("確定要刪除此模板嗎？")) deleteMutation.mutate({ id: item.id, tenantId });
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
          <DialogHeader><DialogTitle className="text-[#D4AF37]">新增時段模板</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="text-sm text-[#D4AF37] mb-1 block">模板名稱 *</label>
              <Input value={formData.name} onChange={e => setFormData(p => ({ ...p, name: e.target.value }))} className="bg-[#0A1628] border-[#D4AF37]/20 text-white" placeholder="如：平日上午時段" />
            </div>
            <div>
              <label className="text-sm text-[#D4AF37] mb-1 block">星期</label>
              <select value={formData.day_of_week} onChange={e => setFormData(p => ({ ...p, day_of_week: e.target.value }))} className="w-full bg-[#0A1628] border border-[#D4AF37]/20 text-white rounded px-3 py-2">
                {WEEKDAYS.map((d, i) => <option key={i} value={i}>週{d}</option>)}
              </select>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm text-[#D4AF37] mb-1 block">開始時間</label>
                <Input type="time" value={formData.start_time} onChange={e => setFormData(p => ({ ...p, start_time: e.target.value }))} className="bg-[#0A1628] border-[#D4AF37]/20 text-white" />
              </div>
              <div>
                <label className="text-sm text-[#D4AF37] mb-1 block">結束時間</label>
                <Input type="time" value={formData.end_time} onChange={e => setFormData(p => ({ ...p, end_time: e.target.value }))} className="bg-[#0A1628] border-[#D4AF37]/20 text-white" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm text-[#D4AF37] mb-1 block">間隔 (分鐘)</label>
                <Input type="number" min="5" value={formData.interval_minutes} onChange={e => setFormData(p => ({ ...p, interval_minutes: e.target.value }))} className="bg-[#0A1628] border-[#D4AF37]/20 text-white" />
              </div>
              <div>
                <label className="text-sm text-[#D4AF37] mb-1 block">每時段容量</label>
                <Input type="number" min="1" value={formData.max_capacity} onChange={e => setFormData(p => ({ ...p, max_capacity: e.target.value }))} className="bg-[#0A1628] border-[#D4AF37]/20 text-white" />
              </div>
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
