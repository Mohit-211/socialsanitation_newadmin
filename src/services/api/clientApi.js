import httpClient from "@/services/httpClient";

// Clients: accounts that use the client app, and the client page.

export const CLIENT_TYPES = Object.freeze([
  { value: "commercial", label: "Commercial" },
  { value: "residential", label: "Residential" },
]);

/** Every client in data.items: id, email, name, phone, assigned_to, created_at, user_address. */
export const listClients = () => httpClient.get("/clients");

/** Everything on file for one client. */
export const getClient = (id) => httpClient.get(`/clients/${id}`);

/**
 * The client page in one call: client, addresses, enquiries, client_sheets,
 * scopes_of_work, cost_calculations, estimates, quotes, service_requests,
 * contracts, bookings ({ repeating, upcoming }) and invoices, as short rows.
 */
export const getClientFlow = (id) => httpClient.get(`/clients/${id}/flow`);

/** email is required; also name, client_type, assigned_to and sheet (the first sheet, with areas). */
export const createClient = (client) => httpClient.post("/clients", client);

/** Any of name, email, cc_email, client_type. Sheets are saved on their own. */
export const updateClient = (id, changes) => httpClient.patch(`/clients/${id}`, changes);

/** Needs records.delete. */
export const deleteClient = (id) => httpClient.delete(`/clients/${id}`);

/** Emails the client new sign-in details, optionally at a new address. */
export const resetClientCredentials = (id, newEmail) =>
  httpClient.post(`/clients/${id}/reset-credentials`, { new_email: newEmail || "" });

export const assignClientAdmin = (id, adminId) =>
  httpClient.patch(`/clients/${id}/assigned-admin`, { assigned_to: adminId });

/** The client's BDM, or null. */
export const getClientBdm = (id) => httpClient.get(`/clients/${id}/bdm`);

export const listEmployeesNearClient = (id) => httpClient.get(`/clients/${id}/nearest-employees`);

/** id, email, name, phone for every client: for pickers. */
export const listClientNames = () => httpClient.get("/client-names");

/** id, name, email, mobile and address for every client: for document forms. */
export const listClientPicks = () => httpClient.get("/client-picks");

/** Clients with no BDM. */
export const listUnassignedClients = () => httpClient.get("/unassigned-clients");
