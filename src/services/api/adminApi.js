import httpClient from "@/services/httpClient";
import { API_BASE_URL } from "@/config/env";

export const GetAdmins = async (adminToken) => {
  try {
    const res = await httpClient.get(API_BASE_URL + "admin/auth/getAllAdmins", {
      headers: {
        "x-access-token": `${adminToken}`,
        "Content-Type": "multipart/form-data",
      },
    });

    return res;
  } catch (error) {
    // Handle error if needed
    console.error("Error fetching users:", error);
    throw error;
  }
};

export const GetAdminById = async (id) => {
  return await httpClient.get(API_BASE_URL + "admin/auth/findAdminById?id=" + id);
};

export const CreateAdmin = async (formData) => {
  return await httpClient.post(API_BASE_URL + "admin/auth/register", formData, {
    headers: {
      "x-access-token": `${localStorage.getItem("adminToken")}`,
      "Content-Type": "multipart/form-data",
    },
  });
};

export const UpdateAdmin = async (formData) => {
  return await httpClient.put(API_BASE_URL + "admin/auth/updateAdmin", formData, {
    headers: {
      "x-access-token": `${localStorage.getItem("adminToken")}`,
      "Content-Type": "multipart/form-data",
    },
  });
};

export const DeleteAdmin = async (admin_id, adminToken) => {
  const formData = new FormData();
  formData.append("admin_id", admin_id);
  return httpClient.delete(API_BASE_URL + "admin/auth/deleteAdmin", {
    data: formData,
    headers: {
      "Content-Type": "multipart/form-data",
      "x-access-token": adminToken,
    },
  });
};
