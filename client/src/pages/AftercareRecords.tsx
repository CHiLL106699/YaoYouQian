import { Card } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { trpc } from "@/lib/trpc";
import { useTenant } from "@/contexts/TenantContext";

export default function AftercareRecords() {
  const { tenantId } = useTenant();
  if (!tenantId) return <div className="container py-8">請先登入</div>;
  
  const { data } = trpc.aftercare.list.useQuery({ tenantId });

  return (
    <div className="container py-8">
      <h1 className="text-3xl font-bold mb-6">術後照護記錄</h1>
      <Card>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>客戶</TableHead>
              <TableHead>照護日期</TableHead>
              <TableHead>照護類型</TableHead>
              <TableHead>需追蹤</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {data?.items?.map((record: any) => (
              <TableRow key={record.id}>
                <TableCell>{record.customer_id}</TableCell>
                <TableCell>{new Date(record.care_date).toLocaleDateString()}</TableCell>
                <TableCell>{record.care_type}</TableCell>
                <TableCell>{record.follow_up_required ? '是' : '否'}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Card>
    </div>
  );
}
