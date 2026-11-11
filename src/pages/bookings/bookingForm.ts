import type { Dayjs } from "dayjs";
import dayjs from "@/lib/dayjs";
import { fromApiDate, fromApiTime, toApiDate, toApiTime } from "@/utils/datetime";
import type {
  BookingSeries,
  CrewInput,
  CrewMember,
  GuestInput,
  MonthlyBy,
  NewBookingInput,
  RepeatInput,
  RepeatUnit,
  SeriesInput,
  Visit,
  VisitInput,
} from "@/types";

// Booking form data: the crew jobs, the repeat rule, and the conversion between
// a visit or series from the API and the form's values.

export const WEEK_DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

/** A crew job's field in the form and in the API's employees. */
export type CrewField = keyof CrewInput;

interface CrewJob {
  field: CrewField;
  label: string;
  /** The employee roles that can do the job. */
  roles: string[];
  /** The job_type a visit's crew member has. */
  jobType: string;
}

/** The crew of a visit, by job, and which employee roles can do each job. */
export const CREW_JOBS: readonly CrewJob[] = Object.freeze([
  { field: "cleaners", label: "Cleaners", roles: ["cleaner", "housekeeper"], jobType: "CLEANER" },
  { field: "supervisors", label: "Supervisors", roles: ["supervisor"], jobType: "SUPERVISOR" },
  { field: "quality_inspectors", label: "Quality Inspectors", roles: ["qa_technician"], jobType: "QUALITY_INSPECTOR" },
]);

/** The booking form's values: who and where, what and when, the crew by job, and the repeat rule. */
export interface BookingFormValues extends Partial<Record<CrewField, number[]>> {
  for: "client" | "guest";
  client_id?: number;
  /** Shown (not changed) when a visit or series is edited. */
  client_name?: string | null;
  address_id?: number;
  // A guest, and their address (AddressFields' fields)
  name?: string;
  company_name?: string;
  email?: string;
  phone?: string;
  address?: string;
  address_line_2?: string;
  country_id?: number;
  state_id?: number;
  city_id?: number;
  city_name?: string;
  state_code?: string;
  postal_code?: string;
  access_notes?: string;
  service_ids: number[];
  date?: Dayjs | null;
  /** A series: the first date a change reaches. */
  from?: Dayjs | null;
  start_time?: Dayjs | null;
  end_time?: Dayjs | null;
  title?: string;
  notes?: string;
  repeats: boolean;
  repeat_unit: RepeatUnit;
  repeat_every: number;
  repeat_days: string[];
  repeat_monthly_by: MonthlyBy;
  repeat_end: "visits" | "date";
  repeat_ends_on?: Dayjs | null;
  repeat_visits?: number | null;
}

type GuestField = keyof GuestInput & keyof BookingFormValues;

const GUEST_FIELDS: GuestField[] = ["name", "company_name", "email", "phone"];
const ADDRESS_FIELDS: GuestField[] = ["address", "address_line_2", "city_id", "state_id", "country_id", "postal_code", "access_notes"];

const crewOf = (employees: CrewMember[] = []): Record<CrewField, number[]> => ({
  cleaners: [],
  supervisors: [],
  quality_inspectors: [],
  ...Object.fromEntries(
    CREW_JOBS.map((job) => [job.field, employees.filter((employee) => employee.job_type === job.jobType).map((e) => e.id)]),
  ),
});

interface NewBookingOptions {
  /** From the client page. */
  clientId?: number;
  /** On the guest route. */
  forGuest?: boolean;
  countryId?: number;
}

/** Form values for a new booking; `clientId` from the client page, `forGuest` on the guest route. */
export const newBookingValues = ({ clientId, forGuest, countryId }: NewBookingOptions = {}): BookingFormValues => ({
  for: forGuest ? "guest" : "client",
  client_id: clientId,
  service_ids: [],
  date: dayjs().add(1, "day"),
  start_time: dayjs().hour(9).minute(0),
  cleaners: [],
  supervisors: [],
  quality_inspectors: [],
  country_id: countryId,
  repeats: false,
  repeat_unit: "week",
  repeat_every: 1,
  repeat_days: [],
  repeat_monthly_by: "date",
  repeat_end: "visits",
  repeat_visits: 8,
});

/** Form values from a visit or a series. */
export function bookingValues(booking: Visit | BookingSeries): BookingFormValues {
  const guest = booking.guest;
  const address = booking.address && typeof booking.address === "object" ? booking.address : null;
  const repeat = "repeat" in booking ? booking.repeat : null;
  return {
    for: guest ? "guest" : "client",
    client_id: booking.client?.id,
    address_id: address?.id ?? undefined,
    ...(guest
      ? {
          name: guest.name,
          company_name: guest.company_name || undefined,
          email: guest.email || undefined,
          phone: guest.phone || undefined,
          address: address?.address ?? undefined,
          address_line_2: address?.address_line_2 || undefined,
          country_id: address?.country?.id,
          state_id: address?.state?.id,
          city_id: address?.city?.id,
          city_name: address?.city?.name,
          state_code: address?.state?.code ?? undefined,
          postal_code: address?.postal_code || undefined,
          access_notes: address?.access_notes || undefined,
        }
      : {}),
    service_ids: (booking.services || []).map((service) => service.id),
    date: fromApiDate("date" in booking ? booking.date : booking.starts_on),
    start_time: fromApiTime(booking.start_time),
    end_time: fromApiTime(booking.end_time),
    title: booking.title || undefined,
    notes: booking.notes || undefined,
    ...crewOf(booking.employees),
    repeats: Boolean(repeat),
    repeat_unit: repeat?.unit || "week",
    repeat_every: repeat?.every || 1,
    repeat_days: repeat?.days || [],
    repeat_monthly_by: repeat?.monthly_by || "date",
    repeat_end: repeat?.ends_on ? "date" : "visits",
    repeat_ends_on: fromApiDate(repeat?.ends_on ?? ("ends_on" in booking ? booking.ends_on : null)),
    repeat_visits: repeat?.visits ?? 8,
  };
}

// The repeat rule of the form's values, as the API takes it.
function ruleOf(values: BookingFormValues): RepeatInput {
  const rule: RepeatInput = { unit: values.repeat_unit, every: values.repeat_every || 1 };
  if (values.repeat_unit === "week") rule.days = values.repeat_days;
  else rule.monthly_by = values.repeat_monthly_by;
  if (values.repeat_end === "date") rule.ends_on = toApiDate(values.repeat_ends_on);
  else rule.visits = values.repeat_visits;
  return rule;
}

/** The repeat rule as the API takes it, or null when the booking doesn't repeat. */
export const repeatBody = (values: BookingFormValues): RepeatInput | null => (values.repeats ? ruleOf(values) : null);

/** Copies one field (the same type on both sides). */
function copyField<T, K extends keyof T>(target: T, source: T, key: K) {
  target[key] = source[key];
}

const guestBody = (values: BookingFormValues): GuestInput => {
  const guest: GuestInput = {};
  for (const field of [...GUEST_FIELDS, ...ADDRESS_FIELDS]) {
    const value = values[field];
    const kept = typeof value === "string" ? value.trim() : value;
    if (kept !== undefined && kept !== "") Object.assign(guest, { [field]: kept });
  }
  return guest;
};

const employeesBody = (values: BookingFormValues): Required<CrewInput> => ({
  cleaners: values.cleaners || [],
  supervisors: values.supervisors || [],
  quality_inspectors: values.quality_inspectors || [],
});

/** A new booking (a visit, or a series when it repeats) as the API takes it. */
export function newBookingBody(values: BookingFormValues, guestCoordinates: Pick<GuestInput, "address_lat" | "address_long"> = {}) {
  const body: NewBookingInput = {
    service_ids: values.service_ids,
    date: toApiDate(values.date),
    start_time: toApiTime(values.start_time),
    end_time: toApiTime(values.end_time) || undefined,
    title: values.title?.trim() || undefined,
    notes: values.notes?.trim() || undefined,
    employees: employeesBody(values),
  };
  if (values.for === "guest") body.guest = { ...guestBody(values), ...guestCoordinates };
  else {
    body.client_id = values.client_id;
    if (values.address_id) body.address_id = values.address_id;
  }
  const repeat = repeatBody(values);
  if (repeat) body.repeat = repeat;
  return body;
}

/** The changes to one visit as the API takes them (PATCH /bookings/:id). */
export function visitChanges(values: BookingFormValues, isGuest: boolean): VisitInput {
  return {
    title: values.title?.trim() || "",
    notes: values.notes?.trim() || "",
    date: toApiDate(values.date),
    start_time: toApiTime(values.start_time),
    end_time: toApiTime(values.end_time) || null,
    service_ids: values.service_ids,
    employees: employeesBody(values),
    ...(isGuest ? { guest: guestBody(values) } : values.address_id ? { address_id: values.address_id } : {}),
  };
}

/** The changes to a series from a date on, as the API takes them (PATCH /booking-series/:id). */
export function seriesChanges(values: BookingFormValues, isGuest: boolean): SeriesInput {
  const { ends_on: endsOn, visits, ...rule } = ruleOf(values);
  return {
    title: values.title?.trim() || "",
    notes: values.notes?.trim() || "",
    start_time: toApiTime(values.start_time),
    end_time: toApiTime(values.end_time) || null,
    service_ids: values.service_ids,
    employees: employeesBody(values),
    repeat: rule,
    ...(endsOn ? { ends_on: endsOn } : { visits }),
    from: toApiDate(values.from) || undefined,
    ...(isGuest ? { guest: guestBody(values) } : values.address_id ? { address_id: values.address_id } : {}),
  };
}

const sameList = (a: readonly unknown[] = [], b: readonly unknown[] = []) =>
  a.length === b.length && [...a].sort().every((value, i) => value === [...b].sort()[i]);
const sameValue = (a: unknown, b: unknown) =>
  Array.isArray(a) || Array.isArray(b)
    ? sameList(Array.isArray(a) ? a : [], Array.isArray(b) ? b : [])
    : JSON.stringify(a ?? null) === JSON.stringify(b ?? null);

/** A visit's or a series' changes: the fields of either. */
export type BookingChanges = VisitInput & SeriesInput;

/**
 * Only the parts of `changes` that differ from `original` (both API bodies).
 * Each crew list sent replaces that job's people (and changes the visit's
 * chat), so an unchanged job is left out.
 */
export function onlyChanged<T extends BookingChanges>(changes: T, original: T): Partial<T> {
  const result: Partial<T> = {};
  for (const key of Object.keys(changes) as (keyof T)[]) {
    if (key === "employees") {
      const jobs: CrewInput = {};
      for (const { field } of CREW_JOBS) {
        const ids = changes.employees?.[field];
        if (ids && !sameList(ids, original.employees?.[field])) jobs[field] = ids;
      }
      if (Object.keys(jobs).length) result.employees = jobs;
    } else if (key === "guest") {
      const guest: GuestInput = {};
      const sent = changes.guest ?? {};
      for (const field of Object.keys(sent) as (keyof GuestInput)[]) {
        if (!sameValue(sent[field], original.guest?.[field])) copyField(guest, sent, field);
      }
      if (Object.keys(guest).length) result.guest = guest;
    } else if (!sameValue(changes[key], original[key])) {
      result[key] = changes[key];
    }
  }
  return result;
}
