import axios from "../axiosInstance";
import { BASE_URL } from "../Host";

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

