import React, { useEffect, useState } from "react";
import { Tabs, message } from "antd";
import { EditOutlined, SaveOutlined, CloseOutlined } from "@ant-design/icons";
import Box from "@mui/material/Box";
import Paper from "@mui/material/Paper";
import Typography from "@mui/material/Typography";

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
      {/* ── Standard shared header ── */}
      <Paper
        variant="outlined"
        sx={{
          p: 2.5,
          mb: 3,
          borderRadius: "10px",
          borderColor: "#eef0f2",
        }}
      >
        <Box>
          <Typography className="page-title">
            COST CALCULATION SETTINGS
          </Typography>
          <Typography className="page-sub-title">
            Configure calculation minutes by client type
          </Typography>
        </Box>
      </Paper>

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