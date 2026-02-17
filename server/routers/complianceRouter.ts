import { z } from "zod";
import { router, protectedProcedure } from "../_core/trpc";
import { TRPCError } from "@trpc/server";
import { supabase } from "../supabaseClient";

export const complianceRouter = router({
  /**
   * 取得所有警示詞
   */
  listKeywords: protectedProcedure
    .input(z.object({
      severity: z.enum(["warning", "blocked"]).optional(),
    }))
    .query(async ({ input }) => {
      let query = supabase
        .from("medical_compliance_keywords")
        .select("*")
        .order("severity", { ascending: true })
        .order("keyword", { ascending: true });

      if (input.severity) {
        query = query.eq("severity", input.severity);
      }

      const { data, error } = await query;
      if (error) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: error.message });
      return data || [];
    }),

  /**
   * 新增警示詞
   */
  createKeyword: protectedProcedure
    .input(z.object({
      keyword: z.string().min(1),
      severity: z.enum(["warning", "blocked"]),
      regulationReference: z.string().optional(),
      description: z.string().optional(),
    }))
    .mutation(async ({ input }) => {
      const { data, error } = await supabase
        .from("medical_compliance_keywords")
        .insert({
          keyword: input.keyword,
          severity: input.severity,
          regulation_reference: input.regulationReference || null,
          description: input.description || null,
        })
        .select()
        .single();

      if (error) {
        if (error.code === "23505") {
          throw new TRPCError({ code: "CONFLICT", message: `警示詞「${input.keyword}」已存在` });
        }
        throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: error.message });
      }
      return { success: true, keyword: data };
    }),

  /**
   * 更新警示詞
   */
  updateKeyword: protectedProcedure
    .input(z.object({
      id: z.number(),
      keyword: z.string().min(1).optional(),
      severity: z.enum(["warning", "blocked"]).optional(),
      regulationReference: z.string().optional(),
      description: z.string().optional(),
    }))
    .mutation(async ({ input }) => {
      const updateData: Record<string, unknown> = {};
      if (input.keyword !== undefined) updateData.keyword = input.keyword;
      if (input.severity !== undefined) updateData.severity = input.severity;
      if (input.regulationReference !== undefined) updateData.regulation_reference = input.regulationReference;
      if (input.description !== undefined) updateData.description = input.description;

      const { data, error } = await supabase
        .from("medical_compliance_keywords")
        .update(updateData)
        .eq("id", input.id)
        .select()
        .single();

      if (error) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: error.message });
      return { success: true, keyword: data };
    }),

  /**
   * 刪除警示詞
   */
  deleteKeyword: protectedProcedure
    .input(z.object({
      id: z.number(),
    }))
    .mutation(async ({ input }) => {
      const { error } = await supabase
        .from("medical_compliance_keywords")
        .delete()
        .eq("id", input.id);

      if (error) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: error.message });
      return { success: true };
    }),

  /**
   * 內容合規檢查 API（核心亮點）
   * 掃描文本內容，標記違規詞彙
   */
  checkContent: protectedProcedure
    .input(z.object({
      content: z.string(),
    }))
    .mutation(async ({ input }) => {
      const { data: keywords, error } = await supabase
        .from("medical_compliance_keywords")
        .select("keyword, severity, regulation_reference, description");

      if (error) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: error.message });

      const violations: {
        keyword: string;
        severity: "warning" | "blocked";
        positions: { start: number; end: number }[];
        regulationReference: string | null;
        description: string | null;
      }[] = [];

      let hasBlocked = false;
      let hasWarning = false;

      (keywords || []).forEach((kw: any) => {
        const positions: { start: number; end: number }[] = [];
        let idx = input.content.indexOf(kw.keyword);
        while (idx !== -1) {
          positions.push({ start: idx, end: idx + kw.keyword.length });
          idx = input.content.indexOf(kw.keyword, idx + 1);
        }

        if (positions.length > 0) {
          violations.push({
            keyword: kw.keyword,
            severity: kw.severity,
            positions,
            regulationReference: kw.regulation_reference,
            description: kw.description,
          });
          if (kw.severity === "blocked") hasBlocked = true;
          if (kw.severity === "warning") hasWarning = true;
        }
      });

      return {
        isCompliant: !hasBlocked,
        hasWarnings: hasWarning,
        hasBlocked,
        violations,
        summary: hasBlocked
          ? "內容包含禁止用語，無法發送"
          : hasWarning
            ? "內容包含警告用語，建議修改後再發送"
            : "內容合規，可以發送",
      };
    }),
});
