import httpClient from "@/services/httpClient";

// Admin accounts. An admin has the role super_admin or admin; BDMs are
// employees now, added from the employee form. Adding, changing another admin,
// removing one and ending their sessions need admins.manage (Super Admin);
// anyone may edit their own name, mobile and email.

/** The admin roles the forms offer, by code. */
export const ADMIN_ROLES = Object.freeze([
  { value: "super_admin", label: "Super Admin" },
  { value: "admin", label: "Admin" },
]);

export const listAdmins = () => httpClient.get("/admins");

export const getAdmin = (id) => httpClient.get(`/admins/${id}`);

/** name, email and role are required; mobile is optional. */
export const createAdmin = ({ name, email, role, mobile }) =>
  httpClient.post("/admins", { name, email, role, mobile: mobile || undefined });

/** Any of name, mobile, email, role; an empty value changes nothing. */
export const updateAdmin = (id, changes) => httpClient.patch(`/admins/${id}`, changes);

export const deleteAdmin = (id) => httpClient.delete(`/admins/${id}`);

/** Signs the admin out on every device. */
export const endAdminSessions = (id) => httpClient.post(`/admins/${id}/end-sessions`);
