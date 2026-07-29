/** @format */

import React, { useEffect, useState } from "react";
import Box from "@mui/material/Box";
import Paper from "@mui/material/Paper";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import Button from "@mui/material/Button";
import IconButton from "@mui/material/IconButton";
import { useNavigate } from "react-router-dom";

import {
  Tag,
  Table,
  Space,
  Tooltip,
  message,
  Dropdown,
  Spin,
  Image,
  Modal,
  Tabs,
  Input,
} from "antd";
import { BASE_URL_IMAGE } from "../../services/Host";
import {
  GetBookingRequestCount,
  GetUserBooking,
  DeleteBooking,
  GetBookingById,
} from "../../services/Api/BookingApi";
import {
  Search,
  Plus,
  CalendarDays,
  Images,
  Eye,
  Pencil,
  Trash2,
} from "lucide-react";
import "./Bookings.css";
import dayjs from "@/lib/dayjs";
import utc from "dayjs/plugin/utc";

dayjs.extend(utc);

const actionIconBtn = (color) => ({
  width: 32,
  height: 32,
  border: "1px solid",
  borderColor: color,
  color,
  "&:hover": {
    backgroundColor: `${color}14`,
    borderColor: color,
  },
});

const Bookings = () => {
  const navigate = useNavigate();
  const [bookingData, setBookingData] = useState([]);
  const [originalData, setOriginalData] = useState([]);
  const [searchText, setSearchText] = useState("");

  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState("PENDING");
  const [nestedTab, setNestedTab] = useState("all");
  const [tableParams, setTableParams] = useState({
    pagination: {
      current: 1,
      pageSize: 100,
    },
    sortField: null,
    sortOrder: null,
  });

  const [galleryVisible, setGalleryVisible] = useState(false);
  const [galleryLoading, setGalleryLoading] = useState(false);
  const [beforeServiceImages, setBeforeServiceImages] = useState([]);
  const [afterServiceImages, setAfterServiceImages] = useState([]);

  const handleOpenGallery = async (bookingId) => {
    setGalleryVisible(true);
    setGalleryLoading(true);
    try {
      const res = await GetBookingById(bookingId);
      const booking = res.data.data;
      const attachments = booking.booking_attachment || [];

      const beforeImgs = attachments.filter(
        (a) => a.title === "BEFORE SERVICE",
      );
      const afterImgs = attachments.filter((a) => a.title === "AFTER SERVICE");

      setBeforeServiceImages(beforeImgs);
      setAfterServiceImages(afterImgs);
    } catch (err) {
      console.error("Failed to fetch booking gallery:", err);
      message.error("Failed to load images");
    } finally {
      setGalleryLoading(false);
    }
  };

  const getData = async (booking_status, period) => {
    try {
      setLoading(true);
      const result = await GetUserBooking(
        localStorage.getItem("adminToken"),
        booking_status,
        period,
      );
      const newData = result.data.data.map((item, index) => ({
        ...item,
        index: index + 1,
      }));
      setBookingData(newData);
      setOriginalData(newData);
      // Re-apply any active search term to the freshly loaded tab data
      if (searchText.trim()) {
        applySearch(searchText, newData);
      }
    } catch (e) {
      console.error(e);
      if (e.response && e.response.status === 401) {
        navigate("/error401");
      } else {
        console.error("Error loading data. Please try again later.");
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    getData(activeTab, nestedTab);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab, nestedTab]);

  const navigateToViewBooking = (id) => {
    navigate(`/viewBooking/${id}`);
  };

  const navigateToEditBooking = (id) => {
    navigate(`/editBooking/${id}`);
  };

  const handleTableChange = (pagination, filters, sorter) => {
    setTableParams({
      pagination,
      filters,
      sortField: sorter.field,
      sortOrder: sorter.order,
    });
  };

  const tabsContent = [
    { label: "Booking Request", key: "PENDING" },
    { label: "Upcoming Bookings", key: "UPCOMING" },
    { label: "Ongoing Bookings", key: "ONGOING" },
    { label: "Booking History", key: "COMPLETED" },
    { label: "Cancelled Bookings", key: "CANCELLED" },
  ];

  const nestedTabsContent = {
    UPCOMING: [
      { label: "All", key: "all" },
      { label: "Today", key: "today" },
      { label: "This Week", key: "current_week" },
      { label: "This Month", key: "current_month" },
    ],
    COMPLETED: [
      { label: "All", key: "all" },
      { label: "Past 30 Days", key: "past_30_days" },
      { label: "Past 90 Days", key: "past_90_days" },
    ],
    DELETED: [],
  };

  const columns = [
    {
      title: "S.No.",
      dataIndex: "index",
      width: 60,
    },
    {
      title: "Booking Type",
      key: "booking_type",
      width: 110,
      render: (_, record) => {
        const isClient = !!record.user_id;
        const color = isClient ? "green" : "blue";
        const label = isClient ? "Client Booking" : "Non Client Booking";
        return <Tag color={color}>{label}</Tag>;
      },
    },
    {
      title: "Booking Name",
      dataIndex: "booking_name",
      width: 130,
      key: "booking_name",
      render: (text) => text || "--",
    },
    {
      title: "Client Name",
      key: "name",
      width: 130,
      render: (_, record) => {
        const name =
          record.booking_user?.user_profile?.name || record.client_name || "--";
        return name;
      },
    },
    {
      title: "Date",
      dataIndex: "date",
      key: "date",
      width: 120,
      render: (date) =>
        dayjs(date).utcOffset(0, true).format("ddd, MM/DD/YYYY"),
    },
    {
      title: "Employee Assigned",
      dataIndex: "booking_employee_details",
      key: "employee_assigned",
      width: 170,
      render: (employees) => {
        if (!employees || employees.length === 0) {
          return (
            <span style={{ color: "#ef4444", fontWeight: 500 }}>
              Not Assigned
            </span>
          );
        }
        const employeeNames = employees.map(
          (employee) => employee.employee_profile?.user_profile?.name,
        );
        return <span>{employeeNames.join(", ")}</span>;
      },
    },
    {
      title: "Type",
      dataIndex: ["type"],
      width: 110,
      key: "type",
    },
    {
      title: "Status",
      dataIndex: "booking_status",
      width: 100,
      key: "status",
      render: (status) => {
        let color;
        let displayStatus = status;
        switch (status) {
          case "PENDING":
            color = "gold";
            break;
          case "SUCCESS":
            color = "green";
            displayStatus = "COMPLETED";
            break;
          case "ACCEPTED":
            color = "blue";
            break;
          case "REJECTED":
            color = "red";
            break;
          case "CANCELLED":
            color = "red";
            break;
          case "DELETED":
            color = "volcano";
            break;
          case "ONGOING":
            color = "purple";
            break;
          default:
            color = "default";
        }
        return (
          <Tag color={color} key={status}>
            {displayStatus}
          </Tag>
        );
      },
    },
    {
      title: "Actions",
      key: "actions",
      width: 210,
      render: (text, record) => {
        return (
          <Space size={6}>
            <Tooltip title="View Image Gallery">
              <IconButton
                size="small"
                sx={actionIconBtn("#8F00FF")}
                onClick={() => handleOpenGallery(record.id)}
              >
                <Images size={15} />
              </IconButton>
            </Tooltip>

            <Tooltip title="View Details">
              <IconButton
                size="small"
                sx={actionIconBtn("#FF9800")}
                onClick={() => navigateToViewBooking(record.id)}
              >
                <Eye size={15} />
              </IconButton>
            </Tooltip>

            {(activeTab === "PENDING" || activeTab === "UPCOMING") && (
              <Tooltip title="Update Details">
                <IconButton
                  size="small"
                  sx={actionIconBtn("#2196F3")}
                  onClick={() => navigateToEditBooking(record.id)}
                >
                  <Pencil size={15} />
                </IconButton>
              </Tooltip>
            )}

            {record.type === "Recurring Booking" ? (
              <Dropdown
                menu={{
                  items: [
                    {
                      key: "this",
                      label: "Delete This Event",
                      onClick: () => handleDelete(record.id, "this"),
                    },
                    {
                      key: "following",
                      label: "Delete Following Events",
                      onClick: () => handleDelete(record.id, "following"),
                    },
                    {
                      key: "all",
                      label: "Delete All Events",
                      onClick: () => handleDelete(record.id, "all"),
                    },
                  ],
                }}
                trigger={["click"]}
                placement="bottomRight"
              >
                <Tooltip title="Delete Options">
                  <IconButton size="small" sx={actionIconBtn("#EF4444")}>
                    <Trash2 size={15} />
                  </IconButton>
                </Tooltip>
              </Dropdown>
            ) : (
              <Tooltip title="Delete">
                <IconButton
                  size="small"
                  sx={actionIconBtn("#EF4444")}
                  onClick={() => handleDelete(record.id, "this")}
                >
                  <Trash2 size={15} />
                </IconButton>
              </Tooltip>
            )}
          </Space>
        );
      },
    },
  ];

  const handleDelete = (id, delete_mode = "this") => {
    Modal.confirm({
      title: "Confirm Deletion",
      content: "Are you sure you want to delete this booking?",
      okText: "Yes, Delete",
      okType: "danger",
      cancelText: "No",
      onOk: async () => {
        const formData = new FormData();
        formData.append("booking_id", id);
        formData.append("delete_mode", delete_mode);

        try {
          const res = await DeleteBooking(formData);
          if (res?.status === 200 && res?.data?.success) {
            message.success(
              res?.data?.message || "Booking deleted successfully",
            );
            getData(activeTab, nestedTab);
          } else {
            message.warning(res?.data?.message || "Unexpected response");
          }
        } catch (error) {
          console.error("Delete Booking Error:", error);
          message.error("Failed to delete booking");
        }
      },
    });
  };

  const navigateToCreateAppointment = () => {
    navigate("/create-client-booking");
  };

  const navigateToMonthlyCalendar = () => {
    navigate("/monthlyCalendar");
  };

  const applySearch = (value, sourceData = originalData) => {
    if (!value.trim()) {
      setBookingData(sourceData);
      return;
    }

    const search = value.toLowerCase();

    const filtered = sourceData.filter((item) => {
      return (
        item.booking_name?.toLowerCase().includes(search) ||
        item.client_name?.toLowerCase().includes(search) ||
        item.booking_user?.user_profile?.name?.toLowerCase().includes(search)
      );
    });

    setBookingData(filtered);
  };

  const onSearch = (value) => {
    setSearchText(value);
    applySearch(value);
  };

  return (
    <Box>
      {/* Header */}
      <Paper
        variant="outlined"
        sx={{
          p: 2.5,
          mb: 2.5,
          borderRadius: "10px",
          borderColor: "#eef0f2",
        }}
      >
        <Stack
          direction="row"
          spacing={2}
          sx={{
            justifyContent: "space-between",
            alignItems: "center",
            flexWrap: "wrap",
          }}
        >
          <Box>
            <Typography className="page-title">BOOKING MANAGEMENT</Typography>
            <Typography className="page-sub-title">
              View and manage user bookings
            </Typography>
          </Box>

          <Stack
            direction="row"
            spacing={1.5}
            useFlexGap
            sx={{ ml: "auto", alignItems: "center", flexWrap: "wrap" }}
          >
            <Input
              allowClear
              prefix={<Search size={18} color="#9CA3AF" />}
              placeholder="Search bookings..."
              style={{ width: 240, height: 44 }}
              value={searchText}
              onChange={(e) => onSearch(e.target.value)}
            />

            <Button
              variant="contained"
              disableElevation
              startIcon={<CalendarDays size={17} />}
              onClick={navigateToMonthlyCalendar}
              sx={{
                height: 44,
                px: 2.5,
                borderRadius: "8px",
                textTransform: "none",
                fontWeight: 600,
                whiteSpace: "nowrap",
                backgroundColor: "#6b7280",
                "&:hover": { backgroundColor: "#4b5563" },
              }}
            >
              Monthly Calendar
            </Button>

            <Button
              variant="contained"
              disableElevation
              startIcon={<Plus size={18} />}
              onClick={navigateToCreateAppointment}
              sx={{
                height: 44,
                px: 2.5,
                borderRadius: "8px",
                textTransform: "none",
                fontWeight: 600,
                whiteSpace: "nowrap",
              }}
            >
              Create Appointment
            </Button>
          </Stack>
        </Stack>
      </Paper>

      {/* Main Tabs */}
      <Paper
        variant="outlined"
        sx={{
          px: 1,
          pt: 0.5,
          mb: 2.5,
          borderRadius: "10px",
          borderColor: "#eef0f2",
        }}
      >
        <Tabs
          activeKey={activeTab}
          onChange={(key) => {
            setActiveTab(key);
            setNestedTab("all");
          }}
          items={tabsContent.map((tab) => ({
            key: tab.key,
            label: tab.label,
          }))}
        />
      </Paper>

      {/* Nested Tabs */}
      {nestedTabsContent[activeTab] &&
        nestedTabsContent[activeTab].length > 0 && (
          <Paper
            variant="outlined"
            sx={{
              px: 1,
              pt: 0.5,
              mb: 2.5,
              borderRadius: "10px",
              borderColor: "#eef0f2",
            }}
          >
            <Tabs
              activeKey={nestedTab}
              onChange={(key) => setNestedTab(key)}
              size="small"
              items={nestedTabsContent[activeTab].map((tab) => ({
                key: tab.key,
                label: tab.label,
              }))}
            />
          </Paper>
        )}

      {/* Table with loading overlay so tab switches don't feel glitchy */}
      <Spin spinning={loading} tip="Loading bookings...">
        <div className="table-scroll-wrapper">
          <Table
            columns={columns}
            rowKey={(record) => record.id}
            dataSource={bookingData}
            pagination={tableParams.pagination}
            onChange={handleTableChange}
            bordered
            size="middle"
            scroll={{ x: 1240, y: 640 }}
          />
        </div>
      </Spin>

      <Modal
        title="Service Image Gallery"
        open={galleryVisible}
        onCancel={() => setGalleryVisible(false)}
        footer={null}
        width={800}
      >
        {galleryLoading ? (
          <div style={{ textAlign: "center", padding: "50px 0" }}>
            <Spin size="large" />
          </div>
        ) : (
          <div>
            <h4 style={{ marginTop: 10 }}>Before Service</h4>
            {beforeServiceImages?.length > 0 ? (
              <div
                style={{
                  display: "flex",
                  flexWrap: "wrap",
                  gap: "12px",
                  marginTop: "10px",
                }}
              >
                <Image.PreviewGroup>
                  {beforeServiceImages.map((img) => (
                    <Image
                      key={img.id}
                      src={`${BASE_URL_IMAGE}${img.file_name}`}
                      alt="Before Service"
                      width={120}
                      style={{
                        borderRadius: "10px",
                        objectFit: "cover",
                        boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
                      }}
                      crossOrigin="anonymous"
                    />
                  ))}
                </Image.PreviewGroup>
              </div>
            ) : (
              <p style={{ color: "#9ca3af" }}>No images uploaded</p>
            )}

            <h4 style={{ marginTop: 20 }}>After Service</h4>
            {afterServiceImages?.length > 0 ? (
              <div
                style={{
                  display: "flex",
                  flexWrap: "wrap",
                  gap: "12px",
                  marginTop: "10px",
                }}
              >
                <Image.PreviewGroup>
                  {afterServiceImages.map((img) => (
                    <Image
                      key={img.id}
                      src={`${BASE_URL_IMAGE}${img.file_name}`}
                      alt="After Service"
                      width={120}
                      style={{
                        borderRadius: "10px",
                        objectFit: "cover",
                        boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
                      }}
                      crossOrigin="anonymous"
                    />
                  ))}
                </Image.PreviewGroup>
              </div>
            ) : (
              <p style={{ color: "#9ca3af" }}>No images uploaded</p>
            )}
          </div>
        )}
      </Modal>
    </Box>
  );
};

export default Bookings;
