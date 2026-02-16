import { router } from "../_core/trpc";
import { tenantRouter } from "./tenantRouter";
import { appointmentRouter } from "./appointmentRouter";
import { subscriptionRouter } from "./subscriptionRouter";
import { whiteLabelRouter } from "./whiteLabelRouter";
import { slotLimitRouter } from "./slotLimitRouter";
import { rescheduleRouter } from "./rescheduleRouter";
import { customerRouter } from "./customerRouter";
import { superAdminRouter } from "./superAdminRouter";

export const featureRouter = router({
  tenant: tenantRouter,
  appointment: appointmentRouter,
  subscription: subscriptionRouter,
  whiteLabel: whiteLabelRouter,
  slotLimit: slotLimitRouter,
  reschedule: rescheduleRouter,
  customer: customerRouter,
  superAdmin: superAdminRouter
});
