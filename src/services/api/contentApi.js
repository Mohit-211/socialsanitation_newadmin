import httpClient from "@/services/httpClient";

// What visitors send from the website's contact form.

/** Query: page, limit, search (name, email, mobile or reason). Newest first: name, email, mobile, reason, message, created_at. */
export const listContactMessages = (params) => httpClient.get("/contact-messages", { params });

export const deleteContactMessage = (id) => httpClient.delete(`/contact-messages/${id}`);
