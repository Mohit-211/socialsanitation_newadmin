import type { PersonRef, Place } from "./api";
import type { Address } from "./clients";

export type VisitStatus = "PENDING" | "ACCEPTED" | "ONGOING" | "SUCCESS" | "REJECTED" | "CANCELLED" | string;
export type SeriesStatus = "active" | "ending" | "ended";
export type RepeatUnit = "week" | "month";
/** A monthly series: the same date, or the same weekday (such as the 2nd Tuesday). */
export type MonthlyBy = "date" | "weekday";

/** Someone a booking is for who isn't a client. */
export interface Guest {
  id: number;
  name: string;
  company_name: string | null;
  email: string | null;
  phone: string | null;
}

/** Where the crew goes: the client's address, or the guest's (which has no id). */
export type BookingAddress = Omit<Address, "id"> & { id: number | null };

/** A crew member on a visit, and the job they do there. */
export interface CrewMember {
  id: number;
  name: string | null;
  job_type: string | null;
}

export interface CancelRequest {
  requested_at: string;
  reason: string | null;
  open: boolean;
}

export interface VisitPhoto {
  id: number;
  kind: "before" | "after";
  url: string;
}

/** One visit in full. */
export interface Visit {
  id: number;
  number: string | null;
  title: string | null;
  type: "recurring" | "one_time";
  series_id: number | null;
  series_date: string | null;
  status: VisitStatus;
  date: string;
  start_time: string | null;
  end_time: string | null;
  started_at: string | null;
  finished_at: string | null;
  client: PersonRef | null;
  guest: Guest | null;
  address: BookingAddress | null;
  services: Place[];
  employees: CrewMember[];
  notes: string | null;
  cancellation_reason: string | null;
  cancel_request: CancelRequest | null;
  photos: VisitPhoto[];
  created_at: string;
  updated_at: string;
}

/** A visit in a list: its address on one line. */
export interface VisitRow {
  id: number;
  number: string | null;
  title: string | null;
  type: "recurring" | "one_time";
  series_id: number | null;
  status: VisitStatus;
  date: string;
  start_time: string | null;
  end_time: string | null;
  client: PersonRef | null;
  guest: { id: number; name: string } | null;
  address: string | null;
  services: Place[];
  employees: CrewMember[];
  cancel_request: CancelRequest | null;
}

/** How a series repeats. */
export interface Repeat {
  unit: RepeatUnit;
  every: number;
  days: string[] | null;
  monthly_by: MonthlyBy | null;
  ends_on: string | null;
  visits: number | null;
  description: string;
}

/** A repeating booking. */
export interface BookingSeries {
  id: number;
  title: string | null;
  client: PersonRef | null;
  guest: Guest | null;
  address: BookingAddress | null;
  services: Place[];
  employees: CrewMember[];
  start_time: string | null;
  end_time: string | null;
  notes: string | null;
  repeat: Repeat;
  starts_on: string;
  ends_on: string;
  booked_through: string | null;
  status: SeriesStatus;
  latest_end: string;
  upcoming_visits?: VisitRow[];
  created_at: string;
  updated_at: string;
}

/** What a repeat booking would make (POST /bookings/preview). */
export interface BookingPreview {
  dates_booked_now: string[];
  total_visits: number | null;
  first_date: string | null;
  last_date: string | null;
  latest_end: string | null;
}

/** A day of the booking calendar, with its visits. */
export interface CalendarDay {
  date: string;
  bookings: VisitRow[];
}

/** A task of a visit's checklist; day: "Day 1", "Day 2"… by the date it was done. */
export interface VisitChecklistTask {
  id: number;
  task: string;
  booking_id: number | string;
  is_completed: boolean;
  /** When it was done, as Eastern date-time text. */
  date: string | null;
  day: string | null;
}

/** A checklist heading of a visit's services, with its tasks. */
export interface VisitChecklist {
  heading_id: number;
  heading_title: string;
  tasks: VisitChecklistTask[];
}

// --- What the API takes ---------------------------------------------------------------

/** The crew by job: employee ids. Each list sent replaces that job's people. */
export interface CrewInput {
  cleaners?: number[];
  supervisors?: number[];
  quality_inspectors?: number[];
}

/** How a booking repeats: every 1 to 12 weeks on days, or months; ends on a date or after a number of visits. */
export interface RepeatInput {
  unit: RepeatUnit;
  every: number;
  days?: string[];
  monthly_by?: MonthlyBy;
  ends_on?: string | null;
  visits?: number | null;
}

/** Someone who isn't a client, and where the crew goes. */
export interface GuestInput {
  name?: string;
  company_name?: string | null;
  email?: string | null;
  phone?: string | null;
  address?: string;
  address_line_2?: string | null;
  city_id?: number;
  state_id?: number;
  country_id?: number;
  postal_code?: string;
  address_lat?: number | null;
  address_long?: number | null;
  access_notes?: string | null;
}

/** The fields a visit and a series both take. */
interface BookingFieldsInput {
  title?: string;
  notes?: string;
  start_time?: string | null;
  end_time?: string | null;
  address_id?: number;
  service_ids?: number[];
  employees?: CrewInput;
  guest?: GuestInput;
}

/** A new booking (POST /bookings): for a client (client_id) or a guest; a series when it repeats. */
export interface NewBookingInput extends BookingFieldsInput {
  client_id?: number;
  service_ids: number[];
  date: string | null;
  start_time: string | null;
  repeat?: RepeatInput;
}

/** Changes to one visit (PATCH /bookings/:id). */
export interface VisitInput extends BookingFieldsInput {
  date?: string | null;
  status?: VisitStatus;
  cancellation_reason?: string;
}

/** Changes to a series from a date on (PATCH /booking-series/:id): from is the first date they reach. */
export interface SeriesInput extends BookingFieldsInput {
  repeat?: Partial<RepeatInput>;
  ends_on?: string | null;
  visits?: number | null;
  from?: string;
}
