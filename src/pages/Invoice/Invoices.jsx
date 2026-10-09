import { useEffect, useState, useMemo } from "react";
import { Table, Tag, Button, message, Modal, Input, Select } from "antd";
import dayjs from "@/lib/dayjs";
import Box from "@mui/material/Box";
import Paper from "@mui/material/Paper";
import Typography from "@mui/material/Typography";
import Stack from "@mui/material/Stack";
import MuiButton from "@mui/material/Button";
import InvoiceViewModal from "./InvoiceViewModal";
import { useNavigate } from "react-router-dom";
import {
  GetInvoices,
  GetMonthlyInvoicesSummary,
  MarkInvoiceBooked,
  MarkInvoiceCheckPaid,
  MarkInvoiceACHPaid,
} from "../../services/Api/InvoiceApi";
import ExcelJS from "exceljs";
import { saveAs } from "file-saver";
import { DeleteServiceQuote } from "../../services/Api/BookingApi";
import Tooltip from "@mui/material/Tooltip";
import IconButton from "@mui/material/IconButton";
import {
  Search as SearchIcon,
  Download,
  Eye,
  FileText,
  CheckCircle2,
  Banknote,
  Trash2,
  Pencil,
} from "lucide-react";

const jobStatusConfig = {
  NOT_BOOKED: { label: "NOT BOOKED", color: "gold" },
  BOOKED: { label: "BOOKED", color: "blue" },
  EXPIRED: { label: "EXPIRED", color: "red" },
};

const paymentStatusConfig = {
  NOT_PAID: { label: "NOT PAID", color: "orange" },
  PAID: { label: "PAID", color: "green" },
  CASH_PAID: { label: "PAID (CASH)", color: "green" },
  CHECK_PAID: { label: "PAID (CHECK)", color: "green" },
  ACH_PAID: { label: "PAID (ACH)", color: "green" },
};

const actionIconBtn = (color) => ({
  width: 34,
  height: 34,
  border: "1px solid",
  borderColor: color,
  color,
  "&:hover": {
    backgroundColor: `${color}14`,
    borderColor: color,
  },
});

const PDF_BASE_URL = "https://node.socialsanitation.com/api/v1/docs";

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
        <Stack useFlexGap sx={{ flexWrap: { xs: "wrap", md: "nowrap" } }} direction="row" spacing={0.75}>
          <Tooltip title="View Details">
            <IconButton
              size="small"
              sx={actionIconBtn("#F59E0B")}
              onClick={() => setSelectedInvoice(record)}
            >
              <Eye size={16} />
            </IconButton>
          </Tooltip>

          <Tooltip title="Edit Quote">
            <IconButton
              size="small"
              sx={actionIconBtn("#6366F1")}
              onClick={() => navigate("/edit-service-quote/" + record.id)}
            >
              <Pencil size={16} />
            </IconButton>
          </Tooltip>

          <Tooltip title="View PDF">
            <IconButton
              size="small"
              sx={actionIconBtn("#8B5CF6")}
              onClick={() => handleViewPdf(record)}
            >
              <FileText size={16} />
            </IconButton>
          </Tooltip>

          {record.job_status === "NOT_BOOKED" && (
            <Tooltip title="Mark Booked">
              <IconButton
                size="small"
                sx={actionIconBtn("#2563EB")}
                onClick={() => handleMarkBooked(record.id)}
              >
                <CheckCircle2 size={16} />
              </IconButton>
            </Tooltip>
          )}

          {record.payment_status === "NOT_PAID" && (
            <Tooltip title="Mark Paid by Check/ACH">
              <IconButton
                size="small"
                sx={actionIconBtn("#16A34A")}
                onClick={() => openPayModal(record.id)}
              >
                <Banknote size={16} />
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

      const workbook = new ExcelJS.Workbook();
      const sheet = workbook.addWorksheet("Service Quotes " + monthName, {
        properties: { defaultRowHeight: 34 },
      });

      sheet.pageSetup = {
        paperSize: 9,
        orientation: "landscape",
        fitToPage: true,
        fitToWidth: 1,
        fitToHeight: 0,
        horizontalCentered: true,
        verticalCentered: false, // top-anchored, not centered — content should start at the top, extra space (if any) goes below
      };
      sheet.pageSetup.printTitlesRow = "5:5";

      const colors = {
        PAID: "FFE8F5E9",
        NOT_PAID: "FFFFF4E5",
      };

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

      const titleRow = sheet.addRow(["Service Quote Invoices - " + monthName]);
      titleRow.getCell(1).font = { bold: true, size: 16 };
      titleRow.getCell(1).alignment = { horizontal: "center" };
      sheet.mergeCells(1, 1, 1, mergeSpan);

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
        totalInvoices,
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

      const legendRow = sheet.addRow([
        "🟢 Paid (Card / Check / ACH / Cash)     🟠 Not Paid",
      ]);
      legendRow.getCell(1).font = { italic: true, size: 11 };
      sheet.mergeCells(legendRow.number, 1, legendRow.number, mergeSpan);

      const header = ["Client Name"].concat(dayNumbers.map(formatDayHeader));

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

      users.forEach((user) => {
        const rowValues = [user.name || "Unknown"];

        dayNumbers.forEach((d) => {
          const dayInvoices = (user.invoices || []).filter(
            (inv) => dayjs(inv.created_at).date() === d,
          );
          rowValues.push(dayInvoices);
        });

        const row = sheet.addRow(rowValues);

        row.eachCell((cell, colIndex) => {
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

          const invoices = cell.value;
          if (!invoices || invoices.length === 0) {
            cell.value = "—";
            cell.alignment = { horizontal: "center" };
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

          cell.value = text.trim();
          cell.fill = {
            type: "pattern",
            pattern: "solid",
            fgColor: { argb: colors[cellStatus] },
          };
          cell.alignment = {
            wrapText: true,
            vertical: "top",
            horizontal: "center",
          };
        });

        const maxQuotesInADay = Math.max(
          1,
          ...dayNumbers.map(
            (d) =>
              (user.invoices || []).filter(
                (inv) => dayjs(inv.created_at).date() === d,
              ).length,
          ),
        );
        row.height = Math.max(34, 20 + maxQuotesInADay * 16);
      });

      sheet.columns.forEach((col, i) => {
        if (i === 0) col.width = 36;
        else col.width = 20;
      });

      sheet.views = [{ state: "frozen", xSplit: 1, ySplit: 5 }];

      const buffer = await workbook.xlsx.writeBuffer();
      saveAs(new Blob([buffer]), "Service Quote Invoices - " + monthName + ".xlsx");

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
    <Box>
      <Paper
        variant="outlined"
        sx={{ p: 2.5, mb: 2.5, borderRadius: "10px", borderColor: "#eef0f2" }}
      >
        <Stack spacing={2}>
          <Stack useFlexGap
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
                SERVICE QUOTE MANAGEMENT
              </Typography>
              <Typography
                className="page-sub-title"
                sx={{
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  whiteSpace: "nowrap",
                }}
              >
                View &amp; manage service quotes
              </Typography>
            </Box>

            <MuiButton
              variant="contained"
              disableElevation
              startIcon={<Download size={17} />}
              onClick={handleDownloadExcel}
              disabled={selectedMonth === null || selectedYear === null}
              sx={{
                height: 44,
                px: 2.5,
                borderRadius: "8px",
                textTransform: "none",
                fontWeight: 600,
                whiteSpace: "nowrap",
                flexShrink: 0,
              }}
            >
              Download Excel ({dayjs().month(selectedMonth).format("MMM")}{" "}
              {selectedYear})
            </MuiButton>
          </Stack>

          <Stack useFlexGap
            direction="row"
            spacing={1.5}
            sx={{ justifyContent: "flex-end", alignItems: "center", flexWrap: "wrap" }}
          >
            <Input
              allowClear
              prefix={<SearchIcon size={18} color="#9CA3AF" />}
              placeholder="Search invoices..."
              onChange={(e) => setSearchText(e.target.value)}
              style={{ width: 240, height: 44 }}
            />

            <Select
              value={selectedMonth}
              style={{ width: 120, height: 44 }}
              onChange={(m) => {
                setSelectedMonth(m);
                fetchInvoices(m, selectedYear);
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
              style={{ width: 100, height: 44 }}
              onChange={(y) => {
                setSelectedYear(y);
                fetchInvoices(selectedMonth, y);
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
    </Box>
  );
};

export default Invoices;