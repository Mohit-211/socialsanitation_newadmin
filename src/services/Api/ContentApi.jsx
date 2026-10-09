import axios from "../axiosInstance";
import { BASE_URL } from "../Host";

export const GetContactUs = async (adminToken) => {
  try {
    const res = await axios.get(BASE_URL + "contactUs/getAllContactUs", {
      headers: {
        "x-access-token": `${adminToken}`,
        "Content-Type": "multipart/form-data",
      },
    });

    return res;
  } catch (error) {
    console.error("Error fetching users:", error);
    throw error;
  }
};

