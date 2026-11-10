import httpClient from "@/services/httpClient";

// Employee timesheets: each employee's clock in and out, pay for the day and
// bonus. Times are New York wall times (HH:mm:ss).

/** { date, employees: [{ employee_id, name, roles, job_title, employee_type, clock_in, clock_out, total_hours, pay_per_day, bonus, total_amount, is_manual }] } */
export const getTimesheetDay = (date) => httpClient.get("/timesheets/day", { params: { date } });

/** { start_date, end_date, total_records, rows }: a row per employee a day. */
export const getTimesheetRange = ({ startDate, endDate, employeeType }) =>
  httpClient.get("/timesheets/range", {
    params: { start_date: startDate, end_date: endDate, employee_type: employeeType || undefined },
  });

/** employee_id and date are required; clock_in, clock_out, pay_per_day, bonus, total_amount, notes. */
export const correctTimesheet = (timesheet) => httpClient.put("/timesheets", timesheet);
