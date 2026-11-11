// What a new service request adds to (step 6 of the client flow): one of the
// client's estimates or quotes, or neither. Made for one, its lines join that
// document, which goes to the client again, and the request isn't sent on its
// own. A paid quote takes no new lines, so a request for it goes out alone.

import type { ClientFlow } from "@/types";

const PAID = ["PAID", "CASH_PAID", "CHECK_PAID", "ACH_PAID"];

/** What a request adds to: { estimate_id }, { quote_id }, or nothing. */
export type AddsTo = { estimate_id?: number; quote_id?: number };

/** A row of the client's estimates or quotes the picker shows. */
export interface ParentRow {
  id: number;
  title: string;
  status?: string | null;
  payment_status?: string | null;
}

/** The picked estimate or quote. */
export type Parent = { kind: "estimate" | "quote"; row: ParentRow };

/** Whether a quote row (from the client's documents) is paid. */
export const isPaidQuote = (quote: ParentRow | null | undefined) => PAID.includes(String(quote?.payment_status || "").toUpperCase());

/** { kind, row } for the picked estimate or quote, or null. */
export function pickedParent(
  documents: Pick<ClientFlow, "estimates" | "quotes"> | null | undefined,
  { estimate_id: estimateId, quote_id: quoteId }: AddsTo = {},
): Parent | null {
  if (estimateId) {
    const row = documents?.estimates?.find((estimate) => estimate.id === estimateId);
    return { kind: "estimate", row: row ?? { id: estimateId, title: `Estimate ${estimateId}` } };
  }
  if (quoteId) {
    const row = documents?.quotes?.find((quote) => quote.id === quoteId);
    return { kind: "quote", row: row ?? { id: quoteId, title: `Quote ${quoteId}` } };
  }
  return null;
}

/** Whether the request's lines go into its parent (else the request goes out alone). */
export const joinsParent = (parent: Parent | null): parent is Parent =>
  parent !== null && !(parent.kind === "quote" && isPaidQuote(parent.row));

/** What saving does with the request and the document it adds to. */
export function addsToNote(parent: Parent | null): string | null {
  if (!parent) return null;
  const { kind, row } = parent;
  const name = row.title;
  if (kind === "estimate") {
    return `Its lines join estimate ${name}, which goes to the client again for a new signature (the copy waiting now is voided). The request isn't sent on its own.`;
  }
  if (isPaidQuote(row)) {
    return `Quote ${name} is paid, so it takes no new lines: this request goes to the client on its own, for signature.`;
  }
  if (String(row.status).toUpperCase() === "DRAFT") {
    return `Its lines join the draft quote ${name}; they go out when you send that quote. The request isn't sent on its own.`;
  }
  return `Its lines join quote ${name}, which is emailed and texted to the client again with 30 more days. The request isn't sent on its own.`;
}
