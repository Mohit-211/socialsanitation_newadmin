import httpClient from "@/services/httpClient";

// Service checklists: what a Supervisor or Quality Inspector checks on a
// visit. Each is a heading and its tasks; services name the ones they use.

/** data.items: id, title, job_type, tasks ({ id, task }). */
export const listServiceChecklists = () => httpClient.get("/service-checklists");

export const getServiceChecklist = (id) => httpClient.get(`/service-checklists/${id}`);

/** heading and tasks (a list of names) are required; job_type: SUPERVISOR or QUALITY_INSPECTOR. */
export const createServiceChecklist = (checklist) => httpClient.post("/service-checklists", checklist);

/** A task sent as { id, task } keeps its row and ticks; a plain name adds one; one left out goes. */
export const updateServiceChecklist = (id, changes) => httpClient.patch(`/service-checklists/${id}`, changes);

/** Needs records.delete. */
export const deleteServiceChecklist = (id) => httpClient.delete(`/service-checklists/${id}`);
