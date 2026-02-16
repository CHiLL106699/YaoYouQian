import { z } from "zod";
import { router, protectedProcedure } from "../_core/trpc";
import { TRPCError } from "@trpc/server";
import { supabase } from "../supabaseClient";

export const medicalRecordRouter = router({
  /** 查詢病歷列表（分頁 + 篩選） */
  list: protectedProcedure
    .input(z.object({
      tenantId: z.number(),
      patientId: z.number().optional(),
      page: z.number().default(1),
      pageSize: z.number().default(20),
      keyword: z.string().optional(),
    }))
    .query(async ({ input }) => {
      let query = supabase
        .from("medical_records")
        .select("*, customers!medical_records_patient_id_fkey(id, name, phone)", { count: "exact" })
        .eq("tenant_id", input.tenantId);

      if (input.patientId) {
        query = query.eq("patient_id", input.patientId);
      }
      if (input.keyword) {
        query = query.or(`diagnosis.ilike.%${input.keyword}%,treatment_plan.ilike.%${input.keyword}%,notes.ilike.%${input.keyword}%`);
      }

      const { data, error, count } = await query
        .range((input.page - 1) * input.pageSize, input.page * input.pageSize - 1)
        .order("created_at", { ascending: false });

      if (error) {
        throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: `查詢病歷失敗: ${error.message}` });
      }

      return { records: data || [], total: count || 0, page: input.page, pageSize: input.pageSize };
    }),

  /** 取得單筆病歷（含照片） */
  getById: protectedProcedure
    .input(z.object({ id: z.number(), tenantId: z.number() }))
    .query(async ({ input }) => {
      const { data, error } = await supabase
        .from("medical_records")
        .select("*, customers!medical_records_patient_id_fkey(id, name, phone), medical_photos(*)")
        .eq("id", input.id)
        .eq("tenant_id", input.tenantId)
        .single();

      if (error) {
        throw new TRPCError({ code: "NOT_FOUND", message: `病歷不存在: ${error.message}` });
      }
      return data;
    }),

  /** 新增病歷 */
  create: protectedProcedure
    .input(z.object({
      tenantId: z.number(),
      patientId: z.number(),
      doctorId: z.number().optional(),
      diagnosis: z.string().optional(),
      treatmentPlan: z.string().optional(),
      notes: z.string().optional(),
    }))
    .mutation(async ({ input }) => {
      const { data, error } = await supabase
        .from("medical_records")
        .insert({
          tenant_id: input.tenantId,
          patient_id: input.patientId,
          doctor_id: input.doctorId ?? null,
          diagnosis: input.diagnosis ?? null,
          treatment_plan: input.treatmentPlan ?? null,
          notes: input.notes ?? null,
        })
        .select()
        .single();

      if (error) {
        throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: `新增病歷失敗: ${error.message}` });
      }
      return data;
    }),

  /** 更新病歷 */
  update: protectedProcedure
    .input(z.object({
      id: z.number(),
      tenantId: z.number(),
      diagnosis: z.string().optional(),
      treatmentPlan: z.string().optional(),
      notes: z.string().optional(),
      doctorId: z.number().optional(),
    }))
    .mutation(async ({ input }) => {
      const updateData: Record<string, unknown> = { updated_at: new Date().toISOString() };
      if (input.diagnosis !== undefined) updateData.diagnosis = input.diagnosis;
      if (input.treatmentPlan !== undefined) updateData.treatment_plan = input.treatmentPlan;
      if (input.notes !== undefined) updateData.notes = input.notes;
      if (input.doctorId !== undefined) updateData.doctor_id = input.doctorId;

      const { data, error } = await supabase
        .from("medical_records")
        .update(updateData)
        .eq("id", input.id)
        .eq("tenant_id", input.tenantId)
        .select()
        .single();

      if (error) {
        throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: `更新病歷失敗: ${error.message}` });
      }
      return data;
    }),

  /** 刪除病歷 */
  delete: protectedProcedure
    .input(z.object({ id: z.number(), tenantId: z.number() }))
    .mutation(async ({ input }) => {
      const { error } = await supabase
        .from("medical_records")
        .delete()
        .eq("id", input.id)
        .eq("tenant_id", input.tenantId);

      if (error) {
        throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: `刪除病歷失敗: ${error.message}` });
      }
      return { success: true };
    }),
});
