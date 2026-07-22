/** @format */
import React, { useEffect, useState, useMemo } from "react";
import { Table, Button, Space, message, Input, Select, Modal } from "antd";
import dayjs from "@/lib/dayjs";
import { useNavigate } from "react-router";
import {
  DeleteInvoice,
  GetAllInvoices,
  GetMonthlyAllInvoicesSummary,
  MarkMonthlyInvoiceCheckPaid,
} from "../../services/Api/InvoiceApi";
import ExcelJS from "exceljs";
import { saveAs } from "file-saver";

const { Search } = Input;

const AllInvoices = () => {
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

      const res = await GetAllInvoices(formattedMonth);

      setData(res.data.data || []);
    } catch {
      message.error("Failed to load invoices");
    } finally {
      setLoading(false);
    }
  };

  const handleCheckPaid = async (id) => {
    Modal.confirm({
      title: "Mark invoice as Paid by Check/ACH?",
      content: "This invoice will be marked as Paid by Check/ACH.",
      okText: "Yes, Mark Paid",

      onOk: async () => {
        try {
          await MarkMonthlyInvoiceCheckPaid(id);

          message.success("Invoice marked as CHECK PAID");

          const date = dayjs()
            .year(selectedYear)
            .month(selectedMonth)
            .startOf("month");

          fetchInvoices(date);
        } catch {
          message.error("Failed to mark invoice as check paid");
        }
      },
    });
  };

  useEffect(() => {
    fetchInvoices(dayjs());
  }, []);

  /* ---------------- SEARCH FILTER ---------------- */

  const filteredData = useMemo(() => {
    if (!searchText) return data;

    return data.filter((item) => {
      const name = item.invoices_user?.user_profile?.name?.toLowerCase() || "";
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

          fetchInvoices();
        } catch (error) {
          console.error("Delete error:", error);
          message.error("Failed to delete invoice");
        }
      },
    });
  };

  /* ---------------- TABLE COLUMNS ---------------- */

  const columns = [
    {
      title: "Invoice #",
      dataIndex: "ref_no",
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
          "YYYY-MM-DD"
        ).format("MM-DD-YYYY")}`;
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
          status === "CASH_PAID";

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
        <Space size="middle">
          <Button onClick={() => handleViewPDF(record)}>View PDF</Button>

          {/* ✅ NEW EDIT BUTTON */}
          <Button
            type="primary"
            onClick={() => navigate(`/edit-invoice/${record.id}`)}
          >
            Edit
          </Button>

          <Button danger onClick={() => handleDelete(record.id)}>
            Delete
          </Button>
          {record.payment_status === "NOT_PAID" && (
            <Button
              type="primary"
              style={{
                background: "#2e7d32",
                borderColor: "#2e7d32",
              }}
              onClick={() => handleCheckPaid(record.id)}
            >
              Mark ACH/Check Paid
            </Button>
          )}
        </Space>
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

      const users = res.data.data || [];

      const daysInMonth = dayjs(formattedMonth, "YYYY-MM").daysInMonth();

      const monthName = dayjs(formattedMonth).format("MMMM YYYY");

      const workbook = new ExcelJS.Workbook();

      const sheet = workbook.addWorksheet(`Monthly Invoices ${monthName}`, {
        properties: { defaultRowHeight: 32 },
      });

      /* ================= COLORS ================= */

      const colors = {
        PAID: "FFE8F5E9", // green — paid, cash paid, check paid
        NOT_PAID: "FFFFF4E5", // orange — not paid + overdue
      };

      /* ================= STATUS HELPER ================= */

      const getFinalStatus = (inv) => {
        const paidStatuses = ["PAID", "CHECK_PAID", "CASH_PAID"];
        const isPaid = paidStatuses.includes(inv.payment_status);

        if (isPaid) return "PAID";

        // overdue and not paid both map to NOT_PAID
        return "NOT_PAID";
      };

      /* ================= SUMMARY CALCULATION ================= */

      let totalCount = 0;
      let totalAmount = 0;

      let paidCount = 0;
      let paidAmount = 0;

      let checkPaidCount = 0;
      let checkPaidAmount = 0;

      let notPaidCount = 0;
      let notPaidAmount = 0;

      users.forEach((user) => {
        (user.invoices || []).forEach((inv) => {
          const amount = Number(inv.total_due || 0);
          const rawStatus = inv.payment_status;

          totalCount++;
          totalAmount += amount;

          if (rawStatus === "PAID") {
            paidCount++;
            paidAmount += amount;
          } else if (rawStatus === "CHECK_PAID") {
            checkPaidCount++;
            checkPaidAmount += amount;
          } else {
            // NOT_PAID + OVERDUE both go here
            notPaidCount++;
            notPaidAmount += amount;
          }
        });
      });

      /* ================= TITLE ================= */

      const titleRow = sheet.addRow([`Monthly Invoice Report - ${monthName}`]);

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
        totalCount,
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
        if (col % 2 === 0) {
          cell.numFmt = "$#,##0.00";
        }
      });

      /* ================= LEGEND ================= */

      const legendRow = sheet.addRow([
        "🟢 Paid (Cash / Check / Card)    🟠 Not Paid (including Overdue)",
      ]);

      legendRow.getCell(1).font = { italic: true, size: 11 };

      sheet.mergeCells(
        `A${legendRow.number}:${String.fromCharCode(64 + daysInMonth + 1)}${
          legendRow.number
        }`
      );

      /* ================= MAIN HEADER ================= */

      const header = ["Employee Name"];
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
          const dayInvoices = (user.invoices || []).filter((inv) => {
            const invoiceDate = inv.billing_date;

            if (!invoiceDate) return false;

            return dayjs(invoiceDate, "YYYY-MM-DD").date() === d;
          });
          rowValues.push(dayInvoices);
        }

        const row = sheet.addRow(rowValues);

        row.eachCell((cell, colIndex) => {
          /* ================= EMPLOYEE NAME CELL ================= */
          if (colIndex === 1) {
            const userInvoices = user.invoices || [];
            const hasUnpaid = userInvoices.some(
              (inv) => getFinalStatus(inv) === "NOT_PAID"
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

      <div style={{ marginBottom: 20 }}>
        {/* 🔹 TOP ROW */}
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            flexWrap: "wrap",
            gap: 12,
          }}
        >
          {/* LEFT */}
          <div>
            <h3 className="page-title">Invoices</h3>
            <p className="page-sub-title">
              View and manage all generated invoices
            </p>
          </div>

          {/* RIGHT ACTIONS */}
          <Space>
            <Button type="primary" onClick={handleDownloadExcel}>
              Download ({dayjs().month(selectedMonth).format("MMM")}{" "}
              {selectedYear})
            </Button>

            <Button
              type="default"
              onClick={() => navigate("/generate-invoice")}
            >
              + New Invoice
            </Button>
          </Space>
        </div>

        {/* 🔹 SECOND ROW (Filters + Search) */}
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginTop: 12,
            flexWrap: "wrap",
            gap: 12,
          }}
        >
          {/* SEARCH */}
          <Search
            placeholder="Search by ref, client, amount"
            allowClear
            onChange={(e) => setSearchText(e.target.value)}
            style={{ width: 280 }}
          />

          {/* FILTERS */}
          <Space>
            <Select
              value={selectedMonth}
              style={{ width: 130 }}
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
              style={{ width: 110 }}
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
          </Space>
        </div>
      </div>

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
      />
    </>
  );
};

export default AllInvoices;
