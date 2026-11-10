import { useEffect, useState } from "react";
import { Space, Tabs, message } from "antd";
import { Pencil, Save, X } from "lucide-react";
import PageHeader from "../../components/PageHeader";
import IconAction from "../../components/IconAction";

import {
  GetCostCalculationSettings,
  UpdateCostCalculationSetting,
} from "../../services/Api/CalculatorApi";
import "./Calculator.scss";

const CostCalculationSettings = () => {
  const [activeTab, setActiveTab] = useState("COMMERCIAL");
  const [settings, setSettings] = useState([]);
  const [editingId, setEditingId] = useState(null);
  const [minutes, setMinutes] = useState("");

  const loadSettings = async (clientType) => {
    try {
      const res = await GetCostCalculationSettings(clientType);
      setSettings(res.data.data || []);
    } catch {
      message.error("Failed to load settings");
    }
  };

  useEffect(() => {
    loadSettings(activeTab);
  }, [activeTab]);

  const saveSetting = async (id) => {
    try {
      await UpdateCostCalculationSetting({
        id,
        minutes_per_unit: Number(minutes),
      });

      message.success("Setting updated");

      setEditingId(null);

      loadSettings(activeTab);
    } catch {
      message.error("Failed to update");
    }
  };

  return (
    <div className="cc-settings-page">
      {/* ── Standard shared header ── */}
      <PageHeader
        title="COST CALCULATION SETTINGS"
        subtitle="Configure calculation minutes by client type"
      />

      <div className="cc-card">
        <Tabs
          activeKey={activeTab}
          onChange={setActiveTab}
          items={[
            {
              key: "COMMERCIAL",
              label: "Commercial",
            },
            {
              key: "RESIDENTIAL",
              label: "Residential",
            },
          ]}
        />

        <table className="cc-tasks-table">
          <thead>
            <tr>
              <th>Item Type</th>
              <th>Minutes Per Unit</th>
              <th width="120">Action</th>
            </tr>
          </thead>

          <tbody>
            {settings.map((item) => (
              <tr key={item.id}>
                <td>
                  {item.item_type
                    .replace(/_/g, " ")
                    .toLowerCase()
                    .replace(/\b\w/g, (c) => c.toUpperCase())}
                </td>

                <td>
                  {editingId === item.id ? (
                    <input
                      type="number"
                      className="cc-task-input"
                      value={minutes}
                      onChange={(e) => setMinutes(e.target.value)}
                    />
                  ) : (
                    item.minutes_per_unit
                  )}
                </td>

                <td>
                  {editingId === item.id ? (
                    <Space>
                      <IconAction
                        icon={Save}
                        title="Save"
                        onClick={() => saveSetting(item.id)}
                      />

                      <IconAction
                        icon={X}
                        title="Cancel"
                        danger
                        onClick={() => setEditingId(null)}
                      />
                    </Space>
                  ) : (
                    <IconAction
                      icon={Pencil}
                      title="Edit"
                      onClick={() => {
                        setEditingId(item.id);
                        setMinutes(item.minutes_per_unit);
                      }}
                    />
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default CostCalculationSettings;
