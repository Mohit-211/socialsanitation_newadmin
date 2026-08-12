/** @format */

import React, { useEffect, useState } from "react";
import dayjs from "@/lib/dayjs";
import { DatePicker, Input, Pagination, Spin, Empty, message, Collapse } from "antd";
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
} from "lucide-react";
import "./EmployeeEquipmentRecordsPage.scss";
import {
  GetMonthlyEquipmentRecords,
  SendAssignmentFormEmail,
} from "../../../services/Api/equipmentApi";

const { Panel } = Collapse;

const STATUS_META = {
  ASSIGNED: { color: "#4338ca", bg: "#eef2ff", icon: PackageCheck, label: "Assigned" },
  PARTIALLY_RETURNED: {
    color: "#b45309",
    bg: "#fef3c7",
    icon: RotateCcw,
    label: "Partially Returned",
  },
  RETURNED: { color: "#059669", bg: "#ecfdf5", icon: CircleCheck, label: "Returned" },
  OVERDUE: { color: "#dc2626", bg: "#fee2e2", icon: TriangleAlert, label: "Overdue" },
};

const getStatusMeta = (status) =>
  STATUS_META[status] || { color: "#4b5f58", bg: "#f1f4f2", icon: PackageCheck, label: status || "—" };

const formatDate = (dateStr) => (dateStr ? dayjs(dateStr).format("DD MMM YYYY") : "—");

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
        `Sent to ${employeeName} · ${assignment.equipment?.name || "equipment"} record.`
      );
    } catch (err) {
      message.error(
        err?.response?.data?.message || "Failed to send this record. Please try again."
      );
    } finally {
      setSendingAssignmentId(null);
    }
  };

  return (
    <div className="employee-records-page">
      {/* ── Header ── */}
      <Paper variant="outlined" className="employee-records-page__header-paper">
        <Box>
          <Typography className="page-title">EMPLOYEE EQUIPMENT RECORDS</Typography>
          <Typography className="page-sub-title">
            Monthly equipment summary per employee. Expand a name to view and email records.
          </Typography>
        </Box>
      </Paper>

      {/* ── Controls: month + search ── */}
      <Paper variant="outlined" className="employee-records-page__controls-paper">
        <Stack direction="row" spacing={2} alignItems="center" flexWrap="wrap">
          <div className="employee-records-page__month-picker">
            <CalendarDays size={16} className="employee-records-page__month-icon" />
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
            <span className="employee-records-page__month-label">Showing: {monthLabel}</span>
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
            defaultActiveKey={records.length === 1 ? [records[0].employee.id] : []}
          >
            {records.map((record) => {
              const { employee, summary, assignments } = record;
              const initial = employee?.name?.charAt(0)?.toUpperCase() || "?";

              return (
                <Panel
                  key={employee.id}
                  header={
                    <div className="employee-record-summary">
                      <div className="employee-record-summary__avatar">{initial}</div>
                      <div className="employee-record-summary__identity">
                        <span className="employee-record-summary__name">{employee.name}</span>
                        <span className="employee-record-summary__email">{employee.email}</span>
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
                        <span className="employee-record-form__field-label">Employee</span>
                        <span className="employee-record-form__field-value">{employee.name}</span>
                      </div>
                      <div className="employee-record-form__field">
                        <span className="employee-record-form__field-label">Email</span>
                        <span className="employee-record-form__field-value">
                          {employee.email || "—"}
                        </span>
                      </div>
                      <div className="employee-record-form__field">
                        <span className="employee-record-form__field-label">Mobile</span>
                        <span className="employee-record-form__field-value">
                          {employee.mobile || "—"}
                        </span>
                      </div>
                      <div className="employee-record-form__field">
                        <span className="employee-record-form__field-label">Employee Type</span>
                        <span className="employee-record-form__field-value">
                          {employee.employee_type || "—"}
                        </span>
                      </div>
                      <div className="employee-record-form__field">
                        <span className="employee-record-form__field-label">Total Assigned</span>
                        <span className="employee-record-form__field-value">
                          {summary.total_assigned_quantity}
                        </span>
                      </div>
                      <div className="employee-record-form__field">
                        <span className="employee-record-form__field-label">Total Returned</span>
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
                        <div key={assignment.id} className="assignment-form-row">
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
                              <strong>{formatDate(assignment.assigned_date)}</strong>
                            </div>
                            <div className="assignment-form-row__field">
                              <span>Expected Return</span>
                              <strong>{formatDate(assignment.expected_return_date)}</strong>
                            </div>
                            <div className="assignment-form-row__field">
                              <span>Actual Return</span>
                              <strong>{formatDate(assignment.actual_return_date)}</strong>
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
                              onClick={() => handleSendAssignmentEmail(assignment, employee.name)}
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