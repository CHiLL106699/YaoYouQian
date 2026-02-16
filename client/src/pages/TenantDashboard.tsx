/**
 * YoCHiLLSAAS - Tenant Dashboard
 * 租戶管理後台儀表板（深藍底燙金字質感介面）
 */

import { Link } from 'wouter';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { trpc } from "@/lib/trpc";
import { useTenant } from "@/contexts/TenantContext";
import { RevenueCalendar } from "@/components/RevenueCalendar";
import { 
  Calendar, 
  Users, 
  ShoppingCart, 
  TrendingUp, 
  Settings, 
  Package, 
  Heart, 
  Gift, 
  Tag, 
  CreditCard,
  BarChart3,
  Clock,
  UserPlus,
  CheckCircle,
  XCircle,
  AlertCircle,
  Syringe,
  Scale,
  ClipboardCheck,
  CalendarClock,
  Timer,
  Crown,
  LayoutTemplate,
  PieChart
} from 'lucide-react';

export default function TenantDashboard() {
  const { tenantId } = useTenant();
  
  if (!tenantId) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#0a1929] via-[#0f2942] to-[#1e4976]">
        <div className="text-gold text-xl">載入中...</div>
      </div>
    );
  }

  const { data: tenant } = trpc.tenant.getCurrent.useQuery({ tenantId });
  const { data: subscription } = trpc.subscription.getCurrent.useQuery({ tenantId });
  const { data: dashboardStats } = trpc.tenant.getDashboardStats.useQuery({ tenantId });

  // 統計卡片資料
  const stats = [
    {
      title: '今日預約',
      value: dashboardStats?.todayAppointments?.toString() || '0',
      change: `+${dashboardStats?.todayAppointmentsChange || 0}`,
      icon: Calendar,
      color: 'text-blue-400',
      bgColor: 'from-blue-500/20 to-blue-600/20',
    },
    {
      title: '總客戶數',
      value: dashboardStats?.totalCustomers?.toString() || '0',
      change: `+${dashboardStats?.newCustomersThisMonth || 0}`,
      icon: Users,
      color: 'text-purple-400',
      bgColor: 'from-purple-500/20 to-purple-600/20',
    },
    {
      title: '本月營收',
      value: `NT$ ${dashboardStats?.monthlyRevenue?.toLocaleString() || '0'}`,
      change: `${dashboardStats?.revenueGrowth || 0}%`,
      icon: TrendingUp,
      color: 'text-green-400',
      bgColor: 'from-green-500/20 to-green-600/20',
    },
    {
      title: '待處理訂單',
      value: dashboardStats?.pendingOrders?.toString() || '0',
      change: `${dashboardStats?.pendingOrdersChange || 0}`,
      icon: ShoppingCart,
      color: 'text-orange-400',
      bgColor: 'from-orange-500/20 to-orange-600/20',
    },
  ];

  // 快速連結
  const quickLinks = [
    { title: '預約管理', href: '/appointments', icon: Calendar, description: '查看與管理所有預約' },
    { title: '客戶管理', href: '/customers', icon: Users, description: '管理客戶資料與標籤' },
    { title: '商品管理', href: '/products', icon: Package, description: '管理商品庫存與價格' },
    { title: '商城訂單', href: '/shop-orders', icon: ShoppingCart, description: '處理商城訂單' },
    { title: '會員等級', href: '/member-levels', icon: Gift, description: '設定會員等級制度' },
    { title: '優惠券', href: '/coupons', icon: Tag, description: '發放與管理優惠券' },
    { title: '體重追蹤', href: '/weight-tracking', icon: Heart, description: '客戶體重管理' },
    { title: '術後照護', href: '/aftercare', icon: Heart, description: '術後追蹤記錄' },
    { title: '時段管理', href: '/slots', icon: Clock, description: '設定預約時段' },
    { title: '改期申請', href: '/reschedule', icon: AlertCircle, description: '審核改期申請' },
    { title: '推薦獎勵', href: '/referrals', icon: UserPlus, description: '推薦計畫管理' },
    { title: '白標設定', href: '/whitelabel', icon: Settings, description: '自訂品牌與主題' },
    { title: '術後追蹤管理', href: '/aftercare-management', icon: Heart, description: '完整術後追蹤記錄' },
    { title: '體重追蹤管理', href: '/weight-tracking-management', icon: Scale, description: '客戶體重變化分析' },
    { title: '劑量計算工具', href: '/dose-calculation', icon: Syringe, description: '智能劑量計算與歷史' },
    { title: '預約審核佇列', href: '/approval-queue', icon: ClipboardCheck, description: '審核待確認預約' },
    { title: '改期審核', href: '/reschedule-approval', icon: CalendarClock, description: '審核改期申請' },
    { title: '時段限制設定', href: '/slot-limits', icon: Timer, description: '設定時段容量限制' },
    { title: '會員等級管理', href: '/member-level-management', icon: Crown, description: '設定會員等級與權益' },
    { title: '時段模板管理', href: '/time-slot-template-management', icon: LayoutTemplate, description: '管理預約時段模板' },
    { title: '數據分析', href: '/analytics-dashboard', icon: PieChart, description: '營運數據分析儀表板' },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0a1929] via-[#0f2942] to-[#1e4976]">
      {/* Header */}
      <header className="border-b border-border/50 backdrop-blur-md bg-background/30 sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gold">租戶管理後台</h1>
              <p className="text-sm text-muted-foreground mt-1">
                {tenant?.name} · {subscription?.plan || '免費方案'}
              </p>
            </div>
            <div className="flex items-center gap-4">
              <Link href="/settings">
                <Button variant="outline" className="border-gold/50 text-gold hover:bg-gold/10">
                  <Settings className="w-4 h-4 mr-2" />
                  設定
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        {/* Statistics Cards */}
        <section className="mb-8">
          <h2 className="text-xl font-bold text-gold mb-4">營運統計</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {stats.map((stat, index) => (
              <Card 
                key={index} 
                className="luxury-card overflow-hidden"
              >
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between">
                    <CardDescription className="text-muted-foreground">{stat.title}</CardDescription>
                    <div className={`w-10 h-10 rounded-lg bg-gradient-to-br ${stat.bgColor} flex items-center justify-center`}>
                      <stat.icon className={`w-5 h-5 ${stat.color}`} />
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="flex items-baseline gap-2">
                    <span className="text-3xl font-bold text-foreground">{stat.value}</span>
                    <span className={`text-sm font-medium ${stat.change.startsWith('+') ? 'text-green-400' : 'text-red-400'}`}>
                      {stat.change}
                    </span>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>

        {/* Quick Links */}
        <section>
          <h2 className="text-xl font-bold text-gold mb-4">快速功能</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {quickLinks.map((link, index) => (
              <Link key={index} href={link.href}>
                <Card className="luxury-card hover:border-gold/50 transition-all duration-300 cursor-pointer group h-full">
                  <CardHeader>
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-primary to-accent flex items-center justify-center group-hover:scale-110 transition-transform">
                        <link.icon className="w-5 h-5 text-gold" />
                      </div>
                      <div>
                        <CardTitle className="text-base text-gold-solid">{link.title}</CardTitle>
                        <CardDescription className="text-xs text-muted-foreground mt-1">
                          {link.description}
                        </CardDescription>
                      </div>
                    </div>
                  </CardHeader>
                </Card>
              </Link>
            ))}
          </div>
        </section>

        {/* Revenue Calendar */}
        <section className="mt-8">
          <h2 className="text-xl font-bold text-gold mb-4">營收日曆</h2>
          <RevenueCalendar tenantId={tenantId} />
        </section>

        {/* Recent Activity Placeholder */}
        <section className="mt-8">
          <h2 className="text-xl font-bold text-gold mb-4">最近活動</h2>
          <Card className="luxury-card">
            <CardHeader>
              <CardTitle className="text-gold-solid">活動記錄</CardTitle>
              <CardDescription>系統將在此顯示最近的預約、訂單與客戶互動記錄</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-center py-8 text-muted-foreground">
                <BarChart3 className="w-8 h-8 mr-2" />
                <span>功能開發中...</span>
              </div>
            </CardContent>
          </Card>
        </section>
      </main>
    </div>
  );
}
