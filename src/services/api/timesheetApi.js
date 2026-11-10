import httpClient from "@/services/httpClient";
import { API_BASE_URL } from "@/config/env";

export const getEmployeeDayOverview = async (payload) => {
    return await httpClient.post(API_BASE_URL + "admin/booking/getEmployeeDayOverview", payload);
};

export const updateEmployeeTimesheet = async (payload) => {
	return await httpClient.post(API_BASE_URL + "admin/booking/updateEmployeeTimesheet", payload);
};

export const getEmployeeRangeOverview = async (payload) => {
    return await httpClient.post(API_BASE_URL + "admin/booking/getEmployeeRangeOverview", payload);
};