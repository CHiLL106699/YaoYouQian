import { z } from "zod";
import { router, protectedProcedure } from "../_core/trpc";
import { TRPCError } from "@trpc/server";
import { supabase } from "../supabaseClient";

export const consentFormRouter = router({
  /** 查詢同意書列表 */
  list: protectedProcedure
    .input(z.object({
      tenantId: z.number(),
      patientId: z.number().optional(),
      formType: z.string().optional(),
      page: z.number().default(1),
      pageSize: z.number().default(20),
    }))
    .query(async ({ input }) => {
      let query = supabase
        .from("consent_forms")
        .select("*, customers!consent_forms_patient_id_fkey(id, name, phone)", { count: "exact" })
        .eq("tenant_id", input.tenantId);

      if (input.patientId) query = query.eq("patient_id", input.patientId);
      if (input.formType) query = query.eq("form_type", input.formType);

      const { data, error, count } = await query
        .range((input.page - 1) * input.pageSize, input.page * input.pageSize - 1)
        .order("created_at", { ascending: false });

      if (error) {
        throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: `查詢同意書失敗: ${error.message}` });
      }

      return { forms: data || [], total: count || 0, page: input.page, pageSize: input.pageSize };
    }),

  /** 取得單筆同意書 */
  getById: protectedProcedure
    .input(z.object({ id: z.number(), tenantId: z.number() }))
    .query(async ({ input }) => {
      const { data, error } = await supabase
        .from("consent_forms")
        .select("*, customers!consent_forms_patient_id_fkey(id, name, phone)")
        .eq("id", input.id)
        .eq("tenant_id", input.tenantId)
        .single();

      if (error) {
        throw new TRPCError({ code: "NOT_FOUND", message: `同意書不存在: ${error.message}` });
      }
      return data;
    }),

  /** 新增同意書（含簽名） */
  create: protectedProcedure
    .input(z.object({
      tenantId: z.number(),
      patientId: z.number(),
      formType: z.string(),
      signatureData: z.string().optional(),
      witnessName: z.string().optional(),
    }))
    .mutation(async ({ input }) => {
      const { data, error } = await supabase
        .from("consent_forms")
        .insert({
          tenant_id: input.tenantId,
          patient_id: input.patientId,
          form_type: input.formType,
          signature_data: input.signatureData ?? null,
          signed_at: input.signatureData ? new Date().toISOString() : null,
          witness_name: input.witnessName ?? null,
        })
        .select()
        .single();

      if (error) {
        throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: `新增同意書失敗: ${error.message}` });
      }
      return data;
    }),

  /** 更新同意書（補簽名） */
  update: protectedProcedure
    .input(z.object({
      id: z.number(),
      tenantId: z.number(),
      signatureData: z.string().optional(),
      witnessName: z.string().optional(),
    }))
    .mutation(async ({ input }) => {
      const updateData: Record<string, unknown> = { updated_at: new Date().toISOString() };
      if (input.signatureData !== undefined) {
        updateData.signature_data = input.signatureData;
        updateData.signed_at = new Date().toISOString();
      }
      if (input.witnessName !== undefined) updateData.witness_name = input.witnessName;

      const { data, error } = await supabase
        .from("consent_forms")
        .update(updateData)
        .eq("id", input.id)
        .eq("tenant_id", input.tenantId)
        .select()
        .single();

      if (error) {
        throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: `更新同意書失敗: ${error.message}` });
      }
      return data;
    }),

  /** 刪除同意書 */
  delete: protectedProcedure
    .input(z.object({ id: z.number(), tenantId: z.number() }))
    .mutation(async ({ input }) => {
      const { error } = await supabase
        .from("consent_forms")
        .delete()
        .eq("id", input.id)
        .eq("tenant_id", input.tenantId);

      if (error) {
        throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: `刪除同意書失敗: ${error.message}` });
      }
      return { success: true };
    }),
});
