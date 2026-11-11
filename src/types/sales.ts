import type { PersonRef, Sharing, Timestamps } from "./api";
import type { ClientType } from "./clients";
import type { ScopeSection } from "./scope";

/** Where a document sent through DocuSign stands (estimates and contracts). */
export type SigningStatus = "draft" | "pending_signature" | "signed" | "declined" | "voided" | "failed";

/** A quote's status; a service request's adds what became of its envelope. */
export type QuoteStatus = "DRAFT" | "SAVED" | "SIGNED";
export type ServiceRequestStatus = QuoteStatus | "DECLINED" | "VOIDED" | "FAILED";

export type JobStatus = "NOT_BOOKED" | "BOOKED" | "EXPIRED" | string;
export type PaymentStatus = "NOT_PAID" | "PAID" | "CASH_PAID" | "CHECK_PAID" | "ACH_PAID" | string;

/** How a quote or invoice line is counted. */
export type CalculationType = "na" | "sqft" | "hour" | string;

// --- Estimates -----------------------------------------------------------------

/** A line of an estimate's price table. service_request_id: the request that added it. */
export interface PriceLine {
  id?: number;
  service_request_id?: number | null;
  name: string;
  frequency: string | null;
  price: number | null;
  hours: number | null;
  personnel: number | null;
}

export interface EstimateSummary extends Sharing, Timestamps {
  id: number;
  user_id: number;
  scope_of_work_id: number | null;
  cost_calculation_id: number | null;
  bid_id: number | null;
  total_price: number | null;
  client_company_name: string;
  address_line_1: string | null;
  address_line_2: string | null;
  city: string | null;
  state: string | null;
  zip: string | null;
  contact_name: string | null;
  contact_phone: string | null;
  contact_fax: string | null;
  contact_email: string | null;
  client_email: string | null;
  signed_date: string | null;
  frequency: string | null;
  status: SigningStatus;
  file_url: string | null;
  signed_file_url: string | null;
  signed_at: string | null;
}

export interface Estimate extends EstimateSummary {
  price_lines: PriceLine[];
  signature: string | null;
  scope_sections?: ScopeSection[];
}

/** What a new estimate starts from (GET /estimates/draft). */
export interface EstimateDraft extends Partial<Omit<Estimate, "price_lines">> {
  user_id: number;
  price_lines: PriceLine[];
}

/** An estimate as the API takes it. */
export interface EstimateInput {
  user_id: number;
  client_company_name: string;
  address_line_1?: string;
  address_line_2?: string;
  city?: string;
  state?: string;
  zip?: string;
  contact_name?: string;
  contact_phone?: string;
  contact_fax?: string;
  contact_email?: string;
  frequency?: string;
  signed_date?: string | null;
  signature?: string;
  scope_of_work_id?: number;
  cost_calculation_id?: number;
  bid_id?: number;
  price_lines?: Omit<PriceLine, "id">[];
}

// --- Quotes ----------------------------------------------------------------------

export interface QuoteItem {
  id?: number;
  service_request_id?: number | null;
  description: string;
  frequency: string | null;
  quantity: number;
  calculation_type: CalculationType;
  sqft: number | string | null;
  hour: number | string | null;
  unit_price: number | null;
  amount: number | null;
}

export interface Quote extends Sharing, Timestamps {
  id: number;
  user_id: number;
  scope_of_work_id: number | null;
  cost_calculation_id: number | null;
  estimate_id: number | null;
  client: PersonRef | null;
  ref_type: string | null;
  ref_no: string | null;
  service_dates: string | null;
  due_date: string | null;
  date: string | null;
  to_company_name: string | null;
  address_1: string | null;
  address_2: string | null;
  total_due: number | null;
  status: QuoteStatus;
  job_status: JobStatus | null;
  payment_status: PaymentStatus | null;
  pdf_url: string | null;
  expires_at: string | null;
  invoice_id: number | null;
  paid_at: string | null;
  items: QuoteItem[];
  signature?: string | null;
  cc_email?: string | null;
}

export interface QuoteDraftSummary {
  id: number;
  ref_type: string | null;
  ref_no: string | null;
  updated_at: string;
}

/** A quote or draft as the API takes it. */
export interface QuoteInput {
  user_id: number;
  ref_type?: string;
  ref_no?: string;
  service_dates?: string;
  due_date?: string | null;
  date?: string | null;
  to_company_name?: string;
  address_1?: string;
  address_2?: string;
  signature?: string;
  cc_email?: string;
  scope_of_work_id?: number;
  cost_calculation_id?: number;
  estimate_id?: number;
  items: QuoteLineInput[];
}

/** A quote line as the forms send it: numbers may still be typed text. */
export interface QuoteLineInput {
  description?: string;
  frequency?: string | null;
  quantity?: number | string | null;
  calculation_type?: string;
  sqft?: number | string | null;
  hour?: number | string | null;
  unit_price?: number | string | null;
  amount?: number | string | null;
  service_id?: number;
  service_request_id?: number | null;
}

/** A client's paid quotes in a month. */
export interface PaidQuotesSummary {
  user_id: number;
  name: string | null;
  email: string | null;
  quotes: Quote[];
  [field: string]: unknown;
}

// --- Service requests -------------------------------------------------------------

export interface ServiceRequestItem {
  id?: number;
  description: string;
  frequency: string | null;
  quantity: number;
  unit_price: number | null;
  amount: number | null;
  calculation_type?: CalculationType;
  sqft?: number | string | null;
  hour?: number | string | null;
}

export interface ServiceRequest extends Sharing, Timestamps {
  id: number;
  user_id: number;
  /** What it adds to; joined: its lines went out in that document instead of it. */
  estimate_id: number | null;
  quote_id: number | null;
  joined: boolean;
  client: PersonRef | null;
  ref_type: string | null;
  ref_no: string | null;
  service_days: string | null;
  due_date: string | null;
  date: string | null;
  to_company_name: string | null;
  address_1: string | null;
  address_2: string | null;
  total_due: number | null;
  status: ServiceRequestStatus;
  job_status: JobStatus | null;
  payment_status: PaymentStatus | null;
  signed_file_url: string | null;
  signed_at: string | null;
  items: ServiceRequestItem[];
  signature?: string | null;
}

export interface ServiceRequestInput {
  user_id: number;
  estimate_id?: number;
  quote_id?: number;
  ref_type?: string;
  ref_no?: string;
  service_days?: string;
  due_date?: string | null;
  date?: string | null;
  to_company_name?: string;
  address_1?: string;
  address_2?: string;
  signature?: string;
  items: Partial<ServiceRequestItem>[];
}

// --- Contracts -----------------------------------------------------------------------

export interface Contract extends Sharing, Timestamps {
  id: number;
  user_id: number;
  client_company_name: string;
  client_legal_name: string;
  client_representative: string | null;
  client_name: string | null;
  client_email: string | null;
  service_address: string | null;
  total_monthly_price: number | null;
  contract_date: string | null;
  status: SigningStatus;
  estimate_id: number | null;
  /** What the client wrote in DocuSign when signing. */
  service_start_date: string | null;
  service_start_time: string | null;
  service_days: string | null;
  payment_method: string | null;
  file_url: string | null;
  signed_file_url: string | null;
  signed_at: string | null;
  signature?: string | null;
}

export interface ContractInput {
  user_id?: number;
  estimate_id?: number;
  client_company_name: string;
  client_legal_name: string;
  client_representative?: string;
  service_address?: string;
  total_monthly_price: number;
  contract_date: string | null;
  signature: string;
}

// --- The cost calculator ---------------------------------------------------------------

export interface CalculationTask {
  id?: number;
  service_name: string;
  estimated_minutes: number;
  equipment_cost: number | null;
  chemical_cost: number | null;
  notes: string | null;
}

export interface Bid {
  id: number;
  cost_calculation_id: number;
  operational_cost: number | null;
  profit_margin_percentage: number;
  overhead_percentage: number;
  risk_buffer_amount: number | null;
  minimum_bid: number | null;
  recommended_bid: number | null;
  maximum_bid: number | null;
  commission_percentage: number;
  commission_amount: number | null;
  created_by: number | null;
  created_at: string;
}

export interface CostCalculation {
  id: number;
  client_id: number;
  scope_of_work_id: number | null;
  client_sheet_id: number | null;
  property_name: string | null;
  estimated_sqft: number;
  room_count: number | null;
  restroom_count: number | null;
  stall_count: number | null;
  kitchen_count: number | null;
  trash_can_count: number | null;
  walkaround_minutes: number;
  employee_count: number | null;
  hourly_wage: number | null;
  estimated_minutes: number;
  estimated_hours: number;
  hours_per_employee: number;
  labor_cost: number | null;
  equipment_cost: number | null;
  chemical_cost: number | null;
  total_operational_cost: number | null;
  created_by: number | null;
  created_at: string;
  custom_tasks: CalculationTask[];
  bids?: Bid[];
}

/** How much of a building each floor covers, in percent (from its sheet). */
export interface FloorMix {
  carpet_percentage: number;
  concrete_percentage: number;
  vct_lvt_percentage: number;
  tile_percentage: number;
}

/**
 * What a new calculation starts from (GET /cost-calculations/draft), saving
 * nothing: the scope and sheet it works from, and their counts.
 */
export interface CalculationDraft {
  client_id: number;
  scope_of_work_id: number | null;
  client_sheet_id: number | null;
  property_name: string | null;
  client_type: ClientType | null;
  estimated_sqft: number;
  room_count: number;
  restroom_count: number;
  stall_count: number;
  kitchen_count: number;
  trash_can_count: number;
  walkaround_minutes: number;
  employee_count: number;
  floor_mix: FloorMix;
}

/** The client types of the calculator's settings, in capitals. */
export type SettingClientType = Uppercase<ClientType>;

/** What a calculator setting gives minutes for: a count, or 1,000 sqft of a floor. */
export type CalculationItemType =
  | "SQFT"
  | "ROOM"
  | "RESTROOM"
  | "STALL"
  | "KITCHEN"
  | "TRASH_CAN"
  | "CARPET"
  | "CONCRETE"
  | "VCT_LVT"
  | "TILE";

/** Minutes per unit of an item type, for a client type. */
export interface CalculationSetting {
  id: number;
  client_type: SettingClientType;
  item_type: CalculationItemType;
  minutes_per_unit: number;
}
