import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { useTenant } from "@/contexts/TenantContext";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Sparkles, Trash2 } from "lucide-react";

export default function MemberPromotions() {
  const { tenantId } = useTenant();
  const [page] = useState(1);
  const { data, isLoading, refetch, error } = trpc.memberPromo.list.useQuery({ tenantId, page, pageSize: 20 });
  const deleteMut = trpc.memberPromo.delete.useMutation({ onSuccess() { toast.success("\u5df2\u522a\u9664"); refetch(); } });
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
      <h1 className="text-2xl font-bold flex items-center gap-2"><Sparkles className="h-6 w-6" />\u6703\u54e1\u4fc3\u92b7</h1>
      <Card><CardContent className="p-0"><Table><TableHeader><TableRow><TableHead>\u540d\u7a31</TableHead><TableHead>\u985e\u578b</TableHead><TableHead>\u6298\u6263</TableHead><TableHead>\u72c0\u614b</TableHead><TableHead>\u671f\u9593</TableHead><TableHead className="text-right">\u64cd\u4f5c</TableHead></TableRow></TableHeader>
        <TableBody>{isLoading ? <TableRow><TableCell colSpan={6} className="text-center py-8">\u8f09\u5165\u4e2d...</TableCell></TableRow> : items.length === 0 ? <TableRow><TableCell colSpan={6} className="text-center py-8 text-muted-foreground">\u5c1a\u7121\u4fc3\u92b7</TableCell></TableRow> : items.map((p: any) => (
          <TableRow key={p.id}><TableCell className="font-medium">{p.name}</TableCell><TableCell>{p.type || "\u4e00\u822c"}</TableCell><TableCell>{p.discount_value ? (p.discount_type === "percentage" ? p.discount_value + "%" : "NT$ " + p.discount_value) : "-"}</TableCell><TableCell><Badge variant={p.is_active ? "default" : "secondary"}>{p.is_active ? "\u9032\u884c\u4e2d" : "\u5df2\u7d50\u675f"}</Badge></TableCell><TableCell>{p.start_date ? new Date(p.start_date).toLocaleDateString() : "-"} ~ {p.end_date ? new Date(p.end_date).toLocaleDateString() : "-"}</TableCell><TableCell className="text-right"><Button variant="ghost" size="sm" onClick={() => deleteMut.mutate({ tenantId, id: p.id })}><Trash2 className="h-4 w-4 text-destructive" /></Button></TableCell></TableRow>))}</TableBody></Table></CardContent></Card>
    </div>);
}
