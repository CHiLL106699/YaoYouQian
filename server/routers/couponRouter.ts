import { router, protectedProcedure } from "../_core/trpc";
import { z } from "zod";
import { supabase } from "../supabaseClient";
export const couponRouter = router({
  list: protectedProcedure
    .input(z.object({ tenantId: z.number(), page: z.number().optional(), pageSize: z.number().optional() }))
    .query(async ({ input }) => {
      const page = input.page || 1;
      const pageSize = input.pageSize || 10;
      const from = (page - 1) * pageSize;
      const to = from + pageSize - 1;

      const { data, error, count } = await supabase
        .from("coupons")
        .select("*", { count: "exact" })
        .eq("tenant_id", input.tenantId)
        .range(from, to)
        .order("created_at", { ascending: false });

      if (error) throw new Error(error.message);

      return {
        items: data || [],
        total: count || 0,
        page,
        pageSize,
      };
    }),

  getById: protectedProcedure
    .input(z.object({ id: z.number(), tenantId: z.number() }))
    .query(async ({ input }) => {
      const { data, error } = await supabase
        .from("coupons")
        .select("*")
        .eq("id", input.id)
        .eq("tenant_id", input.tenantId)
        .single();

      if (error) throw new Error(error.message);
      return data;
    }),

  create: protectedProcedure
    .input(z.object({ tenantId: z.number(), data: z.record(z.string(), z.any()) }))
    .mutation(async ({ input }) => {
      const { data, error } = await supabase
        .from("coupons")
        .insert({ ...input.data, tenant_id: input.tenantId })
        .select("*")
        .single();

      if (error) throw new Error(error.message);
      return data;
    }),

  update: protectedProcedure
    .input(z.object({ id: z.number(), tenantId: z.number(), data: z.record(z.string(), z.any()) }))
    .mutation(async ({ input }) => {
      const { data, error } = await supabase
        .from("coupons")
        .update(input.data)
        .eq("id", input.id)
        .eq("tenant_id", input.tenantId)
        .select("*")
        .single();

      if (error) throw new Error(error.message);
      return data;
    }),

  delete: protectedProcedure
    .input(z.object({ id: z.number(), tenantId: z.number() }))
    .mutation(async ({ input }) => {
      const { error } = await supabase
        .from("coupons")
        .delete()
        .eq("id", input.id)
        .eq("tenant_id", input.tenantId);

      if (error) throw new Error(error.message);
      return { success: true };
    }),
});
