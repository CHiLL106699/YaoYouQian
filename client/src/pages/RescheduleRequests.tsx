import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { trpc } from "@/lib/trpc";
import { useTenant } from "@/contexts/TenantContext";
import { toast } from "sonner";

import { Loader2 } from "lucide-react";
export default function RescheduleRequests() {
  const { tenantId } = useTenant();
  if (!tenantId) return <div>Loading...</div>;
  const { data: requests, refetch, isLoading, error } = trpc.reschedule.list.useQuery({ tenantId });
  const approve = trpc.reschedule.approve.useMutation({
    onSuccess: () => {
      toast.success("改期申請已核准");
      refetch();
    }
  });

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
      <h1 className="text-3xl font-bold mb-6">改期申請管理</h1>
      <Card>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>客戶</TableHead>
              <TableHead>原日期</TableHead>
              <TableHead>新日期</TableHead>
              <TableHead>原因</TableHead>
              <TableHead>操作</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {requests?.requests?.map((req: any) => (
              <TableRow key={req.id}>
                <TableCell>{req.customer_name}</TableCell>
                <TableCell>{req.old_date}</TableCell>
                <TableCell>{req.new_date}</TableCell>
                <TableCell>{req.reason}</TableCell>
                <TableCell>
                  <Button size="sm" onClick={() => approve.mutate({ requestId: req.id, tenantId })}>核准</Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Card>
    </div>
  );
}
