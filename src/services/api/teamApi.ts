import httpClient from "@/services/httpClient";
import type { ApiCall } from "@/services/apiResult";
import type { Group, Id, Items, TeamParticipant } from "@/types";

// Teams: group chats the office makes and runs (needs teams.manage). Members
// are users by id; clients can't join (they don't chat any more). Messages go
// through sendGroupMessage in groupChatApi.ts.

/** The teams the signed-in admin is in. */
export const listTeams = (): ApiCall<Items<Group>> => httpClient.get("/teams");

/** name (required) and the members' user ids. */
export const createTeam = ({ name, participantIds = [] }: { name: string; participantIds?: Id[] }): ApiCall<Group> =>
  httpClient.post("/teams", { name, participant_ids: participantIds });

/** Everyone who can join a team: id, user_type, key, name, role, participant_type (admin or employee). */
export const listTeamCandidates = (): ApiCall<Items<TeamParticipant>> => httpClient.get("/team-participants");

export const addTeamMembers = (teamId: Id, participantIds: Id[]): ApiCall<null> =>
  httpClient.post(`/teams/${teamId}/members`, { participant_ids: participantIds });

/** memberId is the user's id. */
export const removeTeamMember = (teamId: Id, memberId: Id): ApiCall<null> =>
  httpClient.delete(`/teams/${teamId}/members/${memberId}`);

export const deleteTeam = (teamId: Id): ApiCall<null> => httpClient.delete(`/teams/${teamId}`);
