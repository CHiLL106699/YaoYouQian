import { Card } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { trpc } from "@/lib/trpc";
import { useTenant } from "@/contexts/TenantContext";

export default function TimeSlotTemplates() {
  const { tenantId } = useTenant();
  if (!tenantId) return <div className="container py-8">請先登入</div>;
  
  const { data } = trpc.timeSlotTemplate.list.useQuery({ tenantId });

  return (
    <div className="container py-8">
      <h1 className="text-3xl font-bold mb-6">時段模板管理</h1>
      <Card>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>模板名稱</TableHead>
              <TableHead>時段數量</TableHead>
              <TableHead>建立日期</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {data?.items?.map((template: any) => (
              <TableRow key={template.id}>
                <TableCell>{template.template_name || '未命名'}</TableCell>
                <TableCell>{template.slot_count || 0}</TableCell>
                <TableCell>{new Date(template.created_at).toLocaleDateString()}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Card>
    </div>
  );
}
