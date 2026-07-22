/** @format */
import dayjs from "@/lib/dayjs";
import React, { useEffect, useState } from "react";
import utc from "dayjs/plugin/utc";
import timezone from "dayjs/plugin/timezone";
import { Divider, Select } from "antd";
import { UpdateEmployeeType } from "../../services/Api/Api";
import {
  DatePicker,
  Input,
  Button,
  Spin,
  message,
  Badge,
  Typography,
} from "antd";
import {
  ClockCircleOutlined,
  SaveOutlined,
  CalendarOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
} from "@ant-design/icons";
import { DownloadOutlined } from "@ant-design/icons";
import ExcelJS from "exceljs";
import { saveAs } from "file-saver";
import {
  getEmployeeDayOverview,
  getEmployeeRangeOverview,
  updateEmployeeTimesheet,
} from "../../services/Api/TimesheetApi";

dayjs.extend(utc);
dayjs.extend(timezone);

const { Title, Text } = Typography;

const EmployeeTimesheet = () => {
  const [selectedDate, setSelectedDate] = useState(
    dayjs().tz("America/New_York"),
  );
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(false);
  const [savingId, setSavingId] = useState(null);

  const [rangeStart, setRangeStart] = useState(null);
  const [rangeEnd, setRangeEnd] = useState(null);
  const [employeeTypeFilter, setEmployeeTypeFilter] = useState(null);
  const [downloading, setDownloading] = useState(false);

  const getESTDateString = (d) =>
    dayjs(d).tz("America/New_York").format("YYYY-MM-DD");

  const formatTime = (time) => {
    if (!time) return "";

    return dayjs(time, "HH:mm").format("h:mm A");
  };

  /* ---------------- FETCH ---------------- */
  const fetchData = async (dateObj) => {
    setLoading(true);
    try {
      const res = await getEmployeeDayOverview({
        date: getESTDateString(dateObj),
      });
      setEmployees(res.data.data.employees || []);
    } catch (err) {
      message.error("Failed to load data");
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchData(selectedDate);
  }, []);

  /* ---------------- HANDLE CHANGE ---------------- */
  const updateLocalValue = (empId, field, value) => {
    setEmployees((prev) =>
      prev.map((e) => {
        if (e.employee_id !== empId) return e;

        const updated = { ...e, [field]: value };

        // ✅ AUTO CALCULATE TOTAL
        const pay = Number(updated.pay_per_day || 0);
        const bonus = Number(updated.bonus || 0);

        updated.total_amount = pay + bonus;

        return updated;
      }),
    );
  };

  /* ---------------- SAVE ---------------- */
  const onSave = async (emp) => {
    setSavingId(emp.employee_id);
    try {
      await updateEmployeeTimesheet({
        employee_id: emp.employee_id,
        role_id: emp.role_id,
        date: getESTDateString(selectedDate),
        clock_in: emp.clock_in,
        clock_out: emp.clock_out,
        pay_per_day: Number(emp.pay_per_day || 0),
        bonus: Number(emp.bonus || 0),
        total_amount: Number(emp.total_amount || 0),
      });

      message.success("Timesheet updated successfully!");

      // ✅ IMPORTANT: REFRESH DATA
      await fetchData(selectedDate);
    } catch (err) {
      message.error("Failed to save timesheet");
    }
    setSavingId(null);
  };

  const updateEmployeeType = async (empId, type) => {
    try {
      await UpdateEmployeeType(
        {
          user_id: empId,
          employee_type: type,
        },
        localStorage.getItem("adminToken"),
      );

      message.success("Employee type updated");

      setEmployees((prev) =>
        prev.map((e) =>
          e.employee_id === empId ? { ...e, employee_type: type } : e,
        ),
      );
    } catch (error) {
      message.error("Failed to update employee type");
    }
  };

  const handleDownload = async () => {
    if (!employees || employees.length === 0) {
      message.warning("No data available to export.");
      return;
    }

    const formattedDate = getESTDateString(selectedDate);

    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet("Timesheet");

    // Columns
    worksheet.columns = [
      { header: "Employee Name", key: "name", width: 25 },
      { header: "Employee Type", key: "employee_type", width: 25 },
      { header: "Booking Status", key: "booking", width: 18 },
      { header: "Clock In", key: "clock_in", width: 15 },
      { header: "Clock Out", key: "clock_out", width: 15 },
      { header: "Total Hours", key: "hours", width: 18 },
      { header: "Pay / Day ($)", key: "pay", width: 15 },
      { header: "Bonus ($)", key: "bonus", width: 15 },
      { header: "Total ($)", key: "total", width: 15 },
    ];

    // Add rows
    employees.forEach((emp) => {
      worksheet.addRow({
        name: emp.name,
        employee_type: emp.employee_type,
        booking: emp.booking_id ? "Assigned" : "Not Assigned",
        clock_in: formatTime(emp.clock_in),
        clock_out: formatTime(emp.clock_out),
        hours: emp.total_hours || "",
        pay: emp.pay_per_day || 0,
        bonus: emp.bonus || 0,
        total: emp.total_amount || 0,
      });
    });

    // ===== HEADER STYLE =====
    worksheet.getRow(1).eachCell((cell) => {
      cell.font = { bold: true, color: { argb: "FFFFFFFF" } };
      cell.fill = {
        type: "pattern",
        pattern: "solid",
        fgColor: { argb: "FF667EEA" }, // Purple/Blue
      };
      cell.alignment = { vertical: "middle", horizontal: "center" };
      cell.border = {
        top: { style: "thin" },
        left: { style: "thin" },
        bottom: { style: "thin" },
        right: { style: "thin" },
      };
    });

    // ===== ROW STYLING =====
    worksheet.eachRow((row, rowNumber) => {
      if (rowNumber === 1) return;

      row.eachCell((cell) => {
        cell.border = {
          top: { style: "thin" },
          left: { style: "thin" },
          bottom: { style: "thin" },
          right: { style: "thin" },
        };
        cell.alignment = { vertical: "middle", horizontal: "center" };
      });

      // Alternate row background
      if (rowNumber % 2 === 0) {
        row.eachCell((cell) => {
          cell.fill = {
            type: "pattern",
            pattern: "solid",
            fgColor: { argb: "FFF3F4F6" }, // light grey
          };
        });
      }
    });

    // Highlight Total column
    worksheet.getColumn("total").eachCell((cell, rowNumber) => {
      if (rowNumber === 1) return;
      cell.font = { bold: true };
      cell.fill = {
        type: "pattern",
        pattern: "solid",
        fgColor: { argb: "FFDCFCE7" }, // light green
      };
    });

    // Generate file
    const buffer = await workbook.xlsx.writeBuffer();
    const blob = new Blob([buffer], {
      type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    });

    saveAs(blob, `Employee_Timesheet_${formattedDate}.xlsx`);
  };

  const handleRangeDownload = async () => {
    if (!rangeStart || !rangeEnd) {
      message.warning("Please select date range");
      return;
    }

    try {
      setDownloading(true);

      const res = await getEmployeeRangeOverview({
        start_date: dayjs(rangeStart).format("YYYY-MM-DD"),
        end_date: dayjs(rangeEnd).format("YYYY-MM-DD"),
        employee_type: employeeTypeFilter || undefined,
      });

      const rows = res.data.data.rows;

      if (!rows.length) {
        message.warning("No data found");
        return;
      }

      const workbook = new ExcelJS.Workbook();
      const worksheet = workbook.addWorksheet("Timesheet");

      // ✅ GROUP BY EMPLOYEE
      const grouped = {};
      rows.forEach((row) => {
        if (!grouped[row.employee_id]) {
          grouped[row.employee_id] = {
            name: row.name,
            type: row.employee_type,
            records: [],
          };
        }
        grouped[row.employee_id].records.push(row);
      });

      // ✅ LOOP EMPLOYEE WISE
      Object.values(grouped).forEach((emp) => {
        // spacing
        worksheet.addRow([]);

        // 👤 Employee Header
        const empHeader = worksheet.addRow([`${emp.name} (${emp.type})`]);
        empHeader.font = { bold: true, size: 14 };

        // Column Headers
        const headerRow = worksheet.addRow([
          "Date",
          "Booking",
          "Clock In",
          "Clock Out",
          "Hours",
          "Pay ($)",
          "Bonus ($)",
          "Total ($)",
        ]);

        // 🎨 Header Style
        headerRow.eachCell((cell) => {
          cell.font = { bold: true, color: { argb: "FFFFFFFF" } };
          cell.fill = {
            type: "pattern",
            pattern: "solid",
            fgColor: { argb: "FF667EEA" },
          };
          cell.alignment = { horizontal: "center" };
          cell.border = {
            top: { style: "thin" },
            left: { style: "thin" },
            bottom: { style: "thin" },
            right: { style: "thin" },
          };
        });

        let totalSum = 0;

        // 📅 Employee Records
        emp.records.forEach((r, index) => {
          totalSum += Number(r.total_amount || 0);

          const row = worksheet.addRow([
            r.date,
            r.booking_id ? "Assigned" : "Not Assigned",
           formatTime(r.clock_in),
formatTime(r.clock_out),
            r.total_hours || "",
            r.pay_per_day || 0,
            r.bonus || 0,
            r.total_amount || 0,
          ]);

          // borders + alignment
          row.eachCell((cell) => {
            cell.border = {
              top: { style: "thin" },
              left: { style: "thin" },
              bottom: { style: "thin" },
              right: { style: "thin" },
            };
            cell.alignment = { horizontal: "center" };
          });

          // alternate row color
          if (index % 2 === 0) {
            row.eachCell((cell) => {
              cell.fill = {
                type: "pattern",
                pattern: "solid",
                fgColor: { argb: "FFF9FAFB" },
              };
            });
          }
        });

        // 💰 Total Row
        const totalRow = worksheet.addRow([
          "",
          "",
          "",
          "",
          "",
          "",
          "Total:",
          totalSum,
        ]);

        totalRow.font = { bold: true };

        totalRow.eachCell((cell) => {
          cell.border = {
            top: { style: "thin" },
            left: { style: "thin" },
            bottom: { style: "thin" },
            right: { style: "thin" },
          };
          cell.alignment = { horizontal: "center" };
        });
      });

      // ✅ AUTO WIDTH (important for readability)
      worksheet.columns.forEach((col) => {
        col.width = 18;
      });

      const buffer = await workbook.xlsx.writeBuffer();
      const blob = new Blob([buffer]);

      saveAs(
        blob,
        `Timesheet_${dayjs(rangeStart).format("YYYY-MM-DD")}_to_${dayjs(rangeEnd).format("YYYY-MM-DD")}.xlsx`,
      );
    } catch (err) {
      console.error(err);
      message.error("Failed to download report");
    }

    setDownloading(false);
  };

  return (
    <div
      style={{
        // padding: "32px",
        background: "linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%)",
        minHeight: "100vh",
      }}
    >
      <div style={{ maxWidth: "1600px", margin: "0 auto" }}>
        {/* Header Section */}
        <div
          style={{
            background: "#fff",
            borderRadius: "12px",
            marginBottom: "24px",
            border: "0.5px solid #e5e7eb",
            overflow: "hidden",
          }}
        >
          {/* Top row: title + single-date download */}
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              padding: "18px 24px",
              borderBottom: "0.5px solid #e5e7eb",
              flexWrap: "wrap",
              gap: "12px",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
              <div
                style={{
                  width: 36,
                  height: 36,
                  borderRadius: 8,
                  background: "#ede9fe",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <ClockCircleOutlined
                  style={{ color: "#4f46e5", fontSize: 18 }}
                />
              </div>
              <div>
                <Title level={4} style={{ margin: 0, fontWeight: 500 }}>
                  Employee Timesheet
                </Title>
                <Text type="secondary" style={{ fontSize: 13 }}>
                  Manage daily attendance and compensation
                </Text>
              </div>
            </div>

            <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
              <Text type="secondary" style={{ fontSize: 13 }}>
                Single date:
              </Text>
              <DatePicker
                value={selectedDate}
                onChange={(d) => {
                  setSelectedDate(d);
                  fetchData(d);
                }}
                size="middle"
                style={{ borderRadius: 6 }}
              />
              <Button
                icon={<DownloadOutlined />}
                onClick={handleDownload}
                style={{
                  background: "#16a34a",
                  color: "#fff",
                  border: "none",
                  borderRadius: 6,
                  fontWeight: 500,
                }}
              >
                Download Excel
              </Button>
            </div>
          </div>

          {/* Bottom row: range export */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "10px",
              padding: "12px 24px",
              background: "#f9fafb",
              flexWrap: "wrap",
            }}
          >
            <Text
              style={{
                fontSize: 12,
                fontWeight: 500,
                color: "#6b7280",
                textTransform: "uppercase",
                letterSpacing: "0.04em",
              }}
            >
              Range export
            </Text>
            <Divider type="vertical" style={{ height: 22 }} />
            <Select
              placeholder="Employee Type"
              style={{ width: 160 }}
              onChange={(val) => {
                setEmployeeTypeFilter(val);
                if (rangeStart) {
                  setRangeEnd(
                    val === "W2_BI_WEEKLY"
                      ? dayjs(rangeStart).add(13, "day")
                      : dayjs(rangeStart).add(14, "day"),
                  );
                }
              }}
              options={[
                { value: "W2_BI_WEEKLY", label: "W2 Bi-Weekly" },
                { value: "1099", label: "1099 Contractor" },
              ]}
            />
            <DatePicker
              placeholder="Start date"
              value={rangeStart}
              onChange={(d) => setRangeStart(d)}
              style={{ borderRadius: 6 }}
            />
            <span style={{ color: "#9ca3af" }}>→</span>
            <DatePicker
              placeholder="End date"
              value={rangeEnd}
              onChange={(d) => setRangeEnd(d)}
              style={{ borderRadius: 6 }}
            />
            <Button
              icon={<DownloadOutlined />}
              loading={downloading}
              disabled={!rangeStart || !rangeEnd}
              onClick={handleRangeDownload}
              style={{
                background: "#0ea5e9",
                color: "#fff",
                border: "none",
                borderRadius: 6,
                fontWeight: 500,
              }}
            >
              Download Range Excel
            </Button>
          </div>
        </div>

        {/* Table Section */}
        {loading ? (
          <div
            style={{
              textAlign: "center",
              padding: "80px 20px",
              background: "#fff",
              borderRadius: "16px",
              boxShadow: "0 2px 8px rgba(0, 0, 0, 0.08)",
            }}
          >
            <Spin size="large" />
            <div style={{ marginTop: 16, color: "#666" }}>
              Loading timesheet data...
            </div>
          </div>
        ) : (
          <div
            style={{
              background: "#fff",
              borderRadius: "16px",
              boxShadow: "0 2px 8px rgba(0, 0, 0, 0.08)",
              overflow: "hidden",
            }}
          >
            <div style={{ overflowX: "auto" }}>
              <table
                style={{
                  width: "100%",
                  borderCollapse: "separate",
                  borderSpacing: 0,
                  fontSize: "14px",
                }}
              >
                <thead>
                  <tr
                    style={{
                      background:
                        "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
                    }}
                  >
                    <th style={tableHeaderStyle}>
                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: "8px",
                        }}
                      >
                        Employee Name
                      </div>
                    </th>
                    <th style={tableHeaderStyle}>Employee Type</th>
                    <th style={tableHeaderStyle}>Booking Status</th>
                    <th style={tableHeaderStyle}>
                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: "6px",
                        }}
                      >
                        <ClockCircleOutlined />
                        Clock In
                      </div>
                    </th>
                    <th style={tableHeaderStyle}>
                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: "6px",
                        }}
                      >
                        <ClockCircleOutlined />
                        Clock Out
                      </div>
                    </th>
                    <th style={tableHeaderStyle}>Total Hours</th>
                    <th style={tableHeaderStyle}>Pay / Day ($)</th>
                    <th style={tableHeaderStyle}>Bonus ($)</th>
                    <th style={tableHeaderStyle}>Total ($)</th>
                    <th style={tableHeaderStyle}>Action</th>
                  </tr>
                </thead>

                <tbody>
                  {employees.length === 0 ? (
                    <tr>
                      <td
                        colSpan="9"
                        style={{
                          textAlign: "center",
                          padding: "60px 20px",
                          color: "#999",
                        }}
                      >
                        No employees found for this date
                      </td>
                    </tr>
                  ) : (
                    employees.map((emp, index) => (
                      <tr
                        key={emp.employee_id}
                        style={{
                          background: index % 2 === 0 ? "#fafbfc" : "#fff",
                          transition: "all 0.2s ease",
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.background = "#f0f4ff";
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.background =
                            index % 2 === 0 ? "#fafbfc" : "#fff";
                        }}
                      >
                        <td style={tableCellStyle}>
                          <div
                            style={{
                              display: "flex",
                              alignItems: "center",
                              gap: "10px",
                            }}
                          >
                            <div
                              style={{
                                width: "36px",
                                height: "36px",
                                borderRadius: "50%",
                                background:
                                  "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                color: "#fff",
                                fontSize: "14px",
                                fontWeight: 600,
                                flexShrink: 0,
                              }}
                            >
                              {emp.name?.charAt(0)?.toUpperCase() || "E"}
                            </div>
                            <span style={{ fontWeight: 600, color: "#1a1a1a" }}>
                              {emp.name}
                            </span>
                          </div>
                        </td>

                        <td style={tableCellStyle}>
                          <Select
                            value={emp.employee_type}
                            style={{ width: 150 }}
                            onChange={(value) =>
                              updateEmployeeType(emp.employee_id, value)
                            }
                            options={[
                              { value: "W2_BI_WEEKLY", label: "W2 Bi-Weekly" },
                              { value: "1099", label: "1099 Contractor" },
                            ]}
                          />
                        </td>

                        <td style={tableCellStyle}>
                          {emp.booking_id ? (
                            <Badge
                              status="success"
                              text="Assigned"
                              style={{ fontWeight: 500 }}
                            />
                          ) : (
                            <Badge status="default" text="Not Assigned" />
                          )}
                        </td>

                        <td style={tableCellStyle}>
                          <div>
                            <Input
                              value={emp.clock_in || ""}
                              placeholder="16:00"
                              onChange={(e) =>
                                updateLocalValue(
                                  emp.employee_id,
                                  "clock_in",
                                  e.target.value,
                                )
                              }
                              style={inputStyle}
                            />

                            <div
                              style={{
                                fontSize: 12,
                                color: "#666",
                                marginTop: 4,
                              }}
                            >
                              {emp.clock_in ? formatTime(emp.clock_in) : ""}
                            </div>
                          </div>
                        </td>

                        <td style={tableCellStyle}>
                          <div>
                            <Input
                              value={emp.clock_out || ""}
                              placeholder="16:00"
                              onChange={(e) =>
                                updateLocalValue(
                                  emp.employee_id,
                                  "clock_out",
                                  e.target.value,
                                )
                              }
                              style={inputStyle}
                            />

                            <div
                              style={{
                                fontSize: 12,
                                color: "#666",
                                marginTop: 4,
                              }}
                            >
                              {emp.clock_out ? formatTime(emp.clock_out) : ""}
                            </div>
                          </div>
                        </td>

                        <td style={tableCellStyle}>
                          <span
                            style={{
                              fontWeight: 600,
                              color: emp.total_hours ? "#4f46e5" : "#999",
                            }}
                          >
                            {emp.total_hours || "-"}
                          </span>
                        </td>

                        <td style={tableCellStyle}>
                          <Input
                            type="number"
                            prefix="$"
                            value={emp.pay_per_day || ""}
                            onChange={(e) =>
                              updateLocalValue(
                                emp.employee_id,
                                "pay_per_day",
                                e.target.value,
                              )
                            }
                            style={inputStyle}
                          />
                        </td>

                        <td style={tableCellStyle}>
                          <Input
                            type="number"
                            prefix="$"
                            value={emp.bonus || ""}
                            onChange={(e) =>
                              updateLocalValue(
                                emp.employee_id,
                                "bonus",
                                e.target.value,
                              )
                            }
                            style={inputStyle}
                          />
                        </td>

                        <td style={tableCellStyle}>
                          <Input
                            type="number"
                            prefix="$"
                            disabled
                            value={emp.total_amount || ""}
                            onChange={(e) =>
                              updateLocalValue(
                                emp.employee_id,
                                "total_amount",
                                e.target.value,
                              )
                            }
                            style={{
                              ...inputStyle,
                              fontWeight: 600,
                              background: "#f0fdf4",
                            }}
                          />
                        </td>

                        <td style={tableCellStyle}>
                          <Button
                            type="primary"
                            icon={<SaveOutlined />}
                            loading={savingId === emp.employee_id}
                            onClick={() => onSave(emp)}
                            style={{
                              borderRadius: "8px",
                              fontWeight: 600,
                              background:
                                "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
                              border: "none",
                              boxShadow: "0 2px 6px rgba(102, 126, 234, 0.3)",
                            }}
                          >
                            Save
                          </Button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

// Styles
const tableHeaderStyle = {
  padding: "16px 20px",
  textAlign: "left",
  fontWeight: 700,
  fontSize: "13px",
  color: "#fff",
  textTransform: "uppercase",
  letterSpacing: "0.5px",
  borderBottom: "2px solid rgba(255, 255, 255, 0.2)",
};

const tableCellStyle = {
  padding: "16px 20px",
  borderBottom: "1px solid #e5e7eb",
  verticalAlign: "middle",
};

const inputStyle = {
  borderRadius: "6px",
  border: "1px solid #e5e7eb",
  minWidth: "100px",
};

export default EmployeeTimesheet;
