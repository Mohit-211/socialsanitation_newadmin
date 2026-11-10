// The two kinds of checklist and who works through each.
export const CHECKLIST_KINDS = Object.freeze({
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
export const jobLabel = (kind, code) => CHECKLIST_KINDS[kind].options.find((option) => option.value === code)?.label || code || "—";

/** A checklist from the API as the form's values. */
export const checklistValues = (kind, checklist) => ({
  heading: checklist?.title || checklist?.heading || "",
  [CHECKLIST_KINDS[kind].field]: checklist?.[CHECKLIST_KINDS[kind].field] || undefined,
  tasks: (checklist?.tasks || []).map((task) => ({ id: task.id, task: task.task })),
});
