import httpClient from "@/services/httpClient";
import type { ApiCall } from "@/services/apiResult";
import type { ClientType, Id, Items, MasterSection, Scope, ScopeInput, ScopeItem, ScopeRow } from "@/types";
import type { ItemInput, SectionInput } from "./estimateApi";

// Scopes of work. The master list holds the template sections and tasks for
// each client type; a client's scope of work is a document of its own, made
// from one of their sheets (or the whole master list) and then edited for that
// client. Every change to a client's scope answers with the whole scope.

// --- Master list -----------------------------------------------------------

/** data.items: sections with their items, for "commercial" or "residential". */
export const getMasterScope = (clientType: ClientType): ApiCall<Items<MasterSection>> =>
  httpClient.get("/scope", { params: { client_type: clientType } });

/** title (required), is_red, client_type. */
export const createMasterSection = (section: SectionInput & { client_type?: ClientType }): ApiCall<MasterSection> =>
  httpClient.post("/scope/sections", section);

/** Any of title, is_red, client_type, order. */
export const updateMasterSection = (id: Id, changes: SectionInput & { client_type?: ClientType }): ApiCall<MasterSection> =>
  httpClient.patch(`/scope/sections/${id}`, changes);

export const deleteMasterSection = (id: Id): ApiCall<null> => httpClient.delete(`/scope/sections/${id}`);

/** section_id and description (required), is_daily, is_weekly, is_monthly. */
export const createMasterItem = (item: ItemInput): ApiCall<ScopeItem> => httpClient.post("/scope/items", item);

/** Any of description, is_daily, is_weekly, is_monthly, order. */
export const updateMasterItem = (id: Id, changes: ItemInput): ApiCall<ScopeItem> => httpClient.patch(`/scope/items/${id}`, changes);

export const deleteMasterItem = (id: Id): ApiCall<null> => httpClient.delete(`/scope/items/${id}`);

// --- A client's scopes of work ---------------------------------------------

/** The client's scopes, newest first, without sections. */
export const listClientScopes = (clientId: Id): ApiCall<Items<ScopeRow>> => httpClient.get(`/clients/${clientId}/scopes`);

/**
 * All optional: title, client_sheet_id (left out, the scope starts from the
 * whole master list), visit_frequency, service_days, service_time, crew_size,
 * hours_per_visit, notes.
 */
export const createClientScope = (clientId: Id, scope: ScopeInput): ApiCall<Scope> =>
  httpClient.post(`/clients/${clientId}/scopes`, scope);

/** The scope with its sections and tasks, in order. */
export const getScopeOfWork = (id: Id): ApiCall<Scope> => httpClient.get(`/scopes/${id}`);

/** The same fields, at least one; null or "" clears one. */
export const updateScopeOfWork = (id: Id, changes: ScopeInput): ApiCall<Scope> => httpClient.patch(`/scopes/${id}`, changes);

/** Needs records.delete. */
export const deleteScopeOfWork = (id: Id): ApiCall<null> => httpClient.delete(`/scopes/${id}`);

/** file_url (a link that expires) and file_name. */
export const getScopeOfWorkPdf = (id: Id): ApiCall<{ file_url: string; file_name: string }> =>
  httpClient.get(`/scopes/${id}/pdf`);

/** { title, is_red }, or { master_section_id } to copy a master section with its tasks. */
export const addScopeSection = (scopeId: Id, section: SectionInput & { master_section_id?: Id }): ApiCall<Scope> =>
  httpClient.post(`/scopes/${scopeId}/sections`, section);

/** sections: a list of { id, order }. */
export const reorderScopeSections = (scopeId: Id, sections: { id: Id; order: number }[]): ApiCall<Scope> =>
  httpClient.patch(`/scopes/${scopeId}/sections/order`, { sections });

/** Any of title, is_red, order. */
export const updateScopeSection = (scopeId: Id, sectionId: Id, changes: SectionInput): ApiCall<Scope> =>
  httpClient.patch(`/scopes/${scopeId}/sections/${sectionId}`, changes);

/** Needs records.delete. */
export const deleteScopeSection = (scopeId: Id, sectionId: Id): ApiCall<Scope> =>
  httpClient.delete(`/scopes/${scopeId}/sections/${sectionId}`);

/** description (required), is_daily, is_weekly, is_monthly. */
export const addScopeItem = (scopeId: Id, sectionId: Id, item: ItemInput): ApiCall<Scope> =>
  httpClient.post(`/scopes/${scopeId}/sections/${sectionId}/items`, item);

/** items: a list of { id, order }. */
export const reorderScopeItems = (scopeId: Id, sectionId: Id, items: { id: Id; order: number }[]): ApiCall<Scope> =>
  httpClient.patch(`/scopes/${scopeId}/sections/${sectionId}/items/order`, { items });

/** Any of description, is_daily, is_weekly, is_monthly, order. */
export const updateScopeItem = (scopeId: Id, itemId: Id, changes: ItemInput): ApiCall<Scope> =>
  httpClient.patch(`/scopes/${scopeId}/items/${itemId}`, changes);

/** Needs records.delete. */
export const deleteScopeItem = (scopeId: Id, itemId: Id): ApiCall<Scope> => httpClient.delete(`/scopes/${scopeId}/items/${itemId}`);
