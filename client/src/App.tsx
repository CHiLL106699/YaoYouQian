import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/NotFound";
import { Route, Switch } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
import DashboardLayout from "./components/DashboardLayout";
import { ThemeProvider } from "./contexts/ThemeContext";
import { TenantProvider } from "./contexts/TenantContext";
import { lazy, Suspense } from "react";
import { Loader2 } from "lucide-react";

// ─── Global Suspense fallback ───────────────────────────────────────────────
function PageLoadingFallback() {
  return (
    <div className="flex items-center justify-center min-h-screen">
      <Loader2 className="h-8 w-8 animate-spin text-primary" />
    </div>
  );
}

// ─── Lazy-loaded Public Pages ───────────────────────────────────────────────
const Home = lazy(() => import("./pages/Home"));
const TenantRegister = lazy(() => import("./pages/TenantRegister"));
const TenantLogin = lazy(() => import("./pages/TenantLogin"));
const AdminLogin = lazy(() => import("./pages/AdminLogin"));
const SuperAdminLogin = lazy(() => import("./pages/SuperAdminLogin"));
const BookingForm = lazy(() => import("./pages/BookingForm"));
const MyBookings = lazy(() => import("./pages/MyBookings"));

// ─── Lazy-loaded Dashboard Pages ────────────────────────────────────────────
const TenantDashboard = lazy(() => import("./pages/TenantDashboard"));
const AppointmentManagement = lazy(() => import("./pages/AppointmentManagement"));
const SlotManagement = lazy(() => import("./pages/SlotManagement"));
const RescheduleRequests = lazy(() => import("./pages/RescheduleRequests"));
const CustomerManagement = lazy(() => import("./pages/CustomerManagement"));
const VoucherManagement = lazy(() => import("./pages/VoucherManagement"));
const MarketingCampaignManagement = lazy(() => import("./pages/MarketingCampaignManagement"));
const SlotCalculatorManagement = lazy(() => import("./pages/SlotCalculatorManagement"));
const CustomerPhotoManagement = lazy(() => import("./pages/CustomerPhotoManagement"));
const DepositManagement = lazy(() => import("./pages/DepositManagement"));
const WhiteLabelSettings = lazy(() => import("./pages/WhiteLabelSettings"));
const SubscriptionManagement = lazy(() => import("./pages/SubscriptionManagement"));
const TenantSettings = lazy(() => import("./pages/TenantSettings"));
const SuperAdminDashboard = lazy(() => import("./pages/SuperAdminDashboard"));
const LinePaySubscription = lazy(() => import("./pages/LinePaySubscription"));
const WeightTracking = lazy(() => import("./pages/WeightTracking"));
const ProductManagement = lazy(() => import("./pages/ProductManagement"));
const ShopOrders = lazy(() => import("./pages/ShopOrders"));
const AftercareRecords = lazy(() => import("./pages/AftercareRecords"));
const MemberLevels = lazy(() => import("./pages/MemberLevels"));
const CouponManagement = lazy(() => import("./pages/CouponManagement"));
const ReferralProgram = lazy(() => import("./pages/ReferralProgram"));
const MemberPromotions = lazy(() => import("./pages/MemberPromotions"));
const PaymentMethods = lazy(() => import("./pages/PaymentMethods"));
const CustomerTags = lazy(() => import("./pages/CustomerTags"));
const ErrorLogs = lazy(() => import("./pages/ErrorLogs"));
const TimeSlotTemplates = lazy(() => import("./pages/TimeSlotTemplates"));
const AftercareManagement = lazy(() => import("./pages/AftercareManagement"));
const WeightTrackingManagement = lazy(() => import("./pages/WeightTrackingManagement"));
const DoseCalculation = lazy(() => import("./pages/DoseCalculation"));
const ApprovalQueue = lazy(() => import("./pages/ApprovalQueue"));
const RescheduleApproval = lazy(() => import("./pages/RescheduleApproval"));
const SlotLimitsSettings = lazy(() => import("./pages/SlotLimitsSettings"));
const MemberLevelManagement = lazy(() => import("./pages/MemberLevelManagement"));
const TimeSlotTemplateManagement = lazy(() => import("./pages/TimeSlotTemplateManagement"));
const AnalyticsDashboard = lazy(() => import("./pages/AnalyticsDashboard"));
const AftercareContentManagement = lazy(() => import("./pages/AftercareContentManagement"));
const LineConfigManagement = lazy(() => import("./pages/LineConfigManagement"));
const ServiceManagement = lazy(() => import("./pages/ServiceManagement"));
const MedicalRecordManagement = lazy(() => import("./pages/MedicalRecordManagement"));
const MedicalPhotoManagement = lazy(() => import("./pages/MedicalPhotoManagement"));
const ConsentFormManagement = lazy(() => import("./pages/ConsentFormManagement"));
const ReminderSettings = lazy(() => import("./pages/ReminderSettings"));
const ReminderHistory = lazy(() => import("./pages/ReminderHistory"));
const StaffManagement = lazy(() => import("./pages/StaffManagement"));
const CommissionRules = lazy(() => import("./pages/CommissionRules"));
const CommissionRecords = lazy(() => import("./pages/CommissionRecords"));
const PayrollDashboard = lazy(() => import("./pages/PayrollDashboard"));
const InventoryManagement = lazy(() => import("./pages/InventoryManagement"));
const ServiceMaterialManagement = lazy(() => import("./pages/ServiceMaterialManagement"));
const InventoryTransactionHistory = lazy(() => import("./pages/InventoryTransactionHistory"));
const LowStockAlerts = lazy(() => import("./pages/LowStockAlerts"));

// ─── Lazy-loaded LIFF Pages ────────────────────────────────────────────────
const LiffMemberCenter = lazy(() => import("./pages/LiffMemberCenter"));
const LiffCare = lazy(() => import("./pages/LiffCare"));
const LiffBookingForm = lazy(() => import("./pages/liff/BookingForm"));
const LiffMyAppointments = lazy(() => import("./pages/liff/MyAppointments"));
const LiffAppointmentDetail = lazy(() => import("./pages/liff/AppointmentDetail"));
const LiffShop = lazy(() => import("./pages/liff/Shop"));
const LiffNews = lazy(() => import("./pages/liff/News"));
const LiffConsent = lazy(() => import("./pages/liff/Consent"));
const LiffGamification = lazy(() => import("./pages/liff/Gamification"));

// ─── Lazy-loaded LIFF Staff Pages ──────────────────────────────────────────
const LiffStaffClock = lazy(() => import("./pages/liff/staff/Clock"));
const LiffStaffSchedule = lazy(() => import("./pages/liff/staff/Schedule"));
const LiffStaffAppointments = lazy(() => import("./pages/liff/staff/Appointments"));
const LiffStaffCustomers = lazy(() => import("./pages/liff/staff/Customers"));
const LiffStaffPerformance = lazy(() => import("./pages/liff/staff/Performance"));

// ─── Lazy-loaded Manage (Admin) Pages ──────────────────────────────────────
const ManageDashboard = lazy(() => import("./pages/manage/ManageDashboard"));
const GamificationManagement = lazy(() => import("./pages/manage/GamificationManagement"));
const NotificationManagement = lazy(() => import("./pages/manage/NotificationManagement"));
const ScheduleManagement = lazy(() => import("./pages/manage/ScheduleManagement"));
const ManageReports = lazy(() => import("./pages/manage/ManageReports"));
const UpgradePage = lazy(() => import("./pages/manage/UpgradePage"));
const UpgradePlan = lazy(() => import("./pages/manage/UpgradePlan"));

// ─── Lazy-loaded BI Dashboard & Marketing Automation ───────────────────────
const BIDashboard = lazy(() => import("./pages/BIDashboard"));
const SmartTagManagement = lazy(() => import("./pages/SmartTagManagement"));
const CampaignTemplateManagement = lazy(() => import("./pages/CampaignTemplateManagement"));
const CampaignExecution = lazy(() => import("./pages/CampaignExecution"));
const ComplianceKeywordManagement = lazy(() => import("./pages/ComplianceKeywordManagement"));

/** Wrap a page component with DashboardLayout + TenantProvider */
function DashboardPage({ component: Component }: { component: React.ComponentType }) {
  return (
    <TenantProvider>
      <DashboardLayout>
        <Component />
      </DashboardLayout>
    </TenantProvider>
  );
}

function Router() {
  return (
    <Suspense fallback={<PageLoadingFallback />}>
      <Switch>
        {/* === Public routes (no layout) === */}
        <Route path="/" component={Home} />
        <Route path="/tenant-register" component={TenantRegister} />
        <Route path="/tenant-login" component={TenantLogin} />
        <Route path="/admin-login" component={AdminLogin} />
        <Route path="/super-admin-login" component={SuperAdminLogin} />
        <Route path="/booking" component={BookingForm} />
        <Route path="/my-bookings" component={MyBookings} />
        <Route path="/liff/member" component={LiffMemberCenter} />
        <Route path="/liff/care" component={LiffCare} />
        <Route path="/liff/booking" component={LiffBookingForm} />
        <Route path="/liff/appointments" component={LiffMyAppointments} />
        <Route path="/liff/appointment/:id" component={LiffAppointmentDetail} />
        {/* === YaoYouQian Sprint 1: New LIFF Client Routes === */}
        <Route path="/liff/shop" component={LiffShop} />
        <Route path="/liff/news" component={LiffNews} />
        <Route path="/liff/consent" component={LiffConsent} />
        <Route path="/liff/gamification" component={LiffGamification} />
        {/* === YaoYouQian Sprint 1: LIFF Staff Routes === */}
        <Route path="/liff/staff/clock" component={LiffStaffClock} />
        <Route path="/liff/staff/schedule" component={LiffStaffSchedule} />
        <Route path="/liff/staff/appointments" component={LiffStaffAppointments} />
        <Route path="/liff/staff/customers" component={LiffStaffCustomers} />
        <Route path="/liff/staff/performance" component={LiffStaffPerformance} />

        {/* === Dashboard routes (DashboardLayout + TenantProvider) === */}
        <Route path="/tenant-dashboard">{() => <DashboardPage component={TenantDashboard} />}</Route>
        <Route path="/appointments">{() => <DashboardPage component={AppointmentManagement} />}</Route>
        <Route path="/slots">{() => <DashboardPage component={SlotManagement} />}</Route>
        <Route path="/reschedule">{() => <DashboardPage component={RescheduleRequests} />}</Route>
        <Route path="/customers">{() => <DashboardPage component={CustomerManagement} />}</Route>
        <Route path="/vouchers">{() => <DashboardPage component={VoucherManagement} />}</Route>
        <Route path="/marketing-campaigns">{() => <DashboardPage component={MarketingCampaignManagement} />}</Route>
        <Route path="/marketing-campaign-management">{() => <DashboardPage component={MarketingCampaignManagement} />}</Route>
        <Route path="/slot-calculator">{() => <DashboardPage component={SlotCalculatorManagement} />}</Route>
        <Route path="/customer-photos">{() => <DashboardPage component={CustomerPhotoManagement} />}</Route>
        <Route path="/deposits">{() => <DashboardPage component={DepositManagement} />}</Route>
        <Route path="/deposit-management">{() => <DashboardPage component={DepositManagement} />}</Route>
        <Route path="/whitelabel">{() => <DashboardPage component={WhiteLabelSettings} />}</Route>
        <Route path="/subscription">{() => <DashboardPage component={SubscriptionManagement} />}</Route>
        <Route path="/settings">{() => <DashboardPage component={TenantSettings} />}</Route>
        <Route path="/super-admin">{() => <DashboardPage component={SuperAdminDashboard} />}</Route>
        <Route path="/subscription/linepay">{() => <DashboardPage component={LinePaySubscription} />}</Route>
        <Route path="/weight-tracking">{() => <DashboardPage component={WeightTracking} />}</Route>
        <Route path="/products">{() => <DashboardPage component={ProductManagement} />}</Route>
        <Route path="/shop-orders">{() => <DashboardPage component={ShopOrders} />}</Route>
        <Route path="/aftercare">{() => <DashboardPage component={AftercareRecords} />}</Route>
        <Route path="/member-levels">{() => <DashboardPage component={MemberLevels} />}</Route>
        <Route path="/coupons">{() => <DashboardPage component={CouponManagement} />}</Route>
        <Route path="/referrals">{() => <DashboardPage component={ReferralProgram} />}</Route>
        <Route path="/promotions">{() => <DashboardPage component={MemberPromotions} />}</Route>
        <Route path="/payment-methods">{() => <DashboardPage component={PaymentMethods} />}</Route>
        <Route path="/customer-tags">{() => <DashboardPage component={CustomerTags} />}</Route>
        <Route path="/error-logs">{() => <DashboardPage component={ErrorLogs} />}</Route>
        <Route path="/time-slot-templates">{() => <DashboardPage component={TimeSlotTemplates} />}</Route>
        <Route path="/aftercare-management">{() => <DashboardPage component={AftercareManagement} />}</Route>
        <Route path="/weight-tracking-management">{() => <DashboardPage component={WeightTrackingManagement} />}</Route>
        <Route path="/dose-calculation">{() => <DashboardPage component={DoseCalculation} />}</Route>
        <Route path="/approval-queue">{() => <DashboardPage component={ApprovalQueue} />}</Route>
        <Route path="/reschedule-approval">{() => <DashboardPage component={RescheduleApproval} />}</Route>
        <Route path="/slot-limits">{() => <DashboardPage component={SlotLimitsSettings} />}</Route>
        <Route path="/member-level-management">{() => <DashboardPage component={MemberLevelManagement} />}</Route>
        <Route path="/time-slot-template-management">{() => <DashboardPage component={TimeSlotTemplateManagement} />}</Route>
        <Route path="/analytics-dashboard">{() => <DashboardPage component={AnalyticsDashboard} />}</Route>
        <Route path="/aftercare-content">{() => <DashboardPage component={AftercareContentManagement} />}</Route>
        <Route path="/line-config">{() => <DashboardPage component={LineConfigManagement} />}</Route>
        <Route path="/services">{() => <DashboardPage component={ServiceManagement} />}</Route>
        <Route path="/medical-records">{() => <DashboardPage component={MedicalRecordManagement} />}</Route>
        <Route path="/medical-photos">{() => <DashboardPage component={MedicalPhotoManagement} />}</Route>
        <Route path="/consent-forms">{() => <DashboardPage component={ConsentFormManagement} />}</Route>
        <Route path="/reminder-settings">{() => <DashboardPage component={ReminderSettings} />}</Route>
        <Route path="/reminder-history">{() => <DashboardPage component={ReminderHistory} />}</Route>

        {/* BI Dashboard & Marketing Automation */}
        <Route path="/bi-dashboard">{() => <DashboardPage component={BIDashboard} />}</Route>
        <Route path="/smart-tags">{() => <DashboardPage component={SmartTagManagement} />}</Route>
        <Route path="/campaign-templates">{() => <DashboardPage component={CampaignTemplateManagement} />}</Route>
        <Route path="/campaign-execution">{() => <DashboardPage component={CampaignExecution} />}</Route>
        <Route path="/compliance-keywords">{() => <DashboardPage component={ComplianceKeywordManagement} />}</Route>

        {/* === YaoYouQian Sprint 2-3: Manage Routes === */}
        <Route path="/manage">{() => <DashboardPage component={ManageDashboard} />}</Route>
        <Route path="/manage/dashboard">{() => <DashboardPage component={ManageDashboard} />}</Route>
        <Route path="/manage/appointments">{() => <DashboardPage component={AppointmentManagement} />}</Route>
        <Route path="/manage/customers">{() => <DashboardPage component={CustomerManagement} />}</Route>
        <Route path="/manage/staff">{() => <DashboardPage component={StaffManagement} />}</Route>
        <Route path="/manage/schedule">{() => <DashboardPage component={ScheduleManagement} />}</Route>
        <Route path="/manage/notifications">{() => <DashboardPage component={NotificationManagement} />}</Route>
        <Route path="/manage/gamification">{() => <DashboardPage component={GamificationManagement} />}</Route>
        <Route path="/manage/services">{() => <DashboardPage component={ServiceManagement} />}</Route>
        <Route path="/manage/products">{() => <DashboardPage component={ProductManagement} />}</Route>
        <Route path="/manage/reports">{() => <DashboardPage component={ManageReports} />}</Route>
        <Route path="/manage/settings">{() => <DashboardPage component={TenantSettings} />}</Route>
        <Route path="/manage/upgrade">{() => <DashboardPage component={UpgradePage} />}</Route>
        <Route path="/manage/upgrade-plan">{() => <DashboardPage component={UpgradePlan} />}</Route>
        {/* === HRM / Payroll routes === */}
        <Route path="/staff">{() => <DashboardPage component={StaffManagement} />}</Route>
        <Route path="/commission-rules">{() => <DashboardPage component={CommissionRules} />}</Route>
        <Route path="/commission-records">{() => <DashboardPage component={CommissionRecords} />}</Route>
        <Route path="/payroll">{() => <DashboardPage component={PayrollDashboard} />}</Route>

        {/* === ERP / Inventory routes === */}
        <Route path="/inventory">{() => <DashboardPage component={InventoryManagement} />}</Route>
        <Route path="/service-materials">{() => <DashboardPage component={ServiceMaterialManagement} />}</Route>
        <Route path="/inventory-transactions">{() => <DashboardPage component={InventoryTransactionHistory} />}</Route>
        <Route path="/low-stock-alerts">{() => <DashboardPage component={LowStockAlerts} />}</Route>

        <Route path="/404" component={NotFound} />
        <Route component={NotFound} />
      </Switch>
    </Suspense>
  );
}

function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider defaultTheme="dark">
        <TooltipProvider>
          <Toaster />
          <Router />
        </TooltipProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;
