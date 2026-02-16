import { z } from "zod";
import { router, publicProcedure } from "../_core/trpc";
import { TRPCError } from "@trpc/server";
import { supabase } from "../supabaseClient";

const commissionStatusEnum = z.enum(["pending", "partial", "paid", "cancelled"]);

export const commissionRecordRouter = router({
  /** 查詢分潤記錄 */
  list: publicProcedure
    .input(
      z.object({
        tenantId: z.number(),
        staffId: z.number().optional(),
        status: commissionStatusEnum.optional(),
        startDate: z.string().optional(),
        endDate: z.string().optional(),
      })
    )
    .query(async ({ input }) => {
      let query = supabase
        .from("commission_records")
        .select("*, staff(name, role_type)")
        .eq("tenant_id", input.tenantId)
        .order("created_at", { ascending: false });

      if (input.staffId) {
        query = query.eq("staff_id", input.staffId);
      }
      if (input.status) {
        query = query.eq("status", input.status);
      }
      if (input.startDate) {
        query = query.gte("created_at", input.startDate);
      }
      if (input.endDate) {
        query = query.lte("created_at", input.endDate);
      }

      const { data, error } = await query;
      if (error) {
        throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: error.message });
      }
      return data || [];
    }),

  /** 依訂單查詢分潤 */
  getByOrder: publicProcedure
    .input(z.object({ orderId: z.number() }))
    .query(async ({ input }) => {
      const { data, error } = await supabase
        .from("commission_records")
        .select("*, staff(name, role_type)")
        .eq("order_id", input.orderId)
        .order("created_at", { ascending: false });
      if (error) {
        throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: error.message });
      }
      return data || [];
    }),

  /** 自動計算分潤：根據訂單金額 + 員工角色 + 分潤規則，批次產生 commission_records */
  calculate: publicProcedure
    .input(
      z.object({
        tenantId: z.number(),
        orderId: z.number(),
        orderAmount: z.number(),
        serviceId: z.number().optional(),
      })
    )
    .mutation(async ({ input }) => {
      // 1. 取得此訂單的所有員工角色
      const { data: staffRoles, error: srError } = await supabase
        .from("staff_order_roles")
        .select("*")
        .eq("order_id", input.orderId);
      if (srError) {
        throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: srError.message });
      }
      if (!staffRoles || staffRoles.length === 0) {
        return { created: 0, records: [] };
      }

      // 2. 取得適用的分潤規則
      let ruleQuery = supabase
        .from("commission_rules")
        .select("*")
        .eq("tenant_id", input.tenantId);

      const { data: allRules, error: ruleError } = await ruleQuery;
      if (ruleError) {
        throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: ruleError.message });
      }

      // 3. 為每個員工角色配對規則並計算分潤
      const records: Array<{
        order_id: number;
        staff_id: number;
        tenant_id: number;
        role_type: string;
        amount: number;
        rate: number;
        status: string;
        deferred_conditions: unknown;
      }> = [];

      for (const sr of staffRoles) {
        // 找到最匹配的規則：先找 service_id + role_type 精確匹配，再找 role_type 通用規則
        const exactRule = (allRules || []).find(
          (r) =>
            r.service_id === input.serviceId && r.role_type === sr.role_type
        );
        const genericRule = (allRules || []).find(
          (r) => r.service_id === null && r.role_type === sr.role_type
        );
        const rule = exactRule || genericRule;

        if (rule) {
          const amount = Math.round(input.orderAmount * Number(rule.commission_rate) * 100) / 100;
          records.push({
            order_id: input.orderId,
            staff_id: sr.staff_id,
            tenant_id: input.tenantId,
            role_type: sr.role_type,
            amount,
            rate: Number(rule.commission_rate),
            status: rule.condition_type === "immediate" ? "pending" : "pending",
            deferred_conditions:
              rule.condition_type !== "immediate"
                ? { type: rule.condition_type, value: rule.condition_value }
                : null,
          });
        }
      }

      if (records.length === 0) {
        return { created: 0, records: [] };
      }

      // 4. 批次寫入
      const { data: inserted, error: insertError } = await supabase
        .from("commission_records")
        .insert(records)
        .select();
      if (insertError) {
        throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: insertError.message });
      }

      return { created: inserted?.length || 0, records: inserted || [] };
    }),

  /** 更新分潤狀態（標記已付款） */
  updateStatus: publicProcedure
    .input(
      z.object({
        id: z.number(),
        tenantId: z.number(),
        status: commissionStatusEnum,
      })
    )
    .mutation(async ({ input }) => {
      const updateData: Record<string, unknown> = { status: input.status };
      if (input.status === "paid") {
        updateData.paid_at = new Date().toISOString();
      }

      const { data, error } = await supabase
        .from("commission_records")
        .update(updateData)
        .eq("id", input.id)
        .eq("tenant_id", input.tenantId)
        .select()
        .single();
      if (error) {
        throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: error.message });
      }
      return data;
    }),

  /** 批次標記已付款 */
  batchPay: publicProcedure
    .input(
      z.object({
        ids: z.array(z.number()),
        tenantId: z.number(),
      })
    )
    .mutation(async ({ input }) => {
      const { data, error } = await supabase
        .from("commission_records")
        .update({ status: "paid", paid_at: new Date().toISOString() })
        .in("id", input.ids)
        .eq("tenant_id", input.tenantId)
        .select();
      if (error) {
        throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: error.message });
      }
      return { updated: data?.length || 0 };
    }),

  /** 薪資總表：依員工彙總分潤 */
  payrollSummary: publicProcedure
    .input(
      z.object({
        tenantId: z.number(),
        startDate: z.string(),
        endDate: z.string(),
      })
    )
    .query(async ({ input }) => {
      // 取得期間內所有分潤記錄
      const { data: records, error: recError } = await supabase
        .from("commission_records")
        .select("*, staff(name, role_type, base_salary)")
        .eq("tenant_id", input.tenantId)
        .gte("created_at", input.startDate)
        .lte("created_at", input.endDate);
      if (recError) {
        throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: recError.message });
      }

      // 彙總
      const summaryMap = new Map<
        number,
        {
          staffId: number;
          staffName: string;
          roleType: string;
          baseSalary: number;
          totalCommission: number;
          pendingCommission: number;
          paidCommission: number;
          recordCount: number;
        }
      >();

      for (const rec of records || []) {
        const staffInfo = rec.staff as { name: string; role_type: string; base_salary: number } | null;
        const existing = summaryMap.get(rec.staff_id);
        const amount = Number(rec.amount);

        if (existing) {
          existing.totalCommission += amount;
          if (rec.status === "pending") existing.pendingCommission += amount;
          if (rec.status === "paid") existing.paidCommission += amount;
          existing.recordCount += 1;
        } else {
          summaryMap.set(rec.staff_id, {
            staffId: rec.staff_id,
            staffName: staffInfo?.name || "未知",
            roleType: staffInfo?.role_type || "unknown",
            baseSalary: Number(staffInfo?.base_salary || 0),
            totalCommission: amount,
            pendingCommission: rec.status === "pending" ? amount : 0,
            paidCommission: rec.status === "paid" ? amount : 0,
            recordCount: 1,
          });
        }
      }

      return Array.from(summaryMap.values()).map((s) => ({
        ...s,
        totalPay: s.baseSalary + s.totalCommission,
      }));
    }),
});
