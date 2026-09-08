/** @format */
import React, { useEffect, useState, useMemo } from "react";
import {
  Table,
  Space,
  message,
  Input,
  Select,
  Modal,
  Tag,
  Tooltip,
  Button,
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
  FileText,
  Pencil,
  Trash2,
  CheckCircle2,
  Eye,
} from "lucide-react";
import dayjs from "@/lib/dayjs";
import { useNavigate } from "react-router";
import {
  DeleteInvoice,
  GetAllInvoices,
  GetMonthlyAllInvoicesSummary,
  MarkInvoicePaidByCheck,
  MarkInvoicePaidByACH,
} from "../../services/Api/InvoiceApi";
import ExcelJS from "exceljs";
import { saveAs } from "file-saver";
import "./invoice.css";

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

  /* ---------------- FETCH INVOICES ---------------- */

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

  // NEW: single action opens a modal with a real choice — Cancel / Paid by
  // Check / Paid by ACH — instead of a plain yes/no confirm.
  const [payModalOpen, setPayModalOpen] = useState(false);
  const [payModalInvoiceId, setPayModalInvoiceId] = useState(null);
  const [payModalLoading, setPayModalLoading] = useState(null); // "check" | "ach" | null

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
      const backendMessage =
        error?.response?.data?.message ||
        `Failed to mark invoice as paid by ${method === "check" ? "check" : "ACH"}`;
      message.error(backendMessage);
      setPayModalLoading(null);
    }
  };

  useEffect(() => {
    fetchInvoices(getSelectedDate());
  }, []);

  /* ---------------- SEARCH FILTER ---------------- */

  const filteredData = useMemo(() => {
    if (!searchText) return data;

    return data.filter((item) => {
      const name = item.invoices_user?.user_profile?.name?.toLowerCase() || "";
      const ref = (item.custom_ref_no || item.ref_no || "").toLowerCase();
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
    if (!record.pdf_url) {
      message.warning("PDF not available for this invoice");
      return;
    }

    window.open(record.pdf_url, "_blank");
  };

  /* ---------------- DELETE ---------------- */

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

          fetchInvoices(getSelectedDate()); // FIX: was fetchInvoices() with no date
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
      backgroundColor: `${color}14`, // subtle tint on hover
      borderColor: color,
    },
  });

  const columns = [
    {
      title: "Invoice #",
      dataIndex: "ref_no",
      render: (_, record) => record.custom_ref_no || record.ref_no,
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

        const isPaid =
          status === "PAID" ||
          status === "CHECK_PAID" ||
          status === "CASH_PAID" ||
          status === "ACH_PAID"; // NEW

        let label = "Not Paid";

        if (status === "PAID") {
          label = "Paid";
        }

        if (status === "CHECK_PAID") {
          label = "Check Paid";
        }

        if (status === "CASH_PAID") {
          label = "Cash Paid";
        }

        if (status === "ACH_PAID") {
          // NEW
          label = "ACH Paid";
        }

        return (
          <span
            style={{
              color: isPaid ? "#2e7d32" : "#ef6c00",
              fontWeight: 600,
            }}
          >
            {label}
          </span>
        );
      },
    },
    {
      title: "Action",
      render: (_, record) => (
        <Stack direction="row" spacing={1}>
          <Tooltip title="View PDF">
            <IconButton
              size="small"
              sx={actionIconBtn("#6B7280")}
              onClick={() => handleViewPDF(record)}
            >
              <Eye size={16} />
            </IconButton>
          </Tooltip>

          <Tooltip title="Edit Invoice">
            <IconButton
              size="small"
              sx={actionIconBtn("#6366F1")}
              onClick={() => navigate(`/edit-invoice/${record.id}`)}
            >
              <Pencil size={16} />
            </IconButton>
          </Tooltip>

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
        </Stack>
      ),
    },
  ];

  const handleDownloadExcel = async () => {
    try {
      const formattedMonth = dayjs()
        .year(selectedYear)
        .month(selectedMonth)
        .format("YYYY-MM");

      const res = await GetMonthlyAllInvoicesSummary(formattedMonth);

      // API returns { billing_dates: [...], employees: [...] }
      const payload = res.data.data || {};
      const users = payload.employees || [];
      const billingDates = payload.billing_dates || [];

      // Only build columns for days that actually have invoices, instead
      // of every day in the month
      const dayNumbers = Array.from(
        new Set(billingDates.map((d) => dayjs(d, "YYYY-MM-DD").date())),
      ).sort((a, b) => a - b);

      const monthName = dayjs(formattedMonth).format("MMMM YYYY");
      const monthShort = dayjs(formattedMonth).format("MMM"); // e.g. "Jul"

      // Ordinal suffix helper so headers read "8th Jul" instead of a bare
      // "8" with no indication of which month it belongs to
      const ordinalSuffix = (n) => {
        const j = n % 10;
        const k = n % 100;
        if (j === 1 && k !== 11) return "st";
        if (j === 2 && k !== 12) return "nd";
        if (j === 3 && k !== 13) return "rd";
        return "th";
      };

      const formatDayHeader = (d) => `${d}${ordinalSuffix(d)} ${monthShort}`;

      const workbook = new ExcelJS.Workbook();

      const sheet = workbook.addWorksheet(`Monthly Invoices ${monthName}`, {
        properties: { defaultRowHeight: 32 },
      });

      // Landscape, fit-to-width page setup, centered on the page. Height is
      // left unconstrained (fitToHeight not set) so if there are ever more
      // clients than fit one page tall it paginates normally rather than
      // shrinking text to an unreadable size.
      //
      // NOTE: margins are intentionally NOT set here. Specifying explicit
      // margin numbers makes Google Sheets import them as "Custom numbers"
      // in its Print settings — which is exactly the mode that shows four
      // separate Left/Right/Top/Bottom fields for someone to interpret.
      // Leaving margins unset lets Sheets fall back to its own default
      // preset ("Normal"), which centers automatically with no numeric
      // fields shown at all.
      sheet.pageSetup = {
        orientation: "landscape",
        fitToPage: true,
        fitToWidth: 1,
        horizontalCentered: true,
        verticalCentered: true,
      };

      /* ================= COLORS ================= */

      const colors = {
        PAID: "FFE8F5E9", // green — paid, cash paid, check paid, ACH paid
        NOT_PAID: "FFFFF4E5", // orange — not paid + overdue
      };

      /* ================= STATUS HELPER ================= */

      const getFinalStatus = (inv) => {
        const paidStatuses = ["PAID", "CHECK_PAID", "CASH_PAID", "ACH_PAID"];
        const isPaid = paidStatuses.includes(inv.payment_status);

        if (isPaid) return "PAID";

        // overdue and not paid both map to NOT_PAID
        return "NOT_PAID";
      };

      /* ================= SUMMARY CALCULATION ================= */
      // Simplified to just Paid vs. Not Paid — the per-invoice colored dot
      // in each cell already shows whether it was check/ACH/cash/card, so
      // a separate breakdown here was redundant and made this table much
      // wider than the day-grid underneath it.

      let totalCount = 0;
      let totalAmount = 0;

      let paidCount = 0;
      let paidAmount = 0;

      let notPaidCount = 0;
      let notPaidAmount = 0;

      const paidStatuses = ["PAID", "CHECK_PAID", "CASH_PAID", "ACH_PAID"];

      users.forEach((user) => {
        (user.invoices || []).forEach((inv) => {
          const amount = Number(inv.total_due || 0);
          const rawStatus = inv.payment_status;

          totalCount++;
          totalAmount += amount;

          if (paidStatuses.includes(rawStatus)) {
            paidCount++;
            paidAmount += amount;
          } else {
            // NOT_PAID + OVERDUE both go here
            notPaidCount++;
            notPaidAmount += amount;
          }
        });
      });

      // Overview table is 6 columns; the main day-grid can be wider or
      // narrower depending on how many billing days occurred this month —
      // merge title/legend across whichever is wider so nothing looks cut
      // off or oddly narrow.
      const mergeSpan = Math.max(6, dayNumbers.length + 1);

      /* ================= TITLE ================= */

      const titleRow = sheet.addRow([`Monthly Invoice Report - ${monthName}`]);

      titleRow.getCell(1).font = { bold: true, size: 16 };
      titleRow.getCell(1).alignment = { horizontal: "center" };

      sheet.mergeCells(1, 1, 1, mergeSpan);

      /* ================= SUMMARY ================= */

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
        if (col % 2 === 0) {
          cell.numFmt = "$#,##0.00";
        }
      });

      /* ================= LEGEND ================= */

      const legendRow = sheet.addRow([
        "🟢 Paid (Cash / Check / ACH / Card)    🟠 Not Paid (including Overdue)",
      ]);

      legendRow.getCell(1).font = { italic: true, size: 11 };

      sheet.mergeCells(legendRow.number, 1, legendRow.number, mergeSpan);

      /* ================= MAIN HEADER ================= */

      // Header uses "8th Jul" style labels instead of bare day numbers
      const header = ["Client's Name", ...dayNumbers.map(formatDayHeader)];

      const headerRow = sheet.addRow(header);

      headerRow.eachCell((cell) => {
        cell.font = { bold: true, color: { argb: "FFFFFFFF" } };
        cell.fill = {
          type: "pattern",
          pattern: "solid",
          fgColor: { argb: "FF1F4E79" },
        };
        cell.alignment = { horizontal: "center" };
      });

      /* ================= DATA ROWS ================= */

      users.forEach((user) => {
        const rowValues = [user.name || "Unknown"];

        dayNumbers.forEach((d) => {
          const dayInvoices = (user.invoices || []).filter((inv) => {
            const invoiceDate = inv.billing_date;

            if (!invoiceDate) return false;

            return dayjs(invoiceDate, "YYYY-MM-DD").date() === d;
          });
          rowValues.push(dayInvoices);
        });

        const row = sheet.addRow(rowValues);

        row.eachCell((cell, colIndex) => {
          /* ================= CLIENT NAME CELL ================= */
          if (colIndex === 1) {
            const userInvoices = user.invoices || [];
            const hasUnpaid = userInvoices.some(
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

          /* ================= EMPTY CELL ================= */

          const invoices = cell.value;

          if (!invoices || invoices.length === 0) {
            cell.value = "—";
            cell.alignment = { horizontal: "center" };
            return;
          }

          /* ================= INVOICE CELL ================= */

          let text = invoices.length > 1 ? `${invoices.length} invoices\n` : "";
          let cellStatus = "PAID"; // default green; flip to NOT_PAID if any unpaid found

          invoices.forEach((inv) => {
            const status = getFinalStatus(inv);
            const emoji = status === "PAID" ? "🟢" : "🟠";
            const amount = Number(inv.total_due || 0).toFixed(2);

            text += `${inv.ref_no} $${amount} ${emoji}\n`;

            if (status === "NOT_PAID") {
              cellStatus = "NOT_PAID";
            }
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

      /* ================= FORMATTING ================= */

      sheet.columns.forEach((col, i) => {
        col.width = i === 0 ? 34 : 19;
      });

      sheet.views = [{ state: "frozen", xSplit: 1, ySplit: 5 }];

      /* ================= DOWNLOAD ================= */

      const buffer = await workbook.xlsx.writeBuffer();

      // Clean filename: "Invoice Report - January 2025.xlsx"
      saveAs(new Blob([buffer]), `Invoice Report - ${monthName}.xlsx`);

      message.success(`Invoice Report - ${monthName} downloaded successfully!`);
    } catch (err) {
      console.error(err);
      message.error("Excel export failed");
    }
  };

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
          {/* TOP ROW: Title + primary actions */}
          <Stack
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
              direction="row"
              spacing={1.5}
              sx={{ alignItems: "center", flexShrink: 0, flexWrap: "wrap" }}
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

          {/* SECOND ROW: Search + filters */}
          <Stack
            direction="row"
            spacing={1.5}
            sx={{
              justifyContent: "flex-end",
              alignItems: "center",
              flexWrap: "wrap",
            }}
          >
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
              value={selectedYear}
              style={{ width: 110, height: 44 }}
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
          </Stack>
        </Stack>
      </Paper>

      {/* TABLE */}

      <Table
        rowKey="id"
        columns={columns}
        dataSource={filteredData}
        loading={loading}
        pagination={{
          pageSize: 100,
          showSizeChanger: false,
        }}
        bordered
        size="middle"
      />

      {/* Payment method choice modal — replaces the old plain yes/no confirm */}
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
    </>
  );
};

export default AllInvoices;
