import httpClient from "@/services/httpClient";
import { API_BASE_URL } from "@/config/env";

export const SendQuote = async (formData) => {
  return await httpClient.post(API_BASE_URL + `admin/user/submitServiceQuote`, formData);
};

export const GetServiceQuoteById = async (id) => {
  const res = await httpClient.get(
    API_BASE_URL + `admin/user/getServiceQuoteById/${id}`,
  );
  return res;
};

export const EditServiceQuote = async (formData) => {
  return await httpClient.put(API_BASE_URL + `admin/user/editServiceQuote`, formData);
};

// draft api

export const GetLatestDraftQuote = async (id) => {
  const res = await httpClient.get(
    API_BASE_URL + `admin/user/getLatestDraftQuote/${id}`,
  );
  return res;
};

export const GetAllDraftQuotes = async (id) => {
  const res = await httpClient.get(
    API_BASE_URL + `admin/user/getAllDraftQuotesByUser/${id}`,
  );
  return res;
};

export const SaveDraftQuote = async (formData) => {
  return await httpClient.post(API_BASE_URL + `admin/user/saveDraftQuote`, formData);
};

export const DeleteDraftQuote = async (id) => {
  const res = await httpClient.delete(
    API_BASE_URL + `admin/user/deleteDraftQuote/${id}`,
  );
  return res;
};

export const GetNextQuoteRef = async (ref_type) => {
  return httpClient.get(API_BASE_URL + `admin/user/getNextQuoteRef`, {
    params: { ref_type },
  });
};
