import axios from "../axiosInstance";
import { BASE_URL } from "../Host";

const authHeaders = (adminToken) => ({
	"x-access-token": `${adminToken}`,
});

// Backend upload fields for sendGroupMessage.
const getUploadField = (file) => {
	if (file.type.startsWith("image/")) return "images";
	if (file.type.startsWith("video/")) return "videos";
	return "docs";
};

export const GetMyTeams = (adminToken) => {
	return axios.get(`${BASE_URL}firebase/myTeams`, {
		headers: authHeaders(adminToken),
	});
};

export const CreateTeam = (adminToken, { name, participantIds = [] }) => {
	return axios.post(
		`${BASE_URL}firebase/createTeam`,
		{ name, participantIds },
		{ headers: authHeaders(adminToken) }
	);
};

export const AddTeamMembers = (adminToken, { groupId, participantIds }) => {
	return axios.post(
		`${BASE_URL}firebase/addTeamMembers`,
		{ groupId, participantIds },
		{ headers: authHeaders(adminToken) }
	);
};

export const RemoveTeamMember = (adminToken, { groupId, participantId, role_id }) => {
	return axios.delete(`${BASE_URL}firebase/removeTeamMember`, {
		headers: authHeaders(adminToken),
		data: { groupId, participantId, role_id },
	});
};

export const DeleteTeam = (adminToken, groupId) => {
	return axios.delete(`${BASE_URL}firebase/deleteTeam`, {
		headers: authHeaders(adminToken),
		data: { groupId },
	});
};

// Text and attachments go through the API so the server can enforce
// membership and upload files. Do not set Content-Type on FormData.
export const SendTeamMessage = (adminToken, { groupId, message, files = [] }) => {
	const formData = new FormData();
	formData.append("groupId", groupId);
	if (message) formData.append("message", message);
	files.forEach((file) => formData.append(getUploadField(file), file));

	return axios.post(`${BASE_URL}firebase/sendGroupMessage`, formData, {
		headers: authHeaders(adminToken),
	});
};



export const GetTeamCandidates = async (adminToken) => {
	const res = await axios.get(`${BASE_URL}firebase/teamParticipants`, {
		headers: authHeaders(adminToken),
	});
	return res.data?.data?.participants || [];
};