import { Suspense, useState, useEffect, useSyncExternalStore } from "react";
import { Outlet, useLocation, useNavigate } from "react-router";
import { Avatar, Button, Dropdown, Input, Layout, Menu, Modal, message } from "antd";
import {
  Activity,
  BadgeDollarSign,
  Boxes,
  Briefcase,
  Building2,
  Calculator,
  CalendarCheck,
  CalendarCheck2,
  CalendarDays,
  CalendarOff,
  CalendarRange,
  ChartGantt,
  ChartLine,
  ChevronDown,
  ClipboardCheck,
  ClipboardList,
  Clock,
  Coffee,
  FilePen,
  FileSignature,
  FileText,
  KeyRound,
  LayoutDashboard,
  Link2,
  ListChecks,
  LogOut,
  MessageSquare,
  MessageSquareText,
  MessageSquareWarning,
  MessagesSquare,
  MonitorPlay,
  Package,
  PanelLeftClose,
  PanelLeftOpen,
  Receipt,
  ShieldCheck,
  SlidersHorizontal,
  SprayCan,
  Star,
  User as UserIcon,
  UserPlus,
  Users,
  UsersRound,
  Wrench,
} from "lucide-react";
import LoginPage from "@/pages/auth/LoginPage";
import PageLoader from "@/components/PageLoader";
import { getProfile, signOut } from "@/services/api/authApi";
import { getReviewLinks as fetchReviewLinks, saveReviewLinks as storeReviewLinks } from "@/services/api/reviewApi";
import { dataOf, errorMessage } from "@/services/apiResult";
import { clearSession, updateSessionUser, useIsSuperAdmin, useSession } from "@/lib/session";
import logo from "@/assets/images/logo-wordmark.png";
import smallLogo from "@/assets/images/logo-mark.png";
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
  { to: "/reset-password", label: "Change Password", Icon: KeyRound },
  { to: "/loginLogs", label: "User Login Activity", Icon: Activity },
];

const icon = (Icon) => <Icon size={18} />;

// Estimates, the calculator and BDMs are for Super Admins; the Admin role
// (the old Operations Administrator) runs day-to-day operations without them.
const getMenuItems = ({ isSuperAdmin }) => {
  const unlessOpsAdmin = (item) => (isSuperAdmin ? [item] : []);

  return [
    {
      type: "group",
      label: "CORE",
      children: [{ key: "/", icon: icon(LayoutDashboard), label: "Dashboard" }],
    },
    {
      type: "group",
      label: "PEOPLE MANAGEMENT",
      children: [
        { key: "/users", icon: icon(Building2), label: "Clients" },
        { key: "/employees", icon: icon(Users), label: "Employees" },
        { key: "/hiring-form", icon: icon(UserPlus), label: "Hiring Form" },
        { key: "/attendance", icon: icon(CalendarCheck), label: "Attendance" },
        { key: "/breaks", icon: icon(Coffee), label: "Breaks" },
        {
          key: "/leave-request",
          icon: icon(CalendarOff),
          label: "Leave Requests",
        },
        ...unlessOpsAdmin({
          key: "/bdm-list",
          icon: icon(Briefcase),
          label: "BDM",
        }),
      ],
    },
    {
      type: "group",
      label: "OPERATIONS",
      children: [
        { key: "/bookings", icon: icon(CalendarDays), label: "Bookings" },
        { key: "/overview", icon: icon(ChartGantt), label: "Day Overview" },
        {
          key: "/employee-timesheet",
          icon: icon(Clock),
          label: "Employee Timesheet",
        },
        { key: "/weeklyOverview", icon: icon(CalendarRange), label: "Schedule" },
        ...unlessOpsAdmin({
          key: "/calculator",
          icon: icon(Calculator),
          label: "Calculator",
          children: [
            {
              key: "/cost-calculator",
              icon: icon(Calculator),
              label: "Cost Calculator",
            },
            {
              key: "/cost-calculation-settings",
              icon: icon(SlidersHorizontal),
              label: "Cost Settings",
            },
          ],
        }),
        {
          key: "/equipment",
          icon: icon(Wrench),
          label: "Equipment",
          children: [
            {
              key: "/equipment/list",
              icon: icon(Package),
              label: "Equipment List",
            },
            {
              key: "/equipment/assignments",
              icon: icon(ClipboardList),
              label: "Equipment Assignments",
            },
            {
              key: "/equipment/employee-records",
              icon: icon(Users),
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
          icon: icon(FileText),
          label: "Service Estimate",
        }),
        { key: "/service-request", icon: icon(FilePen), label: "Service Request" },
        {
          key: "/contract-agreement",
          icon: icon(FileSignature),
          label: "Contracts",
        },
        { key: "/all-invoices", icon: icon(Receipt), label: "Invoices" },
      ],
    },
    {
      type: "group",
      label: "SERVICES",
      children: [
        { key: "/services", icon: icon(SprayCan), label: "Services" },
        { key: "/checklist", icon: icon(ListChecks), label: "Service Checklist" },
        {
          key: "/daily-checklist",
          icon: icon(ClipboardCheck),
          label: "Housekeeping Checklist",
        },
        {
          key: "/weeklyChecklistView",
          icon: icon(CalendarCheck2),
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
          icon: icon(Boxes),
          label: "Supplies",
          children: [
            { key: "/supplies/list", label: "Supplies List" },
            { key: "/supplies/requests", label: "Restock Requests" },
          ],
        },
        {
          key: "/quote-management",
          icon: icon(MessageSquareText),
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
        { key: "/invoices", icon: icon(BadgeDollarSign), label: "Quotes" },
        {
          key: "/invoiceAnalytics",
          icon: icon(ChartLine),
          label: "Invoice Analytics",
        },
      ],
    },
    {
      type: "group",
      label: "COMMUNICATION",
      children: [
        { key: "/teams", icon: icon(UsersRound), label: "Teams" },
        { key: "/group-chats", icon: icon(MessagesSquare), label: "Group Chat" },
      ],
    },
    {
      type: "group",
      label: "TRAINING & REPORTS",
      children: [
        {
          key: "/training-videos",
          icon: icon(MonitorPlay),
          label: "Training Videos",
        },
        {
          key: "/reports",
          icon: icon(MessageSquareWarning),
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
          icon: icon(ShieldCheck),
          label: "Access Management",
        },
      ],
    },
  ];
};

// Submenus that contain the current page start open, so the highlighted
// item is visible after a reload.
const SUBMENU_PREFIXES = {
  "/calculator": ["/cost-calculator", "/cost-calculation-settings"],
  "/equipment": ["/equipment/"],
  "/supplies": ["/supplies/"],
  "/quote-management": ["/quote-questions", "/quote-requests"],
};

const openKeysFor = (pathname) =>
  Object.entries(SUBMENU_PREFIXES)
    .filter(([, prefixes]) => prefixes.some((p) => pathname.startsWith(p)))
    .map(([key]) => key);

const MainLayout = () => {
  const session = useSession();
  const user = session?.user;
  const isSuperAdmin = useIsSuperAdmin();
  const [profileOpen, setProfileOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [reviewModalVisible, setReviewModalVisible] = useState(false);
  const [reviewLinks, setReviewLinks] = useState(EMPTY_REVIEW_LINKS);
  const [reviewLoading, setReviewLoading] = useState(false);
  const isMobile = useIsMobile();

  const navigate = useNavigate();
  const { pathname } = useLocation();
  const signedIn = Boolean(session);

  // Who the admin is now: roles and permissions can change after sign-in,
  // and a demoted admin loses access at once.
  useEffect(() => {
    if (!signedIn) return;
    getProfile()
      .then((res) => updateSessionUser(dataOf(res)))
      .catch(() => {
        // A 401 already sends the panel to sign-in.
      });
  }, [signedIn]);

  async function logout() {
    try {
      await signOut();
    } catch {
      // The session ends here either way.
    }
    clearSession();
    message.success("Signed out");
    navigate("/Login", { replace: true });
  }

  const getReviewLinks = async () => {
    try {
      setReviewLoading(true);
      const links = dataOf(await fetchReviewLinks()) || {};
      setReviewLinks({
        apple_review_link: links.apple_review_link || "",
        google_review_link: links.google_review_link || "",
        booking_review_link: links.booking_review_link || "",
      });
    } catch (err) {
      setReviewLinks(EMPTY_REVIEW_LINKS);
      message.error(errorMessage(err, "Couldn't load the review links"));
    } finally {
      setReviewLoading(false);
    }
  };

  const saveReviewLinks = async () => {
    try {
      setReviewLoading(true);
      await storeReviewLinks(reviewLinks);
      message.success("Review links saved");
      setReviewModalVisible(false);
    } catch (err) {
      message.error(errorMessage(err, "Couldn't save the review links"));
    } finally {
      setReviewLoading(false);
    }
  };

  if (!signedIn) {
    return <LoginPage />;
  }

  const sidebarCollapsed = isMobile ? !mobileMenuOpen : collapsed;
  const MenuToggleIcon = sidebarCollapsed ? PanelLeftOpen : PanelLeftClose;

  const toggleSidebar = () => {
    if (isMobile) setMobileMenuOpen((open) => !open);
    else setCollapsed((value) => !value);
  };

  const profileMenu = {
    items: [
      ...PROFILE_LINKS.map(({ to, label, Icon }) => ({
        key: to,
        label,
        icon: <Icon size={16} />,
      })),
      { type: "divider" },
      {
        key: "logout",
        label: "Sign Out",
        icon: <LogOut size={16} />,
        danger: true,
      },
    ],
    onClick: ({ key }) => (key === "logout" ? logout() : navigate(key)),
  };

  const initial = user?.name?.charAt(0)?.toUpperCase();
  const roleLabel = user?.roles?.map((role) => role.name).join(", ") || "Admin";

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
          <img
            src={sidebarCollapsed ? smallLogo : logo}
            className={`logo-image${sidebarCollapsed ? " logo-image--small" : ""}`}
            alt="Social Sanitation"
          />
        </div>

        <Menu
          theme="dark"
          mode="inline"
          selectedKeys={[pathname]}
          defaultOpenKeys={openKeysFor(pathname)}
          onClick={({ key }) => {
            if (isMobile) setMobileMenuOpen(false);
            navigate(key);
          }}
          items={getMenuItems({ isSuperAdmin })}
        />
      </Sider>

      {isMobile && mobileMenuOpen && (
        <div
          className="sidebar-backdrop"
          onClick={() => setMobileMenuOpen(false)}
        />
      )}

      <Layout className="site-layout">
        <Header className="app-header">
          <Button
            type="text"
            aria-label="Toggle navigation"
            className="app-header__toggle"
            icon={<MenuToggleIcon size={20} />}
            onClick={toggleSidebar}
          />

          <div className="app-header__actions">
            <Button
              type="primary"
              size="large"
              aria-label="Set Review Links"
              icon={<Star size={16} />}
              onClick={() => {
                getReviewLinks();
                setReviewModalVisible(true);
              }}
            >
              {isMobile ? null : "Set Review Links"}
            </Button>

            <span className="app-header__divider" />

            <Dropdown
              menu={profileMenu}
              trigger={["click"]}
              placement="bottomRight"
              open={profileOpen}
              onOpenChange={setProfileOpen}
            >
              <button
                type="button"
                className="profile-trigger"
                aria-label="Account menu"
                aria-expanded={profileOpen}
              >
                <Avatar size={38} className="profile-trigger__avatar">
                  {initial || <UserIcon size={18} />}
                </Avatar>
                <span className="profile-trigger__text">
                  <span className="profile-trigger__name">
                    {user?.name || "Admin"}
                  </span>
                  <span className="profile-trigger__role">
                    {roleLabel}
                  </span>
                </span>
                <ChevronDown
                  size={16}
                  className={`profile-trigger__chevron${profileOpen ? " is-open" : ""}`}
                />
              </button>
            </Dropdown>
          </div>
        </Header>
        <Content className="app-content">
          <Suspense fallback={<PageLoader />}>
            <Outlet />
          </Suspense>
        </Content>
        <Modal
          title={
            <span className="review-modal__title">
              <span className="review-modal__icon">
                <Star size={17} />
              </span>
              Configure Review Links
            </span>
          }
          open={reviewModalVisible}
          onCancel={() => setReviewModalVisible(false)}
          onOk={saveReviewLinks}
          confirmLoading={reviewLoading}
          okText="Save Links"
          width={480}
        >
          <p className="review-modal__intro">
            These links are shown to clients when asking for reviews after a
            completed booking.
          </p>

          <div className="review-modal__fields">
            {REVIEW_LINK_FIELDS.map(({ key, label, placeholder, Icon }) => (
              <div key={key}>
                <label className="field-label" htmlFor={`review-${key}`}>
                  {label}
                </label>
                <Input
                  id={`review-${key}`}
                  size="large"
                  placeholder={placeholder}
                  value={reviewLinks[key]}
                  onChange={(e) =>
                    setReviewLinks({ ...reviewLinks, [key]: e.target.value })
                  }
                  prefix={<Icon size={16} className="text-subtle" />}
                />
              </div>
            ))}
          </div>
        </Modal>
      </Layout>
    </Layout>
  );
};

export default MainLayout;
