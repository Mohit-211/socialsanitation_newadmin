import httpClient from "@/services/httpClient";
import type { ApiCall } from "@/services/apiResult";
import type {
  ContractInvoiceDraft,
  Id,
  Invoice,
  InvoiceAnalytics,
  InvoiceImportResult,
  InvoiceInput,
  InvoicesMonthlySummary,
  InvoiceSummary,
  Items,
  ListQuery,
  NextRef,
  Paged,
} from "@/types";

// Invoices on /api/v2. Amounts are numbers; every invoice answers its state
// (draft, scheduled, sent, deposit_paid, overdue, paid or cancelled),
// contract_id, reminder_count and last_reminder_at.

/** Newest billing date first. Query: page, limit (≤ 50), month (2026-11), user_id, payment_status, search. */
export const listInvoices = (params?: ListQuery): ApiCall<Paged<InvoiceSummary>> => httpClient.get("/invoices", { params });

/** The invoice with its items, recurring schedule, deposit fields, paid_amount and paid_at. */
export const getInvoice = (id: Id): ApiCall<Invoice> => httpClient.get(`/invoices/${id}`);

/** quote_id, user_id or contract_id is required; a contract fills in the rest it can. */
export const createInvoice = (invoice: InvoiceInput): ApiCall<Invoice> => httpClient.post("/invoices", invoice);

/**
 * Only what changed. Leaving out items keeps the lines; sending items edits
 * the ones with an id, adds the others and removes the ones left out.
 */
export const updateInvoice = (id: Id, changes: InvoiceInput): ApiCall<Invoice> => httpClient.patch(`/invoices/${id}`, changes);

/** items: [{ id }] in the new order. */
export const reorderInvoiceItems = (id: Id, items: { id: Id }[]): ApiCall<Invoice> =>
  httpClient.patch(`/invoices/${id}/item-order`, { items });

/** { ref_no, sequence }: the reference the next invoice of this type gets. */
export const getNextInvoiceRef = (refType: string): ApiCall<NextRef> =>
  httpClient.get("/invoices/next-ref", { params: { ref_type: refType } });

/** Emails the remaining balance of a deposit invoice. */
export const sendInvoiceBalance = (id: Id): ApiCall<Invoice> => httpClient.post(`/invoices/${id}/send-balance`);

/** Invoices with a billing date from today. */
export const listUpcomingInvoices = (): ApiCall<Items<InvoiceSummary> | InvoiceSummary[]> => httpClient.get("/invoices/upcoming");

/** month: like 2026-11. The month's invoices by client, for the monthly report. */
export const getInvoicesMonthlySummary = (month: string): ApiCall<InvoicesMonthlySummary> =>
  httpClient.get("/invoices/monthly-summary", { params: { month } });

/** month: like 2026-11. The figures of the Invoice Analytics screen. */
export const getInvoiceAnalytics = (month: string): ApiCall<InvoiceAnalytics> =>
  httpClient.get("/invoices/analytics", { params: { month } });

/** One .csv of up to 5 MB. Answers what happened to each row. */
export const importInvoices = (file: File): ApiCall<InvoiceImportResult> => {
  const form = new FormData();
  form.append("docs", file);
  return httpClient.post("/invoices/import", form);
};

/** The PDF of an imported invoice (400 for any other). */
export const uploadInvoicePdf = (id: Id, file: File): ApiCall<Invoice> => {
  const form = new FormData();
  form.append("docs", file);
  return httpClient.post(`/invoices/${id}/pdf`, form);
};

/** Emails it at once, whatever its schedule. */
export const sendInvoice = (id: Id): ApiCall<Invoice> => httpClient.post(`/invoices/${id}/send`);

/** An email with the Square link and a note in the app. */
export const remindInvoice = (id: Id): ApiCall<Invoice> => httpClient.post(`/invoices/${id}/remind`);

/** method: "CHECK" or "ACH". Closes the online link. */
export const markInvoicePaid = (id: Id, method: "CHECK" | "ACH"): ApiCall<Invoice> =>
  httpClient.post(`/invoices/${id}/mark-paid`, { method });

/** Needs records.delete. Closes any waiting payment link. */
export const deleteInvoice = (id: Id): ApiCall<null> => httpClient.delete(`/invoices/${id}`);

/** What an invoice for the contract would hold, saving nothing. */
export const getContractInvoiceDraft = (contractId: Id): ApiCall<ContractInvoiceDraft> =>
  httpClient.get(`/contracts/${contractId}/invoice-draft`);
