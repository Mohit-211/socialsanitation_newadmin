// Documents the client signs through DocuSign (estimates, contracts and
// service requests): where one stands, and what saving or Resend does then.
// Estimates and contracts say draft, pending_signature, signed, declined,
// voided or failed; service requests say DRAFT, SAVED (sent), SIGNED,
// DECLINED, VOIDED or FAILED.

import { statusTag } from "@/utils/format";

const codeOf = (status) => String(status || "").toLowerCase();

const ENDS = {
  declined: "The client declined to sign it.",
  voided: "Its copy for signing was voided.",
  failed: "DocuSign couldn't deliver it: the email to the client bounced. Check their email address.",
};

/** A copy is waiting for the client's signature. */
export const isAwaitingSignature = (status) => ["pending_signature", "saved"].includes(codeOf(status));

/** Resend asks DocuSign to email the waiting copy again, so it only fits while one waits. */
export const canResend = isAwaitingSignature;

/** Never sent yet. */
export const isDraft = (status) => codeOf(status) === "draft";

/** The note an edit page shows: where the document stands and what saving does ({ type, title }). */
export function savingNote(status) {
  const code = codeOf(status);
  if (code === "draft") {
    return { type: "info", title: "Not sent yet. Saving makes the PDF and sends it to the client for signature." };
  }
  if (isAwaitingSignature(code)) {
    return {
      type: "info",
      title: "A copy is waiting for the client's signature. Saving sends a new copy and voids the one waiting.",
    };
  }
  if (ENDS[code]) return { type: "warning", title: `${ENDS[code]} Saving sends the client a new copy to sign.` };
  return { type: "info", title: "Saving makes a new PDF and sends the client a new copy to sign." };
}

/** An estimate's or contract's statuses, for a list's status filter. */
export const SIGNING_STATUS_OPTIONS = ["draft", "pending_signature", "signed", "declined", "voided", "failed"].map(
  (value) => ({ value, label: statusTag(value).label }),
);
