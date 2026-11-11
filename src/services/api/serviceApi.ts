import httpClient from "@/services/httpClient";
import type { ApiCall } from "@/services/apiResult";
import type { Id, Items, Service, ServiceName, ServiceReview } from "@/types";

// Services: a name, a three-letter abbreviation (it starts booking numbers)
// and a short description, with the checklists its crew works through. No
// price (prices are agreed per client) and no pictures.

export interface ServiceInput {
  name?: string;
  description?: string | null;
  abbreviation?: string | null;
  service_checklist_ids?: Id[];
}

/** data.items: id and name of every service, for pickers. */
export const listServiceNames = (): ApiCall<Items<ServiceName>> => httpClient.get("/service-names");

/** data.items: id, name, abbreviation, description, average_rating. */
export const listServices = (): ApiCall<Items<Service>> => httpClient.get("/services");

/** One service, with its checklists (heading_id, heading_title, tasks) and reviews. */
export const getService = (id: Id): ApiCall<Service> => httpClient.get(`/services/${id}`);

/** name (required), description, abbreviation (three letters; from the name when left out), service_checklist_ids. */
export const createService = (service: ServiceInput): ApiCall<Service> => httpClient.post("/services", service);

export const updateService = (id: Id, changes: ServiceInput): ApiCall<Service> => httpClient.patch(`/services/${id}`, changes);

/** Needs records.delete. */
export const deleteService = (id: Id): ApiCall<null> => httpClient.delete(`/services/${id}`);

/** data.items: rating, review, reviewer_name, created_at. */
export const listServiceReviews = (id: Id): ApiCall<Items<ServiceReview>> => httpClient.get(`/services/${id}/reviews`);
