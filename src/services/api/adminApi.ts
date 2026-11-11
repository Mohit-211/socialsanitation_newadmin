import httpClient from "@/services/httpClient";
import type { ApiCall } from "@/services/apiResult";
import type { Admin, Id, Items, Option } from "@/types";

// Admin accounts. An admin has the role super_admin or admin; BDMs are
// employees now, added from the employee form. Adding, changing another admin,
// removing one and ending their sessions need admins.manage (Super Admin);
// anyone may edit their own name, mobile and email.

export type AdminRole = "super_admin" | "admin";

/** The admin roles the forms offer, by code. */
export const ADMIN_ROLES: Option<AdminRole>[] = [
  { value: "super_admin", label: "Super Admin" },
  { value: "admin", label: "Admin" },
];

export interface AdminInput {
  name: string;
  email: string;
  role: AdminRole | string;
  mobile?: string;
}

export const listAdmins = (): ApiCall<Items<Admin>> => httpClient.get("/admins");

export const getAdmin = (id: Id): ApiCall<Admin> => httpClient.get(`/admins/${id}`);

/** name, email and role are required; mobile is optional. */
export const createAdmin = ({ name, email, role, mobile }: AdminInput): ApiCall<Admin> =>
  httpClient.post("/admins", { name, email, role, mobile: mobile || undefined });

/** Any of name, mobile, email, role; an empty value changes nothing. */
export const updateAdmin = (id: Id, changes: Partial<AdminInput>): ApiCall<Admin> =>
  httpClient.patch(`/admins/${id}`, changes);

export const deleteAdmin = (id: Id): ApiCall<null> => httpClient.delete(`/admins/${id}`);

/** Signs the admin out on every device. */
export const endAdminSessions = (id: Id): ApiCall<null> => httpClient.post(`/admins/${id}/end-sessions`);
