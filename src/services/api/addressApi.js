import httpClient from "@/services/httpClient";

// Anyone's addresses: a client's places of service, an employee's home. A new
// address needs address (the street), city_id, state_id and postal_code; also
// label, address_line_2, address_lat, address_long, google_map_link,
// access_notes and is_primary. Only the US and Canada are taken. Each answers
// city, state and country as objects, postal_code, is_primary and one_line.

/** The user's addresses, the primary one first. */
export const listAddresses = (userId) => httpClient.get(`/users/${userId}/addresses`);

export const addAddress = (userId, address) => httpClient.post(`/users/${userId}/addresses`, address);

/** id, label, one_line and is_primary, for pickers. */
export const listAddressPicks = (userId) => httpClient.get(`/users/${userId}/address-picks`);

/** Any of the fields; a new street, city, state or ZIP without new coordinates clears the old ones. */
export const updateAddress = (id, changes) => httpClient.patch(`/addresses/${id}`, changes);

/** Makes it the user's only primary address. */
export const makeAddressPrimary = (id) => httpClient.post(`/addresses/${id}/primary`);

/** Needs records.delete; the oldest address left becomes primary. */
export const deleteAddress = (id) => httpClient.delete(`/addresses/${id}`);

export const listEmployeesNearAddress = (id) => httpClient.get(`/addresses/${id}/nearest-employees`);
