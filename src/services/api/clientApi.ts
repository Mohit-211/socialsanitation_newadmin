import httpClient from "@/services/httpClient";
import type { ApiCall } from "@/services/apiResult";
import type {
  Bdm,
  Client,
  ClientFlow,
  ClientName,
  ClientPick,
  ClientType,
  Id,
  Items,
  NearestEmployees,
  Option,
  SheetArea,
} from "@/types";

// Clients: accounts that use the client app, and the client page.

export const CLIENT_TYPES: Option<ClientType>[] = [
  { value: "commercial", label: "Commercial" },
  { value: "residential", label: "Residential" },
];

/** Every client in data.items: id, email, name, phone, assigned_to, created_at, user_address. */
export const listClients = (): ApiCall<Items<Client>> => httpClient.get("/clients");

/** Everything on file for one client. */
export const getClient = (id: Id): ApiCall<Client> => httpClient.get(`/clients/${id}`);

/**
 * The client page in one call: client, addresses, enquiries, client_sheets,
 * scopes_of_work, cost_calculations, estimates, quotes, service_requests,
 * contracts, bookings ({ repeating, upcoming }) and invoices, as short rows.
 */
export const getClientFlow = (id: Id): ApiCall<ClientFlow> => httpClient.get(`/clients/${id}/flow`);

export interface ClientInput {
  email: string;
  name?: string;
  client_type?: ClientType;
  assigned_to?: number | null;
  /** The first sheet, with its areas. */
  sheet?: Record<string, unknown> & { areas?: Partial<SheetArea>[] };
}

/** email is required; also name, client_type, assigned_to and sheet (the first sheet, with areas). */
/** The new client; credentials_emailed says whether their sign-in details went out. */
export const createClient = (client: ClientInput): ApiCall<Client & { credentials_emailed?: boolean }> =>
  httpClient.post("/clients", client);

/** Any of name, email, cc_email, client_type. Sheets are saved on their own. */
export const updateClient = (
  id: Id,
  changes: { name?: string; email?: string; cc_email?: string | null; client_type?: ClientType },
): ApiCall<Client> => httpClient.patch(`/clients/${id}`, changes);

/** Needs records.delete. */
export const deleteClient = (id: Id): ApiCall<null> => httpClient.delete(`/clients/${id}`);

/** Emails the client new sign-in details, optionally at a new address. */
export const resetClientCredentials = (id: Id, newEmail?: string | null): ApiCall<null> =>
  httpClient.post(`/clients/${id}/reset-credentials`, { new_email: newEmail || "" });

export const assignClientAdmin = (id: Id, adminId: Id | null): ApiCall<Client> =>
  httpClient.patch(`/clients/${id}/assigned-admin`, { assigned_to: adminId });

/** The client's BDM, or null. */
export const getClientBdm = (id: Id): ApiCall<Bdm | null> => httpClient.get(`/clients/${id}/bdm`);

export const listEmployeesNearClient = (id: Id): ApiCall<NearestEmployees> =>
  httpClient.get(`/clients/${id}/nearest-employees`);

/** id, email, name, phone for every client: for pickers. */
export const listClientNames = (): ApiCall<Items<ClientName>> => httpClient.get("/client-names");

/** id, name, email, mobile and address for every client: for document forms. */
export const listClientPicks = (): ApiCall<Items<ClientPick>> => httpClient.get("/client-picks");

/** Clients with no BDM. */
export const listUnassignedClients = (): ApiCall<Items<ClientName>> => httpClient.get("/unassigned-clients");
