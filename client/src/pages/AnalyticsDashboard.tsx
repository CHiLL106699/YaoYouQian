import { trpc } from "@/lib/trpc";
import { useTenant } from "@/contexts/TenantContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { BarChart3, TrendingUp, Users, DollarSign } from "lucide-react";

export default function AnalyticsDashboard() {
  const { tenantId } = useTenant();
  const { data: revenueData, isLoading } = trpc.analytics.revenueStats.useQuery({ tenantId });
  const { data: regData } = trpc.analytics.registrationTrend.useQuery({ tenantId });
  const revArr: any[] = Array.isArray(revenueData) ? revenueData : [];
  const regArr: any[] = Array.isArray(regData) ? regData : [];
  const totalRevenue = revArr.reduce((s: number, d: any) => s + (d.totalRevenue || 0), 0);
  const totalOrders = revArr.reduce((s: number, d: any) => s + (d.orderCount || 0), 0);
  const totalReg = regArr.reduce((s: number, d: any) => s + (d.count || 0), 0);
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold flex items-center gap-2"><BarChart3 className="h-6 w-6" />\u6578\u64da\u5206\u6790</h1>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card><CardHeader className="pb-2"><CardTitle className="text-sm text-muted-foreground flex items-center gap-1"><DollarSign className="h-4 w-4" />\u7e3d\u71df\u6536</CardTitle></CardHeader><CardContent><p className="text-2xl font-bold">NT$ {totalRevenue.toLocaleString()}</p></CardContent></Card>
        <Card><CardHeader className="pb-2"><CardTitle className="text-sm text-muted-foreground flex items-center gap-1"><TrendingUp className="h-4 w-4" />\u7e3d\u8a02\u55ae</CardTitle></CardHeader><CardContent><p className="text-2xl font-bold">{totalOrders}</p></CardContent></Card>
        <Card><CardHeader className="pb-2"><CardTitle className="text-sm text-muted-foreground flex items-center gap-1"><Users className="h-4 w-4" />\u65b0\u5ba2\u6236</CardTitle></CardHeader><CardContent><p className="text-2xl font-bold">{totalReg}</p></CardContent></Card>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card><CardHeader><CardTitle>\u71df\u6536\u8da8\u52e2</CardTitle></CardHeader><CardContent>{isLoading ? <p className="text-center py-8 text-muted-foreground">\u8f09\u5165\u4e2d...</p> : revArr.length === 0 ? <p className="text-center py-8 text-muted-foreground">\u5c1a\u7121\u6578\u64da</p> : <div className="space-y-2">{revArr.slice(-7).map((d: any, i: number) => (<div key={i} className="flex items-center justify-between text-sm"><span className="text-muted-foreground">{d.date}</span><span className="font-medium">NT$ {(d.totalRevenue || 0).toLocaleString()}</span></div>))}</div>}</CardContent></Card>
        <Card><CardHeader><CardTitle>\u5ba2\u6236\u8a3b\u518a\u8da8\u52e2</CardTitle></CardHeader><CardContent>{regArr.length === 0 ? <p className="text-center py-8 text-muted-foreground">\u5c1a\u7121\u6578\u64da</p> : <div className="space-y-2">{regArr.slice(-7).map((d: any, i: number) => (<div key={i} className="flex items-center justify-between text-sm"><span className="text-muted-foreground">{d.date}</span><Badge variant="outline">{d.count} \u4eba</Badge></div>))}</div>}</CardContent></Card>
      </div>
    </div>);
}
