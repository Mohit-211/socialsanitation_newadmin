/** @format */
import React, { useEffect, useState, useMemo } from "react";
import { Table, Button, Space, message, Input, Select, Modal } from "antd";
import dayjs from "@/lib/dayjs";
import { useNavigate } from "react-router";
import {
  DeleteServiceRequest,
  GetAllServiceRequests,
} from "../../services/Api/ServiceRequestApi";

const { Search } = Input;

const ServiceRequest = () => {
  const navigate = useNavigate();

  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);

  const [searchText, setSearchText] = useState("");

  const [selectedMonth, setSelectedMonth] = useState(dayjs().month());
  const [selectedYear, setSelectedYear] = useState(dayjs().year());

  const months = Array.from({ length: 12 }, (_, i) =>
    dayjs().month(i).format("MMMM")
  );
  const years = Array.from({ length: 10 }, (_, i) => dayjs().year() - 5 + i);

  /* ---------------- FETCH INVOICES ---------------- */

  const fetchInvoices = async (date = dayjs()) => {
    try {
      setLoading(true);

      const formattedMonth = date.format("YYYY-MM");

      const res = await GetAllServiceRequests(formattedMonth);

      setData(res.data.data || []);
    } catch {
      message.error("Failed to load service requests");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInvoices(dayjs());
  }, []);

  /* ---------------- SEARCH FILTER ---------------- */

  const filteredData = useMemo(() => {
    if (!searchText) return data;

    return data.filter((item) => {
      const name = item.request_user?.user_profile?.name?.toLowerCase() || "";
      const ref = item.ref_no?.toLowerCase() || "";
      const amount = String(item.total_due || "");

      return (
        name.includes(searchText.toLowerCase()) ||
        ref.includes(searchText.toLowerCase()) ||
        amount.includes(searchText)
      );
    });
  }, [searchText, data]);

  /* ---------------- VIEW PDF ---------------- */

  const handleViewPDF = (record) => {
    const baseUrl = "https://node.socialsanitation.com/api/v1/docs/";

    // ✅ Priority: signed PDF
    if (record.signed_file_name) {
      window.open(`${baseUrl}${record.signed_file_name}`, "_blank");
      return;
    }

    // ✅ Fallback: original PDF
    if (record.pdf_url) {
      window.open(record.pdf_url, "_blank");
      return;
    }

    message.warning("PDF not available for this invoice");
  };

  /* ---------------- DELETE ---------------- */

  const handleDelete = (invoiceId) => {
    Modal.confirm({
      title: "Delete Service Request",
      content: "Are you sure you want to delete this service request?",
      okText: "Delete",
      okType: "danger",
      onOk: async () => {
        try {
          await DeleteServiceRequest(invoiceId);

          message.success("Service request deleted successfully");

          fetchInvoices();
        } catch (error) {
          console.error("Delete error:", error);
          message.error("Failed to delete service request");
        }
      },
    });
  };

  /* ---------------- TABLE COLUMNS ---------------- */

  const columns = [
    {
      title: "Service Request #",
      dataIndex: "ref_no",
    },
    {
      title: "Client",
      render: (_, r) => r.request_user?.user_profile?.name || "-",
    },
    {
      title: "Service Days",
      dataIndex: "service_days",
      render: (v) => (v ? `${v} day${v > 1 ? "s" : ""}` : "-"),
    },
    {
      title: "Amount",
      dataIndex: "total_due",
      render: (v) => `$${Number(v).toFixed(2)}`,
    },
    {
      title: "Date",
      dataIndex: "date",
      render: (d) => (d ? dayjs(d).format("MM-DD-YYYY") : "-"),
    },
    {
      title: "Due Date",
      dataIndex: "due_date",
      render: (d) => (d ? dayjs(d).format("MM-DD-YYYY") : "-"),
    },
    {
      title: "Status",
      dataIndex: "status",
      render: (status) => {
        const isSigned = status === "SIGNED";

        return (
          <span
            style={{
              color: isSigned ? "#52c41a" : "#faad14",
              fontWeight: 600,
            }}
          >
            {isSigned ? "SIGNED" : "PENDING"}
          </span>
        );
      },
    },
    {
      title: "Action",
      render: (_, record) => (
        <Space size="middle">
          <Button onClick={() => handleViewPDF(record)}>View PDF</Button>

          {record.status !== "SIGNED" && (
            <Button
              type="primary"
              onClick={() => navigate(`/edit-service-request/${record.id}`)}
            >
              Edit
            </Button>
          )}

          <Button danger onClick={() => handleDelete(record.id)}>
            Delete
          </Button>
        </Space>
      ),
    },
  ];

  return (
    <>
      {/* HEADER */}

      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: 16,
        }}
      >
        <div>
          <h3 className="page-title">SERVICE REQUEST MANAGEMENT</h3>
          <p className="page-sub-title">View all generated service requests</p>
        </div>

        <Space>
          <Search
            placeholder="Search by ref, client, amount"
            allowClear
            onChange={(e) => setSearchText(e.target.value)}
            style={{ width: 260 }}
          />

          <Select
            value={selectedMonth}
            style={{ width: 120 }}
            onChange={(m) => {
              setSelectedMonth(m);

              const date = dayjs().year(selectedYear).month(m).startOf("month");

              fetchInvoices(date);
            }}
          >
            {months.map((m, i) => (
              <Select.Option key={i} value={i}>
                {m}
              </Select.Option>
            ))}
          </Select>

          <Select
            value={selectedYear}
            style={{ width: 100 }}
            onChange={(y) => {
              setSelectedYear(y);

              const date = dayjs()
                .year(y)
                .month(selectedMonth)
                .startOf("month");

              fetchInvoices(date);
            }}
          >
            {years.map((y) => (
              <Select.Option key={y} value={y}>
                {y}
              </Select.Option>
            ))}
          </Select>

          <Button
            type="primary"
            onClick={() => navigate("/generate-service-request")}
          >
            New Service Request
          </Button>
        </Space>
      </div>

      {/* TABLE */}

      <Table
        rowKey="id"
        columns={columns}
        dataSource={filteredData}
        loading={loading}
      />
    </>
  );
};

export default ServiceRequest;
