import { useEffect, useMemo, useState } from "react";
import {
  Table,
  message,
  Input,
  Select,
  Modal,
  Tag,
  Button,
  Alert,
  Space,
  Upload as AntUpload,
} from "antd";
import {
  Search as SearchIcon,
  Download,
  Plus,
  Pencil,
  Trash2,
  CircleCheck,
  Eye,
  Upload,
  Send,
} from "lucide-react";
import dayjs from "@/lib/dayjs";
import { useNavigate } from "react-router";
import {
  DeleteInvoice,
  GetAllInvoices,
  GetMonthlyAllInvoicesSummary,
  MarkInvoicePaidByCheck,
  MarkInvoicePaidByACH,
  ImportInvoicesCSV,
  UploadHistoricalInvoicePDF,
  SendInvoiceBalance,
} from "@/services/api/invoiceApi";
import PageHeader from "@/components/PageHeader";
import IconAction from "@/components/IconAction";
import { saveXlsx, excelStyles } from "@/utils/excel";
import { downloadBlob } from "@/utils/download";
import { cssVar } from "@/theme/antdTheme";
import "./invoices.scss";

/* CONSTANTS */

const CLIENTS_ROUTE = "/users"; // change to your add-client route
const PENDING_CLIENTS_KEY = "csvPendingClients";
const PAID_STATUSES = ["PAID", "CHECK_PAID", "CASH_PAID", "ACH_PAID"];
const DEPOSIT_RECEIVED_STAGES = ["DEPOSIT_PAID", "BALANCE_PENDING"];

const HISTORICAL_CSV_SAMPLE = [
  "invoice_number,client_name,address_1,address_2,billing_date,service_start,service_end,due_date,signing_date",
  "INV-2609-101,Mestre Star Cleaning LLC,100 Queen St W,,2026-09-01,2026-08-01,2026-08-31,2026-09-15,2026-09-01",
  "INV-2609-102,Cleaner A,200 Main St,Suite 100,2026-09-15,2026-09-01,2026-09-30,2026-10-15,2026-09-15",
].join("\n");

/* HELPERS */

const readPendingClients = () => {
  try {
    const parsed = JSON.parse(
      localStorage.getItem(PENDING_CLIENTS_KEY) || "[]",
    );
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
};

const uniqueList = (list) => [...new Set(list.filter(Boolean))];

const ordinalSuffix = (n) => {
  const j = n % 10;
  const k = n % 100;
  if (j === 1 && k !== 11) return "st";
  if (j === 2 && k !== 12) return "nd";
  if (j === 3 && k !== 13) return "rd";
  return "th";
};

// True only after the 25% deposit has been received and the invoice is not fully paid.
const isDepositReceived = (record) =>
  !!record.deposit_required &&
  DEPOSIT_RECEIVED_STAGES.includes(record.payment_stage) &&
  !PAID_STATUSES.includes(record.payment_status);

const InvoicesPage = () => {
  const navigate = useNavigate();

  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);

  const [searchText, setSearchText] = useState("");

  const [selectedMonth, setSelectedMonth] = useState(dayjs().month());
  const [selectedYear, setSelectedYear] = useState(dayjs().year());

  const months = Array.from({ length: 12 }, (_, i) =>
    dayjs().month(i).format("MMMM"),
  );
  const years = Array.from({ length: 10 }, (_, i) => dayjs().year() - 5 + i);

  const getSelectedDate = () =>
    dayjs().year(selectedYear).month(selectedMonth).startOf("month");

  // CSV import
  const [csvModalOpen, setCsvModalOpen] = useState(false);
  const [csvFile, setCsvFile] = useState(null);
  const [csvImportLoading, setCsvImportLoading] = useState(false);
  const [importResult, setImportResult] = useState(null);
  const [pendingClients, setPendingClients] = useState(readPendingClients);

  // PDF upload (per invoice)
  const [pdfUploadLoading, setPdfUploadLoading] = useState(null);

  // Mark as paid
  const [payModalOpen, setPayModalOpen] = useState(false);
  const [payModalInvoiceId, setPayModalInvoiceId] = useState(null);
  const [payModalLoading, setPayModalLoading] = useState(null); // "check" | "ach" | null

  // Send balance now
  const [balanceLoadingId, setBalanceLoadingId] = useState(null);

  const canSendBalanceNow = (record) =>
    !!record.deposit_required &&
    record.payment_stage === "DEPOSIT_PAID" &&
    !record.balance_sent_at;

  const handleSendBalanceNow = (record) => {
    Modal.confirm({
      title: "Send balance invoice now?",
      content: `Send the remaining $${Number(record.balance_amount || 0).toFixed(2)} balance to the client now? The scheduled balance date will be skipped.`,
      okText: "Send now",
      onOk: async () => {
        try {
          setBalanceLoadingId(record.id);
          await SendInvoiceBalance(record.id);
          message.success("Balance invoice sent to client");
          fetchInvoices(getSelectedDate());
        } catch (error) {
          message.error(
            error?.response?.data?.message || "Failed to send balance invoice",
          );
        } finally {
          setBalanceLoadingId(null);
        }
      },
    });
  };

  /* PENDING CLIENTS (saved in this browser) */

  const updatePendingClients = (list) => {
    setPendingClients(list);
    if (list.length) {
      localStorage.setItem(PENDING_CLIENTS_KEY, JSON.stringify(list));
    } else {
      localStorage.removeItem(PENDING_CLIENTS_KEY);
    }
  };

  /* FETCH INVOICES */

  const fetchInvoices = async (date = getSelectedDate()) => {
    try {
      setLoading(true);
      const formattedMonth = date.format("YYYY-MM");
      const res = await GetAllInvoices(formattedMonth);
      setData(res.data.data || []);
    } catch {
      message.error("Failed to load invoices");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInvoices(getSelectedDate());
  }, []);

  /* PAY MODAL */

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
        await MarkInvoicePaidByCheck(payModalInvoiceId);
        message.success("Invoice marked as Paid by Check");
      } else {
        await MarkInvoicePaidByACH(payModalInvoiceId);
        message.success("Invoice marked as Paid by ACH");
      }

      fetchInvoices(getSelectedDate());
      closePayModal();
    } catch (error) {
      message.error(
        error?.response?.data?.message ||
          `Failed to mark invoice as paid by ${method === "check" ? "check" : "ACH"}`,
      );
      setPayModalLoading(null);
    }
  };

  /* SEARCH FILTER */

  const filteredData = useMemo(() => {
    if (!searchText) return data;

    const q = searchText.toLowerCase();

    return data.filter((item) => {
      const name = item.invoices_user?.user_profile?.name?.toLowerCase() || "";
      const ref = (item.custom_ref_no || item.ref_no || "").toLowerCase();
      const amount = String(item.total_due || "");

      return name.includes(q) || ref.includes(q) || amount.includes(searchText);
    });
  }, [searchText, data]);

  /* VIEW PDF */

  const handleViewPDF = (record) => {
    if (!record.pdf_url) {
      message.warning("PDF not available for this invoice");
      return;
    }
    window.open(record.pdf_url, "_blank");
  };

  /* UPLOAD / REPLACE PDF (CSV-imported invoices) */

  const handleUploadHistoricalPDF = async (record, file) => {
    if (!file) return;

    if (file.type !== "application/pdf") {
      message.error("Please select a PDF file");
      return;
    }

    try {
      setPdfUploadLoading(record.id);
      await UploadHistoricalInvoicePDF(record.id, file);
      message.success("PDF saved to this invoice");
      await fetchInvoices(getSelectedDate());
    } catch (error) {
      message.error(error?.response?.data?.message || "Failed to upload PDF");
    } finally {
      setPdfUploadLoading(null);
    }
  };

  /* DELETE */

  const handleDelete = (invoiceId) => {
    Modal.confirm({
      title: "Delete Invoice",
      content: "Are you sure you want to delete this invoice?",
      okText: "Delete",
      okType: "danger",
      onOk: async () => {
        try {
          await DeleteInvoice(invoiceId);
          message.success("Invoice deleted successfully");
          fetchInvoices(getSelectedDate());
        } catch (error) {
          console.error("Delete error:", error);
          message.error("Failed to delete invoice");
        }
      },
    });
  };

  /* TABLE COLUMNS */

  const columns = [
    {
      title: "Invoice #",
      dataIndex: "ref_no",
      render: (_, record) => (
        <div className="invoice-number-cell">
          <span>{record.custom_ref_no || record.ref_no}</span>

          {record.is_historical && (
            <div className="csv-badge-row">
              <Tag>Imported via CSV</Tag>

              <AntUpload
                accept="application/pdf"
                showUploadList={false}
                disabled={pdfUploadLoading === record.id}
                beforeUpload={(file) => {
                  handleUploadHistoricalPDF(record, file);
                  // Handled manually above; keep it out of antd's upload list.
                  return AntUpload.LIST_IGNORE;
                }}
              >
                <Button
                  type="link"
                  size="small"
                  className="csv-pdf-btn"
                  disabled={pdfUploadLoading === record.id}
                >
                  {pdfUploadLoading === record.id
                    ? "Uploading..."
                    : record.pdf_url
                      ? "Replace PDF"
                      : "Upload PDF"}
                </Button>
              </AntUpload>
            </div>
          )}
        </div>
      ),
    },
    {
      title: "Client",
      render: (_, r) => r.invoices_user?.user_profile?.name || "-",
    },
    {
      title: "Service Dates",
      dataIndex: "service_dates",
      render: (value) => {
        if (!value) return "-";

        const parts = value.split(" - ");
        if (parts.length !== 2) return value;

        return `${dayjs(parts[0], "YYYY-MM-DD").format("MM-DD-YYYY")} - ${dayjs(
          parts[1],
          "YYYY-MM-DD",
        ).format("MM-DD-YYYY")}`;
      },
    },
    {
      title: "Type",
      render: (_, record) => {
        const isRecurring =
          !!record.recurring && record.recurring.status !== "CANCELLED";

        return isRecurring ? (
          <Tag color="processing">Recurring</Tag>
        ) : (
          <Tag color="default">One-Time</Tag>
        );
      },
    },
    {
      title: "Amount",
      dataIndex: "total_due",
      render: (v) => `$${Number(v).toFixed(2)}`,
    },
    {
      title: "Billing Date",
      dataIndex: "billing_date",
      render: (d) => (d ? dayjs(d, "YYYY-MM-DD").format("MM-DD-YYYY") : "-"),
    },
    {
      title: "Due Date",
      dataIndex: "due_date",
      render: (d) => (d ? dayjs(d, "YYYY-MM-DD").format("MM-DD-YYYY") : "-"),
    },
    {
      title: "Status",
      dataIndex: "payment_status",
      render: (_, record) => {
        const status = record.payment_status;
        const isPaid = PAID_STATUSES.includes(status);

        // Deposit received, balance not yet paid
        if (isDepositReceived(record)) {
          const balanceSent = record.payment_stage === "BALANCE_PENDING";

          const balanceText = balanceSent
            ? "Balance sent"
            : record.balance_due_date
              ? `Balance $${Number(record.balance_amount || 0).toFixed(2)} due ${dayjs(record.balance_due_date, "YYYY-MM-DD").format("MM-DD-YYYY")}`
              : `Balance $${Number(record.balance_amount || 0).toFixed(2)}`;

          return (
            <div>
              <span className="all-invoices__status all-invoices__status--paid">
                Deposit Paid
              </span>
              <div className="all-invoices__status-note">{balanceText}</div>
            </div>
          );
        }

        const labels = {
          PAID: "Paid",
          CHECK_PAID: "Check Paid",
          CASH_PAID: "Cash Paid",
          ACH_PAID: "ACH Paid",
        };

        return (
          <span
            className={`all-invoices__status ${
              isPaid ? "all-invoices__status--paid" : "all-invoices__status--unpaid"
            }`}
          >
            {labels[status] || "Not Paid"}
          </span>
        );
      },
    },
    {
      title: "Action",
      render: (_, record) => (
        <Space>
          {record.pdf_url && (
            <IconAction
              icon={Eye}
              title="View PDF"
              onClick={() => handleViewPDF(record)}
            />
          )}

          {!(
            record.is_historical === true ||
            record.is_historical === 1 ||
            record.is_historical === "true"
          ) && (
            <IconAction
              icon={Pencil}
              title="Edit Invoice"
              onClick={() => navigate(`/edit-invoice/${record.id}`)}
            />
          )}

          <IconAction
            icon={Trash2}
            title="Delete Invoice"
            danger
            onClick={() => handleDelete(record.id)}
          />

          {record.payment_status === "NOT_PAID" && (
            <IconAction
              icon={CircleCheck}
              title="Mark ACH/Check Paid"
              onClick={() => openPayModal(record.id)}
            />
          )}

          {canSendBalanceNow(record) && (
            <IconAction
              icon={Send}
              title="Send balance invoice now"
              disabled={balanceLoadingId === record.id}
              onClick={() => handleSendBalanceNow(record)}
            />
          )}
        </Space>
      ),
    },
  ];

  /* EXCEL EXPORT */

  const handleDownloadExcel = async () => {
    try {
      const formattedMonth = dayjs()
        .year(selectedYear)
        .month(selectedMonth)
        .format("YYYY-MM");

      const res = await GetMonthlyAllInvoicesSummary(formattedMonth);

      const payload = res.data.data || {};
      const users = payload.employees || [];
      const billingDates = payload.billing_dates || [];

      const dayNumbers = Array.from(
        new Set(billingDates.map((d) => dayjs(d, "YYYY-MM-DD").date())),
      ).sort((a, b) => a - b);

      const monthName = dayjs(formattedMonth).format("MMMM YYYY");
      const monthShort = dayjs(formattedMonth).format("MMM");

      const formatDayHeader = (d) => `${d}${ordinalSuffix(d)} ${monthShort}`;

      // Themed cell styles (header, status fills, currency format...).
      const styles = excelStyles();

      const getFinalStatus = (inv) =>
        PAID_STATUSES.includes(inv.payment_status) ? "PAID" : "NOT_PAID";

      let totalCount = 0;
      let totalAmount = 0;
      let paidCount = 0;
      let paidAmount = 0;
      let notPaidCount = 0;
      let notPaidAmount = 0;

      users.forEach((user) => {
        (user.invoices || []).forEach((inv) => {
          const amount = Number(inv.total_due || 0);

          totalCount++;
          totalAmount += amount;

          if (PAID_STATUSES.includes(inv.payment_status)) {
            paidCount++;
            paidAmount += amount;
          } else {
            notPaidCount++;
            notPaidAmount += amount;
          }
        });
      });

      const mergeSpan = Math.max(6, dayNumbers.length + 1);

      // Every row of the report is 32pt high (the sheet's row height).
      const ROW_HEIGHT = 32;

      // One cell merged across the full report width.
      const mergedRow = (cell) => [
        { ...cell, columnSpan: mergeSpan, height: ROW_HEIGHT },
        ...Array(mergeSpan - 1).fill(null),
      ];

      const rows = [];

      /* TITLE */
      rows.push(
        mergedRow({
          value: `Monthly Invoice Report - ${monthName}`,
          ...styles.title,
        }),
      );

      /* SUMMARY */
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
          totalCount,
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

      /* LEGEND */
      rows.push(
        mergedRow({
          value:
            "🟢 Paid (Cash / Check / ACH / Card)    🟠 Not Paid (including Overdue)",
          ...styles.note,
          fontSize: 11,
        }),
      );

      /* MAIN HEADER */
      rows.push(
        ["Client's Name", ...dayNumbers.map(formatDayHeader)].map((value) => ({
          value,
          ...styles.header,
          height: ROW_HEIGHT,
        })),
      );

      /* DATA ROWS */
      // Sheet row number of the first client row (rows are striped by it).
      const firstDataRow = rows.length + 1;

      users.forEach((user, userIndex) => {
        const hasUnpaid = (user.invoices || []).some(
          (inv) => getFinalStatus(inv) === "NOT_PAID",
        );

        // Fill for the whole row; day cells with invoices use a status fill.
        const rowFill = hasUnpaid
          ? styles.error
          : (firstDataRow + userIndex) % 2 === 0
            ? styles.muted
            : { backgroundColor: cssVar("--color-bg") };

        const row = [
          {
            value: user.name || "Unknown",
            ...rowFill,
            fontWeight: "bold",
            textColor: cssVar(
              hasUnpaid ? "--color-error-strong" : "--color-text",
            ),
            alignVertical: "center",
            height: ROW_HEIGHT,
          },
        ];

        dayNumbers.forEach((d) => {
          const invoices = (user.invoices || []).filter((inv) => {
            if (!inv.billing_date) return false;
            return dayjs(inv.billing_date, "YYYY-MM-DD").date() === d;
          });

          if (invoices.length === 0) {
            row.push({ value: "—", ...rowFill, align: "center" });
            return;
          }

          let text = invoices.length > 1 ? `${invoices.length} invoices\n` : "";
          let cellStatus = "PAID";

          invoices.forEach((inv) => {
            const status = getFinalStatus(inv);
            const emoji = status === "PAID" ? "🟢" : "🟠";
            const amount = Number(inv.total_due || 0).toFixed(2);

            text += `${inv.ref_no} $${amount} ${emoji}\n`;

            if (status === "NOT_PAID") cellStatus = "NOT_PAID";
          });

          row.push({
            value: text.trim(),
            ...(cellStatus === "PAID" ? styles.success : styles.warning),
            wrap: true,
            alignVertical: "top",
          });
        });

        rows.push(row);
      });

      /* FORMATTING + DOWNLOAD */
      await saveXlsx(
        rows,
        {
          sheet: `Monthly Invoices ${monthName}`,
          columns: Array.from({ length: mergeSpan }, (_, i) => ({
            width: i === 0 ? 34 : 19,
          })),
          stickyRowsCount: 5,
          stickyColumnsCount: 1,
          orientation: "landscape",
        },
        `Invoice Report - ${monthName}.xlsx`,
      );

      message.success(`Invoice Report - ${monthName} downloaded successfully!`);
    } catch (err) {
      console.error(err);
      message.error("Excel export failed");
    }
  };

  /* CSV SAMPLE */

  const handleDownloadCSVSample = () => {
    const blob = new Blob([HISTORICAL_CSV_SAMPLE], {
      type: "text/csv;charset=utf-8;",
    });
    downloadBlob(blob, "historical-invoices-sample-2026-09.csv");
  };

  /* CSV IMPORT */

  const handleCSVImport = async () => {
    if (!csvFile) {
      message.warning("Please select a CSV file");
      return;
    }

    if (!csvFile.name.toLowerCase().endsWith(".csv")) {
      message.error("Only .csv files can be imported");
      return;
    }

    try {
      setCsvImportLoading(true);

      const formData = new FormData();
      formData.append("docs", csvFile);

      const res = await ImportInvoicesCSV(formData);
      const result = res?.data?.data || {};

      const unmatched = result.unmatched || [];
      const errors = result.errors || [];
      const skipped = result.skipped || [];
      const imported = result.invoices || [];

      /* Track clients that still don't exist so the banner can show them later */
      const importedNames = imported.map((i) => i.client_name);
      const missingNames = unmatched
        .filter((r) => r.reason === "Client not found")
        .map((r) => r.client_name);

      updatePendingClients(
        uniqueList([
          ...pendingClients.filter((n) => !importedNames.includes(n)),
          ...missingNames,
        ]),
      );

      setCsvModalOpen(false);
      setCsvFile(null);

      const hasIssues =
        unmatched.length > 0 || errors.length > 0 || skipped.length > 0;

      if (hasIssues) {
        setImportResult(result); // stays open until Close is clicked
      } else {
        message.success(`${result.imported_count ?? 0} invoice(s) imported`);
      }

      /* Jump to the month of the first imported invoice so the rows are visible */
      if (imported.length) {
        const first = dayjs(imported[0].billing_date, "YYYY-MM-DD");
        setSelectedMonth(first.month());
        setSelectedYear(first.year());
        await fetchInvoices(first.startOf("month"));
      } else {
        await fetchInvoices(getSelectedDate());
      }
    } catch (error) {
      console.error("CSV import error:", error);
      message.error(error?.response?.data?.message || "Failed to import CSV");
    } finally {
      setCsvImportLoading(false);
    }
  };

  /* IMPORT RESULT HELPERS */

  const unmatchedRows = importResult?.unmatched || [];
  const errorRows = importResult?.errors || [];
  const skippedRows = importResult?.skipped || [];

  const notFoundRows = unmatchedRows.filter(
    (r) => r.reason === "Client not found",
  );
  const inactiveRows = unmatchedRows.filter(
    (r) => r.reason === "Client account is inactive",
  );
  const ambiguousRows = unmatchedRows.filter(
    (r) => r.reason === "Name belongs to more than one active client account",
  );

  const missingClientNames = uniqueList(notFoundRows.map((r) => r.client_name));

  const downloadImportReport = () => {
    const escapeCsv = (value) => {
      const text = String(value ?? "");
      return /[",\n]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
    };

    const lines = ["row,invoice_number,client_name,reason"];

    [...unmatchedRows, ...errorRows, ...skippedRows].forEach((r) => {
      lines.push(
        [r.row, r.invoice_number, r.client_name, r.reason || r.message]
          .map(escapeCsv)
          .join(","),
      );
    });

    downloadBlob(
      new Blob([lines.join("\n")], { type: "text/csv;charset=utf-8;" }),
      "csv-import-not-imported.csv",
    );
  };

  /* RENDER */

  return (
    <>
      {/* HEADER */}
      <div className="surface surface--padded all-invoices__header">
        <PageHeader
          card={false}
          title="INVOICES"
          subtitle="View and manage all generated invoices"
          actions={
            <>
              <Button
                size="large"
                icon={<Download size={16} />}
                onClick={handleDownloadExcel}
              >
                Download ({dayjs().month(selectedMonth).format("MMM")}{" "}
                {selectedYear})
              </Button>

              <Button
                type="primary"
                size="large"
                icon={<Plus size={16} />}
                onClick={() => navigate("/generate-invoice")}
              >
                New Invoice
              </Button>
            </>
          }
        />

        <div className="all-invoices__toolbar">
          <Button
            size="large"
            icon={<Upload size={16} />}
            onClick={() => setCsvModalOpen(true)}
          >
            Import CSV
          </Button>

          <Input
            allowClear
            size="large"
            className="all-invoices__search"
            prefix={<SearchIcon size={16} className="text-subtle" />}
            placeholder="Search by ref, client, amount"
            onChange={(e) => setSearchText(e.target.value)}
          />

          <Select
            size="large"
            className="all-invoices__month"
            value={selectedMonth}
            onChange={(m) => {
              setSelectedMonth(m);
              fetchInvoices(
                dayjs().year(selectedYear).month(m).startOf("month"),
              );
            }}
            options={months.map((m, i) => ({ value: i, label: m }))}
          />

          <Select
            size="large"
            className="all-invoices__year"
            value={selectedYear}
            onChange={(y) => {
              setSelectedYear(y);
              fetchInvoices(
                dayjs().year(y).month(selectedMonth).startOf("month"),
              );
            }}
            options={years.map((y) => ({ value: y, label: y }))}
          />
        </div>
      </div>

      {/* PENDING CLIENTS BANNER (persists until the names are imported or dismissed) */}
      {pendingClients.length > 0 && (
        <Alert
          className="csv-pending-banner"
          type="warning"
          showIcon
          title={`${pendingClients.length} client(s) from your CSV import don't exist yet`}
          description={
            <div>
              <p className="csv-pending-banner__text">
                Create each client under Clients using the exact name below,
                then import the same CSV again. Invoices already imported are
                skipped.
              </p>
              <div className="csv-client-list">
                {pendingClients.map((name) => (
                  <code key={name} className="csv-client-chip">
                    {name}
                  </code>
                ))}
              </div>
              <Button
                size="small"
                onClick={() =>
                  navigator.clipboard
                    .writeText(pendingClients.join("\n"))
                    .then(() => message.success("Client names copied"))
                    .catch(() => message.error("Could not copy"))
                }
              >
                Copy names
              </Button>{" "}
              <Button size="small" onClick={() => navigate(CLIENTS_ROUTE)}>
                Go to Clients
              </Button>{" "}
              <Button
                size="small"
                type="text"
                onClick={() => updatePendingClients([])}
              >
                Dismiss
              </Button>
            </div>
          }
        />
      )}

      {/* TABLE */}
      <Table
        rowKey="id"
        columns={columns}
        dataSource={filteredData}
        loading={loading}
        pagination={{ pageSize: 100, showSizeChanger: false }}
        bordered
        size="middle"
      />

      {/* IMPORT RESULT POPUP (stays open until Close) */}
      <Modal
        title="CSV import finished"
        open={!!importResult}
        closable={false}
        mask={{ closable: false }}
        keyboard={false}
        width={680}
        footer={[
          <Button
            key="download"
            onClick={downloadImportReport}
            disabled={!unmatchedRows.length && !errorRows.length}
          >
            Download list
          </Button>,
          <Button
            key="copy"
            onClick={async () => {
              try {
                await navigator.clipboard.writeText(
                  missingClientNames.join("\n"),
                );
                message.success("Client names copied");
              } catch {
                message.error("Could not copy");
              }
            }}
            disabled={!missingClientNames.length}
          >
            Copy client names
          </Button>,
          <Button key="clients" onClick={() => navigate(CLIENTS_ROUTE)}>
            Go to Clients
          </Button>,
          <Button
            key="close"
            type="primary"
            onClick={() => setImportResult(null)}
          >
            Close
          </Button>,
        ]}
      >
        <div className="csv-result-summary">
          <div className="csv-stat csv-stat-ok">
            <strong>{importResult?.imported_count ?? 0}</strong>
            Imported
          </div>
          <div className="csv-stat csv-stat-skip">
            <strong>{skippedRows.length}</strong>
            Already exist
          </div>
          <div className="csv-stat csv-stat-fail">
            <strong>{unmatchedRows.length + errorRows.length}</strong>
            Not imported
          </div>
        </div>

        {notFoundRows.length > 0 && (
          <div className="csv-result-section">
            <h4>These clients don't exist yet</h4>
            <p className="csv-result-section__text">
              Create each client under Clients using the exact name below, then
              import the same CSV again. Invoices already imported will be
              skipped, so only the missing rows get added.
            </p>
            <div className="csv-client-list">
              {missingClientNames.map((name) => (
                <code key={name} className="csv-client-chip">
                  {name}
                </code>
              ))}
            </div>
          </div>
        )}

        {inactiveRows.length > 0 && (
          <div className="csv-result-section">
            <h4>These client accounts are inactive</h4>
            <p className="csv-result-section__text">
              The name exists, but the account is deactivated, so these rows
              were not imported. Reactivate the account under Users, then import
              the same CSV again.
            </p>
            <ul>
              {inactiveRows.map((r) => (
                <li key={`i-${r.row}`}>
                  Row {r.row} ({r.invoice_number}): {r.client_name}
                </li>
              ))}
            </ul>
          </div>
        )}

        {ambiguousRows.length > 0 && (
          <div className="csv-result-section">
            <h4>More than one active account has this name</h4>
            <p className="csv-result-section__text">
              These rows were not imported because the name matches more than
              one active client. Rename or deactivate the duplicate account
              under Users, then import again.
            </p>
            <ul>
              {ambiguousRows.map((r) => (
                <li key={`m-${r.row}`}>
                  Row {r.row} ({r.invoice_number}): {r.client_name}
                </li>
              ))}
            </ul>
          </div>
        )}

        {errorRows.length > 0 && (
          <div className="csv-result-section">
            <h4>Rows with errors</h4>
            <ul>
              {errorRows.map((r) => (
                <li key={`e-${r.row}`}>
                  Row {r.row} ({r.invoice_number || "—"}): {r.message}
                </li>
              ))}
            </ul>
          </div>
        )}

        {skippedRows.length > 0 && (
          <div className="csv-result-section">
            <h4>Already imported (skipped)</h4>
            <p className="csv-result-section__muted">
              {skippedRows.map((r) => r.invoice_number).join(", ")}
            </p>
          </div>
        )}
      </Modal>

      {/* MARK AS PAID */}
      <Modal
        title="Mark Invoice as Paid"
        open={payModalOpen}
        onCancel={closePayModal}
        footer={[
          <Button
            key="cancel"
            onClick={closePayModal}
            disabled={!!payModalLoading}
          >
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

      {/* IMPORT CSV */}
      <Modal
        title="Import Historical Invoices"
        open={csvModalOpen}
        onCancel={() => {
          if (!csvImportLoading) {
            setCsvModalOpen(false);
            setCsvFile(null);
          }
        }}
        footer={[
          <Button
            key="cancel"
            onClick={() => {
              setCsvModalOpen(false);
              setCsvFile(null);
            }}
            disabled={csvImportLoading}
          >
            Cancel
          </Button>,
          <Button
            key="sample"
            onClick={handleDownloadCSVSample}
            disabled={csvImportLoading}
          >
            Download Sample CSV
          </Button>,
          <Button
            key="import"
            type="primary"
            onClick={handleCSVImport}
            loading={csvImportLoading}
            disabled={!csvFile}
          >
            Import CSV
          </Button>,
        ]}
      >
        <div className="csv-file-field">
          <label className="csv-file-field__label" htmlFor="csv-import-file">
            CSV File
          </label>
          <input
            id="csv-import-file"
            type="file"
            accept=".csv,text/csv"
            onChange={(e) => setCsvFile(e.target.files?.[0] || null)}
          />
        </div>

        <div className="csv-format-box">
          <p className="csv-box-title">CSV Format</p>
          <p className="csv-box-text">
            Your CSV must contain these columns in this format:
          </p>
          <pre className="csv-format-sample">{HISTORICAL_CSV_SAMPLE}</pre>
        </div>

        <div className="csv-instructions-box">
          <p className="csv-box-title">Important Instructions</p>
          <ul>
            <li>Use CSV format only.</li>
            <li>Keep the column names exactly as shown above.</li>
            <li>Dates must use YYYY-MM-DD format.</li>
            <li>
              <strong>client_name</strong> must match the client's name in the
              system exactly. Clients that don't exist are listed after the
              import so you can create them.
            </li>
            <li>
              Historical invoices are imported without generating a new PDF.
            </li>
            <li>
              Historical invoices are never sent by the invoice email cron.
            </li>
            <li>You can upload the original PDF to each invoice afterwards.</li>
            <li>
              Invoice numbers that already exist are skipped, so you can safely
              import the same file again.
            </li>
          </ul>
        </div>

        {csvFile && (
          <p className="csv-selected-file">Selected file: {csvFile.name}</p>
        )}
      </Modal>
    </>
  );
};

export default InvoicesPage;
