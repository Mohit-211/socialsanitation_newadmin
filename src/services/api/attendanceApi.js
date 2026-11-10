import httpClient from "@/services/httpClient";
import { API_BASE_URL } from "@/config/env";

//get all products
export const GetAllLeaveRequest = async () => {
    try {
        const res = await httpClient.get(API_BASE_URL + "attendance/getAllLeaveRequest");
        return res;
    } catch (error) {
        console.error("Error fetching users:", error);
        throw error;
    }
};

export const UpdateLeaveStatus = async (id, formData) => {
    return await httpClient.post(API_BASE_URL + `attendance/updateLeaveStatus/${id}`, formData, {
      headers: {
        "x-access-token": `${localStorage.getItem("adminToken")}`,
        "Content-Type": "multipart/form-data",
      },
    });
  };

  export const GetAttendanceByUserId = async (id, formData) => {
    return await httpClient.post(API_BASE_URL + `attendance/getAttendanceByUserId/${id}`, formData, {
      headers: {
        "x-access-token": `${localStorage.getItem("adminToken")}`,
        "Content-Type": "multipart/form-data",
      },
    });
  };

  export const GetAllAttendance = async (formData) => {
    return await httpClient.post(API_BASE_URL + `attendance/getAllAttendance`, formData, {
      headers: {
        "x-access-token": `${localStorage.getItem("adminToken")}`,
        "Content-Type": "multipart/form-data",
      },
    });
  };

   export const GetDailyPresenceForMonth = async (formData) => {
    return await httpClient.post(API_BASE_URL + `attendance/getDailyPresenceForMonth`, formData, {
      headers: {
        "x-access-token": `${localStorage.getItem("adminToken")}`,
        "Content-Type": "multipart/form-data",
      },
    });
  };

     export const ManualClockInOut = async (formData) => {
    return await httpClient.post(API_BASE_URL + `/attendance/manualClockInOut`, formData, {
      headers: {
        "x-access-token": `${localStorage.getItem("adminToken")}`,
        "Content-Type": "multipart/form-data",
      },
    });
  };

  export const GetTodayAttendanceStats = async (formData) => {
    return await httpClient.post(API_BASE_URL + `attendance/getTodayAttendanceStats`, formData, {
      headers: {
        "x-access-token": `${localStorage.getItem("adminToken")}`,
        "Content-Type": "multipart/form-data",
      },
    });
  };

    export const GetAllBreaks = async (formData) => {
    return await httpClient.post(API_BASE_URL + `attendance/getAllBreaks`, formData, {
      headers: {
        "x-access-token": `${localStorage.getItem("adminToken")}`,
        "Content-Type": "multipart/form-data",
      },
    });
  };

