import httpClient from "@/services/httpClient";
import type { ApiCall } from "@/services/apiResult";
import type { ContactMessage, Id, ListQuery, Paged } from "@/types";

// What visitors send from the website's contact form.

/** Query: page, limit, search (name, email, mobile or reason). Newest first: name, email, mobile, reason, message, created_at. */
export const listContactMessages = (params?: ListQuery): ApiCall<Paged<ContactMessage>> =>
  httpClient.get("/contact-messages", { params });

export const deleteContactMessage = (id: Id): ApiCall<null> => httpClient.delete(`/contact-messages/${id}`);
