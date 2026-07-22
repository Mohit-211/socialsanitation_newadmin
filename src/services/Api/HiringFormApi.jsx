/** @format */

import axios from "../axiosInstance";
import { BASE_URL } from "../Host";

//get all products
export const GetAllHiringForm = async (adminToken, role_id) => {
	try {
		const res = await axios.get(BASE_URL + "/form/getAllForm");
		return res;
	} catch (error) {
		console.error("Error fetching users:", error);
		throw error;
	}
};

export const GetHiringFormById = async (id) => {
	return await axios.get(BASE_URL + `form/getFormById/${id}`);
  };

  export const DeleteHiringForm = async (id) => {
	return axios.delete(BASE_URL + `form/deleteForm/${id}`);
  };
