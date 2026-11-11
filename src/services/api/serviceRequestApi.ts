import httpClient from "@/services/httpClient";
import type { ApiCall } from "@/services/apiResult";
import type { Id, ListQuery, NextRef, Paged, ServiceRequest, ServiceRequestInput } from "@/types";

// Service requests: extra work for a client. A request can add to one of the
// client's estimates or quotes (its lines join that document, which goes to
// the client again); otherwise it is emailed as a PDF and sent for signature
// by DocuSign. Share and Unshare live in documentApi.ts.

/** Query: page, limit, month, user_id, search (reference or company). */
export const listServiceRequests = (params?: ListQuery): ApiCall<Paged<ServiceRequest>> =>
  httpClient.get("/service-requests", { params });

/** One request, with items, client and signature. */
export const getServiceRequest = (id: Id): ApiCall<ServiceRequest> => httpClient.get(`/service-requests/${id}`);

/**
 * user_id and items are required, with ref_no or ref_type; also estimate_id
 * or quote_id, service_days, due_date, date, to_company_name, address_1,
 * address_2 and signature. Each line is worked out from quantity and
 * unit_price. The answer's message says what happened.
 */
export const createServiceRequest = (request: ServiceRequestInput): ApiCall<ServiceRequest> =>
  httpClient.post("/service-requests", request);

/** The whole request again (ref_no required): replaces the lines and sends it again, or changes them where it joined. */
export const updateServiceRequest = (id: Id, request: ServiceRequestInput): ApiCall<ServiceRequest> =>
  httpClient.put(`/service-requests/${id}`, request);

/** Needs records.delete. */
export const deleteServiceRequest = (id: Id): ApiCall<null> => httpClient.delete(`/service-requests/${id}`);

/** data: ref_no and sequence. */
export const getNextServiceRequestRef = (refType: string): ApiCall<NextRef> =>
  httpClient.get("/service-requests/next-ref", { params: { ref_type: refType } });
