import httpClient from "@/services/httpClient";

// Service requests: extra work for a client, emailed as a PDF and sent for
// signature by DocuSign. Share and Unshare live in documentApi.js.

/** Query: page, limit, month, user_id, search (reference or company). */
export const listServiceRequests = (params) => httpClient.get("/service-requests", { params });

/** One request, with items, client and signature. */
export const getServiceRequest = (id) => httpClient.get(`/service-requests/${id}`);

/**
 * user_id and items are required, with ref_no or ref_type; also service_days,
 * due_date, date, to_company_name, address_1, address_2 and signature. Each
 * line is worked out from quantity and unit_price.
 */
export const createServiceRequest = (request) => httpClient.post("/service-requests", request);

/** The whole request again (ref_no required): replaces the lines and sends it for signature again. */
export const updateServiceRequest = (id, request) => httpClient.put(`/service-requests/${id}`, request);

/** Needs records.delete. */
export const deleteServiceRequest = (id) => httpClient.delete(`/service-requests/${id}`);

/** data: ref_no and sequence. */
export const getNextServiceRequestRef = (refType) =>
  httpClient.get("/service-requests/next-ref", { params: { ref_type: refType } });
