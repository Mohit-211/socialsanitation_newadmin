
import axios from "../axiosInstance";
import { BASE_URL } from "../Host";

export const GetAllReports = async (adminToken, params) => {
	try {
		const res = await axios.get(BASE_URL + "report/getAllReport", {
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
	return await axios.post(BASE_URL + "report/updateReportStatus", formData, {
		headers: {
			"x-access-token": `${localStorage.getItem("adminToken")}`,
			"Content-Type": "multipart/form-data",
		},
	});
};


