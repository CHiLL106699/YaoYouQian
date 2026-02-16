import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { trpc } from "@/lib/trpc";
import { useTenant } from "@/contexts/TenantContext";

export default function SubscriptionManagement() {
  const { tenantId } = useTenant();
  if (!tenantId) return <div>Loading...</div>;
  const { data: subscription } = trpc.subscription.getCurrent.useQuery({ tenantId });
  const { data: paymentsData } = trpc.subscription.getPayments.useQuery({ tenantId });
  const payments = paymentsData?.payments || [];

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
