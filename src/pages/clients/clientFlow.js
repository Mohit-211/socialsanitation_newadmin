// The client page works a client's documents in the order the office does:
// an enquiry, then sheets, a scope of work, a calculation, an estimate or a
// quote, a service request, a contract, and the bookings and invoices that
// follow. Every "New" action opens its form with the client already chosen,
// and the form brings the admin back here when it is saved.

/** The page's tabs, in flow order. `step` numbers the steps of the flow. */
export const CLIENT_TABS = Object.freeze([
  { key: "profile", label: "Profile" },
  { key: "enquiries", label: "Enquiries", flowKey: "enquiries" },
  { key: "sheets", label: "Client Sheets", flowKey: "client_sheets", step: 1 },
  { key: "scopes", label: "Scopes of Work", flowKey: "scopes_of_work", step: 2 },
  { key: "calculations", label: "Calculations", flowKey: "cost_calculations", step: 3 },
  { key: "estimates", label: "Estimates", flowKey: "estimates", step: 4 },
  { key: "quotes", label: "Quotes", flowKey: "quotes", step: 4 },
  { key: "service-requests", label: "Service Requests", flowKey: "service_requests", step: 5 },
  { key: "contracts", label: "Contracts", flowKey: "contracts", step: 6 },
  { key: "bookings", label: "Bookings", flowKey: "bookings", step: 7 },
  { key: "invoices", label: "Invoices", flowKey: "invoices", step: 8 },
]);

export const isClientTab = (key) => CLIENT_TABS.some((tab) => tab.key === key);

/** The client page, on one of its tabs. */
export const clientPagePath = (clientId, tab) =>
  `/viewUser/${clientId}${tab && tab !== "profile" ? `?tab=${tab}` : ""}`;

const withQuery = (path, query) => {
  const params = new URLSearchParams(
    Object.entries(query).filter(([, value]) => value !== undefined && value !== null && value !== ""),
  );
  const text = params.toString();
  return text ? `${path}?${text}` : path;
};

/** Where each "New" action goes, with the client (and any earlier step) chosen. */
export const NEW_DOCUMENT_PATHS = Object.freeze({
  calculation: (clientId, { scopeId } = {}) => withQuery("/cost-calculator", { clientId, scopeId }),
  estimate: (clientId) => withQuery("/generate-estimate", { clientId }),
  quote: (clientId) => `/service-quote/${clientId}`,
  service_request: (clientId) => withQuery("/generate-service-request", { clientId }),
  contract: (clientId) => withQuery("/create-contract-agreement", { clientId }),
  booking: (clientId) => withQuery("/create-client-booking", { clientId }),
  invoice: (clientId, { contractId } = {}) => withQuery("/generate-invoice", { clientId, contractId }),
});

/** Where each document opens for editing. */
export const EDIT_DOCUMENT_PATHS = Object.freeze({
  estimate: (id) => `/edit-service-estimate/${id}`,
  quote: (id) => `/edit-service-quote/${id}`,
  service_request: (id) => `/edit-service-request/${id}`,
  contract: (id) => `/edit-contract-agreement/${id}`,
  invoice: (id) => `/edit-invoice/${id}`,
  booking: (id) => `/viewBooking/${id}`,
});

/** After a form saves: back to the client page when it was opened from there. */
export function returnPathAfterSave(searchParams, tab, fallback) {
  const clientId = searchParams?.get?.("clientId");
  return clientId ? clientPagePath(clientId, tab) : fallback;
}

// Status words as people read them, with a tag color.
const STATUS_TAGS = {
  // signing
  pending_signature: { label: "Waiting for signature", color: "gold" },
  signed: { label: "Signed", color: "green" },
  completed: { label: "Signed", color: "green" },
  declined: { label: "Declined", color: "red" },
  voided: { label: "Voided", color: "default" },
  // quotes
  DRAFT: { label: "Draft", color: "default" },
  SAVED: { label: "Sent", color: "blue" },
  SIGNED: { label: "Signed", color: "green" },
  NOT_PAID: { label: "Not paid", color: "gold" },
  PAID: { label: "Paid", color: "green" },
  CASH_PAID: { label: "Paid (cash)", color: "green" },
  CHECK_PAID: { label: "Paid (check)", color: "green" },
  ACH_PAID: { label: "Paid (ACH)", color: "green" },
  EXPIRED: { label: "Expired", color: "default" },
  // invoices
  draft: { label: "Draft", color: "default" },
  scheduled: { label: "Scheduled", color: "cyan" },
  sent: { label: "Sent", color: "blue" },
  deposit_paid: { label: "Deposit paid", color: "lime" },
  overdue: { label: "Overdue", color: "red" },
  paid: { label: "Paid", color: "green" },
  cancelled: { label: "Cancelled", color: "default" },
  // enquiries
  new: { label: "New", color: "blue" },
  contacted: { label: "Contacted", color: "gold" },
  closed: { label: "Closed", color: "default" },
  // bookings
  UPCOMING: { label: "Upcoming", color: "blue" },
  ONGOING: { label: "In progress", color: "cyan" },
  COMPLETED: { label: "Completed", color: "green" },
  CANCELLED: { label: "Cancelled", color: "default" },
  PENDING: { label: "Pending", color: "gold" },
  active: { label: "Active", color: "green" },
  ending: { label: "Ending soon", color: "gold" },
  ended: { label: "Ended", color: "default" },
};

/** { label, color } for a status code, falling back to the code in words. */
export function statusTag(code) {
  if (!code) return { label: "—", color: "default" };
  return (
    STATUS_TAGS[code] ||
    STATUS_TAGS[String(code).toLowerCase()] || {
      label: String(code).replace(/_/g, " ").toLowerCase().replace(/^\w/, (c) => c.toUpperCase()),
      color: "default",
    }
  );
}

/** Money as people read it: $1,234.50. */
export const formatMoney = (value) =>
  value === null || value === undefined || value === "" || Number.isNaN(Number(value))
    ? "—"
    : Number(value).toLocaleString("en-US", { style: "currency", currency: "USD" });
