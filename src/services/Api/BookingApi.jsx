
import axios from "../axiosInstance";
import { BASE_URL } from "../Host";

// ****************************************** USER BOOKING *****************************************
export const GetUserBooking = async (adminToken, booking_status, period) => {
	let config = {
		booking_status: booking_status,
		period: period,
	};
	try {
		const res = await axios.post(
			BASE_URL + "admin/booking/getAllBookings",
			config,
			{
				headers: {
					"x-access-token": `${adminToken}`,
					"Content-Type": "multipart/form-data",
				},
			}
		);

		return res;
	} catch (error) {
		console.error("Error fetching users:", error);
		throw error;
	}
};

export const GetBookingRequestCount = async () => {
	const res = await axios.get(BASE_URL + "admin/booking/checkBookingRequest");
	return res;
};

export const GetBookingById = async (id) => {
	return await axios.get(
		BASE_URL + `admin/booking/getBookingByBookingid/${id}`
	);
};

export const GetBookingDetailsByBookingId = async (id) => {
	return await axios.get(
		BASE_URL + `admin/booking/getBookingDetailsByBookingid/${id}`
	);
};

export const GetAllServiceCheckListByBookingId = async (id) => {
	return await axios.get(
		BASE_URL + `booking/getAllServiceCheckListByBookingId/${id}`
	);
};

export const UpdateBooking = async (formData) => {
	return await axios.post(
		BASE_URL + `admin/booking/updateBookingStatus`,
		formData,
		{
			headers: {
				"x-access-token": `${localStorage.getItem("adminToken")}`,
				"Content-Type": "multipart/form-data",
			},
		}
	);
};

export const DeleteBooking = async (formData) => {
	return axios.post(BASE_URL + "admin/booking/deleteBooking", formData);
};

//booking in user pages

export const GetBookingByUserId = async (formData) => {
	try {
		const res = await axios.post(BASE_URL + "admin/user/getBookinsByUserId",formData);
		return res;
	} catch (error) {
		console.error("Error fetching users:", error);
		throw error;
	}
};

export const GetServiceQuotesByUserId = async (id) => {
	const res = await axios.get(
		BASE_URL + `admin/user/getServiceQuotesByUserId/${id}`
	);
	return res;
};

export const GetMonthlyInvoicesByUserId = async (id) => {
	const res = await axios.get(
		BASE_URL + `invoice/user/${id}`
	);
	return res;
};

export const GetServiceRequestsByUserId = async (id) => {
	const res = await axios.get(
		BASE_URL + `admin/user/getServiceRequestsByUserId/${id}`
	);
	return res;
};

export const GetContractAgreementsByUserId = async (id) => {
	const res = await axios.get(
		BASE_URL + `admin/auth/contract-agreement/user/${id}`
	);
	return res;
};


export const GetServiceEstimatesByUserId = async (id) => {
	const res = await axios.get(
		BASE_URL + `admin/auth/service-estimate/user/${id}`
	);
	return res;
};

export const GetBookingBySPId = async (formData) => {
	try {
		const res = await axios.post(
			BASE_URL + "admin/user/getBookingByEmployeeId",
			formData
		);
		return res;
	} catch (error) {
		console.error("Error fetching users:", error);
		throw error;
	}
};

//STATISTICS
export const GetAllBookingCount = async () => {
	const res = await axios.get(BASE_URL + "admin/user/getBookingCount");
	return res;
};

export const GetPendingCount = async () => {
	const res = await axios.get(BASE_URL + "admin/user/getPendingBookingCount");
	return res;
};

export const GetCompletedCount = async () => {
	const res = await axios.get(BASE_URL + "admin/user/getCompletedBookingCount");
	return res;
};

export const GetDeletedCount = async () => {
	const res = await axios.get(BASE_URL + "admin/user/getDeletedBookingCount");
	return res;
};

// create booking

export const GetAllUserNameByAdmin = async () => {
	const res = await axios.get(BASE_URL + "admin/user/getAllUserNameByAdmin");
	return res;
};

export const GetAllServiceNameByAdmin = async () => {
	const res = await axios.get(BASE_URL + "service/getAllServiceNameByAdmin");
	return res;
};

export const GetUserAddressByUserId = async (id) => {
	const res = await axios.get(BASE_URL + `user/getUserAddressByUserId/${id}`);
	return res;
};

export const CreateBookingByAdmin = async (formData) => {
	return await axios.post(
		BASE_URL + "admin/booking/adminCreateBooking",
		formData,
		{
			headers: {
				"x-access-token": `${localStorage.getItem("adminToken")}`,
				"Content-Type": "multipart/form-data",
			},
		}
	);
};

export const CreateGuestBookingByAdmin = async (formData) => {
	return await axios.post(
		BASE_URL + "admin/booking/adminCreateBookingForGuest",
		formData,
		{
			headers: {
				"x-access-token": `${localStorage.getItem("adminToken")}`,
				"Content-Type": "multipart/form-data",
			},
		}
	);
};

export const GetMonthlyBookingCalendar = async (formData) => {
	return await axios.post(
		BASE_URL + "admin/booking/getMonthlyBookingCalendar",
		formData,
		{
			headers: {
				"x-access-token": `${localStorage.getItem("adminToken")}`,
				"Content-Type": "multipart/form-data",
			},
		}
	);
};

export const GetDayOverview = async (formData) => {
	return await axios.post(BASE_URL + "admin/booking/getDayOverview", formData, {
		headers: {
			"x-access-token": `${localStorage.getItem("adminToken")}`,
			"Content-Type": "multipart/form-data",
		},
	});
};

export const GetBookingOverviewById = async (id) => {
	const res = await axios.get(
		BASE_URL + `admin/booking/getBookingOverviewById/${id}`
	);
	return res;
};


export const GetClientChecklistByUserId = async (id) => {
	const res = await axios.get(
		BASE_URL + `admin/user/getClientChecklistByUserId/${id}`
	);
	return res;
};

export const GantOverview = async (payload) => {
	return await axios.post(BASE_URL + "admin/booking/getDayOverviewForGantt", payload, {
		headers: {
			"x-access-token": `${localStorage.getItem("adminToken")}`,
			"Content-Type": "multipart/form-data",
		},
	});
};

export const DeleteServiceQuote = async (id) => {
	return axios.delete(`${BASE_URL}admin/user/deleteQuote/${id}`);
};



