/** @format */

import dayjs from "@/lib/dayjs";
import React, { useEffect, useState } from "react";
import {
  GetAllAttendance,
  GetTodayAttendanceStats,
  ManualClockInOut,
} from "../../services/Api/leaveRequestApi";
import {
  Table,
  DatePicker,
  Button,
  Modal,
  Image,
  TimePicker,
  Input,
  Tooltip,
} from "antd";
import "./Attendance.css";
import { FaRegCheckCircle } from "react-icons/fa";
import { FaRegClock } from "react-icons/fa";
import { TbBeach } from "react-icons/tb";
import { AiOutlinePlusCircle } from "react-icons/ai";
import { useNavigate } from "react-router";
import { BASE_URL_IMAGE } from "../../services/Host";
import utc from "dayjs/plugin/utc";
import timezone from "dayjs/plugin/timezone";
import Box from "@mui/material/Box";
import Paper from "@mui/material/Paper";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import { Search } from "lucide-react";

dayjs.extend(utc);
dayjs.extend(timezone);

// 🔹 Small responsive stat card used in the daily-view summary strip
const StatCard = ({ label, value }) => (
  <Box
    sx={{
      flex: "1 1 160px",
      minWidth: 140,
      p: 1.5,
      borderRadius: "8px",
      border: "1px solid #f0f0f0",
      backgroundColor: "#fafafa",
    }}
  >
    <Typography variant="caption" sx={{ color: "#6b7280", fontWeight: 600 }}>
      {label}
    </Typography>
    <Typography variant="h6" sx={{ fontWeight: 700, color: "#111827" }}>
      {value ?? "--"}
    </Typography>
  </Box>
);

// 🔹 Accessible, unstyled-native-button wrapper for the clickable icons in
// the table — avoids putting onClick directly on a bare <svg>/icon.
const IconAction = ({ onClick, label, children }) => (
  <button
    type="button"
    onClick={onClick}
    aria-label={label}
    style={{
      background: "none",
      border: "none",
      padding: 0,
      margin: 0,
      cursor: "pointer",
      display: "inline-flex",
      alignItems: "center",
    }}
  >
    {children}
  </button>
);

const AllAttendance = () => {
  const navigate = useNavigate();
  const [attendanceData, setAttendanceData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedDate, setSelectedDate] = useState(dayjs());
  const [monthlyData, setMonthlyData] = useState([]);
  const [isMonthlyView, setIsMonthlyView] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [stats, setStats] = useState(null);
  const [selectedMonth, setSelectedMonth] = useState(dayjs()); // default to current month
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [selectedEntry, setSelectedEntry] = useState(null);
  const [selectedEmployee, setSelectedEmployee] = useState("");

  const openDetailsModal = (employeeName, entry) => {
    setSelectedEmployee(employeeName);
    setSelectedEntry(entry);
    setIsDetailModalOpen(true);
  };

  const formatTimeOnly = (datetimeStr) => {
    if (!datetimeStr) return "---";
    return dayjs.utc(datetimeStr).format("hh:mm A");
  };

  const openMonthlyAttendance = async () => {
    try {
      const monthToUse = selectedMonth || dayjs(); // Use selected or fallback to today
      const formData = {
        month: (monthToUse.month() + 1).toString().padStart(2, "0"), // 1–12
        year: monthToUse.year().toString(),
      };

      const result = await GetAllAttendance(formData);
      setMonthlyData(result.data.data || []);
    } catch (err) {
      console.error("Failed to load monthly attendance", err);
    }
  };

  const getData = async () => {
    try {
      setLoading(true);

      if (!selectedDate) {
        console.warn("Selected date is missing. Skipping fetch.");
        return;
      }

      const formData = {
        date: selectedDate.format("YYYY-MM-DD"),
      };

      const result = await GetAllAttendance(formData);

      const dataWithIndex = result.data.data.map((item, index) => ({
        ...item,
        autoIncrementId: index + 1,
      }));
      setAttendanceData(dataWithIndex);
    } catch (e) {
      console.error("Failed to fetch attendance:", e);
    } finally {
      setLoading(false);
    }
  };

  // 🔹 Single source of truth for "what data do we need right now" —
  // previously this was two separate effects with duplicate bodies keyed
  // on different subsets of these same three values, which could double
  // fetch or race depending on which state changed.
  useEffect(() => {
    if (!isMonthlyView) {
      getData();
    } else {
      openMonthlyAttendance();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedDate, selectedMonth, isMonthlyView]);

  const handleMonthChange = (date) => {
    setSelectedMonth(date);
  };

  const handleDateChange = (date) => {
    if (date) {
      setSelectedDate(date);
    }
  };

  // 🔹 Fixed: this previously took a `date` param that was never passed in
  // and never used — it always read `selectedDate` from closure anyway.
  const fetchTodayStats = async () => {
    try {
      const formData = {
        date: selectedDate.format("YYYY-MM-DD"),
      };
      const result = await GetTodayAttendanceStats(formData);
      setStats(result.data.data.data);
    } catch (error) {
      console.error("Failed to fetch today's attendance stats:", error);
    }
  };

  useEffect(() => {
    fetchTodayStats();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedDate]);

  const [isManualModalOpen, setIsManualModalOpen] = useState(false);
  const [manualForm, setManualForm] = useState({
    user_id: "",
    user_name: "",
    date: "",
    clock_in: "",
    clock_out: "",
  });

  const toHHMM = (val) => {
    if (!val) return "";
    // already in "HH:mm"
    if (/^\d{2}:\d{2}$/.test(val)) return val;

    // looks like an ISO/datetime (has 'T' or 'Z' or timezone offset)
    if (
      val.includes("T") ||
      val.includes("Z") ||
      /[+-]\d{2}:\d{2}$/.test(val)
    ) {
      return dayjs.utc(val).format("HH:mm"); // take the time exactly as stored in the ISO (UTC)
    }

    // fallback: try parsing as local datetime
    return dayjs(val).isValid() ? dayjs(val).format("HH:mm") : "";
  };

  const openManualModal = (record) => {
    setManualForm({
      user_id: record.user_id,
      role_id: record.role_id,
      user_name: record.user_name,
      date: record.date,
      clock_in: toHHMM(record.clock_in),
      clock_out: toHHMM(record.clock_out),
    });
    setIsManualModalOpen(true);
  };

  const handleManualSubmit = async () => {
    try {
      const formData = new FormData();
      formData.append("employee_id", manualForm.user_id);
      formData.append("role_id", manualForm.role_id);
      formData.append("date", manualForm.date);
      formData.append("clock_in", manualForm.clock_in || "");
      formData.append("clock_out", manualForm.clock_out || "");

      const res = await ManualClockInOut(formData);

      if (res?.status === 200) {
        setIsManualModalOpen(false);
        getData(); // refresh table
      } else {
        console.error("API returned non-200 status:", res?.status);
      }
    } catch (err) {
      console.error("Failed to update clock-in/out:", err);
    }
  };

  const columns = [
    {
      title: "S.No.",
      dataIndex: "autoIncrementId",
      key: "sno",
      width: 70,
      sorter: (a, b) => a.autoIncrementId - b.autoIncrementId,
    },
    {
      title: "Employee Name",
      dataIndex: "user_name",
      key: "name",
      width: 160,
      sorter: (a, b) => a.user_name.localeCompare(b.user_name),
    },
    {
      title: "Employee Type",
      dataIndex: "role_id",
      width: "10%",
      key: "role_id",
      sorter: (a, b) => a.role_id - b.role_id,
      render: (role_id) => {
        const roleMap = {
          7: "Inspector/ Supervisor",
          8: "Quality Assurance Technician",
          9: "Cleaner",
        };
        return roleMap[role_id] || "Unknown";
      },
    },
    {
      title: "Date",
      dataIndex: "date",
      key: "date",
      width: "10%",
      render: (date) => dayjs(date).format("MM/DD/YYYY"),
    },
    {
      title: "Clock-In Location",
      key: "clock_in_location",
      render: (_, record) => {
        const lat = record?.clock_in_location?.lat;
        const lng = record?.clock_in_location?.lng;

        if (lat && lng) {
          return (
            <a
              href={`https://www.google.com/maps?q=${lat},${lng}`}
              target="_blank"
              rel="noopener noreferrer"
            >
              View on Map
            </a>
          );
        }
        return "---";
      },
    },
    {
      title: "Clock-Out Location",
      key: "clock_out_location",
      render: (_, record) => {
        const lat = record?.clock_out_location?.lat;
        const lng = record?.clock_out_location?.lng;

        if (lat && lng) {
          return (
            <a
              href={`https://www.google.com/maps?q=${lat},${lng}`}
              target="_blank"
              rel="noopener noreferrer"
            >
              View on Map
            </a>
          );
        }
        return "---";
      },
    },
    {
      title: "Status",
      dataIndex: "status",
      key: "status",
      sorter: (a, b) => a.status.localeCompare(b.status),
      render: (status) => {
        let displayStatus = status === "ABSENT" ? "--" : status;
        let color =
          status === "PRESENT"
            ? "green"
            : status === "LATE"
            ? "orange"
            : status === "ON LEAVE"
            ? "blue"
            : status === "APPLIED LEAVE"
            ? "orange"
            : status === "ABSENT"
            ? "red"
            : "black";

        return (
          <span style={{ color, fontWeight: "bold" }}>{displayStatus}</span>
        );
      },
    },
    {
      title: "Clock In",
      dataIndex: "clock_in",
      key: "clock_in",
      render: (clock_in) =>
        clock_in ? dayjs.utc(clock_in).format("hh:mm A") : "---",
    },
    {
      title: "Clock Out",
      dataIndex: "clock_out",
      key: "clock_out",
      render: (clock_out) =>
        clock_out ? dayjs.utc(clock_out).format("hh:mm A") : "---",
    },
    {
      title: "Clock-In Image",
      dataIndex: "clock_in_image_uri",
      key: "clock_in_image_uri",
      render: (uri) =>
        uri ? (
          <Image
            src={`${BASE_URL_IMAGE}${uri}`}
            alt="Clock-In"
            crossOrigin="anonymous"
            width={50}
            height={50}
            style={{
              objectFit: "cover",
              borderRadius: "8px",
              boxShadow: "0 0 6px rgba(0,0,0,0.1)",
            }}
          />
        ) : (
          <span>---</span>
        ),
    },
    {
      title: "Clock-Out Image",
      dataIndex: "clock_out_image_uri",
      key: "clock_out_image_uri",
      render: (uri) =>
        uri ? (
          <Image
            src={`${BASE_URL_IMAGE}${uri}`}
            alt="Clock-Out"
            crossOrigin="anonymous"
            width={50}
            height={50}
            style={{
              objectFit: "cover",
              borderRadius: "8px",
              boxShadow: "0 0 6px rgba(0,0,0,0.1)",
            }}
          />
        ) : (
          <span>---</span>
        ),
    },
    {
      title: "Total Hours",
      dataIndex: "total_hours",
      key: "total_hours",
      render: (total_hours, record) =>
        ["PRESENT", "LATE"].includes(record.status)
          ? total_hours || "0"
          : "---",
    },
    {
      title: "",
      key: "actions",
      render: (text, record) => (
        <Tooltip title="Manual Clock In/Out">
          <IconAction
            label="Manual clock in/out"
            onClick={() => openManualModal(record)}
          >
            <AiOutlinePlusCircle
              style={{ fontSize: "20px", color: "#1677ff" }}
            />
          </IconAction>
        </Tooltip>
      ),
    },
  ];

  return (
    <Box>
      <Paper
        variant="outlined"
        sx={{ p: 2.5, mb: 2.5, borderRadius: "10px", borderColor: "#eef0f2" }}
      >
        <Stack
          direction="row"
          spacing={2}
          sx={{
            justifyContent: "space-between",
            alignItems: "flex-start",
            flexWrap: "wrap",
          }}
        >
          <Box>
            <Typography className="page-title">
              ATTENDANCE MANAGEMENT
            </Typography>
            <Typography className="page-sub-title">
              {isMonthlyView
                ? "View Monthly Attendance"
                : "View Daily Attendance"}
            </Typography>
          </Box>

          {isMonthlyView ? (
            <Stack
              direction="row"
              spacing={1.5}
              sx={{ alignItems: "center", flexWrap: "wrap" }}
            >
              <DatePicker
                picker="month"
                format="MMMM YYYY"
                value={selectedMonth}
                onChange={handleMonthChange}
                allowClear
                style={{ width: 180 }}
              />
              <Button type="primary" onClick={() => setIsMonthlyView(false)}>
                View Daily Attendance
              </Button>
            </Stack>
          ) : (
            <Stack
              direction="row"
              spacing={1.5}
              sx={{ alignItems: "center", flexWrap: "wrap" }}
            >
              <DatePicker
                value={selectedDate}
                onChange={handleDateChange}
                placeholder="Select a date"
              />
              <Button type="primary" onClick={() => setIsMonthlyView(true)}>
                Monthly Summary View
              </Button>
              <Button
                type="default"
                onClick={() => navigate("/attendanceCalendar")}
              >
                Calendar View
              </Button>
            </Stack>
          )}
        </Stack>

        {!isMonthlyView && (
          <Box sx={{ mt: 2.5 }}>
            <Input
              allowClear
              prefix={<Search size={18} color="#9CA3AF" />}
              placeholder="Search by employee name..."
              style={{ width: "100%", maxWidth: 420, height: 44 }}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </Box>
        )}
      </Paper>

      {isMonthlyView ? (
        <div style={{ overflowX: "auto" }}>
          <Stack
            direction="row"
            spacing={3}
            sx={{
              flexWrap: "wrap",
              alignItems: "center",
              padding: "10px 0",
              borderBottom: "1px solid #ddd",
              marginBottom: "8px",
              minWidth: "1000px", // so legend aligns with table scroll
            }}
          >
            <Box sx={{ display: "flex", alignItems: "center", gap: "6px" }}>
              <FaRegCheckCircle style={{ color: "green", fontSize: "18px" }} />
              <span>Present</span>
            </Box>
            <Box sx={{ display: "flex", alignItems: "center", gap: "6px" }}>
              <TbBeach style={{ color: "#f39c12", fontSize: "18px" }} />
              <span>On Leave</span>
            </Box>
            <Box sx={{ display: "flex", alignItems: "center", gap: "6px" }}>
              <FaRegClock style={{ color: "#3498db", fontSize: "18px" }} />
              <span>Applied Leave</span>
            </Box>
            <Box sx={{ display: "flex", alignItems: "center", gap: "6px" }}>
              <span>--</span>
              <span>Absent</span>
            </Box>
          </Stack>

          <Table
            dataSource={monthlyData.map((emp) => {
              const row = {
                key: emp.user_id,
                employee: emp.user_name,
              };
              const currentMonth = selectedMonth || dayjs();
              const month = currentMonth.format("MM");
              const year = currentMonth.format("YYYY");

              for (let i = 1; i <= 31; i++) {
                const day = String(i).padStart(2, "0");
                const fullDate = `${year}-${month}-${day}`; // match API date format (YYYY-MM-DD)

                const statusEntry = emp.monthly_attendance?.find(
                  (a) => a.date === fullDate
                );

                let symbol = ""; // Default blank

                if (statusEntry) {
                  if (statusEntry.status === "PRESENT")
                    symbol = (
                      <IconAction
                        label={`View ${emp.user_name} attendance on ${fullDate}`}
                        onClick={() =>
                          openDetailsModal(emp.user_name, statusEntry)
                        }
                      >
                        <FaRegCheckCircle
                          style={{ color: "green", fontSize: "15px" }}
                        />
                      </IconAction>
                    );
                  else if (statusEntry.status === "ON LEAVE")
                    symbol = (
                      <TbBeach style={{ color: "#f39c12", fontSize: "15px" }} />
                    );
                  else if (statusEntry.status === "ABSENT")
                    symbol = "--"; // keep "--" for absent
                  else if (statusEntry.status === "APPLIED LEAVE")
                    symbol = (
                      <FaRegClock
                        style={{ color: "#3498db", fontSize: "15px" }}
                      />
                    );
                }
                row[`day${i}`] = symbol;
              }

              return row;
            })}
            columns={[
              {
                title: "Employee",
                dataIndex: "employee",
                key: "employee",
                fixed: "left",
                width: 150,
              },
              ...Array.from({ length: 31 }, (_, i) => ({
                title: `${i + 1}`,
                dataIndex: `day${i + 1}`,
                key: `day${i + 1}`,
                width: 50,
                align: "center",
              })),
            ]}
            scroll={{ x: 2000 }}
            pagination={false}
            bordered
          />
        </div>
      ) : (
        <>
          <Stack
            direction="row"
            spacing={1.5}
            sx={{ flexWrap: "wrap", mb: 2.5 }}
          >
            <StatCard label="Total Staff" value={stats?.total_employees} />
            <StatCard label="Marked Present" value={stats?.present} />
            <StatCard label="Marked Absent" value={stats?.absent} />
            <StatCard label="On Approved Leave" value={stats?.on_leave} />
          </Stack>

          <Table
            columns={columns}
            dataSource={attendanceData.filter((item) =>
              item.user_name?.toLowerCase().includes(searchTerm.toLowerCase())
            )}
            loading={loading}
            pagination={{ pageSize: 100 }}
            rowKey="autoIncrementId"
            bordered
            size="middle"
            scroll={{ x: "max-content" }}
          />
        </>
      )}

      <Modal
        title={`${selectedEmployee} - Attendance Details`}
        open={isDetailModalOpen}
        onCancel={() => setIsDetailModalOpen(false)}
        footer={null}
      >
        {selectedEntry && (
          <div style={{ fontSize: "15px", lineHeight: "2" }}>
            <p>
              <strong>Date:</strong>{" "}
              {dayjs(selectedEntry.date).format("dddd, DD MMMM, YYYY")}
            </p>
            <p>
              <strong>Clock In:</strong>{" "}
              {formatTimeOnly(selectedEntry.clock_in)}
            </p>
            <p>
              <strong>Clock Out:</strong>{" "}
              {formatTimeOnly(selectedEntry.clock_out)}
            </p>
            <p>
              <strong>Total Hours:</strong>{" "}
              {selectedEntry.total_hours || "Not Available"}
            </p>
          </div>
        )}
      </Modal>

      <Modal
        title="Manual Clock In/Out"
        open={isManualModalOpen}
        onCancel={() => setIsManualModalOpen(false)}
        onOk={handleManualSubmit}
      >
        <p>
          <strong>User:</strong> {manualForm.user_name || "N/A"}
        </p>

        <p>
          <strong>Date:</strong>{" "}
          {manualForm.date
            ? dayjs(manualForm.date).format("YYYY-MM-DD")
            : "N/A"}
        </p>

        <div style={{ marginTop: "10px" }}>
          <label>Clock In:</label>
          <TimePicker
            use12Hours
            format="hh:mm A"
            value={
              manualForm.clock_in ? dayjs(manualForm.clock_in, "HH:mm") : null
            }
            onChange={(time) =>
              setManualForm({
                ...manualForm,
                clock_in: time ? time.format("HH:mm") : "",
              })
            }
            style={{ width: "100%", marginBottom: "10px" }}
          />
        </div>

        <div>
          <label>Clock Out:</label>
          <TimePicker
            use12Hours
            format="hh:mm A"
            value={
              manualForm.clock_out ? dayjs(manualForm.clock_out, "HH:mm") : null
            }
            onChange={(time) =>
              setManualForm({
                ...manualForm,
                clock_out: time ? time.format("HH:mm") : "",
              })
            }
            style={{ width: "100%" }}
          />
        </div>
      </Modal>
    </Box>
  );
};

export default AllAttendance;
