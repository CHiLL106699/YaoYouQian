/**
 * 訂金管理 - 降低爽約率
 * 讓診所人員記錄客戶的訂金繳納狀況
 */

import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { trpc } from "@/lib/trpc";
import { DollarSign, Plus, Check, X, Loader2} from "lucide-react";
import { toast } from "sonner";
import { useTenant } from "@/contexts/TenantContext";

export default function DepositManagement() {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedCustomerId, setSelectedCustomerId] = useState<number | null>(null);
  const [amount, setAmount] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("cash");
  const [notes, setNotes] = useState("");

  
  const { tenantId } = useTenant();

  // 查詢客戶列表
  const { data: customersData, isLoading, error } = trpc.customer.list.useQuery({ tenantId, page: 1, pageSize: 100 });
  const customers = customersData?.customers || [];

  // 查詢訂金列表
  const { data: deposits, refetch: refetchDeposits } = trpc.deposit.list.useQuery({ tenantId });

  // 新增訂金 mutation
  const createDepositMutation = trpc.deposit.create.useMutation({
    onSuccess: () => {
      toast.success("訂金記錄已新增");
      refetchDeposits();
      resetForm();
      setIsDialogOpen(false);
    },
    onError: (error) => {
      toast.error(`新增失敗：${error.message}`);
    },
  });

  // 更新訂金狀態 mutation
  const updateDepositMutation = trpc.deposit.updateStatus.useMutation({
    onSuccess: () => {
      toast.success("訂金狀態已更新");
      refetchDeposits();
    },
    onError: (error) => {
      toast.error(`更新失敗：${error.message}`);
    },
  });

  // 重置表單
  const resetForm = () => {
    setSelectedCustomerId(null);
    setAmount("");
    setPaymentMethod("cash");
    setNotes("");
  };

  // 新增訂金
  const handleCreate = async () => {
    if (!selectedCustomerId || !amount) {
      toast.error("請填寫必填欄位");
      return;
    }

    await createDepositMutation.mutateAsync({
      tenantId,
      customerId: selectedCustomerId,
      amount: parseFloat(amount),
      paymentMethod,
      notes,
    });
  };

  // 標記為已付款
  const handleMarkPaid = (depositId: number) => {
    updateDepositMutation.mutate({
      id: depositId,
      status: "paid",
    });
  };

  // 標記為已退款
  const handleMarkRefunded = (depositId: number) => {
    if (confirm("確定要標記為已退款嗎？")) {
      updateDepositMutation.mutate({
        id: depositId,
        status: "refunded",
      });
    }
  };

  if (isLoading) {

    return (

      <div className="flex items-center justify-center min-h-[60vh]">

        <Loader2 className="h-8 w-8 animate-spin text-primary" />

        <span className="ml-2 text-muted-foreground">載入中...</span>

      </div>

    );

  }


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
    <div className="min-h-screen bg-gradient-to-br from-[#0a1929] via-[#0f2942] to-[#1e4976] p-6">
      <div className="container mx-auto max-w-6xl">
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gold mb-2">訂金管理</h1>
            <p className="text-muted-foreground">記錄與管理客戶的訂金繳納狀況</p>
          </div>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button className="bg-gold hover:bg-gold/90">
                <Plus className="w-4 h-4 mr-2" />
                新增訂金記錄
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>新增訂金記錄</DialogTitle>
                <DialogDescription>記錄客戶的訂金繳納資訊</DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                {/* 選擇客戶 */}
                <div className="space-y-2">
                  <Label>選擇客戶 *</Label>
                  <Select
                    value={selectedCustomerId?.toString() || ""}
                    onValueChange={(value) => setSelectedCustomerId(parseInt(value))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="請選擇客戶" />
                    </SelectTrigger>
                    <SelectContent>
                      {customers.map((customer: any) => (
                        <SelectItem key={customer.id} value={customer.id.toString()}>
                          {customer.name} ({customer.phone})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* 訂金金額 */}
                <div className="space-y-2">
                  <Label>訂金金額 *</Label>
                  <Input
                    type="number"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    placeholder="例如：1000"
                  />
                </div>

                {/* 付款方式 */}
                <div className="space-y-2">
                  <Label>付款方式</Label>
                  <Select value={paymentMethod} onValueChange={setPaymentMethod}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="cash">現金</SelectItem>
                      <SelectItem value="credit_card">信用卡</SelectItem>
                      <SelectItem value="line_pay">LINE Pay</SelectItem>
                      <SelectItem value="bank_transfer">銀行轉帳</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* 備註 */}
                <div className="space-y-2">
                  <Label>備註</Label>
                  <Input
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="例如：預約日期、療程項目..."
                  />
                </div>

                <Button onClick={handleCreate} className="w-full">
                  <DollarSign className="w-4 h-4 mr-2" />
                  新增訂金記錄
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        <Card className="luxury-card">
          <CardHeader>
            <CardTitle className="text-gold-solid">訂金列表</CardTitle>
            <CardDescription>所有客戶的訂金繳納記錄</CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>客戶姓名</TableHead>
                  <TableHead>聯絡電話</TableHead>
                  <TableHead>訂金金額</TableHead>
                  <TableHead>付款方式</TableHead>
                  <TableHead>狀態</TableHead>
                  <TableHead>繳納時間</TableHead>
                  <TableHead>備註</TableHead>
                  <TableHead>操作</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {deposits && deposits.length > 0 ? (
                  deposits.map((deposit: any) => (
                    <TableRow key={deposit.id}>
                      <TableCell>{deposit.customers?.name || "-"}</TableCell>
                      <TableCell>{deposit.customers?.phone || "-"}</TableCell>
                      <TableCell className="font-semibold text-gold">
                        NT$ {deposit.amount.toLocaleString()}
                      </TableCell>
                      <TableCell>
                        {deposit.payment_method === "cash" && "現金"}
                        {deposit.payment_method === "credit_card" && "信用卡"}
                        {deposit.payment_method === "line_pay" && "LINE Pay"}
                        {deposit.payment_method === "bank_transfer" && "銀行轉帳"}
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant={
                            deposit.status === "paid"
                              ? "default"
                              : deposit.status === "refunded"
                              ? "destructive"
                              : "secondary"
                          }
                        >
                          {deposit.status === "paid" && "已付款"}
                          {deposit.status === "pending" && "待付款"}
                          {deposit.status === "refunded" && "已退款"}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {deposit.paid_at
                          ? new Date(deposit.paid_at).toLocaleDateString("zh-TW")
                          : "-"}
                      </TableCell>
                      <TableCell>{deposit.notes || "-"}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          {deposit.status === "pending" && (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleMarkPaid(deposit.id)}
                            >
                              <Check className="w-4 h-4 mr-1" />
                              標記已付
                            </Button>
                          )}
                          {deposit.status === "paid" && (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleMarkRefunded(deposit.id)}
                            >
                              <X className="w-4 h-4 mr-1" />
                              退款
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                      尚無訂金記錄
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
