import axios from "../axiosInstance";
import { BASE_URL } from "../Host";


export const GetServices = async (adminToken, role_id) => {
  try {
    const res = await axios.get(BASE_URL + "service/getAllServicesByAdmin", {
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
  return await axios.get(BASE_URL + `service/findServiceById/${id}`);
};

//create products
export const CreateSerice = async (formData) => {
  return await axios.post(BASE_URL + "service/createService", formData, {
    headers: {
      "x-access-token": `${localStorage.getItem("adminToken")}`,
      "Content-Type": "multipart/form-data",
    },
  });
};

//update products
export const UpdateService = async (id, formData) => {
  return await axios.put(BASE_URL + `service/updateService/${id}`, formData, {
    headers: {
      "x-access-token": `${localStorage.getItem("adminToken")}`,
      "Content-Type": "multipart/form-data",
    },
  });
};

//delete products
export const DeleteService = async (id) => {
  return axios.delete(BASE_URL + `service/deleteService/${id}`);
};

export const GetReviewsByProductId = async (service_id) => {
	return await axios.post(
		`${BASE_URL}/rating/getAllReviewsAndRatings`,
		{ service_id },
		{
			headers: {
				"x-access-token": `${localStorage.getItem("adminToken")}`,
				"Content-Type": "multipart/form-data",
			},
		}
	);
};

