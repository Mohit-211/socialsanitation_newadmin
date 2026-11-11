import { createServiceChecklist, getServiceChecklist, updateServiceChecklist } from "@/services/api/serviceChecklistApi";
import ChecklistEditPage from "./components/ChecklistEditPage";

const API = { get: getServiceChecklist, create: createServiceChecklist, update: updateServiceChecklist };

// Adds a service checklist.
const AddServiceChecklistPage = () => (
  <ChecklistEditPage
    kind="service"
    api={API}
    backPath="/checklist"
    title="SERVICE CHECKLIST"
    subtitle="What a Supervisor or Quality Inspector checks on a visit"
  />
);

export default AddServiceChecklistPage;
