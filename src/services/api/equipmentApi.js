import httpClient from "@/services/httpClient";
import { API_BASE_URL } from "@/config/env";

// EQUIPMENT

// GET all equipments (supports page & limit, defaults to a large limit so everything shows on one page)
export const GetAllEquipments = (page = 1, limit = 100) => {
  return httpClient.get(API_BASE_URL + `eqipment/get-all-equipments`, {
    params: { page, limit },
  });
};

export const CreateEquipment = (formData) => {
  return httpClient.post(API_BASE_URL + `eqipment/create-equipment`, formData);
};

export const UpdateEquipment = (id, formData) => {
  return httpClient.put(API_BASE_URL + `eqipment/update-equipment/${id}`, formData);
};

export const DeleteEquipment = (id) => {
  return httpClient.delete(API_BASE_URL + `eqipment/delete-equipment/${id}`);
};

// ASSIGNMENTS

// GET all assignments (supports page & limit, defaults to a large limit so everything shows on one page)
export const GetAllAssignments = (page = 1, limit = 100) => {
  return httpClient.get(API_BASE_URL + `eqipment/get-all-assignments`, {
    params: { page, limit },
  });
};

export const GetAssignmentOverview = () => {
  return httpClient.get(API_BASE_URL + `eqipment/assignment-overview`);
};

// body: { employee_id, equipment_id, assigned_quantity, expected_return_date }
export const AssignEquipment = (formData) => {
  return httpClient.post(API_BASE_URL + `eqipment/assign-equipment`, formData);
};

// body: { returned_quantity, remarks }
export const UpdateAssignment = (id, formData) => {
  return httpClient.put(API_BASE_URL + `eqipment/update-assignment/${id}`, formData);
};

export const GetEmployeeDropdown = () => {
  return httpClient.get(API_BASE_URL + `admin/user/employee-dropdown`);
};

// employee equipement histroy
export const GetAssignmentHistory = (assignmentId) => {
  return httpClient.get(API_BASE_URL + `eqipment/assignment/${assignmentId}/history`);
};

export const GetMonthlyEquipmentRecords = ({
  month,
  page = 1,
  limit = 10,
  search = "",
} = {}) => {
  return httpClient.get(API_BASE_URL + "eqipment/employee/equipment-records", {
    params: {
      month,
      page,
      limit,
      search: search || undefined,
    },
  });
};

export const SendAssignmentFormEmail = (assignmentId) => {
  return httpClient.post(API_BASE_URL + `eqipment/assignment/${assignmentId}/form/send`);
};