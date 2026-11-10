import httpClient from "@/services/httpClient";

// Employees: the crew. Each has one or more roles (supervisor, qa_technician,
// cleaner, housekeeper, bdm, salesperson) and a pay type (W2 or 1099). A BDM
// is an employee with the bdm role; BDMs can't sign in to the panel.

/** Employee role codes and names, as the backend names them. */
export const EMPLOYEE_ROLES = Object.freeze([
  { value: "cleaner", label: "Cleaner" },
  { value: "housekeeper", label: "Housekeeper" },
  { value: "supervisor", label: "Supervisor" },
  { value: "qa_technician", label: "Quality Assurance Technician" },
  { value: "bdm", label: "Business Development Manager" },
  { value: "salesperson", label: "Salesperson" },
]);

/** How an employee is paid. */
export const EMPLOYEE_TYPES = Object.freeze([
  { value: "W2_BI_WEEKLY", label: "W2 Bi-Weekly" },
  { value: "1099", label: "1099 Contractor" },
]);

/** data.items: id, roles and name of every employee, for pickers. */
export const listEmployeeNames = () => httpClient.get("/employee-names");

/**
 * Every employee (not paged): id, email, name, phone, roles (id, code, name),
 * employee_type, logout_image_required and user_address.
 */
export const listEmployees = () => httpClient.get("/employees");

export const getEmployee = (id) => httpClient.get(`/employees/${id}`);

/**
 * email, roles, employee_type and hiring_form_submission_id are required; the
 * hiring form's address comes with country_id, state_id, city_id,
 * address_lat and address_long. 201; data.credentials_emailed says whether
 * the sign-in details went out.
 */
export const createEmployee = (employee) => httpClient.post("/employees", employee);

/** Only what changed. A new hiring form (with its place) becomes their primary address. */
export const updateEmployee = (id, changes) => httpClient.patch(`/employees/${id}`, changes);

/** Needs records.delete. */
export const deleteEmployee = (id) => httpClient.delete(`/employees/${id}`);

/** A new password by email, to a new address when one is given. 502 when the email can't go out. */
export const resetEmployeeCredentials = (id, newEmail) =>
  httpClient.post(`/employees/${id}/reset-credentials`, { new_email: newEmail || null });

/** At least one role. A change of field job moves their open visits with them. */
export const setEmployeeRoles = (id, roles) => httpClient.put(`/employees/${id}/roles`, { roles });

export const setEmployeeType = (id, employeeType) =>
  httpClient.patch(`/employees/${id}/type`, { employee_type: employeeType });

/** Switches whether they must take a photo to sign out. */
export const toggleEmployeeLogoutImage = (id) => httpClient.post(`/employees/${id}/logout-image`);

/** filterType (TODAY, WEEK, MONTH or CUSTOM, with start_date and end_date). data.items: one row a day. */
export const listEmployeeAttendance = (id, params) => httpClient.get(`/employees/${id}/attendance`, { params });
