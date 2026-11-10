import httpClient from "@/services/httpClient";
import { API_BASE_URL } from "@/config/env";

export const GetServices = async (adminToken) => {
  try {
    const res = await httpClient.get(API_BASE_URL + "service/getAllServicesByAdmin", {
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

//get products byid
export const GetServiceById = async (id) => {
  return await httpClient.get(API_BASE_URL + `service/findServiceById/${id}`);
};

//create products
export const CreateSerice = async (formData) => {
  return await httpClient.post(API_BASE_URL + "service/createService", formData, {
    headers: {
      "x-access-token": `${localStorage.getItem("adminToken")}`,
      "Content-Type": "multipart/form-data",
    },
  });
};

//update products
export const UpdateService = async (id, formData) => {
  return await httpClient.put(API_BASE_URL + `service/updateService/${id}`, formData, {
    headers: {
      "x-access-token": `${localStorage.getItem("adminToken")}`,
      "Content-Type": "multipart/form-data",
    },
  });
};

//delete products
export const DeleteService = async (id) => {
  return httpClient.delete(API_BASE_URL + `service/deleteService/${id}`);
};

export const GetReviewsByProductId = async (service_id) => {
	return await httpClient.post(
		`${API_BASE_URL}/rating/getAllReviewsAndRatings`,
		{ service_id },
		{
			headers: {
				"x-access-token": `${localStorage.getItem("adminToken")}`,
				"Content-Type": "multipart/form-data",
			},
		}
	);
};

