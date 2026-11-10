import httpClient from "@/services/httpClient";
import { API_BASE_URL } from "@/config/env";

export const GetAllChecklist = (adminToken) => {
	return httpClient.get(API_BASE_URL + `checklist/getAllServiceChecklist`, {
		headers: {
			"x-access-token": `${adminToken}`,
			"Content-Type": "multipart/form-data",
		},
	});
};

export const CreateChecklist = (formData, adminToken) => {
	return httpClient.post(API_BASE_URL + `checklist/createServiceChecklist`, formData, {
		headers: {
			"x-access-token": `${adminToken}`,
			"Content-Type": "multipart/form-data",
		},
	});
};
export const GetDailyChecklistById = async (id) => {
    return await httpClient.get(API_BASE_URL + `/checklist/findServiceChecklistById/${id}`);
  };

export const DeleteChecklist = (heading_id) => {
	return httpClient.post(API_BASE_URL + `checklist/deleteServiceChecklist`, { heading_id: heading_id });
};

export const UpdateChecklist = async (id, formData) => {
	return await httpClient.put(API_BASE_URL + `checklist/updateServiceChecklist/${id}`, formData, {
		headers: {
			"x-access-token": `${localStorage.getItem("adminToken")}`,
			"Content-Type": "multipart/form-data",
		},
	});
};
