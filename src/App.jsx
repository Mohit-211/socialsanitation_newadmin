/** @format */

import "./App.css";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Dashboard from "./pages/Dashboard/Dashboard";
import Login from "./pages/Login/Login";
import ChangePassword from "./pages/Sidebar/Settings/ChangePassword/ChangePassword";
import MainLayout from "./components/MainLayout";
import RoleList from "./pages/Roles/RoleList";
import AddRole from "./pages/Roles/AddRole";
import EditRole from "./pages/Roles/EditRole";
import AddCustomer from "./pages/Customer/AddCustomer";
import ViewCustomer from "./pages/Customer/ViewCustomer";
import AdminUser from "./pages/AdminManagement/AdminUser";
import ViewAdmin from "./pages/AdminManagement/ViewAdmin";
import AddAdmin from "./pages/AdminManagement/AddAdmin";
import EditAdmin from "./pages/AdminManagement/EditAdmin";
import LoginLogs from "./pages/Sidebar/LoginActivity/LoginLogs";
import Settings from "./pages/Sidebar/Settings/Settings";
import Service from "./pages/Services/Service";
import AddService from "./pages/Services/AddService";
import EditService from "./pages/Services/EditService";
import ViewService from "./pages/Services/ViewService";
import Bookings from "./pages/Bookings/Bookings";
import TermsAndConditions from "./pages/Content/TermsConditions/TermsAndConditions";
import AddTermsAndConditions from "./pages/Content/TermsConditions/AddTermsAndConditions";
import EditTermsAndConditions from "./pages/Content/TermsConditions/EditTermsAndConditions";
import Support from "./pages/Content/Support/Support";
import EditSupport from "./pages/Content/Support/EditSupport";
import AddSupport from "./pages/Content/Support/AddSupport";
import AboutUs from "./pages/Content/AboutUs/AboutUs";
import AddAboutUs from "./pages/Content/AboutUs/AddAboutUs";
import EditAboutUs from "./pages/Content/AboutUs/EditAboutUs";
import EditBookings from "./pages/Bookings/EditBookings";
import ViewBooking from "./pages/Bookings/ViewBooking";

import Error401 from "./pages/ErrorPages/Error401";
import User from "./pages/Customer/User";
import ServiceProvider from "./pages/ServiceProvider/ServiceProvider";
import AddServiceProvider from "./pages/ServiceProvider/AddServiceProvider";
import ViewServiceProvider from "./pages/ServiceProvider/ViewServiceProvider";
import BannerContent from "./pages/Content/BannerContent/BannerContent";
import AddBanner from "./pages/Content/BannerContent/AddBanner";
import EditBanner from "./pages/Content/BannerContent/EditBanner";
import AuthorizationSuccess from "./pages/Login/AuthorizationSuccess";
import AuthrizationFailure from "./pages/Login/AuthrizationFailure";
import ChatUI from "./pages/Chat/ChatUI";
import SyncCalendar from "./pages/Sidebar/Settings/SyncCalendar/SyncCalendar";
import ContactUs from "./pages/ContactUs/ContactUs";
import HiringForm from "./pages/HiringForm/HiringForm";
import JobApplication from "./pages/JobApplication/JobApplication";
import LeaveRequest from "./pages/LeaveRequest/LeaveRequest";
import Servicecheckllist from "./pages/ServiceChecklist/Servicecheckllist";
import BDM from "./pages/Bdm/BDM.jsx";
import AddBDM from "./pages/Bdm/AddBDM.jsx";
import AssignBdm from "./pages/Bdm/AssignBdm.jsx";
import Report from "./pages/Report/Report.jsx";
import DailyChecklist from "./pages/DailyChecklist/DailyChecklist.jsx";
import AddDailyChecklist from "./pages/DailyChecklist/AddDailyChecklist.jsx";
import EditDailyChecklist from "./pages/DailyChecklist/EditDailyChecklist.jsx";
import Payment from "./pages/Payment/Payment.jsx";
import AddServiceChecklist from "./pages/ServiceChecklist/AddServiceChecklist.jsx";
import EditServiceChecklist from "./pages/ServiceChecklist/EditServiceChecklist.jsx";
import ViewForm from "./pages/HiringForm/ViewForm.jsx";
import UpdateCustomer from "./pages/Customer/UpdateCustomer";
import ServiceQuote from "./pages/Customer/ServiceQuote.jsx";
import AllAttendance from "./pages/Attendence/AllAttendence.jsx";
import CreateBooking from "./pages/Bookings/CreateBooking.jsx";
import MonthlyBooking from "./pages/Bookings/MonthlyBooking.jsx";
import AttendanceCalendar from "./pages/Attendence/AttendenceCalender.jsx";
import ViewServiceChecklist from "./pages/ServiceChecklist/ViewServiceChecklist.jsx";
import WeeklyChecklistView from "./pages/DailyChecklist/WeeklyChecklistView.jsx";
import BDMGroupChat from "./pages/GroupChat/BDMGroupChat.jsx";
import WeeklyOverview from "./pages/WeeklyOverview/WeeklyOverview.jsx";
import DayDetail from "./pages/WeeklyOverview/DayDetails.jsx";
import GuestBooking from "./pages/Bookings/GuestBooking.jsx";
import Break from "./pages/Break/Break.jsx";
import TrainingVideos from "./pages/TrendingVideos/TrainingVideos.jsx";
import AddTrainingVideos from "./pages/TrendingVideos/AddTrainingVideos.jsx";
import EditTrainingVideos from "./pages/TrendingVideos/EditTrainingVideos.jsx";
import Product from "./pages/Product/Product.jsx";
import InventoryRequest from "./pages/Product/InventoryRequest.jsx";
import AddProduct from "./pages/Product/AddProduct.jsx";
import EditProduct from "./pages/Product/EditProduct.jsx";
import GanttView from "./pages/GanttView/GanttView.jsx";
import QuoteQuestions from "./pages/Quote/QuoteQuestions.jsx";
import QuoteRequests from "./pages/Quote/QuoteRequests.jsx";
import Invoices from "./pages/Invoice/Invoices.jsx";
import CheckoutStatus from "./pages/Checkout/CheckoutStatus.jsx";
import EmployeeTimesheet from "./pages/EmployeeTimesheet/EmployeeTimesheet.jsx";
import PdfGeneration from "./pages/PdfGeneration/PdfGeneration.jsx";
import GenerateEstimate from "./pages/PdfGeneration/GenerateEstimate.jsx";
import InvoiceForm from "./pages/GenerateInvoice/InvoiceForm.jsx";
import AllInvoices from "./pages/GenerateInvoice/AllInvoice.jsx";
import DocuSignSuccess from "./pages/PdfGeneration/DocuSignSuccess.jsx";
import ContractAgreement from "./pages/ContractAgreement/ContractAgreement.jsx";
import CreateContractAgreement from "./pages/ContractAgreement/CreateContractAgreement.jsx";
import ServiceRequest from "./pages/ServiceRequest/ServiceRequest";
import ServiceRequestPdf from "./pages/ServiceRequest/ServiceRequestPdf.jsx";
import EditInvoice from "./pages/GenerateInvoice/EditInvoice.jsx";
import EditBDM from "./pages/Bdm/EditBDM.jsx";
import ScopeBuilder from "./pages/PdfGeneration/ScopeBuilder.jsx";
import BusinessAnalytics from "./pages/Payment/BusinessAnalytics.jsx";
import CostCalculator from "./pages/CostCalculator/CostCalculator.jsx";
import Calculator from "./pages/CostCalculator/index.jsx";
import CostCalculationSettings from "./pages/CostCalculator/CostCalculationSettings.jsx";
import UpdateServiceQuote from "./pages/ServiceQuote/UpdateServiceQuote.jsx";
import EditServiceRequest from "./pages/ServiceRequest/EditServiceRequest.jsx";
import EditContractAgreement from "./pages/ContractAgreement/EditContractAgreement.jsx";
import UpdateServiceEstimate from "./pages/PdfGeneration/UpdateServiceEstimate.jsx";
import EquipmentPage from "./pages/Equipment/Equipment/EquipmentPage.jsx";
import AssignmentPage from "./pages/Equipment/Assign/Assignmentpage.jsx";
import UpdateServiceProvider from "./pages/ServiceProvider/UpdateServiceProvider.jsx";

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/docusign-success" element={<DocuSignSuccess />} />
        <Route path="/checkout/:transactionId" element={<CheckoutStatus />} />
        <Route path="/Login" element={<Login />} />
        <Route path="/error401" element={<Error401 />} />
        <Route
          path="/authorization-success/:token"
          element={<AuthorizationSuccess />}
        />
        <Route
          path="/authorization-failure"
          element={<AuthrizationFailure />}
        />
        <Route path="/chats" element={<ChatUI />} />
        <Route path="/group-chats" element={<BDMGroupChat />} />
        <Route path="/" element={<MainLayout />}>
          <Route index element={<Dashboard />} />
          <Route path="/reset-password" element={<ChangePassword />} />
          <Route path="/employees" element={<ServiceProvider />} />
          <Route path="/addEmployee" element={<AddServiceProvider />} />
          <Route path="/editEmployee/:id" element={<UpdateServiceProvider />} />
          <Route path="/viewEmployee/:id" element={<ViewServiceProvider />} />
          <Route path="/addUser" element={<AddCustomer />} />
          <Route path="/editUser/:id" element={<UpdateCustomer />} />
          <Route path="/viewUser/:id" element={<ViewCustomer />} />
          <Route path="/role-list" element={<RoleList />} />
          <Route path="/addRole" element={<AddRole />} />
          <Route path="/editRole/:id" element={<EditRole />} />
          <Route path="/adminList" element={<AdminUser />} />
          <Route path="/viewAdmin" element={<ViewAdmin />} />
          <Route path="/addAdmin" element={<AddAdmin />} />
          <Route path="/editAdmin/:id" element={<EditAdmin />} />
          <Route path="/loginLogs" element={<LoginLogs />} />
          <Route path="/settings" element={<Settings />} />
          <Route path="/services" element={<Service />} />
          <Route path="/addService" element={<AddService />} />
          <Route path="/editService/:id" element={<EditService />} />
          <Route path="/viewService/:id" element={<ViewService />} />
          <Route path="/bookings" element={<Bookings />} />
          <Route path="/editBooking/:id" element={<EditBookings />} />
          <Route path="/viewBooking/:id" element={<ViewBooking />} />

          <Route path="/termsAndConditions" element={<TermsAndConditions />} />
          <Route
            path="/addTermsAndConditions"
            element={<AddTermsAndConditions />}
          />
          <Route
            path="/editTermsAndConditions"
            element={<EditTermsAndConditions />}
          />
          <Route path="/support" element={<Support />} />
          <Route path="/editSupport/:id" element={<EditSupport />} />
          <Route path="/addSupport" element={<AddSupport />} />
          <Route path="/aboutUs" element={<AboutUs />} />
          <Route path="/addAboutUs" element={<AddAboutUs />} />
          <Route path="/editAboutUs" element={<EditAboutUs />} />
          <Route path="/users" element={<User />} />
          <Route path="/banner" element={<BannerContent />} />
          <Route path="/addBanner" element={<AddBanner />} />
          <Route path="/editBanner/:id" element={<EditBanner />} />
          <Route path="/SyncCalendar" element={<SyncCalendar />} />
          <Route path="/contact-us" element={<ContactUs />} />
          <Route path="/hiring-form" element={<HiringForm />} />
          <Route path="/hiring-form-view/:id" element={<JobApplication />} />
          <Route path="/leave-request" element={<LeaveRequest />} />
          <Route path="/checklist" element={<Servicecheckllist />} />
          <Route path="/add-checklist" element={<AddServiceChecklist />} />
          <Route
            path="/edit-checklist/:id"
            element={<EditServiceChecklist />}
          />
          <Route path="/bdm-list" element={<BDM />} />
          <Route path="/add-bdm" element={<AddBDM />} />
          <Route path="/assign/:id" element={<AssignBdm />} />
          <Route path="/reports" element={<Report />} />
          <Route path="/daily-checklist" element={<DailyChecklist />} />
          <Route path="/add-daily-checklist" element={<AddDailyChecklist />} />
          <Route
            path="/edit-daily-checklist/:id"
            element={<EditDailyChecklist />}
          />
          <Route
            path="/view-daily-checklist/:id"
            element={<ViewServiceChecklist />}
          />
          <Route path="/payment-history" element={<Payment />} />
          <Route path="/view-form/:id" element={<ViewForm />} />
          <Route path="/service-quote/:id" element={<ServiceQuote />} />
          <Route path="/attendence" element={<AllAttendance />} />
          <Route path="/create-client-booking" element={<CreateBooking />} />
          <Route path="/monthlyCalendar" element={<MonthlyBooking />} />
          <Route path="/attendanceCalendar" element={<AttendanceCalendar />} />
          <Route
            path="/weeklyChecklistView"
            element={<WeeklyChecklistView />}
          />
          <Route path="/weeklyOverview" element={<WeeklyOverview />} />
          <Route path="/day-overview/:booking_id" element={<DayDetail />} />
          <Route path="/create-non-client-booking" element={<GuestBooking />} />
          <Route path="/breaks" element={<Break />} />
          <Route path="/training-videos" element={<TrainingVideos />} />
          <Route path="/add-training-videos" element={<AddTrainingVideos />} />
          <Route
            path="/edit-training-videos/:id"
            element={<EditTrainingVideos />}
          />
          <Route path="/supplies/list" element={<Product />} />
          <Route path="/addProduct" element={<AddProduct />} />
          <Route path="/editProduct/:id" element={<EditProduct />} />
          <Route path="/supplies/requests" element={<InventoryRequest />} />
          <Route path="/overview" element={<GanttView />} />
          <Route path="/quote-questions" element={<QuoteQuestions />} />
          <Route path="/quote-requests" element={<QuoteRequests />} />
          <Route path="/invoices" element={<Invoices />} />
          <Route path="/employee-timesheet" element={<EmployeeTimesheet />} />
          <Route path="/pdf-generation" element={<PdfGeneration />} />
          <Route path="/generate-estimate" element={<GenerateEstimate />} />
          <Route path="/all-invoices" element={<AllInvoices />} />
          <Route path="/generate-invoice" element={<InvoiceForm />} />
          <Route path="/edit-invoice/:id" element={<EditInvoice />} />
          <Route path="/contract-agreement" element={<ContractAgreement />} />
          <Route
            path="/create-contract-agreement"
            element={<CreateContractAgreement />}
          />
          <Route path="/service-request" element={<ServiceRequest />} />
          <Route
            path="/generate-service-request"
            element={<ServiceRequestPdf />}
          />
          <Route path="/edit-bdm/:id" element={<EditBDM />} />
          <Route path="/universal-scope-of-work" element={<ScopeBuilder />} />
          <Route path="/invoiceAnalytics" element={<BusinessAnalytics />} />
          <Route path="/cost-calculator" element={<Calculator />} />
          <Route
            path="/cost-calculation-settings"
            element={<CostCalculationSettings />}
          />
          <Route
            path="/edit-service-quote/:id"
            element={<UpdateServiceQuote />}
          />

          <Route
            path="/edit-service-request/:id"
            element={<EditServiceRequest />}
          />

          <Route
            path="/edit-contract-agreement/:id"
            element={<EditContractAgreement />}
          />
          <Route
            path="/edit-service-estimate/:id"
            element={<UpdateServiceEstimate />}
          />
          <Route path="/equipment/list" element={<EquipmentPage />} />
          <Route path="/equipment/assignments" element={<AssignmentPage />} />
        </Route>
      </Routes>
    </Router>
  );
}

export default App;
