import { useState, useMemo } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { trpc } from "@/lib/trpc";
import { useTenant } from "@/contexts/TenantContext";
import { toast } from "sonner";

const TIME_SLOTS = ["09:00","09:30","10:00","10:30","11:00","11:30","13:00","13:30","14:00","14:30","15:00","15:30","16:00","16:30","17:00","17:30"];

export default function SlotLimitsSettings() {
  const { tenantId } = useTenant();
  const today = new Date().toISOString().split("T")[0];
  const [selectedDate, setSelectedDate] = useState(today);
  const [newTime, setNewTime] = useState("09:00");
  const [newCapacity, setNewCapacity] = useState("5");

  if (!tenantId) return <div className="container py-8 text-white">載入中...</div>;

  const { data: limits, refetch } = trpc.slotLimits.getByDate.useQuery({ tenantId, date: selectedDate });
  const items = limits || [];

  const setMutation = trpc.slotLimits.set.useMutation({
    onSuccess: () => { toast.success("時段限制已設定"); refetch(); },
    onError: (err: any) => toast.error("設定失敗: " + err.message),
  });

  const deleteMutation = trpc.slotLimits.delete.useMutation({
    onSuccess: () => { toast.success("時段限制已刪除"); refetch(); },
    onError: (err: any) => toast.error("刪除失敗: " + err.message),
  });

  const handleSet = () => {
    const cap = parseInt(newCapacity);
    if (!cap || cap < 1) { toast.error("請輸入有效的容量上限"); return; }
    setMutation.mutate({ tenantId, date: selectedDate, time: newTime, maxCapacity: cap });
  };

  const handleDelete = (time: string) => {
    if (!confirm("確定要刪除此時段限制嗎？")) return;
    deleteMutation.mutate({ tenantId, date: selectedDate, time });
  };

  const existingTimes = useMemo(() => new Set(items.map((i: any) => i.time)), [items]);

  return (
    <div className="container py-8">
      <h1 className="text-3xl font-bold text-[#D4AF37] mb-6">時段容量限制設定</h1>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
        <Card className="p-4 bg-[#0F1D32] border-[#D4AF37]/20">
          <label className="text-sm text-[#D4AF37] mb-1 block">選擇日期</label>
          <Input type="date" value={selectedDate} onChange={e => setSelectedDate(e.target.value)} className="bg-[#0A1628] border-[#D4AF37]/20 text-white" />
        </Card>
        <Card className="p-4 bg-[#0F1D32] border-[#D4AF37]/20">
          <label className="text-sm text-[#D4AF37] mb-1 block">時段</label>
          <select value={newTime} onChange={e => setNewTime(e.target.value)} className="w-full bg-[#0A1628] border border-[#D4AF37]/20 text-white rounded px-3 py-2">
            {TIME_SLOTS.map(t => (
              <option key={t} value={t} disabled={existingTimes.has(t)}>{t} {existingTimes.has(t) ? "(已設定)" : ""}</option>
            ))}
          </select>
        </Card>
        <Card className="p-4 bg-[#0F1D32] border-[#D4AF37]/20">
          <label className="text-sm text-[#D4AF37] mb-1 block">容量上限</label>
          <div className="flex gap-2">
            <Input type="number" min="1" value={newCapacity} onChange={e => setNewCapacity(e.target.value)} className="bg-[#0A1628] border-[#D4AF37]/20 text-white" />
            <Button onClick={handleSet} disabled={setMutation.isPending} className="bg-[#D4AF37] hover:bg-[#B8941F] text-[#0A1628] whitespace-nowrap">
              {setMutation.isPending ? "設定中..." : "設定"}
            </Button>
          </div>
        </Card>
      </div>

      <Card className="bg-[#0F1D32] border-[#D4AF37]/20">
        <div className="p-4 border-b border-[#D4AF37]/20">
          <h2 className="text-xl font-bold text-[#D4AF37]">{selectedDate} 的時段限制</h2>
        </div>
        <Table>
          <TableHeader>
            <TableRow className="border-[#D4AF37]/20">
              <TableHead className="text-[#D4AF37]">時段</TableHead>
              <TableHead className="text-[#D4AF37]">容量上限</TableHead>
              <TableHead className="text-[#D4AF37]">目前預約數</TableHead>
              <TableHead className="text-[#D4AF37]">狀態</TableHead>
              <TableHead className="text-[#D4AF37]">操作</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {items.length === 0 ? (
              <TableRow><TableCell colSpan={5} className="text-center text-gray-400 py-8">此日期尚未設定時段限制</TableCell></TableRow>
            ) : items.map((item: any) => (
              <TableRow key={item.id || item.time} className="border-[#D4AF37]/10 hover:bg-[#0A1628]/50">
                <TableCell className="text-white font-medium">{item.time}</TableCell>
                <TableCell className="text-white">{item.maxCapacity}</TableCell>
                <TableCell className="text-white">{item.currentCount || 0}</TableCell>
                <TableCell>
                  {item.isFull ? (
                    <Badge variant="destructive">已滿</Badge>
                  ) : (
                    <Badge variant="secondary" className="bg-green-600/20 text-green-400">可預約</Badge>
                  )}
                </TableCell>
                <TableCell>
                  <Button size="sm" variant="destructive" onClick={() => handleDelete(item.time)} disabled={deleteMutation.isPending}>
                    刪除
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Card>
    </div>
  );
}
