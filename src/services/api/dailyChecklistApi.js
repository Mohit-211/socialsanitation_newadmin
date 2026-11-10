import httpClient from "@/services/httpClient";
import { API_BASE_URL } from "@/config/env";

export const GetAllChecklist = (adminToken) => {
    return httpClient.get(API_BASE_URL + `checklist/getDailyChecklist`, {
        headers: {
            "x-access-token": `${adminToken}`,
            "Content-Type": "multipart/form-data",
        },
    });
};

export const CreateChecklist = (formData, adminToken) => {
    return httpClient.post(API_BASE_URL + `checklist/createDailyChecklist`, formData, {
        headers: {
            "x-access-token": `${adminToken}`,
            "Content-Type": "multipart/form-data",
        },
    });
};

export const GetDailyChecklistById = async (id) => {
    return await httpClient.get(API_BASE_URL + `/checklist/findDailyChecklistById/${id}`);
  };

export const DeleteChecklist = (heading_id) => {
    return httpClient.post(API_BASE_URL + `checklist/deleteDailyChecklist`, { heading_id: heading_id });
};

export const UpdateChecklist = async (id, formData) => {
    return await httpClient.put(API_BASE_URL + `checklist/updateDailyChecklist/${id}`, formData, {
        headers: {
            "x-access-token": `${localStorage.getItem("adminToken")}`,
            "Content-Type": "multipart/form-data",
        },
    });
};

export const GetChecklistMainTitle = async () => {
    const res = await httpClient.get(API_BASE_URL + "checklist/getChecklistMainTitle");
    return res;
};

export const CreateOrUpdateChecklistMainTitle = async (formData) => {
    try {
        const res = await httpClient.post(
            API_BASE_URL + "checklist/createOrUpdateChecklistMainTitle",
            formData
        );
        return res;
    } catch (error) {
        console.error("Error fetching users:", error);
        throw error;
    }
};

export const GetWeeklyChecklistWithStatus = (formData, adminToken) => {
    return httpClient.post(API_BASE_URL + `checklist/getWeeklyChecklistWithStatus`, formData, {
        headers: {
            "x-access-token": `${adminToken}`,
            "Content-Type": "multipart/form-data",
        },
    });
};

export const GetJanitor = async () => {
    return await httpClient.get(API_BASE_URL + `/checklist/getJanitors`);
  };
