/** @format */
import axios from "../axiosInstance";
import { BASE_URL } from "../Host";

export const getAllQuestions = async () => {
	const res = await axios.get(BASE_URL + "quote/getAllQuestions");
	return res;
};

export const createQuestion = async (formData) => {
	return await axios.post(BASE_URL + "quote/createQuestions", formData, {});
};

export const updateQuestion = async (id, formData) => {
	return await axios.put(BASE_URL + `quote/editQuestion/${id}`, formData, {});
};

export const deleteQuestion = async (id) => {
	return await axios.delete(BASE_URL + `quote/delete/${id}`);
};

export const getQuoteRequests = async () => {
	return await axios.get(BASE_URL + "quote/getQuoteRequests");
};

export const updateQuoteStatus = async (id, payload) => {
	return await axios.put(BASE_URL + `quote/updateStatus/${id}`, payload);
};
