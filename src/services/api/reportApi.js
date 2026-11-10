import httpClient from "@/services/httpClient";
import { API_BASE_URL } from "@/config/env";

export const GetAllReports = async (adminToken) => {
	try {
		const res = await httpClient.get(API_BASE_URL + "report/getAllReport", {
			headers: {
				"x-access-token": adminToken,
				"timezone":"Asia/Kolkata",
				"Content-Type": "application/json",
			},
		});

		return res.data; 
	} catch (error) {
		console.error("Error fetching service categories:", error);
		throw error;
	}
};

export const UpdateReport = async (formData) => {
	return await httpClient.post(API_BASE_URL + "report/updateReportStatus", formData, {
		headers: {
			"x-access-token": `${localStorage.getItem("adminToken")}`,
			"Content-Type": "multipart/form-data",
		},
	});
};

