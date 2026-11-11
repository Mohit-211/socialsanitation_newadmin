import type { ClientPick } from "@/types";

// Words and numbers as people read them: document statuses and money.

// Status words as people read them, with a tag color.
export interface StatusWord {
  label: string;
  color: string;
}

const STATUS_TAGS: Record<string, StatusWord> = {
  // signing
  pending_signature: { label: "Waiting for signature", color: "gold" },
  signed: { label: "Signed", color: "green" },
  completed: { label: "Signed", color: "green" },
  declined: { label: "Declined", color: "red" },
  voided: { label: "Voided", color: "default" },
  // DocuSign couldn't reach the signer: the email to them bounced
  failed: { label: "Email bounced", color: "red" },
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
  // bookings (visit statuses: ACCEPTED is booked, SUCCESS is done)
  ACCEPTED: { label: "Booked", color: "blue" },
  SUCCESS: { label: "Completed", color: "green" },
  REJECTED: { label: "Declined", color: "default" },
  UPCOMING: { label: "Upcoming", color: "blue" },
  ONGOING: { label: "In progress", color: "cyan" },
  COMPLETED: { label: "Completed", color: "green" },
  CANCELLED: { label: "Cancelled", color: "default" },
  PENDING: { label: "Pending", color: "gold" },
  active: { label: "Active", color: "green" },
  ending: { label: "Ending soon", color: "gold" },
  ended: { label: "Ended", color: "default" },
  // attendance
  PRESENT: { label: "Present", color: "green" },
  ABSENT: { label: "Absent", color: "red" },
  "ON LEAVE": { label: "On leave", color: "gold" },
  // account requests
  open: { label: "Open", color: "blue" },
  done: { label: "Done", color: "green" },
};

/** { label, color } for a status code, falling back to the code in words. */
export function statusTag(code: string | null | undefined): StatusWord {
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
export const formatMoney = (value: number | string | null | undefined): string =>
  value === null || value === undefined || value === "" || Number.isNaN(Number(value))
    ? "—"
    : Number(value).toLocaleString("en-US", { style: "currency", currency: "USD" });

/** A client pick's address (address_1, city, state, country) as one line. */
export const addressLineOf = (client: ClientPick | null | undefined): string =>
  [client?.address?.address_1, client?.address?.city, client?.address?.state, client?.address?.country]
    .filter(Boolean)
    .join(", ");
