import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { trpc } from "@/lib/trpc";
import { useTenant } from "@/contexts/TenantContext";
import { toast } from "sonner";

export default function DoseCalculation() {
  const { tenantId } = useTenant();
  const [customerId, setCustomerId] = useState("");
  const [weight, setWeight] = useState("");
  const [productType, setProductType] = useState("");
  const [dosagePerKg, setDosagePerKg] = useState("0.1");
  const [notes, setNotes] = useState("");
  const [result, setResult] = useState<{ dosage: number; unit: string; weight: number; productType: string } | null>(null);

  if (!tenantId) return <div className="container py-8 text-white">載入中...</div>;

  const { data: historyData, refetch: refetchHistory } = trpc.doseCalculation.getHistory.useQuery(
    { tenantId, customerId: parseInt(customerId) || 0 },
    { enabled: !!customerId && parseInt(customerId) > 0 }
  );
  const history = historyData || [];

  const calculateMutation = trpc.doseCalculation.calculate.useMutation({
    onSuccess: (data: any) => {
      setResult(data);
      toast.success(`計算完成：建議劑量 ${data.dosage} ${data.unit}`);
    },
    onError: (err: any) => toast.error(`計算失敗: ${err.message}`),
  });

  const saveMutation = trpc.doseCalculation.save.useMutation({
    onSuccess: () => {
      toast.success("計算記錄已儲存");
      refetchHistory();
    },
    onError: (err: any) => toast.error(`儲存失敗: ${err.message}`),
  });

  const handleCalculate = () => {
    if (!customerId || !weight || !productType) {
      toast.error("請填寫客戶 ID、體重與產品類型");
      return;
    }
    calculateMutation.mutate({
      tenantId,
      customerId: parseInt(customerId),
      weight: parseFloat(weight),
      productType,
      dosagePerKg: parseFloat(dosagePerKg) || undefined,
    });
  };

  const handleSave = () => {
    if (!result) return;
    saveMutation.mutate({
      tenantId,
      customerId: parseInt(customerId),
      weight: parseFloat(weight),
      productType,
      dosage: result.dosage,
      notes: notes || undefined,
    });
  };

  return (
    <div className="container py-8">
      <h1 className="text-3xl font-bold text-[#D4AF37] mb-6">劑量計算工具</h1>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* 輸入參數 */}
        <Card className="p-6 bg-[#0F1D32] border-[#D4AF37]/20">
          <h2 className="text-xl font-bold text-[#D4AF37] mb-4">輸入參數</h2>
          <div className="space-y-4">
            <div>
              <label className="text-sm text-[#D4AF37] mb-1 block">客戶 ID *</label>
              <Input type="number" value={customerId} onChange={e => setCustomerId(e.target.value)} className="bg-[#0A1628] border-[#D4AF37]/20 text-white" placeholder="請輸入客戶 ID" />
            </div>
            <div>
              <label className="text-sm text-[#D4AF37] mb-1 block">體重 (kg) *</label>
              <Input type="number" step="0.1" value={weight} onChange={e => setWeight(e.target.value)} className="bg-[#0A1628] border-[#D4AF37]/20 text-white" placeholder="請輸入體重" />
            </div>
            <div>
              <label className="text-sm text-[#D4AF37] mb-1 block">產品類型 *</label>
              <Input value={productType} onChange={e => setProductType(e.target.value)} className="bg-[#0A1628] border-[#D4AF37]/20 text-white" placeholder="如：玻尿酸、肉毒桿菌" />
            </div>
            <div>
              <label className="text-sm text-[#D4AF37] mb-1 block">每公斤劑量 (ml/kg)</label>
              <Input type="number" step="0.01" value={dosagePerKg} onChange={e => setDosagePerKg(e.target.value)} className="bg-[#0A1628] border-[#D4AF37]/20 text-white" placeholder="預設 0.1" />
            </div>
            <Button onClick={handleCalculate} disabled={calculateMutation.isPending} className="w-full bg-[#D4AF37] hover:bg-[#B8941F] text-[#0A1628]">
              {calculateMutation.isPending ? "計算中..." : "計算劑量"}
            </Button>
          </div>
        </Card>

        {/* 計算結果 */}
        <Card className="p-6 bg-[#0F1D32] border-[#D4AF37]/20">
          <h2 className="text-xl font-bold text-[#D4AF37] mb-4">計算結果</h2>
          {result ? (
            <div className="space-y-4">
              <div className="p-4 bg-[#0A1628] border border-[#D4AF37]/20 rounded">
                <p className="text-sm text-[#D4AF37]">建議劑量</p>
                <p className="text-3xl font-bold text-white">{result.dosage.toFixed(2)} {result.unit}</p>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="p-3 bg-[#0A1628] border border-[#D4AF37]/20 rounded">
                  <p className="text-xs text-[#D4AF37]">體重</p>
                  <p className="text-lg text-white">{result.weight} kg</p>
                </div>
                <div className="p-3 bg-[#0A1628] border border-[#D4AF37]/20 rounded">
                  <p className="text-xs text-[#D4AF37]">產品類型</p>
                  <p className="text-lg text-white">{result.productType}</p>
                </div>
              </div>
              <div>
                <label className="text-sm text-[#D4AF37] mb-1 block">備註（選填）</label>
                <Textarea value={notes} onChange={e => setNotes(e.target.value)} className="bg-[#0A1628] border-[#D4AF37]/20 text-white" placeholder="計算備註" />
              </div>
              <Button onClick={handleSave} disabled={saveMutation.isPending} className="w-full bg-green-600 hover:bg-green-700 text-white">
                {saveMutation.isPending ? "儲存中..." : "儲存計算記錄"}
              </Button>
            </div>
          ) : (
            <div className="flex items-center justify-center h-48 text-gray-400">
              請輸入參數並點擊「計算劑量」
            </div>
          )}
        </Card>
      </div>

      {/* 計算歷史 */}
      {customerId && parseInt(customerId) > 0 && (
        <Card className="mt-6 bg-[#0F1D32] border-[#D4AF37]/20">
          <div className="p-4 border-b border-[#D4AF37]/20">
            <h2 className="text-xl font-bold text-[#D4AF37]">計算歷史（客戶 #{customerId}）</h2>
          </div>
          <Table>
            <TableHeader>
              <TableRow className="border-[#D4AF37]/20">
                <TableHead className="text-[#D4AF37]">日期</TableHead>
                <TableHead className="text-[#D4AF37]">產品類型</TableHead>
                <TableHead className="text-[#D4AF37]">體重</TableHead>
                <TableHead className="text-[#D4AF37]">劑量</TableHead>
                <TableHead className="text-[#D4AF37]">備註</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {history.length === 0 ? (
                <TableRow><TableCell colSpan={5} className="text-center text-gray-400 py-6">暫無計算歷史</TableCell></TableRow>
              ) : history.map((item: any) => (
                <TableRow key={item.id} className="border-[#D4AF37]/10">
                  <TableCell className="text-white">{new Date(item.createdAt).toLocaleDateString()}</TableCell>
                  <TableCell className="text-white">{item.productType}</TableCell>
                  <TableCell className="text-white">{item.weight} kg</TableCell>
                  <TableCell className="text-white">{item.dosage} ml</TableCell>
                  <TableCell className="text-white max-w-[150px] truncate">{item.notes || "-"}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Card>
      )}
    </div>
  );
}
