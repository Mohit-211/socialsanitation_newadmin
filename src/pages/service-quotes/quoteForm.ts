import type { Dayjs } from "dayjs";

// The quote forms' state: the document's header, its lines and the admin's
// signature, as the two pages (new and edit) hold them.

/** A line as the form holds it: numbers arrive as typed text until saved. */
export interface QuoteLine {
  service_id?: number;
  /** The service request that added it (step 6): sent back as it came. */
  service_request_id?: number | null;
  description: string;
  frequency: string;
  quantity: number | string | null;
  calculation_type: string;
  sqft: number | string | null;
  hour?: number | string | null;
  unit_price: number | string | null;
  amount: number | string | null;
}

export interface QuoteFormData {
  ref: string;
  reference_type: string;
  serviceDates: Dayjs | null;
  dueDate: Dayjs | null;
  toCompany: string;
  address1: string;
  address2: string;
  cc_email?: string;
  tip?: string;
  items: QuoteLine[];
  totalAmount: number | string;
  date: Dayjs | null;
  signature?: string | null;
}

/** What the lines add up to. */
export const linesTotal = (items: QuoteLine[]) =>
  items.reduce((sum, item) => sum + (parseFloat(String(item.amount)) || 0), 0);
