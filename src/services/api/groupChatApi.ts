import httpClient from "@/services/httpClient";
import type { ApiCall } from "@/services/apiResult";
import type { Group, Id, Items, TeamParticipant } from "@/types";

// Group chats (and teams, which are groups the office makes). Messages live
// in Firebase under GroupChats/<id>; sending through the API stores them with
// the sender's name and uploads the files.

/** data.items: id, name, is_team, created_at, last_message, last_message_time, last_message_by, unread_count. */
export const listGroups = (): ApiCall<Items<Group>> => httpClient.get("/groups");

const uploadField = (file: File) => {
  if (file.type?.startsWith("image/")) return "images";
  if (file.type?.startsWith("video/")) return "videos";
  return "docs";
};

/** A message and files (images, videos, PDFs). */
export const sendGroupMessage = (groupId: Id, { message, files = [] }: { message?: string; files?: File[] }): ApiCall<null> => {
  const form = new FormData();
  if (message) form.append("message", message);
  for (const file of files) form.append(uploadField(file), file);
  return httpClient.post(`/groups/${groupId}/messages`, form);
};

export const listGroupParticipants = (groupId: Id): ApiCall<Items<TeamParticipant>> =>
  httpClient.get(`/groups/${groupId}/participants`);

export const renameGroup = (groupId: Id, name: string): ApiCall<Group> => httpClient.patch(`/groups/${groupId}`, { name });

/** Super Admin only. */
export const deleteGroup = (groupId: Id): ApiCall<null> => httpClient.delete(`/groups/${groupId}`);
