import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { trpc } from "@/lib/trpc";
import { useTenant } from "@/contexts/TenantContext";

import { Loader2 } from "lucide-react";
export default function SubscriptionManagement() {
  const { tenantId } = useTenant();
  if (!tenantId) return <div>Loading...</div>;
  const { data: subscription, isLoading, error } = trpc.subscription.getCurrent.useQuery({ tenantId });
  const { data: paymentsData } = trpc.subscription.getPayments.useQuery({ tenantId });
  const payments = paymentsData?.payments || [];

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
    <div className="container py-8">
      <h1 className="text-3xl font-bold mb-6">訂閱管理</h1>
      <Card className="p-6 mb-6">
        <h2 className="text-xl font-semibold mb-4">當前計劃</h2>
        <p>方案：{subscription?.plan}</p>
        <p>狀態：{subscription?.status}</p>
        <Button className="mt-4">升級方案</Button>
      </Card>
      <Card>
        <h2 className="text-xl font-semibold p-6">付款紀錄</h2>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>日期</TableHead>
              <TableHead>金額</TableHead>
              <TableHead>狀態</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {payments.map((payment: any) => (
              <TableRow key={payment.id}>
                <TableCell>{payment.created_at}</TableCell>
                <TableCell>{payment.amount}</TableCell>
                <TableCell>{payment.status}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Card>
    </div>
  );
}
