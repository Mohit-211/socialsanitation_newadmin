import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams, useLocation } from "react-router";
import {
  Alert,
  Button,
  DatePicker,
  Empty,
  Modal,
  Select,
  Spin,
  Tooltip,
  message,
} from "antd";
import {
  ArrowLeft,
  Plus,
  ClipboardList,
  Calendar,
  UserRound,
  ChevronRight,
  ChevronDown,
  Award,
  CircleCheck,
  Clock,
  TrendingUp,
  Trash2,
  RotateCcw,
} from "lucide-react";
import PageHeader from "@/components/PageHeader";
import IconAction from "@/components/IconAction";
import { createInspection, deleteInspection, listClientInspections } from "@/services/api/inspectionApi";
import { listEmployeeNames } from "@/services/api/employeeApi";
import { formatDate, fromApiDate, toApiDate } from "@/utils/datetime";
import "./ClientInspectionsPage.scss";

const { Option } = Select;

// An employee's roles, in words.
const rolesText = (employee) => (employee.roles || []).map((role) => role.name).join(", ");

// Keys match the backend status values exactly.
const STATUS_CONFIG = {
  ASSIGNED: {
    color: "var(--color-text-secondary)",
    bg: "var(--color-bg-muted)",
    label: "Assigned",
  },
  IN_PROGRESS: {
    color: "var(--color-warning-strong)",
    bg: "var(--color-warning-subtle)",
    label: "In Progress",
  },
  SUBMITTED: {
    color: "var(--color-primary-strong)",
    bg: "var(--color-primary-subtle)",
    label: "Submitted",
  },
  UNDER_REVIEW: {
    color: "var(--color-text-inverse)",
    bg: "var(--color-ink)",
    label: "Under Review",
  },
  REOPENED: {
    color: "var(--color-warning-strong)",
    bg: "var(--color-warning-border)",
    label: "Reopened",
  },
  COMPLETED: {
    color: "var(--color-success-strong)",
    bg: "var(--color-success-subtle)",
    label: "Completed",
  },
  CANCELLED: {
    color: "var(--color-error-strong)",
    bg: "var(--color-error-subtle)",
    label: "Cancelled",
  },
};

const statusStyle = (status) =>
  STATUS_CONFIG[status] || {
    color: "var(--color-text-muted)",
    bg: "var(--color-bg-muted)",
    label: status,
  };

// tone: "primary" | "success" | "warning" (icon color)
const StatCard = ({ icon, label, value, tone }) => (
  <div className="surface inspection-stat">
    <span className={`inspection-stat__icon inspection-stat__icon--${tone}`}>
      {icon}
    </span>
    <div>
      <div className="inspection-stat__value">{value}</div>
      <div className="inspection-stat__label">{label}</div>
    </div>
  </div>
);

const ClientInspectionsPage = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const location = useLocation();

  const [loading, setLoading] = useState(true);
  const [inspections, setInspections] = useState([]);
  const [employees, setEmployees] = useState([]);

  const clientName =
    location.state?.clientName || inspections[0]?.client?.name;

  const [createModalVisible, setCreateModalVisible] = useState(false);
  const [selectedEmployeeId, setSelectedEmployeeId] = useState(null);
  const [selectedDate, setSelectedDate] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [createError, setCreateError] = useState(null);

  // The client's inspections, newest first; state is set once the request settles.
  const loadInspections = () =>
    listClientInspections(Number(id))
      .then((res) =>
        setInspections(
          [...(res?.data?.data?.items || [])].sort((a, b) => new Date(b.created_at) - new Date(a.created_at)),
        ),
      )
      .catch(() => message.error("Couldn't load the inspections"))
      .finally(() => setLoading(false));

  const fetchInspections = () => {
    setLoading(true);
    return loadInspections();
  };

  const fetchEmployees = () =>
    listEmployeeNames()
      .then((res) => setEmployees(res?.data?.data?.items || []))
      .catch(() => message.error("Couldn't load the employees"));

  useEffect(() => {
    loadInspections();
    fetchEmployees();
    // Loaded for each client.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  // Only block dates that already have an inspection for this client.
  const takenDates = useMemo(
    () =>
      new Set(
        inspections.map((i) => toApiDate(fromApiDate(i.inspection_date))),
      ),
    [inspections],
  );

  const disabledDate = (current) => {
    if (!current) return false;
    return takenDates.has(current.format("YYYY-MM-DD"));
  };

  // Reopened inspections count as pending (score is cleared on reopen,
  // so they're also excluded from the average until completed again).
  const stats = useMemo(() => {
    const completed = inspections.filter(
      (i) => i.status === "COMPLETED",
    ).length;
    const pending = inspections.filter(
      (i) => !["COMPLETED", "CANCELLED"].includes(i.status),
    ).length;
    const scored = inspections.filter(
      (i) =>
        i.status === "COMPLETED" && i.score !== null && i.score !== undefined,
    );
    const avgScore = scored.length
      ? (
          scored.reduce((sum, i) => sum + Number(i.score), 0) / scored.length
        ).toFixed(1)
      : "—";
    return { total: inspections.length, completed, pending, avgScore };
  }, [inspections]);

  const openCreateModal = () => {
    setSelectedEmployeeId(null);
    setSelectedDate(null);
    setCreateError(null);
    setCreateModalVisible(true);
  };

  const handleCreateInspection = async () => {
    setCreateError(null);
    if (!selectedEmployeeId || !selectedDate) {
      setCreateError("Please select an employee and a date.");
      return;
    }
    try {
      setSubmitting(true);
      await createInspection({
        user_id: Number(id),
        employee_id: selectedEmployeeId,
        inspection_date: selectedDate.format("YYYY-MM-DD"),
      });
      message.success("Inspection created successfully");
      setCreateModalVisible(false);
      fetchInspections();
    } catch (error) {
      console.error("Error creating inspection:", error);
      const backendMessage = error?.response?.data?.message;
      setCreateError(
        backendMessage || "Failed to create inspection. Please try again.",
      );
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteInspection = (event, inspectionRecord) => {
    event.stopPropagation();
    Modal.confirm({
      title: "Delete Inspection",
      content: `Are you sure you want to delete "${inspectionRecord.name}"? This cannot be undone.`,
      okText: "Delete",
      okButtonProps: { danger: true },
      onOk: async () => {
        try {
          await deleteInspection(inspectionRecord.id);
          message.success("Inspection deleted successfully");
          fetchInspections();
        } catch (error) {
          console.error("Error deleting inspection:", error);
          message.error(
            error?.response?.data?.message || "Failed to delete inspection",
          );
        }
      },
    });
  };

  return (
    <div className="inspection-page">
      {/* Header — title/subtitle left, Back to Clients on the right */}
      <PageHeader
        title={
          clientName ? `INSPECTIONS — ${clientName.toUpperCase()}` : "INSPECTIONS"
        }
        subtitle="Inspection history & scheduling"
        actions={
          <Button
            size="large"
            icon={<ArrowLeft size={16} />}
            onClick={() => navigate("/users")}
          >
            Back to Clients
          </Button>
        }
      />

      {/* Quick stats */}
      <div className="inspection-stats">
        <StatCard
          icon={<ClipboardList size={20} />}
          label="Total Inspections"
          value={stats.total}
          tone="primary"
        />
        <StatCard
          icon={<CircleCheck size={20} />}
          label="Completed"
          value={stats.completed}
          tone="success"
        />
        <StatCard
          icon={<Clock size={20} />}
          label="In Progress / Pending"
          value={stats.pending}
          tone="warning"
        />
        <StatCard
          icon={<TrendingUp size={20} />}
          label="Average Score"
          value={stats.avgScore === "—" ? "—" : `${stats.avgScore}/10`}
          tone="primary"
        />
      </div>

      {/* Toolbar */}
      <div className="inspection-toolbar">
        <span className="inspection-toolbar__label">
          {inspections.length} inspection{inspections.length === 1 ? "" : "s"}{" "}
          on record
        </span>
        <Button
          type="primary"
          size="large"
          icon={<Plus size={16} />}
          onClick={openCreateModal}
        >
          New Inspection
        </Button>
      </div>

      {loading ? (
        <div className="inspection-page__loading">
          <Spin size="large" />
        </div>
      ) : inspections.length === 0 ? (
        <div className="surface inspection-page__empty">
          <Empty
            image={
              <ClipboardList
                size={48}
                color="var(--color-text-subtle)"
                style={{ margin: "0 auto" }}
              />
            }
            description={
              <span className="text-muted">
                No inspections yet for this client
              </span>
            }
          />
        </div>
      ) : (
        <div className="inspection-grid">
          {inspections.map((item) => {
            const st = statusStyle(item.status);
            const isReopened = item.status === "REOPENED";
            const reopenCount = Number(item.reopen_count || 0);

            return (
              <div
                key={item.id}
                className={`inspection-card${
                  isReopened ? " inspection-card--reopened" : ""
                }`}
                onClick={() => navigate(`/inspection/${item.id}`)}
              >
                <div className="inspection-card__top-row">
                  <div className="inspection-card__badges">
                    <span
                      className="inspection-card__status"
                      style={{ color: st.color, background: st.bg }}
                    >
                      {String(st.label).toUpperCase()}
                    </span>

                    {/* History marker — stays visible after re-completion */}
                    {reopenCount > 0 && !isReopened && (
                      <Tooltip
                        title={
                          item.reopen_remark
                            ? `Last reopened: ${item.reopen_remark}`
                            : "This inspection was reopened before"
                        }
                      >
                        <span className="inspection-card__reopen-chip">
                          <RotateCcw size={11} />
                          Reopened ×{reopenCount}
                        </span>
                      </Tooltip>
                    )}
                  </div>

                  <IconAction
                    icon={Trash2}
                    title="Delete Inspection"
                    danger
                    iconSize={14}
                    className="inspection-card__delete"
                    onClick={(event) => handleDeleteInspection(event, item)}
                  />
                </div>

                <h3 className="inspection-card__title">{item.name}</h3>

                <div className="inspection-card__meta">
                  <div className="inspection-card__meta-row">
                    <Calendar size={14} color="var(--color-text-subtle)" />
                    <span>
                      {formatDate(item.inspection_date)}
                    </span>
                  </div>
                  <div className="inspection-card__meta-row">
                    <UserRound size={14} color="var(--color-text-subtle)" />
                    <span>{item.employee?.name || "Unassigned"}</span>
                  </div>
                  {isReopened && item.reopen_remark && (
                    <div className="inspection-card__meta-row inspection-card__meta-row--remark">
                      <RotateCcw
                        size={14}
                        className="inspection-card__remark-icon"
                      />
                      <span className="inspection-card__remark">
                        {item.reopen_remark}
                      </span>
                    </div>
                  )}
                </div>

                <div className="inspection-card__footer">
                  {item.status === "COMPLETED" &&
                  item.score !== null &&
                  item.score !== undefined ? (
                    <span className="inspection-card__score">
                      <Award size={14} />
                      {item.score}/10
                    </span>
                  ) : (
                    <span className="inspection-card__unrated">
                      {isReopened ? "Re-grading pending" : "Not rated"}
                    </span>
                  )}

                  <span className="inspection-card__view">
                    View
                    <ChevronRight size={15} />
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Create Inspection modal */}
      <Modal
        title={
          <span className="inspection-create-modal__title">
            <span className="inspection-create-modal__icon">
              <ClipboardList size={17} />
            </span>
            New Inspection
          </span>
        }
        open={createModalVisible}
        onCancel={() => setCreateModalVisible(false)}
        onOk={handleCreateInspection}
        confirmLoading={submitting}
        okText="Create Inspection"
        width={460}
      >
        {createError && (
          <Alert
            type="error"
            showIcon
            title={createError}
            className="inspection-create-modal__alert"
          />
        )}

        <label className="field-label inspection-create-modal__label">
          Assign Employee
        </label>
        <Select
          showSearch
          size="large"
          value={selectedEmployeeId}
          placeholder="Select employee"
          style={{ width: "100%" }}
          optionFilterProp="label"
          suffix={<ChevronDown size={16} color="var(--color-text)" />}
          onChange={(value) => setSelectedEmployeeId(value)}
        >
          {employees.map((emp) => (
            <Option
              key={emp.id}
              value={emp.id}
              label={`${emp.name} ${rolesText(emp)}`}
            >
              {emp.name} ({rolesText(emp) || "No role"})
            </Option>
          ))}
        </Select>

        <label className="field-label inspection-create-modal__label">
          Inspection Date
        </label>
        <DatePicker
          size="large"
          value={selectedDate}
          onChange={(date) => setSelectedDate(date)}
          disabledDate={disabledDate}
          style={{ width: "100%" }}
          format="MM/DD/YYYY"
        />
        <p className="inspection-create-modal__hint">
          Dates already booked for this client are disabled — today and all
          other dates are open.
        </p>
      </Modal>
    </div>
  );
};

export default ClientInspectionsPage;
