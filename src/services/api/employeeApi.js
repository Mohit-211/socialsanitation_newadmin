import httpClient from "@/services/httpClient";

// Employees: the crew. Each has one or more roles (supervisor, qa_technician,
// cleaner, housekeeper, bdm, salesperson) and a pay type (W2 or 1099).

/** Employee role codes and names, as the backend names them. */
export const EMPLOYEE_ROLES = Object.freeze([
  { value: "cleaner", label: "Cleaner" },
  { value: "housekeeper", label: "Housekeeper" },
  { value: "supervisor", label: "Supervisor" },
  { value: "qa_technician", label: "Quality Assurance Technician" },
  { value: "bdm", label: "Business Development Manager" },
  { value: "salesperson", label: "Salesperson" },
]);

/** data.items: id, roles and name of every employee, for pickers. */
export const listEmployeeNames = () => httpClient.get("/employee-names");
