import axios from "../axiosInstance";
import { BASE_URL } from "../Host";

//terms and conditions
export const GetTermsAndConditions = async (adminToken, role_id) => {
  try {
    const res = await axios.get(
      BASE_URL + "content/getAllTermsAndConditonsByAdmin",
      {
        headers: {
          "x-access-token": `${adminToken}`,
          "Content-Type": "multipart/form-data",
        },
      }
    );

    return res;
  } catch (error) {
    // Handle error if needed
    console.error("Error fetching users:", error);
    throw error;
  }
};

export const UpdateTandC = async (id, formData) => {
  return await axios.put(
    BASE_URL + `content/updateTermsAndConditons/${id}`,
    formData
  );
};

//about us
export const GetAboutUs = async (adminToken, role_id) => {
  try {
    const res = await axios.get(BASE_URL + "content/getAllAboutUsByAdmin", {
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

export const UpdateAboutUs = async (id, formData) => {
  return await axios.put(BASE_URL + `content/updateAboutUs/${id}`, formData);
};

//support
export const CreateContactUs = async (formData) => {
  return await axios.post(BASE_URL + "contactUs/createContactUs", formData, {
    headers: {
      "x-access-token": `${localStorage.getItem("adminToken")}`,
      "Content-Type": "multipart/form-data",
    },
  });
};

export const GetContactUs = async (adminToken, role_id) => {
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

export const GetContactUsById = async (id) => {
  return await axios.get(BASE_URL + `contactUs/findContactUsById/${id}`);
};

export const UpdateContactUs = async (id, formData) => {
  return await axios.put(
    BASE_URL + `contactUs/updateContactUs/${id}`,
    formData,
    {
      headers: {
        "x-access-token": `${localStorage.getItem("adminToken")}`,
        "Content-Type": "multipart/form-data",
      },
    }
  );
};

export const DeleteContactUs = async (id) => {
  return axios.delete(BASE_URL + `contactUs/deleteContactUs/${id}`);
};



export const GetBanner = async (adminToken, role_id) => {
  try {
    const res = await axios.get(BASE_URL + "content/getAllBannerImgaeByAdmin", {
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

export const GetBannerById = async (id) => {
  return await axios.get(BASE_URL + `content/findBannerImgaeById/${id}`);
};

export const UpdateBanner  = async (id, formData) => {
  return await axios.put(
    BASE_URL + `content/updateBannerImgaeById/${id}`,
    formData,
    {
      headers: {
        "x-access-token": `${localStorage.getItem("adminToken")}`,
        "Content-Type": "multipart/form-data",
      },
    }
  );
};


export const DeleteBanner = async (id) => {
  return axios.delete(BASE_URL + `content/deleteBannerImgaeById/${id}`);
};

export const CreateBanner = async (formData) => {
  return await axios.post(BASE_URL + "content/createBanner", formData, {
    headers: {
      "x-access-token": `${localStorage.getItem("adminToken")}`,
      "Content-Type": "multipart/form-data",
    },
  });
};