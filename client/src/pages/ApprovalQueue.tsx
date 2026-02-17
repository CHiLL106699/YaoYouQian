import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { trpc } from "@/lib/trpc";
import { useTenant } from "@/contexts/TenantContext";
import { toast } from "sonner";

export default function ApprovalQueue() {
  const { tenantId } = useTenant();
  const [rejectDialogOpen, setRejectDialogOpen] = useState(false);
  const [selectedApprovalId, setSelectedApprovalId] = useState<number | null>(null);
  const [rejectReason, setRejectReason] = useState("");

  if (!tenantId) return <div className="container py-8 text-white">載入中...</div>;

  const { data: pendingList, refetch, error } = trpc.approval.listPending.useQuery({ tenantId });
  const items = pendingList || [];

  const approveMutation = trpc.approval.approve.useMutation({
    onSuccess: () => { toast.success("已審核通過"); refetch(); },
    onError: (err: any) => toast.error(`審核失敗: ${err.message}`),
  });

  const rejectMutation = trpc.approval.reject.useMutation({
    onSuccess: () => {
      toast.success("已拒絕");
      setRejectDialogOpen(false);
      setRejectReason("");
      refetch();
    },
    onError: (err: any) => toast.error(`拒絕失敗: ${err.message}`),
  });

  const handleApprove = (approvalId: number) => {
    if (!confirm("確定要審核通過此預約嗎？")) return;
    approveMutation.mutate({ tenantId, approvalId, reviewedBy: 1 });
  };

  const handleRejectClick = (approvalId: number) => {
    setSelectedApprovalId(approvalId);
    setRejectDialogOpen(true);
  };

  const handleRejectConfirm = () => {
    if (!selectedApprovalId || !rejectReason.trim()) {
      toast.error("請填寫拒絕原因");
      return;
    }
    rejectMutation.mutate({ tenantId, approvalId: selectedApprovalId, reviewedBy: 1, reason: rejectReason });
  };

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
    <div className="container py-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-[#D4AF37]">預約審核佇列</h1>
        <Badge variant="secondary" className="text-lg px-4 py-1">待審核：{items.length} 件</Badge>
      </div>

      <Card className="bg-[#0F1D32] border-[#D4AF37]/20">
        <Table>
          <TableHeader>
            <TableRow className="border-[#D4AF37]/20">
              <TableHead className="text-[#D4AF37]">ID</TableHead>
              <TableHead className="text-[#D4AF37]">預約 ID</TableHead>
              <TableHead className="text-[#D4AF37]">申請類型</TableHead>
              <TableHead className="text-[#D4AF37]">狀態</TableHead>
              <TableHead className="text-[#D4AF37]">建立時間</TableHead>
              <TableHead className="text-[#D4AF37]">操作</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {items.length === 0 ? (
              <TableRow><TableCell colSpan={6} className="text-center text-gray-400 py-8">目前沒有待審核的預約</TableCell></TableRow>
            ) : items.map((item: any) => (
              <TableRow key={item.id} className="border-[#D4AF37]/10 hover:bg-[#0A1628]/50">
                <TableCell className="text-white">{item.id}</TableCell>
                <TableCell className="text-white">{item.appointmentId}</TableCell>
                <TableCell className="text-white">{item.type || "預約審核"}</TableCell>
                <TableCell>
                  <Badge variant="secondary" className="bg-yellow-600/20 text-yellow-400">待審核</Badge>
                </TableCell>
                <TableCell className="text-white">{item.createdAt ? new Date(item.createdAt).toLocaleString() : "-"}</TableCell>
                <TableCell>
                  <div className="flex gap-2">
                    <Button size="sm" onClick={() => handleApprove(item.id)} disabled={approveMutation.isPending} className="bg-green-600 hover:bg-green-700 text-white">
                      通過
                    </Button>
                    <Button size="sm" variant="destructive" onClick={() => handleRejectClick(item.id)}>
                      拒絕
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Card>

      <Dialog open={rejectDialogOpen} onOpenChange={setRejectDialogOpen}>
        <DialogContent className="bg-[#0F1D32] border-[#D4AF37]/20 text-white">
          <DialogHeader><DialogTitle className="text-[#D4AF37]">拒絕預約</DialogTitle></DialogHeader>
          <div>
            <label className="text-sm text-[#D4AF37] mb-1 block">拒絕原因 *</label>
            <Textarea value={rejectReason} onChange={e => setRejectReason(e.target.value)} className="bg-[#0A1628] border-[#D4AF37]/20 text-white" placeholder="請說明拒絕原因" />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setRejectDialogOpen(false)} className="text-white border-[#D4AF37]/30">取消</Button>
            <Button variant="destructive" onClick={handleRejectConfirm} disabled={rejectMutation.isPending}>
              {rejectMutation.isPending ? "處理中..." : "確認拒絕"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
