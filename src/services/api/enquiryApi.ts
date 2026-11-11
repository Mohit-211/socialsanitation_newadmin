import httpClient from "@/services/httpClient";
import type { ApiCall } from "@/services/apiResult";
import type { Enquiry, EnquiryStatus, Id, ListQuery, Option, Paged } from "@/types";

// Clients' enquiries from the app: services, the date needed, an address and
// a note. The office follows each one up and marks it contacted, then closed.

export const ENQUIRY_STATUSES: Option<EnquiryStatus>[] = [
  { value: "new", label: "New" },
  { value: "contacted", label: "Contacted" },
  { value: "closed", label: "Closed" },
];

/** Query: status, client_id, page, limit. Newest first. */
export const listEnquiries = (params?: ListQuery): ApiCall<Paged<Enquiry>> => httpClient.get("/enquiries", { params });

export const getEnquiry = (id: Id): ApiCall<Enquiry> => httpClient.get(`/enquiries/${id}`);

export const setEnquiryStatus = (id: Id, status: EnquiryStatus): ApiCall<Enquiry> =>
  httpClient.patch(`/enquiries/${id}`, { status });
