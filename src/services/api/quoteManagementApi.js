import httpClient from "@/services/httpClient";
import { API_BASE_URL } from "@/config/env";

export const getAllQuestions = async () => {
	const res = await httpClient.get(API_BASE_URL + "quote/getAllQuestions");
	return res;
};

export const createQuestion = async (formData) => {
	return await httpClient.post(API_BASE_URL + "quote/createQuestions", formData, {});
};

export const updateQuestion = async (id, formData) => {
	return await httpClient.put(API_BASE_URL + `quote/editQuestion/${id}`, formData, {});
};

export const deleteQuestion = async (id) => {
	return await httpClient.delete(API_BASE_URL + `quote/delete/${id}`);
};

export const getQuoteRequests = async () => {
	return await httpClient.get(API_BASE_URL + "quote/getQuoteRequests");
};

export const updateQuoteStatus = async (id, payload) => {
	return await httpClient.put(API_BASE_URL + `quote/updateStatus/${id}`, payload);
};
