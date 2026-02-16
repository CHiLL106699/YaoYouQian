import { z } from "zod";
import { router, publicProcedure } from "../_core/trpc";
import { TRPCError } from "@trpc/server";
import { supabase } from "../supabaseClient";

const staffRoleEnum = z.enum(["consultant", "doctor", "nurse", "admin"]);
const staffStatusEnum = z.enum(["active", "inactive", "archived"]);

export const staffRouter = router({
  list: publicProcedure
    .input(
      z.object({
        tenantId: z.number(),
        roleType: staffRoleEnum.optional(),
        status: staffStatusEnum.optional(),
        search: z.string().optional(),
      })
    )
    .query(async ({ input }) => {
      let query = supabase
        .from("staff")
        .select("*")
        .eq("tenant_id", input.tenantId)
        .order("created_at", { ascending: false });

      if (input.roleType) {
        query = query.eq("role_type", input.roleType);
      }
      if (input.status) {
        query = query.eq("status", input.status);
      }
      if (input.search) {
        query = query.or(
          `name.ilike.%${input.search}%,phone.ilike.%${input.search}%,email.ilike.%${input.search}%`
        );
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
        .from("staff")
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
        name: z.string().min(1),
        roleType: staffRoleEnum,
        lineUserId: z.string().optional(),
        phone: z.string().optional(),
        email: z.string().optional(),
        baseSalary: z.number().min(0).optional(),
      })
    )
    .mutation(async ({ input }) => {
      const { data, error } = await supabase
        .from("staff")
        .insert({
          tenant_id: input.tenantId,
          name: input.name,
          role_type: input.roleType,
          line_user_id: input.lineUserId || null,
          phone: input.phone || null,
          email: input.email || null,
          base_salary: input.baseSalary ?? 0,
          status: "active",
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
        name: z.string().min(1).optional(),
        roleType: staffRoleEnum.optional(),
        lineUserId: z.string().optional(),
        phone: z.string().optional(),
        email: z.string().optional(),
        baseSalary: z.number().min(0).optional(),
        status: staffStatusEnum.optional(),
      })
    )
    .mutation(async ({ input }) => {
      const { id, tenantId, ...updateFields } = input;
      const updateData: Record<string, unknown> = {};
      if (updateFields.name !== undefined) updateData.name = updateFields.name;
      if (updateFields.roleType !== undefined) updateData.role_type = updateFields.roleType;
      if (updateFields.lineUserId !== undefined) updateData.line_user_id = updateFields.lineUserId;
      if (updateFields.phone !== undefined) updateData.phone = updateFields.phone;
      if (updateFields.email !== undefined) updateData.email = updateFields.email;
      if (updateFields.baseSalary !== undefined) updateData.base_salary = updateFields.baseSalary;
      if (updateFields.status !== undefined) updateData.status = updateFields.status;
      updateData.updated_at = new Date().toISOString();

      const { data, error } = await supabase
        .from("staff")
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
        .from("staff")
        .delete()
        .eq("id", input.id)
        .eq("tenant_id", input.tenantId);
      if (error) {
        throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: error.message });
      }
      return { success: true };
    }),

  // 指派員工到訂單角色
  assignToOrder: publicProcedure
    .input(
      z.object({
        orderId: z.number(),
        staffId: z.number(),
        roleType: staffRoleEnum,
      })
    )
    .mutation(async ({ input }) => {
      const { data, error } = await supabase
        .from("staff_order_roles")
        .upsert(
          {
            order_id: input.orderId,
            staff_id: input.staffId,
            role_type: input.roleType,
          },
          { onConflict: "order_id,staff_id,role_type" }
        )
        .select()
        .single();
      if (error) {
        throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: error.message });
      }
      return data;
    }),

  // 取得訂單的員工角色列表
  getOrderStaff: publicProcedure
    .input(z.object({ orderId: z.number() }))
    .query(async ({ input }) => {
      const { data, error } = await supabase
        .from("staff_order_roles")
        .select("*, staff(*)")
        .eq("order_id", input.orderId);
      if (error) {
        throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: error.message });
      }
      return data || [];
    }),

  // 移除訂單員工角色
  removeFromOrder: publicProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ input }) => {
      const { error } = await supabase
        .from("staff_order_roles")
        .delete()
        .eq("id", input.id);
      if (error) {
        throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: error.message });
      }
      return { success: true };
    }),
});
