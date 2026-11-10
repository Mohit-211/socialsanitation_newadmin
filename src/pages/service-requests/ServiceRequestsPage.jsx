import { useEffect, useState, useMemo } from "react";
import { Table, Button, Space, message, Input, Select, Modal } from "antd";
import dayjs from "@/lib/dayjs";
import { useNavigate } from "react-router";
import { Plus, Search } from "lucide-react";
import PageHeader from "@/components/PageHeader";
import {
  DeleteServiceRequest,
  GetAllServiceRequests,
} from "@/services/api/serviceRequestApi";
import { API_BASE_URL } from "@/config/env";
import "./serviceRequests.scss";

const ServiceRequestsPage = () => {
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

  /* FETCH INVOICES */

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

  /* SEARCH FILTER */

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

  /* VIEW PDF */

  const handleViewPDF = (record) => {
    const baseUrl = `${API_BASE_URL}docs/`;

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

  /* DELETE */

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

  /* TABLE COLUMNS */

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
            className={`service-request-list__status service-request-list__status--${
              isSigned ? "signed" : "pending"
            }`}
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
      <PageHeader
        title="SERVICE REQUEST MANAGEMENT"
        subtitle="View all generated service requests"
        actions={
          <>
            <Input
              allowClear
              size="large"
              prefix={<Search size={16} color="var(--color-text-subtle)" />}
              placeholder="Search by ref, client, amount"
              onChange={(e) => setSearchText(e.target.value)}
              className="service-request-list__search"
            />

            <Select
              size="large"
              value={selectedMonth}
              className="service-request-list__month"
              onChange={(m) => {
                setSelectedMonth(m);

                const date = dayjs()
                  .year(selectedYear)
                  .month(m)
                  .startOf("month");

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
              size="large"
              value={selectedYear}
              className="service-request-list__year"
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
              size="large"
              icon={<Plus size={16} />}
              onClick={() => navigate("/generate-service-request")}
            >
              New Service Request
            </Button>
          </>
        }
      />

      {/* TABLE */}

      <Table
        rowKey="id"
        columns={columns}
        dataSource={filteredData}
        loading={loading}
        bordered
        size="middle"
      />
    </>
  );
};

export default ServiceRequestsPage;
