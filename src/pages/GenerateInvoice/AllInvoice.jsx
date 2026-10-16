import { useEffect, useMemo, useState } from "react";
import {
  Table,
  message,
  Input,
  Select,
  Modal,
  Tag,
  Tooltip,
  Button,
  Alert,
} from "antd";
import IconButton from "@mui/material/IconButton";
import Stack from "@mui/material/Stack";
import Box from "@mui/material/Box";
import Paper from "@mui/material/Paper";
import Typography from "@mui/material/Typography";
import MuiButton from "@mui/material/Button";
import {
  Search as SearchIcon,
  Download,
  Plus,
  Pencil,
  Trash2,
  CheckCircle2,
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
} from "../../services/Api/InvoiceApi";
import ExcelJS from "exceljs";
import { saveAs } from "file-saver";
import "./invoice.css";

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

const AllInvoices = () => {
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

  const actionIconBtn = (color) => ({
    width: 38,
    height: 38,
    border: "1px solid",
    borderColor: color,
    color,
    "&:hover": {
      backgroundColor: `${color}14`,
      borderColor: color,
    },
  });

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
              <Tag color="purple">Imported via CSV</Tag>

              <MuiButton
                component="label"
                size="small"
                className="csv-pdf-btn"
                disabled={pdfUploadLoading === record.id}
              >
                {pdfUploadLoading === record.id
                  ? "Uploading..."
                  : record.pdf_url
                    ? "Replace PDF"
                    : "Upload PDF"}

                <input
                  type="file"
                  hidden
                  accept="application/pdf"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) handleUploadHistoricalPDF(record, file);
                    e.target.value = ""; // allow picking the same file again
                  }}
                />
              </MuiButton>
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
          <Tag color="blue">Recurring</Tag>
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
              <span style={{ color: "#2e7d32", fontWeight: 600 }}>
                Deposit Paid
              </span>
              <div style={{ fontSize: 11, color: "#888" }}>{balanceText}</div>
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
            style={{
              color: isPaid ? "#2e7d32" : "#ef6c00",
              fontWeight: 600,
            }}
          >
            {labels[status] || "Not Paid"}
          </span>
        );
      },
    },
    {
      title: "Action",
      render: (_, record) => (
        <Stack direction="row" spacing={1}>
          {record.pdf_url && (
            <Tooltip title="View PDF">
              <IconButton
                size="small"
                sx={actionIconBtn("#6B7280")}
                onClick={() => handleViewPDF(record)}
              >
                <Eye size={16} />
              </IconButton>
            </Tooltip>
          )}

          {!(
            record.is_historical === true ||
            record.is_historical === 1 ||
            record.is_historical === "true"
          ) && (
            <Tooltip title="Edit Invoice">
              <IconButton
                size="small"
                sx={actionIconBtn("#6366F1")}
                onClick={() => navigate(`/edit-invoice/${record.id}`)}
              >
                <Pencil size={16} />
              </IconButton>
            </Tooltip>
          )}

          <Tooltip title="Delete Invoice">
            <IconButton
              size="small"
              sx={actionIconBtn("#EF4444")}
              onClick={() => handleDelete(record.id)}
            >
              <Trash2 size={16} />
            </IconButton>
          </Tooltip>

          {record.payment_status === "NOT_PAID" && (
            <Tooltip title="Mark ACH/Check Paid">
              <IconButton
                size="small"
                sx={actionIconBtn("#16A34A")}
                onClick={() => openPayModal(record.id)}
              >
                <CheckCircle2 size={16} />
              </IconButton>
            </Tooltip>
          )}

          {canSendBalanceNow(record) && (
            <Tooltip title="Send balance invoice now">
              <IconButton
                size="small"
                sx={actionIconBtn("#2563EB")}
                disabled={balanceLoadingId === record.id}
                onClick={() => handleSendBalanceNow(record)}
              >
                <Send size={16} />
              </IconButton>
            </Tooltip>
          )}
        </Stack>
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

      const workbook = new ExcelJS.Workbook();
      const sheet = workbook.addWorksheet(`Monthly Invoices ${monthName}`, {
        properties: { defaultRowHeight: 32 },
      });

      // Margins intentionally not set. Google Sheets shows "Custom numbers"
      // for explicit margins; leaving them unset uses its "Normal" preset.
      sheet.pageSetup = {
        orientation: "landscape",
        fitToPage: true,
        fitToWidth: 1,
        horizontalCentered: true,
        verticalCentered: true,
      };

      const colors = {
        PAID: "FFE8F5E9",
        NOT_PAID: "FFFFF4E5",
      };

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

      /* TITLE */
      const titleRow = sheet.addRow([`Monthly Invoice Report - ${monthName}`]);
      titleRow.getCell(1).font = { bold: true, size: 16 };
      titleRow.getCell(1).alignment = { horizontal: "center" };
      sheet.mergeCells(1, 1, 1, mergeSpan);

      /* SUMMARY */
      const summaryHeader = sheet.addRow([
        "Total Invoices",
        "Total Amount",
        "Paid",
        "Paid Amount",
        "Not Paid",
        "Not Paid Amount",
      ]);

      summaryHeader.eachCell((cell) => {
        cell.font = { bold: true, color: { argb: "FFFFFFFF" } };
        cell.fill = {
          type: "pattern",
          pattern: "solid",
          fgColor: { argb: "FF1F4E79" },
        };
        cell.alignment = { horizontal: "center", vertical: "middle" };
      });

      const summaryRow = sheet.addRow([
        totalCount,
        totalAmount,
        paidCount,
        paidAmount,
        notPaidCount,
        notPaidAmount,
      ]);

      summaryRow.eachCell((cell, col) => {
        cell.font = { bold: true };
        cell.alignment = { horizontal: "center" };
        if (col % 2 === 0) cell.numFmt = "$#,##0.00";
      });

      /* LEGEND */
      const legendRow = sheet.addRow([
        "🟢 Paid (Cash / Check / ACH / Card)    🟠 Not Paid (including Overdue)",
      ]);
      legendRow.getCell(1).font = { italic: true, size: 11 };
      sheet.mergeCells(legendRow.number, 1, legendRow.number, mergeSpan);

      /* MAIN HEADER */
      const headerRow = sheet.addRow([
        "Client's Name",
        ...dayNumbers.map(formatDayHeader),
      ]);

      headerRow.eachCell((cell) => {
        cell.font = { bold: true, color: { argb: "FFFFFFFF" } };
        cell.fill = {
          type: "pattern",
          pattern: "solid",
          fgColor: { argb: "FF1F4E79" },
        };
        cell.alignment = { horizontal: "center" };
      });

      /* DATA ROWS */
      users.forEach((user) => {
        const rowValues = [user.name || "Unknown"];

        dayNumbers.forEach((d) => {
          const dayInvoices = (user.invoices || []).filter((inv) => {
            if (!inv.billing_date) return false;
            return dayjs(inv.billing_date, "YYYY-MM-DD").date() === d;
          });
          rowValues.push(dayInvoices);
        });

        const row = sheet.addRow(rowValues);

        row.eachCell((cell, colIndex) => {
          if (colIndex === 1) {
            const hasUnpaid = (user.invoices || []).some(
              (inv) => getFinalStatus(inv) === "NOT_PAID",
            );

            row.eachCell((entireRowCell) => {
              entireRowCell.fill = {
                type: "pattern",
                pattern: "solid",
                fgColor: {
                  argb: hasUnpaid
                    ? "FFFFCCCC"
                    : row.number % 2 === 0
                      ? "FFF9F9F9"
                      : "FFFFFFFF",
                },
              };
            });

            cell.font = {
              bold: true,
              color: { argb: hasUnpaid ? "FF9C0006" : "FF000000" },
            };
            cell.alignment = { vertical: "middle" };
            return;
          }

          const invoices = cell.value;

          if (!invoices || invoices.length === 0) {
            cell.value = "—";
            cell.alignment = { horizontal: "center" };
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

          cell.value = text.trim();
          cell.fill = {
            type: "pattern",
            pattern: "solid",
            fgColor: { argb: colors[cellStatus] },
          };
          cell.alignment = { wrapText: true, vertical: "top" };
        });
      });

      /* FORMATTING */
      sheet.columns.forEach((col, i) => {
        col.width = i === 0 ? 34 : 19;
      });

      sheet.views = [{ state: "frozen", xSplit: 1, ySplit: 5 }];

      /* DOWNLOAD */
      const buffer = await workbook.xlsx.writeBuffer();
      saveAs(new Blob([buffer]), `Invoice Report - ${monthName}.xlsx`);

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
    saveAs(blob, "historical-invoices-sample-2026-09.csv");
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

    saveAs(
      new Blob([lines.join("\n")], { type: "text/csv;charset=utf-8;" }),
      "csv-import-not-imported.csv",
    );
  };

  /* RENDER */

  return (
    <>
      {/* HEADER */}
      <Paper
        variant="outlined"
        sx={{
          p: 2.5,
          mb: 2.5,
          borderRadius: "10px",
          borderColor: "#eef0f2",
        }}
      >
        <Stack spacing={2}>
          <Stack
            useFlexGap
            direction="row"
            spacing={2}
            sx={{
              justifyContent: "space-between",
              alignItems: "center",
              flexWrap: { xs: "wrap", md: "nowrap" },
            }}
          >
            <Box sx={{ minWidth: 0 }}>
              <Typography className="page-title" noWrap>
                INVOICES
              </Typography>
              <Typography
                className="page-sub-title"
                sx={{
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  whiteSpace: "nowrap",
                }}
              >
                View and manage all generated invoices
              </Typography>
            </Box>

            <Stack
              useFlexGap
              direction="row"
              spacing={1.5}
              sx={{
                alignItems: "center",
                flexShrink: { xs: 1, md: 0 },
                flexWrap: "wrap",
              }}
            >
              <MuiButton
                variant="outlined"
                startIcon={<Download size={17} />}
                onClick={handleDownloadExcel}
                sx={{
                  height: 44,
                  px: 2.5,
                  borderRadius: "8px",
                  textTransform: "none",
                  fontWeight: 600,
                  whiteSpace: "nowrap",
                }}
              >
                Download ({dayjs().month(selectedMonth).format("MMM")}{" "}
                {selectedYear})
              </MuiButton>

              <MuiButton
                variant="contained"
                disableElevation
                startIcon={<Plus size={18} />}
                onClick={() => navigate("/generate-invoice")}
                sx={{
                  height: 44,
                  px: 2.5,
                  borderRadius: "8px",
                  textTransform: "none",
                  fontWeight: 600,
                  whiteSpace: "nowrap",
                }}
              >
                New Invoice
              </MuiButton>
            </Stack>
          </Stack>

          <Stack
            useFlexGap
            direction="row"
            spacing={1.5}
            sx={{
              justifyContent: "flex-end",
              alignItems: "center",
              flexWrap: "wrap",
            }}
          >
            <MuiButton
              variant="outlined"
              startIcon={<Upload size={17} />}
              onClick={() => setCsvModalOpen(true)}
              sx={{
                height: 44,
                px: 2.5,
                borderRadius: "8px",
                textTransform: "none",
                fontWeight: 600,
                whiteSpace: "nowrap",
              }}
            >
              Import CSV
            </MuiButton>

            <Input
              allowClear
              prefix={<SearchIcon size={18} color="#9CA3AF" />}
              placeholder="Search by ref, client, amount"
              onChange={(e) => setSearchText(e.target.value)}
              style={{ width: 260, height: 44 }}
            />

            <Select
              value={selectedMonth}
              style={{ width: 130, height: 44 }}
              onChange={(m) => {
                setSelectedMonth(m);
                fetchInvoices(
                  dayjs().year(selectedYear).month(m).startOf("month"),
                );
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
              style={{ width: 110, height: 44 }}
              onChange={(y) => {
                setSelectedYear(y);
                fetchInvoices(
                  dayjs().year(y).month(selectedMonth).startOf("month"),
                );
              }}
            >
              {years.map((y) => (
                <Select.Option key={y} value={y}>
                  {y}
                </Select.Option>
              ))}
            </Select>
          </Stack>
        </Stack>
      </Paper>

      {/* PENDING CLIENTS BANNER (persists until the names are imported or dismissed) */}
      {pendingClients.length > 0 && (
        <Alert
          className="csv-pending-banner"
          type="warning"
          showIcon
          message={`${pendingClients.length} client(s) from your CSV import don't exist yet`}
          description={
            <div>
              <p style={{ margin: "4px 0 8px" }}>
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
        maskClosable={false}
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
            <p style={{ margin: "0 0 8px" }}>
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
            <p style={{ margin: "0 0 8px" }}>
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
            <p style={{ margin: "0 0 8px" }}>
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
            <p style={{ margin: 0, color: "#6b7280" }}>
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
        <div style={{ marginBottom: 20 }}>
          <Typography variant="body2" sx={{ fontWeight: 600, mb: 1 }}>
            CSV File
          </Typography>
          <input
            type="file"
            accept=".csv,text/csv"
            onChange={(e) => setCsvFile(e.target.files?.[0] || null)}
          />
        </div>

        <div className="csv-format-box">
          <Typography variant="body2" sx={{ fontWeight: 700, mb: 1 }}>
            CSV Format
          </Typography>
          <Typography variant="body2" sx={{ mb: 1 }}>
            Your CSV must contain these columns in this format:
          </Typography>
          <pre className="csv-format-sample">{HISTORICAL_CSV_SAMPLE}</pre>
        </div>

        <div className="csv-instructions-box">
          <Typography variant="body2" sx={{ fontWeight: 700, mb: 1 }}>
            Important Instructions
          </Typography>
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
          <Typography variant="body2" sx={{ mt: 2, fontWeight: 600 }}>
            Selected file: {csvFile.name}
          </Typography>
        )}
      </Modal>
    </>
  );
};

export default AllInvoices;
