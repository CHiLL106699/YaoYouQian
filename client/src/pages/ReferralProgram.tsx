import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { useTenant } from "@/contexts/TenantContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Gift } from "lucide-react";

import { Button } from "@/components/ui/button";
export default function ReferralProgram() {
  const { tenantId } = useTenant();
  const [page] = useState(1);
  const { data, isLoading, error } = trpc.referral.list.useQuery({ tenantId, page, pageSize: 20 });
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
      <h1 className="text-2xl font-bold flex items-center gap-2"><Gift className="h-6 w-6" />\u63a8\u85a6\u8a08\u756b</h1>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card><CardHeader className="pb-2"><CardTitle className="text-sm text-muted-foreground">\u7e3d\u63a8\u85a6\u6578</CardTitle></CardHeader><CardContent><p className="text-2xl font-bold">{data?.total || 0}</p></CardContent></Card>
        <Card><CardHeader className="pb-2"><CardTitle className="text-sm text-muted-foreground">\u6210\u529f\u63a8\u85a6</CardTitle></CardHeader><CardContent><p className="text-2xl font-bold">{items.filter((r: any) => r.status === "completed").length}</p></CardContent></Card>
        <Card><CardHeader className="pb-2"><CardTitle className="text-sm text-muted-foreground">\u5f85\u78ba\u8a8d</CardTitle></CardHeader><CardContent><p className="text-2xl font-bold">{items.filter((r: any) => r.status === "pending").length}</p></CardContent></Card>
      </div>
      <Card><CardContent className="p-0"><Table><TableHeader><TableRow><TableHead>\u63a8\u85a6\u4eba</TableHead><TableHead>\u88ab\u63a8\u85a6\u4eba</TableHead><TableHead>\u72c0\u614b</TableHead><TableHead>\u734e\u52f5</TableHead><TableHead>\u65e5\u671f</TableHead></TableRow></TableHeader>
        <TableBody>{isLoading ? <TableRow><TableCell colSpan={5} className="text-center py-8">\u8f09\u5165\u4e2d...</TableCell></TableRow> : items.length === 0 ? <TableRow><TableCell colSpan={5} className="text-center py-8 text-muted-foreground">\u5c1a\u7121\u63a8\u85a6\u8a18\u9304</TableCell></TableRow> : items.map((r: any) => (
          <TableRow key={r.id}><TableCell>{r.referrer_name || r.referrer_id}</TableCell><TableCell>{r.referee_name || r.referee_id}</TableCell><TableCell><Badge variant={r.status === "completed" ? "default" : "outline"}>{r.status === "completed" ? "\u5df2\u5b8c\u6210" : "\u5f85\u78ba\u8a8d"}</Badge></TableCell><TableCell>{r.reward_type || "-"}</TableCell><TableCell>{r.created_at ? new Date(r.created_at).toLocaleDateString() : "-"}</TableCell></TableRow>))}</TableBody></Table></CardContent></Card>
    </div>);
}
