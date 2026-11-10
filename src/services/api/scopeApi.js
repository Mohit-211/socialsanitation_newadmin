import httpClient from "@/services/httpClient";
import { API_BASE_URL } from "@/config/env";

// GET ALL (by client type: "commercial" | "residential")
export const getScope = (clientType = "commercial") => {
  return httpClient.get(`${API_BASE_URL}/admin/auth/scope`, {
    params: { client_type: clientType },
  });
};

export const GetUserScopeView = (userId) => {
  return httpClient.get(`${API_BASE_URL}/admin/auth/user-scope-view/${userId}`);
};

export const downloadScopeOfWorkPDF = (userId) => {
  return httpClient.get(`${API_BASE_URL}admin/auth/scope-of-work-pdf/${userId}`);
};

// CREATE SECTION  (data should include client_type)
export const createSection = (data) => {
  return httpClient.post(`${API_BASE_URL}/admin/auth/scope/section`, data);
};

// UPDATE SECTION
export const updateSection = (id, data) => {
  return httpClient.put(`${API_BASE_URL}/admin/auth/scope/section/${id}`, data);
};

// DELETE SECTION
export const deleteSectionApi = (id) => {
  return httpClient.delete(`${API_BASE_URL}/admin/auth/scope/section/${id}`);
};

// CREATE ITEM
export const createItem = (data) => {
  return httpClient.post(`${API_BASE_URL}/admin/auth/scope/item`, data);
};

// UPDATE ITEM
export const updateItemApi = (id, data) => {
  return httpClient.put(`${API_BASE_URL}/admin/auth/scope/item/${id}`, data);
};

// DELETE ITEM
export const deleteItemApi = (id) => {
  return httpClient.delete(`${API_BASE_URL}/admin/auth/scope/item/${id}`);
};

export const GetUserScope = (userId) => {
  return httpClient.get(`${API_BASE_URL}/admin/auth/user-scope/${userId}`);
};

export const CheckUserScopeExists = (userId) => {
  return httpClient.get(`${API_BASE_URL}/admin/auth/user-scope/${userId}/exists`);
};

export const CreateUserSection = (data) => {
  return httpClient.post(`${API_BASE_URL}/admin/auth/user-scope-section`, data);
};

export const UpdateUserScopeSection = (id, data) => {
  return httpClient.put(`${API_BASE_URL}/admin/auth/user-scope-section/${id}`, data);
};

export const DeleteUserScopeSection = (id) => {
  return httpClient.delete(`${API_BASE_URL}/admin/auth/user-scope-section/${id}`);
};

export const CreateUserScopeItem = (id, data) => {
  return httpClient.post(`${API_BASE_URL}/admin/auth/user-scope-item/${id}`, data);
};

export const UpdateUserScopeItem = (id, data) => {
  return httpClient.put(`${API_BASE_URL}/admin/auth/user-scope-item/${id}`, data);
};

export const DeleteUserScopeItem = (id) => {
  return httpClient.delete(`${API_BASE_URL}/admin/auth/user-scope-item/${id}`);
};

/* ESTIMATE SCOPE APIs */

export const CreateEstimateSection = (estimateId, data) => {
  return httpClient.post(
    `${API_BASE_URL}/admin/auth/estimate-section/${estimateId}`,
    data,
  );
};

export const UpdateEstimateSection = (id, data) => {
  return httpClient.put(`${API_BASE_URL}/admin/auth/estimate-section/${id}`, data);
};

export const DeleteEstimateSection = (id, data) => {
  return httpClient.delete(`${API_BASE_URL}/admin/auth/estimate-section/${id}`, {
    data,
  });
};

export const CreateEstimateItem = (sectionId, data) => {
  return httpClient.post(`${API_BASE_URL}/admin/auth/estimate-item/${sectionId}`, data);
};

export const UpdateEstimateItem = (id, data) => {
  return httpClient.put(`${API_BASE_URL}/admin/auth/estimate-item/${id}`, data);
};

export const DeleteEstimateItem = (id, data) => {
  return httpClient.delete(`${API_BASE_URL}/admin/auth/estimate-item/${id}`, { data });
};

export const ReorderUserScopeSections = (sections) =>
  httpClient.patch(`${API_BASE_URL}/admin/auth/scope/section/reorder`, { sections });

export const ReorderUserScopeItems = (items) =>
  httpClient.patch(`${API_BASE_URL}/admin/auth/scope/item/reorder`, { items });