import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { useTenant } from "@/contexts/TenantContext";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { AlertTriangle, Trash2 } from "lucide-react";

export default function ErrorLogs() {
  const { tenantId } = useTenant();
  const [page] = useState(1);
  const { data, isLoading, refetch, error } = trpc.errorLog.list.useQuery({ tenantId, page, pageSize: 20 });
  const deleteMut = trpc.errorLog.delete.useMutation({ onSuccess() { toast.success("\u5df2\u522a\u9664"); refetch(); } });
  const items: any[] = data?.items || [];
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
      <h1 className="text-2xl font-bold flex items-center gap-2"><AlertTriangle className="h-6 w-6" />\u932f\u8aa4\u65e5\u8a8c</h1>
      <Card><CardContent className="p-0"><Table><TableHeader><TableRow><TableHead>\u6642\u9593</TableHead><TableHead>\u7b49\u7d1a</TableHead><TableHead>\u8a0a\u606f</TableHead><TableHead className="text-right">\u64cd\u4f5c</TableHead></TableRow></TableHeader>
        <TableBody>{isLoading ? <TableRow><TableCell colSpan={4} className="text-center py-8">\u8f09\u5165\u4e2d...</TableCell></TableRow> : items.length === 0 ? <TableRow><TableCell colSpan={4} className="text-center py-8 text-muted-foreground">\u7121\u932f\u8aa4\u65e5\u8a8c</TableCell></TableRow> : items.map((log: any) => (
          <TableRow key={log.id}><TableCell className="text-sm">{log.created_at ? new Date(log.created_at).toLocaleString() : "-"}</TableCell><TableCell><Badge variant={log.level === "error" ? "destructive" : log.level === "warning" ? "secondary" : "outline"}>{log.level || "info"}</Badge></TableCell><TableCell className="max-w-md truncate">{log.message || "-"}</TableCell><TableCell className="text-right"><Button variant="ghost" size="sm" onClick={() => deleteMut.mutate({ tenantId, id: log.id })}><Trash2 className="h-4 w-4 text-destructive" /></Button></TableCell></TableRow>))}</TableBody></Table></CardContent></Card>
    </div>);
}
