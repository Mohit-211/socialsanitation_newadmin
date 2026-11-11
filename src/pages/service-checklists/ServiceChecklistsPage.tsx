import { useNavigate } from "react-router";
import { Button } from "antd";
import { Plus } from "lucide-react";
import PageHeader from "@/components/PageHeader";
import { deleteServiceChecklist, listServiceChecklists } from "@/services/api/serviceChecklistApi";
import ChecklistsTable from "./components/ChecklistsTable";
import "./checklists.scss";

// What a Supervisor or Quality Inspector checks on a visit. Services name the checklists they use.
const ServiceChecklistsPage = () => {
  const navigate = useNavigate();
  return (
    <>
      <PageHeader
        title="SERVICE CHECKLISTS"
        subtitle="What a Supervisor or Quality Inspector checks on a visit. Open a row to see its tasks."
        actions={
          <Button type="primary" size="large" icon={<Plus size={16} />} onClick={() => navigate("/add-checklist")}>
            Add Checklist
          </Button>
        }
      />
      <ChecklistsTable
        kind="service"
        load={listServiceChecklists}
        remove={deleteServiceChecklist}
        editPath={(id) => `/edit-checklist/${id}`}
      />
    </>
  );
};

export default ServiceChecklistsPage;
