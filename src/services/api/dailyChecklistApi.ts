import httpClient from "@/services/httpClient";
import type { ApiCall } from "@/services/apiResult";
import type { ChecklistTask, DailyChecklist, Id, Items, Role } from "@/types";

// Daily checklists: what a Cleaner or a Housekeeper ticks off each day, under
// one main title. The weekly view shows a cleaner's ticks day by day.

export interface DailyChecklistInput {
  heading: string;
  job_sub_type: string;
  /** A task sent as { id, task } keeps its row; a plain name adds one. */
  tasks: (string | ChecklistTask)[];
}

/** Someone with a cleaning job. */
export interface Cleaner {
  id: number;
  email: string;
  name: string | null;
  mobile: string | null;
  roles: Role[];
}

/** A day of the weekly view: each heading and its ticks. */
export type WeeklyChecklist = Record<string, { heading: string; tasks: (ChecklistTask & { is_completed: boolean })[] }[]>;

/** data.items: id, title, job_sub_type (CLEANER or HOUSEKEEPER), tasks ({ id, task }). */
export const listDailyChecklists = (): ApiCall<Items<DailyChecklist>> => httpClient.get("/daily-checklists");

export const getDailyChecklist = (id: Id): ApiCall<DailyChecklist> => httpClient.get(`/daily-checklists/${id}`);

/** heading, job_sub_type and tasks (a list of names), all required. */
export const createDailyChecklist = (checklist: DailyChecklistInput): ApiCall<DailyChecklist> =>
  httpClient.post("/daily-checklists", checklist);

/** A task sent as { id, task } keeps its row and ticks; a plain name adds one; one left out goes. */
export const updateDailyChecklist = (id: Id, changes: Partial<DailyChecklistInput>): ApiCall<DailyChecklist> =>
  httpClient.patch(`/daily-checklists/${id}`, changes);

/** Needs records.delete. */
export const deleteDailyChecklist = (id: Id): ApiCall<null> => httpClient.delete(`/daily-checklists/${id}`);

/** data.main_title: the title over every daily checklist in the app. */
export const getChecklistMainTitle = (): ApiCall<{ main_title: string | null }> =>
  httpClient.get("/daily-checklists/main-title");

export const setChecklistMainTitle = ({ oldTitle, newTitle }: { oldTitle?: string | null; newTitle: string }): ApiCall<null> =>
  httpClient.put("/daily-checklists/main-title", { old_main_title: oldTitle || null, new_main_title: newTitle });

/** data.items: id, email, name, mobile, roles: everyone with a cleaning job. */
export const listCleaners = (): ApiCall<Items<Cleaner>> => httpClient.get("/cleaners");

/** { "YYYY-MM-DD": [{ heading, tasks: [{ id, task, is_completed }] }] } for the cleaner's week. */
export const getWeeklyChecklist = (userId: Id): ApiCall<WeeklyChecklist> =>
  httpClient.get(`/employees/${userId}/weekly-checklist`);
