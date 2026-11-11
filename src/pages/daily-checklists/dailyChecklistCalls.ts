import { createDailyChecklist, getDailyChecklist, updateDailyChecklist } from "@/services/api/dailyChecklistApi";
import type { ChecklistBody } from "@/pages/service-checklists/checklistKinds";

/**
 * The daily checklist calls as the checklist form makes them. The form
 * requires who ticks a daily checklist, so a new one always has job_sub_type.
 */
export const DAILY_CHECKLIST_API = {
  get: getDailyChecklist,
  create: ({ job_sub_type = "", ...body }: ChecklistBody) => createDailyChecklist({ ...body, job_sub_type }),
  update: updateDailyChecklist,
};
