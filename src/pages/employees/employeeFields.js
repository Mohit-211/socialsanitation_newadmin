import { EMPLOYEE_ROLES, EMPLOYEE_TYPES } from "@/services/api/employeeApi";
import { listCities, listCountries, listStates } from "@/services/api/referenceApi";
import { itemsOf } from "@/services/apiResult";
import { geocodeAddress } from "@/utils/geocode";

// What the employee screens share: role names and colours, an employee's
// home address as text, and the place of a hiring form's address.

const ROLE_COLORS = {
  cleaner: "green",
  housekeeper: "cyan",
  supervisor: "blue",
  qa_technician: "purple",
  bdm: "gold",
  salesperson: "magenta",
};

export const roleLabel = (code) => EMPLOYEE_ROLES.find((role) => role.value === code)?.label || code;
export const roleColor = (code) => ROLE_COLORS[code] || "default";
export const typeLabel = (code) => EMPLOYEE_TYPES.find((type) => type.value === code)?.label || code || "—";

/** An employee's role codes. */
export const roleCodesOf = (employee) => (employee?.roles || []).map((role) => role.code || role);

/** The employee's home (their primary address, else the first) as street and place. */
export function homeOf(employee) {
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
export const searchTextOf = (employee) =>
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

const clean = (text) => String(text || "").trim().replace(/\s+/g, " ").toLowerCase();

// Hiring forms name the country in words, or not at all (older forms were all in the US).
const COUNTRY_CODES = { "": "US", us: "US", usa: "US", "united states": "US", "united states of america": "US", ca: "CA", canada: "CA" };

/**
 * The place of a hiring form's address, as a new employee needs it: the
 * country, state and city ids, and the coordinates from Google. Throws an
 * Error the office can read when part of it can't be matched.
 */
export async function placeOfHiringForm(form) {
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
