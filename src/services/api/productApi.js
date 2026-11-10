import httpClient from "@/services/httpClient";
import { API_BASE_URL } from "@/config/env";

export const GetProduct = async () => {
	try {
		const res = await httpClient.get(API_BASE_URL + "product/getAllProducts");
		return res;
	} catch (error) {
		console.error("Error fetching users:", error);
		throw error;
	}
};

export const GetProductById = async (id) => {
	return await httpClient.get(API_BASE_URL + `product/getProductById/${id}`);
};

export const CreateProduct = async (formData) => {
	return await httpClient.post(API_BASE_URL + "product/createProduct", formData, {});
};

export const UpdateProduct = async (id, formData) => {
	return await httpClient.put(
		API_BASE_URL + `product/updateProductById/${id}`,
		formData,
		{}
	);
};

export const DeleteProduct = async (product_id) => {
	return httpClient.post(API_BASE_URL + "product/deleteProduct", {
		product_id,
	});
};

export const GetAllRequestsByAdmin = async () => {
	try {
		const res = await httpClient.get(API_BASE_URL + "product/getAllRequestsByAdmin");
		return res;
	} catch (error) {
		console.error("Error fetching users:", error);
		throw error;
	}
};

export const UpdateRequestStatus = async (id, formData) => {
    return await httpClient.post(API_BASE_URL + `product/updateRequestStatus/${id}`, formData, {
      headers: {
        "x-access-token": `${localStorage.getItem("adminToken")}`,
        "Content-Type": "multipart/form-data",
      },
    });
  };