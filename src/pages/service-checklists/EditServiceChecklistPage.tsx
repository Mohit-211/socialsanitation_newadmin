import { createServiceChecklist, getServiceChecklist, updateServiceChecklist } from "@/services/api/serviceChecklistApi";
import ChecklistEditPage from "./components/ChecklistEditPage";

const API = { get: getServiceChecklist, create: createServiceChecklist, update: updateServiceChecklist };

// Edits a service checklist; saved tasks keep their ticks.
const EditServiceChecklistPage = () => (
  <ChecklistEditPage
    kind="service"
    api={API}
    backPath="/checklist"
    title="SERVICE CHECKLIST"
    subtitle="What a Supervisor or Quality Inspector checks on a visit"
  />
);

export default EditServiceChecklistPage;
