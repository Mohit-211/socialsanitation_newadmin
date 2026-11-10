import { fromApiDate, fromApiTime, toApiDate, toApiTime, todayInBusinessTz } from "@/utils/datetime";

// The invoice form's options and lines, shared by the create and edit pages:
// how a line is priced (as the backend prices it), how a line comes from the
// API and goes back, and the address lines of the To: block.

export const REF_TYPE_OPTIONS = [
  { value: "RHK", label: "RHK (Residential - Housekeeping)" },
  { value: "RM", label: "RM (Residential - Maintenance)" },
  { value: "RFM", label: "RFM (Residential - Floor Maintenance)" },
  { value: "CHK", label: "CHK (Commercial - Housekeeping)" },
  { value: "CM", label: "CM (Commercial - Maintenance)" },
  { value: "CFM", label: "CFM (Commercial - Floor Maintenance)" },
];

export const FREQUENCY_OPTIONS = ["One-Time", "Weekly", "Bi-Weekly", "Monthly", "Quarterly", "Yearly"].map((value) => ({
  value,
  label: value,
}));

export const CALCULATION_TYPE_OPTIONS = [
  { value: "na", label: "N/A" },
  { value: "sqft", label: "Sqft" },
  { value: "hour", label: "Hour" },
];

export const IS_RECURRING_OPTIONS = [
  { value: false, label: "No" },
  { value: true, label: "Yes" },
];

export const RECURRING_FREQUENCY_OPTIONS = [
  { value: "WEEKLY", label: "Weekly" },
  { value: "BIWEEKLY", label: "Bi-Weekly" },
  { value: "MONTHLY", label: "Monthly" },
  { value: "QUARTERLY", label: "Quarterly" },
  { value: "YEARLY", label: "Yearly" },
];

export const DEFAULT_DEPOSIT_PERCENTAGE = 25;

/** Payment stages where the backend refuses a change to the total or the deposit terms. */
export const TERMS_LOCKED_STAGES = ["DEPOSIT_PAID", "BALANCE_PENDING", "COMPLETED"];

/** Payment stages where the balance has gone out, so its date is final. */
export const BALANCE_DATE_LOCKED_STAGES = ["BALANCE_PENDING", "COMPLETED"];

// "2:00 pm", "14:05", "2pm" as minutes since midnight, or null.
const clockMinutes = (raw) => {
  const match = raw
    .trim()
    .toLowerCase()
    .replace(/\s*:\s*/g, ":")
    .match(/^(\d{1,2})(?::(\d{2}))?\s*(am|pm)?$/);
  if (!match) return null;
  let hours = parseInt(match[1], 10);
  const minutes = match[2] ? parseInt(match[2], 10) : 0;
  const meridiem = match[3];
  if (minutes > 59) return null;
  if (meridiem) {
    if (hours < 1 || hours > 12) return null;
    if (meridiem === "am") hours = hours === 12 ? 0 : hours;
    else hours = hours === 12 ? 12 : hours + 12;
  } else if (hours > 23) {
    return null;
  }
  return hours * 60 + minutes;
};

/**
 * Hours from "2:00 PM - 4:00 PM", "14:05 to 16:00", "2pm-4pm" or a plain
 * number, to two decimals; an end before the start runs past midnight.
 * Null when it can't be read.
 */
export function parseHourRange(rawInput) {
  if (!rawInput || typeof rawInput !== "string") return null;
  const parts = rawInput
    .trim()
    .replace(/–|—/g, "-")
    .replace(/\bto\b/gi, "-")
    .split("-")
    .map((part) => part.trim())
    .filter(Boolean);
  if (parts.length !== 2) {
    const plain = parseFloat(rawInput);
    return Number.isFinite(plain) ? plain : null;
  }
  const start = clockMinutes(parts[0]);
  const end = clockMinutes(parts[1]);
  if (start === null || end === null) return null;
  let diff = end - start;
  if (diff <= 0) diff += 24 * 60;
  return Math.round((diff / 60) * 100) / 100;
}

/** Up to 6 decimals, without trailing zeros; "" for nothing. */
export function formatAmount(value) {
  if (value === null || value === undefined || value === "") return "";
  const number = Number(value);
  return Number.isFinite(number) ? number.toFixed(6).replace(/\.?0+$/, "") : "";
}

export const newLine = () => ({
  description: "",
  frequency: "",
  quantity: 1,
  calculation_type: "sqft",
  sqft: "N/A",
  hour: "",
  hour_raw: "",
  unit_price: "",
  amount: "",
  start_time: null,
  end_time: null,
});

/** A line of the form from a line the API sent (an invoice's, or a contract draft's). */
export const lineFromApi = (item = {}, defaults = {}) => ({
  ...newLine(),
  ...defaults,
  id: item.id,
  description: item.description || "",
  frequency: item.frequency || defaults.frequency || "",
  quantity: item.quantity ?? 1,
  calculation_type: item.calculation_type || defaults.calculation_type || "na",
  sqft: item.sqft ?? "N/A",
  hour: item.hour ?? "",
  hour_raw: item.hour !== null && item.hour !== undefined && item.hour !== "" ? String(item.hour) : "",
  unit_price: item.unit_price ?? "",
  amount: item.amount ?? "",
  start_time: fromApiTime(item.start_time),
  end_time: fromApiTime(item.end_time),
});

// The hours or square feet a line is charged by, or 1 when it has none.
const measureOf = ({ calculation_type: type, hour, sqft }) => {
  const measure = Number(type === "hour" ? hour : type === "sqft" ? sqft : null);
  return measure > 0 ? measure : 1;
};

/**
 * Each line's amount (quantity × unit price × its hours or square feet, as
 * the backend works it out) and the total in whole cents.
 */
export function priceLines(items) {
  const lines = items.map((item) => {
    const amount = Number(item.quantity || 1) * Number(item.unit_price || 0) * measureOf(item);
    return { ...item, amount: Number.isFinite(amount) ? amount : 0 };
  });
  const total = Math.round(lines.reduce((sum, line) => sum + line.amount, 0) * 100) / 100;
  return { items: lines, total };
}

/** A line as the API takes it; times go as HH:mm, or "" to clear them. */
export const lineBody = (line) => ({
  ...(line.id ? { id: line.id } : {}),
  description: line.description?.trim(),
  frequency: line.frequency,
  quantity: Number(line.quantity || 1),
  calculation_type: line.calculation_type,
  sqft: line.calculation_type === "sqft" ? line.sqft : null,
  hour: line.calculation_type === "hour" ? Number(line.hour || 0) : null,
  unit_price: Number(line.unit_price || 0),
  amount: Number(line.amount || 0),
  start_time: toApiTime(line.start_time) || "",
  end_time: toApiTime(line.end_time) || "",
});

/** Why the lines can't be saved yet, or null. */
export function linesProblem(items) {
  const missing = items.findIndex((item) => !item.description?.trim() || !item.frequency || !Number(item.unit_price));
  if (missing >= 0) return `Line ${missing + 1} needs a description, a frequency and a unit price.`;
  const halfTimed = items.findIndex((item) => !item.start_time !== !item.end_time);
  if (halfTimed >= 0) return `Line ${halfTimed + 1} needs both a start and an end time on site, or neither.`;
  return null;
}

/** The To: lines of an address the API sent: the street, then city, state and ZIP. */
export function addressLinesOf(address) {
  if (!address) return { address1: "", address2: "" };
  const street = [address.address, address.address_line_2].filter(Boolean).join(", ");
  const stateZip = [address.state?.code || address.state?.name, address.postal_code].filter(Boolean).join(" ");
  return {
    address1: street,
    address2: [address.city?.name, stateZip].filter(Boolean).join(", "),
  };
}

/** An address as a picker shows it. */
export const addressLabel = (address) =>
  [address.label, address.one_line || addressLinesOf(address).address1].filter(Boolean).join(" · ");

/** The ref type an invoice's reference starts with (RHK12 → RHK). */
export const refTypeOf = (refNo) => String(refNo || "").match(/^[A-Za-z]+/)?.[0] || "";

/** "2026-11-01 - 2026-11-30" (or US dates) as two date picker values. */
export function serviceDatesOf(text) {
  const [start, end] = String(text || "").split(" - ");
  return { service_start: fromApiDate(start), service_end: fromApiDate(end) };
}

/** A date picker value as the API takes it, or null. */
export const apiDate = (value) => toApiDate(value) || null;

// ---------------------------------------------------------------------------
// The form's values, and the API bodies made from them

/** A new invoice's values: dated today, one empty line. */
export const blankValues = () => ({
  user_id: undefined,
  contract_id: undefined,
  ref: "",
  reference_type: undefined,
  custom_ref_no: "",
  useCustomRef: false,
  is_recurring: false,
  recurring_frequency: "MONTHLY",
  recurring_end_date: null,
  recurring_max_occurrences: null,
  deposit_required: false,
  deposit_percentage: DEFAULT_DEPOSIT_PERCENTAGE,
  balance_date: null,
  billing_date: null,
  service_start: null,
  service_end: null,
  dueDate: null,
  date: fromApiDate(todayInBusinessTz()),
  toCompany: "",
  address1: "",
  address2: "",
  event_name: "",
  signature: null,
  items: [newLine()],
});

/** A new invoice for a contract, from GET /contracts/:id/invoice-draft. */
export const valuesFromDraft = (draft) => ({
  ...blankValues(),
  user_id: draft.user_id,
  contract_id: draft.contract_id,
  toCompany: draft.to_company_name || "",
  address1: draft.address_1 || "",
  address2: draft.address_2 || "",
  billing_date: fromApiDate(draft.billing_date),
  date: fromApiDate(draft.invoice_date),
  dueDate: fromApiDate(draft.due_date),
  service_start: fromApiDate(draft.service_start),
  service_end: fromApiDate(draft.service_end),
  is_recurring: Boolean(draft.is_recurring),
  recurring_frequency: draft.recurring_frequency || "MONTHLY",
  recurring_max_occurrences: draft.recurring_max_occurrences ?? null,
  items: draft.items?.length
    ? draft.items.map((item) => lineFromApi(item, { frequency: "Monthly", calculation_type: "na" }))
    : [newLine()],
});

/** A saved invoice's values, from GET /invoices/:id. */
export function valuesFromInvoice(invoice) {
  const recurring = invoice.recurring;
  return {
    ...blankValues(),
    user_id: invoice.user_id,
    contract_id: invoice.contract_id ?? undefined,
    ref: invoice.ref_no || "",
    reference_type: refTypeOf(invoice.ref_no),
    custom_ref_no: invoice.custom_ref_no || "",
    useCustomRef: Boolean(invoice.custom_ref_no),
    is_recurring: Boolean(recurring) && recurring.status !== "CANCELLED",
    recurring_frequency: recurring?.frequency || "MONTHLY",
    recurring_end_date: fromApiDate(recurring?.end_date),
    recurring_max_occurrences: recurring?.max_occurrences ?? null,
    deposit_required: Boolean(invoice.deposit_required),
    deposit_percentage: Number(invoice.deposit_percentage) || DEFAULT_DEPOSIT_PERCENTAGE,
    balance_date: fromApiDate(invoice.balance_due_date),
    billing_date: fromApiDate(invoice.billing_date),
    ...serviceDatesOf(invoice.service_dates),
    dueDate: fromApiDate(invoice.due_date),
    date: fromApiDate(invoice.invoice_date ?? invoice.date),
    toCompany: invoice.to_company_name || "",
    address1: invoice.address_1 || "",
    address2: invoice.address_2 || "",
    event_name: invoice.event_name || "",
    signature: invoice.signature || null,
    items: invoice.items?.length ? invoice.items.map((item) => lineFromApi(item)) : [newLine()],
  };
}

// The fields create and update share.
const commonBody = (values, items) => ({
  custom_ref_no: values.useCustomRef && values.custom_ref_no?.trim() ? values.custom_ref_no.trim() : null,
  billing_date: apiDate(values.billing_date),
  service_start: apiDate(values.service_start),
  service_end: apiDate(values.service_end),
  due_date: apiDate(values.dueDate),
  to_company_name: values.toCompany?.trim() || "",
  address_1: values.address1?.trim() || "",
  address_2: values.address2?.trim() || "",
  event_name: values.event_name?.trim() || null,
  is_recurring: Boolean(values.is_recurring),
  recurring_frequency: values.is_recurring ? values.recurring_frequency : null,
  recurring_end_date: values.is_recurring ? apiDate(values.recurring_end_date) : null,
  recurring_max_occurrences: values.is_recurring ? (values.recurring_max_occurrences ?? null) : null,
  deposit_required: Boolean(values.deposit_required),
  deposit_percentage: values.deposit_required ? Number(values.deposit_percentage) || DEFAULT_DEPOSIT_PERCENTAGE : null,
  balance_date: values.deposit_required ? apiDate(values.balance_date) : null,
  items: priceLines(items).items.map(lineBody),
});

/** POST /invoices: for the client, or for a contract (which fills in what isn't sent). */
export const createBody = (values) => ({
  ...commonBody(values, values.items),
  user_id: values.user_id,
  ...(values.contract_id ? { contract_id: values.contract_id } : {}),
  ref_type: values.reference_type,
  invoice_date: apiDate(values.date),
  signature: values.signature || null,
});

/**
 * PATCH /invoices/:id: only what changed from `original` (the values as
 * loaded). The lines go all together when any changed; the service dates go
 * together, since the API keeps them unless both come.
 */
export function invoiceChanges(values, original) {
  const now = { ...commonBody(values, values.items), invoice_date: apiDate(values.date) };
  const before = { ...commonBody(original, original.items), invoice_date: apiDate(original.date) };
  // Dragging saved lines saves their order at once, so order alone isn't a change.
  const comparable = (key, value) => JSON.stringify(key === "items" ? byIdThenPlace(value) : value);
  const changes = Object.fromEntries(
    Object.entries(now).filter(([key, value]) => comparable(key, value) !== comparable(key, before[key])),
  );
  if ("service_start" in changes || "service_end" in changes) {
    changes.service_start = now.service_start;
    changes.service_end = now.service_end;
  }
  return changes;
}

// Saved lines by id, then new lines in their place.
const byIdThenPlace = (lines = []) =>
  lines
    .map((line, place) => ({ line, place }))
    .sort((a, b) => (a.line.id ?? Infinity) - (b.line.id ?? Infinity) || a.place - b.place)
    .map(({ line }) => line);

/** What a new invoice still needs, or null. */
export function createProblem(values) {
  const missing = [
    !values.reference_type && "a ref type",
    !values.user_id && "a client",
    !values.billing_date && "a billing date",
    (!values.service_start || !values.service_end) && "the service start and end",
    !values.dueDate && "a due date",
    !values.date && "the invoice date",
    !values.toCompany?.trim() && "the company it's to",
    !values.address1?.trim() && "the first address line",
  ].filter(Boolean);
  if (missing.length) return `Please add ${missing.join(", ")}.`;
  return linesProblem(values.items) || termsProblem(values);
}

/** What an edited invoice can't be saved with, or null. */
export function editProblem(values) {
  if (!values.service_start !== !values.service_end) return "Please give both the service start and end.";
  const halfTimed = values.items.findIndex((item) => !item.start_time !== !item.end_time);
  if (halfTimed >= 0) return `Line ${halfTimed + 1} needs both a start and an end time on site, or neither.`;
  return termsProblem(values);
}

// The repeat and deposit terms, and the total.
function termsProblem(values) {
  if (values.is_recurring && !values.recurring_end_date && !values.recurring_max_occurrences) {
    return "A repeating invoice needs an end date or a number of times.";
  }
  if (priceLines(values.items).total <= 0) return "The total must be more than $0.";
  if (values.deposit_required) {
    if (!values.balance_date) return "Please pick the date the balance is sent.";
    if (values.billing_date && !values.balance_date.isAfter(values.billing_date, "day")) {
      return "The balance date must be after the billing date.";
    }
  }
  return null;
}
