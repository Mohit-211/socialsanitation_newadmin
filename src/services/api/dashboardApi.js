import httpClient from "@/services/httpClient";
import { API_BASE_URL } from "@/config/env";

export const GetUserCount = async () => {
  const res = await httpClient.get(API_BASE_URL + "/admin/user/getUserCount");
  return res;
};

export const GetDriverCount = async () => {
  const res = await httpClient.get(API_BASE_URL + "/admin/user/getDriverCount");
  return res;
};

export const GetAdminCount = async () => {
  const res = await httpClient.get(API_BASE_URL + "/admin/user/getAdminCount");
  return res;
};

export const GetServiceCount = async () => {
  const res = await httpClient.get(API_BASE_URL + "admin/user/getServiceCount");
  return res;
};

export const GetLiveWorkingEmployees = async (body) => {
  const res = await httpClient.post(
    API_BASE_URL + "/admin/user/live-working-employees",
    body,
  );
  return res;
};

export const GetLateAbsentEmployees = async (body) => {
  const res = await httpClient.post(
    API_BASE_URL + "/admin/user/late-absent-employees",
    body,
  );
  return res;
};

export const GetUpcomingScheduledBookings = async (body) => {
  const res = await httpClient.post(
    API_BASE_URL + "/admin/user/upcoming-scheduled-bookings",
    body,
  );

  return res;
};

export const GetUpcomingInvoices = async () => {
  const res = await httpClient.get(API_BASE_URL + "invoice/upcoming");
  return res;
};

