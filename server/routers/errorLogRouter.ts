import { router, protectedProcedure } from "../_core/trpc";
import { z } from "zod";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.VITE_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export const errorLogRouter = router({
  list: protectedProcedure
    .input(z.object({ tenantId: z.number(), page: z.number().optional(), pageSize: z.number().optional() }))
    .query(async ({ input }) => {
      const page = input.page || 1;
      const pageSize = input.pageSize || 10;
      const from = (page - 1) * pageSize;
      const to = from + pageSize - 1;

      const { data, error, count } = await supabase
        .from("error_logs")
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
        .from("error_logs")
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
        .from("error_logs")
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
        .from("error_logs")
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
        .from("error_logs")
        .delete()
        .eq("id", input.id)
        .eq("tenant_id", input.tenantId);

      if (error) throw new Error(error.message);
      return { success: true };
    }),
});
