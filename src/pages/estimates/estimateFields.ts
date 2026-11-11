import dayjs from "@/lib/dayjs";
import type { Dayjs } from "dayjs";
import { fromApiDate, toApiDate } from "@/utils/datetime";
import type { Estimate, EstimateDraft, EstimateInput, PriceLine } from "@/types";

// An estimate's form values: from the API's draft or a saved estimate, and
// back as the API takes them.

/** Visit frequencies the estimate PDF commonly prints; any text is taken. */
export const FREQUENCY_OPTIONS = ["Daily", "Weekly", "Bi-Weekly", "Monthly", "One-time"].map((value) => ({ value }));

const ADDRESS_AND_CONTACT = [
  "client_company_name",
  "address_line_1",
  "address_line_2",
  "city",
  "state",
  "zip",
  "contact_name",
  "contact_phone",
  "contact_fax",
  "contact_email",
] as const;

type AddressAndContact = (typeof ADDRESS_AND_CONTACT)[number];

/** A price line as the form holds it. */
export interface PriceLineValues {
  name?: string;
  frequency?: string;
  price?: number | null;
  hours?: number | null;
  personnel?: number | null;
  /** The service request that added it (step 6): sent back as it came. */
  service_request_id?: number | null;
}

/** The estimate form's values. */
export interface EstimateFormValues extends Partial<Record<AddressAndContact, string>> {
  user_id?: number;
  scope_of_work_id?: number;
  cost_calculation_id?: number;
  bid_id?: number;
  frequency?: string;
  signed_date?: Dayjs | null;
  price_lines?: PriceLineValues[];
}

const text = (value: unknown): string =>
  typeof value === "string" ? value.trim() : value === null || value === undefined ? "" : String(value);
const numberOrNull = (value: unknown): number | null =>
  value === null || value === undefined || value === "" ? null : Number(value);

/** The price lines of the form, as the API answers them. */
export const priceLinesOf = (lines: PriceLine[] = []): PriceLineValues[] =>
  lines.map((line) => ({
    name: line.name,
    frequency: line.frequency ?? undefined,
    price: line.price ?? null,
    hours: line.hours ?? null,
    personnel: line.personnel ?? null,
    // A line a service request brought (step 6): sent back as it came, so the
    // request can change or take its lines out later.
    service_request_id: line.service_request_id ?? null,
  }));

/** The lines a service request brought, which repricing from the calculation keeps. */
export const requestLinesOf = (lines: (PriceLineValues | undefined)[] = []): PriceLineValues[] =>
  (lines || []).filter((line): line is PriceLineValues => Boolean(line?.service_request_id));

/** What the lines add up to. */
export const priceTotal = (lines: (PriceLineValues | undefined)[] = []) =>
  Math.round((lines || []).reduce((sum, line) => sum + (Number(line?.price) || 0), 0) * 100) / 100;

/** Form values from GET /estimates/draft (or a saved estimate): links, company, contact, frequency and prices. */
export const valuesFromDraft = (draft: EstimateDraft | Estimate): EstimateFormValues => ({
  user_id: draft.user_id,
  scope_of_work_id: draft.scope_of_work_id ?? undefined,
  cost_calculation_id: draft.cost_calculation_id ?? undefined,
  bid_id: draft.bid_id ?? undefined,
  ...Object.fromEntries(ADDRESS_AND_CONTACT.map((field) => [field, draft[field] ?? ""])),
  frequency: draft.frequency ?? "",
  price_lines: priceLinesOf(draft.price_lines),
});

/** A saved estimate's form values. */
export const valuesFromEstimate = (estimate: Estimate): EstimateFormValues => ({
  ...valuesFromDraft(estimate),
  signed_date: fromApiDate(estimate.signed_date),
});

/** A new estimate's values: the draft, dated today. */
export const newEstimateValues = (draft?: EstimateDraft | null): EstimateFormValues => ({
  ...(draft ? valuesFromDraft(draft) : {}),
  signed_date: dayjs(),
});

/**
 * The estimate as the API takes it. Lines go when there are any (the form
 * asks for one); without them the API prices from the calculation.
 */
export function estimateBody(
  values: EstimateFormValues,
  { userId, signature }: { userId?: number; signature: string },
): EstimateInput {
  const lines = (values.price_lines || [])
    .filter((line) => line && text(line.name))
    .map((line) => ({
      name: text(line.name),
      frequency: text(line.frequency) || null,
      price: Number(line.price) || 0,
      hours: numberOrNull(line.hours),
      personnel: numberOrNull(line.personnel),
      ...(line.service_request_id ? { service_request_id: line.service_request_id } : {}),
    }));
  return {
    user_id: Number(userId ?? values.user_id),
    ...(Object.fromEntries(ADDRESS_AND_CONTACT.map((field) => [field, text(values[field])])) as Record<AddressAndContact, string>),
    frequency: text(values.frequency),
    signed_date: toApiDate(values.signed_date),
    signature,
    ...(values.scope_of_work_id ? { scope_of_work_id: values.scope_of_work_id } : {}),
    ...(values.cost_calculation_id ? { cost_calculation_id: values.cost_calculation_id } : {}),
    ...(values.bid_id ? { bid_id: values.bid_id } : {}),
    ...(lines.length ? { price_lines: lines } : {}),
  };
}
