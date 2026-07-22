import axios from "axios";

const axiosInstance = axios.create({
  baseURL: "https://node.socialsanitation.com/api/v1/",
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