import httpClient from "@/services/httpClient";

// Service estimates. Each makes a PDF and goes to the client for signature by
// DocuSign; it prints the client's newest scope of work, and keeps its own
// copy of that scope, which the office can edit. Share and Unshare live in
// documentApi.js.

/** Query: page, limit, user_id, status, search (company). */
export const listEstimates = (params) => httpClient.get("/estimates", { params });

/** One estimate, with its signature and scope_sections. */
export const getEstimate = (id) => httpClient.get(`/estimates/${id}`);

/**
 * user_id and client_company_name are required; also address_line_1,
 * address_line_2, city, state, zip, contact_name, contact_phone, contact_fax,
 * contact_email, signed_date, frequency and signature.
 */
export const createEstimate = (estimate) => httpClient.post("/estimates", estimate);

/** The whole estimate again (with user_id): a new PDF, sent for signature again. */
export const updateEstimate = (id, estimate) => httpClient.put(`/estimates/${id}`, estimate);

/** Needs records.delete. */
export const deleteEstimate = (id) => httpClient.delete(`/estimates/${id}`);

/** DocuSign emails the client again; data.sent_to says who. */
export const resendEstimate = (id) => httpClient.post(`/estimates/${id}/resend`);

// --- The estimate's own copy of the scope -------------------------------------

/** data.items: the estimate's sections, each with its items. */
export const getEstimateScope = (id) => httpClient.get(`/estimates/${id}/scope`);

/** title (required), is_red. Answers the section. */
export const addEstimateSection = (id, section) => httpClient.post(`/estimates/${id}/scope/sections`, section);

export const updateEstimateSection = (id, sectionId, changes) =>
  httpClient.patch(`/estimates/${id}/scope/sections/${sectionId}`, changes);

/** Needs records.delete. */
export const deleteEstimateSection = (id, sectionId) =>
  httpClient.delete(`/estimates/${id}/scope/sections/${sectionId}`, { data: {} });

/** section_id and description (required), is_daily, is_weekly, is_monthly. Answers the line. */
export const addEstimateItem = (id, item) => httpClient.post(`/estimates/${id}/scope/items`, item);

export const updateEstimateItem = (id, itemId, changes) =>
  httpClient.patch(`/estimates/${id}/scope/items/${itemId}`, changes);

/** Needs records.delete. */
export const deleteEstimateItem = (id, itemId) =>
  httpClient.delete(`/estimates/${id}/scope/items/${itemId}`, { data: {} });
