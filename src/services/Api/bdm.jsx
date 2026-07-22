/** @format */

import axios from "../axiosInstance";
import { BASE_URL } from "../Host";

export const GetAllBDMS = (adminToken, formdata) => {
	return axios.get(BASE_URL + `bdmuser/getAllBDMs`, {
		headers: {
			"x-access-token": `${adminToken}`,
			"Content-Type": "multipart/form-data",
		},
	});
};

export const GetUserByBDMId = async (id) => {
	try {
		const res = await axios.get(BASE_URL + `bdmuser/getAllUsersByBDMId/${id}`);
		return res;
	} catch (error) {
		console.error("Error fetching users:", error);
		throw error;
	}
};

export const AssignUser = (formData, adminToken) => {
	return axios.post(BASE_URL + `bdmuser/assignUser`, formData, {
	});
};

export const DeleteBDM = (user_id) => {
	return axios.post(BASE_URL + `bdmuser/deleteBDM`, { user_id: user_id });
};

export const GetAllUsers = (adminToken, formdata) => {
	return axios.get(BASE_URL + `bdmuser/getAllUsers`);
};

export const GetBDMByUserId = async (id) => {
	try {
		const res = await axios.get(BASE_URL + `bdmuser/bdm-by-user/${id}`);
		return res;
	} catch (error) {
		console.error("Error fetching users:", error);
		throw error;
	}
};
