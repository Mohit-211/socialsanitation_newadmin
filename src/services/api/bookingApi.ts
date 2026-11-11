import httpClient from "@/services/httpClient";
import type { ApiCall } from "@/services/apiResult";
import type {
  BookingPreview,
  BookingSeries,
  CalendarDay,
  Id,
  Items,
  ListQuery,
  NewBookingInput,
  Paged,
  RepeatInput,
  SeriesInput,
  Visit,
  VisitChecklist,
  VisitInput,
  VisitRow,
} from "@/types";

// Bookings: visits for a client (at one of their addresses) or for someone
// who isn't one (a guest). A booking covers one or more services, takes a date
// and a start time (Eastern, 24-hour), can name its crew, and can repeat as a
// series. Only the office books; a client can ask to cancel a visit.

/**
 * Visit rows, paged. Query, all optional: booking_status (UPCOMING, PENDING,
 * ONGOING, COMPLETED, CANCELLED), period, client_id, employee_id, series_id,
 * from, to, cancel_requested, search, page, limit (at most 500).
 */
export const listBookings = (params?: ListQuery): ApiCall<Paged<VisitRow>> => httpClient.get("/bookings", { params });

/** What creating a booking answers: the visit, or the series it starts (the other is null). */
export interface BookingCreated {
  visit: Visit | null;
  series: BookingSeries | null;
}

/**
 * client_id or guest, service_ids, date and start_time are required; also
 * address_id, end_time, title, notes, employees ({ cleaners, supervisors,
 * quality_inspectors }: lists of ids) and repeat. Answers visit, or series.
 */
export const createBooking = (booking: NewBookingInput): ApiCall<BookingCreated> => httpClient.post("/bookings", booking);

/** date and repeat: answers dates_booked_now, total_visits, first_date, last_date, latest_end. */
export const previewBooking = ({ date, repeat }: { date: string | null; repeat: RepeatInput | null }): ApiCall<BookingPreview> =>
  httpClient.post("/bookings/preview", { date, repeat });

/** One visit, with notes, photos and any cancel request. */
export const getBooking = (id: Id): ApiCall<Visit> => httpClient.get(`/bookings/${id}`);

/** Changes this visit only; each employees list sent replaces that job's people. */
export const updateBooking = (id: Id, changes: VisitInput): ApiCall<Visit> => httpClient.patch(`/bookings/${id}`, changes);

/** Needs records.delete. A visit of a series stays removed. */
export const deleteBooking = (id: Id): ApiCall<null> => httpClient.delete(`/bookings/${id}`);

/** Keeps a visit the client asked to cancel; they hear it stays booked. */
export const declineCancelRequest = (id: Id): ApiCall<Visit> => httpClient.post(`/bookings/${id}/cancel-request/decline`);

/** One item per day of the month, each with its visit rows. */
export const getBookingCalendar = ({ month, year }: { month: number; year: number }): ApiCall<Items<CalendarDay>> =>
  httpClient.get("/booking-calendar", { params: { month, year } });

/** The checklists of every service the visit covers. */
export const getBookingChecklists = (id: Id): ApiCall<Items<VisitChecklist>> => httpClient.get(`/bookings/${id}/checklists`);

/** A client's visits; booking_status UPCOMING or COMPLETED, paged. */
export const listClientBookings = (clientId: Id, params?: ListQuery): ApiCall<Paged<VisitRow>> =>
  httpClient.get(`/clients/${clientId}/bookings`, { params });

/** The visits an employee works; booking_status UPCOMING or COMPLETED, paged. */
export const listEmployeeBookings = (employeeId: Id, params?: ListQuery): ApiCall<Paged<VisitRow>> =>
  httpClient.get(`/employees/${employeeId}/bookings`, { params });

/** What emailing a two-week schedule did: EMAIL_SENT listing `count` visits, or NO_BOOKINGS (no email went out). */
export interface TwoWeekScheduleSent {
  type: "EMAIL_SENT" | "NO_BOOKINGS";
  count: number;
}

/** Emails the employee their next two weeks of visits. */
export const sendTwoWeekSchedule = (employeeId: Id): ApiCall<TwoWeekScheduleSent> =>
  httpClient.post(`/employees/${employeeId}/two-week-schedule`);

// --- Repeating bookings ----------------------------------------------------------

/** Query: status (active, ending, ended), client_id, page, limit. The soonest to end first. */
export const listBookingSeries = (params?: ListQuery): ApiCall<Paged<BookingSeries>> =>
  httpClient.get("/booking-series", { params });

/** The series, with upcoming_visits (the next 10). */
export const getBookingSeries = (id: Id): ApiCall<BookingSeries> => httpClient.get(`/booking-series/${id}`);

/**
 * Any of title, notes, start_time, end_time, address_id, service_ids,
 * employees, guest, repeat, ends_on or visits, and from (the first date the
 * change reaches; today when left out).
 */
export const updateBookingSeries = (id: Id, changes: SeriesInput): ApiCall<BookingSeries> =>
  httpClient.patch(`/booking-series/${id}`, changes);

/** Its visits after last_date (today when left out) that haven't started go. */
export const stopBookingSeries = (id: Id, lastDate?: string | null): ApiCall<BookingSeries> =>
  httpClient.post(`/booking-series/${id}/stop`, lastDate ? { last_date: lastDate } : {});

/** Needs records.delete. Its visits from today that haven't started go. */
export const deleteBookingSeries = (id: Id): ApiCall<null> => httpClient.delete(`/booking-series/${id}`);
