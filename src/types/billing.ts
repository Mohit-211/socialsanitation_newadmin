import type { Id } from "./api";
import type { CalculationType, PaymentStatus } from "./sales";

/** Where an invoice stands, worked out by the backend. */
export type InvoiceState = "draft" | "scheduled" | "sent" | "deposit_paid" | "overdue" | "paid" | "cancelled";

export interface InvoiceItem {
  id?: number;
  description: string;
  frequency: string | null;
  quantity: number;
  calculation_type: CalculationType;
  sqft: number | string | null;
  hour: number | string | null;
  start_time: string | null;
  end_time: string | null;
  unit_price: number | null;
  amount: number | null;
  sort_order?: number | null;
}

export interface RecurringInvoice {
  id: number;
  frequency: string;
  status: string;
  next_billing_date: string | null;
  end_date: string | null;
  max_occurrences: number | null;
  occurrences_generated: number | null;
}

export interface InvoiceSummary {
  id: number;
  ref_no: string | null;
  custom_ref_no: string | null;
  event_name: string | null;
  billing_date: string | null;
  due_date: string | null;
  service_dates: string | null;
  total_due: number | null;
  amount_due_now: number | null;
  payment_status: PaymentStatus | null;
  state: InvoiceState;
  payment_url: string | null;
  pdf_url: string | null;
  user_id: number;
  client_name: string | null;
  to_company_name: string | null;
  payment_stage: string | null;
  status: string | null;
  is_historical: boolean;
  scheduled_send_at: string | null;
  last_sent_at: string | null;
  contract_id: number | null;
  reminder_count: number;
  last_reminder_at: string | null;
}

export interface Invoice extends InvoiceSummary {
  quote_id: number | null;
  invoice_date: string | null;
  address_1: string | null;
  address_2: string | null;
  signature: string | null;
  deposit_required: boolean;
  deposit_percentage: number | null;
  deposit_amount: number | null;
  balance_amount: number | null;
  balance_due_date: string | null;
  deposit_paid_at: string | null;
  balance_sent_at: string | null;
  balance_paid_at: string | null;
  paid_amount: number | null;
  paid_at: string | null;
  items: InvoiceItem[];
  recurring: RecurringInvoice | null;
}

/** A line as an invoice body sends it; times as HH:mm, or "" to clear them. */
export interface InvoiceItemInput {
  id?: number;
  description?: string;
  frequency?: string | null;
  quantity?: number;
  calculation_type?: CalculationType;
  sqft?: number | string | null;
  hour?: number | null;
  unit_price?: number;
  amount?: number;
  start_time?: string | null;
  end_time?: string | null;
}

/**
 * The body of a new invoice (POST /invoices: quote_id, user_id or contract_id
 * is required), or the fields that changed (PATCH /invoices/:id).
 */
export interface InvoiceInput {
  user_id?: number;
  quote_id?: Id;
  contract_id?: number;
  ref_type?: string;
  custom_ref_no?: string | null;
  invoice_date?: string | null;
  billing_date?: string | null;
  service_start?: string | null;
  service_end?: string | null;
  due_date?: string | null;
  to_company_name?: string;
  address_1?: string;
  address_2?: string;
  event_name?: string | null;
  is_recurring?: boolean;
  recurring_frequency?: string | null;
  recurring_end_date?: string | null;
  recurring_max_occurrences?: number | null;
  deposit_required?: boolean;
  deposit_percentage?: number | null;
  balance_date?: string | null;
  signature?: string | null;
  items?: InvoiceItemInput[];
}

/** What an invoice for a contract would hold (GET /contracts/:id/invoice-draft); nothing is saved. */
export interface ContractInvoiceDraft {
  contract_id: number;
  user_id: number;
  to_company_name: string | null;
  address_1: string | null;
  address_2: string | null;
  billing_date: string;
  invoice_date: string;
  due_date: string;
  service_start: string;
  service_end: string;
  /** The contract's monthly price as one line, when it has one. */
  items: { description: string; quantity: number; unit_price: number; amount: number }[];
  total_due: number;
  is_recurring: boolean;
  recurring_frequency: string;
  recurring_max_occurrences: number | null;
  contract: {
    id: number;
    status: string;
    client_company_name: string | null;
    total_monthly_price: number | null;
    contract_date: string | null;
  };
}

/** How a card payment went (the checkout page). */
export interface PaymentStatusAnswer {
  payment_status: "PENDING" | "SUCCESS" | "REJECTED" | "REFUNDED" | string;
  amount: number | string | null;
  currency: string | null;
  receipt_url: string | null;
}

/** A row of an invoice import that was skipped or not imported: why, as reason or message. */
export interface InvoiceImportIssue {
  row: number;
  invoice_number: string | null;
  client_name?: string | null;
  reason?: string;
  message?: string;
}

/** A row of an invoice import that became an invoice. */
export interface ImportedInvoiceRow {
  row: number;
  invoice_id: number;
  invoice_number: string;
  client_name: string;
  user_id: number;
  billing_date: string;
}

/** What happened to each row of an invoice import. */
export interface InvoiceImportResult {
  total_rows: number;
  imported_count: number;
  skipped_count: number;
  unmatched_count: number;
  error_count: number;
  invoices: ImportedInvoiceRow[];
  /** Invoice numbers that already exist. */
  skipped: InvoiceImportIssue[];
  /** Rows whose client_name isn't one active client: reason says which way. */
  unmatched: InvoiceImportIssue[];
  /** Rows with a bad date, a repeated number or a failed save: message says which. */
  errors: InvoiceImportIssue[];
}

// --- Reports -------------------------------------------------------------------------

/** An invoice as the monthly summary sends it: the table's own row, amounts possibly as text. */
export interface InvoiceRecord {
  id: number;
  user_id: number;
  ref_no: string | null;
  custom_ref_no: string | null;
  billing_date: string | null;
  due_date: string | null;
  service_dates: string | null;
  total_due: number | string | null;
  payment_status: PaymentStatus | null;
  status: string | null;
}

/** A month's invoices by client, for the monthly report (GET /invoices/monthly-summary). */
export interface InvoicesMonthlySummary {
  /** The month's billing dates, as YYYY-MM-DD. */
  billing_dates: string[];
  /** Each client with invoices that month (named employees by the API). */
  employees: { user_id: number; name: string; email: string | null; invoices: InvoiceRecord[] }[];
}

export interface AnalyticsOverview {
  total_revenue: number;
  invoice_revenue: number;
  quote_revenue: number;
  paid_revenue: number;
  unpaid_revenue: number;
  overdue_revenue: number;
  total_invoices: number;
  total_quotes: number;
  paid_invoices: number;
  unpaid_invoices: number;
  overdue_invoices: number;
  paid_quotes: number;
  unpaid_quotes: number;
  paid_count: number;
  unpaid_count: number;
  cash_revenue: number;
  check_revenue: number;
  ach_revenue: number;
  online_revenue: number;
}

/** What came in, by how it was paid. */
export interface AnalyticsPayments {
  online: number;
  cash: number;
  check: number;
  ach: number;
}

export interface AnalyticsDay {
  /** YYYY-MM-DD */
  date: string;
  revenue: number;
  paid: number;
  unpaid: number;
}

/** A client's invoices and quotes of the month. */
export interface AnalyticsClient {
  user_id: number;
  name: string;
  invoice_count: number;
  total_amount: number;
  paid_amount: number;
  unpaid_amount: number;
}

export interface AnalyticsTopClient {
  user_id: number;
  name: string;
  total_spent: number;
}

/** An invoice or quote of the month. */
export interface AnalyticsActivity {
  id: number;
  type: "INVOICE" | "QUOTE";
  ref_no: string | null;
  client_name: string;
  email: string;
  amount: number;
  payment_status: PaymentStatus | null;
  due_date: string | null;
  service_dates: string | null;
  /** An invoice's billing date, or when a quote was made. */
  billing_date: string | null;
  created_at: string;
  is_overdue: boolean | null;
}

/** The figures of the Invoice Analytics screen (GET /invoices/analytics). */
export interface InvoiceAnalytics {
  overview: AnalyticsOverview;
  payment_breakdown: AnalyticsPayments;
  daily_breakdown: AnalyticsDay[];
  /** Every client of the month, biggest total first. */
  employees: AnalyticsClient[];
  top_clients: AnalyticsTopClient[];
  monthly_activity: AnalyticsActivity[];
}
