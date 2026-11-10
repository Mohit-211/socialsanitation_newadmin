import httpClient from "@/services/httpClient";
import { API_BASE_URL } from "@/config/env";

export const GetUserChatList = async (chatToken, chat_type) => {
	let config = { chat_type: chat_type };
	try {
		const res = await httpClient.post(
			API_BASE_URL + "firebase/getUserChatList",
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

