import httpClient from "@/services/httpClient";

// Services: a name, a three-letter abbreviation (it starts booking numbers)
// and a short description, with the checklists its crew works through. No
// price (prices are agreed per client) and no pictures.

/** data.items: id and name of every service, for pickers. */
export const listServiceNames = () => httpClient.get("/service-names");

/** data.items: id, name, abbreviation, description, average_rating. */
export const listServices = () => httpClient.get("/services");

/** One service, with its checklists (heading_id, heading_title, tasks) and reviews. */
export const getService = (id) => httpClient.get(`/services/${id}`);

/** name (required), description, abbreviation (three letters; from the name when left out), service_checklist_ids. */
export const createService = (service) => httpClient.post("/services", service);

export const updateService = (id, changes) => httpClient.patch(`/services/${id}`, changes);

/** Needs records.delete. */
export const deleteService = (id) => httpClient.delete(`/services/${id}`);

/** data.items: rating, review, reviewer_name, created_at. */
export const listServiceReviews = (id) => httpClient.get(`/services/${id}/reviews`);
