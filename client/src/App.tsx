import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/NotFound";
import { Route, Switch } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
import DashboardLayout from "./components/DashboardLayout";
import { ThemeProvider } from "./contexts/ThemeContext";
import { TenantProvider } from "./contexts/TenantContext";
import { lazy, Suspense } from "react";

// Public pages (no auth required)
import Home from "./pages/Home";
import TenantRegister from "./pages/TenantRegister";
import TenantLogin from "./pages/TenantLogin";
import AdminLogin from "./pages/AdminLogin";
import SuperAdminLogin from "./pages/SuperAdminLogin";
import BookingForm from "./pages/BookingForm";
import MyBookings from "./pages/MyBookings";

// Dashboard pages (auth + tenant required, wrapped in DashboardLayout)
import TenantDashboard from "./pages/TenantDashboard";
import AppointmentManagement from "./pages/AppointmentManagement";
import SlotManagement from "./pages/SlotManagement";
import RescheduleRequests from "./pages/RescheduleRequests";
import CustomerManagement from "./pages/CustomerManagement";
import VoucherManagement from "./pages/VoucherManagement";
import MarketingCampaignManagement from "./pages/MarketingCampaignManagement";
import SlotCalculatorManagement from "./pages/SlotCalculatorManagement";
import CustomerPhotoManagement from "./pages/CustomerPhotoManagement";
import DepositManagement from "./pages/DepositManagement";
import WhiteLabelSettings from "./pages/WhiteLabelSettings";
import SubscriptionManagement from "./pages/SubscriptionManagement";
import TenantSettings from "./pages/TenantSettings";
import SuperAdminDashboard from "./pages/SuperAdminDashboard";
import LinePaySubscription from "./pages/LinePaySubscription";
import WeightTracking from "./pages/WeightTracking";
import ProductManagement from "./pages/ProductManagement";
import ShopOrders from "./pages/ShopOrders";
import AftercareRecords from "./pages/AftercareRecords";
import MemberLevels from "./pages/MemberLevels";
import CouponManagement from "./pages/CouponManagement";
import ReferralProgram from "./pages/ReferralProgram";
import MemberPromotions from "./pages/MemberPromotions";
import PaymentMethods from "./pages/PaymentMethods";
import CustomerTags from "./pages/CustomerTags";
import ErrorLogs from "./pages/ErrorLogs";
import TimeSlotTemplates from "./pages/TimeSlotTemplates";
import AftercareManagement from "./pages/AftercareManagement";
import WeightTrackingManagement from "./pages/WeightTrackingManagement";
import DoseCalculation from "./pages/DoseCalculation";
import ApprovalQueue from "./pages/ApprovalQueue";
import RescheduleApproval from "./pages/RescheduleApproval";
import SlotLimitsSettings from "./pages/SlotLimitsSettings";
import MemberLevelManagement from "./pages/MemberLevelManagement";
import TimeSlotTemplateManagement from "./pages/TimeSlotTemplateManagement";
import AnalyticsDashboard from "./pages/AnalyticsDashboard";
import AftercareContentManagement from "./pages/AftercareContentManagement";
import LineConfigManagement from "./pages/LineConfigManagement";
import ServiceManagement from "./pages/ServiceManagement";
import MedicalRecordManagement from "./pages/MedicalRecordManagement";
import MedicalPhotoManagement from "./pages/MedicalPhotoManagement";
import ConsentFormManagement from "./pages/ConsentFormManagement";
import ReminderSettings from "./pages/ReminderSettings";
import ReminderHistory from "./pages/ReminderHistory";
import StaffManagement from "./pages/StaffManagement";
import CommissionRules from "./pages/CommissionRules";
import CommissionRecords from "./pages/CommissionRecords";
import PayrollDashboard from "./pages/PayrollDashboard";
import InventoryManagement from "./pages/InventoryManagement";
import ServiceMaterialManagement from "./pages/ServiceMaterialManagement";
import InventoryTransactionHistory from "./pages/InventoryTransactionHistory";
import LowStockAlerts from "./pages/LowStockAlerts";
import LiffMemberCenter from "./pages/LiffMemberCenter";
import LiffCare from "./pages/LiffCare";
import LiffBookingForm from "./pages/liff/BookingForm";
import LiffMyAppointments from "./pages/liff/MyAppointments";
import LiffAppointmentDetail from "./pages/liff/AppointmentDetail";

// === YaoYouQian Sprint 1: New LIFF Client Pages ===
import LiffShop from "./pages/liff/Shop";
import LiffNews from "./pages/liff/News";
import LiffConsent from "./pages/liff/Consent";
import LiffGamification from "./pages/liff/Gamification";

// === YaoYouQian Sprint 1: LIFF Staff Pages ===
import LiffStaffClock from "./pages/liff/staff/Clock";
import LiffStaffSchedule from "./pages/liff/staff/Schedule";
import LiffStaffAppointments from "./pages/liff/staff/Appointments";
import LiffStaffCustomers from "./pages/liff/staff/Customers";
import LiffStaffPerformance from "./pages/liff/staff/Performance";

// === YaoYouQian Sprint 2-3: Manage (Admin) Pages ===
import ManageDashboard from "./pages/manage/ManageDashboard";
import GamificationManagement from "./pages/manage/GamificationManagement";
import NotificationManagement from "./pages/manage/NotificationManagement";
import ScheduleManagement from "./pages/manage/ScheduleManagement";
import ManageReports from "./pages/manage/ManageReports";
import UpgradePage from "./pages/manage/UpgradePage";
import UpgradePlan from "./pages/manage/UpgradePlan";

// BI Dashboard & Marketing Automation pages
import BIDashboard from "./pages/BIDashboard";
import SmartTagManagement from "./pages/SmartTagManagement";
import CampaignTemplateManagement from "./pages/CampaignTemplateManagement";
import CampaignExecution from "./pages/CampaignExecution";
import ComplianceKeywordManagement from "./pages/ComplianceKeywordManagement";

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
