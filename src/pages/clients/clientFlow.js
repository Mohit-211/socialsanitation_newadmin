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

/** A document's edit path opened from the client page, so saving comes back here. */
export const editPathFromClient = (kind, id, clientId) => `${EDIT_DOCUMENT_PATHS[kind](id)}?clientId=${clientId}`;
