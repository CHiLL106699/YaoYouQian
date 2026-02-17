import { z } from "zod";
import { router, protectedProcedure } from "../_core/trpc";
import { TRPCError } from "@trpc/server";
import { supabase } from "../supabaseClient";
import { sendLineMessage } from "../_core/lineMessaging";

export const campaignExecutionRouter = router({
  /**
   * 取得行銷執行記錄
   */
  list: protectedProcedure
    .input(z.object({
      tenantId: z.number(),
      page: z.number().default(1),
      limit: z.number().default(20),
    }))
    .query(async ({ input }) => {
      const offset = (input.page - 1) * input.limit;

      const { data, error } = await supabase
        .from("campaign_executions")
        .select("*")
        .eq("tenant_id", input.tenantId)
        .order("created_at", { ascending: false })
        .range(offset, offset + input.limit - 1);

      if (error) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: error.message });

      const { count } = await supabase
        .from("campaign_executions")
        .select("*", { count: "exact", head: true })
        .eq("tenant_id", input.tenantId);

      return {
        executions: data || [],
        total: count || 0,
        page: input.page,
        limit: input.limit,
      };
    }),

  /**
   * 執行行銷活動（核心流程）
   * 步驟：選標籤 → 預覽受眾 → 選模板 → 合規檢查 → 確認發送
   */
  execute: protectedProcedure
    .input(z.object({
      tenantId: z.number(),
      templateId: z.number(),
      tagIds: z.array(z.number()),
      campaignId: z.number().optional(),
    }))
    .mutation(async ({ input }) => {
      // 1. 取得模板
      const { data: template, error: templateError } = await supabase
        .from("campaign_templates")
        .select("*")
        .eq("id", input.templateId)
        .eq("tenant_id", input.tenantId)
        .single();

      if (templateError || !template) {
        throw new TRPCError({ code: "NOT_FOUND", message: "行銷模板不存在" });
      }

      // 2. 取得目標客戶（根據標籤）
      const { data: tagLinks, error: tagError } = await supabase
        .from("customer_smart_tags")
        .select("customer_id")
        .eq("tenant_id", input.tenantId)
        .in("tag_id", input.tagIds);

      if (tagError) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: tagError.message });

      const uniqueCustomerIds = Array.from(new Set((tagLinks || []).map((l: any) => l.customer_id)));

      if (uniqueCustomerIds.length === 0) {
        throw new TRPCError({ code: "BAD_REQUEST", message: "選定標籤下沒有任何客戶" });
      }

      const { data: customers, error: customerError } = await supabase
        .from("customers")
        .select("id, name, line_user_id")
        .in("id", uniqueCustomerIds);

      if (customerError) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: customerError.message });

      const lineCustomers = (customers || []).filter((c: any) => c.line_user_id);

      // 3. 合規檢查
      let contentText = "";
      const content = template.content as any;
      if (template.message_type === "text") {
        contentText = typeof content === "string" ? content : (content?.text || JSON.stringify(content));
      } else if (template.message_type === "flex") {
        contentText = content?.altText || JSON.stringify(content);
      }

      const { data: keywords } = await supabase
        .from("medical_compliance_keywords")
        .select("keyword, severity");

      let hasBlocked = false;
      (keywords || []).forEach((kw: any) => {
        if (contentText.includes(kw.keyword) && kw.severity === "blocked") {
          hasBlocked = true;
        }
      });

      if (hasBlocked) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "模板內容包含禁止用語，無法發送。請先修改模板內容。",
        });
      }

      // 4. 建立執行記錄
      const { data: execution, error: execError } = await supabase
        .from("campaign_executions")
        .insert({
          tenant_id: input.tenantId,
          campaign_id: input.campaignId || null,
          template_id: input.templateId,
          target_tag_ids: input.tagIds,
          target_count: lineCustomers.length,
          sent_count: 0,
          status: "processing",
          executed_at: new Date().toISOString(),
        })
        .select()
        .single();

      if (execError) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: execError.message });

      // 5. 發送 LINE 訊息
      let sentCount = 0;
      const errors: string[] = [];

      for (const customer of lineCustomers) {
        try {
          let messages: any[];
          if (template.message_type === "text") {
            const text = typeof content === "string" ? content : (content?.text || "");
            messages = [{ type: "text", text }];
          } else if (template.message_type === "flex") {
            messages = [{
              type: "flex",
              altText: content?.altText || "行銷訊息",
              contents: content?.contents || content,
            }];
          } else {
            messages = [{ type: "text", text: JSON.stringify(content) }];
          }

          await sendLineMessage((customer as any).line_user_id, messages);
          sentCount++;
        } catch (err: unknown) {
          errors.push(`${(customer as any).name}: ${(err as Error).message}`);
        }
      }

      // 6. 更新執行記錄
      const finalStatus = sentCount === lineCustomers.length ? "completed" : sentCount > 0 ? "partial" : "failed";

      await supabase
        .from("campaign_executions")
        .update({
          sent_count: sentCount,
          status: finalStatus,
        })
        .eq("id", execution.id);

      return {
        success: true,
        executionId: execution.id,
        targetCount: lineCustomers.length,
        sentCount,
        failedCount: lineCustomers.length - sentCount,
        status: finalStatus,
        errors: errors.slice(0, 10),
      };
    }),

  /**
   * 取得單一執行記錄詳情
   */
  getById: protectedProcedure
    .input(z.object({
      id: z.number(),
      tenantId: z.number(),
    }))
    .query(async ({ input }) => {
      const { data, error } = await supabase
        .from("campaign_executions")
        .select("*")
        .eq("id", input.id)
        .eq("tenant_id", input.tenantId)
        .single();

      if (error) throw new TRPCError({ code: "NOT_FOUND", message: "執行記錄不存在" });
      return data;
    }),
});
