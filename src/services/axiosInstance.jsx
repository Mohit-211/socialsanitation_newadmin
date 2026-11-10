import axios from "axios";
import { BASE_URL } from "./Host";

const axiosInstance = axios.create({
  baseURL: BASE_URL,
});

axiosInstance.interceptors.response.use(
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
  }
);

export default axiosInstance;
