import { message } from "antd";
import type { TwoWeekScheduleSent } from "@/services/api/bookingApi";
import { EMPLOYEE_ROLES, EMPLOYEE_TYPES } from "@/services/api/employeeApi";
import { listCities, listCountries, listStates } from "@/services/api/referenceApi";
import { itemsOf } from "@/services/apiResult";
import { geocodeAddress } from "@/utils/geocode";
import type { AccountAddress, Employee, HiringFormMatch, Role } from "@/types";

// What the employee screens share: role names and colours, an employee's
// home address as text, and the place of a hiring form's address.

/** The employee form's fields. */
export interface EmployeeFormValues {
  name: string;
  email: string;
  roles: string[];
  employee_type?: string;
}

/** Where a hiring form's address is: the ids and coordinates a new home needs. */
export interface HiringPlace {
  country_id: number;
  state_id: number;
  city_id: number;
  address_lat: number;
  address_long: number;
  one_line: string;
}

/** A hiring form picked for an employee, with the place of its address. */
export interface PickedHiring {
  form: HiringFormMatch;
  place: HiringPlace;
}

/** The hiring form an employee already has, as the form shows it. */
export interface ShownHiring {
  name: string | null;
  email: string | null;
  phone?: string | null;
  pdf_url: string | null;
}

const ROLE_COLORS: Record<string, string> = {
  cleaner: "green",
  housekeeper: "cyan",
  supervisor: "blue",
  qa_technician: "purple",
  bdm: "gold",
  salesperson: "magenta",
};

export const roleLabel = (code: string) => EMPLOYEE_ROLES.find((role) => role.value === code)?.label || code;
export const roleColor = (code: string) => ROLE_COLORS[code] || "default";
export const typeLabel = (code: string | null | undefined) =>
  EMPLOYEE_TYPES.find((type) => type.value === code)?.label || code || "—";

/** An employee's role codes. */
export const roleCodesOf = (employee: { roles?: Role[] | null } | null | undefined): string[] =>
  (employee?.roles || []).map((role) => role.code);

/** Role codes as the roles an employee row holds. */
export const rolesOfCodes = (codes: string[]): Role[] => codes.map((code) => ({ code, name: roleLabel(code) }));

/** The place fields of a hiring form's address, as the employee calls take them. */
export const placeFields = ({ country_id, state_id, city_id, address_lat, address_long }: HiringPlace) => ({
  country_id,
  state_id,
  city_id,
  address_lat,
  address_long,
});

/** Says what a two-week schedule email did: with no visits ahead, no email goes out. */
export function announceScheduleSent(answer: TwoWeekScheduleSent | null | undefined) {
  if (answer?.type === "NO_BOOKINGS") message.info("No visits in the next two weeks, so no email was sent");
  else message.success(answer?.count ? `Schedule sent: ${answer.count} visit(s)` : "Schedule sent");
}

/** The employee's home (their primary address, else the first) as street and place. */
export function homeOf(employee: { user_address?: AccountAddress[] | null } | null | undefined) {
  const addresses = employee?.user_address || [];
  const home = addresses.find((address) => address.is_primary) || addresses[0];
  if (!home) return null;
  const street = [home.address, home.address_line_2].filter(Boolean).join(", ");
  const place = [home.user_city?.name, home.user_state?.name, home.user_country?.name || "USA"]
    .filter(Boolean)
    .join(", ");
  return { street, place, oneLine: [street, place].filter(Boolean).join(", "), lat: home.address_lat, lng: home.address_long };
}

/** Everything the employee list's search box looks through. */
export const searchTextOf = (employee: Employee) =>
  [
    employee.name,
    employee.email,
    employee.phone,
    ...roleCodesOf(employee).map(roleLabel),
    homeOf(employee)?.oneLine,
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();

const clean = (text: unknown) => String(text || "").trim().replace(/\s+/g, " ").toLowerCase();

// Hiring forms name the country in words, or not at all (older forms were all in the US).
const COUNTRY_CODES: Record<string, string> = { "": "US", us: "US", usa: "US", "united states": "US", "united states of america": "US", ca: "CA", canada: "CA" };

/**
 * The place of a hiring form's address, as a new employee needs it: the
 * country, state and city ids, and the coordinates from Google. Throws an
 * Error the office can read when part of it can't be matched.
 */
export async function placeOfHiringForm(form: HiringFormMatch): Promise<HiringPlace> {
  if (!form?.state) throw new Error("The hiring form has no state.");
  if (!form?.city) throw new Error("The hiring form has no city.");

  const countryCode = COUNTRY_CODES[clean(form.country)] || "US";
  const country = itemsOf(await listCountries()).find((row) => row.code === countryCode);
  if (!country) throw new Error(`The country "${form.country}" isn't one we serve.`);

  const states = itemsOf(await listStates({ countryId: country.id }));
  const state = states.find((row) => clean(row.code) === clean(form.state) || clean(row.name) === clean(form.state));
  if (!state) throw new Error(`The state "${form.state}" wasn't found.`);

  const cities = itemsOf(await listCities({ stateId: state.id, search: form.city.trim(), limit: 50 }));
  const city = cities.find((row) => clean(row.name) === clean(form.city));
  if (!city) throw new Error(`The city "${form.city}" wasn't found in ${state.name}.`);

  const oneLine =
    form.full_address ||
    [[form.address, form.apt_suite].filter(Boolean).join(", "), form.city, state.code || state.name, form.zip_code]
      .filter(Boolean)
      .join(", ");
  const geocoded = await geocodeAddress(oneLine).catch(() => null);
  const point = geocoded?.status === "OK" ? geocoded.results?.[0]?.geometry?.location : null;
  if (!point) throw new Error("Google couldn't find the hiring form's address on the map.");

  return {
    country_id: country.id,
    state_id: state.id,
    city_id: city.id,
    address_lat: point.lat,
    address_long: point.lng,
    one_line: oneLine,
  };
}
