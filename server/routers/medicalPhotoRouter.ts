import { z } from "zod";
import { router, protectedProcedure } from "../_core/trpc";
import { TRPCError } from "@trpc/server";
import { supabase } from "../supabaseClient";

export const medicalPhotoRouter = router({
  /** 查詢照片列表 */
  list: protectedProcedure
    .input(z.object({
      tenantId: z.number(),
      patientId: z.number().optional(),
      recordId: z.number().optional(),
      photoType: z.enum(["before", "after", "progress"]).optional(),
    }))
    .query(async ({ input }) => {
      let query = supabase
        .from("medical_photos")
        .select("*, customers!medical_photos_patient_id_fkey(id, name)")
        .eq("tenant_id", input.tenantId);

      if (input.patientId) query = query.eq("patient_id", input.patientId);
      if (input.recordId) query = query.eq("record_id", input.recordId);
      if (input.photoType) query = query.eq("photo_type", input.photoType);

      const { data, error } = await query.order("created_at", { ascending: false });

      if (error) {
        throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: `查詢照片失敗: ${error.message}` });
      }
      return data || [];
    }),

  /** 取得術前術後配對照片（用於 Before/After Slider） */
  getBeforeAfterPairs: protectedProcedure
    .input(z.object({
      tenantId: z.number(),
      patientId: z.number(),
      category: z.string().optional(),
    }))
    .query(async ({ input }) => {
      let query = supabase
        .from("medical_photos")
        .select("*")
        .eq("tenant_id", input.tenantId)
        .eq("patient_id", input.patientId)
        .in("photo_type", ["before", "after"]);

      if (input.category) query = query.eq("photo_category", input.category);

      const { data, error } = await query.order("taken_at", { ascending: true });

      if (error) {
        throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: `查詢配對照片失敗: ${error.message}` });
      }

      // 將照片分組為 before/after 配對
      const beforePhotos = (data || []).filter(p => p.photo_type === "before");
      const afterPhotos = (data || []).filter(p => p.photo_type === "after");

      return { beforePhotos, afterPhotos };
    }),

  /** 新增照片記錄 */
  create: protectedProcedure
    .input(z.object({
      tenantId: z.number(),
      patientId: z.number(),
      recordId: z.number().optional(),
      photoType: z.enum(["before", "after", "progress"]),
      photoUrl: z.string(),
      photoCategory: z.string().optional(),
      notes: z.string().optional(),
      takenAt: z.string().optional(),
    }))
    .mutation(async ({ input }) => {
      const { data, error } = await supabase
        .from("medical_photos")
        .insert({
          tenant_id: input.tenantId,
          patient_id: input.patientId,
          record_id: input.recordId ?? null,
          photo_type: input.photoType,
          photo_url: input.photoUrl,
          photo_category: input.photoCategory ?? null,
          notes: input.notes ?? null,
          taken_at: input.takenAt ?? new Date().toISOString(),
        })
        .select()
        .single();

      if (error) {
        throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: `新增照片失敗: ${error.message}` });
      }
      return data;
    }),

  /** 刪除照片 */
  delete: protectedProcedure
    .input(z.object({ id: z.number(), tenantId: z.number() }))
    .mutation(async ({ input }) => {
      const { error } = await supabase
        .from("medical_photos")
        .delete()
        .eq("id", input.id)
        .eq("tenant_id", input.tenantId);

      if (error) {
        throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: `刪除照片失敗: ${error.message}` });
      }
      return { success: true };
    }),
});
