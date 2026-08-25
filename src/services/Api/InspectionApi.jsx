import axios from "../axiosInstance";
import { BASE_URL } from "../Host";


const adminAuthHeaders = () => ({
  "x-access-token": localStorage.getItem("adminToken"),
  role_id: localStorage.getItem("roleId"),
});

export const CreateInspection = async (payload) => {
  return await axios.post(BASE_URL + "inspection/create", payload, {
    headers: adminAuthHeaders(),
  });
};


export const GetMyInspections = async (user_id) => {
  return await axios.post(
    BASE_URL + "inspection/getMyInspections",
    { user_id },
    { headers: adminAuthHeaders() },
  );
};

export const GetInspectionById = async (id) => {
  return await axios.get(BASE_URL + "inspection/getInspectionById/" + id, {
    headers: adminAuthHeaders(),
  });
};

export const DeleteInspection = async (id) => {
  return await axios.delete(BASE_URL + "inspection/deleteInspection/" + id, {
    headers: adminAuthHeaders(),
  });
};