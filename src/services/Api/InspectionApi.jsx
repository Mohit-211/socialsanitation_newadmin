import axios from "../axiosInstance";
import { BASE_URL } from "../Host";

const adminAuthHeaders = () => ({
  "x-access-token": localStorage.getItem("adminToken"),
  role_id: localStorage.getItem("roleId"),
});

export const CreateInspection = async (payload) => {
  return await axios.post(BASE_URL + "inspection/create", payload, {
    headers: adminAuthHeaders(),
  });
};

export const GetMyInspections = async (user_id) => {
  return await axios.post(
    BASE_URL + "inspection/getMyInspections",
    { user_id },
    { headers: adminAuthHeaders() },
  );
};

export const GetInspectionById = async (id) => {
  return await axios.get(BASE_URL + "inspection/getInspectionById/" + id, {
    headers: adminAuthHeaders(),
  });
};

export const DeleteInspection = async (id) => {
  return await axios.delete(BASE_URL + "inspection/deleteInspection/" + id, {
    headers: adminAuthHeaders(),
  });
};

export const ReopenInspection = (inspectionId, payload) => {
  return axios.post(
    BASE_URL + `inspection/${inspectionId}/reopen`,
    payload,
    { headers: adminAuthHeaders() },
  );
};


export const ReviewInspectionItem = (itemId, payload) => {
  return axios.put(
    BASE_URL + `inspection/reviewInspectionItem/${itemId}`,
    payload,
    { headers: adminAuthHeaders() },
  );
};

export const ReviewInspectionSection = (sectionReviewId, payload) => {
  return axios.put(
    BASE_URL + `inspection/reviewInspectionSection/${sectionReviewId}`,
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

  return axios.post(
    BASE_URL + `inspection/reviewItem/${itemId}/image`,
    formData,
    { headers: adminAuthHeaders() },
  );
};

export const CompleteInspection = (inspectionId, payload) => {
  return axios.post(
    BASE_URL + `inspection/completeInspection/${inspectionId}`,
    payload,
    { headers: adminAuthHeaders() },
  );
};

export const SendInspectionToClient = (inspectionId) => {
  return axios.post(
    BASE_URL + `inspection/sendToClient/${inspectionId}`,
    {},
    { headers: adminAuthHeaders() },
  );
};
