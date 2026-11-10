import httpClient from "@/services/httpClient";

// Equipment: what the company lends its crew, who has it, and what came back.
// Lists come in data.items with data.pagination (limit 15 by default, up to 500).

/** Query: page, limit, search. Each: id, name, quantity. */
export const listEquipment = (params) => httpClient.get("/equipment", { params });

/** name and quantity, both required. */
export const createEquipment = (equipment) => httpClient.post("/equipment", equipment);

export const updateEquipment = (id, changes) => httpClient.patch(`/equipment/${id}`, changes);

/** Needs records.delete. */
export const deleteEquipment = (id) => httpClient.delete(`/equipment/${id}`);

/** Query: page, limit, search. Each with employee, equipment, quantities, dates, status and signature. */
export const listAssignments = (params) => httpClient.get("/equipment-assignments", { params });

/** Stock and assignment totals. */
export const getAssignmentsOverview = () => httpClient.get("/equipment-assignments/overview");

/** employee_id, equipment_id, assigned_quantity, all required; expected_return_date as YYYY-MM-DD. */
export const assignEquipment = (assignment) => httpClient.post("/equipment-assignments", assignment);

/** returned_quantity (required), remarks. */
export const updateAssignment = (id, changes) => httpClient.patch(`/equipment-assignments/${id}`, changes);

/** { assignment, history }: each signature and return. */
export const getAssignmentHistory = (id) => httpClient.get(`/equipment-assignments/${id}/history`);

/** Emails the employee the assignment's form to sign. */
export const sendAssignmentForm = (id) => httpClient.post(`/equipment-assignments/${id}/send-form`);

/** month (like 2026-11) required; page, limit, search. data.items: employee, summary, assignments. */
export const listMonthlyEquipment = (params) => httpClient.get("/equipment-assignments/monthly", { params });
