import type { PersonRef, Role } from "./api";

// --- Attendance, breaks, leave and timesheets ---------------------------------------
// Clock and break times are New York wall time held in a timestamp's UTC fields:
// show them with formatWallTime, never a local conversion.

/** A latitude and longitude as stored; either may be missing. */
export interface GeoPoint {
  lat: number | string | null;
  lng: number | string | null;
}

/** PRESENT, LATE or ABSENT (against the day's visit), or PENDING. */
export type AttendanceStatus = "PRESENT" | "LATE" | "ABSENT" | "PENDING" | string;

/** An employee's day (GET /attendance?date=): a row per employee. */
export interface DayAttendanceRow {
  user_id: number;
  user_name: string;
  roles: Role[];
  job_title: string | null;
  date: string;
  status: AttendanceStatus;
  clock_in: string | null;
  clock_out: string | null;
  total_hours: string | null;
  clock_in_location: GeoPoint | null;
  clock_out_location: GeoPoint | null;
  /** The clock-in and clock-out photos. The daily list doesn't send them yet (asked of the backend). */
  clock_in_image_uri?: string | null;
  clock_out_image_uri?: string | null;
}

/**
 * A day of an employee's month: PRESENT (with its times), ON LEAVE, APPLIED
 * LEAVE (waiting for an answer), ABSENT, or "--" for days to come.
 */
export interface AttendanceDay {
  date: string;
  status: string;
  clock_in?: string | null;
  clock_out?: string | null;
  total_hours?: string | null;
  clock_in_location?: GeoPoint;
  clock_out_location?: GeoPoint;
  leave_reason?: string | null;
}

/** An employee's month (GET /attendance?month=&year=): a status a day. */
export interface MonthAttendanceRow {
  user_name: string;
  roles: Role[];
  job_title: string | null;
  monthly_attendance: AttendanceDay[];
}

/** An employee's attendance day (GET /employees/:id/attendance). */
export interface AttendanceRow {
  id?: number;
  employee_id?: number;
  user_id?: number;
  name?: string | null;
  email?: string | null;
  roles?: Role[];
  job_title?: string | null;
  status?: string | null;
  date?: string | null;
  clock_in?: string | null;
  clock_out?: string | null;
  total_hours?: string | number | null;
  monthly_attendance?: Record<string, string>;
  [field: string]: unknown;
}

export interface AttendanceStats {
  total_employees: number;
  present: number;
  on_leave: number;
  absent: number;
}

/** Someone present on a day of the month (GET /attendance/month-presence). */
export interface PresentEmployee {
  /** The attendance row. */
  id: number;
  user_id: number;
  roles: Role[];
  job_title: string | null;
  name: string;
  clock_in: string | null;
  clock_out: string | null;
  total_hours: string | null;
  /** The real clock-in and -out instants, as ISO text. */
  clock_in_est: string;
  clock_out_est: string | null;
}

export interface MonthPresenceDay {
  date: string;
  present_users: PresentEmployee[];
}

/** An attendance row as stored: what a correction answers. */
export interface AttendanceRecord {
  id: number;
  user_id: number;
  clock_in: string | null;
  clock_out: string | null;
  clock_in_est: string | null;
  clock_out_est: string | null;
  total_hours: string | null;
  added_by_admin?: boolean;
}

/** A break, with the attendance it was taken in. */
export interface BreakEntry {
  break_start_est: string | null;
  break_end_est: string | null;
  duration_minutes: string | null;
  status: "active" | "completed";
  attendance: { clock_in: string | null; clock_out: string | null; total_hours: string | null } | null;
}

/** An employee's breaks on a day (GET /breaks). */
export interface BreakRow {
  user_id: number;
  user_name: string;
  roles: Role[];
  job_title: string | null;
  break_count: number;
  breaks: BreakEntry[];
}

export type LeaveStatus = "PENDING" | "ACCEPTED" | "REJECTED";

/** A day off an employee asked for (an attendance row on leave), with the employee. */
export interface LeaveRequest {
  id: number;
  user_id: number;
  leave_date: string | null;
  leave_reason: string | null;
  leave_status: LeaveStatus;
  created_at: string;
  attendence_user: PersonRef | null;
}

/** An employee's day on the timesheet: clock in and out (HH:mm:ss, New York) and pay. */
export interface TimesheetEmployee {
  employee_id: number;
  name: string;
  roles: Role[];
  job_title: string | null;
  employee_type: string | null;
  /** The day's attendance row (the day's rows). */
  attendance_id?: number | null;
  /** The date (a range's rows). */
  date?: string;
  booking_id: number | null;
  clock_in: string | null;
  clock_out: string | null;
  total_hours: string | null;
  pay_per_day: number | string | null;
  bonus: number | string | null;
  total_amount: number | string | null;
  is_manual: boolean;
}

export interface TimesheetDay {
  date: string;
  employees: TimesheetEmployee[];
}

/** A row per employee a day; only rows when no employee matches. */
export interface TimesheetRange {
  start_date?: string;
  end_date?: string;
  total_records?: number;
  rows: TimesheetEmployee[];
}

/** What a timesheet correction answers: the attendance row and its pay. */
export interface TimesheetSaved {
  attendance: AttendanceRecord;
  payroll: {
    id: number;
    attendance_id: number;
    pay_per_day: number | string | null;
    bonus: number | string | null;
    total_amount: number | string | null;
    notes: string | null;
    is_manual: boolean;
  };
}

// --- The dashboard, the day and the schedule ---------------------------------------------

/** Accounts and services counted. Someone with two roles counts under both; total counts each person once. */
export interface DashboardCounts {
  clients: number;
  employees: {
    supervisor: number;
    quality_assurance: number;
    cleaner: number;
    housekeeper: number;
    bdm: number;
    salesperson: number;
    total: number;
  };
  admins: { super_admin: number; admin: number; total: number };
  services: number;
}

/** An employee clocked in on a visit (clock_in: New York wall time). */
export interface LiveEmployee {
  employee_id: number;
  employee_name: string;
  booking_name: string | null;
  booking_id: number;
  clock_in: string;
  clock_in_lat: number | string | null;
  clock_in_lng: number | string | null;
  clock_out_lat: number | string | null;
  clock_out_lng: number | string | null;
}

/** An employee late for, or absent from, one of today's visits. */
export interface LateEmployee {
  employee_id: number;
  employee_name?: string | null;
  booking_name: string | null;
  booking_id: number;
  /** The visit's start, HH:mm:ss (New York). */
  booking_time: string | null;
  /** Their clock-in, New York wall time. */
  clock_in_time: string | null;
  delay_minutes: number;
  /** LATE or ABSENT. */
  status: AttendanceStatus;
}

/** A visit in the next 7 days; date is MM/DD/YYYY text. */
export interface UpcomingVisit {
  booking_id: number;
  booking_name: string | null;
  client_name: string;
  date: string | null;
  /** HH:mm:ss (New York). */
  time: string | null;
  employees_assigned: number;
  employees: (string | null)[];
  address: string;
}

/** A card payment as stored, with payment_user and payment_booking. */
export type Transaction = Record<string, unknown>;

/** A break at a visit: start and end as HH:mm:ss (New York), and where. */
export interface CrewBreak {
  break_start_est: string;
  break_end_est: string | null;
  status: string;
  duration_minutes: string | null;
  break_start_lat: number | string | null;
  break_start_lng: number | string | null;
  break_end_lat: number | string | null;
  break_end_lng: number | string | null;
}

/** A visit's address on the overviews. */
export interface OverviewAddress {
  address_line_1: string | null;
  city: string;
  state: string;
  country: string;
}

/** A crew member's day at a visit of the day overview (clock times: New York wall time). */
export interface DayOverviewEmployee {
  id?: number;
  name: string | null;
  clock_in: string | null;
  clock_out: string | null;
  breaks: CrewBreak[] | null;
}

/** A visit of the day (GET /day-overview), with its crew's clock times and breaks. */
export interface DayOverviewVisit {
  booking_id: number;
  booking_unique_id: string | null;
  client_name: string;
  booking_name: string;
  number_of_employees: number;
  employees: DayOverviewEmployee[];
  address_id: number | null;
  address: OverviewAddress | null;
}

export interface DayOverview {
  date: string;
  total_bookings: number;
  bookings: DayOverviewVisit[];
}

/** A crew member at one visit: clock in and out (HH:mm:ss, New York), where, and breaks. */
export interface VisitCrewDay {
  id?: number;
  name: string | null;
  clock_in: string | null;
  clock_in_lat: number | string | null;
  /** The clock-in longitude (named so by the API). */
  clock_in_lang: number | string | null;
  clock_out: string | null;
  clock_out_lat: number | string | null;
  clock_out_lang: number | string | null;
  total_hours: string | null;
  number_of_breaks: number;
  breaks: CrewBreak[];
}

/** One visit's day (GET /bookings/:id/overview): its crew, each with clock in and out, places and breaks. */
export interface VisitOverview {
  booking_id: number;
  booking_unique_id: string | null;
  booking_name: string | null;
  client_name: string;
  date: string;
  /** HH:mm:ss (New York). */
  time: string | null;
  number_of_employees: number;
  employees: VisitCrewDay[];
  address_id: number | null;
  address: (OverviewAddress & { address_lat: number | string | null; address_long: number | string | null }) | null;
}

/** An employee on the day's Gantt chart: their visit's start and end (HH:mm), if they have one. */
export interface GanttEmployee {
  id: number;
  name: string;
  booking_start: string | null;
  booking_end: string | null;
}

export interface GanttDay {
  date: string;
  employees: GanttEmployee[];
}
