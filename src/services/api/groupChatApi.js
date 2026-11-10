import httpClient from "@/services/httpClient";
import { API_BASE_URL } from "@/config/env";

export const MyGroups = (adminToken) => {
	return httpClient.get(API_BASE_URL + `firebase/myGroups`, {
		headers: {
			"x-access-token": `${adminToken}`,
			"Content-Type": "multipart/form-data",
		},
	});
};

export const UpdateGroupName = (adminToken, formdata) => {
    return httpClient.put(API_BASE_URL + `/firebase/updateGroupName`,formdata, {
        headers: {
            "x-access-token": `${adminToken}`,
            "Content-Type": "multipart/form-data",
        },
    });
};

//get products byid
export const GetGroupParticipants = async (id) => {
  return await httpClient.get(API_BASE_URL + `firebase/getGroupParticipants/${id}`);
};

export const DeleteGroup = async (adminToken,id) => {
  return await httpClient.delete(API_BASE_URL + `firebase/deleteGroup/${id}`,
	{
		headers: {
            "x-access-token": `${adminToken}`,
            "Content-Type": "multipart/form-data",
        },
	}
	
  );
};