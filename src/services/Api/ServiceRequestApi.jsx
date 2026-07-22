import axios from "../axiosInstance";
import { BASE_URL } from "../Host";

export const GetAllUserName = async () => {
  const res = await axios.get(BASE_URL + "admin/user/getAllUserName");
  return res;
};

export const CreateServiceRequest = async (formData) => {
  try {
    const res = await axios.post(
      BASE_URL + "admin/user/submitServiceRequest",
      formData,
    );

    return res;
  } catch (error) {
    console.error("Error creating service request:", error);
    throw error;
  }
};

export const GetAllServiceRequests = async (month = null) => {
  try {
    const res = await axios.get(
      BASE_URL + `admin/user/getAllServiceRequests?month=${month}`,
    );

    return res;
  } catch (error) {
    console.error("Error fetching service requests:", error);
    throw error;
  }
};

export const GetNextServiceRequestRef = async (ref_type) => {
  return axios.get(BASE_URL + `admin/user/getNextServiceRequestRef`, {
    params: { ref_type },
  });
};

export const DeleteServiceRequest = async (id) => {
  return axios.delete(`${BASE_URL}admin/user/deleteServiceRequest/${id}`);
};

export const GetServiceRequestById = async (id) => {
  return axios.get(`${BASE_URL}admin/user/getServiceRequestById/${id}`);
};

export const UpdateServiceRequest = async (formData) => {
  try {
    const res = await axios.put(
      BASE_URL + "admin/user/editServiceRequest",
      formData,
    );

    return res;
  } catch (error) {
    console.error("Error creating service request:", error);
    throw error;
  }
};
