import { Card } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { trpc } from "@/lib/trpc";
import { useTenant } from "@/contexts/TenantContext";

import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
export default function CustomerTags() {
  const { tenantId } = useTenant();
  if (!tenantId) return <div className="container py-8">請先登入</div>;
  
  const { data, isLoading, error } = trpc.customerTag.list.useQuery({ tenantId });

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
