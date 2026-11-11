import httpClient from "@/services/httpClient";
import type { ApiCall } from "@/services/apiResult";
import type {
  DashboardCounts,
  DayOverview,
  GanttDay,
  Id,
  Items,
  LateEmployee,
  LiveEmployee,
  Transaction,
  UpcomingVisit,
  VisitOverview,
} from "@/types";

// The dashboard, the day overview and the schedule (Gantt).

/**
 * clients, employees (supervisor, quality_assurance, cleaner, housekeeper,
 * bdm, salesperson, total), admins (super_admin, admin, total) and services.
 * Someone with two roles counts under both; total counts each person once.
 */
export const getDashboardCounts = (): ApiCall<DashboardCounts> => httpClient.get("/dashboard");

/** Employees clocked in on a visit on the date: employee_name, booking_name, clock_in and its place. */
export const listLiveEmployees = (date: string): ApiCall<Items<LiveEmployee>> =>
  httpClient.get("/dashboard/live-employees", { params: { date } });

/** Employees late for, or absent from, today's visits. */
export const listLateEmployees = (): ApiCall<Items<LateEmployee>> => httpClient.get("/dashboard/late-employees");

/** The visits of the next 7 days; date stays MM/DD/YYYY. */
export const listUpcomingVisits = (): ApiCall<Items<UpcomingVisit>> => httpClient.get("/dashboard/upcoming-bookings");

/** Card payments, newest first. */
export const listTransactions = (): ApiCall<Items<Transaction>> => httpClient.get("/transactions");

/** { date, total_bookings, bookings }: the day's visits, each with its crew and address. */
export const getDayOverview = (date: string): ApiCall<DayOverview> => httpClient.get("/day-overview", { params: { date } });

/** One visit's day: its crew, each with clock in and out, places and breaks. */
export const getVisitOverview = (id: Id): ApiCall<VisitOverview> => httpClient.get(`/bookings/${id}/overview`);

/** { date, employees: [{ id, name, booking_start, booking_end }] } for the schedule's Gantt chart. */
export const getGantt = (date: string): ApiCall<GanttDay> => httpClient.get("/gantt", { params: { date } });
