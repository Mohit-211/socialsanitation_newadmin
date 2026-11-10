import httpClient from "@/services/httpClient";
import { API_BASE_URL } from "@/config/env";

export const GetReviewLink = async () => {
  const res = await httpClient.get(API_BASE_URL + "admin/user/getReviewLink");
  return res;
};

export const CreateOrUpdateReviewLink = async (formData) => {
  return await httpClient.post(
    API_BASE_URL + "admin/user/createOrUpdateReviewLink",
    formData,
  );
};

export const SendReview = async (data) => {
  return await httpClient.post(`${API_BASE_URL}admin/user/sendReviewEmail`, data);
};
