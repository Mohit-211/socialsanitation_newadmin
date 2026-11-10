import httpClient from "@/services/httpClient";
import { API_BASE_URL } from "@/config/env";

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

// ---------------------------------------------------------------------------
// Old /api/v1 calls, still used by screens that haven't moved to /api/v2 yet
// (guest booking and the employee pages). They go once those screens move.

/** @deprecated Use addAddress. */
export const AddNewUserAddress = (formData) =>
  httpClient.post(API_BASE_URL + "admin/user/addNewUserAddress", formData);

/** @deprecated Use updateAddress. */
export const EditAddress = (formData) => httpClient.put(API_BASE_URL + "user/editAddress", formData);

/** @deprecated Use deleteAddress. */
export const DeleteUserAddress = (addressId) =>
  httpClient.delete(API_BASE_URL + "admin/user/delete-user-address/" + addressId);

/** @deprecated Use listStates from referenceApi. */
export const StateAPI = (id) => httpClient.get(API_BASE_URL + `country/${id}`);

/** @deprecated Use listCities from referenceApi. */
export const CityAPI = (state_id) => httpClient.get(API_BASE_URL + `state/${state_id}`);
