/** @format */

import dayjs from "@/lib/dayjs";
import React, { useEffect, useLayoutEffect, useState } from "react";
import Button from "@mui/material/Button";
import { Box } from "@mui/material";
import { useNavigate, useParams } from "react-router-dom";
import {
  DeleteContractAgreement,
  DeleteServiceEstimate,
  GetUserById,
} from "../../services/Api/Api";
import Card from "@mui/material/Card";
import { Space, Table, Tag, Col, message, Modal, Tabs } from "antd";
import EditIcon from "@mui/icons-material/Edit";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";

import {
  DeleteServiceQuote,
  GetBookingByUserId,
  GetContractAgreementsByUserId,
  GetMonthlyInvoicesByUserId,
  GetServiceEstimatesByUserId,
  GetServiceQuotesByUserId,
  GetServiceRequestsByUserId,
} from "../../services/Api/BookingApi";
import {
  IoArrowForwardCircleOutline,
  IoCalendarOutline,
  IoMailOutline,
  IoBusinessOutline,
  IoPersonOutline,
  IoDocumentTextOutline,
} from "react-icons/io5";
import "./Customers.css";
import { DeleteOutlined } from "@mui/icons-material";
import { DeleteInvoice } from "../../services/Api/InvoiceApi";

/* -------------------------------------------------------------------------- */
/* Shared presentational helpers for the Invoices / Contracts / Estimates tabs */
/* -------------------------------------------------------------------------- */

const STATUS_STYLES = {
  PAID: { bg: "#2ecc71", label: "PAID" },
  CASH_PAID: { bg: "#2ecc71", label: "PAID (CASH)" },
  NOT_PAID: { bg: "#e67e22", label: "NOT PAID" },
  EXPIRED: { bg: "#95a5a6", label: "EXPIRED" },
  SIGNED: { bg: "#2ecc71", label: "SIGNED" },
  PENDING: { bg: "#f1c40f", label: "PENDING" },
  DRAFT: { bg: "#95a5a6", label: "DRAFT" },
  SENT: { bg: "#3498db", label: "SENT" },
};

const getStatusStyle = (status) => {
  const key = status?.toUpperCase();
  if (STATUS_STYLES[key]) return STATUS_STYLES[key];
  return {
    bg: "#95a5a6",
    label: status ? status.replace(/_/g, " ").toUpperCase() : "N/A",
  };
};

const SectionHeader = ({ title }) => (
  <div
    style={{
      borderBottom: "2px solid #f0f0f0",
      paddingBottom: "16px",
      marginBottom: "24px",
    }}
  >
    <h5
      style={{
        margin: 0,
        fontWeight: "600",
        fontSize: "1.25rem",
        color: "#1a1a1a",
        letterSpacing: "-0.02em",
      }}
    >
      {title}
    </h5>
  </div>
);

const EmptyState = ({ message }) => (
  <div style={{ textAlign: "center", padding: "60px 20px", color: "#999" }}>
    <p style={{ fontSize: "15px", margin: 0 }}>{message}</p>
  </div>
);

const CardGrid = ({ children }) => (
  <div
    style={{
      display: "grid",
      gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))",
      gap: "24px",
    }}
  >
    {children}
  </div>
);

// Small square icon-button used for the Edit/Delete pair on every card header
const CardIconButton = ({ color, onClick, children }) => (
  <Button
    variant="contained"
    color={color}
    size="small"
    sx={{ minWidth: 32, width: 32, height: 32, padding: 0 }}
    onClick={onClick}
  >
    {children}
  </Button>
);

/**
 * Generic "document" card used for Monthly Invoices, Contract Agreements
 * and Service Estimates so all three share one clean, consistent look.
 *
 * statusTags: [{ label, color }]
 * details: [{ icon, label, value }]
 * actions: [{ label, href, icon, background }] OR [{ disabledMessage, bg, color }]
 */
const DocumentCard = ({
  statusTags = [],
  eyebrow,
  title,
  company,
  details = [],
  actions = [],
  onEdit,
  onDelete,
}) => (
  <Card
    style={{
      border: "1px solid #e8e8e8",
      boxShadow: "0 4px 12px rgba(0,0,0,0.06)",
      borderRadius: "12px",
      overflow: "hidden",
      transition: "all 0.3s ease",
    }}
  >
    {/* Header */}
    <div
      style={{
        background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
        padding: "20px",
        color: "white",
      }}
    >
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: "16px",
          width: "100%",
        }}
      >
        <div style={{ display: "flex", gap: "6px", flexWrap: "wrap" }}>
          {statusTags.map((tag, i) => (
            <Tag
              key={i}
              style={{
                background: tag.color,
                color: "white",
                fontWeight: 700,
                fontSize: "11px",
                padding: "4px 10px",
                borderRadius: "4px",
                border: "none",
                margin: 0,
              }}
            >
              {tag.label}
            </Tag>
          ))}
        </div>

        {(onEdit || onDelete) && (
          <div style={{ display: "flex", gap: "8px" }}>
            {onEdit && (
              <CardIconButton color="warning" onClick={onEdit}>
                <EditIcon fontSize="small" />
              </CardIconButton>
            )}
            {onDelete && (
              <CardIconButton color="error" onClick={onDelete}>
                <DeleteOutlined style={{ fontSize: 16 }} />
              </CardIconButton>
            )}
          </div>
        )}
      </div>

      <div>
        <span
          style={{
            fontSize: "11px",
            fontWeight: "600",
            opacity: 0.8,
            letterSpacing: "0.05em",
            display: "block",
            marginBottom: "2px",
          }}
        >
          {eyebrow}
        </span>
        <div
          style={{
            fontSize: "22px",
            fontWeight: "700",
            letterSpacing: "-0.01em",
          }}
        >
          {title}
        </div>
      </div>
    </div>

    {/* Body */}
    <div style={{ padding: "20px" }}>
      {company && (
        <div
          style={{
            background: "#f8f9fa",
            padding: "14px",
            borderRadius: "8px",
            marginBottom: "16px",
            display: "flex",
            alignItems: "center",
            gap: "8px",
          }}
        >
          <IoBusinessOutline
            style={{ fontSize: 16, color: "#667eea", flexShrink: 0 }}
          />
          <p
            style={{
              margin: 0,
              fontSize: "15px",
              fontWeight: "600",
              color: "#2c3e50",
              minWidth: 0,
              wordBreak: "break-word",
            }}
          >
            {company}
          </p>
        </div>
      )}

      <div
        style={{
          display: "grid",
          gap: "12px",
          marginBottom: actions.length ? "20px" : 0,
        }}
      >
        {details.map((d, i) => (
          <div
            key={i}
            style={{ display: "flex", alignItems: "flex-start", gap: "8px" }}
          >
            {d.icon && (
              <span
                style={{
                  color: "#667eea",
                  fontSize: 15,
                  marginTop: 1,
                  flexShrink: 0,
                }}
              >
                {d.icon}
              </span>
            )}
            <span
              style={{
                fontSize: "13px",
                color: "#6c757d",
                minWidth: "95px",
                fontWeight: "500",
                flexShrink: 0,
              }}
            >
              {d.label}:
            </span>
            <span
              style={{
                fontSize: "14px",
                color: "#2c3e50",
                fontWeight: "500",
                flex: 1,
                minWidth: 0,
                wordBreak: "break-word",
                overflowWrap: "anywhere",
              }}
            >
              {d.value || "N/A"}
            </span>
          </div>
        ))}
      </div>

      {actions.length > 0 && (
        <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
          {actions.map((a, i) =>
            a.disabledMessage ? (
              <div
                key={i}
                style={{
                  textAlign: "center",
                  padding: "12px",
                  background: a.bg || "#f8f9fa",
                  color: a.color || "#6c757d",
                  borderRadius: "8px",
                  fontSize: "13px",
                  fontWeight: "600",
                }}
              >
                {a.disabledMessage}
              </div>
            ) : (
              <a
                key={i}
                href={a.href}
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: "6px",
                  textAlign: "center",
                  padding: "12px",
                  background:
                    a.background ||
                    "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
                  color: "white",
                  borderRadius: "8px",
                  textDecoration: "none",
                  fontWeight: "600",
                  fontSize: "14px",
                  transition: "all 0.3s ease",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = "scale(1.02)";
                  e.currentTarget.style.boxShadow =
                    "0 4px 12px rgba(102, 126, 234, 0.4)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = "scale(1)";
                  e.currentTarget.style.boxShadow = "none";
                }}
              >
                {a.icon} {a.label}
              </a>
            ),
          )}
        </div>
      )}
    </div>
  </Card>
);

const IoCardOutlineFallback = () => <span>💰</span>;

/* -------------------------------------------------------------------------- */

const ViewCustomer = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const [userData, setUserData] = useState([]);
  const [bookingData, setBookingData] = useState([]);
  const [activeTab, setActiveTab] = useState("all");
  const [mainTab, setMainTab] = useState("overview");
  const [serviceQuotes, setServiceQuotes] = useState([]);

  const [monthlyInvoices, setMonthlyInvoices] = useState([]);
  const [contractAgreements, setContractAgreements] = useState([]);
  const [serviceEstimates, setServiceEstimates] = useState([]);
  const [serviceRequests, setServiceRequests] = useState([]);

  const fetchServiceRequests = async () => {
    try {
      const res = await GetServiceRequestsByUserId(id);
      setServiceRequests(res?.data?.data?.data || []);
    } catch (err) {
      console.error(err);
    }
  };

  const clientName = userData?.user_profile?.name || "Client";

  const handleDeleteServiceEstimate = (estimateId) => {
    Modal.confirm({
      title: "Delete Service Estimate",
      content: "Are you sure you want to delete this service estimate?",
      okText: "Delete",
      okType: "danger",
      onOk: async () => {
        try {
          await DeleteServiceEstimate(estimateId);
          message.success("Service Estimate deleted successfully");
          fetchServiceEstimates();
        } catch (error) {
          console.error(error);
          message.error("Failed to delete service estimate");
        }
      },
    });
  };

  const handleDeleteContractAgreement = (contractId) => {
    Modal.confirm({
      title: "Delete Contract Agreement",
      content: "Are you sure you want to delete this contract agreement?",
      okText: "Delete",
      okType: "danger",
      onOk: async () => {
        try {
          await DeleteContractAgreement(contractId);
          message.success("Contract Agreement deleted successfully");
          fetchContractAgreements();
        } catch (error) {
          console.error(error);
          message.error("Failed to delete contract agreement");
        }
      },
    });
  };

  const handleDeleteMonthlyInvoice = (invoiceId) => {
    Modal.confirm({
      title: "Delete Invoice",
      content: "Are you sure you want to delete this monthly invoice?",
      okText: "Delete",
      okType: "danger",
      onOk: async () => {
        try {
          await DeleteInvoice(invoiceId);
          message.success("Invoice deleted successfully");
          fetchMonthlyInvoices();
        } catch (error) {
          console.error(error);
          message.error("Failed to delete invoice");
        }
      },
    });
  };

  const fetchServiceEstimates = async () => {
    try {
      const res = await GetServiceEstimatesByUserId(id);
      setServiceEstimates(res?.data?.data?.data || []);
    } catch (err) {
      console.error("Error fetching service estimates:", err);
    }
  };

  const fetchContractAgreements = async () => {
    try {
      const res = await GetContractAgreementsByUserId(id);
      setContractAgreements(res?.data?.data?.data || []);
    } catch (err) {
      console.error("Error fetching contract agreements:", err);
    }
  };

  const fetchMonthlyInvoices = async () => {
    try {
      const res = await GetMonthlyInvoicesByUserId(id);
      setMonthlyInvoices(res?.data?.data?.data || []);
    } catch (err) {
      console.error("Error fetching monthly invoices:", err);
    }
  };

  useLayoutEffect(() => {
    GetUserById(id)
      .then((res) => {
        setUserData(res.data.data);
      })
      .catch((err) => {
        console.log(err, "error");
      });
  }, [id]);

  const getData = async (booking_status) => {
    try {
      const formData = { id: id, booking_status };
      let result = await GetBookingByUserId(formData);
      const dataWithIndex = result.data.data.map((item, index) => ({
        ...item,
        autoIncrementId: index + 1,
      }));
      setBookingData(dataWithIndex);
    } catch (e) {
      console.log(e);
    }
  };

  useEffect(() => {
    setBookingData([]);
    getData("all");
  }, [id]);

  const fetchQuotes = async () => {
    try {
      const res = await GetServiceQuotesByUserId(id);
      setServiceQuotes(res.data.data || []);
    } catch (err) {
      console.error("Error fetching service quotes:", err);
    }
  };
  useEffect(() => {
    if (id) {
      fetchQuotes();
      fetchMonthlyInvoices();
      fetchContractAgreements();
      fetchServiceEstimates();
      fetchServiceRequests();
    }
  }, [id]);

  const navigateToUser = () => {
    navigate("/users");
  };

  const handleDelete = (invoiceId) => {
    Modal.confirm({
      title: "Delete Invoice",
      content: "Are you sure you want to delete this invoice?",
      okText: "Delete",
      okType: "danger",
      onOk: async () => {
        try {
          await DeleteServiceQuote(invoiceId);
          message.success("Invoice deleted successfully");
          fetchQuotes();
        } catch (error) {
          console.error("Delete error:", error);
          message.error("Failed to delete invoice");
        }
      },
    });
  };

  const formatDate = (dateString) => {
    if (!dateString) return "";
    return dateString.split("T")[0];
  };

  const getStatusColor = (status) => {
    switch (status) {
      case "DELETED":
      case "REJECTED":
        return "red";
      case "SUCCESS":
        return "green";
      case "ACCEPTED":
        return "purple";
      case "PENDING":
        return "yellow";
      case "COMPLETED":
        return "green";
      default:
        return "geekblue";
    }
  };

  const columns = [
    { title: "ID", dataIndex: "autoIncrementId", key: "id" },
    { title: "Booking ID", dataIndex: "booking_unique_id", key: "booking_id" },
    {
      title: "Service",
      dataIndex: ["service_booking", "name"],
      key: "service",
    },
    { title: "Type", dataIndex: "type", key: "type" },
    {
      title: "Date",
      dataIndex: "date",
      key: "date",
      width: "10%",
      render: (date) => dayjs(date).format("MM/DD/YYYY"),
    },
    {
      title: "Employees",
      dataIndex: "booking_employee_details",
      key: "employees",
      render: (employees) => {
        if (employees && employees.length > 0) {
          const employeeNames = employees
            .map((employee) => employee.employee_profile?.user_profile?.name)
            .join(", ");
          return (
            employeeNames || (
              <span style={{ color: "red", fontWeight: 300 }}>
                No Employee Assigned
              </span>
            )
          );
        }
        return (
          <span style={{ color: "red", fontWeight: 300 }}>
            No Employee Assigned
          </span>
        );
      },
    },
    {
      title: "Status",
      dataIndex: "booking_status",
      key: "status",
      render: (status) => {
        const color = getStatusColor(status);
        return (
          <Tag color={color}>
            {status === "SUCCESS" ? "COMPLETED" : status.toUpperCase()}
          </Tag>
        );
      },
    },
    {
      title: "Start Time",
      dataIndex: "start_time",
      key: "start_time",
      render: (time) => (time ? new Date(time).toLocaleString() : "---"),
    },
    {
      title: "End Time",
      dataIndex: "end_time",
      key: "end_time",
      render: (time) => (time ? new Date(time).toLocaleString() : "---"),
    },
    {
      title: "",
      key: "redirect",
      render: (text, record) => (
        <IoArrowForwardCircleOutline
          style={{ fontSize: "20px" }}
          className="redirect_button"
          onClick={() => navigate(`/viewBooking/${record.id}`)}
        />
      ),
    },
  ];

  const handleTabSelect = (k) => {
    setActiveTab(k);
    let status = k === "all" ? "all" : k;
    getData(status);
  };

  const jobStatusConfig = {
    NOT_BOOKED: { label: "NOT BOOKED", color: "#f1c40f" },
    BOOKED: { label: "BOOKED", color: "#3498db" },
    EXPIRED: { label: "EXPIRED", color: "#e74c3c" },
  };

  const paymentStatusConfig = {
    NOT_PAID: { label: "NOT PAID", color: "#e67e22" },
    PAID: { label: "PAID", color: "#2ecc71" },
    CASH_PAID: { label: "PAID (CASH)", color: "#2ecc71" },
    EXPIRED: { label: "EXPIRED", color: "#95a5a6" },
  };

  const sectionCardStyle = {
    marginTop: "20px",
    marginBottom: "40px",
    background: "linear-gradient(to bottom, #ffffff, #fafafa)",
    borderRadius: "16px",
    border: "1px solid #e8e8e8",
    padding: "20px",
  };

  /* ---------------------------------------------------------------- */
  /* Booking status sub-tabs (All / Ongoing / Upcoming / Completed)     */
  /* ---------------------------------------------------------------- */
  const bookingStatusTabItems = [
    { label: "All", key: "all" },
    { label: "Ongoing", key: "ONGOING" },
    { label: "Upcoming", key: "UPCOMING" },
    { label: "Completed", key: "COMPLETED" },
  ].map((tab) => ({
    key: tab.key,
    label: tab.label,
    children: (
      <div style={{ marginTop: "20px" }}>
        <Table
          columns={columns}
          dataSource={bookingData}
          rowKey="autoIncrementId"
        />
      </div>
    ),
  }));

  /* ---------------------------------------------------------------- */
  /* Overview tab content                                               */
  /* ---------------------------------------------------------------- */
  const overviewContent = (
    <>
      <Card
        style={{
          width: "100%",
          marginTop: "20px",
          marginBottom: "40px",
          padding: "20px",
        }}
      >
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(3, 1fr)",
            gap: "20px",
            marginBottom: "40px",
          }}
        >
          <div>
            <h5
              style={{
                fontSize: "0.9rem",
                fontFamily: "Cerebri Sans,sans-serif",
                fontWeight: "700",
                marginTop: "14px",
                color: "black",
              }}
            >
              User's Name:
            </h5>
            <p>{userData?.user_profile?.name || "---"}</p>
          </div>
          <div>
            <h5
              style={{
                fontSize: "0.9rem",
                fontFamily: "Cerebri Sans,sans-serif",
                fontWeight: "700",
                marginTop: "14px",
                color: "black",
              }}
            >
              Email
            </h5>
            <p>{userData?.email || "---"}</p>
          </div>
          <div>
            <h5
              style={{
                fontSize: "0.9rem",
                fontFamily: "Cerebri Sans,sans-serif",
                fontWeight: "700",
                marginTop: "14px",
                color: "black",
              }}
            >
              Mobile:
            </h5>
            <p>{userData?.user_profile?.mobile || "---"}</p>
          </div>
          <Col>
            <div style={{ marginBottom: "1rem" }}>
              <label
                style={{ fontWeight: "bold", color: "black", display: "block" }}
              >
                Client's Addresses:
              </label>
              <div>
                {userData?.user_address?.length > 0 ? (
                  userData.user_address.map((address, index) => (
                    <div
                      key={index}
                      style={{
                        whiteSpace: "nowrap",
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                      }}
                    >
                      <li>
                        {address.address}, {address.user_city?.name},{" "}
                        {address.user_state?.name}, {address.user_country?.name}
                      </li>
                    </div>
                  ))
                ) : (
                  <div>No address available</div>
                )}
              </div>
            </div>
          </Col>
        </div>
      </Card>

      <Card style={{ padding: "20px" }}>
        <h5 style={{ marginBottom: "20px", marginTop: "20px" }}>
          View all the bookings associated with {clientName}
        </h5>
        <Tabs
          activeKey={activeTab}
          onChange={handleTabSelect}
          items={bookingStatusTabItems}
        />
      </Card>
    </>
  );

  /* ---------------------------------------------------------------- */
  /* Service Quotes tab content                                         */
  /* ---------------------------------------------------------------- */
  const quotesContent = (
    <Card style={sectionCardStyle}>
      <SectionHeader title={`Service Quotes for ${clientName}`} />

      {serviceQuotes.length === 0 ? (
        <EmptyState message="No service quotes available for this client." />
      ) : (
        <CardGrid>
          {serviceQuotes.map((quote) => (
            <Card
              key={quote.id}
              style={{
                border: "1px solid #e8e8e8",
                boxShadow: "0 4px 12px rgba(0,0,0,0.06)",
                borderRadius: "12px",
                overflow: "hidden",
                transition: "all 0.3s ease",
                cursor: "default",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.boxShadow = "0 6px 20px rgba(0,0,0,0.12)";
                e.currentTarget.style.transform = "translateY(-4px)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.boxShadow = "0 4px 12px rgba(0,0,0,0.06)";
                e.currentTarget.style.transform = "translateY(0)";
              }}
            >
              <div
                style={{
                  background:
                    "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
                  padding: "20px",
                  color: "white",
                }}
              >
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    marginBottom: "16px",
                    width: "100%",
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      gap: "6px",
                      alignItems: "center",
                    }}
                  >
                    <Tag
                      style={{
                        background: jobStatusConfig[quote.job_status]?.color,
                        color: "white",
                        fontWeight: 700,
                        fontSize: "11px",
                        padding: "4px 10px",
                        borderRadius: "4px",
                        border: "none",
                        margin: 0,
                      }}
                    >
                      {jobStatusConfig[quote.job_status]?.label}
                    </Tag>

                    <Tag
                      style={{
                        background:
                          paymentStatusConfig[quote.payment_status]?.color,
                        color: "white",
                        fontWeight: 700,
                        fontSize: "11px",
                        padding: "4px 10px",
                        borderRadius: "4px",
                        border: "none",
                        margin: 0,
                      }}
                    >
                      {paymentStatusConfig[quote.payment_status]?.label}
                    </Tag>
                  </div>

                  <div style={{ display: "flex", gap: "8px" }}>
                    <CardIconButton
                      color="warning"
                      onClick={() =>
                        navigate(`/edit-service-quote/${quote.id}`)
                      }
                    >
                      <EditIcon fontSize="small" />
                    </CardIconButton>
                    <CardIconButton
                      color="error"
                      onClick={() => handleDelete(quote.id)}
                    >
                      <DeleteOutlined style={{ fontSize: 16 }} />
                    </CardIconButton>
                  </div>
                </div>

                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                  }}
                >
                  <div>
                    <span
                      style={{
                        fontSize: "11px",
                        fontWeight: "600",
                        opacity: 0.8,
                        letterSpacing: "0.05em",
                        display: "block",
                        marginBottom: "2px",
                      }}
                    >
                      QUOTE REFERENCE
                    </span>
                    <div
                      style={{
                        fontSize: "22px",
                        fontWeight: "700",
                        letterSpacing: "-0.01em",
                      }}
                    >
                      {quote.ref_no}
                    </div>
                  </div>

                  <Tag
                    style={{
                      background: "rgba(255,255,255,0.25)",
                      border: "1px solid rgba(255,255,255,0.3)",
                      color: "white",
                      fontWeight: "700",
                      fontSize: "18px",
                      padding: "6px 14px",
                      borderRadius: "6px",
                      margin: 0,
                    }}
                  >
                    ${Number(quote.total_due).toFixed(2)}
                  </Tag>
                </div>
              </div>

              <div style={{ padding: "20px" }}>
                <div
                  style={{
                    background: "#f8f9fa",
                    padding: "14px",
                    borderRadius: "8px",
                    marginBottom: "16px",
                  }}
                >
                  <p
                    style={{
                      margin: 0,
                      fontSize: "15px",
                      fontWeight: "600",
                      color: "#2c3e50",
                    }}
                  >
                    {quote.to_company_name}
                  </p>
                </div>

                <div
                  style={{ display: "grid", gap: "12px", marginBottom: "16px" }}
                >
                  <div style={{ display: "flex", alignItems: "flex-start" }}>
                    <span
                      style={{
                        fontSize: "13px",
                        color: "#6c757d",
                        minWidth: "100px",
                        fontWeight: "500",
                      }}
                    >
                      Service Dates:
                    </span>
                    <span
                      style={{
                        fontSize: "14px",
                        color: "#2c3e50",
                        fontWeight: "500",
                      }}
                    >
                      {quote.service_dates
                        ? dayjs(quote.service_dates).format(
                            "MM-DD-YYYY hh:mm A",
                          )
                        : "N/A"}
                    </span>
                  </div>

                  <div style={{ display: "flex", alignItems: "flex-start" }}>
                    <span
                      style={{
                        fontSize: "13px",
                        color: "#6c757d",
                        minWidth: "100px",
                        fontWeight: "500",
                      }}
                    >
                      Due Date:
                    </span>
                    <span
                      style={{
                        fontSize: "14px",
                        color: "#2c3e50",
                        fontWeight: "500",
                      }}
                    >
                      {quote.due_date
                        ? dayjs(quote.due_date).format("MM-DD-YYYY hh:mm A")
                        : "N/A"}
                    </span>
                  </div>

                  {(quote.address_1 || quote.address_2) && (
                    <div style={{ display: "flex", alignItems: "flex-start" }}>
                      <span
                        style={{
                          fontSize: "13px",
                          color: "#6c757d",
                          minWidth: "100px",
                          fontWeight: "500",
                        }}
                      >
                        Address:
                      </span>
                      <span
                        style={{ fontSize: "14px", color: "#2c3e50", flex: 1 }}
                      >
                        {quote.address_1 || ""} {quote.address_2 || ""}
                      </span>
                    </div>
                  )}
                </div>

                <div
                  style={{
                    borderTop: "1px solid #e9ecef",
                    paddingTop: "16px",
                    marginTop: "16px",
                  }}
                >
                  <h6
                    style={{
                      margin: "0 0 12px 0",
                      fontSize: "13px",
                      fontWeight: "600",
                      color: "#495057",
                      textTransform: "uppercase",
                      letterSpacing: "0.5px",
                    }}
                  >
                    Items
                  </h6>
                  <div style={{ display: "grid", gap: "8px" }}>
                    {quote.service_quote_item?.map((item) => (
                      <div
                        key={item.id}
                        style={{
                          background: "#f8f9fa",
                          padding: "10px 12px",
                          borderRadius: "6px",
                          borderLeft: "3px solid #667eea",
                        }}
                      >
                        <div
                          style={{
                            fontSize: "14px",
                            color: "#2c3e50",
                            marginBottom: "4px",
                            fontWeight: "500",
                          }}
                        >
                          {item.description}
                        </div>
                        <div
                          style={{
                            display: "flex",
                            justifyContent: "space-between",
                            fontSize: "13px",
                            color: "#6c757d",
                          }}
                        >
                          <span>{item.frequency || "N/A"}</span>
                          <span style={{ fontWeight: "600", color: "#667eea" }}>
                            ${Number(item.amount).toFixed(2)}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div style={{ marginTop: "16px" }}>
                  {quote.payment_status === "PAID" ? (
                    <div
                      style={{
                        textAlign: "center",
                        padding: "12px",
                        background: "#d4edda",
                        color: "#155724",
                        borderRadius: "8px",
                        fontSize: "13px",
                        fontWeight: "600",
                      }}
                    >
                      ✅ Payment Completed
                    </div>
                  ) : quote.payment_status === "EXPIRED" ? (
                    <div
                      style={{
                        textAlign: "center",
                        padding: "12px",
                        background: "#fff3cd",
                        color: "#856404",
                        borderRadius: "8px",
                        fontSize: "13px",
                        fontWeight: "600",
                      }}
                    >
                      ⏰ Payment Link Expired
                    </div>
                  ) : quote.square_payment_url ? (
                    <a
                      href={quote.square_payment_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{
                        display: "block",
                        textAlign: "center",
                        padding: "12px",
                        background:
                          "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
                        color: "white",
                        borderRadius: "8px",
                        textDecoration: "none",
                        fontWeight: "600",
                        fontSize: "14px",
                        transition: "all 0.3s ease",
                        border: "none",
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.transform = "scale(1.02)";
                        e.currentTarget.style.boxShadow =
                          "0 4px 12px rgba(102, 126, 234, 0.4)";
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.transform = "scale(1)";
                        e.currentTarget.style.boxShadow = "none";
                      }}
                    >
                      💳 View Payment Link
                    </a>
                  ) : (
                    <div
                      style={{
                        textAlign: "center",
                        padding: "12px",
                        background: "#f8f9fa",
                        color: "#6c757d",
                        borderRadius: "8px",
                        fontSize: "13px",
                        fontWeight: "500",
                      }}
                    >
                      ⚠️ Payment Link Not Available
                    </div>
                  )}
                </div>
              </div>
            </Card>
          ))}
        </CardGrid>
      )}
    </Card>
  );

  /* ---------------------------------------------------------------- */
  /* Monthly Invoices tab content                                       */
  /* ---------------------------------------------------------------- */
  const invoicesContent = (
    <Card style={sectionCardStyle}>
      <SectionHeader title={`Monthly Invoices for ${clientName}`} />

      {monthlyInvoices.length === 0 ? (
        <EmptyState message="No monthly invoices available for this client." />
      ) : (
        <CardGrid>
          {monthlyInvoices.map((invoice) => {
            const paymentStatus = getStatusStyle(invoice.payment_status);
            return (
              <DocumentCard
                key={invoice.id}
                statusTags={[
                  { label: paymentStatus.label, color: paymentStatus.bg },
                ]}
                eyebrow="INVOICE REF"
                title={invoice.ref_no}
                company={invoice.to_company_name}
                onEdit={() => navigate(`/edit-invoice/${invoice.id}`)}
                onDelete={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  handleDeleteMonthlyInvoice(invoice.id);
                }}
                details={[
                  {
                    icon: <IoCalendarOutline />,
                    label: "Billing Date",
                    value: invoice.billing_date
                      ? dayjs(invoice.billing_date).format("MM/DD/YYYY")
                      : null,
                  },
                  {
                    icon: <IoCalendarOutline />,
                    label: "Due Date",
                    value: invoice.due_date
                      ? dayjs(invoice.due_date).format("MM/DD/YYYY")
                      : null,
                  },
                  {
                    icon: <IoDocumentTextOutline />,
                    label: "Service Dates",
                    value: invoice.service_dates,
                  },
                  {
                    icon: <IoCardOutlineFallback />,
                    label: "Amount Due",
                    value: `$${Number(invoice.total_due || 0).toFixed(2)}`,
                  },
                ]}
                actions={[
                  invoice.pdf_url && {
                    href: invoice.pdf_url,
                    label: "View Invoice",
                    icon: "📄",
                  },
                  invoice.payment_url && {
                    href: invoice.payment_url,
                    label: "Payment Link",
                    icon: "💳",
                    background: "#2ecc71",
                  },
                ].filter(Boolean)}
              />
            );
          })}
        </CardGrid>
      )}
    </Card>
  );

  /* ---------------------------------------------------------------- */
  /* Contract Agreements tab content                                    */
  /* ---------------------------------------------------------------- */
  const contractsContent = (
    <Card style={sectionCardStyle}>
      <SectionHeader title={`Contract Agreements for ${clientName}`} />

      {contractAgreements.length === 0 ? (
        <EmptyState message="No contract agreements available for this client." />
      ) : (
        <CardGrid>
          {contractAgreements.map((agreement) => {
            const status = getStatusStyle(agreement.status);
            return (
              <DocumentCard
                key={agreement.id}
                statusTags={[{ label: status.label, color: status.bg }]}
                eyebrow="AGREEMENT"
                title="Contract Agreement"
                company={agreement.client_company_name}
                onEdit={() =>
                  navigate(`/edit-contract-agreement/${agreement.id}`)
                }
                onDelete={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  handleDeleteContractAgreement(agreement.id);
                }}
                details={[
                  {
                    icon: <IoPersonOutline />,
                    label: "Client",
                    value: agreement.client_name,
                  },
                  {
                    icon: <IoMailOutline />,
                    label: "Email",
                    value: agreement.client_email,
                  },
                  {
                    icon: <IoCalendarOutline />,
                    label: "Created",
                    value: agreement.created_at
                      ? dayjs(agreement.created_at).format("MM/DD/YYYY")
                      : null,
                  },
                ]}
                actions={[
                  agreement.file_url && {
                    href: agreement.file_url,
                    label: "View Agreement",
                    icon: "📄",
                  },
                  agreement.payment_url && {
                    href: agreement.payment_url,
                    label: "Payment Link",
                    icon: "💳",
                    background: "#2ecc71",
                  },
                ].filter(Boolean)}
              />
            );
          })}
        </CardGrid>
      )}
    </Card>
  );

  /* ---------------------------------------------------------------- */
  /* Service Estimates tab content                                      */
  /* ---------------------------------------------------------------- */
  const estimatesContent = (
    <Card style={sectionCardStyle}>
      <SectionHeader title={`Service Estimates for ${clientName}`} />

      {serviceEstimates.length === 0 ? (
        <EmptyState message="No service estimates available for this client." />
      ) : (
        <CardGrid>
          {serviceEstimates.map((estimate) => {
            const status = getStatusStyle(estimate.status);
            return (
              <DocumentCard
                key={estimate.id}
                statusTags={[{ label: status.label, color: status.bg }]}
                eyebrow="ESTIMATE"
                title="Service Estimate"
                company={estimate.client_company_name}
                onEdit={() => navigate(`/edit-service-estimate/${estimate.id}`)}
                onDelete={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  handleDeleteServiceEstimate(estimate.id);
                }}
                details={[
                  {
                    icon: <IoMailOutline />,
                    label: "Email",
                    value: estimate.client_email,
                  },
                  {
                    icon: <IoCalendarOutline />,
                    label: "Created",
                    value: estimate.created_at
                      ? dayjs(estimate.created_at).format("MM/DD/YYYY")
                      : null,
                  },
                ]}
                actions={[
                  estimate.file_url && {
                    href: estimate.file_url,
                    label: "View Service Estimate",
                    icon: "📄",
                  },
                ].filter(Boolean)}
              />
            );
          })}
        </CardGrid>
      )}
    </Card>
  );

  /* ---------------------------------------------------------------- */
  /* Service Requests tab content                                       */
  /* ---------------------------------------------------------------- */
  const serviceRequestsContent = (
    <Card style={sectionCardStyle}>
      <SectionHeader title={`Service Requests for ${clientName}`} />

      {serviceRequests.length === 0 ? (
        <EmptyState message="No service requests available for this client." />
      ) : (
        <CardGrid>
          {serviceRequests.map((request) => {
            const paymentStatus = getStatusStyle(request.payment_status);

            return (
              <DocumentCard
                key={request.id}
                statusTags={[
                  { label: paymentStatus.label, color: paymentStatus.bg },
                ]}
                eyebrow="SERVICE REQUEST"
                title={request.ref_no}
                company={request.to_company_name}
                onEdit={() => navigate(`/edit-service-request/${request.id}`)}
                onDelete={() => handleDelete(request.id)}
                details={[
                  {
                    icon: <IoCalendarOutline />,
                    label: "Date",
                    value: request.date
                      ? dayjs(request.date).format("MM/DD/YYYY")
                      : null,
                  },
                  {
                    icon: <IoCalendarOutline />,
                    label: "Due Date",
                    value: request.due_date
                      ? dayjs(request.due_date).format("MM/DD/YYYY")
                      : null,
                  },
                  {
                    icon: <IoDocumentTextOutline />,
                    label: "Service Days",
                    value: request.service_days,
                  },
                  {
                    icon: <IoCardOutlineFallback />,
                    label: "Amount",
                    value: `$${Number(request.total_due || 0).toFixed(2)}`,
                  },
                ]}
                actions={[
                  request.file_url && {
                    href: request.file_url,
                    label: "View Service Request",
                    icon: "📄",
                  },
                ].filter(Boolean)}
              />
            );
          })}
        </CardGrid>
      )}
    </Card>
  );

  const mainTabItems = [
    { key: "overview", label: "Overview", children: overviewContent },
    {
      key: "quotes",
      label: `Service Quotes (${serviceQuotes.length})`,
      children: quotesContent,
    },
    {
      key: "invoices",
      label: `Monthly Invoices (${monthlyInvoices.length})`,
      children: invoicesContent,
    },
    {
      key: "contracts",
      label: `Contract Agreements (${contractAgreements.length})`,
      children: contractsContent,
    },
    {
      key: "estimates",
      label: `Service Estimates (${serviceEstimates.length})`,
      children: estimatesContent,
    },
    {
      key: "serviceRequests",
      label: `Service Requests (${serviceRequests.length})`,
      children: serviceRequestsContent,
    },
  ];

  return (
    <Box>
      <Box
        display="flex"
        justifyContent="space-between"
        alignItems="center"
        width="100%"
        mb={4}
      >
        <Box flex={1}>
          <h3 className="page-title">CLIENT MANAGEMENT</h3>
          <p className="page-sub-title">View Information related with Client</p>
        </Box>

        <Button
          variant="outlined"
          color="inherit"
          startIcon={<ArrowBackIcon />}
          onClick={navigateToUser}
          sx={{
            height: 47,
            borderRadius: "6px",
            minWidth: 180,
          }}
        >
          Return to Clients
        </Button>
      </Box>

      <div className="admin_details_form">
        <Tabs
          activeKey={mainTab}
          onChange={(k) => setMainTab(k)}
          className="mb-4 client-main-tabs"
          items={mainTabItems}
        />
      </div>
    </Box>
  );
};

export default ViewCustomer;
