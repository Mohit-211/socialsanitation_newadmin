import httpClient from "@/services/httpClient";

// Attendance, breaks and leave. Times keep the New York wall time the
// screens show (clock_in, clock_out). Rows name each person's roles and a
// job_title in words.

/**
 * One day ({ date }: a row per employee, with status, clock_in, clock_out,
 * total_hours and the clock-in and -out places) or a month ({ month, year }:
 * a row per employee with monthly_attendance, a status a day).
 */
export const listAttendance = (params) => httpClient.get("/attendance", { params });

/** total_employees, present, on_leave and absent on a date. */
export const getAttendanceStats = (date) => httpClient.get("/attendance/stats", { params: { date } });

/** A row a day of the month, with present_users. */
export const getMonthPresence = ({ month, year }) =>
  httpClient.get("/attendance/month-presence", { params: { month, year } });

/** Sets an employee's clock in and out on a date (HH:mm, New York); empty times are fine. */
export const correctAttendance = ({ employee_id, date, clock_in, clock_out }) =>
  httpClient.put("/attendance", { employee_id, date, clock_in, clock_out });

/** A row per employee, with break_count and breaks, on a date. */
export const listBreaks = (date) => httpClient.get("/breaks", { params: { date } });

/** Leave requests, each with the employee as attendence_user. */
export const listLeaveRequests = () => httpClient.get("/leave-requests");

/** status: ACCEPTED or REJECTED (answers 200). */
export const answerLeaveRequest = (id, status) => httpClient.patch(`/leave-requests/${id}`, { status });
