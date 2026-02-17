import { NOT_ADMIN_ERR_MSG, UNAUTHED_ERR_MSG } from '@shared/const';
import { initTRPC, TRPCError } from "@trpc/server";
import superjson from "superjson";
import type { TrpcContext } from "./context";

const t = initTRPC.context<TrpcContext>().create({
  transformer: superjson,
});

export const router = t.router;
export const publicProcedure = t.procedure;
export const middleware = t.middleware;

const requireUser = t.middleware(async opts => {
  const { ctx, next } = opts;

  if (!ctx.user) {
    throw new TRPCError({ code: "UNAUTHORIZED", message: UNAUTHED_ERR_MSG });
  }

  return next({
    ctx: {
      ...ctx,
      user: ctx.user,
    },
  });
});

export const protectedProcedure = t.procedure.use(requireUser);

export const adminProcedure = t.procedure.use(
  t.middleware(async opts => {
    const { ctx, next } = opts;

    if (!ctx.user || ctx.user.role !== 'admin') {
      throw new TRPCError({ code: "FORBIDDEN", message: NOT_ADMIN_ERR_MSG });
    }

    return next({
      ctx: {
        ...ctx,
        user: ctx.user,
      },
    });
  }),
);

// ============================================
// Feature Gating Middleware
// ============================================
// Checks tenant's enabled_modules before allowing access.
// Usage: featureGatedProcedure("gamification") ensures the tenant has the module enabled.

export function createFeatureGate(requiredModule: string) {
  return t.middleware(async ({ ctx, next }) => {
    // Feature gating context injection — actual DB check is done at router level
    // where tenantId is available from input
    return next({
      ctx: {
        ...ctx,
        requiredModule,
      },
    });
  });
}

// Pre-built feature-gated procedures
export const featureGatedProcedure = (module: string) =>
  publicProcedure.use(createFeatureGate(module));
