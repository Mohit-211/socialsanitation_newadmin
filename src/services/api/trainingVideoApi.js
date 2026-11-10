import httpClient from "@/services/httpClient";
import { API_BASE_URL } from "@/config/env";

export const GetVideos = async () => {
  const res = await httpClient.get(API_BASE_URL + "trendingVideos/getAllTrendingVideos");
  return res;
};

export const GetVideoById = async (id) => {
  return await httpClient.get(
    API_BASE_URL + `trendingVideos/findTrendingVideoById/${id}`,
  );
};

export const CreateVideos = (formData, adminToken) => {
  return httpClient.post(API_BASE_URL + `trendingVideos/createTrendingVideo`, formData, {
    headers: {
      "x-access-token": `${adminToken}`,
      "Content-Type": "multipart/form-data",
    },
  });
};

export const UpdateVideo = async (id, formData) => {
  return await httpClient.put(
    API_BASE_URL + `trendingVideos/updateTrendingVideo/${id}`,
    formData,
    {
      headers: {
        "x-access-token": `${localStorage.getItem("adminToken")}`,
        "Content-Type": "multipart/form-data",
      },
    },
  );
};

export const DeleteVideos = (heading_id) => {
  return httpClient.post(API_BASE_URL + `trendingVideos/deleteTrendingVideo`, {
    heading_id: heading_id,
  });
};
