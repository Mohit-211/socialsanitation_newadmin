import { createDailyChecklist, getDailyChecklist, updateDailyChecklist } from "@/services/api/dailyChecklistApi";
import ChecklistEditPage from "@/pages/service-checklists/components/ChecklistEditPage";

const API = { get: getDailyChecklist, create: createDailyChecklist, update: updateDailyChecklist };

const AddDailyChecklistPage = () => (
  <ChecklistEditPage
    kind="daily"
    api={API}
    backPath="/daily-checklist"
    title="HOUSEKEEPING CHECKLIST"
    subtitle="What a Cleaner or Housekeeper ticks off each day"
  />
);

export default AddDailyChecklistPage;
