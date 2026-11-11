import type { Dayjs } from "dayjs";

// The service request forms' state: the document's header, its lines and the
// admin's signature, as the two pages (new and edit) hold them.

/** A line as the form holds it: numbers arrive as typed text until saved. */
export interface RequestLine {
  service_id?: number;
  description: string;
  frequency: string;
  quantity: number | string | null;
  sqft: number | string;
  unit_price: number | string | null;
  amount: number | string;
  calculation_type?: string;
  hour?: number | string;
}

export interface RequestFormData {
  user_id?: number;
  ref: string;
  reference_type: string;
  service_days: string | null;
  dueDate: Dayjs | null;
  toCompany: string;
  address1: string;
  address2: string;
  items: RequestLine[];
  totalAmount: number | string;
  date: Dayjs | null;
  signature?: string | null;
}

/** What the lines add up to. */
export const linesTotal = (items: RequestLine[]) =>
  items.reduce((sum, item) => sum + (parseFloat(String(item.amount)) || 0), 0);
