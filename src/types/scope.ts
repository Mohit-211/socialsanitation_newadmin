import type { Timestamps } from "./api";
import type { ClientType } from "./clients";

/** A line of a scope of work: what is done, and how often. */
export interface ScopeItem {
  id: number;
  section_id: number;
  description: string;
  is_daily: boolean;
  is_weekly: boolean;
  is_monthly: boolean;
  order: number;
  master_item_id?: number | null;
}

export interface ScopeSection {
  id: number;
  title: string;
  order: number;
  is_red: boolean;
  items: ScopeItem[];
  master_section_id?: number | null;
  client_type?: ClientType;
}

/** A section of the master list, for one client type. */
export interface MasterSection extends ScopeSection {
  client_type: ClientType;
}

/** How often and when a scope's visits happen. */
export interface VisitDetails {
  visit_frequency: string | null;
  service_days: string | null;
  service_time: string | null;
  crew_size: number | null;
  hours_per_visit: number | null;
  notes: string | null;
}

/** A client's scope of work. */
export interface Scope extends Timestamps, VisitDetails {
  id: number;
  client_id: number;
  title: string;
  client_sheet_id: number | null;
  client_sheet: { id: number; title: string } | null;
  client_type: ClientType | null;
  sections: ScopeSection[];
  shared_at: string | null;
}

/** A scope in a list, without sections. */
export interface ScopeRow extends Timestamps {
  id: number;
  title: string;
  client_sheet: { id: number; title: string } | null;
  visit_frequency: string | null;
  shared_at: string | null;
}

/** A new scope, or changes to one: null or "" clears a field on an edit. */
export interface ScopeInput {
  title?: string;
  client_sheet_id?: number | null;
  visit_frequency?: string | null;
  /** The days of the week, or as text such as "Mon, Wed". */
  service_days?: string[] | string | null;
  service_time?: string | null;
  crew_size?: number | null;
  hours_per_visit?: number | null;
  notes?: string | null;
}
