import httpClient from "@/services/httpClient";
import { API_BASE_URL } from "@/config/env";

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
