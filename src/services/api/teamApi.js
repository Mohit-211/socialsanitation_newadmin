import httpClient from "@/services/httpClient";

// Teams: group chats the office makes and runs (needs teams.manage). Members
// are users by id; clients can't join (they don't chat any more). Messages go
// through sendGroupMessage in groupChatApi.js.

/** The teams the signed-in admin is in. */
export const listTeams = () => httpClient.get("/teams");

/** name (required) and the members' user ids. */
export const createTeam = ({ name, participantIds = [] }) =>
  httpClient.post("/teams", { name, participant_ids: participantIds });

/** Everyone who can join a team: id, user_type, key, name, role, participant_type (admin or employee). */
export const listTeamCandidates = () => httpClient.get("/team-participants");

export const addTeamMembers = (teamId, participantIds) =>
  httpClient.post(`/teams/${teamId}/members`, { participant_ids: participantIds });

/** memberId is the user's id. */
export const removeTeamMember = (teamId, memberId) => httpClient.delete(`/teams/${teamId}/members/${memberId}`);

export const deleteTeam = (teamId) => httpClient.delete(`/teams/${teamId}`);
