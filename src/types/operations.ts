import type { PersonRef, UploadedFile } from "./api";

// --- Equipment and supplies -------------------------------------------------------------

export interface Equipment {
  id: number;
  name: string;
  quantity: number;
}

export type AssignmentStatus = "ASSIGNED" | "PARTIALLY_RETURNED" | "RETURNED" | "OVERDUE" | "LOST";

/** An assignment as saved: the answer to assigning or updating one. */
export interface EquipmentAssignment {
  id: number;
  employee_id: number;
  equipment_id: number;
  assigned_quantity: number;
  returned_quantity: number;
  assigned_date: string | null;
  expected_return_date: string | null;
  actual_return_date: string | null;
  status: AssignmentStatus;
  remarks: string | null;
  signature_version: number | null;
  signed_version: number | null;
}

/** Who has a piece of equipment. */
export interface EquipmentHolder {
  id: number;
  name: string | null;
  mobile: string | null;
  email: string | null;
  employee_type?: string | null;
}

/** Whether the employee has signed the assignment's current version. */
export interface AssignmentSignatureState {
  required: boolean;
  status: "PENDING" | "SIGNED";
  current_version: number | null;
  signed_version: number | null;
  /** In the list: the latest signature. */
  latest?: { id: number; signature_version: number; signature: string | null; signed_at: string | null } | null;
  /** In an assignment's history: how many times it was signed. */
  total_signatures?: number;
}

/** An assignment as the list and its history show it: who has what, how many, and whether it's signed. */
export interface EquipmentAssignmentRow {
  id: number;
  employee: EquipmentHolder;
  equipment: { id: number; name: string } | null;
  assigned_quantity: number;
  returned_quantity: number;
  pending_quantity: number;
  assigned_date: string | null;
  expected_return_date: string | null;
  actual_return_date: string | null;
  status: AssignmentStatus;
  remarks: string | null;
  signature: AssignmentSignatureState;
}

/** An employee's signature of one version of an assignment. */
export interface AssignmentSignature {
  id: number;
  assignment_id: number;
  signature_version: number;
  action: "ASSIGNED" | "PARTIAL_RETURN" | "FULL_RETURN" | string;
  status: string;
  quantity: number;
  remaining_quantity: number;
  signed_at: string | null;
}

/** A step of an assignment's history, with the signature image. */
export interface AssignmentHistoryEntry extends AssignmentSignature {
  employee_id: number;
  signature: string | null;
  created_at: string;
}

/** Stock and assignment totals. */
export interface AssignmentsOverview {
  total_equipment_types: number;
  total_stock: number;
  available_stock: number;
  assigned_stock: number;
  returned_stock: number;
  overdue_assignments: number;
}

export interface Product {
  id: number;
  name: string;
  description: string | null;
  quantity: number;
  images: UploadedFile[];
  created_at: string;
}

export type RestockStatus = "Pending" | "Approved" | "Rejected";

export interface RestockRequest {
  id: number;
  product_id: number;
  product: Product | null;
  employee: PersonRef | null;
  requested_quantity: number;
  status: RestockStatus;
  note: string | null;
  created_at: string;
  images: UploadedFile[];
}

// --- Services and checklists ----------------------------------------------------------------

export interface ChecklistTask {
  id: number;
  task: string;
}

export interface ServiceChecklist {
  id: number;
  title: string;
  job_type: string;
  tasks: ChecklistTask[];
}

export interface DailyChecklist {
  id: number;
  title: string;
  main_title: string | null;
  job_type: string;
  job_sub_type: string;
  tasks: ChecklistTask[];
}

/** A service's checklist tasks under one heading. */
export interface ServiceChecklistGroup {
  heading_id: number;
  heading_title: string;
  tasks: ChecklistTask[];
}

export interface Service {
  id: number;
  name: string;
  abbreviation: string | null;
  description: string | null;
  average_rating: number | null;
  rating: number | null;
  /** On one service: its checklists, grouped by heading. */
  checklists?: ServiceChecklistGroup[];
  reviews?: ServiceReview[];
}

export interface ServiceName {
  id: number;
  name: string;
}

export interface ServiceReview {
  id: number;
  service_id?: number;
  rating: number | null;
  review: string | null;
  reviewer_name?: string | null;
  created_at: string;
}

// --- Inspections, reports and videos -------------------------------------------------

export type InspectionStatus =
  | "ASSIGNED"
  | "IN_PROGRESS"
  | "SUBMITTED"
  | "UNDER_REVIEW"
  | "COMPLETED"
  | "REOPENED"
  | "CANCELLED";

/** How the office judged an item or a section. */
export type InspectionReviewStatus = "PENDING" | "APPROVED" | "ISSUE";

/** A BDM's walk through a client's scope of work with an employee. */
export interface Inspection {
  id: number;
  user_id: number;
  bdm_id: number;
  employee_id: number;
  name: string;
  inspection_date: string;
  status: InspectionStatus;
  reopen_count: number;
  reopened_at: string | null;
  /** Out of 10, once completed. */
  score: number | null;
  overall_remark: string | null;
  started_at: string | null;
  employee_submitted_at: string | null;
  bdm_completed_at: string | null;
  client_email_sent: boolean;
  client_email_sent_at: string | null;
  created_at: string;
  updated_at: string;
  /** Why it was reopened. The API writes it on a reopen but has no column for it yet, so it doesn't come back. */
  reopen_remark?: string | null;
}

/** A client's inspection in their list, with whom it is for and who does it. */
export interface InspectionSummary extends Inspection {
  client: PersonRef | null;
  employee: PersonRef | null;
}

export interface InspectionItemImage {
  id: number;
  inspection_id: number;
  inspection_item_id: number;
  uploaded_by: number;
  uploaded_by_role: "EMPLOYEE" | "BDM";
  /** The file's name: imageUrl() makes its address. */
  image: string;
  created_at: string;
  updated_at: string;
}

/** A scope item to check: the employee ticks it, the office reviews it. */
export interface InspectionItem {
  id: number;
  inspection_id: number;
  scope_section_id: number | null;
  scope_item_id: number | null;
  section_name: string;
  item_name: string;
  section_order: number;
  item_order: number;
  is_daily: boolean;
  is_weekly: boolean;
  is_monthly: boolean;
  employee_completed: boolean;
  employee_note: string | null;
  bdm_status: InspectionReviewStatus;
  bdm_remark: string | null;
  bdm_reviewed_at: string | null;
  created_at: string;
  updated_at: string;
  images: InspectionItemImage[];
}

/** The office's review of a scope section. */
export interface InspectionSectionReview {
  id: number;
  inspection_id: number;
  scope_section_id: number | null;
  section_name: string;
  section_order: number;
  total_items: number;
  completed_items: number;
  status: InspectionReviewStatus;
  score: number;
  score_out_of: number;
  remark: string | null;
  reviewed_by: number | null;
  reviewed_at: string | null;
}

/** One inspection, with its items, section reviews and progress. */
export interface InspectionDetail extends Inspection {
  items: InspectionItem[];
  section_reviews: InspectionSectionReview[];
  summary: {
    total_items: number;
    completed_items: number;
    pending_items: number;
    approved_items: number;
    issue_items: number;
    completion_percentage: number;
  };
}

export interface Report {
  id: number;
  booking_id: number | null;
  type: string;
  reason: string | null;
  status: string;
  reported_by: PersonRef | null;
  reported_to: PersonRef | null;
  booking: {
    id: number;
    date: string | null;
    service: { id: number; name: string } | null;
    images: UploadedFile[];
  } | null;
  images: UploadedFile[];
  created_at: string;
}

export interface TrainingVideo {
  id: number;
  title: string;
  video_link: string;
  created_at: string;
}
