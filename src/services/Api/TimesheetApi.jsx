import axios from "../axiosInstance";
import { BASE_URL } from "../Host";

export const getEmployeeDayOverview = async (payload) => {
    return await axios.post(BASE_URL + "admin/booking/getEmployeeDayOverview", payload);
};

export const updateEmployeeTimesheet = async (payload) => {
	return await axios.post(BASE_URL + "admin/booking/updateEmployeeTimesheet", payload);
};

export const getEmployeeRangeOverview = async (payload) => {
    return await axios.post(BASE_URL + "admin/booking/getEmployeeRangeOverview", payload);
};