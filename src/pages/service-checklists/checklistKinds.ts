import type { ChecklistTask } from "@/types";

/** "service": a Supervisor's or Quality Inspector's; "daily": a Cleaner's or Housekeeper's. */
export type ChecklistKind = "service" | "daily";

/** The field that says who works through a checklist. */
export type JobField = "job_type" | "job_sub_type";

interface ChecklistKindConfig {
  field: JobField;
  label: string;
  required: boolean;
  options: { value: string; label: string }[];
}

/** A checklist of either kind, as the pages read it. */
export interface AnyChecklist {
  id: number;
  title: string;
  job_type?: string | null;
  job_sub_type?: string | null;
  tasks: ChecklistTask[];
}

/** The checklist form's values: a saved task keeps its id. */
export interface ChecklistFormValues {
  heading: string;
  job_type?: string;
  job_sub_type?: string;
  tasks: { id?: number; task: string }[];
}

/** A checklist as the API takes it: a task sent as { id, task } keeps its row; a plain name adds one. */
export interface ChecklistBody {
  heading: string;
  job_type?: string;
  job_sub_type?: string;
  tasks: (string | ChecklistTask)[];
}

// The two kinds of checklist and who works through each.
export const CHECKLIST_KINDS: Readonly<Record<ChecklistKind, ChecklistKindConfig>> = Object.freeze({
  service: {
    field: "job_type",
    label: "Who Checks It",
    required: false,
    options: [
      { value: "SUPERVISOR", label: "Supervisor" },
      { value: "QUALITY_INSPECTOR", label: "Quality Inspector" },
    ],
  },
  daily: {
    field: "job_sub_type",
    label: "Who Ticks It",
    required: true,
    options: [
      { value: "CLEANER", label: "Cleaner" },
      { value: "HOUSEKEEPER", label: "Housekeeper" },
    ],
  },
});

/** Words for a job code. */
export const jobLabel = (kind: ChecklistKind, code: string | null | undefined): string =>
  CHECKLIST_KINDS[kind].options.find((option) => option.value === code)?.label || code || "—";

/** A checklist from the API as the form's values. */
export const checklistValues = (kind: ChecklistKind, checklist: AnyChecklist | null | undefined): ChecklistFormValues => {
  const field = CHECKLIST_KINDS[kind].field;
  const values: ChecklistFormValues = {
    heading: checklist?.title || "",
    tasks: (checklist?.tasks || []).map((task) => ({ id: task.id, task: task.task })),
  };
  values[field] = checklist?.[field] || undefined;
  return values;
};
