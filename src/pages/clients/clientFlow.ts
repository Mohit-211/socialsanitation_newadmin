import type { ClientFlow, Id } from "@/types";

// The client page works a client's documents in the order the office does:
// an enquiry, then sheets, a scope of work, a calculation, an estimate or a
// quote, a service request, a contract, and the bookings and invoices that
// follow. Every "New" action opens its form with the client already chosen,
// and the form brings the admin back here when it is saved.

const TABS = Object.freeze([
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
] as const);

export type ClientTab = (typeof TABS)[number]["key"];

export interface ClientTabDef {
  key: ClientTab;
  label: string;
  /** The list of the client page's answer it shows. */
  flowKey?: Exclude<keyof ClientFlow, "client" | "addresses">;
  /** Its step in the flow. */
  step?: number;
}

/** The page's tabs, in flow order. `step` numbers the steps of the flow. */
export const CLIENT_TABS: readonly ClientTabDef[] = TABS;

export const isClientTab = (key: string | null | undefined): key is ClientTab =>
  CLIENT_TABS.some((tab) => tab.key === key);

/** The client page, on one of its tabs. */
export const clientPagePath = (clientId: Id, tab?: ClientTab | null) =>
  `/viewUser/${clientId}${tab && tab !== "profile" ? `?tab=${tab}` : ""}`;

type Query = Record<string, Id | null | undefined>;

const withQuery = (path: string, query: Query) => {
  const params = new URLSearchParams(
    Object.entries(query)
      .filter((entry): entry is [string, Id] => entry[1] !== undefined && entry[1] !== null && entry[1] !== "")
      .map(([key, value]) => [key, String(value)]),
  );
  const text = params.toString();
  return text ? `${path}?${text}` : path;
};

type MaybeId = Id | null | undefined;

/** Where each "New" action goes, with the client (and any earlier step) chosen. */
export const NEW_DOCUMENT_PATHS = Object.freeze({
  calculation: (clientId: Id, { scopeId }: { scopeId?: MaybeId } = {}) =>
    withQuery("/cost-calculator", { clientId, scopeId }),
  estimate: (
    clientId: Id,
    { scopeId, calculationId, bidId }: { scopeId?: MaybeId; calculationId?: MaybeId; bidId?: MaybeId } = {},
  ) => withQuery("/generate-estimate", { clientId, scopeId, calculationId, bidId }),
  quote: (
    clientId: Id,
    { estimateId, calculationId, scopeId }: { estimateId?: MaybeId; calculationId?: MaybeId; scopeId?: MaybeId } = {},
  ) => withQuery(`/service-quote/${clientId}`, { estimateId, calculationId, scopeId }),
  // A request can add to one of the client's estimates or quotes (step 6).
  service_request: (clientId: Id, { estimateId, quoteId }: { estimateId?: MaybeId; quoteId?: MaybeId } = {}) =>
    withQuery("/generate-service-request", { clientId, estimateId, quoteId }),
  contract: (clientId: Id, { estimateId }: { estimateId?: MaybeId } = {}) =>
    withQuery("/create-contract-agreement", { clientId, estimateId }),
  booking: (clientId: Id) => withQuery("/create-client-booking", { clientId }),
  invoice: (clientId: Id, { contractId }: { contractId?: MaybeId } = {}) =>
    withQuery("/generate-invoice", { clientId, contractId }),
});

export type NewDocumentKind = keyof typeof NEW_DOCUMENT_PATHS;

/** Where each document opens for editing. */
export const EDIT_DOCUMENT_PATHS = Object.freeze({
  estimate: (id: Id) => `/edit-service-estimate/${id}`,
  quote: (id: Id) => `/edit-service-quote/${id}`,
  service_request: (id: Id) => `/edit-service-request/${id}`,
  contract: (id: Id) => `/edit-contract-agreement/${id}`,
  invoice: (id: Id) => `/edit-invoice/${id}`,
  booking: (id: Id) => `/viewBooking/${id}`,
});

export type EditableDocumentKind = keyof typeof EDIT_DOCUMENT_PATHS;

/** After a form saves: back to the client page when it was opened from there. */
export function returnPathAfterSave(searchParams: URLSearchParams | null | undefined, tab: ClientTab, fallback: string) {
  const clientId = searchParams?.get?.("clientId");
  return clientId ? clientPagePath(clientId, tab) : fallback;
}

/** A document's edit path opened from the client page, so saving comes back here. */
export const editPathFromClient = (kind: EditableDocumentKind, id: Id, clientId: Id) =>
  `${EDIT_DOCUMENT_PATHS[kind](id)}?clientId=${clientId}`;
