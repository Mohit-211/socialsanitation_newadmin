import httpClient from "@/services/httpClient";
import type { ApiCall } from "@/services/apiResult";
import type {
  Employee,
  EmployeeAttendanceDay,
  EmployeeName,
  EmployeeRolesChange,
  Id,
  Items,
  ListQuery,
  LogoutImageRule,
  Option,
} from "@/types";

// Employees: the crew. Each has one or more roles (supervisor, qa_technician,
// cleaner, housekeeper, bdm, salesperson) and a pay type (W2 or 1099). A BDM
// is an employee with the bdm role; BDMs can't sign in to the panel.

export type EmployeeRole = "cleaner" | "housekeeper" | "supervisor" | "qa_technician" | "bdm" | "salesperson";
export type EmployeeType = "W2_BI_WEEKLY" | "1099";

/** Employee role codes and names, as the backend names them. */
export const EMPLOYEE_ROLES: Option<EmployeeRole>[] = [
  { value: "cleaner", label: "Cleaner" },
  { value: "housekeeper", label: "Housekeeper" },
  { value: "supervisor", label: "Supervisor" },
  { value: "qa_technician", label: "Quality Assurance Technician" },
  { value: "bdm", label: "Business Development Manager" },
  { value: "salesperson", label: "Salesperson" },
];

/** How an employee is paid. */
export const EMPLOYEE_TYPES: Option<EmployeeType>[] = [
  { value: "W2_BI_WEEKLY", label: "W2 Bi-Weekly" },
  { value: "1099", label: "1099 Contractor" },
];

/** data.items: id, roles and name of every employee, for pickers. */
export const listEmployeeNames = (): ApiCall<Items<EmployeeName>> => httpClient.get("/employee-names");

/**
 * Every employee (not paged): id, email, name, phone, roles (id, code, name),
 * employee_type, logout_image_required and user_address.
 */
export const listEmployees = (): ApiCall<Items<Employee>> => httpClient.get("/employees");

export const getEmployee = (id: Id): ApiCall<Employee> => httpClient.get(`/employees/${id}`);

/** What the employee calls take: who they are, and the place of their hiring form's address. */
export interface EmployeeInput {
  email?: string;
  name?: string;
  roles?: string[];
  employee_type?: string;
  hiring_form_submission_id?: number;
  country_id?: number;
  state_id?: number;
  city_id?: number;
  address_lat?: number | null;
  address_long?: number | null;
}

/**
 * email, roles, employee_type and hiring_form_submission_id are required; the
 * hiring form's address comes with country_id, state_id, city_id,
 * address_lat and address_long. 201; data.credentials_emailed says whether
 * the sign-in details went out.
 */
export const createEmployee = (employee: EmployeeInput): ApiCall<Employee & { credentials_emailed?: boolean }> =>
  httpClient.post("/employees", employee);

/** Only what changed. A new hiring form (with its place) becomes their primary address. */
export const updateEmployee = (id: Id, changes: EmployeeInput): ApiCall<Employee> =>
  httpClient.patch(`/employees/${id}`, changes);

/** Needs records.delete. */
export const deleteEmployee = (id: Id): ApiCall<null> => httpClient.delete(`/employees/${id}`);

/** A new password by email, to a new address when one is given. 502 when the email can't go out. */
export const resetEmployeeCredentials = (id: Id, newEmail?: string | null): ApiCall<null> =>
  httpClient.post(`/employees/${id}/reset-credentials`, { new_email: newEmail || null });

/** At least one role. A change of field job moves their open visits with them. */
export const setEmployeeRoles = (id: Id, roles: string[]): ApiCall<EmployeeRolesChange> =>
  httpClient.put(`/employees/${id}/roles`, { roles });

export const setEmployeeType = (id: Id, employeeType: string): ApiCall<Employee> =>
  httpClient.patch(`/employees/${id}/type`, { employee_type: employeeType });

/** Switches whether they must take a photo to sign out. */
export const toggleEmployeeLogoutImage = (id: Id): ApiCall<LogoutImageRule> => httpClient.post(`/employees/${id}/logout-image`);

/** filterType (TODAY, WEEK, MONTH or CUSTOM, with start_date and end_date). data.items: one row a day. */
export const listEmployeeAttendance = (id: Id, params?: ListQuery): ApiCall<Items<EmployeeAttendanceDay>> =>
  httpClient.get(`/employees/${id}/attendance`, { params });
