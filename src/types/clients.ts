import type { CodedPlace, Place, PersonRef, Role, Timestamps } from "./api";
import type { InvoiceSummary } from "./billing";
import type { BookingSeries, VisitRow } from "./bookings";
import type { ScopeRow } from "./scope";

export type ClientType = "commercial" | "residential";

/** A place of service, or an employee's home: city, state and country as objects. */
export interface Address extends Timestamps {
  id: number;
  user_id: number | null;
  label: string | null;
  address: string | null;
  address_line_2: string | null;
  city: Place | null;
  state: CodedPlace | null;
  country: CodedPlace | null;
  postal_code: string | null;
  address_lat: number | null;
  address_long: number | null;
  google_map_link: string | null;
  access_notes: string | null;
  is_primary: boolean;
  one_line: string;
}

/** What an address picker shows. */
export interface AddressPick {
  id: number;
  label: string | null;
  one_line: string;
  is_primary: boolean;
}

/** A new address, or changes to one. */
export interface AddressInput {
  label?: string | null;
  address?: string;
  address_line_2?: string | null;
  country_id?: number;
  state_id?: number;
  city_id?: number;
  postal_code?: string;
  address_lat?: number | null;
  address_long?: number | null;
  google_map_link?: string | null;
  access_notes?: string | null;
  is_primary?: boolean;
}

/** An address as the account lists send it: the raw row, with its places. */
export interface AccountAddress {
  id?: number;
  address?: string | null;
  address_line_2?: string | null;
  postal_code?: string | null;
  is_primary?: boolean | number | null;
  address_lat?: number | string | null;
  address_long?: number | string | null;
  user_city?: Place | null;
  user_state?: (Place & { iso2?: string | null }) | null;
  user_country?: (Place & { iso2?: string | null }) | null;
}

/** A client account, with what is on file. */
export interface Client {
  id: number;
  name: string | null;
  email: string;
  phone?: string | null;
  cc_email?: string | null;
  client_type?: ClientType | null;
  assigned_to?: number | null;
  user_type?: string;
  status?: string | number | null;
  is_active?: boolean | number;
  created_at?: string;
  updated_at?: string;
  roles?: Role[];
  user_address?: AccountAddress[] | null;
  assigned_admin?: PersonRef | null;
}

/** A client in a document form's picker. */
export interface ClientPick {
  id: number;
  name: string | null;
  email: string;
  mobile?: string | null;
  phone?: string | null;
  address?: {
    address_1?: string | null;
    city?: string | null;
    state?: string | null;
    country?: string | null;
  } | null;
}

/** A client's name, for pickers. */
export interface ClientName {
  id: number;
  name: string | null;
  email: string;
  phone?: string | null;
}

/** An area of a client sheet. */
export interface SheetArea {
  id?: number;
  service_area: string | null;
  flooring_type: string | null;
  special_requests: string | null;
  num_desks_trash_cans: number | null;
  stalls: number | null;
  sinks: number | null;
  restrooms: number | null;
}

/** An Initial Client Sheet. */
export interface ClientSheet extends Timestamps {
  id: number;
  client_id: number;
  title: string;
  address: Address | null;
  estimated_sqft: number | null;
  walkaround_minutes: number | null;
  service_days: string | null;
  carpet_percentage: number;
  concrete_percentage: number;
  vct_lvt_percentage: number;
  tile_percentage: number;
  areas: SheetArea[];
  shared_at: string | null;
}

/** A sheet in a list: its address on one line. */
export interface SheetRow extends Timestamps {
  id: number;
  title: string;
  address: string | null;
  shared_at: string | null;
}

/** A client's enquiry from the app. */
export type EnquiryStatus = "new" | "contacted" | "closed";

export interface Enquiry extends Timestamps {
  id: number;
  status: EnquiryStatus;
  services: Place[];
  needed_on: string | null;
  address: Address | null;
  notes: string | null;
  client?: PersonRef | null;
  answers?: { question: string | null; answer: string }[];
  quoted_price?: number | null;
}

/** What a client asks the office to change about their account. */
export interface ProfileRequest {
  id: number;
  kind: string;
  kind_name: string | null;
  details: string | null;
  status: "open" | "done" | "declined";
  office_note: string | null;
  handled_at: string | null;
  created_at: string;
  client?: (PersonRef & { deleted: boolean }) | null;
}

// --- The client page: each document as a short row -------------------------

interface FlowRow extends Timestamps {
  id: number;
  title: string;
  status: string | null;
  shared_at: string | null;
}

export interface FlowEnquiryRow extends Timestamps {
  id: number;
  status: EnquiryStatus;
  needed_on: string | null;
}

export interface FlowCalculationRow extends Timestamps {
  id: number;
  title: string;
  scope_of_work_id: number | null;
  client_sheet_id: number | null;
  total_operational_cost: number | null;
}

export interface FlowEstimateRow extends FlowRow {
  scope_of_work_id: number | null;
  cost_calculation_id: number | null;
  total_price: number | null;
  signed_date: string | null;
}

export interface FlowQuoteRow extends FlowRow {
  scope_of_work_id: number | null;
  cost_calculation_id: number | null;
  estimate_id: number | null;
  payment_status: string | null;
  total_due: number | null;
}

export interface FlowRequestRow extends FlowRow {
  estimate_id: number | null;
  quote_id: number | null;
  total_due: number | null;
}

export interface FlowContractRow extends FlowRow {
  estimate_id: number | null;
  total_monthly_price: number | null;
}

/** The client page in one call. */
export interface ClientFlow {
  client: Pick<Client, "id" | "name" | "email" | "phone" | "client_type">;
  addresses: Address[];
  enquiries: FlowEnquiryRow[];
  client_sheets: SheetRow[];
  scopes_of_work: ScopeRow[];
  cost_calculations: FlowCalculationRow[];
  estimates: FlowEstimateRow[];
  quotes: FlowQuoteRow[];
  service_requests: FlowRequestRow[];
  contracts: FlowContractRow[];
  bookings: { repeating: BookingSeries[]; upcoming: VisitRow[] };
  invoices: InvoiceSummary[];
}
