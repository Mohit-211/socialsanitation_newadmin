import { geocodeAddress } from "@/utils/geocode";

// Turning AddressFields' values into an address for the API.

// Coordinates for the nearest-employee search. Best effort: an address saves
// without them when Google can't place it.
async function coordinatesOf(oneLine) {
  try {
    const result = await geocodeAddress(oneLine);
    const location = result?.results?.[0]?.geometry?.location;
    return location ? { address_lat: location.lat, address_long: location.lng } : {};
  } catch {
    return {};
  }
}

/**
 * The address fields as the API takes them, with coordinates looked up from
 * the address as typed. city_name and state_code are the pickers' labels,
 * kept by AddressFields for the lookup; they don't go to the API.
 */
export async function addressBody(values) {
  const place = [values.city_name, [values.state_code, values.postal_code].filter(Boolean).join(" ")];
  const oneLine = [values.address, values.address_line_2, ...place].filter(Boolean).join(", ");
  return {
    label: values.label?.trim() || null,
    address: values.address.trim(),
    address_line_2: values.address_line_2?.trim() || null,
    country_id: values.country_id,
    state_id: values.state_id,
    city_id: values.city_id,
    postal_code: values.postal_code.trim(),
    access_notes: values.access_notes?.trim() || null,
    ...(await coordinatesOf(oneLine)),
  };
}

/** Whether a form's address fields hold an address at all (New Client's is optional). */
export const hasAddress = (values) => Boolean(values?.address?.trim());
