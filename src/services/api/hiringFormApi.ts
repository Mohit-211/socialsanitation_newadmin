import httpClient from "@/services/httpClient";
import type { ApiCall } from "@/services/apiResult";
import type { HiringApplication, HiringApplicationSummary, HiringFormMatch, Id, Items, ListQuery, Paged } from "@/types";

// Hiring applications sent from the website. A worker makes each one's PDF
// and emails; processing_status says how far it got (pending, done, failed,
// or null for ones that came in before).

/** Query: page, limit, search (name or email), status. No form answers in the list. */
export const listHiringApplications = (params?: ListQuery): ApiCall<Paged<HiringApplicationSummary>> =>
  httpClient.get("/hiring-applications", { params });

/** One application, with form_data (every section by name) and attachments (id, file_name, url). */
export const getHiringApplication = (id: Id): ApiCall<HiringApplication> => httpClient.get(`/hiring-applications/${id}`);

/** Super Admin only. */
export const deleteHiringApplication = (id: Id): ApiCall<null> => httpClient.delete(`/hiring-applications/${id}`);

/** Only for a failed one (else 409): its PDF and emails are tried again. */
export const retryHiringApplication = (id: Id): ApiCall<HiringApplicationSummary> =>
  httpClient.post(`/hiring-applications/${id}/retry`);

/** Applications by email (exact) or name (part of it), with the address, for a new employee. */
export const findHiringForms = ({ email, name }: { email?: string; name?: string }): ApiCall<Items<HiringFormMatch>> =>
  httpClient.get("/hiring-applications/matches", { params: { email: email || undefined, name: name || undefined } });
