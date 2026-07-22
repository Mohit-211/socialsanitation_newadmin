import axios from "../axiosInstance";
import { BASE_URL } from "../Host";

// GET ALL
export const getScope = () => {
  return axios.get(`${BASE_URL}/admin/auth/scope`);
};

// CREATE SECTION
export const createSection = (data) => {
  return axios.post(`${BASE_URL}/admin/auth/scope/section`, data);
};

// UPDATE SECTION
export const updateSection = (id, data) => {
  return axios.put(`${BASE_URL}/admin/auth/scope/section/${id}`, data);
};

// DELETE SECTION
export const deleteSectionApi = (id) => {
  return axios.delete(`${BASE_URL}/admin/auth/scope/section/${id}`);
};

// CREATE ITEM
export const createItem = (data) => {
  return axios.post(`${BASE_URL}/admin/auth/scope/item`, data);
};

// UPDATE ITEM
export const updateItemApi = (id, data) => {
  return axios.put(`${BASE_URL}/admin/auth/scope/item/${id}`, data);
};

// DELETE ITEM
export const deleteItemApi = (id) => {
  return axios.delete(`${BASE_URL}/admin/auth/scope/item/${id}`);
};



export const GetUserScope = (userId) => {
  return axios.get(
    `${BASE_URL}/admin/auth/user-scope/${userId}`
  );
};

export const CreateUserSection = (data) => {
  return axios.post(`${BASE_URL}/admin/auth/user-scope-section`, data);
};

export const UpdateUserScopeSection = (id, data) => {
  return axios.put(`${BASE_URL}/admin/auth/user-scope-section/${id}`, data);
};

export const DeleteUserScopeSection = (id) => {
  return axios.delete(`${BASE_URL}/admin/auth/user-scope-section/${id}`);
};

export const CreateUserScopeItem = (id, data) => {
  return axios.post(`${BASE_URL}/admin/auth/user-scope-item/${id}`, data);
};

export const UpdateUserScopeItem = (id, data) => {
  return axios.put(`${BASE_URL}/admin/auth/user-scope-item/${id}`, data);
};

export const DeleteUserScopeItem = (id) => {
  return axios.delete(`${BASE_URL}/admin/auth/user-scope-item/${id}`);
};



/* ===========================
   ESTIMATE SCOPE APIs
=========================== */

export const GetEstimateScope = (estimateId) => {
  return axios.get(
    `${BASE_URL}/admin/auth/estimate-scope/${estimateId}`
  );
};

export const CreateEstimateSection = (estimateId, data) => {
  return axios.post(
    `${BASE_URL}/admin/auth/estimate-section/${estimateId}`,
    data
  );
};

export const UpdateEstimateSection = (id, data) => {
  return axios.put(
    `${BASE_URL}/admin/auth/estimate-section/${id}`,
    data
  );
};

export const DeleteEstimateSection = (id, data) => {
  return axios.delete(
    `${BASE_URL}/admin/auth/estimate-section/${id}`,
    { data }
  );
};

export const CreateEstimateItem = (sectionId, data) => {
  return axios.post(
    `${BASE_URL}/admin/auth/estimate-item/${sectionId}`,
    data
  );
};

export const UpdateEstimateItem = (id, data) => {
  return axios.put(
    `${BASE_URL}/admin/auth/estimate-item/${id}`,
    data
  );
};

export const DeleteEstimateItem = (id, data) => {
  return axios.delete(
    `${BASE_URL}/admin/auth/estimate-item/${id}`,
    { data }
  );
};