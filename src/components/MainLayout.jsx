/** @format */

import React, { useState, useEffect } from "react";
import { MenuFoldOutlined, MenuUnfoldOutlined } from "@ant-design/icons";
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
} from "react-icons/fa";
import { FiUser, FiActivity } from "react-icons/fi";
import { IoMdChatboxes } from "react-icons/io";
import { LuSettings } from "react-icons/lu";
import { FaChartGantt, FaRegCircleUser } from "react-icons/fa6";
import { CiLogin } from "react-icons/ci";
import {
  FaFilePdf,
  FaRegCirclePause,
  FaUserTie,
  FaRegCalendar,
} from "react-icons/fa6";
import { Layout, theme, Menu, Spin, Badge, Modal, message } from "antd";
import { FaFileInvoiceDollar, FaCalculator } from "react-icons/fa";
import { BiSolidCategoryAlt } from "react-icons/bi";
import {
  MdManageAccounts,
  MdCategory,
  MdVideoLibrary,
  MdOutlineReportGmailerrorred,
} from "react-icons/md";
import { FileTextOutlined } from "@ant-design/icons";
import Login from "../pages/Login/Login";
import {
  GetAdminProfile,
  AdminLogin,
  GetReviewLink,
  CreateOrUpdateReviewLink,
} from "../services/Api/Api";
import { GiProgression } from "react-icons/gi";
import { LuLayoutList } from "react-icons/lu";
import { PiCalendarCheckFill, PiChatsFill } from "react-icons/pi";
import { TbBrandBooking, TbBrandCashapp } from "react-icons/tb";
import { VscChecklist } from "react-icons/vsc";
import { FaRegCalendarAlt } from "react-icons/fa";
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

const MainLayout = () => {
  const [idData, setIdData] = useState({});
  const [loading, setLoading] = useState(false);
  const [hasBookings, setHasBookings] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(false);

  const {
    token: { colorBgContainer },
  } = theme.useToken();
  const navigate = useNavigate();

  const getData = async () => {
    try {
      let result = await GetAdminProfile(localStorage.getItem("adminToken"));
      if (result.status === 200) {
        setIdData(result.data.data);
      }
    } catch (e) {
      console.log(e);
    }
  };

  useEffect(() => {
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

  const [reviewModalVisible, setReviewModalVisible] = useState(false);
  const [reviewLinks, setReviewLinks] = useState({
    apple_review_link: "",
    google_review_link: "",
    booking_review_link: "",
  });
  const [reviewLoading, setReviewLoading] = useState(false);

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
        setReviewLinks({
          apple_review_link: "",
          google_review_link: "",
          booking_review_link: "",
        });
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

  const token = localStorage.getItem("adminToken");

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

  return (
    <>
      {token ? (
        <>
          {loading ? (
            <div className="spinner-container">
              <Spin size="large" />
            </div>
          ) : (
            <Layout>
              {!loading && (
                <Sider
                  trigger={null}
                  collapsible
                  collapsed={collapsed}
                  className="sidebar"
                >
                  <div className="logo text-center py-2">
                    {collapsed ? (
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
                      if (key === "signout") logout();
                      else navigate(key);
                    }}
                    items={[
                      {
                        type: "group",
                        label: "CORE",
                        children: [
                          {
                            key: "/",
                            icon: <AiOutlineDashboard className="fs-4" />,
                            label: "Dashboard",
                          },
                        ],
                      },
                      {
                        type: "group",
                        label: "PEOPLE MANAGEMENT",
                        children: [
                          {
                            key: "/users",
                            icon: <FaUsers />,
                            label: "Clients",
                          },
                          {
                            key: "/employees",
                            icon: <FaUsers />,
                            label: "Employees",
                          },
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
                          {
                            key: "/breaks",
                            icon: <FaRegCirclePause />,
                            label: "Breaks",
                          },
                          {
                            key: "/leave-request",
                            icon: <FaRegCalendar />,
                            label: "Leave Requests",
                          },
                          {
                            key: "/bdm-list",
                            icon: <FaUserTie />,
                            label: "BDM",
                          },
                        ],
                      },
                      {
                        type: "group",
                        label: "OPERATIONS",
                        children: [
                          {
                            key: "/bookings",
                            icon: <TbBrandBooking />,
                            label: (
                              <span>
                                Bookings {hasBookings && <Badge dot />}
                              </span>
                            ),
                          },
                          {
                            key: "/overview",
                            icon: <FaChartGantt />,
                            label: "Day Overview",
                          },
                          {
                            key: "/employee-timesheet",
                            icon: <FaChartGantt />,
                            label: "Employee Timesheet",
                          },
                          {
                            key: "/weeklyOverview",
                            icon: <GiProgression />,
                            label: "Schedule",
                          },
                          {
                            type: "/cost-calculator",
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
                          },
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
                          {
                            key: "/pdf-generation",
                            icon: <FaFilePdf />,
                            label: "Service Estimate",
                          },
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
                          {
                            key: "/services",
                            icon: <BiSolidCategoryAlt />,
                            label: "Services",
                          },
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
                              {
                                key: "/supplies/requests",
                                label: "Restock Requests",
                              },
                            ],
                          },
                          {
                            key: "/quote-management",
                            icon: <FileTextOutlined />,
                            label: "Quote Management",
                            children: [
                              {
                                key: "/quote-questions",
                                label: "Quote Questions",
                              },
                              {
                                key: "/quote-requests",
                                label: "Quote Requests",
                              },
                            ],
                          },
                        ],
                      },
                      {
                        type: "group",
                        label: "FINANCE",
                        children: [
                          {
                            key: "/invoices",
                            icon: <FaFileInvoiceDollar />,
                            label: "Quotes",
                          },
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
                          ...(idData?.role_id === 5
                            ? [
                                {
                                  key: "/chats",
                                  icon: <IoMdChatboxes />,
                                  label: "Chat",
                                },
                              ]
                            : []),
                          {
                            key: "/group-chats",
                            icon: <PiChatsFill />,
                            label: "Group Chat",
                          },
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
                    ]}
                  />
                </Sider>
              )}
              <Layout className="site-layout">
                <Header
                  style={{
                    padding: "0 24px",
                    background: "#ffffff",
                    borderBottom: "1px solid #eef0f2",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    height: 68,
                  }}
                >
                  {React.createElement(
                    collapsed ? MenuUnfoldOutlined : MenuFoldOutlined,
                    {
                      style: {
                        fontSize: 18,
                        color: "#6b7280",
                        cursor: "pointer",
                      },
                      onClick: () => setCollapsed(!collapsed),
                    },
                  )}

                  <Box sx={{ display: "flex", alignItems: "center", gap: 2.5 }}>
                    <MuiButton
                      variant="contained"
                      disableElevation
                      startIcon={<Star size={16} />}
                      onClick={() => {
                        getReviewLinks();
                        setReviewModalVisible(true);
                      }}
                      sx={{
                        height: 42,
                        px: 2.5,
                        borderRadius: "8px",
                        textTransform: "none",
                        fontWeight: 600,
                        whiteSpace: "nowrap",
                      }}
                    >
                      Set Review Links
                    </MuiButton>

                    <Box
                      sx={{
                        width: "1px",
                        height: 32,
                        backgroundColor: "#eef0f2",
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
                        <Box sx={{ textAlign: "left", lineHeight: 1.3 }}>
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
                            transform: profileOpen
                              ? "rotate(180deg)"
                              : "rotate(0deg)",
                            transition: "transform 0.15s",
                          }}
                        />
                      </Box>

                      <div
                        className={`dropdown-menu admin${
                          profileOpen ? " show" : ""
                        }`}
                        aria-labelledby="dropdownMenuLink"
                        style={{
                          borderRadius: "10px",
                          padding: "8px",
                          border: "1px solid #eef0f2",
                          boxShadow: "0 8px 24px rgba(16,24,40,0.08)",
                        }}
                      >
                        <li>
                          <Link
                            className="dropdown-item py-1 mb-1"
                            style={{
                              height: "auto",
                              lineHeight: "34px",
                              borderRadius: "8px",
                              display: "flex",
                              alignItems: "center",
                              fontSize: "13.5px",
                            }}
                            to="/viewAdmin"
                          >
                            <UserIcon
                              size={16}
                              style={{ marginRight: "10px" }}
                            />
                            View Profile
                          </Link>
                        </li>
                        <li>
                          <Link
                            className="dropdown-item py-1 mb-1"
                            style={{
                              height: "auto",
                              lineHeight: "34px",
                              borderRadius: "8px",
                              display: "flex",
                              alignItems: "center",
                              fontSize: "13.5px",
                            }}
                            to="/reset-password"
                          >
                            <Settings
                              size={16}
                              style={{ marginRight: "10px" }}
                            />
                            Change Password
                          </Link>
                        </li>
                        <li>
                          <Link
                            className="dropdown-item py-1 mb-1"
                            style={{
                              height: "auto",
                              lineHeight: "34px",
                              borderRadius: "8px",
                              display: "flex",
                              alignItems: "center",
                              fontSize: "13.5px",
                            }}
                            to="/loginLogs"
                          >
                            <Activity
                              size={16}
                              style={{ marginRight: "10px" }}
                            />
                            User Login Activity
                          </Link>
                        </li>
                        <div
                          className="dropdown-divider"
                          style={{ margin: "6px 4px" }}
                        ></div>
                        <li>
                          <Link
                            className="dropdown-item py-1 mb-1"
                            style={{
                              height: "auto",
                              lineHeight: "34px",
                              borderRadius: "8px",
                              display: "flex",
                              alignItems: "center",
                              fontSize: "13.5px",
                              color: "#ef4444",
                            }}
                            onClick={() => logout()}
                          >
                            <LogOut size={16} style={{ marginRight: "10px" }} />
                            Sign Out
                          </Link>
                        </li>
                      </div>
                    </Box>
                  </Box>
                </Header>
                <Content
                  style={{
                    margin: "24px 16px",
                    padding: 24,
                    minHeight: 280,
                    background: colorBgContainer,
                    position: "relative",
                  }}
                >
                  <>
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
                  </>
                </Content>
                <Modal
                  title={
                    <Box
                      sx={{ display: "flex", alignItems: "center", gap: 1.25 }}
                    >
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
                      <span style={{ fontWeight: 600 }}>
                        Configure Review Links
                      </span>
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
                    These links are shown to clients when asking for reviews
                    after a completed booking.
                  </Typography>

                  <Box
                    sx={{ display: "flex", flexDirection: "column", gap: 2.25 }}
                  >
                    <Box>
                      <Typography sx={fieldLabelSx}>
                        Google Review Link
                      </Typography>
                      <TextField
                        fullWidth
                        size="small"
                        placeholder="https://g.page/r/..."
                        value={reviewLinks.google_review_link}
                        onChange={(e) =>
                          setReviewLinks({
                            ...reviewLinks,
                            google_review_link: e.target.value,
                          })
                        }
                        sx={fieldSx}
                        InputProps={{
                          startAdornment: (
                            <InputAdornment position="start">
                              <MessageSquare size={16} color="#9ca3af" />
                            </InputAdornment>
                          ),
                        }}
                      />
                    </Box>

                    <Box>
                      <Typography sx={fieldLabelSx}>
                        Apple Review Link
                      </Typography>
                      <TextField
                        fullWidth
                        size="small"
                        placeholder="https://apps.apple.com/..."
                        value={reviewLinks.apple_review_link}
                        onChange={(e) =>
                          setReviewLinks({
                            ...reviewLinks,
                            apple_review_link: e.target.value,
                          })
                        }
                        sx={fieldSx}
                        InputProps={{
                          startAdornment: (
                            <InputAdornment position="start">
                              <Star size={16} color="#9ca3af" />
                            </InputAdornment>
                          ),
                        }}
                      />
                    </Box>

                    <Box>
                      <Typography sx={fieldLabelSx}>
                        Booking Review Link
                      </Typography>
                      <TextField
                        fullWidth
                        size="small"
                        placeholder="https://..."
                        value={reviewLinks.booking_review_link}
                        onChange={(e) =>
                          setReviewLinks({
                            ...reviewLinks,
                            booking_review_link: e.target.value,
                          })
                        }
                        sx={fieldSx}
                        InputProps={{
                          startAdornment: (
                            <InputAdornment position="start">
                              <Link2 size={16} color="#9ca3af" />
                            </InputAdornment>
                          ),
                        }}
                      />
                    </Box>
                  </Box>
                </Modal>
              </Layout>
            </Layout>
          )}
        </>
      ) : (
        <Login />
      )}
    </>
  );
};

export default MainLayout;
