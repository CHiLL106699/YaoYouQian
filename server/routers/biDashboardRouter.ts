import { z } from "zod";
import { router, protectedProcedure } from "../_core/trpc";
import { TRPCError } from "@trpc/server";
import { supabase } from "../supabaseClient";

export const biDashboardRouter = router({
  /**
   * 營收概覽：依時間範圍彙總營收數據
   */
  getRevenueOverview: protectedProcedure
    .input(z.object({
      tenantId: z.number(),
      period: z.enum(["day", "week", "month", "year"]).default("month"),
      startDate: z.string().optional(),
      endDate: z.string().optional(),
    }))
    .query(async ({ input }) => {
      const now = new Date();
      let start: Date;
      let prevStart: Date;
      const end = input.endDate ? new Date(input.endDate) : now;

      switch (input.period) {
        case "day":
          start = input.startDate ? new Date(input.startDate) : new Date(now.getFullYear(), now.getMonth(), now.getDate() - 30);
          prevStart = new Date(start.getTime() - (end.getTime() - start.getTime()));
          break;
        case "week":
          start = input.startDate ? new Date(input.startDate) : new Date(now.getFullYear(), now.getMonth(), now.getDate() - 84);
          prevStart = new Date(start.getTime() - (end.getTime() - start.getTime()));
          break;
        case "month":
          start = input.startDate ? new Date(input.startDate) : new Date(now.getFullYear() - 1, now.getMonth(), 1);
          prevStart = new Date(start.getTime() - (end.getTime() - start.getTime()));
          break;
        case "year":
          start = input.startDate ? new Date(input.startDate) : new Date(now.getFullYear() - 3, 0, 1);
          prevStart = new Date(start.getTime() - (end.getTime() - start.getTime()));
          break;
      }

      // 當期營收
      const { data: currentOrders, error: currentError } = await supabase
        .from("orders")
        .select("created_at, total_amount, status")
        .eq("tenant_id", input.tenantId)
        .gte("created_at", start.toISOString())
        .lte("created_at", end.toISOString());

      if (currentError) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: currentError.message });

      // 前期營收（用於比較）
      const { data: prevOrders } = await supabase
        .from("orders")
        .select("created_at, total_amount, status")
        .eq("tenant_id", input.tenantId)
        .gte("created_at", prevStart.toISOString())
        .lt("created_at", start.toISOString());

      const currentTotal = (currentOrders || []).reduce((sum, o: any) => sum + Number(o.total_amount || 0), 0);
      const prevTotal = (prevOrders || []).reduce((sum, o: any) => sum + Number(o.total_amount || 0), 0);
      const growthRate = prevTotal > 0 ? ((currentTotal - prevTotal) / prevTotal * 100) : 0;

      // 按日期分組
      const grouped: Record<string, { revenue: number; orderCount: number }> = {};
      (currentOrders || []).forEach((row: any) => {
        let key: string;
        const d = new Date(row.created_at);
        switch (input.period) {
          case "day":
            key = row.created_at?.split("T")[0] || "unknown";
            break;
          case "week": {
            const weekStart = new Date(d);
            weekStart.setDate(d.getDate() - d.getDay());
            key = weekStart.toISOString().split("T")[0];
            break;
          }
          case "month":
            key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
            break;
          case "year":
            key = `${d.getFullYear()}`;
            break;
        }
        if (!grouped[key]) grouped[key] = { revenue: 0, orderCount: 0 };
        grouped[key].revenue += Number(row.total_amount || 0);
        grouped[key].orderCount += 1;
      });

      const trend = Object.entries(grouped)
        .map(([date, stats]) => ({ date, ...stats }))
        .sort((a, b) => a.date.localeCompare(b.date));

      return {
        totalRevenue: currentTotal,
        previousRevenue: prevTotal,
        growthRate: Math.round(growthRate * 100) / 100,
        orderCount: (currentOrders || []).length,
        averageOrderValue: (currentOrders || []).length > 0 ? Math.round(currentTotal / (currentOrders || []).length) : 0,
        trend,
      };
    }),

  /**
   * 療程分析：各療程營收佔比與轉換率
   */
  getServiceAnalytics: protectedProcedure
    .input(z.object({
      tenantId: z.number(),
      startDate: z.string().optional(),
      endDate: z.string().optional(),
    }))
    .query(async ({ input }) => {
      const { data: appointments, error } = await supabase
        .from("appointments")
        .select("service_id, status, created_at")
        .eq("tenant_id", input.tenantId);

      if (error) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: error.message });

      const { data: services } = await supabase
        .from("services")
        .select("id, name, price")
        .eq("tenant_id", input.tenantId);

      const serviceMap = new Map((services || []).map((s: any) => [s.id, s]));
      const stats: Record<number, { name: string; count: number; revenue: number; completed: number }> = {};

      (appointments || []).forEach((apt: any) => {
        const sid = apt.service_id;
        if (!sid) return;
        const svc = serviceMap.get(sid) as any;
        if (!stats[sid]) {
          stats[sid] = {
            name: svc?.name || `療程 #${sid}`,
            count: 0,
            revenue: 0,
            completed: 0,
          };
        }
        stats[sid].count += 1;
        if (apt.status === "completed") {
          stats[sid].completed += 1;
          stats[sid].revenue += Number(svc?.price || 0);
        }
      });

      const totalRevenue = Object.values(stats).reduce((s, v) => s + v.revenue, 0);

      return Object.entries(stats).map(([id, s]) => ({
        serviceId: Number(id),
        serviceName: s.name,
        appointmentCount: s.count,
        completedCount: s.completed,
        revenue: s.revenue,
        revenuePercent: totalRevenue > 0 ? Math.round(s.revenue / totalRevenue * 10000) / 100 : 0,
        conversionRate: s.count > 0 ? Math.round(s.completed / s.count * 10000) / 100 : 0,
      })).sort((a, b) => b.revenue - a.revenue);
    }),

  /**
   * 客戶分析：新客趨勢、回訪率
   */
  getCustomerAnalytics: protectedProcedure
    .input(z.object({
      tenantId: z.number(),
      days: z.number().default(90),
    }))
    .query(async ({ input }) => {
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - input.days);

      const { data: customers, error } = await supabase
        .from("customers")
        .select("id, created_at")
        .eq("tenant_id", input.tenantId);

      if (error) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: error.message });

      const { data: appointments } = await supabase
        .from("appointments")
        .select("customer_id, created_at, status")
        .eq("tenant_id", input.tenantId)
        .gte("created_at", startDate.toISOString());

      // 新客趨勢
      const newCustomerTrend: Record<string, number> = {};
      (customers || []).forEach((c: any) => {
        if (new Date(c.created_at) >= startDate) {
          const date = c.created_at?.split("T")[0] || "unknown";
          newCustomerTrend[date] = (newCustomerTrend[date] || 0) + 1;
        }
      });

      // 回訪率計算
      const customerVisits: Record<number, number> = {};
      (appointments || []).forEach((a: any) => {
        customerVisits[a.customer_id] = (customerVisits[a.customer_id] || 0) + 1;
      });
      const totalCustomersWithAppt = Object.keys(customerVisits).length;
      const returningCustomers = Object.values(customerVisits).filter(v => v > 1).length;
      const returnRate = totalCustomersWithAppt > 0
        ? Math.round(returningCustomers / totalCustomersWithAppt * 10000) / 100
        : 0;

      return {
        totalCustomers: (customers || []).length,
        newCustomersInPeriod: Object.values(newCustomerTrend).reduce((s, v) => s + v, 0),
        returnRate,
        returningCustomers,
        newCustomerTrend: Object.entries(newCustomerTrend)
          .map(([date, count]) => ({ date, count }))
          .sort((a, b) => a.date.localeCompare(b.date)),
      };
    }),

  /**
   * 員工績效
   */
  getStaffPerformance: protectedProcedure
    .input(z.object({
      tenantId: z.number(),
      startDate: z.string().optional(),
      endDate: z.string().optional(),
    }))
    .query(async ({ input }) => {
      let query = supabase
        .from("appointments")
        .select("staff_name, status, service_id, created_at")
        .eq("tenant_id", input.tenantId);

      if (input.startDate) query = query.gte("created_at", new Date(input.startDate).toISOString());
      if (input.endDate) query = query.lte("created_at", new Date(input.endDate).toISOString());

      const { data: appointments, error } = await query;
      if (error) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: error.message });

      const { data: services } = await supabase
        .from("services")
        .select("id, price")
        .eq("tenant_id", input.tenantId);

      const priceMap = new Map((services || []).map((s: any) => [s.id, Number(s.price || 0)]));

      const staffStats: Record<string, { appointments: number; completed: number; revenue: number; customers: Set<string> }> = {};

      (appointments || []).forEach((apt: any) => {
        const name = apt.staff_name || "未指定";
        if (!staffStats[name]) {
          staffStats[name] = { appointments: 0, completed: 0, revenue: 0, customers: new Set() };
        }
        staffStats[name].appointments += 1;
        if (apt.status === "completed") {
          staffStats[name].completed += 1;
          staffStats[name].revenue += priceMap.get(apt.service_id) || 0;
        }
      });

      return Object.entries(staffStats).map(([name, s]) => ({
        staffName: name,
        totalAppointments: s.appointments,
        completedAppointments: s.completed,
        revenue: s.revenue,
        completionRate: s.appointments > 0 ? Math.round(s.completed / s.appointments * 10000) / 100 : 0,
      })).sort((a, b) => b.revenue - a.revenue);
    }),

  /**
   * 預約分析：爽約率、尖峰時段
   */
  getAppointmentAnalytics: protectedProcedure
    .input(z.object({
      tenantId: z.number(),
      days: z.number().default(30),
    }))
    .query(async ({ input }) => {
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - input.days);

      const { data: appointments, error } = await supabase
        .from("appointments")
        .select("status, appointment_date, appointment_time, created_at")
        .eq("tenant_id", input.tenantId)
        .gte("created_at", startDate.toISOString());

      if (error) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: error.message });

      const total = (appointments || []).length;
      const noShow = (appointments || []).filter((a: any) => a.status === "no_show" || a.status === "cancelled").length;
      const noShowRate = total > 0 ? Math.round(noShow / total * 10000) / 100 : 0;

      // 時段分佈（熱力圖數據）
      const heatmap: Record<string, Record<string, number>> = {};
      const dayNames = ["日", "一", "二", "三", "四", "五", "六"];

      (appointments || []).forEach((apt: any) => {
        if (!apt.appointment_date || !apt.appointment_time) return;
        const d = new Date(apt.appointment_date);
        const dayOfWeek = dayNames[d.getDay()];
        const hour = apt.appointment_time?.split(":")[0] || "00";

        if (!heatmap[dayOfWeek]) heatmap[dayOfWeek] = {};
        heatmap[dayOfWeek][hour] = (heatmap[dayOfWeek][hour] || 0) + 1;
      });

      const heatmapData: { day: string; hour: string; count: number }[] = [];
      dayNames.forEach(day => {
        for (let h = 8; h <= 21; h++) {
          const hour = String(h).padStart(2, "0");
          heatmapData.push({
            day,
            hour: `${hour}:00`,
            count: heatmap[day]?.[hour] || 0,
          });
        }
      });

      // 狀態分佈
      const statusCounts: Record<string, number> = {};
      (appointments || []).forEach((a: any) => {
        const s = a.status || "unknown";
        statusCounts[s] = (statusCounts[s] || 0) + 1;
      });

      return {
        totalAppointments: total,
        noShowCount: noShow,
        noShowRate,
        statusDistribution: Object.entries(statusCounts).map(([status, count]) => ({ status, count })),
        heatmapData,
      };
    }),

  /**
   * 熱門療程排行
   */
  getTopServices: protectedProcedure
    .input(z.object({
      tenantId: z.number(),
      limit: z.number().default(10),
      sortBy: z.enum(["revenue", "count"]).default("revenue"),
    }))
    .query(async ({ input }) => {
      const { data: appointments, error } = await supabase
        .from("appointments")
        .select("service_id, status")
        .eq("tenant_id", input.tenantId);

      if (error) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: error.message });

      const { data: services } = await supabase
        .from("services")
        .select("id, name, price")
        .eq("tenant_id", input.tenantId);

      const serviceMap = new Map((services || []).map((s: any) => [s.id, s]));
      const stats: Record<number, { name: string; count: number; revenue: number }> = {};

      (appointments || []).forEach((apt: any) => {
        const sid = apt.service_id;
        if (!sid) return;
        const svc = serviceMap.get(sid) as any;
        if (!stats[sid]) {
          stats[sid] = { name: svc?.name || `療程 #${sid}`, count: 0, revenue: 0 };
        }
        stats[sid].count += 1;
        if (apt.status === "completed") {
          stats[sid].revenue += Number(svc?.price || 0);
        }
      });

      return Object.entries(stats)
        .map(([id, s]) => ({ serviceId: Number(id), ...s }))
        .sort((a, b) => input.sortBy === "revenue" ? b.revenue - a.revenue : b.count - a.count)
        .slice(0, input.limit);
    }),

  /**
   * KPI 摘要
   */
  getKPISummary: protectedProcedure
    .input(z.object({
      tenantId: z.number(),
    }))
    .query(async ({ input }) => {
      const now = new Date();
      const thisMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);
      const lastMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      const lastMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0);

      // 本月營收
      const { data: thisMonthOrders } = await supabase
        .from("orders")
        .select("total_amount")
        .eq("tenant_id", input.tenantId)
        .gte("created_at", thisMonthStart.toISOString());

      // 上月營收
      const { data: lastMonthOrders } = await supabase
        .from("orders")
        .select("total_amount")
        .eq("tenant_id", input.tenantId)
        .gte("created_at", lastMonthStart.toISOString())
        .lte("created_at", lastMonthEnd.toISOString());

      // 本月預約數
      const { count: thisMonthAppts } = await supabase
        .from("appointments")
        .select("*", { count: "exact", head: true })
        .eq("tenant_id", input.tenantId)
        .gte("created_at", thisMonthStart.toISOString());

      // 總客戶數
      const { count: totalCustomers } = await supabase
        .from("customers")
        .select("*", { count: "exact", head: true })
        .eq("tenant_id", input.tenantId);

      // 本月新客
      const { count: newCustomers } = await supabase
        .from("customers")
        .select("*", { count: "exact", head: true })
        .eq("tenant_id", input.tenantId)
        .gte("created_at", thisMonthStart.toISOString());

      const thisRevenue = (thisMonthOrders || []).reduce((s, o: any) => s + Number(o.total_amount || 0), 0);
      const lastRevenue = (lastMonthOrders || []).reduce((s, o: any) => s + Number(o.total_amount || 0), 0);
      const revenueGrowth = lastRevenue > 0 ? Math.round((thisRevenue - lastRevenue) / lastRevenue * 10000) / 100 : 0;

      return {
        monthlyRevenue: thisRevenue,
        revenueGrowth,
        monthlyAppointments: thisMonthAppts || 0,
        totalCustomers: totalCustomers || 0,
        newCustomers: newCustomers || 0,
      };
    }),

  /**
   * 匯出報表（返回 CSV 內容）
   */
  exportReport: protectedProcedure
    .input(z.object({
      tenantId: z.number(),
      reportType: z.enum(["revenue", "appointments", "customers", "services"]),
      startDate: z.string().optional(),
      endDate: z.string().optional(),
    }))
    .mutation(async ({ input }) => {
      let csvContent = "";
      let fileName = "";

      switch (input.reportType) {
        case "revenue": {
          const { data } = await supabase
            .from("orders")
            .select("id, created_at, total_amount, status")
            .eq("tenant_id", input.tenantId)
            .order("created_at", { ascending: false });

          csvContent = "訂單ID,日期,金額,狀態\n";
          (data || []).forEach((row: any) => {
            csvContent += `${row.id},${row.created_at?.split("T")[0]},${row.total_amount},${row.status}\n`;
          });
          fileName = `revenue_report_${new Date().toISOString().split("T")[0]}.csv`;
          break;
        }
        case "appointments": {
          const { data } = await supabase
            .from("appointments")
            .select("id, appointment_date, appointment_time, status, staff_name, customer_id")
            .eq("tenant_id", input.tenantId)
            .order("appointment_date", { ascending: false });

          csvContent = "預約ID,日期,時間,狀態,服務人員,客戶ID\n";
          (data || []).forEach((row: any) => {
            csvContent += `${row.id},${row.appointment_date},${row.appointment_time},${row.status},${row.staff_name || ""},${row.customer_id}\n`;
          });
          fileName = `appointments_report_${new Date().toISOString().split("T")[0]}.csv`;
          break;
        }
        case "customers": {
          const { data } = await supabase
            .from("customers")
            .select("id, name, phone, created_at")
            .eq("tenant_id", input.tenantId)
            .order("created_at", { ascending: false });

          csvContent = "客戶ID,姓名,電話,註冊日期\n";
          (data || []).forEach((row: any) => {
            csvContent += `${row.id},${row.name},${row.phone || ""},${row.created_at?.split("T")[0]}\n`;
          });
          fileName = `customers_report_${new Date().toISOString().split("T")[0]}.csv`;
          break;
        }
        case "services": {
          const { data } = await supabase
            .from("services")
            .select("id, name, price, duration")
            .eq("tenant_id", input.tenantId);

          csvContent = "療程ID,名稱,價格,時長(分鐘)\n";
          (data || []).forEach((row: any) => {
            csvContent += `${row.id},${row.name},${row.price},${row.duration || ""}\n`;
          });
          fileName = `services_report_${new Date().toISOString().split("T")[0]}.csv`;
          break;
        }
      }

      return { csvContent, fileName };
    }),
});
