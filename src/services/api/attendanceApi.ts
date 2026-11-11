import httpClient from "@/services/httpClient";
import type { ApiCall } from "@/services/apiResult";
import type {
  AttendanceRecord,
  AttendanceStats,
  BreakRow,
  DayAttendanceRow,
  Id,
  Items,
  LeaveRequest,
  MonthAttendanceRow,
  MonthPresenceDay,
} from "@/types";

// Attendance, breaks and leave. Times keep the New York wall time the
// screens show (clock_in, clock_out). Rows name each person's roles and a
// job_title in words.

/**
 * One day ({ date }: a row per employee, with status, clock_in, clock_out,
 * total_hours and the clock-in and -out places) or a month ({ month, year }:
 * a row per employee with monthly_attendance, a status a day).
 */
export function listAttendance(params: { date: string }): ApiCall<Items<DayAttendanceRow>>;
export function listAttendance(params: { month: number; year: number }): ApiCall<Items<MonthAttendanceRow>>;
export function listAttendance(params: { date: string } | { month: number; year: number }) {
  return httpClient.get("/attendance", { params });
}

/** total_employees, present, on_leave and absent on a date. */
export const getAttendanceStats = (date: string): ApiCall<AttendanceStats> =>
  httpClient.get("/attendance/stats", { params: { date } });

/** A row a day of the month, with present_users. */
export const getMonthPresence = ({ month, year }: { month: number; year: number }): ApiCall<Items<MonthPresenceDay>> =>
  httpClient.get("/attendance/month-presence", { params: { month, year } });

export interface AttendanceCorrection {
  employee_id: Id;
  date: string;
  clock_in?: string;
  clock_out?: string;
}

/** Sets an employee's clock in and out on a date (HH:mm, New York); empty times are fine. */
export const correctAttendance = ({ employee_id, date, clock_in, clock_out }: AttendanceCorrection): ApiCall<AttendanceRecord> =>
  httpClient.put("/attendance", { employee_id, date, clock_in, clock_out });

/** A row per employee, with break_count and breaks, on a date. */
export const listBreaks = (date: string): ApiCall<Items<BreakRow>> => httpClient.get("/breaks", { params: { date } });

/** Leave requests, each with the employee as attendence_user. */
export const listLeaveRequests = (): ApiCall<Items<LeaveRequest>> => httpClient.get("/leave-requests");

/** status: ACCEPTED or REJECTED; the employee hears by email. */
export const answerLeaveRequest = (id: Id, status: "ACCEPTED" | "REJECTED"): ApiCall<null> =>
  httpClient.patch(`/leave-requests/${id}`, { status });
