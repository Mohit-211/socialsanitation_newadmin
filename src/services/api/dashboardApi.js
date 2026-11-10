import httpClient from "@/services/httpClient";

// The dashboard, the day overview and the schedule (Gantt).

/**
 * clients, employees (supervisor, quality_assurance, cleaner, housekeeper,
 * bdm, salesperson, total), admins (super_admin, admin, total) and services.
 * Someone with two roles counts under both; total counts each person once.
 */
export const getDashboardCounts = () => httpClient.get("/dashboard");

/** Employees clocked in on a visit on the date: employee_name, booking_name, clock_in and its place. */
export const listLiveEmployees = (date) => httpClient.get("/dashboard/live-employees", { params: { date } });

/** Employees late for, or absent from, today's visits. */
export const listLateEmployees = () => httpClient.get("/dashboard/late-employees");

/** The visits coming up; date stays MM-DD-YYYY. */
export const listUpcomingVisits = () => httpClient.get("/dashboard/upcoming-bookings");

/** Card payments, newest first. */
export const listTransactions = () => httpClient.get("/transactions");

/** { date, total_bookings, bookings }: the day's visits, each with its crew and address. */
export const getDayOverview = (date) => httpClient.get("/day-overview", { params: { date } });

/** One visit's day: its crew, each with clock in and out, places and breaks. */
export const getVisitOverview = (id) => httpClient.get(`/bookings/${id}/overview`);

/** { date, employees: [{ id, name, booking_start, booking_end }] } for the schedule's Gantt chart. */
export const getGantt = (date) => httpClient.get("/gantt", { params: { date } });
