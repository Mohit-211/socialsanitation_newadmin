import httpClient from "@/services/httpClient";
import { API_BASE_URL } from "@/config/env";

//get all user
export const GetUsers = async (adminToken) => {
  try {
    const res = await httpClient.get(API_BASE_URL + "admin/user/getAllUsers", {
      headers: {
        "x-access-token": `${adminToken}`,
        "Content-Type": "multipart/form-data",
      },
    });

    return res;
  } catch (error) {
    // Handle error if needed
    console.error("Error fetching users:", error);
    throw error;
  }
};

//get userby id
export const GetUserById = async (id) => {
  return await httpClient.get(API_BASE_URL + "admin/user/getUserById?id=" + id);
};

//admin add user
export const AddUser = async (data) => {
  return await httpClient.post(`${API_BASE_URL}admin/user/createUser`, data, {
    headers: {
      "Content-Type": "application/json",
      "x-access-token": `${localStorage.getItem("adminToken")}`,
    },
  });
};

export const EditUserById = async (id, formData) => {
  return await httpClient.post(
    API_BASE_URL + `admin/user/adminEditUser/${id}`,
    formData,
  );
};

//delete user
export const DeleteUser = async (user_id) => {
  return await httpClient.post(
    `${API_BASE_URL}admin/user/deleteUser`,
    { user_id: user_id },
    {
      headers: {
        "x-access-token": `${localStorage.getItem("adminToken")}`,
        "Content-Type": "multipart/form-data",
      },
    },
  );
};

// ********************************ADMIN API***********************************************************

export const ResetUserCredentials = async (formData, adminToken) => {
  return await httpClient.post(
    API_BASE_URL + `admin/user/resetUserCredentials`,
    formData,
    {
      headers: {
        "x-access-token": `${adminToken}`,
        "Content-Type": "multipart/form-data",
      },
    },
  );
};

export const ChangeAssignedAdmin = async (body) => {
  try {
    const res = await httpClient.post(
      API_BASE_URL + "admin/user/change-assigned-admin",
      body,
    );

    return res;
  } catch (error) {
    console.error("Error updating employee type:", error);
    throw error;
  }
};

export const ChangeEmployeeRole = async (id, { role_id, sub_role_id }) => {
  return await httpClient.post(
    `${API_BASE_URL}admin/user/change-employee-role/${id}`,
    {
      role_id,
      sub_role_id,
    },
    {
      headers: {
        "Content-Type": "application/json",
        "x-access-token": `${localStorage.getItem("adminToken")}`,
      },
    },
  );
};

export const UpdateEmployeeType = async (body) => {
  try {
    const res = await httpClient.post(
      API_BASE_URL + "admin/user/update-employee-type",
      body,
    );

    return res;
  } catch (error) {
    console.error("Error updating employee type:", error);
    throw error;
  }
};

export const ToggleLogoutImageRequired = async (user_id, adminToken) => {
  try {
    const res = await httpClient.put(
      API_BASE_URL + "admin/user/toggle-logout-image",
      { user_id },
      {
        headers: {
          "x-access-token": `${adminToken}`,
          "Content-Type": "multipart/form-data",
        },
      },
    );

    return res;
  } catch (error) {
    // Handle error if needed
    console.error("Error fetching users:", error);
    throw error;
  }
};

export const SendTwoWeekSchedule = (body) => {
  return httpClient.post(API_BASE_URL + "admin/booking/send-two-week-schedule", body);
};

export const GetAllDriver = async (adminToken) => {
  try {
    const res = await httpClient.get(
      API_BASE_URL + "admin/user/getAllDrivers",
      {
        headers: {
          "x-access-token": `${adminToken}`,
          "Content-Type": "multipart/form-data",
        },
      },
    );

    return res;
  } catch (error) {
    // Handle error if needed
    console.error("Error fetching users:", error);
    throw error;
  }
};

export const GetClosestEmployees = async (clientId) => {
  try {
    const res = await httpClient.get(
      API_BASE_URL + `admin/user/get-closest-employees/${clientId}`,
    );

    return res;
  } catch (error) {
    console.error("Error fetching closest employees:", error);
    throw error;
  }
};

export const GetClosestEmployeesByAddress = async (addressId) => {
  return await httpClient.get(
    API_BASE_URL + "admin/user/get-closest-employees-by-address/" + addressId,
  );
};

export const GetHiringFormsByEmail = async (email, name) => {
  return await httpClient.get(`${API_BASE_URL}form/hiring-forms-by-email`, {
    params: {
      ...(email ? { email } : {}),
      ...(name ? { name } : {}),
    },
    headers: {
      "Content-Type": "application/json",
      "x-access-token": `${localStorage.getItem("adminToken")}`,
    },
  });
};

export const GetAllSupervisorByAdmin = async (id) => {
  const res = await httpClient.get(
    API_BASE_URL + `admin/user/getAllSupervisorByAdmin/${id}`,
  );
  return res;
};

export const GetAllQualityInspectorByAdmin = async (id) => {
  const res = await httpClient.get(
    API_BASE_URL + `admin/user/getAllQualityInspectorByAdmin/${id}`,
  );
  return res;
};

export const GetAllCleanerByAdmin = async (id) => {
  const res = await httpClient.get(
    API_BASE_URL + `admin/user/getAllCleanerByAdmin/${id}`,
  );
  return res;
};

export const getUserLoginTimings = async () => {
  const res = await httpClient.get(API_BASE_URL + "admin/user/login/timings", {
    headers: {
      "x-access-token": `${localStorage.getItem("adminToken")}`,
      "Content-Type": "multipart/form-data",
    },
  });
  return res;
};

export const clearUserLoginTimings = async () => {
  const res = await httpClient.delete(API_BASE_URL + "admin/user/login/timings/clear", {
    headers: {
      "x-access-token": `${localStorage.getItem("adminToken")}`,
      "Content-Type": "multipart/form-data",
    },
  });
  return res;
};
