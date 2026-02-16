import { z } from "zod";
import { router, publicProcedure } from "../_core/trpc";
import { TRPCError } from "@trpc/server";
import { supabase } from "../supabaseClient";

const roleEnum = z.enum(["consultant", "doctor", "nurse", "admin"]);
const conditionTypeEnum = z.enum(["immediate", "deferred", "milestone"]);

export const commissionRuleRouter = router({
  list: publicProcedure
    .input(
      z.object({
        tenantId: z.number(),
        serviceId: z.number().optional(),
        roleType: roleEnum.optional(),
      })
    )
    .query(async ({ input }) => {
      let query = supabase
        .from("commission_rules")
        .select("*")
        .eq("tenant_id", input.tenantId)
        .order("created_at", { ascending: false });

      if (input.serviceId !== undefined) {
        query = query.eq("service_id", input.serviceId);
      }
      if (input.roleType) {
        query = query.eq("role_type", input.roleType);
      }

      const { data, error } = await query;
      if (error) {
        throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: error.message });
      }
      return data || [];
    }),

  getById: publicProcedure
    .input(z.object({ id: z.number() }))
    .query(async ({ input }) => {
      const { data, error } = await supabase
        .from("commission_rules")
        .select("*")
        .eq("id", input.id)
        .single();
      if (error) {
        throw new TRPCError({ code: "NOT_FOUND", message: error.message });
      }
      return data;
    }),

  create: publicProcedure
    .input(
      z.object({
        tenantId: z.number(),
        serviceId: z.number().nullable().optional(),
        roleType: roleEnum,
        commissionRate: z.number().min(0).max(1),
        conditionType: conditionTypeEnum.optional(),
        conditionValue: z.any().optional(),
        description: z.string().optional(),
      })
    )
    .mutation(async ({ input }) => {
      const { data, error } = await supabase
        .from("commission_rules")
        .insert({
          tenant_id: input.tenantId,
          service_id: input.serviceId ?? null,
          role_type: input.roleType,
          commission_rate: input.commissionRate,
          condition_type: input.conditionType || "immediate",
          condition_value: input.conditionValue || null,
          description: input.description || null,
        })
        .select()
        .single();
      if (error) {
        throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: error.message });
      }
      return data;
    }),

  update: publicProcedure
    .input(
      z.object({
        id: z.number(),
        tenantId: z.number(),
        serviceId: z.number().nullable().optional(),
        roleType: roleEnum.optional(),
        commissionRate: z.number().min(0).max(1).optional(),
        conditionType: conditionTypeEnum.optional(),
        conditionValue: z.any().optional(),
        description: z.string().optional(),
      })
    )
    .mutation(async ({ input }) => {
      const { id, tenantId, ...fields } = input;
      const updateData: Record<string, unknown> = {};
      if (fields.serviceId !== undefined) updateData.service_id = fields.serviceId;
      if (fields.roleType !== undefined) updateData.role_type = fields.roleType;
      if (fields.commissionRate !== undefined) updateData.commission_rate = fields.commissionRate;
      if (fields.conditionType !== undefined) updateData.condition_type = fields.conditionType;
      if (fields.conditionValue !== undefined) updateData.condition_value = fields.conditionValue;
      if (fields.description !== undefined) updateData.description = fields.description;
      updateData.updated_at = new Date().toISOString();

      const { data, error } = await supabase
        .from("commission_rules")
        .update(updateData)
        .eq("id", id)
        .eq("tenant_id", tenantId)
        .select()
        .single();
      if (error) {
        throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: error.message });
      }
      return data;
    }),

  delete: publicProcedure
    .input(z.object({ id: z.number(), tenantId: z.number() }))
    .mutation(async ({ input }) => {
      const { error } = await supabase
        .from("commission_rules")
        .delete()
        .eq("id", input.id)
        .eq("tenant_id", input.tenantId);
      if (error) {
        throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: error.message });
      }
      return { success: true };
    }),
});
