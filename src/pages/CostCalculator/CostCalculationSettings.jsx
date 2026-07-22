import React, { useEffect, useState } from "react";
import { Tabs, message } from "antd";
import { EditOutlined, SaveOutlined, CloseOutlined } from "@ant-design/icons";

import {
  GetCostCalculationSettings,
  UpdateCostCalculationSetting,
} from "../../services/Api/CalculatorApi";

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
      <div className="cc-page-header">
        <div>
          <h1 className="cc-page-title">Cost Calculation Settings</h1>
          <p className="cc-page-sub">
            Configure calculation minutes by client type
          </p>
        </div>
      </div>

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
                    <div
                      style={{
                        display: "flex",
                        gap: 10,
                      }}
                    >
                      <SaveOutlined
                        onClick={() => saveSetting(item.id)}
                        style={{
                          color: "#16a34a",
                          cursor: "pointer",
                        }}
                      />

                      <CloseOutlined
                        onClick={() => setEditingId(null)}
                        style={{
                          color: "#dc2626",
                          cursor: "pointer",
                        }}
                      />
                    </div>
                  ) : (
                    <EditOutlined
                      style={{
                        cursor: "pointer",
                      }}
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
