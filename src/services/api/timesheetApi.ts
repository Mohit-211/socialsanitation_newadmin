import httpClient from "@/services/httpClient";
import type { ApiCall } from "@/services/apiResult";
import type { Id, TimesheetDay, TimesheetRange, TimesheetSaved } from "@/types";

// Employee timesheets: each employee's clock in and out, pay for the day and
// bonus. Times are New York wall times (HH:mm:ss).

/** { date, employees: [{ employee_id, name, roles, job_title, employee_type, clock_in, clock_out, total_hours, pay_per_day, bonus, total_amount, is_manual }] } */
export const getTimesheetDay = (date: string): ApiCall<TimesheetDay> => httpClient.get("/timesheets/day", { params: { date } });

/** { start_date, end_date, total_records, rows }: a row per employee a day (only rows when no one matches). */
export const getTimesheetRange = ({
  startDate,
  endDate,
  employeeType,
}: {
  startDate: string;
  endDate: string;
  employeeType?: string | null;
}): ApiCall<TimesheetRange> =>
  httpClient.get("/timesheets/range", {
    params: { start_date: startDate, end_date: endDate, employee_type: employeeType || undefined },
  });

export interface TimesheetCorrection {
  employee_id: Id;
  date: string;
  clock_in?: string | null;
  clock_out?: string | null;
  pay_per_day?: number | string | null;
  bonus?: number | string | null;
  total_amount?: number | string | null;
  notes?: string | null;
}

/** employee_id and date are required; clock_in, clock_out, pay_per_day, bonus, total_amount, notes. */
export const correctTimesheet = (timesheet: TimesheetCorrection): ApiCall<TimesheetSaved> =>
  httpClient.put("/timesheets", timesheet);
