import { lazy, Suspense } from "react";
import { Navigate, Route, Routes, useParams } from "react-router";
import MainLayout from "@/layouts/MainLayout";
import PageLoader from "@/components/PageLoader";
// Not lazy: MainLayout also renders the login page for signed-out users, so it
// belongs in the main bundle.
import LoginPage from "@/pages/auth/LoginPage";

// Every other page is loaded on demand, so the first visit only downloads the app
// shell and the page being opened. Pages inside MainLayout show their loader
// inside the layout (see MainLayout); the outer fallback covers public pages.
const DashboardPage = lazy(() => import("@/pages/dashboard/DashboardPage"));
const ChangePasswordPage = lazy(() => import("@/pages/account/ChangePasswordPage"));
const AddClientPage = lazy(() => import("@/pages/clients/AddClientPage"));
const ClientDetailsPage = lazy(() => import("@/pages/clients/ClientDetailsPage"));
const AdminsPage = lazy(() => import("@/pages/admins/AdminsPage"));
const ProfilePage = lazy(() => import("@/pages/account/ProfilePage"));
const AddAdminPage = lazy(() => import("@/pages/admins/AddAdminPage"));
const EditAdminPage = lazy(() => import("@/pages/admins/EditAdminPage"));
const LoginActivityPage = lazy(() => import("@/pages/account/LoginActivityPage"));
const ServicesPage = lazy(() => import("@/pages/services/ServicesPage"));
const AddServicePage = lazy(() => import("@/pages/services/AddServicePage"));
const EditServicePage = lazy(() => import("@/pages/services/EditServicePage"));
const ServiceDetailsPage = lazy(() => import("@/pages/services/ServiceDetailsPage"));
const BookingsPage = lazy(() => import("@/pages/bookings/BookingsPage"));
const EditBookingPage = lazy(() => import("@/pages/bookings/EditBookingPage"));
const BookingDetailsPage = lazy(() => import("@/pages/bookings/BookingDetailsPage"));
const UnauthorizedPage = lazy(() => import("@/pages/errors/UnauthorizedPage"));
const ClientsPage = lazy(() => import("@/pages/clients/ClientsPage"));
const EmployeesPage = lazy(() => import("@/pages/employees/EmployeesPage"));
const AddEmployeePage = lazy(() => import("@/pages/employees/AddEmployeePage"));
const EmployeeDetailsPage = lazy(() => import("@/pages/employees/EmployeeDetailsPage"));
const ChatPage = lazy(() => import("@/pages/chat/ChatPage"));
const HiringFormsPage = lazy(() => import("@/pages/hiring/HiringFormsPage"));
const LeaveRequestsPage = lazy(() => import("@/pages/leave-requests/LeaveRequestsPage"));
const ServiceChecklistsPage = lazy(() => import("@/pages/service-checklists/ServiceChecklistsPage"));
const BdmsPage = lazy(() => import("@/pages/bdm/BdmsPage"));
const AssignBdmPage = lazy(() => import("@/pages/bdm/AssignBdmPage"));
const ProfileRequestsPage = lazy(() => import("@/pages/profile-requests/ProfileRequestsPage"));
const ComplaintsPage = lazy(() => import("@/pages/complaints/ComplaintsPage"));
const DailyChecklistsPage = lazy(() => import("@/pages/daily-checklists/DailyChecklistsPage"));
const AddDailyChecklistPage = lazy(() => import("@/pages/daily-checklists/AddDailyChecklistPage"));
const EditDailyChecklistPage = lazy(() => import("@/pages/daily-checklists/EditDailyChecklistPage"));
const AddServiceChecklistPage = lazy(() => import("@/pages/service-checklists/AddServiceChecklistPage"));
const EditServiceChecklistPage = lazy(() => import("@/pages/service-checklists/EditServiceChecklistPage"));
const HiringFormDetailsPage = lazy(() => import("@/pages/hiring/HiringFormDetailsPage"));
const EditClientPage = lazy(() => import("@/pages/clients/EditClientPage"));
const CreateServiceQuotePage = lazy(() => import("@/pages/service-quotes/CreateServiceQuotePage"));
const AttendancePage = lazy(() => import("@/pages/attendance/AttendancePage"));
const CreateBookingPage = lazy(() => import("@/pages/bookings/CreateBookingPage"));
const BookingSeriesPage = lazy(() => import("@/pages/bookings/BookingSeriesPage"));
const RepeatingBookingsPage = lazy(() => import("@/pages/bookings/RepeatingBookingsPage"));
const BookingCalendarPage = lazy(() => import("@/pages/bookings/BookingCalendarPage"));
const AttendanceCalendarPage = lazy(() => import("@/pages/attendance/AttendanceCalendarPage"));
const ServiceChecklistDetailsPage = lazy(() => import("@/pages/service-checklists/ServiceChecklistDetailsPage"));
const WeeklyChecklistPage = lazy(() => import("@/pages/daily-checklists/WeeklyChecklistPage"));
const GroupChatPage = lazy(() => import("@/pages/chat/GroupChatPage"));
const SchedulePage = lazy(() => import("@/pages/schedule/SchedulePage"));
const DayDetailsPage = lazy(() => import("@/pages/schedule/DayDetailsPage"));
const BreaksPage = lazy(() => import("@/pages/breaks/BreaksPage"));
const TrainingVideosPage = lazy(() => import("@/pages/training-videos/TrainingVideosPage"));
const AddTrainingVideoPage = lazy(() => import("@/pages/training-videos/AddTrainingVideoPage"));
const EditTrainingVideoPage = lazy(() => import("@/pages/training-videos/EditTrainingVideoPage"));
const ProductsPage = lazy(() => import("@/pages/supplies/ProductsPage"));
const RestockRequestsPage = lazy(() => import("@/pages/supplies/RestockRequestsPage"));
const AddProductPage = lazy(() => import("@/pages/supplies/AddProductPage"));
const EditProductPage = lazy(() => import("@/pages/supplies/EditProductPage"));
const DayOverviewPage = lazy(() => import("@/pages/day-overview/DayOverviewPage"));
const EnquiriesPage = lazy(() => import("@/pages/enquiries/EnquiriesPage"));
const ServiceQuotesPage = lazy(() => import("@/pages/service-quotes/ServiceQuotesPage"));
const CheckoutStatusPage = lazy(() => import("@/pages/checkout/CheckoutStatusPage"));
const EmployeeTimesheetPage = lazy(() => import("@/pages/timesheets/EmployeeTimesheetPage"));
const EstimatesPage = lazy(() => import("@/pages/estimates/EstimatesPage"));
const CreateEstimatePage = lazy(() => import("@/pages/estimates/CreateEstimatePage"));
const CreateInvoicePage = lazy(() => import("@/pages/invoices/CreateInvoicePage"));
const InvoicesPage = lazy(() => import("@/pages/invoices/InvoicesPage"));
const DocuSignSuccessPage = lazy(() => import("@/pages/docusign/DocuSignSuccessPage"));
const ContractsPage = lazy(() => import("@/pages/contracts/ContractsPage"));
const CreateContractPage = lazy(() => import("@/pages/contracts/CreateContractPage"));
const ServiceRequestsPage = lazy(() => import("@/pages/service-requests/ServiceRequestsPage"));
const CreateServiceRequestPage = lazy(() => import("@/pages/service-requests/CreateServiceRequestPage"));
const EditInvoicePage = lazy(() => import("@/pages/invoices/EditInvoicePage"));
const ScopeOfWorkPage = lazy(() => import("@/pages/scope-of-work/ScopeOfWorkPage"));
const InvoiceAnalyticsPage = lazy(() => import("@/pages/invoices/InvoiceAnalyticsPage"));
const CostCalculatorPage = lazy(() => import("@/pages/cost-calculator/CostCalculatorPage"));
const CostSettingsPage = lazy(() => import("@/pages/cost-calculator/CostSettingsPage"));
const EditServiceQuotePage = lazy(() => import("@/pages/service-quotes/EditServiceQuotePage"));
const EditServiceRequestPage = lazy(() => import("@/pages/service-requests/EditServiceRequestPage"));
const EditContractPage = lazy(() => import("@/pages/contracts/EditContractPage"));
const EditEstimatePage = lazy(() => import("@/pages/estimates/EditEstimatePage"));
const EquipmentPage = lazy(() => import("@/pages/equipment/EquipmentPage"));
const EquipmentAssignmentsPage = lazy(() => import("@/pages/equipment/EquipmentAssignmentsPage"));
const EditEmployeePage = lazy(() => import("@/pages/employees/EditEmployeePage"));
const EmployeeEquipmentRecordsPage = lazy(() => import("@/pages/equipment/EmployeeEquipmentRecordsPage"));
const ClientInspectionsPage = lazy(() => import("@/pages/inspections/ClientInspectionsPage"));
const InspectionDetailsPage = lazy(() => import("@/pages/inspections/InspectionDetailsPage"));
const ClientScopeOfWorkPage = lazy(() => import("@/pages/scope-of-work/ClientScopeOfWorkPage"));
const TeamsPage = lazy(() => import("@/pages/chat/TeamsPage"));

// An old /edit-bdm/:id link: the BDM is edited as the employee they are.
const EditBdmRedirect = () => {
  const { id } = useParams();
  return <Navigate to={`/editEmployee/${id}`} replace />;
};

// An old /client-scope/:clientId link: the client page lists their scopes.
const ClientScopesRedirect = () => {
  const { id } = useParams();
  return <Navigate to={`/viewUser/${id}?tab=scopes`} replace />;
};

const AppRoutes = () => (
  <Suspense fallback={<PageLoader fullScreen />}>
    <Routes>
      <Route path="/docusign-success" element={<DocuSignSuccessPage />} />
      <Route path="/checkout" element={<CheckoutStatusPage />} />
      <Route path="/checkout/:transactionId" element={<CheckoutStatusPage />} />
      <Route path="/Login" element={<LoginPage />} />
      <Route path="/error401" element={<UnauthorizedPage />} />
      <Route path="/chats" element={<ChatPage />} />
      <Route path="/group-chats" element={<GroupChatPage />} />
      <Route path="/teams" element={<TeamsPage />} />
      <Route path="/" element={<MainLayout />}>
        <Route index element={<DashboardPage />} />
        <Route path="/reset-password" element={<ChangePasswordPage />} />
        <Route path="/employees" element={<EmployeesPage />} />
        <Route path="/addEmployee" element={<AddEmployeePage />} />
        <Route path="/editEmployee/:id" element={<EditEmployeePage />} />
        <Route path="/viewEmployee/:id" element={<EmployeeDetailsPage />} />
        <Route path="/addUser" element={<AddClientPage />} />
        <Route path="/editUser/:id" element={<EditClientPage />} />
        <Route path="/viewUser/:id" element={<ClientDetailsPage />} />
        <Route path="/adminList" element={<AdminsPage />} />
        <Route path="/viewAdmin" element={<ProfilePage />} />
        <Route path="/addAdmin" element={<AddAdminPage />} />
        <Route path="/editAdmin/:id" element={<EditAdminPage />} />
        <Route path="/loginLogs" element={<LoginActivityPage />} />
        <Route path="/services" element={<ServicesPage />} />
        <Route path="/addService" element={<AddServicePage />} />
        <Route path="/editService/:id" element={<EditServicePage />} />
        <Route path="/viewService/:id" element={<ServiceDetailsPage />} />
        <Route path="/bookings" element={<BookingsPage />} />
        <Route path="/editBooking/:id" element={<EditBookingPage />} />
        <Route path="/viewBooking/:id" element={<BookingDetailsPage />} />

        <Route path="/users" element={<ClientsPage />} />

        <Route path="/hiring-form" element={<HiringFormsPage />} />
        <Route path="/leave-request" element={<LeaveRequestsPage />} />
        <Route path="/checklist" element={<ServiceChecklistsPage />} />
        <Route path="/add-checklist" element={<AddServiceChecklistPage />} />
        <Route
          path="/edit-checklist/:id"
          element={<EditServiceChecklistPage />}
        />
        <Route path="/bdm-list" element={<BdmsPage />} />
        {/* BDMs are employees with the BDM role: old links open the employee form. */}
        <Route path="/add-bdm" element={<Navigate to="/addEmployee?role=bdm" replace />} />
        <Route path="/assign/:id" element={<AssignBdmPage />} />
        <Route path="/profile-requests" element={<ProfileRequestsPage />} />
        <Route path="/reports" element={<ComplaintsPage />} />
        <Route path="/daily-checklist" element={<DailyChecklistsPage />} />
        <Route path="/add-daily-checklist" element={<AddDailyChecklistPage />} />
        <Route
          path="/edit-daily-checklist/:id"
          element={<EditDailyChecklistPage />}
        />
        <Route
          path="/view-daily-checklist/:id"
          element={<ServiceChecklistDetailsPage />}
        />
        <Route path="/view-form/:id" element={<HiringFormDetailsPage />} />
        <Route path="/service-quote/:id" element={<CreateServiceQuotePage />} />
        <Route path="/attendance" element={<AttendancePage />} />
        <Route path="/create-client-booking" element={<CreateBookingPage />} />
        <Route path="/booking-series/:id" element={<BookingSeriesPage />} />
        <Route path="/repeating-bookings" element={<RepeatingBookingsPage />} />
        <Route path="/monthlyCalendar" element={<BookingCalendarPage />} />
        <Route path="/attendanceCalendar" element={<AttendanceCalendarPage />} />
        <Route
          path="/weeklyChecklistView"
          element={<WeeklyChecklistPage />}
        />
        <Route path="/weeklyOverview" element={<SchedulePage />} />
        <Route path="/day-overview/:booking_id" element={<DayDetailsPage />} />
        <Route path="/create-non-client-booking" element={<CreateBookingPage forGuest />} />
        <Route path="/breaks" element={<BreaksPage />} />
        <Route path="/training-videos" element={<TrainingVideosPage />} />
        <Route path="/add-training-videos" element={<AddTrainingVideoPage />} />
        <Route
          path="/edit-training-videos/:id"
          element={<EditTrainingVideoPage />}
        />
        <Route path="/supplies/list" element={<ProductsPage />} />
        <Route path="/addProduct" element={<AddProductPage />} />
        <Route path="/editProduct/:id" element={<EditProductPage />} />
        <Route path="/supplies/requests" element={<RestockRequestsPage />} />
        <Route path="/overview" element={<DayOverviewPage />} />
        <Route path="/enquiries" element={<EnquiriesPage />} />
        {/* The quote form became the enquiry form; its question builder is gone. */}
        <Route path="/quote-requests" element={<Navigate to="/enquiries" replace />} />
        <Route path="/quote-questions" element={<Navigate to="/enquiries" replace />} />
        <Route path="/invoices" element={<ServiceQuotesPage />} />
        <Route path="/employee-timesheet" element={<EmployeeTimesheetPage />} />
        <Route path="/pdf-generation" element={<EstimatesPage />} />
        <Route path="/generate-estimate" element={<CreateEstimatePage />} />
        <Route path="/all-invoices" element={<InvoicesPage />} />
        <Route path="/generate-invoice" element={<CreateInvoicePage />} />
        <Route path="/edit-invoice/:id" element={<EditInvoicePage />} />
        <Route path="/contract-agreement" element={<ContractsPage />} />
        <Route
          path="/create-contract-agreement"
          element={<CreateContractPage />}
        />
        <Route path="/service-request" element={<ServiceRequestsPage />} />
        <Route
          path="/generate-service-request"
          element={<CreateServiceRequestPage />}
        />
        <Route path="/edit-bdm/:id" element={<EditBdmRedirect />} />
        <Route path="/universal-scope-of-work" element={<ScopeOfWorkPage />} />
        <Route path="/invoiceAnalytics" element={<InvoiceAnalyticsPage />} />
        <Route path="/cost-calculator" element={<CostCalculatorPage />} />
        <Route
          path="/cost-calculation-settings"
          element={<CostSettingsPage />}
        />
        <Route
          path="/edit-service-quote/:id"
          element={<EditServiceQuotePage />}
        />
        <Route
          path="/edit-service-request/:id"
          element={<EditServiceRequestPage />}
        />
        <Route
          path="/edit-contract-agreement/:id"
          element={<EditContractPage />}
        />
        <Route
          path="/edit-service-estimate/:id"
          element={<EditEstimatePage />}
        />
        <Route path="/equipment/list" element={<EquipmentPage />} />
        <Route path="/equipment/assignments" element={<EquipmentAssignmentsPage />} />
        <Route
          path="/equipment/employee-records"
          element={<EmployeeEquipmentRecordsPage />}
        />
        <Route
          path="/clientInspections/:id"
          element={<ClientInspectionsPage />}
        />
        <Route path="/scopes/:id" element={<ClientScopeOfWorkPage />} />
        {/* A client has many scopes now: an old link opens the client's scopes. */}
        <Route path="/client-scope/:id" element={<ClientScopesRedirect />} />
        <Route path="/inspection/:id" element={<InspectionDetailsPage />} />
      </Route>
    </Routes>
  </Suspense>
);

export default AppRoutes;
