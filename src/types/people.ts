import type { Role, UploadedFile } from "./api";
import type { AccountAddress } from "./clients";

export type UserType = "ADMIN" | "EMPLOYEE" | "CLIENT";

/** What an account may do: its kind, roles and permission codes. */
export interface Access {
  user_type: UserType;
  roles: Role[];
  permissions: string[];
}

/** An admin account. */
export interface Admin extends Access {
  id: number;
  name: string | null;
  email: string;
  mobile: string | null;
  is_active: boolean;
  created_at: string;
}

/** The signed-in admin, as sign-in and GET /profile answer. */
export interface SessionUser extends Partial<Access> {
  id: number;
  name: string | null;
  email: string;
  mobile?: string | null;
  image_url?: string | null;
  status?: string | number | null;
  is_active?: boolean;
  created_at?: string;
  notification_status?: boolean | number | null;
  logout_image_required?: boolean | number | null;
}

/** A stored sign-in: the token, when it ends, and who. */
export interface Session {
  token: string;
  expires_at: string | null;
  user: SessionUser;
}

/** The sign-in answer. */
export interface SignInAnswer extends SessionUser {
  token: string;
  expires_at: string | null;
}

/** An employee: the crew, as the employee list and their page send them. */
export interface Employee {
  id: number;
  email: string;
  name: string | null;
  phone?: string | null;
  roles: Role[];
  employee_type?: string | null;
  logout_image_required?: boolean | number | null;
  user_address?: AccountAddress[] | null;
  hiring_form_submission_id?: number | null;
  created_at?: string;
}

/** A change of roles: the employee (without their roles), and the role codes before and after. */
export interface EmployeeRolesChange {
  user: Omit<Employee, "roles">;
  previous_roles: string[];
  roles: string[];
}

/** Whether an employee must take a photo to sign out, after it was switched. */
export interface LogoutImageRule {
  user_id: number;
  logout_image_required: boolean;
}

/** A day of an employee's attendance: present (with times and photos), absent, or on leave. */
export interface EmployeeAttendanceDay {
  date: string;
  status: string;
  clock_in: string | null;
  clock_out: string | null;
  /** The clock-in and -out moments (UTC instants, despite the name). */
  clock_in_est: string | null;
  clock_out_est: string | null;
  leave_reason: string | null;
  total_hours: string | number | null;
  clock_in_image_uri: string | null;
  clock_out_image_uri: string | null;
}

/** An employee's name and roles, for pickers. */
export interface EmployeeName {
  id: number;
  name: string | null;
  roles: Role[];
  email?: string | null;
}

/** A BDM: an employee with the bdm role. */
export interface Bdm {
  id: number;
  name: string | null;
  email: string;
  mobile: string | null;
}

/** A client given to a BDM: the assignment, with the client as user_bdm. */
export interface BdmAssignment {
  id: number;
  bdm_id: number;
  user_id: number;
  is_active?: boolean | number;
  created_at?: string;
  user_bdm: { id: number; email: string; name: string | null; phone: string | null } | null;
}

/** A sign-in: the app, where from, and when it began and ended (local times in the device's zone). */
export interface LoginRecord {
  id: number;
  user_id: number;
  app: string | null;
  time_zone: string | null;
  ip_address: string | null;
  login_time_utc: string;
  logout_time_utc: string | null;
  login_time_local: string | null;
  logout_time_local: string | null;
  login_user: { id: number; email: string; name: string | null } | null;
}

/** Everyone's sign-ins, newest first, by user id. */
export type LoginActivity = Record<string, LoginRecord[]>;

/** A place on the nearest-employees map. */
export interface NearbyPlace {
  name?: string | null;
  address?: string | null;
  address_lat: number | string | null;
  address_long: number | string | null;
}

/** Someone near an address, for crewing a visit: how far they live, in miles. */
export interface NearbyEmployee extends NearbyPlace {
  id: number;
  name: string | null;
  employee_type?: string | null;
  distance: number;
}

/** The nearest employees to an address, or to a client's primary address. */
export interface NearestEmployees {
  selected_address?: NearbyPlace | null;
  client?: NearbyPlace | null;
  employees: NearbyEmployee[];
}

// --- Hiring --------------------------------------------------------------------------------

export interface HiringApplicationSummary {
  id: number;
  language: string | null;
  applicant_name: string | null;
  applicant_email: string | null;
  pdf_url: string | null;
  processing_status: "pending" | "done" | "failed" | null;
  submitted_at: string;
}

export interface HiringApplication extends HiringApplicationSummary {
  form_data: Record<string, unknown>;
  attachments: UploadedFile[];
}

/** A hiring form found for a new employee: the applicant and their address, as they typed it. */
export interface HiringFormMatch {
  submission_id: number;
  submitted_at: string;
  language: string | null;
  name: string;
  first_name: string;
  middle_name: string;
  last_name: string;
  email: string | null;
  phone: string;
  address: string;
  apt_suite: string;
  city: string;
  state: string;
  country: string;
  zip_code: string;
  full_address: string;
  pdf_url: string | null;
}
