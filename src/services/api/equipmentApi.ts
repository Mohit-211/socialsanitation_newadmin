import httpClient from "@/services/httpClient";
import type { ApiCall } from "@/services/apiResult";
import type {
  AssignmentHistoryEntry,
  AssignmentsOverview,
  Equipment,
  EquipmentAssignment,
  EquipmentAssignmentRow,
  EquipmentHolder,
  Id,
  ListQuery,
  Paged,
} from "@/types";

// Equipment: what the company lends its crew, who has it, and what came back.
// Lists come in data.items with data.pagination (limit 15 by default, up to 500).

/** Query: page, limit, search. Each: id, name, quantity. */
export const listEquipment = (params?: ListQuery): ApiCall<Paged<Equipment>> => httpClient.get("/equipment", { params });

/** name and quantity, both required. */
export const createEquipment = (equipment: { name: string; quantity: number }): ApiCall<Equipment> =>
  httpClient.post("/equipment", equipment);

export const updateEquipment = (id: Id, changes: Partial<{ name: string; quantity: number }>): ApiCall<Equipment> =>
  httpClient.patch(`/equipment/${id}`, changes);

/** Needs records.delete. */
export const deleteEquipment = (id: Id): ApiCall<null> => httpClient.delete(`/equipment/${id}`);

/** Query: page, limit, search. Each with employee, equipment, quantities, dates, status and signature. */
export const listAssignments = (params?: ListQuery): ApiCall<Paged<EquipmentAssignmentRow>> =>
  httpClient.get("/equipment-assignments", { params });

/** Stock and assignment totals. */
export const getAssignmentsOverview = (): ApiCall<AssignmentsOverview> => httpClient.get("/equipment-assignments/overview");

export interface AssignmentInput {
  employee_id: Id;
  equipment_id: Id;
  assigned_quantity: number;
  expected_return_date?: string | null;
  remarks?: string;
}

/** employee_id, equipment_id, assigned_quantity, all required; expected_return_date as YYYY-MM-DD. */
export const assignEquipment = (assignment: AssignmentInput): ApiCall<EquipmentAssignment> =>
  httpClient.post("/equipment-assignments", assignment);

/** returned_quantity (required), remarks. */
export const updateAssignment = (
  id: Id,
  changes: { returned_quantity: number; remarks?: string | null },
): ApiCall<EquipmentAssignment> =>
  httpClient.patch(`/equipment-assignments/${id}`, changes);

/** { assignment, history }: each signature and return, oldest first. */
export const getAssignmentHistory = (id: Id): ApiCall<{ assignment: EquipmentAssignmentRow; history: AssignmentHistoryEntry[] }> =>
  httpClient.get(`/equipment-assignments/${id}/history`);

/** Emails the employee the assignment's form to sign; answers the address it went to. */
export const sendAssignmentForm = (id: Id): ApiCall<{ email: string }> => httpClient.post(`/equipment-assignments/${id}/send-form`);

/** A month of one employee's equipment. */
export interface MonthlyEquipmentRow {
  employee: EquipmentHolder;
  summary: {
    total_assignments: number;
    total_assigned_quantity: number;
    total_returned_quantity: number;
    total_pending_quantity: number;
  };
  assignments: Omit<EquipmentAssignmentRow, "employee" | "signature">[];
}

/** The month a monthly list covers. */
export interface EquipmentMonth {
  value: string;
  label: string;
  start_date: string;
  end_date: string;
}

/** month (like 2026-11) required; page, limit, search. data.items: employee, summary, assignments. */
export const listMonthlyEquipment = (
  params: ListQuery & { month: string },
): ApiCall<Paged<MonthlyEquipmentRow> & { month: EquipmentMonth }> =>
  httpClient.get("/equipment-assignments/monthly", { params });
