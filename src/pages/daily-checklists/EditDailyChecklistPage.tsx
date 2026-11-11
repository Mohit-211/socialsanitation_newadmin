import ChecklistEditPage from "@/pages/service-checklists/components/ChecklistEditPage";
import { DAILY_CHECKLIST_API } from "./dailyChecklistCalls";

const EditDailyChecklistPage = () => (
  <ChecklistEditPage
    kind="daily"
    api={DAILY_CHECKLIST_API}
    backPath="/daily-checklist"
    title="HOUSEKEEPING CHECKLIST"
    subtitle="What a Cleaner or Housekeeper ticks off each day"
  />
);

export default EditDailyChecklistPage;
