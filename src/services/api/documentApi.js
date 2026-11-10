import httpClient from "@/services/httpClient";

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

const pathOf = (kind) => {
  const entry = DOCUMENT_KINDS[kind];
  if (!entry) throw new Error(`Unknown document kind: ${kind}`);
  return entry.path;
};

export const shareDocument = (kind, id) => httpClient.post(`/${pathOf(kind)}/${id}/share`);

export const unshareDocument = (kind, id) => httpClient.post(`/${pathOf(kind)}/${id}/unshare`);

/** Needs records.delete. */
export const deleteDocument = (kind, id) => httpClient.delete(`/${pathOf(kind)}/${id}`);
