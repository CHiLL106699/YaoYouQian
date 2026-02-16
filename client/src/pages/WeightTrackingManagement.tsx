import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { trpc } from "@/lib/trpc";
import { useTenant } from "@/contexts/TenantContext";
import { useState } from "react";
import { toast } from "sonner";

export default function WeightTrackingManagement() {
  const { tenantId } = useTenant();
  const [selectedCustomerId, setSelectedCustomerId] = useState<number | null>(null);

  if (!tenantId) return <div className="container py-8">Loading...</div>;

  const { data: recordsData, refetch } = trpc.weightTracking.list.useQuery({ tenantId });
  const records = recordsData?.items || [];

  const createMutation = trpc.weightTracking.create.useMutation({
    onSuccess: () => {
      toast.success("體重記錄已建立");
      refetch();
    },
    onError: (error) => {
      toast.error(`建立失敗: ${error.message}`);
    },
  });

  const deleteMutation = trpc.weightTracking.delete.useMutation({
    onSuccess: () => {
      toast.success("體重記錄已刪除");
      refetch();
    },
    onError: (error) => {
      toast.error(`刪除失敗: ${error.message}`);
    },
  });

  return (
    <div className="container py-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-[#D4AF37]">體重追蹤管理</h1>
        <Button
          onClick={() => {
            const customerId = prompt("請輸入客戶 ID:");
            const weight = prompt("請輸入體重 (kg):");
            if (customerId && weight) {
              createMutation.mutate({
                tenantId,
                data: {
                  customer_id: parseInt(customerId),
                  record_date: new Date().toISOString(),
                  weight: parseFloat(weight),
                },
              });
            }
          }}
          className="bg-[#D4AF37] hover:bg-[#B8941F] text-[#0A1628]"
        >
          新增體重記錄
        </Button>
      </div>

      <Card className="bg-[#0A1628] border-[#D4AF37]/20">
        <Table>
          <TableHeader>
            <TableRow className="border-[#D4AF37]/20 hover:bg-[#0A1628]/50">
              <TableHead className="text-[#D4AF37]">客戶 ID</TableHead>
              <TableHead className="text-[#D4AF37]">記錄日期</TableHead>
              <TableHead className="text-[#D4AF37]">體重 (kg)</TableHead>
              <TableHead className="text-[#D4AF37]">體脂率 (%)</TableHead>
              <TableHead className="text-[#D4AF37]">腰圍 (cm)</TableHead>
              <TableHead className="text-[#D4AF37]">操作</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {records.map((record: any) => (
              <TableRow key={record.id} className="border-[#D4AF37]/20 hover:bg-[#0A1628]/80">
                <TableCell className="text-white">{record.customer_id}</TableCell>
                <TableCell className="text-white">
                  {new Date(record.record_date).toLocaleDateString()}
                </TableCell>
                <TableCell className="text-white">{record.weight || "-"}</TableCell>
                <TableCell className="text-white">{record.body_fat || "-"}</TableCell>
                <TableCell className="text-white">{record.waist_circumference || "-"}</TableCell>
                <TableCell>
                  <Button
                    size="sm"
                    variant="destructive"
                    onClick={() => {
                      if (confirm("確定要刪除此記錄嗎？")) {
                        deleteMutation.mutate({ id: record.id, tenantId });
                      }
                    }}
                  >
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
