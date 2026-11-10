import httpClient from "@/services/httpClient";
import { API_BASE_URL } from "@/config/env";

const adminAuthHeaders = () => ({
  "x-access-token": localStorage.getItem("adminToken"),
  role_id: localStorage.getItem("roleId"),
});

export const CreateInspection = async (payload) => {
  return await httpClient.post(API_BASE_URL + "inspection/create", payload, {
    headers: adminAuthHeaders(),
  });
};

export const GetMyInspections = async (user_id) => {
  return await httpClient.post(
    API_BASE_URL + "inspection/getMyInspections",
    { user_id },
    { headers: adminAuthHeaders() },
  );
};

export const GetInspectionById = async (id) => {
  return await httpClient.get(API_BASE_URL + "inspection/getInspectionById/" + id, {
    headers: adminAuthHeaders(),
  });
};

export const DeleteInspection = async (id) => {
  return await httpClient.delete(API_BASE_URL + "inspection/deleteInspection/" + id, {
    headers: adminAuthHeaders(),
  });
};

export const ReopenInspection = (inspectionId, payload) => {
  return httpClient.post(
    API_BASE_URL + `inspection/${inspectionId}/reopen`,
    payload,
    { headers: adminAuthHeaders() },
  );
};

export const ReviewInspectionItem = (itemId, payload) => {
  return httpClient.put(
    API_BASE_URL + `inspection/reviewInspectionItem/${itemId}`,
    payload,
    { headers: adminAuthHeaders() },
  );
};

export const ReviewInspectionSection = (sectionReviewId, payload) => {
  return httpClient.put(
    API_BASE_URL + `inspection/reviewInspectionSection/${sectionReviewId}`,
    payload,
    { headers: adminAuthHeaders() },
  );
};

export const UploadBDMInspectionItemImage = (itemId, files) => {
  const formData = new FormData();
  const fileArray =
    Array.isArray(files) || files instanceof FileList
      ? Array.from(files)
      : [files];

  fileArray.forEach((file) => {
    formData.append("images", file);
  });

  return httpClient.post(
    API_BASE_URL + `inspection/reviewItem/${itemId}/image`,
    formData,
    { headers: adminAuthHeaders() },
  );
};

export const CompleteInspection = (inspectionId, payload) => {
  return httpClient.post(
    API_BASE_URL + `inspection/completeInspection/${inspectionId}`,
    payload,
    { headers: adminAuthHeaders() },
  );
};

export const SendInspectionToClient = (inspectionId) => {
  return httpClient.post(
    API_BASE_URL + `inspection/sendToClient/${inspectionId}`,
    {},
    { headers: adminAuthHeaders() },
  );
};
