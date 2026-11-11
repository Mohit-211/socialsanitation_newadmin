import httpClient from "@/services/httpClient";
import type { ApiCall } from "@/services/apiResult";
import type { Bdm, BdmAssignment, Id, Items } from "@/types";

// BDMs are employees with the bdm role. The panel lists them and assigns
// clients to them; they sign in to the employee app, not the panel.

/** data.items: id, name, email, mobile. */
export const listBdms = (): ApiCall<Items<Bdm>> => httpClient.get("/bdms");

/** The BDM's clients: each assignment, with the client as user_bdm (id, email, name, phone). */
export const listBdmClients = (bdmId: Id): ApiCall<Items<BdmAssignment>> => httpClient.get(`/bdms/${bdmId}/clients`);

export interface BdmAssignmentChange {
  bdmId: Id;
  addClientIds?: Id[];
  removeClientIds?: Id[];
}

/**
 * Gives clients to a BDM (user_id: a client given here leaves any other BDM)
 * and takes others away (remove_user_id).
 */
export const assignBdmClients = ({ bdmId, addClientIds = [], removeClientIds = [] }: BdmAssignmentChange): ApiCall<null> =>
  httpClient.post("/bdm-assignments", { bdm_id: bdmId, user_id: addClientIds, remove_user_id: removeClientIds });

/**
 * Takes the BDM role off (needs records.delete): an account that was only a
 * BDM is closed, anyone else keeps their other roles. Their clients are
 * unassigned.
 */
export const removeBdm = (bdmId: Id): ApiCall<null> => httpClient.delete(`/bdms/${bdmId}`);
