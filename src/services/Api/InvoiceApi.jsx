/** @format */

import axios from "../axiosInstance";
import { BASE_URL } from "../Host";

export const GetInvoices = async (month = null) => {
	try {
		const res = await axios.get(
			BASE_URL + `admin/user/invoices?month=${month}`,
		);

		return res;
	} catch (error) {
		console.error("Error fetching invoices:", error);
		throw error;
	}
};

/**
 * Mark invoice as BOOKED
 */
export const MarkInvoiceBooked = async (id) => {
	try {
		const res = await axios.put(
			`${BASE_URL}admin/user/quotes/mark-booked/${id}`,
		);
		return res;
	} catch (error) {
		console.error("Error marking invoice as booked:", error);
		throw error;
	}
};

/**
 * Mark invoice as PAID BY CASH
 */
export const MarkInvoiceCashPaid = async (id) => {
	try {
		const res = await axios.put(
			`${BASE_URL}admin/user/quotes/mark-cash-paid/${id}`,
		);
		return res;
	} catch (error) {
		console.error("Error marking invoice as cash paid:", error);
		throw error;
	}
};

export const GetPaymentStatus = async (orderId) => {
	try {
		const res = await axios.get(BASE_URL + `payment/status/${orderId}`);
		return res;
	} catch (error) {
		console.error("Error fetching payment status:", error);
		throw error;
	}
};

//generate invoice api

export const CreateInvoice = async (formData) => {
	try {
		const res = await axios.post(BASE_URL + "invoice/createInvoice", formData);

		return res;
	} catch (error) {
		console.error("Error creating invoice:", error);
		throw error;
	}
};

export const GetAllInvoices = async (month = null) => {
	try {
		const res = await axios.get(
			BASE_URL + `invoice/getAllInvoices?month=${month}`,
		);

		return res;
	} catch (error) {
		console.error("Error fetching invoices:", error);
		throw error;
	}
};

export const GetNextInvoiceRef = async (ref_type) => {
	return axios.get(BASE_URL + `invoice/getNextInvoiceRef`, {
		params: { ref_type },
	});
};

export const DeleteInvoice = async (id) => {
	return axios.delete(`${BASE_URL}invoice/deleteInvoice/${id}`);
};

export const GetInvoiceById = async (id) => {
  try {
    return await axios.get(BASE_URL + `invoice/${id}`);
  } catch (error) {
    console.error("Get invoice error:", error);
    throw error;
  }
};

export const UpdateInvoice = async (id, payload) => {
  try {
    return await axios.put(BASE_URL + `invoice/${id}`, payload);
  } catch (error) {
    console.error("Update invoice error:", error);
    throw error;
  }
};

export const GetAllUserName = async () => {
	const res = await axios.get(BASE_URL + "admin/user/getAllUserName");
	return res;
};


export const GetMonthlyInvoicesSummary = async (month = null) => {
	try {
		const res = await axios.post(
			BASE_URL + `admin/user/getMonthlyInvoicesSummary?month=${month}`,
		);

		return res;
	} catch (error) {
		console.error("Error fetching invoices:", error);
		throw error;
	}
};

export const GetMonthlyAllInvoicesSummary = async (month = null) => {
	try {
		const res = await axios.post(
			BASE_URL + `invoice/getMonthlyAllInvoicesSummary?month=${month}`,
		);

		return res;
	} catch (error) {
		console.error("Error fetching invoices:", error);
		throw error;
	}
};

export const MarkMonthlyInvoiceCheckPaid = async (id) => {
	try {
		const res = await axios.patch(
			`${BASE_URL}invoice/mark-paid-check/${id}`,
		);

		return res;
	} catch (error) {
		console.error("Error marking invoice as check paid:", error);
		throw error;
	}
};