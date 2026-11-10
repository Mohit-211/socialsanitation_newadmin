import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router";

import {
  Tag,
  Table,
  Space,
  message,
  Dropdown,
  Spin,
  Image,
  Modal,
  Tabs,
  Input,
  Button,
} from "antd";
import { BASE_URL_IMAGE } from "../../services/Host";
import { GetUserBooking, DeleteBooking, GetBookingById } from "../../services/Api/BookingApi";
import {
  Search,
  Plus,
  CalendarDays,
  Images,
  Eye,
  Pencil,
  Trash2,
} from "lucide-react";
import PageHeader from "../../components/PageHeader";
import IconAction from "../../components/IconAction";
import "./Bookings.css";
import dayjs from "@/lib/dayjs";

const PAGE_SIZE = 100;

const Bookings = () => {
  const navigate = useNavigate();
  const [bookingData, setBookingData] = useState([]);
  const [searchText, setSearchText] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const requestIdRef = useRef(0);

  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState("PENDING");
  const [nestedTab, setNestedTab] = useState("all");
  const [tableParams, setTableParams] = useState({
    pagination: {
      current: 1,
      pageSize: PAGE_SIZE,
      total: 0,
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

  const getData = async (booking_status, period, page = 1, search = "") => {
    const requestId = ++requestIdRef.current; // ignore stale responses
    try {
      setLoading(true);
      // Ask for one extra row — if it comes back, there is a next page
      const result = await GetUserBooking(
        localStorage.getItem("adminToken"),
        booking_status,
        period,
        page,
        PAGE_SIZE + 1,
        search,
      );
      if (requestId !== requestIdRef.current) return;

      const allRows = result.data.data || [];

      // Deleted the last row on the last page → step back one page
      if (allRows.length === 0 && page > 1) {
        getData(booking_status, period, page - 1, search);
        return;
      }

      const hasMore = allRows.length > PAGE_SIZE;
      const rows = allRows.slice(0, PAGE_SIZE);
      const total = hasMore
        ? page * PAGE_SIZE + 1
        : (page - 1) * PAGE_SIZE + rows.length;

      const newData = rows.map((item, index) => ({
        ...item,
        index: (page - 1) * PAGE_SIZE + index + 1,
      }));
      setBookingData(newData);
      setTableParams((prev) => ({
        ...prev,
        pagination: { ...prev.pagination, current: page, total },
      }));
    } catch (e) {
      if (requestId !== requestIdRef.current) return;
      console.error(e);
      if (e.response && e.response.status === 401) {
        navigate("/error401");
      } else {
        console.error("Error loading data. Please try again later.");
      }
    } finally {
      if (requestId === requestIdRef.current) setLoading(false);
    }
  };

  // Debounce typing so we don't hit the API on every keystroke
  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(searchText.trim()), 400);
    return () => clearTimeout(t);
  }, [searchText]);

  // Tab / period / search change → reload from page 1
  useEffect(() => {
    getData(activeTab, nestedTab, 1, debouncedSearch);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab, nestedTab, debouncedSearch]);

  const navigateToViewBooking = (id) => {
    navigate(`/viewBooking/${id}`);
  };

  const navigateToEditBooking = (id) => {
    navigate(`/editBooking/${id}`);
  };

  const handleTableChange = (pagination, filters, sorter) => {
    setTableParams((prev) => ({
      ...prev,
      filters,
      sortField: sorter.field,
      sortOrder: sorter.order,
    }));
    if (pagination.current !== tableParams.pagination.current) {
      getData(activeTab, nestedTab, pagination.current, debouncedSearch);
    }
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
        const color = isClient ? "success" : "processing";
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
      render: (date) => dayjs.utc(date).format("ddd, MM/DD/YYYY"),
    },
    {
      title: "Employee Assigned",
      dataIndex: "booking_employee_details",
      key: "employee_assigned",
      width: 170,
      render: (employees) => {
        if (!employees || employees.length === 0) {
          return <span className="bookings-list__unassigned">Not Assigned</span>;
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
            color = "warning";
            break;
          case "SUCCESS":
            color = "success";
            displayStatus = "COMPLETED";
            break;
          case "ACCEPTED":
            color = "processing";
            break;
          case "REJECTED":
            color = "error";
            break;
          case "CANCELLED":
            color = "error";
            break;
          case "DELETED":
            color = "error";
            break;
          case "ONGOING":
            color = "processing";
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
            <IconAction
              icon={Images}
              title="View Image Gallery"
              onClick={() => handleOpenGallery(record.id)}
            />

            <IconAction
              icon={Eye}
              title="View Details"
              onClick={() => navigateToViewBooking(record.id)}
            />

            {(activeTab === "PENDING" || activeTab === "UPCOMING") && (
              <IconAction
                icon={Pencil}
                title="Update Details"
                onClick={() => navigateToEditBooking(record.id)}
              />
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
                <IconAction icon={Trash2} title="Delete Options" danger />
              </Dropdown>
            ) : (
              <IconAction
                icon={Trash2}
                title="Delete"
                danger
                onClick={() => handleDelete(record.id, "this")}
              />
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
            getData(
              activeTab,
              nestedTab,
              tableParams.pagination.current,
              debouncedSearch,
            );
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

  const onSearch = (value) => {
    setSearchText(value);
  };

  return (
    <div>
      <PageHeader
        title="BOOKING MANAGEMENT"
        subtitle="View and manage user bookings"
        actions={
          <>
            <Input
              allowClear
              size="large"
              className="bookings-list__search"
              prefix={<Search size={16} color="var(--color-text-subtle)" />}
              placeholder="Search bookings..."
              value={searchText}
              onChange={(e) => onSearch(e.target.value)}
            />

            <Button
              size="large"
              icon={<CalendarDays size={16} />}
              onClick={navigateToMonthlyCalendar}
            >
              Monthly Calendar
            </Button>

            <Button
              type="primary"
              size="large"
              icon={<Plus size={16} />}
              onClick={navigateToCreateAppointment}
            >
              Create Appointment
            </Button>
          </>
        }
      />

      {/* Main Tabs */}
      <div className="surface bookings-tabs">
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
      </div>

      {/* Nested Tabs */}
      {nestedTabsContent[activeTab] &&
        nestedTabsContent[activeTab].length > 0 && (
          <div className="surface bookings-tabs">
            <Tabs
              activeKey={nestedTab}
              onChange={(key) => setNestedTab(key)}
              size="small"
              items={nestedTabsContent[activeTab].map((tab) => ({
                key: tab.key,
                label: tab.label,
              }))}
            />
          </div>
        )}

      {/* Table with loading overlay so tab switches don't feel glitchy */}
      <Spin spinning={loading} description="Loading bookings...">
        <div className="bookings-list__table">
          <Table
            columns={columns}
            rowKey={(record) => record.id}
            dataSource={bookingData}
            pagination={{ ...tableParams.pagination, showSizeChanger: false }}
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
          <div className="bookings-gallery__loading">
            <Spin size="large" />
          </div>
        ) : (
          <div>
            <h4 className="section-title bookings-gallery__heading">
              Before Service
            </h4>
            {beforeServiceImages?.length > 0 ? (
              <div className="bookings-gallery__grid">
                <Image.PreviewGroup>
                  {beforeServiceImages.map((img) => (
                    <Image
                      key={img.id}
                      src={`${BASE_URL_IMAGE}${img.file_name}`}
                      alt="Before Service"
                      width={120}
                      className="bookings-gallery__image"
                      crossOrigin="anonymous"
                    />
                  ))}
                </Image.PreviewGroup>
              </div>
            ) : (
              <p className="text-muted">No images uploaded</p>
            )}

            <h4 className="section-title bookings-gallery__heading bookings-gallery__heading--spaced">
              After Service
            </h4>
            {afterServiceImages?.length > 0 ? (
              <div className="bookings-gallery__grid">
                <Image.PreviewGroup>
                  {afterServiceImages.map((img) => (
                    <Image
                      key={img.id}
                      src={`${BASE_URL_IMAGE}${img.file_name}`}
                      alt="After Service"
                      width={120}
                      className="bookings-gallery__image"
                      crossOrigin="anonymous"
                    />
                  ))}
                </Image.PreviewGroup>
              </div>
            ) : (
              <p className="text-muted">No images uploaded</p>
            )}
          </div>
        )}
      </Modal>
    </div>
  );
};

export default Bookings;
