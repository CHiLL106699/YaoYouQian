import { Card } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { trpc } from "@/lib/trpc";
import { useTenant } from "@/contexts/TenantContext";

export default function CustomerTags() {
  const { tenantId } = useTenant();
  if (!tenantId) return <div className="container py-8">請先登入</div>;
  
  const { data } = trpc.customerTag.list.useQuery({ tenantId });

  return (
    <div className="container py-8">
      <h1 className="text-3xl font-bold mb-6">客戶標籤管理</h1>
      <Card>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>客戶 ID</TableHead>
              <TableHead>標籤名稱</TableHead>
              <TableHead>建立日期</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {data?.items?.map((tag: any) => (
              <TableRow key={tag.id}>
                <TableCell>{tag.customer_id}</TableCell>
                <TableCell>{tag.tag_name}</TableCell>
                <TableCell>{new Date(tag.created_at).toLocaleDateString()}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Card>
    </div>
  );
}
