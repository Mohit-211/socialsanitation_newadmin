/** @format */

import React, { useEffect, useState } from "react";
import dayjs from "@/lib/dayjs";
import {
  DatePicker,
  Input,
  Pagination,
  Spin,
  Empty,
  message,
  Collapse,
} from "antd";
import Box from "@mui/material/Box";
import Paper from "@mui/material/Paper";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import MuiButton from "@mui/material/Button";
import {
  CalendarDays,
  Mail,
  Phone,
  PackageCheck,
  RotateCcw,
  CircleCheck,
  TriangleAlert,
  Download,
} from "lucide-react";
import "./EmployeeEquipmentRecordsPage.scss";
import {
  GetMonthlyEquipmentRecords,
  SendAssignmentFormEmail,
} from "../../../services/Api/equipmentApi";
import XLSX from "xlsx-js-style";

const { Panel } = Collapse;

const STATUS_META = {
  ASSIGNED: {
    color: "#4338ca",
    bg: "#eef2ff",
    icon: PackageCheck,
    label: "Assigned",
  },
  PARTIALLY_RETURNED: {
    color: "#b45309",
    bg: "#fef3c7",
    icon: RotateCcw,
    label: "Partially Returned",
  },
  RETURNED: {
    color: "#059669",
    bg: "#ecfdf5",
    icon: CircleCheck,
    label: "Returned",
  },
  OVERDUE: {
    color: "#dc2626",
    bg: "#fee2e2",
    icon: TriangleAlert,
    label: "Overdue",
  },
};

const getStatusMeta = (status) =>
  STATUS_META[status] || {
    color: "#4b5f58",
    bg: "#f1f4f2",
    icon: PackageCheck,
    label: status || "—",
  };

const formatDate = (dateStr) =>
  dateStr ? dayjs(dateStr).format("DD MMM YYYY") : "—";

const EmployeeEquipmentRecordsPage = () => {
  const [selectedMonth, setSelectedMonth] = useState(dayjs().format("YYYY-MM"));
  const [monthLabel, setMonthLabel] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [records, setRecords] = useState([]);
  const [pagination, setPagination] = useState(null);
  const [page, setPage] = useState(1);
  const [pageSize] = useState(10);
  const [loading, setLoading] = useState(false);
  const [sendingAssignmentId, setSendingAssignmentId] = useState(null);

  const fetchRecords = async () => {
    setLoading(true);
    try {
      const res = await GetMonthlyEquipmentRecords({
        month: selectedMonth,
        page,
        limit: pageSize,
        search: searchTerm,
      });
      setRecords(res?.data?.data?.records || []);
      setPagination(res?.data?.data?.pagination || null);
      setMonthLabel(res?.data?.data?.month?.label || "");
    } catch (err) {
      message.error("Failed to fetch employee equipment records.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRecords();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedMonth, page]);

  const handleMonthChange = (date) => {
    if (!date) return;
    setSelectedMonth(date.format("YYYY-MM"));
    setPage(1);
  };

  const handleSearch = (value) => {
    setSearchTerm(value);
    setPage(1);
    fetchRecords();
  };

  const handleSendAssignmentEmail = async (assignment, employeeName) => {
    try {
      setSendingAssignmentId(assignment.id);
      await SendAssignmentFormEmail(assignment.id);
      message.success(
        `Sent to ${employeeName} · ${assignment.equipment?.name || "equipment"} record.`,
      );
    } catch (err) {
      message.error(
        err?.response?.data?.message ||
          "Failed to send this record. Please try again.",
      );
    } finally {
      setSendingAssignmentId(null);
    }
  };

  const handleExportExcel = () => {
    if (!records.length) {
      message.info("No records to export for this month.");
      return;
    }

    const HEADER_FILL = "2563EB"; // blue, matching the Assignments export
    const SECTION_FILL = "EEF2FF";
    const TABLE_HEADER_FILL = "F1F5F9";

    const sheetData = [];
    const merges = [];
    const rowStyles = {}; // rowIndex -> style to apply across the row

    const titleRow = 0;
    sheetData.push([
      `Employee Equipment Records — ${monthLabel || selectedMonth}`,
    ]);
    rowStyles[titleRow] = {
      font: { bold: true, sz: 14, color: { rgb: "16324F" } },
    };
    merges.push({ s: { r: titleRow, c: 0 }, e: { r: titleRow, c: 9 } });

    sheetData.push([]); // spacer

    const tableHeaders = [
      "Equipment",
      "Assigned Qty",
      "Returned Qty",
      "Pending Qty",
      "Assigned Date",
      "Expected Return",
      "Actual Return",
      "Status",
      "Remarks",
    ];

    records.forEach((record) => {
      const { employee, summary, assignments } = record;

      // ── Employee section header ──
      const empRowIndex = sheetData.length;
      sheetData.push([
        `${employee.name}  |  ${employee.email || "—"}  |  ${employee.mobile || "—"}  |  ${
          employee.employee_type || "—"
        }`,
      ]);
      rowStyles[empRowIndex] = {
        font: { bold: true, sz: 12, color: { rgb: "16324F" } },
        fill: { fgColor: { rgb: SECTION_FILL } },
      };
      merges.push({ s: { r: empRowIndex, c: 0 }, e: { r: empRowIndex, c: 9 } });

      // Summary line
      const summaryRowIndex = sheetData.length;
      sheetData.push([
        `Assignments: ${summary.total_assignments}   Assigned: ${summary.total_assigned_quantity}   Returned: ${summary.total_returned_quantity}   Pending: ${summary.total_pending_quantity}`,
      ]);
      rowStyles[summaryRowIndex] = {
        font: { italic: true, sz: 10, color: { rgb: "4B5F58" } },
      };
      merges.push({
        s: { r: summaryRowIndex, c: 0 },
        e: { r: summaryRowIndex, c: 9 },
      });

      // Table header for this employee's assignments
      const tableHeaderRowIndex = sheetData.length;
      sheetData.push(tableHeaders);
      rowStyles[tableHeaderRowIndex] = {
        font: { bold: true, color: { rgb: "16324F" } },
        fill: { fgColor: { rgb: TABLE_HEADER_FILL } },
      };

      const remarksColIndex = tableHeaders.length - 1;
      const dataRowStart = sheetData.length;

      assignments.forEach((assignment) => {
        sheetData.push([
          assignment.equipment?.name || "",
          assignment.assigned_quantity,
          assignment.returned_quantity,
          assignment.pending_quantity,
          formatDate(assignment.assigned_date),
          formatDate(assignment.expected_return_date),
          formatDate(assignment.actual_return_date),
          assignment.status,
          assignment.remarks || "",
        ]);
      });

      // wrap-text style flag for remarks cells in this block, applied after sheet is built
      for (let r = dataRowStart; r < sheetData.length; r++) {
        rowStyles[`remarks-${r}`] = remarksColIndex;
      }

      sheetData.push([]); // spacer between employees
    });

    const worksheet = XLSX.utils.aoa_to_sheet(sheetData);
    worksheet["!merges"] = merges;

    // Column widths — Remarks stays fixed and wraps vertically
    worksheet["!cols"] = [
      { wch: 20 }, // Equipment
      { wch: 12 }, // Assigned Qty
      { wch: 12 }, // Returned Qty
      { wch: 12 }, // Pending Qty
      { wch: 16 }, // Assigned Date
      { wch: 16 }, // Expected Return
      { wch: 16 }, // Actual Return
      { wch: 18 }, // Status
      { wch: 45 }, // Remarks
    ];

    const range = XLSX.utils.decode_range(worksheet["!ref"]);

    // Apply row-level styles (title, section headers, table headers)
    for (let row = range.s.r; row <= range.e.r; row++) {
      const style = rowStyles[row];
      if (!style) continue;
      for (let col = range.s.c; col <= range.e.c; col++) {
        const address = XLSX.utils.encode_cell({ r: row, c: col });
        if (!worksheet[address]) worksheet[address] = { t: "s", v: "" };
        worksheet[address].s = {
          ...style,
          alignment: { vertical: "center", wrapText: false },
        };
      }
    }

    // Wrap text on Remarks cells + border on every data cell for print clarity
    Object.keys(rowStyles).forEach((key) => {
      if (!key.startsWith("remarks-")) return;
      const row = Number(key.split("-")[1]);
      const col = rowStyles[key];
      const address = XLSX.utils.encode_cell({ r: row, c: col });
      if (worksheet[address]) {
        worksheet[address].s = {
          alignment: { wrapText: true, vertical: "top" },
          border: {
            top: { style: "thin", color: { rgb: "E5E7EB" } },
            bottom: { style: "thin", color: { rgb: "E5E7EB" } },
            left: { style: "thin", color: { rgb: "E5E7EB" } },
            right: { style: "thin", color: { rgb: "E5E7EB" } },
          },
        };
      }
    });

    // Light border on every non-empty data cell (not just remarks) for a clean printed grid
    for (let row = range.s.r; row <= range.e.r; row++) {
      for (let col = range.s.c; col <= range.e.c; col++) {
        const address = XLSX.utils.encode_cell({ r: row, c: col });
        const cell = worksheet[address];
        if (cell && cell.v !== "" && cell.v != null && !cell.s?.border) {
          cell.s = {
            ...cell.s,
            border: {
              top: { style: "thin", color: { rgb: "E5E7EB" } },
              bottom: { style: "thin", color: { rgb: "E5E7EB" } },
              left: { style: "thin", color: { rgb: "E5E7EB" } },
              right: { style: "thin", color: { rgb: "E5E7EB" } },
            },
          };
        }
      }
    }

    // Row heights: taller for remarks rows so wrapped text is visible
    worksheet["!rows"] = sheetData.map((_, i) => {
      const isRemarksRow = Object.keys(rowStyles).some(
        (k) => k.startsWith("remarks-") && Number(k.split("-")[1]) === i,
      );
      return isRemarksRow ? { hpt: 40 } : undefined;
    });

    // Print-friendly page setup: landscape, fit to page width, repeat title rows
    worksheet["!margins"] = {
      left: 0.4,
      right: 0.4,
      top: 0.5,
      bottom: 0.5,
      header: 0.2,
      footer: 0.2,
    };
    worksheet["!pageSetup"] = {
      orientation: "landscape",
      fitToWidth: 1,
      fitToHeight: 0,
      scale: 90,
    };
    worksheet["!printHeader"] = "A1:A2";

    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Equipment Records");

    XLSX.writeFile(
      workbook,
      `employee-equipment-records-${selectedMonth}.xlsx`,
    );
  };

  return (
    <div className="employee-records-page">
      {/* ── Header ── */}

      <Paper variant="outlined" className="employee-records-page__header-paper">
        <Stack
          direction="row"
          justifyContent="space-between"
          sx={{
            justifyContent: "space-between",
            alignItems: "center",
            flexWrap: { xs: "wrap", md: "nowrap" },
          }}
          alignItems="center"
          spacing={2}
          flexWrap="wrap"
          
        >
          <Box>
            <Typography className="page-title">
              EMPLOYEE EQUIPMENT RECORDS
            </Typography>
            <Typography className="page-sub-title">
              Monthly equipment summary per employee. Expand a name to view and
              email records.
            </Typography>
          </Box>

          <MuiButton
            variant="outlined"
            startIcon={<Download size={17} />}
            onClick={handleExportExcel}
            sx={{
              height: 44,
              px: 2.5,
              borderRadius: "8px",
              textTransform: "none",
              fontWeight: 600,
              whiteSpace: "nowrap",
            }}
          >
            Export Excel
          </MuiButton>
        </Stack>
      </Paper>

      {/* ── Controls: month + search ── */}
      <Paper
        variant="outlined"
        className="employee-records-page__controls-paper"
      >
        <Stack direction="row" spacing={2} alignItems="center" flexWrap="wrap">
          <div className="employee-records-page__month-picker">
            <CalendarDays
              size={16}
              className="employee-records-page__month-icon"
            />
            <DatePicker
              picker="month"
              value={dayjs(selectedMonth, "YYYY-MM")}
              onChange={handleMonthChange}
              allowClear={false}
              format="MMMM YYYY"
              className="employee-records-page__month-input"
            />
          </div>

          <Input.Search
            placeholder="Search by employee name"
            allowClear
            onSearch={handleSearch}
            className="employee-records-page__search"
          />

          {monthLabel && (
            <span className="employee-records-page__month-label">
              Showing: {monthLabel}
            </span>
          )}
        </Stack>
      </Paper>

      {/* ── Records ── */}
      {loading ? (
        <Box className="employee-records-page__loading">
          <Spin size="large" />
        </Box>
      ) : records.length === 0 ? (
        <Paper variant="outlined" className="employee-records-page__empty">
          <Empty description="No equipment records found for this month." />
        </Paper>
      ) : (
        <Paper variant="outlined" className="employee-records-page__list-paper">
          <Collapse
            accordion
            expandIconPosition="end"
            className="employee-records-page__collapse"
            defaultActiveKey={
              records.length === 1 ? [records[0].employee.id] : []
            }
          >
            {records.map((record) => {
              const { employee, summary, assignments } = record;
              const initial = employee?.name?.charAt(0)?.toUpperCase() || "?";

              return (
                <Panel
                  key={employee.id}
                  header={
                    <div className="employee-record-summary">
                      <div className="employee-record-summary__avatar">
                        {initial}
                      </div>
                      <div className="employee-record-summary__identity">
                        <span className="employee-record-summary__name">
                          {employee.name}
                        </span>
                        <span className="employee-record-summary__email">
                          {employee.email}
                        </span>
                      </div>
                      <div className="employee-record-summary__chips">
                        <span className="employee-record-summary__chip">
                          {summary.total_assignments} assignment
                          {summary.total_assignments !== 1 ? "s" : ""}
                        </span>
                        <span className="employee-record-summary__chip employee-record-summary__chip--pending">
                          {summary.total_pending_quantity} pending
                        </span>
                      </div>
                    </div>
                  }
                >
                  {/* ── Form-style body ── */}
                  <div className="employee-record-form">
                    {/* Employee info — laid out like a filled form header */}
                    <div className="employee-record-form__field-grid">
                      <div className="employee-record-form__field">
                        <span className="employee-record-form__field-label">
                          Employee
                        </span>
                        <span className="employee-record-form__field-value">
                          {employee.name}
                        </span>
                      </div>
                      <div className="employee-record-form__field">
                        <span className="employee-record-form__field-label">
                          Email
                        </span>
                        <span className="employee-record-form__field-value">
                          {employee.email || "—"}
                        </span>
                      </div>
                      <div className="employee-record-form__field">
                        <span className="employee-record-form__field-label">
                          Mobile
                        </span>
                        <span className="employee-record-form__field-value">
                          {employee.mobile || "—"}
                        </span>
                      </div>
                      <div className="employee-record-form__field">
                        <span className="employee-record-form__field-label">
                          Employee Type
                        </span>
                        <span className="employee-record-form__field-value">
                          {employee.employee_type || "—"}
                        </span>
                      </div>
                      <div className="employee-record-form__field">
                        <span className="employee-record-form__field-label">
                          Total Assigned
                        </span>
                        <span className="employee-record-form__field-value">
                          {summary.total_assigned_quantity}
                        </span>
                      </div>
                      <div className="employee-record-form__field">
                        <span className="employee-record-form__field-label">
                          Total Returned
                        </span>
                        <span className="employee-record-form__field-value">
                          {summary.total_returned_quantity}
                        </span>
                      </div>
                    </div>

                    <div className="employee-record-form__divider" />

                    {/* Assignments — each its own form section with its own Send button */}
                    <span className="employee-record-form__section-label">
                      Equipment Assignments
                    </span>

                    {assignments.map((assignment) => {
                      const meta = getStatusMeta(assignment.status);
                      const Icon = meta.icon;
                      const isSending = sendingAssignmentId === assignment.id;

                      return (
                        <div
                          key={assignment.id}
                          className="assignment-form-row"
                        >
                          <div className="assignment-form-row__top">
                            <span className="assignment-form-row__equipment">
                              {assignment.equipment?.name || "Equipment"}
                            </span>
                            <span
                              className="assignment-form-row__status"
                              style={{ background: meta.bg, color: meta.color }}
                            >
                              <Icon size={11} strokeWidth={2.5} />
                              {meta.label}
                            </span>
                          </div>

                          <div className="assignment-form-row__field-grid">
                            <div className="assignment-form-row__field">
                              <span>Assigned Qty</span>
                              <strong>{assignment.assigned_quantity}</strong>
                            </div>
                            <div className="assignment-form-row__field">
                              <span>Returned Qty</span>
                              <strong>{assignment.returned_quantity}</strong>
                            </div>
                            <div className="assignment-form-row__field">
                              <span>Pending Qty</span>
                              <strong>{assignment.pending_quantity}</strong>
                            </div>
                            <div className="assignment-form-row__field">
                              <span>Assigned Date</span>
                              <strong>
                                {formatDate(assignment.assigned_date)}
                              </strong>
                            </div>
                            <div className="assignment-form-row__field">
                              <span>Expected Return</span>
                              <strong>
                                {formatDate(assignment.expected_return_date)}
                              </strong>
                            </div>
                            <div className="assignment-form-row__field">
                              <span>Actual Return</span>
                              <strong>
                                {formatDate(assignment.actual_return_date)}
                              </strong>
                            </div>
                          </div>

                          {assignment.remarks && (
                            <div className="assignment-form-row__remarks">
                              <span>Remarks:</span> {assignment.remarks}
                            </div>
                          )}

                          <div className="assignment-form-row__actions">
                            <MuiButton
                              variant="outlined"
                              size="small"
                              startIcon={<Mail size={14} />}
                              disabled={isSending}
                              onClick={() =>
                                handleSendAssignmentEmail(
                                  assignment,
                                  employee.name,
                                )
                              }
                              sx={{
                                textTransform: "none",
                                fontWeight: 600,
                                borderRadius: "8px",
                              }}
                            >
                              {isSending ? "Sending..." : "Send This Record"}
                            </MuiButton>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </Panel>
              );
            })}
          </Collapse>
        </Paper>
      )}

      {/* ── Pagination ── */}
      {pagination && pagination.total_pages > 1 && (
        <div className="employee-records-page__pagination">
          <Pagination
            current={pagination.page}
            pageSize={pagination.limit}
            total={pagination.total}
            onChange={(p) => setPage(p)}
            showSizeChanger={false}
          />
        </div>
      )}
    </div>
  );
};

export default EmployeeEquipmentRecordsPage;
