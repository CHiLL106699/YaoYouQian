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
import LiffMemberCenter from "./pages/LiffMemberCenter";
import LiffCare from "./pages/LiffCare";
import LiffBookingForm from "./pages/liff/BookingForm";
import LiffMyAppointments from "./pages/liff/MyAppointments";
import LiffAppointmentDetail from "./pages/liff/AppointmentDetail";

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

      {/* === Dashboard routes (DashboardLayout + TenantProvider) === */}
      <Route path="/tenant-dashboard">{() => <DashboardPage component={TenantDashboard} />}</Route>
      <Route path="/appointments">{() => <DashboardPage component={AppointmentManagement} />}</Route>
      <Route path="/slots">{() => <DashboardPage component={SlotManagement} />}</Route>
      <Route path="/reschedule">{() => <DashboardPage component={RescheduleRequests} />}</Route>
      <Route path="/customers">{() => <DashboardPage component={CustomerManagement} />}</Route>
      <Route path="/vouchers">{() => <DashboardPage component={VoucherManagement} />}</Route>
      <Route path="/marketing-campaigns">{() => <DashboardPage component={MarketingCampaignManagement} />}</Route>
      <Route path="/slot-calculator">{() => <DashboardPage component={SlotCalculatorManagement} />}</Route>
      <Route path="/customer-photos">{() => <DashboardPage component={CustomerPhotoManagement} />}</Route>
      <Route path="/deposits">{() => <DashboardPage component={DepositManagement} />}</Route>
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
