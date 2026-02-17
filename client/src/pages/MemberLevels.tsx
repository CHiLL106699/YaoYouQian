import { Card } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { trpc } from "@/lib/trpc";
import { useTenant } from "@/contexts/TenantContext";

import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
export default function MemberLevels() {
  const { tenantId } = useTenant();
  if (!tenantId) return <div className="container py-8">請先登入</div>;
  
  const { data, isLoading, error } = trpc.memberLevel.list.useQuery({ tenantId });

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
      <h1 className="text-3xl font-bold mb-6">會員等級管理</h1>
      <Card>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>等級名稱</TableHead>
              <TableHead>最低積分</TableHead>
              <TableHead>折扣比例</TableHead>
              <TableHead>權益</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {data?.items?.map((level: any) => (
              <TableRow key={level.id}>
                <TableCell>{level.level_name}</TableCell>
                <TableCell>{level.min_points}</TableCell>
                <TableCell>{level.discount_percentage}%</TableCell>
                <TableCell>{level.benefits || '-'}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Card>
    </div>
  );
}
