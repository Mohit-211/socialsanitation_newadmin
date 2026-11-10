import httpClient from "@/services/httpClient";

// One-to-one chats between the office and employees (and, read-only, the old
// client threads: clients don't chat any more). Messages live in Firebase;
// sending through the API also stores them there and sends the push.

/** chat_type: employee or user. Each: id, user_type, name, image_url, last_message, last_message_time, unread_count. */
export const listChats = (chatType) => httpClient.get("/chats", { params: { chat_type: chatType } });

/** message and images (files). 400 for a client: they don't use chat. */
export const sendChatMessage = (userId, { message, images = [] }) => {
  const form = new FormData();
  if (message) form.append("message", message);
  for (const file of images) form.append("images", file);
  return httpClient.post(`/chats/${userId}/messages`, form);
};

/** Marks the office's side of the thread read. */
export const markChatRead = (userId) => httpClient.post(`/chats/${userId}/read`);
