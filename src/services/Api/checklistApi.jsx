
import axios from "../axiosInstance";
import { BASE_URL } from "../Host";


export const GetAllChecklist = (adminToken, formdata) => {
	return axios.get(BASE_URL + `checklist/getAllServiceChecklist`, {
		headers: {
			"x-access-token": `${adminToken}`,
			"Content-Type": "multipart/form-data",
		},
	});
};

export const CreateChecklist = (formData, adminToken) => {
	return axios.post(BASE_URL + `checklist/createServiceChecklist`, formData, {
		headers: {
			"x-access-token": `${adminToken}`,
			"Content-Type": "multipart/form-data",
		},
	});
};
export const GetDailyChecklistById = async (id) => {
    return await axios.get(BASE_URL + `/checklist/findServiceChecklistById/${id}`);
  };


export const DeleteChecklist = (heading_id) => {
	return axios.post(BASE_URL + `checklist/deleteServiceChecklist`, { heading_id: heading_id });
};

export const UpdateChecklist = async (id, formData) => {
	return await axios.put(BASE_URL + `checklist/updateServiceChecklist/${id}`, formData, {
		headers: {
			"x-access-token": `${localStorage.getItem("adminToken")}`,
			"Content-Type": "multipart/form-data",
		},
	});
};
