/** @format */

import axios from "../axiosInstance";
import { BASE_URL } from "../Host";

//admin login
export const AdminLogin = async (formdata) => {
  console.log("result", formdata);
  return await axios.post(BASE_URL + "admin/auth/login", formdata);
};

export const GetAuthorizationUrl = async () => {
  return await axios.get(BASE_URL + "calendar/adminAuthorize", {
    headers: {
      "x-access-token": `${localStorage.getItem("adminToken")}`,
      "Content-Type": "multipart/form-data",
    },
  });
};

export const GetValidateToken = async (token) => {
  return await axios.get(BASE_URL + "calendar/getValidateToken", {
    headers: {
      "x-access-token": token,
      "Content-Type": "multipart/form-data",
    },
  });
};

//get all user
export const GetUsers = async (adminToken, role_id) => {
  try {
    const res = await axios.get(BASE_URL + "admin/user/getAllUsers", {
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

export const GetClosestEmployees = async (clientId) => {
  try {
    const res = await axios.get(
      BASE_URL + `admin/user/get-closest-employees/${clientId}`,
    );

    return res;
  } catch (error) {
    console.error("Error fetching closest employees:", error);
    throw error;
  }
};

export const GetAllDriver = async (adminToken) => {
  try {
    const res = await axios.get(
      BASE_URL + "admin/user/getAllDrivers",
      // { role_id: "7" },
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

export const ToggleLogoutImageRequired = async (user_id, adminToken) => {
  try {
    const res = await axios.put(
      BASE_URL + "admin/user/toggle-logout-image",
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

export const UpdateEmployeeType = async (body) => {
  try {
    const res = await axios.post(
      BASE_URL + "admin/user/update-employee-type",
      body,
    );

    return res;
  } catch (error) {
    console.error("Error updating employee type:", error);
    throw error;
  }
};

export const SendTwoWeekSchedule = (body) => {
  return axios.post(BASE_URL + "admin/booking/send-two-week-schedule", body);
};

//get userby id
export const GetUserById = async (id) => {
  return await axios.get(BASE_URL + "admin/user/getUserById?id=" + id);
};

export const GetClosestEmployeesByAddress = async (addressId) => {
  return await axios.get(
    BASE_URL + "admin/user/get-closest-employees-by-address/" + addressId
  );
};

export const DeleteUserAddress = async (addressId) => {
  return await axios.delete(
    BASE_URL + "admin/user/delete-user-address/" + addressId
  );
};

// export const GetAllDriver = async (id) => {
//   return await axios.get(BASE_URL + "admin/user/getAllDrivers");
// };

//admin add user
export const AddUser = async (data) => {
  return await axios.post(`${BASE_URL}admin/user/createUser`, data, {
    headers: {
      "Content-Type": "application/json",
      "x-access-token": `${localStorage.getItem("adminToken")}`,
    },
  });
};

export const SendReview = async (data) => {
  return await axios.post(`${BASE_URL}admin/user/sendReviewEmail`, data);
};

export const EditUserById = async (id, formData) => {
  return await axios.post(
    BASE_URL + `admin/user/adminEditUser/${id}`,
    formData,
  );
};

export const ChangeAssignedAdmin = async (body) => {
  try {
    const res = await axios.post(
      BASE_URL + "admin/user/change-assigned-admin",
      body,
    );

    return res;
  } catch (error) {
    console.error("Error updating employee type:", error);
    throw error;
  }
};

//delete user
export const DeleteUser = async (user_id) => {
  return await axios.post(
    `${BASE_URL}admin/user/deleteUser`,
    { user_id: user_id },
    {
      headers: {
        "x-access-token": `${localStorage.getItem("adminToken")}`,
        "Content-Type": "multipart/form-data",
      },
    },
  );
};

//get all roles
export const GetAllRoles = async () => {
  const res = await axios.get(BASE_URL + "role");

  return res;
};

//get role byid
export const GetRoleById = async (id) => {
  return await axios.get(BASE_URL + "role/getRolebyId?id=" + id);
};

//create role
export const CreateRole = async (formData) => {
  return await axios.post(BASE_URL + "role/create", formData, {
    headers: {
      "x-access-token": `${localStorage.getItem("adminToken")}`,
      "Content-Type": "multipart/form-data",
    },
  });
};

//update role
export const UpdateRoles = async (formData) => {
  return await axios.put(BASE_URL + "role/editRole", formData, {
    headers: {
      "x-access-token": `${localStorage.getItem("adminToken")}`,
      "Content-Type": "multipart/form-data",
    },
  });
};

//delete role
export const DeleteRole = async (role_id, adminToken) => {
  const formData = new FormData();
  formData.append("role_id", role_id);
  return axios.delete(BASE_URL + "role/deleteRole", {
    data: formData,
    headers: {
      "Content-Type": "multipart/form-data",
      "x-access-token": adminToken,
    },
  });
};

// ********************************ADMIN API***********************************************************
export const ChangeAdminPassword = async (data) => {
  return axios.post(BASE_URL + "admin/auth/change-password", data, {
    headers: {
      "Content-Type": "multipart/form-data",
      "x-access-token": `${localStorage.getItem("adminToken")}`,
    },
  });
};

export const GetAdmins = async (adminToken, role_id) => {
  try {
    const res = await axios.get(BASE_URL + "admin/auth/getAllAdmins", {
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

export const GetAdminById = async (id) => {
  return await axios.get(BASE_URL + "admin/auth/findAdminById?id=" + id);
};

export const UpdateAdmin = async (formData) => {
  return await axios.put(BASE_URL + "admin/auth/updateAdmin", formData, {
    headers: {
      "x-access-token": `${localStorage.getItem("adminToken")}`,
      "Content-Type": "multipart/form-data",
    },
  });
};

export const DeleteAdmin = async (admin_id, adminToken) => {
  const formData = new FormData();
  formData.append("admin_id", admin_id);
  return axios.delete(BASE_URL + "admin/auth/deleteAdmin", {
    data: formData,
    headers: {
      "Content-Type": "multipart/form-data",
      "x-access-token": adminToken,
    },
  });
};

export const GetAdminProfile = async (adminToken) => {
  return axios.get(BASE_URL + "admin/auth/getProfile", {
    headers: {
      "Content-Type": "multipart/form-data",
      "x-access-token": adminToken,
    },
  });
};

export const GetReviewLink = async () => {
  const res = await axios.get(BASE_URL + "admin/user/getReviewLink");
  return res;
};

export const CreateOrUpdateReviewLink = async (formData) => {
  return await axios.post(
    BASE_URL + "admin/user/createOrUpdateReviewLink",
    formData,
  );
};

export const CreateAdmin = async (formData) => {
  return await axios.post(BASE_URL + "admin/auth/register", formData, {
    headers: {
      "x-access-token": `${localStorage.getItem("adminToken")}`,
      "Content-Type": "multipart/form-data",
    },
  });
};

export const ChangePaymentStatus = async ({ user_id, payment_status }) => {
  const formData = new FormData();
  formData.append("user_id", user_id);
  formData.append("payment_status", payment_status);

  return await axios.post(BASE_URL + "admin/updatepaymentStatus", formData);
};

export const GetUserCount = async () => {
  const res = await axios.get(BASE_URL + "/admin/user/getUserCount");
  return res;
};

export const GetDriverCount = async () => {
  const res = await axios.get(BASE_URL + "/admin/user/getDriverCount");
  return res;
};

export const GetAdminCount = async () => {
  const res = await axios.get(BASE_URL + "/admin/user/getAdminCount");
  return res;
};

export const GetBlogCount = async () => {
  const res = await axios.get(BASE_URL + "admin/user/getBlogCount");
  return res;
};

export const GetProductCount = async () => {
  const res = await axios.get(BASE_URL + "admin/user/getProductCount");
  return res;
};

export const GetServiceCount = async () => {
  const res = await axios.get(BASE_URL + "admin/user/getServiceCount");
  return res;
};

export const GetOrderCount = async () => {
  const res = await axios.get(BASE_URL + "admin/user/getOrderCount");
  return res;
};

export const GetBookingCount = async () => {
  const res = await axios.get(BASE_URL + "admin/user/getBookingCount");
  return res;
};

export const GetSalesCountByMonth = async () => {
  const res = await axios.get(BASE_URL + "admin/user/getSalesCountByMonth");
  return res;
};

export const GetMostBookedService = async () => {
  const res = await axios.get(BASE_URL + "admin/user/getMostBookedService");
  return res;
};

export const getUserLoginTimings = async () => {
  const res = await axios.get(BASE_URL + "admin/user/login/timings", {
    headers: {
      "x-access-token": `${localStorage.getItem("adminToken")}`,
      "Content-Type": "multipart/form-data",
    },
  });
  return res;
};

export const clearUserLoginTimings = async () => {
  const res = await axios.delete(BASE_URL + "admin/user/login/timings/clear", {
    headers: {
      "x-access-token": `${localStorage.getItem("adminToken")}`,
      "Content-Type": "multipart/form-data",
    },
  });
  return res;
};

export const GetAllSupervisorByAdmin = async (id) => {
  const res = await axios.get(
    BASE_URL + `admin/user/getAllSupervisorByAdmin/${id}`,
  );
  return res;
};

export const GetAllQualityInspectorByAdmin = async (id) => {
  const res = await axios.get(
    BASE_URL + `admin/user/getAllQualityInspectorByAdmin/${id}`,
  );
  return res;
};

export const GetAllCleanerByAdmin = async (id) => {
  const res = await axios.get(
    BASE_URL + `admin/user/getAllCleanerByAdmin/${id}`,
  );
  return res;
};

export const ChangeSyncWithCalandar = async (data) => {
  return axios.post(BASE_URL + "booking/syncWithCalendarForAdmin", data, {
    headers: {
      "Content-Type": "multipart/form-data",
      "x-access-token": `${localStorage.getItem("adminToken")}`,
    },
  });
};

export const GetPayment = async (adminToken, role_id) => {
  try {
    const res = await axios.get(BASE_URL + "admin/user/getAllTransactions", {
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

// Get all distinct prices
export const GetServicePrices = async (token) => {
  const res = await axios.get(BASE_URL + "service/getServicePrices");
  return res;
};

export const UpdateServicePrices = async (formData) => {
  try {
    const res = await axios.post(
      BASE_URL + "service/updateServicePrices",
      formData,
    );
    return res;
  } catch (error) {
    console.error("Error fetching users:", error);
    throw error;
  }
};

export const StateAPI = (id) => {
  return axios.get(BASE_URL + `country/${id}`);
};

// cityApi
export const CityAPI = (state_id) => {
  return axios.get(BASE_URL + `state/${state_id}`);
};

export const AddNewUserAddress = async (formData) => {
  try {
    const res = await axios.post(
      BASE_URL + "admin/user/addNewUserAddress",
      formData,
    );
    return res;
  } catch (error) {
    console.error("Error fetching users:", error);
    throw error;
  }
};

export const EditAddress = async (formData) => {
  try {
    const res = await axios.put(BASE_URL + "user/editAddress", formData);
    return res;
  } catch (error) {
    console.error("Error fetching users:", error);
    throw error;
  }
};

export const GetVideos = async () => {
  const res = await axios.get(BASE_URL + "trendingVideos/getAllTrendingVideos");
  return res;
};

export const GetVideoById = async (id) => {
  return await axios.get(
    BASE_URL + `trendingVideos/findTrendingVideoById/${id}`,
  );
};

export const DeleteVideos = (heading_id) => {
  return axios.post(BASE_URL + `trendingVideos/deleteTrendingVideo`, {
    heading_id: heading_id,
  });
};

export const UpdateVideo = async (id, formData) => {
  return await axios.put(
    BASE_URL + `trendingVideos/updateTrendingVideo/${id}`,
    formData,
    {
      headers: {
        "x-access-token": `${localStorage.getItem("adminToken")}`,
        "Content-Type": "multipart/form-data",
      },
    },
  );
};

export const CreateVideos = (formData, adminToken) => {
  return axios.post(BASE_URL + `trendingVideos/createTrendingVideo`, formData, {
    headers: {
      "x-access-token": `${adminToken}`,
      "Content-Type": "multipart/form-data",
    },
  });
};

export const ResetUserCredentials = async (formData, adminToken) => {
  return await axios.post(
    BASE_URL + `admin/user/resetUserCredentials`,
    formData,
    {
      headers: {
        "x-access-token": `${adminToken}`,
        "Content-Type": "multipart/form-data",
      },
    },
  );
};

export const SendQuote = async (formData) => {
  return await axios.post(BASE_URL + `admin/user/submitServiceQuote`, formData);
};

export const GetServiceQuoteById = async (id) => {
  const res = await axios.get(
    BASE_URL + `admin/user/getServiceQuoteById/${id}`,
  );
  return res;
};

// draft api

export const GetLatestDraftQuote = async (id) => {
  const res = await axios.get(
    BASE_URL + `admin/user/getLatestDraftQuote/${id}`,
  );
  return res;
};

export const GetAllDraftQuotes = async (id) => {
  const res = await axios.get(
    BASE_URL + `admin/user/getAllDraftQuotesByUser/${id}`,
  );
  return res;
};

export const SaveDraftQuote = async (formData) => {
  return await axios.post(BASE_URL + `admin/user/saveDraftQuote`, formData);
};

export const DeleteDraftQuote = async (id) => {
  const res = await axios.delete(
    BASE_URL + `admin/user/deleteDraftQuote/${id}`,
  );
  return res;
};

export const GetNextQuoteRef = async (ref_type) => {
  return axios.get(BASE_URL + `admin/user/getNextQuoteRef`, {
    params: { ref_type },
  });
};

// service estimate api
export const GetAllServiceEstimate = async () => {
  const res = await axios.get(BASE_URL + `admin/auth/getAllServiceEstimates`);
  return res;
};

export const EditServiceQuote = async (formData) => {
  return await axios.put(BASE_URL + `admin/user/editServiceQuote`, formData);
};

export const GenerateServiceEstimate = async (formData) => {
  return await axios.post(
    BASE_URL + `admin/auth/generate-estimate-pdf`,
    formData,
  );
};

export const EditServiceEstimate = async (formData) => {
  return await axios.put(
    BASE_URL + `admin/auth/update-service-estimate`,
    formData,
  );
};

export const GetServiceEstimateById = async (id) => {
  return axios.get(BASE_URL + `admin/auth/service-estimate/${id}`);
};

export const ResumeSigning = async (id) => {
  const res = await axios.get(BASE_URL + `admin/auth/resume-signing/${id}`);
  return res;
};

export const DeleteServiceEstimate = async (id) => {
  return axios.delete(BASE_URL + `admin/auth/deleteServiceEstimate/${id}`);
};

// contarct agreement api

export const GetAllContractAgreements = async () => {
  const res = await axios.get(BASE_URL + `admin/auth/getAllContractAgreements`);
  return res;
};

export const GenerateContractAgreement = async (formData) => {
  return await axios.post(
    BASE_URL + `admin/auth/generate-contract-agreement`,
    formData,
  );
};

export const UpdateContractAgreement = async (formData) => {
  return await axios.put(
    BASE_URL + `admin/auth/updateContractAgreement`,
    formData,
  );
};

export const GetContractAgreementById = async (id) => {
  return axios.get(BASE_URL + `admin/auth/contract-agreement/${id}`);
};

export const ResumeSigningContract = async (id) => {
  const res = await axios.get(
    BASE_URL + `admin/auth/resume-contract-signing/${id}`,
  );
  return res;
};

export const DeleteContractAgreement = async (id) => {
  return axios.delete(BASE_URL + `admin/auth/deleteContractAgreement/${id}`);
};

export const GetLiveWorkingEmployees = async (body) => {
  const res = await axios.post(
    BASE_URL + "/admin/user/live-working-employees",
    body,
  );
  return res;
};

export const GetLateAbsentEmployees = async (body) => {
  const res = await axios.post(
    BASE_URL + "/admin/user/late-absent-employees",
    body,
  );
  return res;
};

export const GetInvoiceAnalytics = async (month) => {
  const res = await axios.post(
    BASE_URL + `invoice/getBusinessAnalytics?month=${month}`,
  );
  return res;
};

export const GetUpcomingScheduledBookings = async (body) => {
  const res = await axios.post(
    BASE_URL + "/admin/user/upcoming-scheduled-bookings",
    body,
  );

  return res;
};
