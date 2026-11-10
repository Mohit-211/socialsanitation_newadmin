import httpClient from "@/services/httpClient";

// Initial Client Sheets: a client can have many, each with a title, its own
// address and its areas. Share and Unshare live in documentApi.js.

/** The client's sheets, newest first, without areas. */
export const listSheets = (clientId) => httpClient.get(`/clients/${clientId}/sheets`);

/**
 * title (required), estimated_sqft, walkaround_minutes, service_days, the four
 * floor percentages, address_id or the fields of a new address, and areas.
 */
export const createSheet = (clientId, sheet) => httpClient.post(`/clients/${clientId}/sheets`, sheet);

/** One sheet with its address and areas. */
export const getSheet = (id) => httpClient.get(`/client-sheets/${id}`);

/** Any of the sheet's fields; areas sent replace its areas. */
export const updateSheet = (id, changes) => httpClient.patch(`/client-sheets/${id}`, changes);

/** Needs records.delete. */
export const deleteSheet = (id) => httpClient.delete(`/client-sheets/${id}`);

/** The floor composition fields, in the order the forms show them. */
export const FLOOR_FIELDS = Object.freeze([
  { name: "carpet_percentage", label: "Carpet" },
  { name: "concrete_percentage", label: "Concrete" },
  { name: "vct_lvt_percentage", label: "VCT/LVT" },
  { name: "tile_percentage", label: "Tile" },
]);
