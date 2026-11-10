import dayjs from "@/lib/dayjs";
import { useState } from "react";
import { correctAttendance, getAttendanceStats, listAttendance } from "@/services/api/attendanceApi";
import { useApiQuery } from "@/hooks/useApiQuery";
import { dataOf, errorMessage, itemsOf } from "@/services/apiResult";
import { imageUrl } from "@/utils/files";
import {
  Table,
  DatePicker,
  Button,
  Modal,
  Image,
  TimePicker,
  Input,
  message,
} from "antd";
import "./attendance.scss";
import { useNavigate } from "react-router";
import {
  CircleCheck,
  CirclePlus,
  Clock,
  Search,
  TreePalm,
} from "lucide-react";
import PageHeader from "@/components/PageHeader";
import IconAction from "@/components/IconAction";
import { formatDate, formatWallTime, formatWeekdayDate } from "@/utils/datetime";

// 🔹 Small responsive stat card used in the daily-view summary strip
const StatCard = ({ label, value }) => (
  <div className="attendance__stat">
    <span className="attendance__stat-label">{label}</span>
    <span className="attendance__stat-value">{value ?? "--"}</span>
  </div>
);

const AttendancePage = () => {
  const navigate = useNavigate();
  const [selectedDate, setSelectedDate] = useState(dayjs());
  const [isMonthlyView, setIsMonthlyView] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedMonth, setSelectedMonth] = useState(dayjs()); // default to current month
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [selectedEntry, setSelectedEntry] = useState(null);
  const [selectedEmployee, setSelectedEmployee] = useState("");

  const day = selectedDate.format("YYYY-MM-DD");
  const monthToUse = selectedMonth || dayjs();

  // The day's rows (numbered), or the month's, and the day's numbers.
  const {
    data: attendanceData,
    loading,
    reload: reloadDay,
  } = useApiQuery(
    () =>
      listAttendance({ date: day })
        .then(itemsOf)
        .then((rows) => rows.map((item, index) => ({ ...item, autoIncrementId: index + 1 }))),
    [day],
    { initial: [], skip: isMonthlyView, errorText: "Couldn't load the attendance" },
  );
  const { data: monthlyData } = useApiQuery(
    () => listAttendance({ month: monthToUse.month() + 1, year: monthToUse.year() }).then(itemsOf),
    [monthToUse.month(), monthToUse.year()],
    { initial: [], skip: !isMonthlyView, errorText: "Couldn't load the month's attendance" },
  );
  const { data: stats } = useApiQuery(() => getAttendanceStats(day).then(dataOf), [day], {
    errorText: "Couldn't load the day's numbers",
  });

  const openDetailsModal = (employeeName, entry) => {
    setSelectedEmployee(employeeName);
    setSelectedEntry(entry);
    setIsDetailModalOpen(true);
  };

  const formatTimeOnly = (datetimeStr) => formatWallTime(datetimeStr, "---");

  const handleMonthChange = (date) => {
    setSelectedMonth(date);
  };

  const handleDateChange = (date) => {
    if (date) {
      setSelectedDate(date);
    }
  };

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
      user_name: record.user_name,
      date: record.date,
      clock_in: toHHMM(record.clock_in),
      clock_out: toHHMM(record.clock_out),
    });
    setIsManualModalOpen(true);
  };

  const handleManualSubmit = async () => {
    try {
      await correctAttendance({
        employee_id: manualForm.user_id,
        date: manualForm.date,
        clock_in: manualForm.clock_in || "",
        clock_out: manualForm.clock_out || "",
      });
      message.success("Clock in and out saved");
      setIsManualModalOpen(false);
      reloadDay();
    } catch (err) {
      message.error(errorMessage(err, "Couldn't save the clock in and out"));
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
      width: 150,
      sorter: (a, b) => a.user_name.localeCompare(b.user_name),
    },
    {
      title: "Employee Type",
      dataIndex: "job_title",
      width: 140,
      key: "job_title",
      sorter: (a, b) => (a.job_title || "").localeCompare(b.job_title || ""),
      render: (title, record) => title || (record.roles || []).map((role) => role.name).join(", ") || "—",
    },
    {
      title: "Date",
      dataIndex: "date",
      key: "date",
      width: "10%",
      render: (date) => formatDate(date),
    },
    {
      title: "Clock-In Location",
      key: "clock_in_location",
      width: 100,
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
      width: 100,
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
      width: 80,
      key: "status",
      sorter: (a, b) => a.status.localeCompare(b.status),
      render: (status) => {
        let displayStatus = status === "ABSENT" ? "--" : status;
        let color =
          status === "PRESENT"
            ? "var(--color-success-strong)"
            : status === "LATE"
              ? "var(--color-warning-strong)"
              : status === "ON LEAVE"
                ? "var(--color-info)"
                : status === "APPLIED LEAVE"
                  ? "var(--color-warning-strong)"
                  : status === "ABSENT"
                    ? "var(--color-error)"
                    : "var(--color-text)";

        return (
          <span className="attendance__status" style={{ color }}>
            {displayStatus}
          </span>
        );
      },
    },
    {
      title: "Clock In",
      dataIndex: "clock_in",
      width: 80,
      key: "clock_in",
      render: (clock_in) =>
        formatWallTime(clock_in, "---"),
    },
    {
      title: "Clock Out",
      dataIndex: "clock_out",
      width: 80,
      key: "clock_out",
      render: (clock_out) =>
        formatWallTime(clock_out, "---"),
    },
    {
      title: "Clock-In Image",
      dataIndex: "clock_in_image_uri",
      width: 80,
      key: "clock_in_image_uri",
      render: (uri) =>
        uri ? (
          <Image
            src={imageUrl(uri)}
            alt="Clock-In"
            crossOrigin="anonymous"
            width={50}
            height={50}
            className="attendance__thumb"
          />
        ) : (
          <span>---</span>
        ),
    },
    {
      title: "Clock-Out Image",
      dataIndex: "clock_out_image_uri",
      width: 80,
      key: "clock_out_image_uri",
      render: (uri) =>
        uri ? (
          <Image
            src={imageUrl(uri)}
            alt="Clock-Out"
            crossOrigin="anonymous"
            width={50}
            height={50}
            className="attendance__thumb"
          />
        ) : (
          <span>---</span>
        ),
    },
    {
      title: "Total Hours",
      dataIndex: "total_hours",
      width: 80,
      key: "total_hours",
      render: (total_hours, record) =>
        ["PRESENT", "LATE"].includes(record.status)
          ? total_hours || "0"
          : "---",
    },
    {
      title: "",
      key: "actions",
      width: 80,
      render: (text, record) => (
        <IconAction
          icon={CirclePlus}
          title="Manual Clock In/Out"
          onClick={() => openManualModal(record)}
        />
      ),
    },
  ];

  return (
    <div>
      <PageHeader
        className="attendance-header"
        title="ATTENDANCE MANAGEMENT"
        subtitle={
          isMonthlyView ? "View Monthly Attendance" : "View Daily Attendance"
        }
        actions={
          isMonthlyView ? (
            <>
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
            </>
          ) : (
            <div className="attendance__controls">
              {/* Top Row */}
              <div className="attendance__toolbar">
                <DatePicker
                  value={selectedDate}
                  onChange={handleDateChange}
                  placeholder="Select a date"
                  style={{ width: 140 }}
                />

                <Button type="primary" onClick={() => setIsMonthlyView(true)}>
                  Monthly Summary View
                </Button>

                <Button
                  type="primary"
                  onClick={() => navigate("/attendanceCalendar")}
                >
                  Calendar View
                </Button>
              </div>

              {/* Search */}
              <Input
                allowClear
                size="large"
                prefix={<Search size={16} color="var(--color-text-subtle)" />}
                placeholder="Search by employee name..."
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          )
        }
      />

      {isMonthlyView ? (
        <div className="attendance__monthly">
          <div className="attendance__legend">
            <div className="attendance__legend-item">
              <CircleCheck size={18} color="var(--color-success-strong)" />
              <span>Present</span>
            </div>
            <div className="attendance__legend-item">
              <TreePalm size={18} color="var(--color-warning-strong)" />
              <span>On Leave</span>
            </div>
            <div className="attendance__legend-item">
              <Clock size={18} color="var(--color-primary-strong)" />
              <span>Applied Leave</span>
            </div>
            <div className="attendance__legend-item">
              <span>--</span>
              <span>Absent</span>
            </div>
          </div>

          <Table
            dataSource={monthlyData.map((emp) => {
              const row = {
                key: emp.user_id ?? emp.user_name,
                employee: emp.user_name,
              };
              const currentMonth = selectedMonth || dayjs();
              const month = currentMonth.format("MM");
              const year = currentMonth.format("YYYY");

              for (let i = 1; i <= 31; i++) {
                const day = String(i).padStart(2, "0");
                const fullDate = `${year}-${month}-${day}`; // match API date format (YYYY-MM-DD)

                const statusEntry = emp.monthly_attendance?.find(
                  (a) => a.date === fullDate,
                );

                let symbol = ""; // Default blank

                if (statusEntry) {
                  if (statusEntry.status === "PRESENT")
                    symbol = (
                      <Button
                        type="text"
                        size="small"
                        aria-label={`View ${emp.user_name} attendance on ${fullDate}`}
                        icon={
                          <CircleCheck
                            size={15}
                            color="var(--color-success-strong)"
                          />
                        }
                        onClick={() =>
                          openDetailsModal(emp.user_name, statusEntry)
                        }
                      />
                    );
                  else if (statusEntry.status === "ON LEAVE")
                    symbol = (
                      <TreePalm size={15} color="var(--color-warning-strong)" />
                    );
                  else if (statusEntry.status === "ABSENT")
                    symbol = "--"; // keep "--" for absent
                  else if (statusEntry.status === "APPLIED LEAVE")
                    symbol = (
                      <Clock size={15} color="var(--color-primary-strong)" />
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
          <div className="attendance__stats">
            <StatCard label="Total Staff" value={stats?.total_employees} />
            <StatCard label="Marked Present" value={stats?.present} />
            <StatCard label="Marked Absent" value={stats?.absent} />
            <StatCard label="On Approved Leave" value={stats?.on_leave} />
          </div>

          <Table
            columns={columns}
            dataSource={attendanceData.filter((item) =>
              item.user_name?.toLowerCase().includes(searchTerm.toLowerCase()),
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
          <div className="attendance__details">
            <p>
              <strong>Date:</strong>{" "}
              {formatWeekdayDate(selectedEntry.date)}
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
          <label className="field-label">Clock In:</label>
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
          <label className="field-label">Clock Out:</label>
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
    </div>
  );
};

export default AttendancePage;
