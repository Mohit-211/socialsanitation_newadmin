/** @format */

import axios from "../axiosInstance";
import { BASE_URL } from "../Host";

//get all notifications
export const GetNotifications = async () => {
	try {
		const res = await axios.get(BASE_URL + "firebase/getAllNotifications");
		return res;
	} catch (error) {
		console.error("Error fetching users:", error);
		throw error;
	}
};

export const MarkOneNotificationAsRead = async (formData) => {
	return await axios.post(
		BASE_URL + `firebase/markOneNotificationAsReadOfAdmin`,
		formData
	);
};

export const MarkAllNotificationAsRead = async () => {
	return await axios.post(
		BASE_URL + `firebase/markAllNotificationAsReadOfAdmin`
	);
};

export const GetUserChatList = async (chatToken, chat_type) => {
	let config = { chat_type: chat_type };
	try {
		const res = await axios.post(
			BASE_URL + "firebase/getUserChatList",
			config,
			{
				headers: {
					"x-access-token": chatToken,
				},
			}
		);

		return res;
	} catch (error) {
		console.error("Error fetching users:", error);
		throw error;
	}
};

export const GetAllUserMessages = async (chatToken, userId) => {
	let config = { userId: userId };
	try {
		const res = await axios.post(
			BASE_URL + "firebase/getUserMessages",
			config,
			{
				headers: {
					"x-access-token": chatToken,
				},
			}
		);
		return res;
	} catch (error) {
		console.error("Error fetching users:", error);
		throw error;
	}
};

export const SendMessage = async (formData) => {
	console.log("formData1111",formData)
	return await axios.post(BASE_URL + `firebase/sendMessageAsAdmin`, formData, {
		headers: {
			"x-access-token": `${localStorage.getItem("chatToken")}`,
			"Content-Type": "multipart/form-data",
		},
	});
};

export const SendNotification = async (formData) => {
	return await axios.post(BASE_URL + `firebase/sendNotification`, formData, {
		headers: {
			"x-access-token": `${localStorage.getItem("chatToken")}`,
			"Content-Type": "multipart/form-data",
		},
	});
};

export const MarkUserMessageAsRead = async (receiverUserId) => {
	return await axios.post(
		BASE_URL + `firebase/markUserMessagesAsRead`,
		{ receiverUserId },
		{
			headers: {
				"x-access-token": localStorage.getItem("chatToken"),
				"Content-Type": "multipart/form-data",
			},
		}
	);
};
