import dayjs from "@/lib/dayjs";
import { fromApiDate, toApiDate } from "@/utils/datetime";

// An estimate's form values: from the API's draft or a saved estimate, and
// back as the API takes them.

/** Visit frequencies the estimate PDF commonly prints; any text is taken. */
export const FREQUENCY_OPTIONS = ["Daily", "Weekly", "Bi-Weekly", "Monthly", "One-time"].map((value) => ({ value }));

const text = (value) => (typeof value === "string" ? value.trim() : value) || "";
const numberOrNull = (value) => (value === null || value === undefined || value === "" ? null : Number(value));

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
];

/** The price lines of the form, as the API answers them. */
export const priceLinesOf = (lines = []) =>
  lines.map((line) => ({
    name: line.name,
    frequency: line.frequency ?? undefined,
    price: line.price ?? null,
    hours: line.hours ?? null,
    personnel: line.personnel ?? null,
  }));

/** What the lines add up to. */
export const priceTotal = (lines = []) =>
  Math.round((lines || []).reduce((sum, line) => sum + (Number(line?.price) || 0), 0) * 100) / 100;

/** Form values from GET /estimates/draft (or a saved estimate): links, company, contact, frequency and prices. */
export const valuesFromDraft = (draft) => ({
  user_id: draft.user_id,
  scope_of_work_id: draft.scope_of_work_id ?? undefined,
  cost_calculation_id: draft.cost_calculation_id ?? undefined,
  bid_id: draft.bid_id ?? undefined,
  ...Object.fromEntries(ADDRESS_AND_CONTACT.map((field) => [field, draft[field] ?? ""])),
  frequency: draft.frequency ?? "",
  price_lines: priceLinesOf(draft.price_lines),
});

/** A saved estimate's form values. */
export const valuesFromEstimate = (estimate) => ({
  ...valuesFromDraft(estimate),
  signed_date: fromApiDate(estimate.signed_date),
});

/** A new estimate's values: the draft, dated today. */
export const newEstimateValues = (draft) => ({ ...(draft ? valuesFromDraft(draft) : {}), signed_date: dayjs() });

/**
 * The estimate as the API takes it. Lines go when there are any (the form
 * asks for one); without them the API prices from the calculation.
 */
export function estimateBody(values, { userId, signature }) {
  const lines = (values.price_lines || [])
    .filter((line) => line && text(line.name))
    .map((line) => ({
      name: text(line.name),
      frequency: text(line.frequency) || null,
      price: Number(line.price) || 0,
      hours: numberOrNull(line.hours),
      personnel: numberOrNull(line.personnel),
    }));
  return {
    user_id: userId ?? values.user_id,
    ...Object.fromEntries(ADDRESS_AND_CONTACT.map((field) => [field, text(values[field])])),
    frequency: text(values.frequency),
    signed_date: toApiDate(values.signed_date),
    signature,
    ...(values.scope_of_work_id ? { scope_of_work_id: values.scope_of_work_id } : {}),
    ...(values.cost_calculation_id ? { cost_calculation_id: values.cost_calculation_id } : {}),
    ...(values.bid_id ? { bid_id: values.bid_id } : {}),
    ...(lines.length ? { price_lines: lines } : {}),
  };
}
