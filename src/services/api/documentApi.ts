import httpClient from "@/services/httpClient";
import type { ApiCall } from "@/services/apiResult";
import type { Id } from "@/types";

// The documents of a client's flow, by the kind codes the backend uses.
// Sharing shows a document in the client app and tells the client by inbox
// note, push and email; sending one (DocuSign, the quote email) shares it too.

export const DOCUMENT_KINDS = Object.freeze({
  client_sheet: { path: "client-sheets", name: "Initial Client Sheet" },
  scope_of_work: { path: "scopes", name: "Scope of Work" },
  estimate: { path: "estimates", name: "Service Estimate" },
  quote: { path: "quotes", name: "Service Quote" },
  service_request: { path: "service-requests", name: "Service Request" },
  contract: { path: "contracts", name: "Contract Agreement" },
});

export type DocumentKind = keyof typeof DOCUMENT_KINDS;

const pathOf = (kind: DocumentKind) => {
  const entry = DOCUMENT_KINDS[kind];
  if (!entry) throw new Error(`Unknown document kind: ${kind}`);
  return entry.path;
};

/** What sharing or unsharing answers: when it was shared, or null. */
export interface ShareState {
  shared_at?: string | null;
}

export const shareDocument = (kind: DocumentKind, id: Id): ApiCall<ShareState> =>
  httpClient.post(`/${pathOf(kind)}/${id}/share`);

export const unshareDocument = (kind: DocumentKind, id: Id): ApiCall<ShareState> =>
  httpClient.post(`/${pathOf(kind)}/${id}/unshare`);

/** Needs records.delete. */
export const deleteDocument = (kind: DocumentKind, id: Id): ApiCall<null> => httpClient.delete(`/${pathOf(kind)}/${id}`);
