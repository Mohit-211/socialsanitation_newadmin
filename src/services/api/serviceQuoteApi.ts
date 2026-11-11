import httpClient from "@/services/httpClient";
import type { ApiCall } from "@/services/apiResult";
import type { Id, Items, ListQuery, NextRef, Paged, PaidQuotesSummary, Quote, QuoteDraftSummary, QuoteInput } from "@/types";

// Service quotes: priced lines, paid through the invoice made from them (the
// quote turns paid when that invoice is). Sending one makes the PDF, then
// emails and texts the client. Drafts
// keep a quote being written until it is sent. Share and Unshare live in
// documentApi.ts.

/**
 * Query: page, limit, month, user_id, status (DRAFT, SAVED, SIGNED),
 * job_status, payment_status, search (reference or company).
 */
export const listQuotes = (params?: ListQuery): ApiCall<Paged<Quote>> => httpClient.get("/quotes", { params });

/** One quote, with items, client and signature. */
export const getQuote = (id: Id): ApiCall<Quote> => httpClient.get(`/quotes/${id}`);

/**
 * user_id and items are required, with ref_no or ref_type; also
 * service_dates, due_date, date, to_company_name, address_1, address_2,
 * signature and cc_email. A total of 0 is refused.
 */
export const createQuote = (quote: QuoteInput): ApiCall<Quote> => httpClient.post("/quotes", quote);

/** The whole quote again (ref_no required): replaces the lines, makes a new link and sends it again. */
export const updateQuote = (id: Id, quote: QuoteInput): ApiCall<Quote> => httpClient.put(`/quotes/${id}`, quote);

/** Needs records.delete. Closes its link. */
export const deleteQuote = (id: Id): ApiCall<null> => httpClient.delete(`/quotes/${id}`);

/** method: "CHECK" or "ACH". Closes the link. */
export const markQuotePaid = (id: Id, method: "CHECK" | "ACH"): ApiCall<Quote> =>
  httpClient.post(`/quotes/${id}/mark-paid`, { method });

export const markQuoteBooked = (id: Id): ApiCall<Quote> => httpClient.post(`/quotes/${id}/mark-booked`);

/** data: ref_no and sequence. */
export const getNextQuoteRef = (refType: string): ApiCall<NextRef> =>
  httpClient.get("/quotes/next-ref", { params: { ref_type: refType } });

/** data.items: each client's user_id, name, email and the quotes they paid that month. */
export const getQuotesPaidSummary = (month: string): ApiCall<Items<PaidQuotesSummary>> =>
  httpClient.get("/quotes/paid-summary", { params: { month } });

// --- Drafts --------------------------------------------------------------------

/** data.items: id, ref_type, ref_no, updated_at. */
export const listQuoteDrafts = (userId: Id): ApiCall<Items<QuoteDraftSummary>> =>
  httpClient.get("/quote-drafts", { params: { user_id: userId } });

/** The client's latest draft with its items, or null. */
export const getLatestQuoteDraft = (userId: Id): ApiCall<Quote | null> =>
  httpClient.get("/quote-drafts/latest", { params: { user_id: userId } });

/** user_id, with ref_no or ref_type; the rest can wait. */
export const createQuoteDraft = (draft: QuoteInput): ApiCall<Quote> => httpClient.post("/quote-drafts", draft);

export const updateQuoteDraft = (id: Id, draft: QuoteInput): ApiCall<Quote> => httpClient.put(`/quote-drafts/${id}`, draft);

/** Needs records.delete. */
export const deleteQuoteDraft = (id: Id): ApiCall<null> => httpClient.delete(`/quote-drafts/${id}`);

/** Turns the draft into a quote and sends it; the same fields as createQuote. */
export const sendQuoteDraft = (id: Id, quote: QuoteInput): ApiCall<Quote> => httpClient.post(`/quote-drafts/${id}/send`, quote);
