/**
 * YaoYouQian 管理雲 — tRPC Router 三層架構
 *
 * Layer 1: coreRouter (共用) — YOKAGE & YaoYouQian 皆可使用
 * Layer 2: lineRouter (YaoYouQian 強化) — LIFF 專用 API
 * Layer 3: appRouter (根路由) — 組合 coreRouter + lineRouter + system
 */
import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, router } from "./_core/trpc";

// === coreRouter imports ===
import { tenantRouter } from "./routers/tenantRouter";
import { appointmentRouter } from "./routers/appointmentRouter";
import { customerRouter } from "./routers/customerRouter";
import { staffRouter } from "./routers/staffRouter";
import { scheduleRouter } from "./routers/scheduleRouter";
import { clockRouter } from "./routers/clockRouter";
import { notificationRouter } from "./routers/notificationRouter";
import { authRouter } from "./routers/authRouter";
import { lineWebhookTrpcRouter } from "./routers/lineWebhookTrpcRouter";
import { gamificationRouter } from "./routers/gamificationRouter";
import { subscriptionRouter } from "./routers/subscriptionRouter";
import { whiteLabelRouter } from "./routers/whiteLabelRouter";
import { slotLimitRouter } from "./routers/slotLimitRouter";
import { rescheduleRouter } from "./routers/rescheduleRouter";
import { superAdminRouter } from "./routers/superAdminRouter";
import { serviceRouter } from "./routers/serviceRouter";
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
import { biDashboardRouter } from "./routers/biDashboardRouter";
import { smartTagRouter } from "./routers/smartTagRouter";
import { campaignTemplateRouter } from "./routers/campaignTemplateRouter";
import { complianceRouter } from "./routers/complianceRouter";
import { campaignExecutionRouter } from "./routers/campaignExecutionRouter";
import { commissionRuleRouter } from "./routers/commissionRuleRouter";
import { commissionRecordRouter } from "./routers/commissionRecordRouter";
import { inventoryRouter } from "./routers/inventoryRouter";
import { serviceMaterialRouter } from "./routers/serviceMaterialRouter";
import { inventoryTransactionRouter } from "./routers/inventoryTransactionRouter";

// === lineRouter imports (YaoYouQian 強化) ===
import { liffAuthRouter } from "./routers/liffAuthRouter";
import { linePayRouter } from "./routers/linePayRouter";
import { liffBookingRouter } from "./routers/liffBookingRouter";
import { liffShopRouter } from "./routers/liffShopRouter";
import { liffMemberRouter } from "./routers/liffMemberRouter";

// ============================================
// Layer 1: coreRouter (共用核心)
// ============================================
export const coreRouter = router({
  // Core business modules
  appointment: appointmentRouter,
  customer: customerRouter,
  staff: staffRouter,
  schedule: scheduleRouter,
  clock: clockRouter,
  notification: notificationRouter,
  tenant: tenantRouter,
  auth: authRouter,
  lineWebhook: lineWebhookTrpcRouter,
  gamification: gamificationRouter,

  // Extended business modules
  subscription: subscriptionRouter,
  whiteLabel: whiteLabelRouter,
  slotLimit: slotLimitRouter,
  reschedule: rescheduleRouter,
  superAdmin: superAdminRouter,
  service: serviceRouter,
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
  lineBinding: lineBindingRouter,
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
  biDashboard: biDashboardRouter,
  smartTag: smartTagRouter,
  campaignTemplate: campaignTemplateRouter,
  compliance: complianceRouter,
  campaignExecution: campaignExecutionRouter,

  // HRM/Payroll Module
  commissionRule: commissionRuleRouter,
  commissionRecord: commissionRecordRouter,

  // ERP Inventory Module
  inventory: inventoryRouter,
  serviceMaterial: serviceMaterialRouter,
  inventoryTransaction: inventoryTransactionRouter,
});

// ============================================
// Layer 2: lineRouter (YaoYouQian 強化)
// ============================================
export const lineRouter = router({
  liffAuth: liffAuthRouter,
  linePay: linePayRouter,
  liffBooking: liffBookingRouter,
  liffShop: liffShopRouter,
  liffMember: liffMemberRouter,
});

// ============================================
// Layer 3: appRouter (根路由)
// ============================================
export const appRouter = router({
  system: systemRouter,

  // Flatten coreRouter into root for backward compatibility
  // This ensures existing API paths like trpc.appointment.xxx still work
  ...coreRouter._def.procedures,

  // lineRouter namespaced under 'line'
  line: lineRouter,
});

export type AppRouter = typeof appRouter;
