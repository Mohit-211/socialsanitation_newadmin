import { useState } from "react";
import { useNavigate } from "react-router";
import { Button, Card, Input, Space, message } from "antd";
import { Plus } from "lucide-react";
import PageHeader from "@/components/PageHeader";
import { useApiQuery } from "@/hooks/useApiQuery";
import {
  deleteDailyChecklist,
  getChecklistMainTitle,
  listDailyChecklists,
  setChecklistMainTitle,
} from "@/services/api/dailyChecklistApi";
import { dataOf, errorMessage } from "@/services/apiResult";
import ChecklistsTable from "@/pages/service-checklists/components/ChecklistsTable";
import "@/pages/service-checklists/checklists.scss";
import "./dailyChecklists.scss";

// What a Cleaner or Housekeeper ticks off each day, under one main title the app shows.
const DailyChecklistsPage = () => {
  const navigate = useNavigate();
  const [newTitle, setNewTitle] = useState("");
  const [saving, setSaving] = useState(false);
  const { data: title, reload } = useApiQuery(() => getChecklistMainTitle().then((res) => dataOf(res)?.main_title || ""), [], {
    initial: "",
    errorText: "Couldn't load the main title",
  });

  const saveTitle = async () => {
    if (!newTitle.trim()) return;
    setSaving(true);
    try {
      await setChecklistMainTitle({ oldTitle: title, newTitle: newTitle.trim() });
      message.success("Main title changed");
      setNewTitle("");
      reload();
    } catch (error) {
      message.error(errorMessage(error, "Couldn't change the main title"));
    } finally {
      setSaving(false);
    }
  };

  return (
    <div>
      <PageHeader
        title="HOUSEKEEPING CHECKLISTS"
        subtitle="What a Cleaner or Housekeeper ticks off each day. Open a row to see its tasks."
        actions={
          <Button type="primary" size="large" icon={<Plus size={16} />} onClick={() => navigate("/add-daily-checklist")}>
            Add Checklist
          </Button>
        }
      />
      <Card size="small" title="Main Title in the App" className="checklist-title-card">
        <Space wrap>
          <span>
            Now: <strong>{title || "—"}</strong>
          </span>
          <Input
            placeholder="A new main title"
            value={newTitle}
            onChange={(e) => setNewTitle(e.target.value)}
            onPressEnter={saveTitle}
            style={{ width: 280 }}
          />
          <Button onClick={saveTitle} loading={saving} disabled={!newTitle.trim()}>
            Change
          </Button>
        </Space>
      </Card>
      <ChecklistsTable
        kind="daily"
        load={listDailyChecklists}
        remove={deleteDailyChecklist}
        editPath={(id) => `/edit-daily-checklist/${id}`}
      />
    </div>
  );
};

export default DailyChecklistsPage;
