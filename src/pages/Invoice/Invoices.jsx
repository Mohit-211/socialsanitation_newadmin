import { useEffect, useState, useMemo } from "react";
import { Table, Tag, Button, message, Modal, Input, Select, Flex } from "antd";
import dayjs from "@/lib/dayjs";
import InvoiceViewModal from "./InvoiceViewModal";
import { useNavigate } from "react-router";
import {
  GetInvoices,
  GetMonthlyInvoicesSummary,
  MarkInvoiceBooked,
  MarkInvoiceCheckPaid,
  MarkInvoiceACHPaid,
} from "../../services/Api/InvoiceApi";
import { DeleteServiceQuote } from "../../services/Api/BookingApi";
import { BASE_URL } from "../../services/Host";
import PageHeader from "../../components/PageHeader";
import IconAction from "../../components/IconAction";
import { saveXlsx, excelStyles } from "../../utils/excel";
import { cssVar } from "../../theme/antdTheme";
import {
  Search as SearchIcon,
  Download,
  Eye,
  FileText,
  CircleCheck,
  Banknote,
  Trash2,
  Pencil,
} from "lucide-react";
import "./Invoices.scss";

// Status colors are antd Tag presets, themed by the app's antd theme.
const jobStatusConfig = {
  NOT_BOOKED: { label: "NOT BOOKED", color: "warning" },
  BOOKED: { label: "BOOKED", color: "processing" },
  EXPIRED: { label: "EXPIRED", color: "error" },
};

const paymentStatusConfig = {
  NOT_PAID: { label: "NOT PAID", color: "warning" },
  PAID: { label: "PAID", color: "success" },
  CASH_PAID: { label: "PAID (CASH)", color: "success" },
  CHECK_PAID: { label: "PAID (CHECK)", color: "success" },
  ACH_PAID: { label: "PAID (ACH)", color: "success" },
};

const PDF_BASE_URL = `${BASE_URL}docs`;

const getPdfUrl = (record) => {
  if (record.pdf_url) return record.pdf_url;
  return `${PDF_BASE_URL}/quote-${record.ref_no}.pdf`;
};

const handleViewPdf = (record) => {
  const url = getPdfUrl(record);
  window.open(url, "_blank", "noopener,noreferrer");
};

const Invoices = () => {
  const navigate = useNavigate();

  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedInvoice, setSelectedInvoice] = useState(null);

  const [searchText, setSearchText] = useState("");

  const [selectedMonth, setSelectedMonth] = useState(dayjs().month());
  const [selectedYear, setSelectedYear] = useState(dayjs().year());

  const months = Array.from({ length: 12 }, (_, i) =>
    dayjs().month(i).format("MMMM"),
  );
  const years = Array.from({ length: 10 }, (_, i) => dayjs().year() - 5 + i);

  const [payModalOpen, setPayModalOpen] = useState(false);
  const [payModalInvoiceId, setPayModalInvoiceId] = useState(null);
  const [payModalLoading, setPayModalLoading] = useState(null);

  const openPayModal = (id) => {
    setPayModalInvoiceId(id);
    setPayModalOpen(true);
  };

  const closePayModal = () => {
    setPayModalOpen(false);
    setPayModalInvoiceId(null);
    setPayModalLoading(null);
  };

  const handleConfirmPay = async (method) => {
    if (!payModalInvoiceId) return;

    setPayModalLoading(method);
    try {
      if (method === "check") {
        await MarkInvoiceCheckPaid(payModalInvoiceId);
        message.success("Invoice marked as Paid by Check");
      } else {
        await MarkInvoiceACHPaid(payModalInvoiceId);
        message.success("Invoice marked as Paid by ACH");
      }

      fetchInvoices(selectedMonth, selectedYear);
      closePayModal();
    } catch (error) {
      const backendMessage =
        error?.response?.data?.message ||
        "Failed to mark invoice as paid by " + (method === "check" ? "check" : "ACH");
      message.error(backendMessage);
      setPayModalLoading(null);
    }
  };

  const fetchInvoices = async (m = selectedMonth, y = selectedYear) => {
    try {
      setLoading(true);

      const formattedMonth = dayjs().year(y).month(m).format("YYYY-MM");

      const res = await GetInvoices(formattedMonth);
      setData(res.data.data || []);
    } catch {
      message.error("Failed to load invoices");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInvoices(selectedMonth, selectedYear);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleMarkBooked = async (id) => {
    try {
      await MarkInvoiceBooked(id);
      message.success("Invoice marked as BOOKED");

      fetchInvoices(selectedMonth, selectedYear);
    } catch {
      message.error("Failed to mark as booked");
    }
  };

  const filteredData = useMemo(() => {
    if (!searchText) return data;

    return data.filter((item) => {
      const name = item.payment_user?.user_profile?.name?.toLowerCase() || "";
      const ref = item.ref_no?.toLowerCase() || "";
      const amount = String(item.total_due || "");

      return (
        name.includes(searchText.toLowerCase()) ||
        ref.includes(searchText.toLowerCase()) ||
        amount.includes(searchText)
      );
    });
  }, [searchText, data]);

  const columns = [
    { title: "Invoice #", dataIndex: "ref_no" },
    {
      title: "Client",
      render: (_, r) => r.payment_user?.user_profile?.name || "-",
    },
    {
      title: "Amount",
      dataIndex: "total_due",
      render: (v) => "$" + Number(v).toFixed(2),
    },
    {
      title: "Job Status",
      dataIndex: "job_status",
      render: (s) => (
        <Tag color={jobStatusConfig[s]?.color}>{jobStatusConfig[s]?.label}</Tag>
      ),
    },
    {
      title: "Payment Status",
      dataIndex: "payment_status",
      render: (s) => (
        <Tag color={paymentStatusConfig[s]?.color}>
          {paymentStatusConfig[s]?.label}
        </Tag>
      ),
    },
    {
      title: "Expiry",
      dataIndex: "expires_at",
      render: (d) => dayjs(d).format("MM/DD/YYYY"),
    },
    {
      title: "Actions",
      render: (_, record) => (
        <Flex gap={6} className="invoices__actions">
          <IconAction
            icon={Eye}
            title="View Details"
            onClick={() => setSelectedInvoice(record)}
          />

          <IconAction
            icon={Pencil}
            title="Edit Quote"
            onClick={() => navigate("/edit-service-quote/" + record.id)}
          />

          <IconAction
            icon={FileText}
            title="View PDF"
            onClick={() => handleViewPdf(record)}
          />

          {record.job_status === "NOT_BOOKED" && (
            <IconAction
              icon={CircleCheck}
              title="Mark Booked"
              onClick={() => handleMarkBooked(record.id)}
            />
          )}

          {record.payment_status === "NOT_PAID" && (
            <IconAction
              icon={Banknote}
              title="Mark Paid by Check/ACH"
              onClick={() => openPayModal(record.id)}
            />
          )}

          <IconAction
            icon={Trash2}
            title="Delete Invoice"
            danger
            onClick={() => handleDelete(record.id)}
          />
        </Flex>
      ),
    },
  ];

  const handleDownloadExcel = async () => {
    try {
      const formattedMonth = dayjs()
        .year(selectedYear)
        .month(selectedMonth)
        .format("YYYY-MM");

      const res = await GetMonthlyInvoicesSummary(formattedMonth);
      const users = res.data.data || [];

      const monthName = dayjs(formattedMonth).format("MMMM YYYY");
      const monthShort = dayjs(formattedMonth).format("MMM");

      const ordinalSuffix = (n) => {
        const j = n % 10;
        const k = n % 100;
        if (j === 1 && k !== 11) return "st";
        if (j === 2 && k !== 12) return "nd";
        if (j === 3 && k !== 13) return "rd";
        return "th";
      };

      const formatDayHeader = (d) => "" + d + ordinalSuffix(d) + " " + monthShort;

      const allDates = [];
      users.forEach((user) => {
        (user.invoices || []).forEach((inv) => {
          if (inv.created_at) {
            allDates.push(dayjs(inv.created_at).date());
          }
        });
      });

      const dayNumbers = Array.from(new Set(allDates)).sort((a, b) => a - b);

      // Themed cell styles (header, status fills, currency format...).
      const styles = excelStyles();

      const paidStatuses = ["PAID", "CASH_PAID", "CHECK_PAID", "ACH_PAID"];

      const getFinalStatus = (inv) => {
        if (paidStatuses.includes(inv.payment_status)) return "PAID";
        return "NOT_PAID";
      };

      let totalInvoices = 0;
      let totalAmount = 0;
      let paidCount = 0;
      let paidAmount = 0;
      let notPaidCount = 0;
      let notPaidAmount = 0;

      users.forEach((user) => {
        (user.invoices || []).forEach((inv) => {
          const amount = Number(inv.total_due || 0);
          totalInvoices++;
          totalAmount += amount;

          if (paidStatuses.includes(inv.payment_status)) {
            paidCount++;
            paidAmount += amount;
          } else {
            notPaidCount++;
            notPaidAmount += amount;
          }
        });
      });

      const mergeSpan = Math.max(6, dayNumbers.length + 1);

      // Rows are 34pt high (the sheet's row height); client rows grow with
      // the number of quotes on their busiest day.
      const ROW_HEIGHT = 34;

      // One cell merged across the full report width.
      const mergedRow = (cell) => [
        { ...cell, columnSpan: mergeSpan, height: ROW_HEIGHT },
        ...Array(mergeSpan - 1).fill(null),
      ];

      const rows = [];

      rows.push(
        mergedRow({
          value: "Service Quote Invoices - " + monthName,
          ...styles.title,
        }),
      );

      rows.push(
        [
          "Total Invoices",
          "Total Amount",
          "Paid",
          "Paid Amount",
          "Not Paid",
          "Not Paid Amount",
        ].map((value) => ({ value, ...styles.header, height: ROW_HEIGHT })),
      );

      rows.push(
        [
          totalInvoices,
          totalAmount,
          paidCount,
          paidAmount,
          notPaidCount,
          notPaidAmount,
        ].map((value, i) => ({
          value,
          fontWeight: "bold",
          align: "center",
          height: ROW_HEIGHT,
          // 2nd, 4th and 6th columns are amounts
          ...(i % 2 === 1 ? { format: styles.currency } : {}),
        })),
      );

      rows.push(
        mergedRow({
          value: "🟢 Paid (Card / Check / ACH / Cash)     🟠 Not Paid",
          ...styles.note,
          fontSize: 11,
        }),
      );

      const header = ["Client Name"].concat(dayNumbers.map(formatDayHeader));

      rows.push(
        header.map((value) => ({
          value,
          ...styles.header,
          height: ROW_HEIGHT,
        })),
      );

      // Sheet row number of the first client row (rows are striped by it).
      const firstDataRow = rows.length + 1;

      users.forEach((user, userIndex) => {
        const userInvoices = user.invoices || [];
        const hasUnpaid = userInvoices.some(
          (inv) => getFinalStatus(inv) === "NOT_PAID",
        );

        // Fill for the whole row; day cells with quotes use a status fill.
        const rowFill = hasUnpaid
          ? styles.error
          : (firstDataRow + userIndex) % 2 === 0
            ? styles.muted
            : { backgroundColor: cssVar("--color-bg") };

        const maxQuotesInADay = Math.max(
          1,
          ...dayNumbers.map(
            (d) =>
              userInvoices.filter((inv) => dayjs(inv.created_at).date() === d)
                .length,
          ),
        );

        const row = [
          {
            value: user.name || "Unknown",
            ...rowFill,
            fontWeight: "bold",
            textColor: cssVar(
              hasUnpaid ? "--color-error-strong" : "--color-text",
            ),
            alignVertical: "center",
            height: Math.max(34, 20 + maxQuotesInADay * 16),
          },
        ];

        dayNumbers.forEach((d) => {
          const invoices = userInvoices.filter(
            (inv) => dayjs(inv.created_at).date() === d,
          );

          if (invoices.length === 0) {
            row.push({ value: "—", ...rowFill, align: "center" });
            return;
          }

          let text = "";
          let cellStatus = "PAID";

          invoices.forEach((inv) => {
            const status = getFinalStatus(inv);
            const emoji = status === "PAID" ? "🟢" : "🟠";
            const amount = "$" + Number(inv.total_due || 0).toFixed(2);
            text += inv.ref_no + "  " + amount + "  " + emoji + "\n";

            if (status === "NOT_PAID") cellStatus = "NOT_PAID";
          });

          row.push({
            value: text.trim(),
            ...(cellStatus === "PAID" ? styles.success : styles.warning),
            wrap: true,
            alignVertical: "top",
            align: "center",
          });
        });

        rows.push(row);
      });

      await saveXlsx(
        rows,
        {
          sheet: "Service Quotes " + monthName,
          columns: Array.from({ length: mergeSpan }, (_, i) => ({
            width: i === 0 ? 36 : 20,
          })),
          stickyRowsCount: 5,
          stickyColumnsCount: 1,
          orientation: "landscape",
        },
        "Service Quote Invoices - " + monthName + ".xlsx",
      );

      message.success(
        "Service Quote Invoices - " + monthName + " downloaded successfully!",
      );
    } catch (err) {
      console.error(err);
      message.error("Excel export failed");
    }
  };

  const handleDelete = (invoiceId) => {
    Modal.confirm({
      title: "Delete Invoice",
      content: "Are you sure you want to delete this invoice?",
      okText: "Delete",
      okType: "danger",
      centered: true,
      onOk: async () => {
        try {
          await DeleteServiceQuote(invoiceId);
          message.success("Invoice deleted successfully");
          fetchInvoices(selectedMonth, selectedYear);
        } catch (error) {
          console.error("Delete error:", error);
          message.error("Failed to delete invoice");
        }
      },
    });
  };

  return (
    <>
      <div className="surface surface--padded invoices__header">
        <PageHeader
          card={false}
          title="SERVICE QUOTE MANAGEMENT"
          subtitle="View & manage service quotes"
          actions={
            <Button
              type="primary"
              size="large"
              icon={<Download size={16} />}
              onClick={handleDownloadExcel}
              disabled={selectedMonth === null || selectedYear === null}
            >
              Download Excel ({dayjs().month(selectedMonth).format("MMM")}{" "}
              {selectedYear})
            </Button>
          }
        />

        <div className="invoices__toolbar">
          <Input
            allowClear
            size="large"
            className="invoices__search"
            prefix={<SearchIcon size={16} className="text-subtle" />}
            placeholder="Search invoices..."
            onChange={(e) => setSearchText(e.target.value)}
          />

          <Select
            size="large"
            className="invoices__month"
            value={selectedMonth}
            onChange={(m) => {
              setSelectedMonth(m);
              fetchInvoices(m, selectedYear);
            }}
            options={months.map((m, i) => ({ value: i, label: m }))}
          />

          <Select
            size="large"
            className="invoices__year"
            value={selectedYear}
            onChange={(y) => {
              setSelectedYear(y);
              fetchInvoices(selectedMonth, y);
            }}
            options={years.map((y) => ({ value: y, label: y }))}
          />
        </div>
      </div>

      <Table
        rowKey="id"
        columns={columns}
        dataSource={filteredData}
        loading={loading}
        bordered
        size="middle"
      />

      {selectedInvoice && (
        <InvoiceViewModal
          invoice={selectedInvoice}
          onClose={() => setSelectedInvoice(null)}
        />
      )}

      <Modal
        title="Mark Invoice as Paid"
        open={payModalOpen}
        onCancel={closePayModal}
        footer={[
          <Button key="cancel" onClick={closePayModal} disabled={!!payModalLoading}>
            Cancel
          </Button>,
          <Button
            key="check"
            onClick={() => handleConfirmPay("check")}
            loading={payModalLoading === "check"}
            disabled={!!payModalLoading}
          >
            Paid by Check
          </Button>,
          <Button
            key="ach"
            type="primary"
            onClick={() => handleConfirmPay("ach")}
            loading={payModalLoading === "ach"}
            disabled={!!payModalLoading}
          >
            Paid by ACH
          </Button>,
        ]}
      >
        <p>How was this invoice paid?</p>
      </Modal>
    </>
  );
};

export default Invoices;