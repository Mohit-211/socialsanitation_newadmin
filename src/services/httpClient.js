import axios from "axios";
import { API_BASE_URL } from "@/config/env";

// Shared axios instance for every API module in src/services/api.
const httpClient = axios.create({
  baseURL: API_BASE_URL,
});

// An expired or rejected session sends the user back to the login page.
httpClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (
      error?.response?.data?.message === "jwt expired" ||
      error?.response?.status === 401
    ) {
      localStorage.removeItem("adminToken");
      localStorage.removeItem("adminId");

      window.location.href = "/Login";
    }

    return Promise.reject(error);
  },
);

export default httpClient;
