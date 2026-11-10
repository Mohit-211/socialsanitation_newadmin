import httpClient from "@/services/httpClient";

// Daily checklists: what a Cleaner or a Housekeeper ticks off each day, under
// one main title. The weekly view shows a cleaner's ticks day by day.

/** data.items: id, title, job_sub_type (CLEANER or HOUSEKEEPER), tasks ({ id, task }). */
export const listDailyChecklists = () => httpClient.get("/daily-checklists");

export const getDailyChecklist = (id) => httpClient.get(`/daily-checklists/${id}`);

/** heading, job_sub_type and tasks (a list of names), all required. */
export const createDailyChecklist = (checklist) => httpClient.post("/daily-checklists", checklist);

/** A task sent as { id, task } keeps its row and ticks; a plain name adds one; one left out goes. */
export const updateDailyChecklist = (id, changes) => httpClient.patch(`/daily-checklists/${id}`, changes);

/** Needs records.delete. */
export const deleteDailyChecklist = (id) => httpClient.delete(`/daily-checklists/${id}`);

/** data.main_title: the title over every daily checklist in the app. */
export const getChecklistMainTitle = () => httpClient.get("/daily-checklists/main-title");

export const setChecklistMainTitle = ({ oldTitle, newTitle }) =>
  httpClient.put("/daily-checklists/main-title", { old_main_title: oldTitle || null, new_main_title: newTitle });

/** data.items: id, email, name, mobile, roles: everyone with a cleaning job. */
export const listCleaners = () => httpClient.get("/cleaners");

/** { "YYYY-MM-DD": [{ heading, tasks: [{ id, task, is_completed }] }] } for the cleaner's week. */
export const getWeeklyChecklist = (userId) => httpClient.get(`/employees/${userId}/weekly-checklist`);
