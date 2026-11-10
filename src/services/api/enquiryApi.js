import httpClient from "@/services/httpClient";

// Clients' enquiries from the app: services, the date needed, an address and
// a note. The office follows each one up and marks it contacted, then closed.

export const ENQUIRY_STATUSES = Object.freeze([
  { value: "new", label: "New" },
  { value: "contacted", label: "Contacted" },
  { value: "closed", label: "Closed" },
]);

/** Query: status, client_id, page, limit. Newest first. */
export const listEnquiries = (params) => httpClient.get("/enquiries", { params });

export const getEnquiry = (id) => httpClient.get(`/enquiries/${id}`);

export const setEnquiryStatus = (id, status) => httpClient.patch(`/enquiries/${id}`, { status });
