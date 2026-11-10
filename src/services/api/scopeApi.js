import httpClient from "@/services/httpClient";
import { API_BASE_URL } from "@/config/env";

// Scopes of work. The master list holds the template sections and tasks for
// each client type; a client's scope of work is a document of its own, made
// from one of their sheets (or the whole master list) and then edited for that
// client. Every change to a client's scope answers with the whole scope.

// --- Master list -----------------------------------------------------------

/** data.items: sections with their items, for "commercial" or "residential". */
export const getMasterScope = (clientType) =>
  httpClient.get("/scope", { params: { client_type: clientType } });

/** title (required), is_red, client_type. */
export const createMasterSection = (section) => httpClient.post("/scope/sections", section);

/** Any of title, is_red, client_type, order. */
export const updateMasterSection = (id, changes) => httpClient.patch(`/scope/sections/${id}`, changes);

export const deleteMasterSection = (id) => httpClient.delete(`/scope/sections/${id}`);

/** section_id and description (required), is_daily, is_weekly, is_monthly. */
export const createMasterItem = (item) => httpClient.post("/scope/items", item);

/** Any of description, is_daily, is_weekly, is_monthly, order. */
export const updateMasterItem = (id, changes) => httpClient.patch(`/scope/items/${id}`, changes);

export const deleteMasterItem = (id) => httpClient.delete(`/scope/items/${id}`);

// --- A client's scopes of work ---------------------------------------------

/** The client's scopes, newest first, without sections. */
export const listClientScopes = (clientId) => httpClient.get(`/clients/${clientId}/scopes`);

/**
 * All optional: title, client_sheet_id (left out, the scope starts from the
 * whole master list), visit_frequency, service_days, service_time, crew_size,
 * hours_per_visit, notes.
 */
export const createClientScope = (clientId, scope) => httpClient.post(`/clients/${clientId}/scopes`, scope);

/** The scope with its sections and tasks, in order. */
export const getScopeOfWork = (id) => httpClient.get(`/scopes/${id}`);

/** The same fields, at least one; null or "" clears one. */
export const updateScopeOfWork = (id, changes) => httpClient.patch(`/scopes/${id}`, changes);

/** Needs records.delete. */
export const deleteScopeOfWork = (id) => httpClient.delete(`/scopes/${id}`);

/** file_url (a link that expires) and file_name. */
export const getScopeOfWorkPdf = (id) => httpClient.get(`/scopes/${id}/pdf`);

/** { title, is_red }, or { master_section_id } to copy a master section with its tasks. */
export const addScopeSection = (scopeId, section) => httpClient.post(`/scopes/${scopeId}/sections`, section);

/** sections: a list of { id, order }. */
export const reorderScopeSections = (scopeId, sections) =>
  httpClient.patch(`/scopes/${scopeId}/sections/order`, { sections });

/** Any of title, is_red, order. */
export const updateScopeSection = (scopeId, sectionId, changes) =>
  httpClient.patch(`/scopes/${scopeId}/sections/${sectionId}`, changes);

/** Needs records.delete. */
export const deleteScopeSection = (scopeId, sectionId) =>
  httpClient.delete(`/scopes/${scopeId}/sections/${sectionId}`);

/** description (required), is_daily, is_weekly, is_monthly. */
export const addScopeItem = (scopeId, sectionId, item) =>
  httpClient.post(`/scopes/${scopeId}/sections/${sectionId}/items`, item);

/** items: a list of { id, order }. */
export const reorderScopeItems = (scopeId, sectionId, items) =>
  httpClient.patch(`/scopes/${scopeId}/sections/${sectionId}/items/order`, { items });

/** Any of description, is_daily, is_weekly, is_monthly, order. */
export const updateScopeItem = (scopeId, itemId, changes) =>
  httpClient.patch(`/scopes/${scopeId}/items/${itemId}`, changes);

/** Needs records.delete. */
export const deleteScopeItem = (scopeId, itemId) => httpClient.delete(`/scopes/${scopeId}/items/${itemId}`);

// ---------------------------------------------------------------------------
// Old /api/v1 calls, still used by the estimate screens until they move to
// /api/v2 (an estimate's own copy of the scope lives at /estimates/:id/scope).

/** @deprecated Use getMasterScope. */
export const getScope = (clientType = "commercial") =>
  httpClient.get(`${API_BASE_URL}admin/auth/scope`, { params: { client_type: clientType } });

/** @deprecated A client has many scopes now: use listClientScopes and getScopeOfWork. */
export const GetUserScopeView = (userId) => httpClient.get(`${API_BASE_URL}admin/auth/user-scope-view/${userId}`);
