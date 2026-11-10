import httpClient from "@/services/httpClient";
import { API_BASE_URL } from "@/config/env";

// service estimate api
export const GetAllServiceEstimate = async () => {
  const res = await httpClient.get(API_BASE_URL + `admin/auth/getAllServiceEstimates`);
  return res;
};

export const GetServiceEstimateById = async (id) => {
  return httpClient.get(API_BASE_URL + `admin/auth/service-estimate/${id}`);
};

export const GenerateServiceEstimate = async (formData) => {
  return await httpClient.post(
    API_BASE_URL + `admin/auth/generate-estimate-pdf`,
    formData,
  );
};

export const EditServiceEstimate = async (formData) => {
  return await httpClient.put(
    API_BASE_URL + `admin/auth/update-service-estimate`,
    formData,
  );
};

export const DeleteServiceEstimate = async (id) => {
  return httpClient.delete(API_BASE_URL + `admin/auth/deleteServiceEstimate/${id}`);
};
