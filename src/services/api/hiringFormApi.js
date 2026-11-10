import httpClient from "@/services/httpClient";
import { API_BASE_URL } from "@/config/env";

//get all products
export const GetAllHiringForm = async () => {
  try {
    const res = await httpClient.get(API_BASE_URL + "/form/getAllForm");
    return res;
  } catch (error) {
    console.error("Error fetching users:", error);
    throw error;
  }
};

export const GetHiringFormById = async (id) => {
  return await httpClient.get(API_BASE_URL + `form/getFormById/${id}`);
};

export const DeleteHiringForm = async (ids) => {
  return httpClient.post(API_BASE_URL + `form/deleteForm`, { ids });
};
