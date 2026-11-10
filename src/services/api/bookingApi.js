import httpClient from "@/services/httpClient";
import { API_BASE_URL } from "@/config/env";

// Bookings: visits for a client (at one of their addresses) or for someone
// who isn't one (a guest). A booking covers one or more services, takes a date
// and a start time (Eastern, 24-hour), can name its crew, and can repeat as a
// series. Only the office books; a client can ask to cancel a visit.

/**
 * Visit rows, paged. Query, all optional: booking_status (UPCOMING, PENDING,
 * ONGOING, COMPLETED, CANCELLED), period, client_id, employee_id, series_id,
 * from, to, cancel_requested, search, page, limit (at most 500).
 */
export const listBookings = (params) => httpClient.get("/bookings", { params });

/**
 * client_id or guest, service_ids, date and start_time are required; also
 * address_id, end_time, title, notes, employees ({ cleaners, supervisors,
 * quality_inspectors }: lists of ids) and repeat. Answers visit, or series.
 */
export const createBooking = (booking) => httpClient.post("/bookings", booking);

/** date and repeat: answers dates_booked_now, total_visits, first_date, last_date, latest_end. */
export const previewBooking = ({ date, repeat }) => httpClient.post("/bookings/preview", { date, repeat });

/** One visit, with notes, photos and any cancel request. */
export const getBooking = (id) => httpClient.get(`/bookings/${id}`);

/** Changes this visit only; each employees list sent replaces that job's people. */
export const updateBooking = (id, changes) => httpClient.patch(`/bookings/${id}`, changes);

/** Needs records.delete. A visit of a series stays removed. */
export const deleteBooking = (id) => httpClient.delete(`/bookings/${id}`);

/** Keeps a visit the client asked to cancel; they hear it stays booked. */
export const declineCancelRequest = (id) => httpClient.post(`/bookings/${id}/cancel-request/decline`);

/** One item per day of the month, each with its visit rows. */
export const getBookingCalendar = ({ month, year }) => httpClient.get("/booking-calendar", { params: { month, year } });

/** The checklists of every service the visit covers. */
export const getBookingChecklists = (id) => httpClient.get(`/bookings/${id}/checklists`);

/** A client's visits; booking_status UPCOMING or COMPLETED, paged. */
export const listClientBookings = (clientId, params) => httpClient.get(`/clients/${clientId}/bookings`, { params });

/** The visits an employee works; booking_status UPCOMING or COMPLETED, paged. */
export const listEmployeeBookings = (employeeId, params) =>
  httpClient.get(`/employees/${employeeId}/bookings`, { params });

/** Emails the employee their next two weeks; type NO_BOOKINGS means nothing was sent. */
export const sendTwoWeekSchedule = (employeeId) => httpClient.post(`/employees/${employeeId}/two-week-schedule`);

// --- Repeating bookings ----------------------------------------------------------

/** Query: status (active, ending, ended), client_id, page, limit. The soonest to end first. */
export const listBookingSeries = (params) => httpClient.get("/booking-series", { params });

/** The series, with upcoming_visits (the next 10). */
export const getBookingSeries = (id) => httpClient.get(`/booking-series/${id}`);

/**
 * Any of title, notes, start_time, end_time, address_id, service_ids,
 * employees, guest, repeat, ends_on or visits, and from (the first date the
 * change reaches; today when left out).
 */
export const updateBookingSeries = (id, changes) => httpClient.patch(`/booking-series/${id}`, changes);

/** Its visits after last_date (today when left out) that haven't started go. */
export const stopBookingSeries = (id, lastDate) =>
  httpClient.post(`/booking-series/${id}/stop`, lastDate ? { last_date: lastDate } : {});

/** Needs records.delete. Its visits from today that haven't started go. */
export const deleteBookingSeries = (id) => httpClient.delete(`/booking-series/${id}`);

// ---------------------------------------------------------------------------
// Old /api/v1 calls, still used by the employee, invoice, schedule and day
// overview screens until they move to /api/v2.

/** @deprecated Use listEmployeeBookings. */
export const GetBookingBySPId = (formData) => httpClient.post(API_BASE_URL + "admin/user/getBookingByEmployeeId", formData);

/** @deprecated */
export const GetDayOverview = (formData) => httpClient.post(API_BASE_URL + "admin/booking/getDayOverview", formData);

/** @deprecated */
export const GetBookingOverviewById = (id) => httpClient.get(API_BASE_URL + `admin/booking/getBookingOverviewById/${id}`);

/** @deprecated */
export const GantOverview = (payload) => httpClient.post(API_BASE_URL + "admin/booking/getDayOverviewForGantt", payload);
