import httpClient from "@/services/httpClient";
import { API_BASE_URL } from "@/config/env";

// BDMs are employees with the bdm role. The panel lists them and assigns
// clients to them; they sign in to the employee app, not the panel.

/** data.items: id, name, email, mobile. */
export const listBdms = () => httpClient.get("/bdms");

/** The BDM's clients. */
export const listBdmClients = (bdmId) => httpClient.get(`/bdms/${bdmId}/clients`);

/** Gives clients to a BDM (user_id) and takes others away (remove_user_id). */
export const assignBdmClients = ({ bdmId, addClientIds = [], removeClientIds = [] }) =>
  httpClient.post("/bdm-assignments", { bdm_id: bdmId, user_id: addClientIds, remove_user_id: removeClientIds });

/** Takes the BDM role off; needs records.delete. Their clients are unassigned. */
export const removeBdm = (bdmId) => httpClient.delete(`/bdms/${bdmId}`);

// ---------------------------------------------------------------------------
// Old /api/v1 calls, still used by the BDM screens until they move to /api/v2.

export const GetAllBDMS = (adminToken) => {
	return httpClient.get(API_BASE_URL + `bdmuser/getAllBDMs`, {
		headers: {
			"x-access-token": `${adminToken}`,
			"Content-Type": "multipart/form-data",
		},
	});
};

export const GetUserByBDMId = async (id) => {
	try {
		const res = await httpClient.get(API_BASE_URL + `bdmuser/getAllUsersByBDMId/${id}`);
		return res;
	} catch (error) {
		console.error("Error fetching users:", error);
		throw error;
	}
};

export const AssignUser = (formData) => {
	return httpClient.post(API_BASE_URL + `bdmuser/assignUser`, formData, {
	});
};

export const DeleteBDM = (user_id) => {
	return httpClient.post(API_BASE_URL + `bdmuser/deleteBDM`, { user_id: user_id });
};

export const GetAllUsers = () => {
	return httpClient.get(API_BASE_URL + `bdmuser/getAllUsers`);
};

export const GetBDMByUserId = async (id) => {
	try {
		const res = await httpClient.get(API_BASE_URL + `bdmuser/bdm-by-user/${id}`);
		return res;
	} catch (error) {
		console.error("Error fetching users:", error);
		throw error;
	}
};
