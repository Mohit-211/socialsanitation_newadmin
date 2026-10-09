import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams, useLocation } from "react-router";
import { Modal, Select, DatePicker, message, Empty, Spin, Alert } from "antd";
import Box from "@mui/material/Box";
import Paper from "@mui/material/Paper";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import Button from "@mui/material/Button";
import IconButton from "@mui/material/IconButton";
import Tooltip from "@mui/material/Tooltip";
import {
  ArrowLeft,
  Plus,
  ClipboardList,
  Calendar,
  UserRound,
  ChevronRight,
  ChevronDown,
  Award,
  CheckCircle2,
  Clock,
  TrendingUp,
  Trash2,
  RotateCcw,
} from "lucide-react";
import dayjs from "@/lib/dayjs";
import {
  CreateInspection,
  GetMyInspections,
  DeleteInspection,
} from "../../services/Api/InspectionApi";
import { GetEmployeeDropdown } from "../../services/Api/equipmentApi";
import "./ClientInspections.scss";

const { Option } = Select;

// Same circular icon-button pattern used across User.jsx / AssignmentPage.jsx
const actionIconBtn = (color) => ({
  width: 30,
  height: 30,
  border: "1px solid",
  borderColor: color,
  color,
  backgroundColor: "#fff",
  "&:hover": {
    backgroundColor: `${color}14`,
    borderColor: color,
  },
});

const ROLE_LABELS = {
  7: "INSPECTOR/SUPERVISOR",
  8: "QUALITY ASSURANCE TECHNICIAN",
  9: "CLEANER",
};

// Keys match the backend status values exactly.
const STATUS_CONFIG = {
  ASSIGNED: { color: "#2563EB", bg: "#EFF6FF", label: "Assigned" },
  IN_PROGRESS: { color: "#D97706", bg: "#FFFBEB", label: "In Progress" },
  SUBMITTED: { color: "#7C3AED", bg: "#F5F3FF", label: "Submitted" },
  UNDER_REVIEW: { color: "#0891B2", bg: "#ECFEFF", label: "Under Review" },
  REOPENED: { color: "#EA580C", bg: "#FFF7ED", label: "Reopened" },
  COMPLETED: { color: "#16A34A", bg: "#F0FDF4", label: "Completed" },
  CANCELLED: { color: "#EF4444", bg: "#FEF2F2", label: "Cancelled" },
};

const statusStyle = (status) =>
  STATUS_CONFIG[status] || { color: "#6B7280", bg: "#F3F4F6", label: status };

const StatCard = ({ icon, label, value, color }) => (
  <Paper
    variant="outlined"
    sx={{
      flex: 1,
      minWidth: 160,
      p: 2,
      borderRadius: "10px",
      borderColor: "#eef0f2",
      display: "flex",
      alignItems: "center",
      gap: 1.5,
    }}
  >
    <Box sx={{ color, display: "flex" }}>{icon}</Box>
    <Box>
      <Typography
        sx={{ fontSize: 20, fontWeight: 700, color: "#1a1a1a", lineHeight: 1.1 }}
      >
        {value}
      </Typography>
      <Typography sx={{ fontSize: 12, color: "#9ca3af" }}>{label}</Typography>
    </Box>
  </Paper>
);

const ClientInspections = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const location = useLocation();

  const [loading, setLoading] = useState(false);
  const [inspections, setInspections] = useState([]);
  const [employees, setEmployees] = useState([]);

  const clientName =
    location.state?.clientName || inspections[0]?.client?.name;

  const [createModalVisible, setCreateModalVisible] = useState(false);
  const [selectedEmployeeId, setSelectedEmployeeId] = useState(null);
  const [selectedDate, setSelectedDate] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [createError, setCreateError] = useState(null);

  const fetchInspections = async () => {
    try {
      setLoading(true);
      const res = await GetMyInspections(Number(id));
      const all = res?.data?.data?.data || res?.data?.data || [];
      setInspections(
        [...all].sort(
          (a, b) => new Date(b.created_at) - new Date(a.created_at),
        ),
      );
    } catch (error) {
      console.error("Error fetching inspections:", error);
      message.error("Failed to fetch inspections");
    } finally {
      setLoading(false);
    }
  };

  const fetchEmployees = async () => {
    try {
      const res = await GetEmployeeDropdown();
      setEmployees(res?.data?.data || []);
    } catch (error) {
      console.error("Error fetching employees:", error);
      message.error("Failed to fetch employees");
    }
  };

  useEffect(() => {
    fetchInspections();
    fetchEmployees();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  // Only block dates that already have an inspection for this client.
  const takenDates = useMemo(
    () =>
      new Set(
        inspections.map((i) => dayjs(i.inspection_date).format("YYYY-MM-DD")),
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
      await CreateInspection({
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
          await DeleteInspection(inspectionRecord.id);
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
    <Box className="inspection-page">
      {/* Header — title/subtitle left, Back to Clients on the right */}
      <Paper
        variant="outlined"
        sx={{ p: 2.5, mb: 2.5, borderRadius: "10px", borderColor: "#eef0f2" }}
      >
        <div className="inspection-header-row">
          <Box>
            <Typography className="page-title">
              INSPECTIONS {clientName ? `— ${clientName.toUpperCase()}` : ""}
            </Typography>
            <Typography className="page-sub-title">
              Inspection history &amp; scheduling
            </Typography>
          </Box>

          <Button
            variant="contained"
            startIcon={<ArrowLeft size={18} />}
            onClick={() => navigate("/users")}
            sx={{
              height: 46,
              borderRadius: "8px",
              minWidth: 180,
              backgroundColor: "#2c3345",
              "&:hover": { backgroundColor: "#232838" },
            }}
          >
            Back to Clients
          </Button>
        </div>
      </Paper>

      {/* Quick stats */}
      <Stack
        direction="row"
        spacing={2}
        sx={{ flexWrap: "wrap", mb: 2.5 }}
        useFlexGap
      >
        <StatCard
          icon={<ClipboardList size={20} />}
          label="Total Inspections"
          value={stats.total}
          color="#6366F1"
        />
        <StatCard
          icon={<CheckCircle2 size={20} />}
          label="Completed"
          value={stats.completed}
          color="#16A34A"
        />
        <StatCard
          icon={<Clock size={20} />}
          label="In Progress / Pending"
          value={stats.pending}
          color="#D97706"
        />
        <StatCard
          icon={<TrendingUp size={20} />}
          label="Average Score"
          value={stats.avgScore === "—" ? "—" : `${stats.avgScore}/10`}
          color="#7C3AED"
        />
      </Stack>

      {/* Toolbar */}
      <div className="inspection-toolbar">
        <span className="inspection-toolbar__label">
          {inspections.length} inspection{inspections.length === 1 ? "" : "s"}{" "}
          on record
        </span>
        <Button
          variant="contained"
          color="primary"
          startIcon={<Plus size={18} />}
          onClick={openCreateModal}
          sx={{ height: 42, borderRadius: "8px" }}
        >
          New Inspection
        </Button>
      </div>

      {loading ? (
        <Box sx={{ display: "flex", justifyContent: "center", py: 8 }}>
          <Spin size="large" />
        </Box>
      ) : inspections.length === 0 ? (
        <Paper
          variant="outlined"
          sx={{ borderRadius: "10px", borderColor: "#eef0f2", py: 8 }}
        >
          <Empty
            image={
              <ClipboardList
                size={48}
                color="#d1d5db"
                style={{ margin: "0 auto" }}
              />
            }
            description={
              <span style={{ color: "#9ca3af" }}>
                No inspections yet for this client
              </span>
            }
          />
        </Paper>
      ) : (
        <Box
          sx={{
            display: "grid",
            gridTemplateColumns: {
              xs: "1fr",
              sm: "repeat(2, 1fr)",
              lg: "repeat(3, 1fr)",
            },
            gap: "16px",
          }}
        >
          {inspections.map((item) => {
            const st = statusStyle(item.status);
            const isReopened = item.status === "REOPENED";
            const reopenCount = Number(item.reopen_count || 0);

            return (
              <Paper
                key={item.id}
                variant="outlined"
                className="inspection-card"
                onClick={() => navigate(`/inspection/${item.id}`)}
                sx={{
                  p: 2.25,
                  borderRadius: "10px",
                  borderColor: isReopened ? "#fed7aa" : "#eef0f2",
                  cursor: "pointer",
                  transition: "border-color 0.15s ease, box-shadow 0.15s ease",
                  "&:hover": {
                    borderColor: isReopened ? "#fdba74" : "#d6d9de",
                    boxShadow: "0 2px 8px rgba(0,0,0,0.06)",
                  },
                }}
              >
                <div className="inspection-card__top-row">
                  <Stack sx={{ alignItems: "center" }} direction="row" spacing={0.75}>
                    <Box
                      sx={{
                        px: 1.25,
                        py: 0.4,
                        borderRadius: "6px",
                        fontSize: 11.5,
                        fontWeight: 700,
                        letterSpacing: "0.02em",
                        color: st.color,
                        background: st.bg,
                      }}
                    >
                      {String(st.label).toUpperCase()}
                    </Box>

                    {/* History marker — stays visible after re-completion */}
                    {reopenCount > 0 && !isReopened && (
                      <Tooltip
                        title={
                          item.reopen_remark
                            ? `Last reopened: ${item.reopen_remark}`
                            : "This inspection was reopened before"
                        }
                      >
                        <Box
                          sx={{
                            display: "inline-flex",
                            alignItems: "center",
                            gap: 0.4,
                            px: 0.9,
                            py: 0.3,
                            borderRadius: "6px",
                            fontSize: 10.5,
                            fontWeight: 700,
                            color: "#c2410c",
                            background: "#fff7ed",
                            border: "1px solid #fed7aa",
                          }}
                        >
                          <RotateCcw size={11} />
                          Reopened ×{reopenCount}
                        </Box>
                      </Tooltip>
                    )}
                  </Stack>

                  <Tooltip title="Delete Inspection">
                    <IconButton
                      size="small"
                      className="inspection-card__delete"
                      sx={actionIconBtn("#EF4444")}
                      onClick={(event) => handleDeleteInspection(event, item)}
                    >
                      <Trash2 size={14} />
                    </IconButton>
                  </Tooltip>
                </div>

                <Typography
                  sx={{
                    fontSize: 14.5,
                    fontWeight: 600,
                    color: "#1a1a1a",
                    mt: 1.5,
                    mb: 1.25,
                    lineHeight: 1.35,
                    display: "-webkit-box",
                    WebkitLineClamp: 2,
                    WebkitBoxOrient: "vertical",
                    overflow: "hidden",
                  }}
                >
                  {item.name}
                </Typography>

                <Stack spacing={0.75}>
                  <Stack sx={{ alignItems: "center" }} direction="row" spacing={0.9}>
                    <Calendar size={14} color="#9ca3af" />
                    <Typography sx={{ fontSize: 12.5, color: "#6b7280" }}>
                      {dayjs(item.inspection_date).format("MMM D, YYYY")}
                    </Typography>
                  </Stack>
                  <Stack sx={{ alignItems: "center" }} direction="row" spacing={0.9}>
                    <UserRound size={14} color="#9ca3af" />
                    <Typography sx={{ fontSize: 12.5, color: "#6b7280" }}>
                      {item.employee?.name || "Unassigned"}
                    </Typography>
                  </Stack>
                  {isReopened && item.reopen_remark && (
                    <Stack sx={{ alignItems: "flex-start" }} direction="row" spacing={0.9}>
                      <RotateCcw
                        size={14}
                        color="#ea580c"
                        style={{ marginTop: 2, flexShrink: 0 }}
                      />
                      <Typography
                        sx={{
                          fontSize: 12.5,
                          color: "#c2410c",
                          display: "-webkit-box",
                          WebkitLineClamp: 2,
                          WebkitBoxOrient: "vertical",
                          overflow: "hidden",
                        }}
                      >
                        {item.reopen_remark}
                      </Typography>
                    </Stack>
                  )}
                </Stack>

                <div className="inspection-card__footer">
                  {item.status === "COMPLETED" &&
                  item.score !== null &&
                  item.score !== undefined ? (
                    <Stack sx={{ alignItems: "center" }} direction="row" spacing={0.6}>
                      <Award size={14} color="#16A34A" />
                      <Typography
                        sx={{ fontSize: 13, fontWeight: 700, color: "#16A34A" }}
                      >
                        {item.score}/10
                      </Typography>
                    </Stack>
                  ) : (
                    <Typography sx={{ fontSize: 12.5, color: "#c1c5cb" }}>
                      {isReopened ? "Re-grading pending" : "Not rated"}
                    </Typography>
                  )}

                  <Stack
                    direction="row"
                    spacing={0.25}
                    sx={{ alignItems: "center", color: "#6366F1" }}
                  >
                    <Typography sx={{ fontSize: 12.5, fontWeight: 600 }}>
                      View
                    </Typography>
                    <ChevronRight size={15} />
                  </Stack>
                </div>
              </Paper>
            );
          })}
        </Box>
      )}

      {/* Create Inspection modal */}
      <Modal
        title={
          <Stack sx={{ alignItems: "center" }} direction="row" spacing={1.25}>
            <Box
              sx={{
                width: 34,
                height: 34,
                borderRadius: "8px",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                background: "#eef2ff",
                color: "#6366F1",
                flexShrink: 0,
              }}
            >
              <ClipboardList size={17} />
            </Box>
            <span style={{ fontWeight: 600 }}>New Inspection</span>
          </Stack>
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
            message={createError}
            style={{ marginTop: 16, borderRadius: 8 }}
          />
        )}

        <Typography
          component="label"
          sx={{
            display: "block",
            fontSize: "13px",
            fontWeight: 600,
            color: "#374151",
            margin: "16px 0 8px",
          }}
        >
          Assign Employee
        </Typography>
        <Select
          showSearch
          value={selectedEmployeeId}
          placeholder="Select employee"
          style={{ width: "100%", height: 45 }}
          optionFilterProp="label"
          suffixIcon={<ChevronDown size={16} color="#2c3345" />}
          onChange={(value) => setSelectedEmployeeId(value)}
        >
          {employees.map((emp) => (
            <Option
              key={emp.id}
              value={emp.id}
              label={`${emp.name} ${ROLE_LABELS[emp.role_id] || ""}`}
            >
              {emp.name} ({ROLE_LABELS[emp.role_id] || "N/A"})
            </Option>
          ))}
        </Select>

        <Typography
          component="label"
          sx={{
            display: "block",
            fontSize: "13px",
            fontWeight: 600,
            color: "#374151",
            margin: "18px 0 8px",
          }}
        >
          Inspection Date
        </Typography>
        <DatePicker
          value={selectedDate}
          onChange={(date) => setSelectedDate(date)}
          disabledDate={disabledDate}
          style={{ width: "100%", height: 45 }}
          format="MM/DD/YYYY"
        />
        <Typography sx={{ fontSize: 11.5, color: "#9ca3af", mt: 0.75 }}>
          Dates already booked for this client are disabled — today and all
          other dates are open.
        </Typography>
      </Modal>
    </Box>
  );
};

export default ClientInspections;