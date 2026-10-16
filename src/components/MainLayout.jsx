import { useState, useEffect, useSyncExternalStore } from "react";
import {
  MenuFoldOutlined,
  MenuUnfoldOutlined,
  FileTextOutlined,
} from "@ant-design/icons";
import { AiOutlineDashboard } from "react-icons/ai";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { Link, Outlet, useNavigate } from "react-router-dom";
import {
  FaBoxes,
  FaClipboardList,
  FaCog,
  FaToolbox,
  FaUsers,
  FaFileInvoiceDollar,
  FaCalculator,
  FaRegCalendarAlt,
} from "react-icons/fa";
import { IoMdChatboxes } from "react-icons/io";
import {
  FaChartGantt,
  FaRegCircleUser,
  FaFilePdf,
  FaRegCirclePause,
  FaUserTie,
  FaRegCalendar,
} from "react-icons/fa6";
import { Layout, Menu, Modal, message } from "antd";
import { BiSolidCategoryAlt } from "react-icons/bi";
import {
  MdManageAccounts,
  MdCategory,
  MdVideoLibrary,
  MdOutlineReportGmailerrorred,
} from "react-icons/md";
import Login from "../pages/Login/Login";
import {
  GetAdminProfile,
  GetReviewLink,
  CreateOrUpdateReviewLink,
} from "../services/Api/Api";
import { GiProgression } from "react-icons/gi";
import { LuLayoutList } from "react-icons/lu";
import { PiCalendarCheckFill, PiChatsFill } from "react-icons/pi";
import { TbBrandBooking, TbBrandCashapp } from "react-icons/tb";
import { VscChecklist } from "react-icons/vsc";
import { IoInformationCircle } from "react-icons/io5";
import Box from "@mui/material/Box";
import MuiButton from "@mui/material/Button";
import TextField from "@mui/material/TextField";
import InputAdornment from "@mui/material/InputAdornment";
import Typography from "@mui/material/Typography";
import Divider from "@mui/material/Divider";
import {
  Star,
  MessageSquare,
  Link2,
  User as UserIcon,
  Settings,
  Activity,
  LogOut,
  ChevronDown,
  Users,
} from "lucide-react";
import logo from "../assets/image.png";
import smallLogo from "../assets/WhatsApp Image 2024-11-20 at 9.55.51 AM (1) 1.png";
import "./MainLayout.scss";

const { Header, Sider, Content } = Layout;

// Below antd's `lg` breakpoint the sidebar turns into an overlay drawer.
const MOBILE_QUERY = "(max-width: 991.98px)";

const subscribeToMobileQuery = (callback) => {
  const mql = window.matchMedia(MOBILE_QUERY);
  mql.addEventListener("change", callback);
  return () => mql.removeEventListener("change", callback);
};

const useIsMobile = () =>
  useSyncExternalStore(
    subscribeToMobileQuery,
    () => window.matchMedia(MOBILE_QUERY).matches,
  );

const EMPTY_REVIEW_LINKS = {
  apple_review_link: "",
  google_review_link: "",
  booking_review_link: "",
};

const REVIEW_LINK_FIELDS = [
  {
    key: "google_review_link",
    label: "Google Review Link",
    placeholder: "https://g.page/r/...",
    Icon: MessageSquare,
  },
  {
    key: "apple_review_link",
    label: "Apple Review Link",
    placeholder: "https://apps.apple.com/...",
    Icon: Star,
  },
  {
    key: "booking_review_link",
    label: "Booking Review Link",
    placeholder: "https://...",
    Icon: Link2,
  },
];

const PROFILE_LINKS = [
  { to: "/viewAdmin", label: "View Profile", Icon: UserIcon },
  { to: "/reset-password", label: "Change Password", Icon: Settings },
  { to: "/loginLogs", label: "User Login Activity", Icon: Activity },
];

const fieldSx = {
  "& .MuiOutlinedInput-root": {
    height: "45px",
    borderRadius: "8px",
  },
};

const fieldLabelSx = {
  fontSize: "12.5px",
  fontWeight: 600,
  color: "#374151",
  mb: 0.75,
};

// Operations Administrator (role_id 3) has restricted menu access —
// Estimate, Calculator, and BDM are hidden for this role.
const getMenuItems = (roleId) => {
  const isOperationsAdmin = roleId === 3;
  const unlessOpsAdmin = (item) => (isOperationsAdmin ? [] : [item]);

  return [
    {
      type: "group",
      label: "CORE",
      children: [
        {
          key: "/",
          icon: <AiOutlineDashboard className="menu-icon-lg" />,
          label: "Dashboard",
        },
      ],
    },
    {
      type: "group",
      label: "PEOPLE MANAGEMENT",
      children: [
        { key: "/users", icon: <FaUsers />, label: "Clients" },
        { key: "/employees", icon: <FaUsers />, label: "Employees" },
        {
          key: "/hiring-form",
          icon: <IoInformationCircle />,
          label: "Hiring Form",
        },
        {
          key: "/attendance",
          icon: <FaRegCalendarAlt />,
          label: "Attendance",
        },
        { key: "/breaks", icon: <FaRegCirclePause />, label: "Breaks" },
        {
          key: "/leave-request",
          icon: <FaRegCalendar />,
          label: "Leave Requests",
        },
        ...unlessOpsAdmin({
          key: "/bdm-list",
          icon: <FaUserTie />,
          label: "BDM",
        }),
      ],
    },
    {
      type: "group",
      label: "OPERATIONS",
      children: [
        { key: "/bookings", icon: <TbBrandBooking />, label: "Bookings" },
        { key: "/overview", icon: <FaChartGantt />, label: "Day Overview" },
        {
          key: "/employee-timesheet",
          icon: <FaChartGantt />,
          label: "Employee Timesheet",
        },
        { key: "/weeklyOverview", icon: <GiProgression />, label: "Schedule" },
        ...unlessOpsAdmin({
          key: "/calculator",
          icon: <FaCalculator />,
          label: "Calculator",
          children: [
            {
              key: "/cost-calculator",
              icon: <FaCalculator />,
              label: "Cost Calculator",
            },
            {
              key: "/cost-calculation-settings",
              icon: <FaCog />,
              label: "Cost Settings",
            },
          ],
        }),
        {
          key: "/equipment",
          icon: <FaToolbox />,
          label: "Equipment",
          children: [
            {
              key: "/equipment/list",
              icon: <FaBoxes />,
              label: "Equipment List",
            },
            {
              key: "/equipment/assignments",
              icon: <FaClipboardList />,
              label: "Equipment Assignments",
            },
            {
              key: "/equipment/employee-records",
              icon: <Users />,
              label: "Employee Records",
            },
          ],
        },
      ],
    },
    {
      type: "group",
      label: "DOCUMENTS",
      children: [
        ...unlessOpsAdmin({
          key: "/pdf-generation",
          icon: <FaFilePdf />,
          label: "Service Estimate",
        }),
        {
          key: "/service-request",
          icon: <FaFilePdf />,
          label: "Service Request",
        },
        {
          key: "/contract-agreement",
          icon: <FaFilePdf />,
          label: "Contracts",
        },
        {
          key: "/all-invoices",
          icon: <FaFileInvoiceDollar />,
          label: "Invoices",
        },
      ],
    },
    {
      type: "group",
      label: "SERVICES",
      children: [
        { key: "/services", icon: <BiSolidCategoryAlt />, label: "Services" },
        {
          key: "/checklist",
          icon: <VscChecklist />,
          label: "Service Checklist",
        },
        {
          key: "/daily-checklist",
          icon: <LuLayoutList />,
          label: "Housekeeping Checklist",
        },
        {
          key: "/weeklyChecklistView",
          icon: <PiCalendarCheckFill />,
          label: "Weekly Checklist",
        },
      ],
    },
    {
      type: "group",
      label: "INVENTORY & QUOTES",
      children: [
        {
          key: "/supplies",
          icon: <MdCategory />,
          label: "Supplies",
          children: [
            { key: "/supplies/list", label: "Supplies List" },
            { key: "/supplies/requests", label: "Restock Requests" },
          ],
        },
        {
          key: "/quote-management",
          icon: <FileTextOutlined />,
          label: "Quote Management",
          children: [
            { key: "/quote-questions", label: "Quote Questions" },
            { key: "/quote-requests", label: "Quote Requests" },
          ],
        },
      ],
    },
    {
      type: "group",
      label: "FINANCE",
      children: [
        { key: "/invoices", icon: <FaFileInvoiceDollar />, label: "Quotes" },
        {
          key: "/invoiceAnalytics",
          icon: <TbBrandCashapp />,
          label: "Invoice Analytics",
        },
      ],
    },
    {
      type: "group",
      label: "COMMUNICATION",
      children: [
        ...(roleId === 5
          ? [{ key: "/chats", icon: <IoMdChatboxes />, label: "Chat" }]
          : []),
        { key: "/teams", icon: <FaUsers />, label: "Teams" },
        { key: "/group-chats", icon: <PiChatsFill />, label: "Group Chat" },
      ],
    },
    {
      type: "group",
      label: "TRAINING & REPORTS",
      children: [
        {
          key: "/training-videos",
          icon: <MdVideoLibrary />,
          label: "Training Videos",
        },
        {
          key: "/reports",
          icon: <MdOutlineReportGmailerrorred />,
          label: "Client Complaints",
        },
      ],
    },
    {
      type: "group",
      label: "ADMIN",
      children: [
        {
          key: "/adminList",
          icon: <MdManageAccounts />,
          label: "Access Management",
        },
      ],
    },
  ];
};

const MainLayout = () => {
  const [idData, setIdData] = useState({});
  const [profileOpen, setProfileOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [reviewModalVisible, setReviewModalVisible] = useState(false);
  const [reviewLinks, setReviewLinks] = useState(EMPTY_REVIEW_LINKS);
  const [reviewLoading, setReviewLoading] = useState(false);
  const isMobile = useIsMobile();

  const navigate = useNavigate();
  const token = localStorage.getItem("adminToken");

  useEffect(() => {
    const getData = async () => {
      try {
        const result = await GetAdminProfile(
          localStorage.getItem("adminToken"),
        );
        if (result.status === 200) {
          setIdData(result.data.data);
        }
      } catch (e) {
        console.error(e);
      }
    };
    getData();
  }, []);

  // Close profile dropdown when clicking outside it
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (
        profileOpen &&
        !e.target.closest("#dropdownMenuLink") &&
        !e.target.closest(".dropdown-menu")
      ) {
        setProfileOpen(false);
      }
    };
    document.addEventListener("click", handleClickOutside);
    return () => document.removeEventListener("click", handleClickOutside);
  }, [profileOpen]);

  function logout() {
    localStorage.removeItem("adminToken");
    localStorage.removeItem("adminId");
    message.success("Logged Out Successfully");
    setTimeout(() => {
      navigate("/Login");
    }, 1000);
  }

  const getReviewLinks = async () => {
    try {
      setReviewLoading(true);
      const res = await GetReviewLink();
      const data = res.data;

      if (data.success && data.data.length > 0) {
        const links = data.data[0];
        setReviewLinks({
          apple_review_link: links.apple_review_link || "",
          google_review_link: links.google_review_link || "",
          booking_review_link: links.booking_review_link || "",
        });
      } else {
        setReviewLinks(EMPTY_REVIEW_LINKS);
      }
    } catch (err) {
      console.error(err);
      message.error("Failed to fetch review links");
    } finally {
      setReviewLoading(false);
    }
  };

  const saveReviewLinks = async () => {
    try {
      setReviewLoading(true);

      const formData = new FormData();
      formData.append("apple_review_link", reviewLinks.apple_review_link);
      formData.append("google_review_link", reviewLinks.google_review_link);
      formData.append("booking_review_link", reviewLinks.booking_review_link);

      const res = await CreateOrUpdateReviewLink(formData);

      if (res.status === 200) {
        message.success("Review links saved successfully!");
        setReviewModalVisible(false);
      } else {
        message.error(res.message || "Failed to save review links");
      }
    } catch (err) {
      console.error(err);
      message.error("Failed to save review links");
    } finally {
      setReviewLoading(false);
    }
  };

  if (!token) {
    return <Login />;
  }

  const sidebarCollapsed = isMobile ? !mobileMenuOpen : collapsed;
  const MenuToggleIcon = sidebarCollapsed
    ? MenuUnfoldOutlined
    : MenuFoldOutlined;

  const toggleSidebar = () => {
    if (isMobile) setMobileMenuOpen((open) => !open);
    else setCollapsed((value) => !value);
  };

  return (
    <Layout className="app-shell">
      <Sider
        trigger={null}
        collapsible
        collapsed={sidebarCollapsed}
        width={250}
        collapsedWidth={isMobile ? 0 : 80}
        className={`sidebar${isMobile ? " sidebar--mobile" : ""}`}
      >
        <div className="logo">
          {sidebarCollapsed ? (
            <img
              src={smallLogo}
              className="logo-image"
              alt="logo"
              style={{ width: "50px" }}
            />
          ) : (
            <img
              src={logo}
              className="logo-image"
              alt="logo"
              style={{ width: "180px" }}
            />
          )}
        </div>

        <Menu
          theme="dark"
          mode="inline"
          onClick={({ key }) => {
            if (isMobile) setMobileMenuOpen(false);
            navigate(key);
          }}
          items={getMenuItems(idData?.role_id)}
        />
      </Sider>

      {isMobile && mobileMenuOpen && (
        <div
          className="sidebar-backdrop"
          onClick={() => setMobileMenuOpen(false)}
        />
      )}

      <Layout className="site-layout">
        <Header
          style={{
            padding: isMobile ? "0 12px" : "0 24px",
            background: "#ffffff",
            borderBottom: "1px solid #eef0f2",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            height: 68,
            flexShrink: 0,
          }}
        >
          <MenuToggleIcon
            aria-label="Toggle navigation"
            style={{ fontSize: 18, color: "#6b7280", cursor: "pointer" }}
            onClick={toggleSidebar}
          />

          <Box
            sx={{
              display: "flex",
              alignItems: "center",
              gap: { xs: 1, sm: 2.5 },
            }}
          >
            <MuiButton
              variant="contained"
              disableElevation
              aria-label="Set Review Links"
              startIcon={isMobile ? null : <Star size={16} />}
              onClick={() => {
                getReviewLinks();
                setReviewModalVisible(true);
              }}
              sx={{
                height: 42,
                minWidth: { xs: 42, sm: 64 },
                px: { xs: 0, sm: 2.5 },
                borderRadius: "8px",
                textTransform: "none",
                fontWeight: 600,
                whiteSpace: "nowrap",
              }}
            >
              {isMobile ? <Star size={18} /> : "Set Review Links"}
            </MuiButton>

            <Box
              sx={{
                width: "1px",
                height: 32,
                backgroundColor: "#eef0f2",
                display: { xs: "none", sm: "block" },
              }}
            />

            <Box sx={{ position: "relative" }}>
              <Box
                role="button"
                id="dropdownMenuLink"
                aria-expanded={profileOpen}
                onClick={() => setProfileOpen((prev) => !prev)}
                sx={{
                  display: "flex",
                  alignItems: "center",
                  gap: 1.25,
                  cursor: "pointer",
                  padding: "6px 10px",
                  borderRadius: "10px",
                  transition: "background-color 0.15s",
                  "&:hover": {
                    backgroundColor: "#f9fafb",
                  },
                }}
              >
                <Box
                  sx={{
                    width: 38,
                    height: 38,
                    borderRadius: "50%",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    backgroundColor: "#eef2ff",
                    color: "#4f46e5",
                    fontWeight: 700,
                    fontSize: "15px",
                    flexShrink: 0,
                  }}
                >
                  {idData?.name?.charAt(0)?.toUpperCase() || (
                    <FaRegCircleUser size={18} />
                  )}
                </Box>
                <Box
                  sx={{
                    textAlign: "left",
                    lineHeight: 1.3,
                    display: { xs: "none", sm: "block" },
                  }}
                >
                  <Typography
                    sx={{
                      fontSize: "13.5px",
                      fontWeight: 600,
                      color: "#111827",
                    }}
                  >
                    {idData?.name || "Admin"}
                  </Typography>
                  <Typography
                    sx={{
                      fontSize: "11.5px",
                      color: "#9ca3af",
                    }}
                  >
                    {idData?.admin_role?.name || "Admin"}
                  </Typography>
                </Box>
                <ChevronDown
                  size={16}
                  color="#9ca3af"
                  style={{
                    transform: profileOpen ? "rotate(180deg)" : "rotate(0deg)",
                    transition: "transform 0.15s",
                  }}
                />
              </Box>

              <ul
                className={`dropdown-menu admin${profileOpen ? " show" : ""}`}
                aria-labelledby="dropdownMenuLink"
              >
                {PROFILE_LINKS.map(({ to, label, Icon }) => (
                  <li key={to}>
                    <Link className="dropdown-item" to={to}>
                      <Icon size={16} />
                      {label}
                    </Link>
                  </li>
                ))}
                <li className="dropdown-divider" />
                <li>
                  <Link
                    className="dropdown-item dropdown-item--danger"
                    onClick={logout}
                  >
                    <LogOut size={16} />
                    Sign Out
                  </Link>
                </li>
              </ul>
            </Box>
          </Box>
        </Header>
        <Content
          className="app-content"
          style={{
            margin: isMobile ? "12px 8px" : "24px 16px",
            padding: isMobile ? 12 : 24,
          }}
        >
          <ToastContainer
            position="top-right"
            autoClose={250}
            hideProgressBar={false}
            newestOnTop={true}
            closeOnClick
            rtl={false}
            pauseOnFocusLoss
            draggable
            theme="light"
          />
          <Outlet />
        </Content>
        <Modal
          title={
            <Box sx={{ display: "flex", alignItems: "center", gap: 1.25 }}>
              <Box
                sx={{
                  width: 34,
                  height: 34,
                  borderRadius: "8px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  background: "#eef2ff",
                  color: "#4f46e5",
                  flexShrink: 0,
                }}
              >
                <Star size={17} />
              </Box>
              <span style={{ fontWeight: 600 }}>Configure Review Links</span>
            </Box>
          }
          open={reviewModalVisible}
          onCancel={() => setReviewModalVisible(false)}
          onOk={saveReviewLinks}
          confirmLoading={reviewLoading}
          okText="Save Links"
          width={480}
        >
          <Divider sx={{ mt: 1, mb: 2.5 }} />

          <Typography
            sx={{
              fontSize: "12.5px",
              color: "#6b7280",
              mb: 2.5,
              lineHeight: 1.5,
            }}
          >
            These links are shown to clients when asking for reviews after a
            completed booking.
          </Typography>

          <Box sx={{ display: "flex", flexDirection: "column", gap: 2.25 }}>
            {REVIEW_LINK_FIELDS.map(({ key, label, placeholder, Icon }) => (
              <Box key={key}>
                <Typography sx={fieldLabelSx}>{label}</Typography>
                <TextField
                  fullWidth
                  size="small"
                  placeholder={placeholder}
                  value={reviewLinks[key]}
                  onChange={(e) =>
                    setReviewLinks({ ...reviewLinks, [key]: e.target.value })
                  }
                  sx={fieldSx}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <Icon size={16} color="#9ca3af" />
                      </InputAdornment>
                    ),
                  }}
                />
              </Box>
            ))}
          </Box>
        </Modal>
      </Layout>
    </Layout>
  );
};

export default MainLayout;
