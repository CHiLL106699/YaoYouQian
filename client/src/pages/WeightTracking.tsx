import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { trpc } from "@/lib/trpc";
import { useTenant } from "@/contexts/TenantContext";
import { toast } from "sonner";
import { useState } from "react";

export default function WeightTracking() {
  const { tenantId } = useTenant();
  const [isOpen, setIsOpen] = useState(false);
  const [weight, setWeight] = useState("");
  const [unit, setUnit] = useState("kg");
  const [notes, setNotes] = useState("");

  if (!tenantId) return <div className="container py-8">請先登入</div>;

  const { data: weightData, refetch } = trpc.weightTracking.list.useQuery({ tenantId });
  
  const createRecord = trpc.weightTracking.create.useMutation({
    onSuccess: () => {
      toast.success("體重記錄已新增");
      setIsOpen(false);
      setWeight("");
      setNotes("");
      refetch();
    },
    onError: (error) => {
      toast.error(`新增失敗: ${error.message}`);
    }
  });

  const handleSubmit = () => {
    if (!weight) {
      toast.error("請輸入體重");
      return;
    }
    createRecord.mutate({
      tenantId,
      data: {
        weight: parseFloat(weight),
        unit,
        notes,
        recorded_at: new Date().toISOString()
      }
    });
  };

  return (
    <div className="container py-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">體重管理</h1>
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
          <DialogTrigger asChild>
            <Button>新增記錄</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>新增體重記錄</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label>體重</Label>
                <div className="flex gap-2">
                  <Input
                    type="number"
                    step="0.1"
                    value={weight}
                    onChange={(e) => setWeight(e.target.value)}
                    placeholder="輸入體重"
                  />
                  <select
                    value={unit}
                    onChange={(e) => setUnit(e.target.value)}
                    className="border rounded px-3"
                  >
                    <option value="kg">kg</option>
                    <option value="lb">lb</option>
                  </select>
                </div>
              </div>
              <div>
                <Label>備註</Label>
                <Input
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="選填"
                />
              </div>
              <Button onClick={handleSubmit} className="w-full">
                儲存
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>日期</TableHead>
              <TableHead>體重</TableHead>
              <TableHead>單位</TableHead>
              <TableHead>備註</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {weightData?.items?.map((record: any) => (
              <TableRow key={record.id}>
                <TableCell>{new Date(record.recorded_at).toLocaleDateString()}</TableCell>
                <TableCell>{record.weight}</TableCell>
                <TableCell>{record.unit}</TableCell>
                <TableCell>{record.notes || '-'}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Card>
    </div>
  );
}
