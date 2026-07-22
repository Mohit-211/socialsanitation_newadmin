import axios from "../axiosInstance";
import { BASE_URL } from "../Host";


export const MyGroups = (adminToken) => {
	return axios.get(BASE_URL + `firebase/myGroups`, {
		headers: {
			"x-access-token": `${adminToken}`,
			"Content-Type": "multipart/form-data",
		},
	});
};

export const UpdateGroupName = (adminToken, formdata) => {
    return axios.put(BASE_URL + `/firebase/updateGroupName`,formdata, {
        headers: {
            "x-access-token": `${adminToken}`,
            "Content-Type": "multipart/form-data",
        },
    });
};

//get products byid
export const GetGroupParticipants = async (id) => {
  return await axios.get(BASE_URL + `firebase/getGroupParticipants/${id}`);
};

export const DeleteGroup = async (adminToken,id) => {
  return await axios.delete(BASE_URL + `firebase/deleteGroup/${id}`,
	{
		headers: {
            "x-access-token": `${adminToken}`,
            "Content-Type": "multipart/form-data",
        },
	}
	
  );
};