import { geocodeAddress } from "@/utils/geocode";
import type { AddressInput } from "@/types";

/** AddressFields' values: the address, the place ids, and the pickers' labels for the lookup. */
export interface AddressFormValues {
  label?: string | null;
  address: string;
  address_line_2?: string | null;
  country_id?: number;
  state_id?: number;
  city_id?: number;
  postal_code: string;
  access_notes?: string | null;
  city_name?: string;
  state_code?: string;
}

// Turning AddressFields' values into an address for the API.

// Coordinates for the nearest-employee search. Best effort: an address saves
// without them when Google can't place it.
async function coordinatesOf(oneLine: string): Promise<Pick<AddressInput, "address_lat" | "address_long">> {
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
export async function addressBody(values: AddressFormValues): Promise<AddressInput> {
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
export const hasAddress = (values: Partial<AddressFormValues> | null | undefined) => Boolean(values?.address?.trim());
