import httpClient from "@/services/httpClient";
import { API_BASE_URL } from "@/config/env";

// contarct agreement api

export const GetAllContractAgreements = async () => {
  const res = await httpClient.get(API_BASE_URL + `admin/auth/getAllContractAgreements`);
  return res;
};

export const GetContractAgreementById = async (id) => {
  return httpClient.get(API_BASE_URL + `admin/auth/contract-agreement/${id}`);
};

export const GenerateContractAgreement = async (formData) => {
  return await httpClient.post(
    API_BASE_URL + `admin/auth/generate-contract-agreement`,
    formData,
  );
};

export const UpdateContractAgreement = async (formData) => {
  return await httpClient.put(
    API_BASE_URL + `admin/auth/updateContractAgreement`,
    formData,
  );
};

export const DeleteContractAgreement = async (id) => {
  return httpClient.delete(API_BASE_URL + `admin/auth/deleteContractAgreement/${id}`);
};
