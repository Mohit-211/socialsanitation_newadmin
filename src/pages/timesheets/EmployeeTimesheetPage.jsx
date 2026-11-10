import dayjs from "@/lib/dayjs";
import { useEffect, useState } from "react";
import { Divider, Select } from "antd";
import { setEmployeeType } from "@/services/api/employeeApi";
import { DatePicker, Input, Button, Spin, message, Badge } from "antd";
import { Clock, Download, Save } from "lucide-react";
import PageHeader from "@/components/PageHeader";
import { excelStyles, saveXlsx } from "@/utils/excel";
import { correctTimesheet, getTimesheetDay, getTimesheetRange } from "@/services/api/timesheetApi";
import { dataOf, errorMessage } from "@/services/apiResult";
import "./EmployeeTimesheetPage.scss";

const EmployeeTimesheetPage = () => {
  const [selectedDate, setSelectedDate] = useState(
    dayjs().tz("America/New_York"),
  );
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
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

  /* FETCH */
  // The day's rows; they are edited here before each is saved.
  const loadDay = (dateObj) =>
    getTimesheetDay(getESTDateString(dateObj))
      .then((res) => setEmployees(dataOf(res)?.employees || []))
      .catch((error) => message.error(errorMessage(error, "Couldn't load the timesheet")))
      .finally(() => setLoading(false));

  const fetchData = (dateObj) => {
    setLoading(true);
    return loadDay(dateObj);
  };

  useEffect(() => {
    loadDay(selectedDate);
    // Loaded once on opening; picking a date loads that day.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /* HANDLE CHANGE */
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

  /* SAVE */
  const onSave = async (emp) => {
    setSavingId(emp.employee_id);
    try {
      await correctTimesheet({
        employee_id: emp.employee_id,
        date: getESTDateString(selectedDate),
        clock_in: emp.clock_in,
        clock_out: emp.clock_out,
        pay_per_day: Number(emp.pay_per_day || 0),
        bonus: Number(emp.bonus || 0),
        total_amount: Number(emp.total_amount || 0),
      });

      message.success("Timesheet saved");
      await fetchData(selectedDate);
    } catch (error) {
      message.error(errorMessage(error, "Couldn't save the timesheet"));
    }
    setSavingId(null);
  };

  const updateEmployeeType = async (empId, type) => {
    try {
      await setEmployeeType(empId, type);

      message.success("Employee type updated");

      setEmployees((prev) =>
        prev.map((e) =>
          e.employee_id === empId ? { ...e, employee_type: type } : e,
        ),
      );
    } catch {
      message.error("Failed to update employee type");
    }
  };

  const handleDownload = async () => {
    if (!employees || employees.length === 0) {
      message.warning("No data available to export.");
      return;
    }

    const formattedDate = getESTDateString(selectedDate);
    const styles = excelStyles();

    // Every data cell: thin border, centered.
    const cell = { ...styles.border, align: "center", alignVertical: "center" };

    // Header row
    const headerRow = [
      "Employee Name",
      "Employee Type",
      "Booking Status",
      "Clock In",
      "Clock Out",
      "Total Hours",
      "Pay / Day ($)",
      "Bonus ($)",
      "Total ($)",
    ].map((value) => ({ value, ...styles.header }));

    const dataRows = employees.map((emp, index) => {
      // Alternate row background (sheet rows 2, 4, 6...)
      const rowStyle = index % 2 === 0 ? { ...cell, ...styles.muted } : cell;

      return [
        { value: emp.name, ...rowStyle },
        { value: emp.employee_type, ...rowStyle },
        { value: emp.booking_id ? "Assigned" : "Not Assigned", ...rowStyle },
        { value: formatTime(emp.clock_in), ...rowStyle },
        { value: formatTime(emp.clock_out), ...rowStyle },
        { value: emp.total_hours || "", ...rowStyle },
        { value: emp.pay_per_day || 0, ...rowStyle },
        { value: emp.bonus || 0, ...rowStyle },
        // Highlight Total column
        {
          value: emp.total_amount || 0,
          ...cell,
          ...styles.success,
          fontWeight: "bold",
        },
      ];
    });

    await saveXlsx(
      [headerRow, ...dataRows],
      {
        sheet: "Timesheet",
        columns: [25, 25, 18, 15, 15, 18, 15, 15, 15].map((width) => ({
          width,
        })),
      },
      `Employee_Timesheet_${formattedDate}.xlsx`,
    );
  };

  const handleRangeDownload = async () => {
    if (!rangeStart || !rangeEnd) {
      message.warning("Please select date range");
      return;
    }

    try {
      setDownloading(true);

      const res = await getTimesheetRange({
        startDate: dayjs(rangeStart).format("YYYY-MM-DD"),
        endDate: dayjs(rangeEnd).format("YYYY-MM-DD"),
        employeeType: employeeTypeFilter || undefined,
      });

      const rows = dataOf(res)?.rows || [];

      if (!rows.length) {
        message.warning("No data found");
        return;
      }

      const styles = excelStyles();
      const cell = { ...styles.border, align: "center" };
      const sheetRows = [];

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
        sheetRows.push([]);

        // 👤 Employee Header
        sheetRows.push([
          { value: `${emp.name} (${emp.type})`, fontWeight: "bold", fontSize: 14 },
        ]);

        // Column Headers
        sheetRows.push(
          [
            "Date",
            "Booking",
            "Clock In",
            "Clock Out",
            "Hours",
            "Pay ($)",
            "Bonus ($)",
            "Total ($)",
          ].map((value) => ({ value, ...styles.header })),
        );

        let totalSum = 0;

        // 📅 Employee Records (borders, centered, alternate row color)
        emp.records.forEach((r, index) => {
          totalSum += Number(r.total_amount || 0);

          const rowStyle =
            index % 2 === 0 ? { ...cell, ...styles.muted } : cell;

          sheetRows.push(
            [
              r.date,
              r.booking_id ? "Assigned" : "Not Assigned",
              formatTime(r.clock_in),
              formatTime(r.clock_out),
              r.total_hours || "",
              r.pay_per_day || 0,
              r.bonus || 0,
              r.total_amount || 0,
            ].map((value) => ({ value, ...rowStyle })),
          );
        });

        // 💰 Total Row
        sheetRows.push(
          ["", "", "", "", "", "", "Total:", totalSum].map((value) => ({
            value,
            ...styles.total,
            align: "center",
          })),
        );
      });

      await saveXlsx(
        sheetRows,
        {
          sheet: "Timesheet",
          // ✅ Same width (18) for every column, for readability
          columns: Array.from({ length: 8 }, () => ({ width: 18 })),
        },
        `Timesheet_${dayjs(rangeStart).format("YYYY-MM-DD")}_to_${dayjs(rangeEnd).format("YYYY-MM-DD")}.xlsx`,
      );
    } catch (err) {
      console.error(err);
      message.error("Failed to download report");
    }

    setDownloading(false);
  };

  return (
    <div className="employee-timesheet">
      {/* Header Section */}
      <div className="surface employee-timesheet__header">
        {/* Top row: title + single-date download */}
        <PageHeader
          card={false}
          className="employee-timesheet__header-main"
          title="Employee Timesheet"
          subtitle="Manage daily attendance and compensation"
          actions={
            <>
              <span className="employee-timesheet__label">Single date:</span>
              <DatePicker
                value={selectedDate}
                onChange={(d) => {
                  setSelectedDate(d);
                  fetchData(d);
                }}
                size="middle"
              />
              <Button
                type="primary"
                icon={<Download size={16} />}
                onClick={handleDownload}
              >
                Download Excel
              </Button>
            </>
          }
        />

        {/* Bottom row: range export */}
        <div className="employee-timesheet__range">
          <span className="employee-timesheet__range-label">Range export</span>
          <Divider orientation="vertical" style={{ height: 22 }} />
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
          />
          <span className="text-subtle">→</span>
          <DatePicker
            placeholder="End date"
            value={rangeEnd}
            onChange={(d) => setRangeEnd(d)}
          />
          <Button
            type="primary"
            icon={<Download size={16} />}
            loading={downloading}
            disabled={!rangeStart || !rangeEnd}
            onClick={handleRangeDownload}
          >
            Download Range Excel
          </Button>
        </div>
      </div>

      {/* Table Section */}
      {loading ? (
        <div className="surface employee-timesheet__loading">
          <Spin size="large" />
          <div className="employee-timesheet__loading-text">
            Loading timesheet data...
          </div>
        </div>
      ) : (
        <div className="surface employee-timesheet__table-card">
          <div className="employee-timesheet__table-scroll">
            <table className="employee-timesheet__table">
              <thead>
                <tr>
                  <th>Employee Name</th>
                  <th>Employee Type</th>
                  <th>Booking Status</th>
                  <th>
                    <div className="employee-timesheet__th-icon">
                      <Clock size={14} />
                      Clock In
                    </div>
                  </th>
                  <th>
                    <div className="employee-timesheet__th-icon">
                      <Clock size={14} />
                      Clock Out
                    </div>
                  </th>
                  <th>Total Hours</th>
                  <th>Pay / Day ($)</th>
                  <th>Bonus ($)</th>
                  <th>Total ($)</th>
                  <th>Action</th>
                </tr>
              </thead>

              <tbody>
                {employees.length === 0 ? (
                  <tr>
                    <td colSpan="9" className="employee-timesheet__empty">
                      No employees found for this date
                    </td>
                  </tr>
                ) : (
                  employees.map((emp) => (
                    <tr key={emp.employee_id} className="employee-timesheet__row">
                      <td>
                        <div className="employee-timesheet__employee">
                          <div className="employee-timesheet__avatar">
                            {emp.name?.charAt(0)?.toUpperCase() || "E"}
                          </div>
                          <span className="employee-timesheet__name">
                            {emp.name}
                          </span>
                        </div>
                      </td>

                      <td>
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

                      <td>
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

                      <td>
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
                            className="employee-timesheet__input"
                          />

                          <div className="employee-timesheet__time-hint">
                            {emp.clock_in ? formatTime(emp.clock_in) : ""}
                          </div>
                        </div>
                      </td>

                      <td>
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
                            className="employee-timesheet__input"
                          />

                          <div className="employee-timesheet__time-hint">
                            {emp.clock_out ? formatTime(emp.clock_out) : ""}
                          </div>
                        </div>
                      </td>

                      <td>
                        <span
                          className={`employee-timesheet__hours${
                            emp.total_hours
                              ? ""
                              : " employee-timesheet__hours--empty"
                          }`}
                        >
                          {emp.total_hours || "-"}
                        </span>
                      </td>

                      <td>
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
                          className="employee-timesheet__input"
                        />
                      </td>

                      <td>
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
                          className="employee-timesheet__input"
                        />
                      </td>

                      <td>
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
                          className="employee-timesheet__input"
                          style={{
                            fontWeight: 600,
                            background: "var(--color-success-subtle)",
                          }}
                        />
                      </td>

                      <td>
                        <Button
                          type="primary"
                          icon={<Save size={16} />}
                          loading={savingId === emp.employee_id}
                          onClick={() => onSave(emp)}
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
  );
};

export default EmployeeTimesheetPage;
