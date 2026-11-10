import { useEffect, useState } from "react";
import dayjs from "@/lib/dayjs";
import {
  Button,
  DatePicker,
  Flex,
  Input,
  Pagination,
  Spin,
  Empty,
  message,
  Collapse,
} from "antd";
import {
  CalendarDays,
  Mail,
  PackageCheck,
  RotateCcw,
  CircleCheck,
  TriangleAlert,
  Download,
} from "lucide-react";
import "./EmployeeEquipmentRecordsPage.scss";
import {
  listMonthlyEquipment,
  sendAssignmentForm,
} from "@/services/api/equipmentApi";
import PageHeader from "@/components/PageHeader";
import { saveXlsx, excelStyles } from "@/utils/excel";
import { formatDate } from "@/utils/datetime";

const STATUS_META = {
  ASSIGNED: {
    color: "var(--color-primary-strong)",
    bg: "var(--color-primary-soft)",
    icon: PackageCheck,
    label: "Assigned",
  },
  PARTIALLY_RETURNED: {
    color: "var(--color-warning-strong)",
    bg: "var(--color-warning-subtle)",
    icon: RotateCcw,
    label: "Partially Returned",
  },
  RETURNED: {
    color: "var(--color-success-strong)",
    bg: "var(--color-success-subtle)",
    icon: CircleCheck,
    label: "Returned",
  },
  OVERDUE: {
    color: "var(--color-error-strong)",
    bg: "var(--color-error-subtle)",
    icon: TriangleAlert,
    label: "Overdue",
  },
};

const getStatusMeta = (status) =>
  STATUS_META[status] || {
    color: "var(--color-text-secondary)",
    bg: "var(--color-bg-muted)",
    icon: PackageCheck,
    label: status || "—",
  };

const EmployeeEquipmentRecordsPage = () => {
  const [selectedMonth, setSelectedMonth] = useState(dayjs().format("YYYY-MM"));
  const [monthLabel, setMonthLabel] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [records, setRecords] = useState([]);
  const [pagination, setPagination] = useState(null);
  const [page, setPage] = useState(1);
  const [pageSize] = useState(10);
  const [loading, setLoading] = useState(true);
  const [sendingAssignmentId, setSendingAssignmentId] = useState(null);

  // Loads the month's records; sets state only once the request settles.
  const loadRecords = () =>
    listMonthlyEquipment({ month: selectedMonth, page, limit: pageSize, search: searchTerm })
      .then((res) => {
        setRecords(res?.data?.data?.items || []);
        setPagination(res?.data?.data?.pagination || null);
        setMonthLabel(res?.data?.data?.month?.label || "");
      })
      .catch(() => message.error("Couldn't load the equipment records."))
      .finally(() => setLoading(false));

  const fetchRecords = () => {
    setLoading(true);
    return loadRecords();
  };

  useEffect(() => {
    loadRecords();
    // Reloads when the month or page changes; the search runs on demand.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedMonth, page]);

  const handleMonthChange = (date) => {
    if (!date) return;
    setLoading(true);
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
      await sendAssignmentForm(assignment.id);
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

  const handleExportExcel = async () => {
    if (!records.length) {
      message.info("No records to export for this month.");
      return;
    }

    const styles = excelStyles();

    // Title, employee and summary rows are merged across columns A–J.
    const MERGED_COLUMNS = 10;
    const mergedRow = (value, style) => [
      { value, columnSpan: MERGED_COLUMNS, alignVertical: "center", ...style },
      ...Array(MERGED_COLUMNS - 1).fill(null),
    ];

    const sheetData = [];

    sheetData.push(
      mergedRow(`Employee Equipment Records — ${monthLabel || selectedMonth}`, {
        ...styles.title,
        fontSize: 14,
        align: "left",
      }),
    );

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
      sheetData.push(
        mergedRow(
          `${employee.name}  |  ${employee.email || "—"}  |  ${employee.mobile || "—"}  |  ${
            employee.employee_type || "—"
          }`,
          { ...styles.subheader, fontSize: 12 },
        ),
      );

      // Summary line
      sheetData.push(
        mergedRow(
          `Assignments: ${summary.total_assignments}   Assigned: ${summary.total_assigned_quantity}   Returned: ${summary.total_returned_quantity}   Pending: ${summary.total_pending_quantity}`,
          { ...styles.note, ...styles.border, fontSize: 10 },
        ),
      );

      // Table header for this employee's assignments
      sheetData.push(
        tableHeaders.map((title) => ({
          value: title,
          ...styles.header,
          align: "left",
        })),
      );

      // Data rows: light border on every cell for a clean printed grid.
      // Remarks stays a fixed width and wraps vertically (taller row).
      assignments.forEach((assignment) => {
        const cells = [
          assignment.equipment?.name || "",
          assignment.assigned_quantity,
          assignment.returned_quantity,
          assignment.pending_quantity,
          formatDate(assignment.assigned_date),
          formatDate(assignment.expected_return_date),
          formatDate(assignment.actual_return_date),
          assignment.status,
        ];
        sheetData.push([
          ...cells.map((value) => ({ value, ...styles.border })),
          {
            value: assignment.remarks || "",
            ...styles.border,
            wrap: true,
            alignVertical: "top",
            height: 40,
          },
        ]);
      });

      sheetData.push([]); // spacer between employees
    });

    await saveXlsx(
      sheetData,
      {
        sheet: "Equipment Records",
        // Print-friendly: landscape page.
        orientation: "landscape",
        // Column widths — Remarks stays fixed and wraps vertically
        columns: [
          { width: 20 }, // Equipment
          { width: 12 }, // Assigned Qty
          { width: 12 }, // Returned Qty
          { width: 12 }, // Pending Qty
          { width: 16 }, // Assigned Date
          { width: 16 }, // Expected Return
          { width: 16 }, // Actual Return
          { width: 18 }, // Status
          { width: 45 }, // Remarks
        ],
      },
      `employee-equipment-records-${selectedMonth}.xlsx`,
    );
  };

  const collapseItems = records.map((record) => {
    const { employee, summary, assignments } = record;
    const initial = employee?.name?.charAt(0)?.toUpperCase() || "?";

    return {
      key: employee.id,
      label: (
        <div className="employee-record-summary">
          <div className="employee-record-summary__avatar">{initial}</div>
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
      ),
      children: (
        /* ── Form-style body ── */
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
                    <strong>
                      {formatDate(assignment.expected_return_date)}
                    </strong>
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
                  <Button
                    size="small"
                    icon={<Mail size={14} />}
                    disabled={isSending}
                    onClick={() =>
                      handleSendAssignmentEmail(assignment, employee.name)
                    }
                  >
                    {isSending ? "Sending..." : "Send This Record"}
                  </Button>
                </div>
              </div>
            );
          })}
        </div>
      ),
    };
  });

  return (
    <div className="employee-records-page">
      {/* ── Header ── */}
      <PageHeader
        title="EMPLOYEE EQUIPMENT RECORDS"
        subtitle="Monthly equipment summary per employee. Expand a name to view and email records."
        actions={
          <Button
            size="large"
            icon={<Download size={16} />}
            onClick={handleExportExcel}
          >
            Export Excel
          </Button>
        }
      />

      {/* ── Controls: month + search ── */}
      <div className="surface employee-records-page__controls-paper">
        <Flex gap={16} align="center" wrap>
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
        </Flex>
      </div>

      {/* ── Records ── */}
      {loading ? (
        <div className="employee-records-page__loading">
          <Spin size="large" />
        </div>
      ) : records.length === 0 ? (
        <div className="surface employee-records-page__empty">
          <Empty description="No equipment records found for this month." />
        </div>
      ) : (
        <div className="surface employee-records-page__list-paper">
          <Collapse
            accordion
            expandIconPlacement="end"
            className="employee-records-page__collapse"
            defaultActiveKey={
              records.length === 1 ? [records[0].employee.id] : []
            }
            items={collapseItems}
          />
        </div>
      )}

      {/* ── Pagination ── */}
      {pagination && pagination.total_pages > 1 && (
        <div className="employee-records-page__pagination">
          <Pagination
            current={pagination.page}
            pageSize={pagination.limit}
            total={pagination.total}
            onChange={(p) => {
              setLoading(true);
              setPage(p);
            }}
            showSizeChanger={false}
          />
        </div>
      )}
    </div>
  );
};

export default EmployeeEquipmentRecordsPage;
