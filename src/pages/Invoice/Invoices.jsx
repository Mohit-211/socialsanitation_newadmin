/** @format */
import React, { useEffect, useState, useMemo } from "react";
import { Table, Tag, Button, Space, message, Modal, Input, Select } from "antd";
import dayjs from "@/lib/dayjs";
import InvoiceViewModal from "./InvoiceViewModal";
import {
  GetInvoices,
  GetMonthlyInvoicesSummary,
  MarkInvoiceBooked,
  MarkInvoiceCashPaid,
} from "../../services/Api/InvoiceApi";
import ExcelJS from "exceljs";
import { saveAs } from "file-saver";
import { DeleteServiceQuote } from "../../services/Api/BookingApi";
const { Search } = Input;

const jobStatusConfig = {
  NOT_BOOKED: { label: "NOT BOOKED", color: "gold" },
  BOOKED: { label: "BOOKED", color: "blue" },
  EXPIRED: { label: "EXPIRED", color: "red" },
};

const paymentStatusConfig = {
  NOT_PAID: {
    label: "NOT PAID",
    color: "orange",
  },

  PAID: {
    label: "PAID",
    color: "green",
  },

  CASH_PAID: {
    label: "PAID (CASH)",
    color: "green",
  },

  CHECK_PAID: {
    label: "PAID (CHECK)",
    color: "green",
  },
};
const months = Array.from({ length: 12 }, (_, i) =>
  dayjs().month(i).format("MMMM")
);

const Invoices = () => {
  const adminToken = localStorage.getItem("adminToken");

  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedInvoice, setSelectedInvoice] = useState(null);

  // 🔍 filters
  const [searchText, setSearchText] = useState("");
  const [month, setMonth] = useState(dayjs());

  // 🔁 Fetch invoices
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
  }, []);

  // 🟡 Mark booked
  const handleMarkBooked = async (id) => {
    try {
      await MarkInvoiceBooked(id);
      message.success("Invoice marked as BOOKED");

      fetchInvoices(selectedMonth, selectedYear); // ✅ FIXED
    } catch {
      message.error("Failed to mark as booked");
    }
  };

  const handleCheckPaid = async (id) => {
    Modal.confirm({
      title: "Mark invoice as Paid by Check/ACH?",

      okText: "Yes, Mark Paid",

      onOk: async () => {
        try {
          await MarkInvoiceCashPaid(id);

          message.success("Marked as CHECK PAID");

          fetchInvoices(selectedMonth, selectedYear);
        } catch {
          message.error("Failed to mark as check paid");
        }
      },
    });
  };

  // 🔎 Search filter (client-side)
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
    {
      title: "Invoice #",
      dataIndex: "ref_no",
    },
    {
      title: "Client",
      render: (_, r) => r.payment_user?.user_profile?.name || "-",
    },
    {
      title: "Amount",
      dataIndex: "total_due",
      render: (v) => `$${Number(v).toFixed(2)}`,
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
        <Space>
          <Button onClick={() => setSelectedInvoice(record)}>View</Button>

          {record.job_status === "NOT_BOOKED" && (
            <Button type="primary" onClick={() => handleMarkBooked(record.id)}>
              Mark Booked
            </Button>
          )}

          {record.payment_status === "NOT_PAID" && (
            <Button
              type="primary"
              style={{
                background: "#2e7d32",
                borderColor: "#2e7d32",
              }}
              onClick={() => handleCheckPaid(record.id)}
            >
              Paid by Check/ACH
            </Button>
          )}

          <Button danger onClick={() => handleDelete(record.id)}>
            Delete
          </Button>
        </Space>
      ),
    },
  ];

  const [selectedMonth, setSelectedMonth] = useState(dayjs().month());
  const [selectedYear, setSelectedYear] = useState(dayjs().year());

  const months = Array.from({ length: 12 }, (_, i) =>
    dayjs().month(i).format("MMMM")
  );
  const years = Array.from({ length: 10 }, (_, i) => dayjs().year() - 5 + i);

  const handleDownloadExcel = async () => {
    try {
      const formattedMonth = dayjs()
        .year(selectedYear)
        .month(selectedMonth)
        .format("YYYY-MM");

      const res = await GetMonthlyInvoicesSummary(formattedMonth);
      const users = res.data.data || [];

      const daysInMonth = dayjs(formattedMonth, "YYYY-MM").daysInMonth();
      const monthName = dayjs(formattedMonth).format("MMMM YYYY");

      const workbook = new ExcelJS.Workbook();
      const sheet = workbook.addWorksheet(`Invoices ${monthName}`, {
        properties: { defaultRowHeight: 34 },
      });

      /* ================= COLORS ================= */
      const colors = {
        PAID: "FFE8F5E9", // green — paid, check paid
        NOT_PAID: "FFFFF4E5", // orange — not paid + overdue
      };

      /* ================= HELPER ================= */
      const getFinalStatus = (inv) => {
        const paidStatuses = ["PAID", "CASH_PAID", "CHECK_PAID"];
        if (paidStatuses.includes(inv.payment_status)) return "PAID";
        return "NOT_PAID"; // overdue and not paid both map here
      };

      /* ================= SUMMARY ================= */
      let totalInvoices = 0,
        totalAmount = 0;
      let paidCount = 0,
        paidAmount = 0;
      let checkPaidCount = 0,
        checkPaidAmount = 0;
      let notPaidCount = 0,
        notPaidAmount = 0;

      users.forEach((user) => {
        (user.invoices || []).forEach((inv) => {
          const amount = Number(inv.total_due || 0);
          totalInvoices++;
          totalAmount += amount;

          if (inv.payment_status === "PAID") {
            paidCount++;
            paidAmount += amount;
          } else if (inv.payment_status === "CHECK_PAID") {
            checkPaidCount++;
            checkPaidAmount += amount;
          } else {
            notPaidCount++;
            notPaidAmount += amount;
          } // NOT_PAID + OVERDUE + CASH_PAID fallthrough
        });
      });

      /* ================= TITLE ================= */
      const titleRow = sheet.addRow([`Service Quote Invoices - ${monthName}`]);
      titleRow.getCell(1).font = { bold: true, size: 16 };
      titleRow.getCell(1).alignment = { horizontal: "center" };
      sheet.mergeCells(1, 1, 1, daysInMonth + 1);

      /* ================= SUMMARY ================= */
      const summaryHeader = sheet.addRow([
        "Total Invoices",
        "Total Amount",
        "Paid",
        "Paid Amount",
        "Check Paid",
        "Check Paid Amount",
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
        checkPaidCount,
        checkPaidAmount,
        notPaidCount,
        notPaidAmount,
      ]);

      summaryRow.eachCell((cell, col) => {
        cell.font = { bold: true };
        cell.alignment = { horizontal: "center" };
        if (col % 2 === 0) cell.numFmt = "$#,##0.00";
      });

      /* ================= LEGEND ================= */
      const legendRow = sheet.addRow([
        "🟢 Paid (Card / Check)     🟠 Not Paid (including Overdue)",
      ]);
      legendRow.getCell(1).font = { italic: true, size: 11 };
      sheet.mergeCells(
        `A${legendRow.number}:${String.fromCharCode(64 + daysInMonth + 1)}${
          legendRow.number
        }`
      );

      /* ================= MAIN HEADER ================= */
      const header = ["Client Name"];
      for (let i = 1; i <= daysInMonth; i++) {
        header.push(i.toString());
      }

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

        for (let d = 1; d <= daysInMonth; d++) {
          const dayInvoices = (user.invoices || []).filter(
            (inv) => dayjs(inv.created_at).date() === d
          );
          rowValues.push(dayInvoices);
        }

        const row = sheet.addRow(rowValues);

        row.eachCell((cell, colIndex) => {
          /* ================= CLIENT NAME CELL ================= */
          if (colIndex === 1) {
            const userInvoices = user.invoices || [];
            const hasUnpaid = userInvoices.some(
              (inv) => getFinalStatus(inv) === "NOT_PAID"
            );

            // Paint the entire row first (red if any unpaid, else alternating white/grey)
            row.eachCell((entireRowCell) => {
              entireRowCell.fill = {
                type: "pattern",
                pattern: "solid",
                fgColor: {
                  argb: hasUnpaid
                    ? "FFFFCCCC" // red row
                    : row.number % 2 === 0
                    ? "FFF9F9F9"
                    : "FFFFFFFF", // alternating
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
          let cellStatus = "PAID";

          invoices.forEach((inv) => {
            const status = getFinalStatus(inv);
            const emoji = status === "PAID" ? "🟢" : "🟠";
            const amount = `$${Number(inv.total_due || 0).toFixed(2)}`;
            text += `${inv.ref_no} ${amount} ${emoji}\n`;

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

      /* ================= COLUMN WIDTHS ================= */
      sheet.columns.forEach((col, i) => {
        if (i === 0) col.width = 36;
        else col.width = 22;
      });

      /* ================= FREEZE ================= */
      sheet.views = [{ state: "frozen", xSplit: 1, ySplit: 5 }];

      /* ================= DOWNLOAD ================= */
      const buffer = await workbook.xlsx.writeBuffer();
      saveAs(new Blob([buffer]), `Service Quote Invoices - ${monthName}.xlsx`);

      message.success(
        `Service Quote Invoices - ${monthName} downloaded successfully!`
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
      {/* Header */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: 20,
          gap: 16,
          flexWrap: "wrap",
        }}
      >
        {/* LEFT: TITLE */}
        <div>
          <h3 className="page-title">SERVICE QUOTE MANAGEMENT</h3>
          <p className="page-sub-title">View & manage service quote</p>
        </div>

        {/* RIGHT SIDE */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 12,
            flexWrap: "wrap",
          }}
        >
          {/* 📅 FILTERS */}
          <Space>
            <Select
              value={selectedMonth}
              style={{ width: 120 }}
              onChange={(m) => {
                setSelectedMonth(m);
                fetchInvoices(m, selectedYear);
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
              style={{ width: 100 }}
              onChange={(y) => {
                setSelectedYear(y);
                fetchInvoices(selectedMonth, y);
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
          </Space>

          {/* 📥 DOWNLOAD */}
          <Button
            type="primary"
            onClick={handleDownloadExcel}
            disabled={selectedMonth === null || selectedYear === null}
          >
            Download Excel ({dayjs().month(selectedMonth).format("MMM")}{" "}
            {selectedYear})
          </Button>

          {/* 🔎 SEARCH */}
          <Search
            placeholder="Search invoices..."
            allowClear
            onChange={(e) => setSearchText(e.target.value)}
            style={{ width: 240 }}
          />
        </div>
      </div>

      {/* Table */}
      <Table
        rowKey="id"
        columns={columns}
        dataSource={filteredData}
        loading={loading}
      />

      {/* View modal */}
      {selectedInvoice && (
        <InvoiceViewModal
          invoice={selectedInvoice}
          onClose={() => setSelectedInvoice(null)}
        />
      )}
    </>
  );
};

export default Invoices;
