
import axios from "../axiosInstance";
import { BASE_URL } from "../Host";


export const GetAllChecklist = (adminToken, formdata) => {
    return axios.get(BASE_URL + `checklist/getDailyChecklist`, {
        headers: {
            "x-access-token": `${adminToken}`,
            "Content-Type": "multipart/form-data",
        },
    });
};

export const CreateChecklist = (formData, adminToken) => {
    return axios.post(BASE_URL + `checklist/createDailyChecklist`, formData, {
        headers: {
            "x-access-token": `${adminToken}`,
            "Content-Type": "multipart/form-data",
        },
    });
};

export const GetDailyChecklistById = async (id) => {
    return await axios.get(BASE_URL + `/checklist/findDailyChecklistById/${id}`);
  };

export const DeleteChecklist = (heading_id) => {
    return axios.post(BASE_URL + `checklist/deleteDailyChecklist`, { heading_id: heading_id });
};

export const UpdateChecklist = async (id, formData) => {
    return await axios.put(BASE_URL + `checklist/updateDailyChecklist/${id}`, formData, {
        headers: {
            "x-access-token": `${localStorage.getItem("adminToken")}`,
            "Content-Type": "multipart/form-data",
        },
    });
};

export const GetChecklistMainTitle = async (token) => {
    const res = await axios.get(BASE_URL + "checklist/getChecklistMainTitle");
    return res;
};

export const CreateOrUpdateChecklistMainTitle = async (formData) => {
    try {
        const res = await axios.post(
            BASE_URL + "checklist/createOrUpdateChecklistMainTitle",
            formData
        );
        return res;
    } catch (error) {
        console.error("Error fetching users:", error);
        throw error;
    }
};

export const GetWeeklyChecklistWithStatus = (formData, adminToken) => {
    return axios.post(BASE_URL + `checklist/getWeeklyChecklistWithStatus`, formData, {
        headers: {
            "x-access-token": `${adminToken}`,
            "Content-Type": "multipart/form-data",
        },
    });
};

export const GetJanitor = async () => {
    return await axios.get(BASE_URL + `/checklist/getJanitors`);
  };
