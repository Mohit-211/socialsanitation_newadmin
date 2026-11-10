import httpClient from "@/services/httpClient";
import { API_BASE_URL } from "@/config/env";

export const AddNewUserAddress = async (formData) => {
  try {
    const res = await httpClient.post(
      API_BASE_URL + "admin/user/addNewUserAddress",
      formData,
    );
    return res;
  } catch (error) {
    console.error("Error fetching users:", error);
    throw error;
  }
};

export const EditAddress = async (formData) => {
  try {
    const res = await httpClient.put(API_BASE_URL + "user/editAddress", formData);
    return res;
  } catch (error) {
    console.error("Error fetching users:", error);
    throw error;
  }
};

export const DeleteUserAddress = async (addressId) => {
  return await httpClient.delete(
    API_BASE_URL + "admin/user/delete-user-address/" + addressId,
  );
};

export const StateAPI = (id) => {
  return httpClient.get(API_BASE_URL + `country/${id}`);
};

// cityApi
export const CityAPI = (state_id) => {
  return httpClient.get(API_BASE_URL + `state/${state_id}`);
};
