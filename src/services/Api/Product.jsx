import axios from "../axiosInstance";
import { BASE_URL } from "../Host";

export const GetProduct = async (adminToken, role_id) => {
	try {
		const res = await axios.get(BASE_URL + "product/getAllProducts");
		return res;
	} catch (error) {
		console.error("Error fetching users:", error);
		throw error;
	}
};

export const GetProductById = async (id) => {
	return await axios.get(BASE_URL + `product/getProductById/${id}`);
};

export const CreateProduct = async (formData) => {
	return await axios.post(BASE_URL + "product/createProduct", formData, {});
};

export const UpdateProduct = async (id, formData) => {
	return await axios.put(
		BASE_URL + `product/updateProductById/${id}`,
		formData,
		{}
	);
};

export const DeleteProduct = async (product_id) => {
	return axios.post(BASE_URL + "product/deleteProduct", {
		product_id,
	});
};

export const GetAllRequestsByAdmin = async (adminToken, role_id) => {
	try {
		const res = await axios.get(BASE_URL + "product/getAllRequestsByAdmin");
		return res;
	} catch (error) {
		console.error("Error fetching users:", error);
		throw error;
	}
};


export const UpdateRequestStatus = async (id, formData) => {
    return await axios.post(BASE_URL + `product/updateRequestStatus/${id}`, formData, {
      headers: {
        "x-access-token": `${localStorage.getItem("adminToken")}`,
        "Content-Type": "multipart/form-data",
      },
    });
  };