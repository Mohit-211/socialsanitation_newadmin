import dayjs from "@/lib/dayjs";
import { fromApiDate, fromApiTime, toApiDate, toApiTime } from "@/utils/datetime";

// Booking form data: the crew jobs, the repeat rule, and the conversion between
// a visit or series from the API and the form's values.

export const WEEK_DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

/** The crew of a visit, by job, and which employee roles can do each job. */
export const CREW_JOBS = Object.freeze([
  { field: "cleaners", label: "Cleaners", roles: ["cleaner", "housekeeper"], jobType: "CLEANER" },
  { field: "supervisors", label: "Supervisors", roles: ["supervisor"], jobType: "SUPERVISOR" },
  { field: "quality_inspectors", label: "Quality Inspectors", roles: ["qa_technician"], jobType: "QUALITY_INSPECTOR" },
]);

const GUEST_FIELDS = ["name", "company_name", "email", "phone"];
const ADDRESS_FIELDS = ["address", "address_line_2", "city_id", "state_id", "country_id", "postal_code", "access_notes"];

const crewOf = (employees = []) =>
  Object.fromEntries(
    CREW_JOBS.map((job) => [job.field, employees.filter((employee) => employee.job_type === job.jobType).map((e) => e.id)]),
  );

/** Form values for a new booking; `clientId` from the client page, `forGuest` on the guest route. */
export const newBookingValues = ({ clientId, forGuest, countryId } = {}) => ({
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
export function bookingValues(booking) {
  const guest = booking?.guest;
  const address = booking?.address && typeof booking.address === "object" ? booking.address : null;
  const repeat = booking?.repeat;
  return {
    for: guest ? "guest" : "client",
    client_id: booking?.client?.id,
    address_id: address?.id ?? undefined,
    ...(guest
      ? {
          name: guest.name,
          company_name: guest.company_name || undefined,
          email: guest.email || undefined,
          phone: guest.phone || undefined,
          address: address?.address,
          address_line_2: address?.address_line_2 || undefined,
          country_id: address?.country?.id,
          state_id: address?.state?.id,
          city_id: address?.city?.id,
          city_name: address?.city?.name,
          state_code: address?.state?.code,
          postal_code: address?.postal_code || undefined,
          access_notes: address?.access_notes || undefined,
        }
      : {}),
    service_ids: (booking?.services || []).map((service) => service.id),
    date: fromApiDate(booking?.date ?? booking?.starts_on),
    start_time: fromApiTime(booking?.start_time),
    end_time: fromApiTime(booking?.end_time),
    title: booking?.title || undefined,
    notes: booking?.notes || undefined,
    ...crewOf(booking?.employees),
    repeats: Boolean(repeat),
    repeat_unit: repeat?.unit || "week",
    repeat_every: repeat?.every || 1,
    repeat_days: repeat?.days || [],
    repeat_monthly_by: repeat?.monthly_by || "date",
    repeat_end: repeat?.ends_on ? "date" : "visits",
    repeat_ends_on: fromApiDate(repeat?.ends_on ?? booking?.ends_on),
    repeat_visits: repeat?.visits ?? 8,
  };
}

/** The repeat rule as the API takes it, or null when the booking doesn't repeat. */
export function repeatBody(values) {
  if (!values.repeats) return null;
  const rule = { unit: values.repeat_unit, every: values.repeat_every || 1 };
  if (values.repeat_unit === "week") rule.days = values.repeat_days;
  else rule.monthly_by = values.repeat_monthly_by;
  if (values.repeat_end === "date") rule.ends_on = toApiDate(values.repeat_ends_on);
  else rule.visits = values.repeat_visits;
  return rule;
}

const guestBody = (values) => {
  const guest = {};
  for (const field of [...GUEST_FIELDS, ...ADDRESS_FIELDS]) {
    const value = typeof values[field] === "string" ? values[field].trim() : values[field];
    if (value !== undefined && value !== "") guest[field] = value;
  }
  return guest;
};

const employeesBody = (values) =>
  Object.fromEntries(CREW_JOBS.map((job) => [job.field, values[job.field] || []]));

/** A new booking (a visit, or a series when it repeats) as the API takes it. */
export function newBookingBody(values, guestCoordinates = {}) {
  const body = {
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
export function visitChanges(values, isGuest) {
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
export function seriesChanges(values, isGuest) {
  const repeat = repeatBody({ ...values, repeats: true });
  const { ends_on: endsOn, visits, ...rule } = repeat;
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

const sameList = (a = [], b = []) => a.length === b.length && [...a].sort().every((value, i) => value === [...b].sort()[i]);
const sameValue = (a, b) => (Array.isArray(a) || Array.isArray(b) ? sameList(a || [], b || []) : JSON.stringify(a ?? null) === JSON.stringify(b ?? null));

/**
 * Only the parts of `changes` that differ from `original` (both API bodies).
 * Each crew list sent replaces that job's people (and changes the visit's
 * chat), so an unchanged job is left out.
 */
export function onlyChanged(changes, original) {
  const result = {};
  for (const [key, value] of Object.entries(changes)) {
    if (key === "employees") {
      const jobs = Object.fromEntries(
        Object.entries(value || {}).filter(([job, ids]) => !sameList(ids, original.employees?.[job])),
      );
      if (Object.keys(jobs).length) result.employees = jobs;
    } else if (key === "guest") {
      const guest = Object.fromEntries(Object.entries(value || {}).filter(([field, v]) => !sameValue(v, original.guest?.[field])));
      if (Object.keys(guest).length) result.guest = guest;
    } else if (!sameValue(value, original[key])) {
      result[key] = value;
    }
  }
  return result;
}
