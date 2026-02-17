import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { useTenant } from "@/contexts/TenantContext";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ShoppingBag } from "lucide-react";

const statusMap: Record<string, string> = { pending: "\u5f85\u8655\u7406", paid: "\u5df2\u4ed8\u6b3e", shipped: "\u5df2\u51fa\u8ca8", completed: "\u5df2\u5b8c\u6210", cancelled: "\u5df2\u53d6\u6d88" };

export default function ShopOrders() {
  const { tenantId } = useTenant();
  const [statusFilter, setStatusFilter] = useState("all");
  const { data, isLoading, refetch, error } = trpc.orders.list.useQuery({ tenantId });
  const updateMut = trpc.orders.updateStatus.useMutation({ onSuccess() { toast.success("\u72c0\u614b\u5df2\u66f4\u65b0"); refetch(); } });
  const allItems: any[] = Array.isArray(data) ? data : [];
  const items = statusFilter === "all" ? allItems : allItems.filter((o: any) => o.status === statusFilter);
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
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold flex items-center gap-2"><ShoppingBag className="h-6 w-6" />\u8a02\u55ae\u7ba1\u7406</h1>
        <Select value={statusFilter} onValueChange={setStatusFilter}><SelectTrigger className="w-[150px]"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="all">\u5168\u90e8</SelectItem><SelectItem value="pending">\u5f85\u8655\u7406</SelectItem><SelectItem value="paid">\u5df2\u4ed8\u6b3e</SelectItem><SelectItem value="shipped">\u5df2\u51fa\u8ca8</SelectItem><SelectItem value="completed">\u5df2\u5b8c\u6210</SelectItem><SelectItem value="cancelled">\u5df2\u53d6\u6d88</SelectItem></SelectContent></Select>
      </div>
      <Card><CardContent className="p-0"><Table><TableHeader><TableRow><TableHead>\u8a02\u55ae\u7de8\u865f</TableHead><TableHead>\u5ba2\u6236</TableHead><TableHead>\u91d1\u984d</TableHead><TableHead>\u72c0\u614b</TableHead><TableHead>\u65e5\u671f</TableHead><TableHead className="text-right">\u64cd\u4f5c</TableHead></TableRow></TableHeader>
        <TableBody>{isLoading ? <TableRow><TableCell colSpan={6} className="text-center py-8">\u8f09\u5165\u4e2d...</TableCell></TableRow> : items.length === 0 ? <TableRow><TableCell colSpan={6} className="text-center py-8 text-muted-foreground">\u5c1a\u7121\u8a02\u55ae</TableCell></TableRow> : items.map((o: any) => (
          <TableRow key={o.id}><TableCell className="font-mono text-sm">#{o.id}</TableCell><TableCell>{o.customers?.name || "-"}</TableCell><TableCell>NT$ {(o.total_amount || 0).toLocaleString()}</TableCell>
            <TableCell><Badge variant={o.status === "completed" || o.status === "paid" ? "default" : o.status === "cancelled" ? "destructive" : "outline"}>{statusMap[o.status] || o.status}</Badge></TableCell>
            <TableCell>{o.created_at ? new Date(o.created_at).toLocaleDateString() : "-"}</TableCell>
            <TableCell className="text-right">{o.status === "pending" && <Button size="sm" variant="outline" onClick={() => updateMut.mutate({ tenantId, orderId: o.id, status: "paid" })}>\u78ba\u8a8d\u4ed8\u6b3e</Button>}{o.status === "paid" && <Button size="sm" variant="outline" onClick={() => updateMut.mutate({ tenantId, orderId: o.id, status: "shipped" })}>\u51fa\u8ca8</Button>}</TableCell></TableRow>))}</TableBody></Table></CardContent></Card>
    </div>);
}
