import httpClient from "@/services/httpClient";
import type { ApiCall } from "@/services/apiResult";
import type { AddressInput, ClientSheet, Id, Items, SheetArea, SheetRow } from "@/types";

// Initial Client Sheets: a client can have many, each with a title, its own
// address and its areas. Share and Unshare live in documentApi.ts.

export interface SheetInput extends AddressInput {
  title?: string;
  /** Empty text clears it. */
  estimated_sqft?: number | "" | null;
  walkaround_minutes?: number | null;
  /** The days of the week, or as text such as "Mon, Wed". */
  service_days?: string[] | string | null;
  carpet_percentage?: number | null;
  concrete_percentage?: number | null;
  vct_lvt_percentage?: number | null;
  tile_percentage?: number | null;
  address_id?: number | null;
  areas?: Partial<SheetArea>[];
}

/** The client's sheets, newest first, without areas. */
export const listSheets = (clientId: Id): ApiCall<Items<SheetRow>> => httpClient.get(`/clients/${clientId}/sheets`);

/**
 * title (required), estimated_sqft, walkaround_minutes, service_days, the four
 * floor percentages, address_id or the fields of a new address, and areas.
 */
export const createSheet = (clientId: Id, sheet: SheetInput): ApiCall<ClientSheet> =>
  httpClient.post(`/clients/${clientId}/sheets`, sheet);

/** One sheet with its address and areas. */
export const getSheet = (id: Id): ApiCall<ClientSheet> => httpClient.get(`/client-sheets/${id}`);

/** Any of the sheet's fields; areas sent replace its areas. */
export const updateSheet = (id: Id, changes: SheetInput): ApiCall<ClientSheet> => httpClient.patch(`/client-sheets/${id}`, changes);

/** Needs records.delete. */
export const deleteSheet = (id: Id): ApiCall<null> => httpClient.delete(`/client-sheets/${id}`);

export type FloorField = "carpet_percentage" | "concrete_percentage" | "vct_lvt_percentage" | "tile_percentage";

/** The floor composition fields, in the order the forms show them. */
export const FLOOR_FIELDS: readonly { name: FloorField; label: string }[] = Object.freeze([
  { name: "carpet_percentage", label: "Carpet" },
  { name: "concrete_percentage", label: "Concrete" },
  { name: "vct_lvt_percentage", label: "VCT/LVT" },
  { name: "tile_percentage", label: "Tile" },
]);
