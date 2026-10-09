import axios from "../axiosInstance";
import { BASE_URL } from "../Host";

//get all products
export const GetAllHiringForm = async () => {
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

export const DeleteHiringForm = async (ids) => {
  return axios.post(BASE_URL + `form/deleteForm`, { ids });
};
