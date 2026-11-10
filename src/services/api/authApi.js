import httpClient from "@/services/httpClient";
import { API_BASE_URL } from "@/config/env";

//admin login
export const AdminLogin = async (formdata) => {
  return await httpClient.post(API_BASE_URL + "admin/auth/login", formdata);
};

export const GetAdminProfile = async (adminToken) => {
  return httpClient.get(API_BASE_URL + "admin/auth/getProfile", {
    headers: {
      "Content-Type": "multipart/form-data",
      "x-access-token": adminToken,
    },
  });
};

export const ChangeAdminPassword = async (data) => {
  return httpClient.post(API_BASE_URL + "admin/auth/change-password", data, {
    headers: {
      "Content-Type": "multipart/form-data",
      "x-access-token": `${localStorage.getItem("adminToken")}`,
    },
  });
};

export const GetValidateToken = async (token) => {
  return await httpClient.get(API_BASE_URL + "calendar/getValidateToken", {
    headers: {
      "x-access-token": token,
      "Content-Type": "multipart/form-data",
    },
  });
};
