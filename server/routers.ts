import { COOKIE_NAME } from "@shared/const";
import { tenantRouter } from "./routers/tenantRouter";
import { appointmentRouter } from "./routers/appointmentRouter";
import { subscriptionRouter } from "./routers/subscriptionRouter";
import { whiteLabelRouter } from "./routers/whiteLabelRouter";
import { slotLimitRouter } from "./routers/slotLimitRouter";
import { rescheduleRouter } from "./routers/rescheduleRouter";
import { customerRouter } from "./routers/customerRouter";
import { superAdminRouter } from "./routers/superAdminRouter";
import { bookingRouter } from "./routers/bookingRouter";
import { weightTrackingRouter } from "./routers/weightTrackingRouter";
import { shopRouter } from "./routers/shopRouter";
import { aftercareRouter } from "./routers/aftercareRouter";
import { memberLevelRouter } from "./routers/memberLevelRouter";
import { couponRouter } from "./routers/couponRouter";
import { referralRouter } from "./routers/referralRouter";
import { memberPromoRouter } from "./routers/memberPromoRouter";
import { paymentMethodRouter } from "./routers/paymentMethodRouter";
import { customerTagRouter } from "./routers/customerTagRouter";
import { errorLogRouter } from "./routers/errorLogRouter";
import { timeSlotTemplateRouter } from "./routers/timeSlotTemplateRouter";
import { transferRouter } from "./routers/transferRouter";
import { orderRouter } from "./routers/orderRouter";
import { serviceRouter } from "./routers/serviceRouter";
import { lineBindingRouter } from "./routers/lineBindingRouter";
import { doseCalculationRouter } from "./routers/doseCalculationRouter";
import { approvalRouter } from "./routers/approvalRouter";
import { rescheduleApprovalRouter } from "./routers/rescheduleApprovalRouter";
import { slotLimitsRouter } from "./routers/slotLimitsRouter";
import { analyticsRouter } from "./routers/analyticsRouter";
import { aftercareContentRouter } from "./routers/aftercareContentRouter";
import { lineConfigRouter } from "./routers/lineConfigRouter";
import { revenueRouter } from "./routers/revenueRouter";
import { customerPhotoRouter } from "./routers/customerPhotoRouter";
import { depositRouter } from "./routers/depositRouter";
import { voucherRouter } from "./routers/voucherRouter";
import { marketingRouter } from "./routers/marketingRouter";
import { slotCalculatorRouter } from "./routers/slotCalculatorRouter";
import { medicalRecordRouter } from "./routers/medicalRecordRouter";
import { medicalPhotoRouter } from "./routers/medicalPhotoRouter";
import { consentFormRouter } from "./routers/consentFormRouter";
import { appointmentReminderRouter } from "./routers/appointmentReminderRouter";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, router } from "./_core/trpc";

export const appRouter = router({
    // if you need to use socket.io, read and register route in server/_core/index.ts, all api should start with '/api/' so that the gateway can route correctly
  system: systemRouter,
  auth: router({
    me: publicProcedure.query(opts => opts.ctx.user),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return {
        success: true,
      } as const;
    }),
  }),

  // Feature routers
  tenant: tenantRouter,
  appointment: appointmentRouter,
  subscription: subscriptionRouter,
  whiteLabel: whiteLabelRouter,
  slotLimit: slotLimitRouter,
  reschedule: rescheduleRouter,
  customer: customerRouter,
  superAdmin: superAdminRouter,
  service: serviceRouter,
  lineBinding: lineBindingRouter,
  booking: bookingRouter,
  weightTracking: weightTrackingRouter,
  shop: shopRouter,
  aftercare: aftercareRouter,
  memberLevel: memberLevelRouter,
  coupon: couponRouter,
  referral: referralRouter,
  memberPromo: memberPromoRouter,
  paymentMethod: paymentMethodRouter,
  customerTag: customerTagRouter,
  errorLog: errorLogRouter,
  timeSlotTemplate: timeSlotTemplateRouter,
  transfer: transferRouter,
  orders: orderRouter,
  doseCalculation: doseCalculationRouter,
  approval: approvalRouter,
  rescheduleApproval: rescheduleApprovalRouter,
  slotLimits: slotLimitsRouter,
  analytics: analyticsRouter,
  aftercareContent: aftercareContentRouter,
  lineConfig: lineConfigRouter,
  revenue: revenueRouter,
  customerPhoto: customerPhotoRouter,
  deposit: depositRouter,
  voucher: voucherRouter,
  marketing: marketingRouter,
  slotCalculator: slotCalculatorRouter,
  medicalRecord: medicalRecordRouter,
  medicalPhoto: medicalPhotoRouter,
  consentForm: consentFormRouter,
  appointmentReminder: appointmentReminderRouter,
});

export type AppRouter = typeof appRouter;
