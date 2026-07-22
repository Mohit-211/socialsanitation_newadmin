import React, { useMemo, useState, useCallback, useEffect } from "react";
import { message, Select } from "antd";
import {
  CalculatorOutlined,
  DollarOutlined,
  PlusOutlined,
  DeleteOutlined,
  InfoCircleOutlined,
  CheckCircleOutlined,
  DownOutlined,
  UpOutlined,
} from "@ant-design/icons";

import {
  CreateBidMaximizer,
  CreateCostCalculator,
  GetCostCalculationSettings,
} from "../../services/Api/CalculatorApi";
import { GetAllUserName } from "../../services/Api/InvoiceApi";
import { GetClientChecklistByUserId } from "../../services/Api/BookingApi";

const { Option } = Select;

// ─── TOAST ───────────────────────────────────────────────────────────────────
const useToast = () => {
  const [toasts, setToasts] = useState([]);

  const show = useCallback((msg, type = "success") => {
    const id = Date.now();
    setToasts((p) => [...p, { id, msg, type }]);
    setTimeout(() => setToasts((p) => p.filter((t) => t.id !== id)), 3500);
  }, []);

  const icons = { success: "✓", error: "✕", warning: "⚠" };

  const ToastContainer = (
    <div className="cc-toast-wrap">
      {toasts.map((t) => (
        <div key={t.id} className={`cc-toast ${t.type}`}>
          <span className="icon">{icons[t.type]}</span>
          {t.msg}
        </div>
      ))}
    </div>
  );

  return { show, ToastContainer };
};

// ─── FORMULA CHIPS DATA ───────────────────────────────────────────────────────
const TIME_FORMULAS = [
  {
    name: "Square Footage",
    formula: "(sqft ÷ 1000) × configured SQFT minutes",
  },

  {
    name: "Rooms",
    formula: "rooms × configured room minutes",
  },

  {
    name: "Restrooms",
    formula: "restrooms × configured restroom minutes",
  },

  {
    name: "Stalls",
    formula: "stalls × configured stall minutes",
  },

  {
    name: "Kitchens",
    formula: "kitchens × configured kitchen minutes",
  },

  {
    name: "Trash Cans",
    formula: "trash cans × configured trash minutes",
  },

  {
    name: "Walkaround",
    formula: "manual minutes entered",
  },

  {
    name: "Floor Composition",
    formula: "(floor sqft ÷ 1000) × configured floor adjustment minutes",
  },

  {
    name: "Custom Tasks",
    formula: "manual minutes entered",
  },
];

const COST_FORMULAS = [
  { name: "Total Hours", formula: "totalMinutes ÷ 60" },
  { name: "Hours / Employee", formula: "totalHours ÷ employees" },
  { name: "Labor Cost", formula: "totalHours × hourlyWage" },
  { name: "Operational Cost", formula: "labor + equipment + chemical" },
];

const BID_FORMULAS = [
  { name: "With Overhead", formula: "cost × (1 + overhead%)" },
  { name: "With Risk Buffer", formula: "+ flat risk buffer ($)" },
  { name: "Recommended Bid", formula: "base ÷ (1 − profit%)" },
  { name: "Commission", formula: "recommendedBid × commission%" },
];

const HOW_TO_STEPS = [
  "Select a client. The property's Initial Client Chart and floor composition are loaded automatically.",

  "Verify or adjust the property details, including square footage, rooms, restrooms, kitchens, stalls, trash cans, walkaround minutes, employee count and hourly wage.",

  "Review the Floor Composition section. The displayed percentages represent how much of the building uses Carpet, Concrete, VCT/LVT and Tile flooring.",

  "Add any custom cleaning services with their estimated minutes, equipment costs and chemical costs.",

  "The calculator combines property size, room counts, floor composition and custom tasks to estimate total cleaning time and operational cost.",

  "Generate the Cost Calculation and then use Bid Maximizer to create customer-facing pricing.",
];

// ─── INSTRUCTIONS MODAL ───────────────────────────────────────────────────────
const FormulaGrid = ({ formulas }) => (
  <div className="cc-formula-grid">
    {formulas.map((f) => (
      <div key={f.name} className="cc-formula-chip">
        <div className="name">{f.name}</div>
        <div className="formula">{f.formula}</div>
      </div>
    ))}
  </div>
);

const InstructionsModal = ({ onClose }) => (
  <div className="cc-modal-overlay" onClick={onClose}>
    <div
      className="cc-modal cc-modal--wide"
      onClick={(e) => e.stopPropagation()}
    >
      <div className="cc-modal-header">
        <h3>How This Calculator Works</h3>
        <button className="cc-modal-close" onClick={onClose}>
          ✕
        </button>
      </div>
      <div className="cc-modal-body">
        <div className="cc-info-section">
          <p className="sec-title">Purpose</p>
          <ul className="cc-info-list">
            <li>Standardize cleaning service pricing for every property</li>
            <li>
              Prevent under-bidding (losing money) or over-bidding (losing
              clients)
            </li>
            <li>Accurately estimate labor hours &amp; staffing requirements</li>
            <li>Help sales reps quote faster with data-driven confidence</li>
          </ul>
        </div>

        <div className="cc-info-section">
          <p className="sec-title">Time Formulas (Minutes)</p>
          <FormulaGrid formulas={TIME_FORMULAS} />
        </div>

        <div className="cc-info-section">
          <p className="sec-title">Floor Composition Adjustment</p>

          <div className="cc-floor-example">
            <div className="cc-floor-example-header">
              <strong>Example</strong>
              <span>5,000 sqft Commercial Building</span>
            </div>

            <div className="cc-floor-example-grid">
              <div className="cc-floor-example-item">
                <div className="title">Carpet</div>
                <div className="percent">20%</div>
                <div className="calc">
                  5,000 × 20% = <strong>1,000 sqft</strong>
                </div>
              </div>

              <div className="cc-floor-example-item">
                <div className="title">Concrete</div>
                <div className="percent">10%</div>
                <div className="calc">
                  5,000 × 10% = <strong>500 sqft</strong>
                </div>
              </div>

              <div className="cc-floor-example-item">
                <div className="title">VCT / LVT</div>
                <div className="percent">60%</div>
                <div className="calc">
                  5,000 × 60% = <strong>3,000 sqft</strong>
                </div>
              </div>

              <div className="cc-floor-example-item">
                <div className="title">Tile</div>
                <div className="percent">10%</div>
                <div className="calc">
                  5,000 × 10% = <strong>500 sqft</strong>
                </div>
              </div>
            </div>

            <div className="cc-floor-note">
              <strong>How it works</strong>

              <ul>
                <li>
                  The percentages entered in the client's Initial Checklist
                  represent the flooring makeup of the entire building.
                </li>

                <li>
                  The calculator converts each percentage into actual square
                  footage.
                </li>

                <li>
                  Each flooring type has its own cleaning time configured in
                  <strong> Cost Settings</strong>.
                </li>

                <li>
                  Those extra minutes are automatically added to the property's
                  total estimated cleaning time.
                </li>
              </ul>
            </div>
          </div>
        </div>

        <div className="cc-info-section">
          <p className="sec-title">Cost Formulas</p>
          <FormulaGrid formulas={COST_FORMULAS} />
        </div>

        <div className="cc-info-section">
          <p className="sec-title">Bid Maximizer Formula</p>
          <FormulaGrid formulas={BID_FORMULAS} />
        </div>

        <div className="cc-info-section">
          <p className="sec-title">How To Use</p>
          {HOW_TO_STEPS.map((text, i) => (
            <div key={i} className="cc-info-step">
              <div className="num">{i + 1}</div>
              <div className="text">{text}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  </div>
);

// ─── PROPERTY FIELDS CONFIG ───────────────────────────────────────────────────
const PROPERTY_FIELDS = [
  { key: "room_count", label: "Rooms" },
  { key: "restroom_count", label: "Restrooms" },
  { key: "kitchen_count", label: "Kitchens" },
  { key: "stall_count", label: "Stalls" },

  { key: "trash_can_count", label: "Trash Cans" },
  { key: "walkaround_minutes", label: "Walkaround Minutes" },
  { key: "employee_count", label: "Employees", min: 1 },
];

const BID_FIELDS = [
  { key: "profit_margin_percentage", label: "Profit Margin (%)" },
  { key: "overhead_percentage", label: "Overhead (%)" },
  { key: "risk_buffer_amount", label: "Risk Buffer ($)" },
  { key: "commission_percentage", label: "Commission (%)" },
];

// ─── MAIN COMPONENT ───────────────────────────────────────────────────────────
const CostCalculator = () => {
  const { show, ToastContainer } = useToast();

  const [loading, setLoading] = useState(false);
  const [bidLoading, setBidLoading] = useState(false);
  const [calculationId, setCalculationId] = useState(null);
  const [showInstructions, setShowInstructions] = useState(false);
  const [result, setResult] = useState(null);
  const [bidResult, setBidResult] = useState(null);

  const [users, setUsers] = useState([]);
  const [userId, setUserId] = useState(null);

  const [clientChecklist, setClientChecklist] = useState([]);
  const [clientType, setClientType] = useState("");
  const [loadingChecklist, setLoadingChecklist] = useState(false);
  const [chartCollapsed, setChartCollapsed] = useState(true);

  const [floorComposition, setFloorComposition] = useState({
    carpet: 0,
    concrete: 0,
    vct_lvt: 0,
    tile: 0,
  });

  const [costSettings, setCostSettings] = useState({});

  const [formData, setFormData] = useState({
    property_name: "",
    estimated_sqft: 0,
    room_count: 0,
    restroom_count: 0,
    stall_count: 0,
    kitchen_count: 0,
    trash_can_count: 0,
    walkaround_minutes: 0,
    employee_count: 1,
    hourly_wage: 18,
  });

  const [customTasks, setCustomTasks] = useState([]);

  const [bidData, setBidData] = useState({
    profit_margin_percentage: 30,
    overhead_percentage: 10,
    risk_buffer_amount: 25,
    commission_percentage: 7,
  });

  // ── Fetch users ──
  useEffect(() => {
    GetAllUserName()
      .then((res) => setUsers(res.data.data || []))
      .catch(console.error);
  }, []);

  // ── Select client ──
  const handleUserChange = async (value) => {
    setUserId(value);
    try {
      setLoadingChecklist(true);
      const checklistRes = await GetClientChecklistByUserId(value);
      const checklistData = checklistRes?.data?.data?.data?.[0] || {};
      const details = checklistData?.user_client_checklist_details || [];

      const currentClientType = checklistData?.client_type || "commercial";

      const settingsRes = await GetCostCalculationSettings(currentClientType);

      const settingMap = {};

      (settingsRes.data.data || []).forEach((item) => {
        settingMap[item.item_type] = Number(item.minutes_per_unit);
      });

      setCostSettings(settingMap);

      setClientType(currentClientType);
      setClientChecklist(details);

      setFloorComposition({
        carpet: Number(checklistData.carpet_percentage || 0),
        concrete: Number(checklistData.concrete_percentage || 0),
        vct_lvt: Number(checklistData.vct_lvt_percentage || 0),
        tile: Number(checklistData.tile_percentage || 0),
      });

      let roomCount = 0;

      details.forEach((item) => {
        if (currentClientType === "commercial") {
          // Don't count the Restrooms service area as a room
          if (item.service_area !== "Restrooms") {
            roomCount += Number(item.restrooms || 0);
          }
        } else {
          roomCount += Number(item.num_desks_trash_cans || 0);
        }
      });

      let restroomCount = 0,
        stallCount = 0,
        kitchenCount = 0,
        trashCanCount = 0;

      details.forEach((item) => {
        if (currentClientType === "commercial") {
          if (item.service_area === "Restrooms") {
            restroomCount += Number(item.restrooms || 0);
          }
        } else {
          if (item.service_area === "Restrooms") {
            restroomCount += Number(item.num_desks_trash_cans || 0);
          }
        }

        if (currentClientType === "commercial") {
          if (item.service_area === "Restrooms") {
            stallCount +=
              Number(item.restrooms || 0) * Number(item.stalls || 0);
          }
        } else {
          if (item.service_area === "Restrooms") {
            stallCount += Number(item.num_desks_trash_cans || 0);
          }
        }

        // kitch logic
        if (currentClientType === "commercial") {
          if (item.service_area === "Kitchen Areas") {
            kitchenCount += Number(item.restrooms || 0);
          }
        } else {
          if (item.service_area === "Kitchen") {
            kitchenCount += Number(item.num_desks_trash_cans || 0);
          }
        }
        // trash cans
        if (currentClientType === "commercial") {
          if (item.service_area !== "Restrooms") {
            trashCanCount +=
              Number(item.restrooms || 0) * Number(item.stalls || 0);
          }
        } else {
          if (item.service_area !== "Restrooms") {
            trashCanCount += Number(item.num_desks_trash_cans || 0);
          }
        }
      });

      setFormData((prev) => ({
        ...prev,
        property_name: checklistData?.user?.name || "",
        estimated_sqft: Number(checklistData?.estimated_sqft || 0),
        walkaround_minutes: Number(checklistData?.walkaround_minutes || 0),
        room_count: roomCount,
        restroom_count: restroomCount,
        stall_count: stallCount,
        kitchen_count: kitchenCount,
        trash_can_count: trashCanCount,
      }));
    } catch (error) {
      console.error(error);
      message.error("Failed to load checklist");
    } finally {
      setLoadingChecklist(false);
    }
  };

  // ── Live preview ──
  const previewData = useMemo(() => {
    let totalMinutes = 0;
    totalMinutes +=
      (Number(formData.estimated_sqft || 0) / 1000) * (costSettings.SQFT || 0);
    totalMinutes += Number(formData.room_count || 0) * (costSettings.ROOM || 0);
    totalMinutes +=
      Number(formData.restroom_count || 0) * (costSettings.RESTROOM || 0);
    totalMinutes +=
      Number(formData.stall_count || 0) * (costSettings.STALL || 0);
    totalMinutes +=
      Number(formData.kitchen_count || 0) * (costSettings.KITCHEN || 0);
    totalMinutes +=
      Number(formData.trash_can_count || 0) * (costSettings.TRASH_CAN || 0);
    totalMinutes += Number(formData.walkaround_minutes || 0);

    const carpetSqft =
      (Number(formData.estimated_sqft || 0) * floorComposition.carpet) / 100;

    const concreteSqft =
      (Number(formData.estimated_sqft || 0) * floorComposition.concrete) / 100;

    const vctSqft =
      (Number(formData.estimated_sqft || 0) * floorComposition.vct_lvt) / 100;

    const tileSqft =
      (Number(formData.estimated_sqft || 0) * floorComposition.tile) / 100;

    totalMinutes += (carpetSqft / 1000) * (costSettings.CARPET || 0);

    totalMinutes += (concreteSqft / 1000) * (costSettings.CONCRETE || 0);

    totalMinutes += (vctSqft / 1000) * (costSettings.VCT_LVT || 0);

    totalMinutes += (tileSqft / 1000) * (costSettings.TILE || 0);

    let equipmentCost = 0,
      chemicalCost = 0;
    customTasks.forEach((t) => {
      totalMinutes += Number(t.estimated_minutes || 0);
      equipmentCost += Number(t.equipment_cost || 0);
      chemicalCost += Number(t.chemical_cost || 0);
    });

    const estimatedHours = totalMinutes / 60;
    const hoursPerEmployee =
      estimatedHours / Number(formData.employee_count || 1);
    const laborCost = estimatedHours * Number(formData.hourly_wage || 0);
    const totalOperationalCost = laborCost + equipmentCost + chemicalCost;

    return {
      estimatedHours,
      hoursPerEmployee,
      laborCost,
      equipmentCost,
      chemicalCost,
      totalOperationalCost,
    };
  }, [formData, customTasks, costSettings, floorComposition]);

  // ── Handlers ──
  const handleChange = (key, value) =>
    setFormData((p) => ({ ...p, [key]: value }));

  const addTask = () =>
    setCustomTasks((p) => [
      ...p,
      {
        service_name: "",
        estimated_minutes: "",
        equipment_cost: "",
        chemical_cost: "",
      },
    ]);

  const updateTask = (i, key, value) => {
    const u = [...customTasks];
    u[i][key] = value;
    setCustomTasks(u);
  };

  const removeTask = (i) =>
    setCustomTasks((p) => p.filter((_, idx) => idx !== i));

  const submitCalculation = async () => {
    if (!formData.property_name.trim())
      return show("Please enter a property name", "warning");
    try {
      setLoading(true);
      const res = await CreateCostCalculator({
        ...formData,
        client_id: userId,
        custom_tasks: customTasks,
      });
      setResult(res.data.data);
      setCalculationId(res.data.data.id);
      show("Cost calculation saved successfully!");
    } catch (e) {
      show(e?.response?.data?.message || "Something went wrong", "error");
    } finally {
      setLoading(false);
    }
  };

  const submitBid = async () => {
    if (!calculationId)
      return show("Generate cost calculation first", "warning");
    try {
      setBidLoading(true);
      const res = await CreateBidMaximizer({
        cost_calculation_id: calculationId,
        ...bidData,
      });
      setBidResult(res.data.data);
      show("Bid generated successfully!");
    } catch (e) {
      show(e?.response?.data?.message || "Something went wrong", "error");
    } finally {
      setBidLoading(false);
    }
  };

  // ── Result rows ──
  const resultRows = result
    ? [
        {
          label: "Total Hours",
          value: `${Number(result.estimated_hours).toFixed(2)} hrs`,
          cls: "",
        },
        {
          label: "Hrs / Employee",
          value: `${Number(result.hours_per_employee).toFixed(2)} hrs`,
          cls: "",
        },
        {
          label: "Labor Cost",
          value: `$${Number(result.labor_cost).toFixed(2)}`,
          cls: "blue",
        },
        {
          label: "Equipment",
          value: `$${Number(result.equipment_cost || 0).toFixed(2)}`,
          cls: "",
        },
        {
          label: "Chemical",
          value: `$${Number(result.chemical_cost || 0).toFixed(2)}`,
          cls: "",
        },
        {
          label: "Operational Cost",
          value: `$${Number(result.total_operational_cost).toFixed(2)}`,
          cls: "green",
        },
      ]
    : [];

  const estimateRows = [
    {
      label: "Total Hours",
      value: `${previewData.estimatedHours.toFixed(2)} hrs`,
    },
    {
      label: "Hours / Employee",
      value: `${previewData.hoursPerEmployee.toFixed(2)} hrs`,
    },
    { label: "Labor Cost", value: `$${previewData.laborCost.toFixed(2)}` },
    {
      label: "Equipment Cost",
      value: `$${previewData.equipmentCost.toFixed(2)}`,
    },
    {
      label: "Chemical Cost",
      value: `$${previewData.chemicalCost.toFixed(2)}`,
    },
  ];

  const carpetSqft =
    (Number(formData.estimated_sqft) * floorComposition.carpet) / 100;

  const concreteSqft =
    (Number(formData.estimated_sqft) * floorComposition.concrete) / 100;

  const vctLvtSqft =
    (Number(formData.estimated_sqft) * floorComposition.vct_lvt) / 100;

  const tileSqft =
    (Number(formData.estimated_sqft) * floorComposition.tile) / 100;

  // ─────────────────────────────────────────────────────────────────────────────
  return (
    <>
      {ToastContainer}

      {showInstructions && (
        <InstructionsModal onClose={() => setShowInstructions(false)} />
      )}

      <div className="cc-page">
        {/* ══════════════════ LEFT COLUMN ══════════════════ */}
        <div>
          {/* Header */}
          <div className="cc-page-header">
            <div>
              <h1 className="cc-page-title">Cost Calculator</h1>
              <p className="cc-page-sub">
                Estimate operational costs, labor hours &amp; staffing
              </p>
            </div>
            <button
              className="cc-info-btn"
              onClick={() => setShowInstructions(true)}
            >
              <InfoCircleOutlined />
              How It Works
            </button>
          </div>

          {/* ── Client selector ── */}
          <div className="cc-card" style={{ marginBottom: 16 }}>
            <div className="cc-section-label">Select Client</div>
            <Select
              showSearch
              style={{ width: "100%" }}
              placeholder="Search and select a client…"
              optionFilterProp="children"
              value={userId}
              onChange={handleUserChange}
              filterOption={(input, option) =>
                option?.children?.toLowerCase()?.includes(input.toLowerCase())
              }
            >
              {users.map((user) => (
                <Option key={user.id} value={user.id}>
                  {user.name}
                </Option>
              ))}
            </Select>
          </div>

          {/* ── Property details card ── */}
          <div className="cc-card">
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                marginBottom: 16,
              }}
            >
              <div className="cc-section-label">Property Details</div>
              {clientType && (
                <span
                  className={`cc-client-type-badge ${
                    clientType === "commercial" ? "commercial" : "residential"
                  }`}
                >
                  {clientType.charAt(0).toUpperCase() +
                    clientType.slice(1).toLowerCase()}
                </span>
              )}
            </div>

            {/* Initial Client Chart — collapsible */}
            <div className="usb-chart-card">
              <button
                className="usb-chart-card__toggle"
                onClick={() => setChartCollapsed((v) => !v)}
              >
                <span className="usb-chart-card__toggle-title">
                  📊 Initial Client Chart
                </span>
                <span className="usb-chart-card__toggle-meta">
                  {chartCollapsed
                    ? `${clientChecklist.length} row${clientChecklist.length !== 1 ? "s" : ""} · click to expand`
                    : "click to collapse"}
                </span>
                {chartCollapsed ? <DownOutlined /> : <UpOutlined />}
              </button>

              {!chartCollapsed && (
                <div className="usb-chart-card__body">
                  {loadingChecklist ? (
                    <p className="usb-chart-card__loading">
                      Loading checklist…
                    </p>
                  ) : clientChecklist.length > 0 ? (
                    <div className="usb-table-wrap">
                      <table className="usb-table">
                        <thead>
                          <tr>
                            <th>Service Area</th>
                            {clientType === "commercial" ? (
                              <>
                                <th>
                                  # of Trash Cans
                                  <br />
                                  <small>or Stalls</small>
                                </th>

                                <th>
                                  # of Desks
                                  <br />
                                  <small>or Sinks</small>
                                </th>

                                <th>
                                  # of Rooms
                                  <br />
                                  <small>or Restrooms</small>
                                </th>
                              </>
                            ) : (
                              <th>
                                # of Desks / Trash Cans (Big Buildings)
                                <br />
                                <strong>OR</strong>
                                <br /># of Restrooms
                              </th>
                            )}
                            <th>
                              Flooring Type
                              <span className="usb-th-note">
                                {" "}
                                Carpet, Hard Floor, VCT
                              </span>
                            </th>
                            <th>Special Requests / Hot Spots</th>
                          </tr>
                        </thead>
                        <tbody>
                          {clientChecklist.map((item) => (
                            <tr key={item.id}>
                              <td>{item.service_area}</td>
                              {clientType === "commercial" ? (
                                <>
                                  <td>
                                    {item.stalls || 0}

                                    {Number(item.restrooms) > 0 &&
                                      Number(item.stalls) > 0 && (
                                        <div className="usb-total">
                                          Total:{" "}
                                          <strong>
                                            {Number(item.restrooms) *
                                              Number(item.stalls)}
                                          </strong>
                                        </div>
                                      )}
                                  </td>
                                  <td>
                                    {item.sinks || 0}

                                    {Number(item.restrooms) > 0 &&
                                      Number(item.sinks) > 0 && (
                                        <div className="usb-total">
                                          Total:{" "}
                                          <strong>
                                            {Number(item.restrooms) *
                                              Number(item.sinks)}
                                          </strong>
                                        </div>
                                      )}
                                  </td>
                                  <td>{item.restrooms || 0}</td>
                                </>
                              ) : (
                                <td>{item.num_desks_trash_cans || 0}</td>
                              )}
                              <td>{item.flooring_type || "—"}</td>
                              <td>{item.special_requests || "—"}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  ) : (
                    <p className="usb-chart-card__empty">
                      No checklist available for this client
                    </p>
                  )}
                </div>
              )}
            </div>

            {/* Name + sqft */}
            <div
              className="cc-grid-2"
              style={{ marginTop: 20, marginBottom: 16 }}
            >
              <div className="cc-field">
                <label className="cc-label">
                  Property Name <span style={{ color: "#ef4444" }}>*</span>
                </label>
                <input
                  className="cc-task-input"
                  placeholder="e.g. Downtown Office"
                  value={formData.property_name}
                  onChange={(e) =>
                    handleChange("property_name", e.target.value)
                  }
                />
              </div>
              <div className="cc-field">
                <label className="cc-label">
                  Square Footage <span style={{ color: "#ef4444" }}>*</span>
                </label>
                <input
                  type="number"
                  className="cc-task-input"
                  placeholder="0"
                  value={formData.estimated_sqft || ""}
                  min={0}
                  onChange={(e) =>
                    handleChange("estimated_sqft", Number(e.target.value))
                  }
                />
              </div>
            </div>

            {/* Counts grid */}
            {/* Floor Composition */}
            <div className="cc-floor-card">
              <div className="cc-floor-header">
                <h4>Floor Composition</h4>
                <span>
                  {Number(formData.estimated_sqft).toLocaleString()} sqft Total
                </span>
              </div>

              <div className="cc-floor-grid">
                <div className="cc-floor-item">
                  <div className="title">Carpet</div>
                  <div className="percent">{floorComposition.carpet}%</div>
                  <div className="sqft">
                    ≈ {Math.round(carpetSqft).toLocaleString()} sqft
                  </div>
                </div>

                <div className="cc-floor-item">
                  <div className="title">Concrete</div>
                  <div className="percent">{floorComposition.concrete}%</div>
                  <div className="sqft">
                    ≈ {Math.round(concreteSqft).toLocaleString()} sqft
                  </div>
                </div>

                <div className="cc-floor-item">
                  <div className="title">VCT / LVT</div>
                  <div className="percent">{floorComposition.vct_lvt}%</div>
                  <div className="sqft">
                    ≈ {Math.round(vctLvtSqft).toLocaleString()} sqft
                  </div>
                </div>

                <div className="cc-floor-item">
                  <div className="title">Tile</div>
                  <div className="percent">{floorComposition.tile}%</div>
                  <div className="sqft">
                    ≈ {Math.round(tileSqft).toLocaleString()} sqft
                  </div>
                </div>
              </div>

              <div className="cc-floor-note">
                Cleaning time is automatically adjusted using the floor
                composition percentages configured for this client and the floor
                type settings in Cost Calculation Settings.
              </div>
            </div>

            {/* Counts grid */}
            <div className="cc-grid-3"></div>
            <div className="cc-grid-3">
              {PROPERTY_FIELDS.map(({ key, label, min }) => (
                <div className="cc-field" key={key}>
                  <label className="cc-label">{label}</label>
                  <input
                    type="number"
                    className="cc-task-input"
                    value={formData[key] || ""}
                    min={min || 0}
                    placeholder="0"
                    onChange={(e) => handleChange(key, Number(e.target.value))}
                  />
                </div>
              ))}
              <div className="cc-field">
                <label className="cc-label">Hourly Wage ($)</label>
                <input
                  type="number"
                  className="cc-task-input"
                  value={formData.hourly_wage || ""}
                  min={0}
                  placeholder="18"
                  onChange={(e) =>
                    handleChange("hourly_wage", Number(e.target.value))
                  }
                />
              </div>
            </div>
          </div>

          {/* ── Custom Tasks ── */}
          <div className="cc-card" style={{ marginTop: 16 }}>
            <div className="cc-tasks-header">
              <div>
                <p className="cc-tasks-title">Custom Tasks</p>
                <p className="cc-tasks-sub">
                  Add specialty cleaning services with custom time &amp; costs
                </p>
              </div>
              <button className="cc-add-btn" onClick={addTask}>
                <PlusOutlined />
                Add Task
              </button>
            </div>

            {customTasks.length === 0 ? (
              <div className="cc-empty-tasks">
                No custom tasks yet — click <strong>Add Task</strong> to include
                specialty work
              </div>
            ) : (
              <table className="cc-tasks-table">
                <thead>
                  <tr>
                    <th>Service Name</th>
                    <th style={{ width: 110 }}>Minutes</th>
                    <th style={{ width: 130 }}>Equipment ($)</th>
                    <th style={{ width: 130 }}>Chemical ($)</th>
                    <th style={{ width: 44 }} />
                  </tr>
                </thead>
                <tbody>
                  {customTasks.map((task, i) => (
                    <tr key={i}>
                      <td>
                        <input
                          className="cc-task-input"
                          placeholder="e.g. Deep Oven Cleaning"
                          value={task.service_name}
                          onChange={(e) =>
                            updateTask(i, "service_name", e.target.value)
                          }
                        />
                      </td>
                      {[
                        "estimated_minutes",
                        "equipment_cost",
                        "chemical_cost",
                      ].map((field) => (
                        <td key={field}>
                          <input
                            type="number"
                            className="cc-task-input"
                            min={0}
                            value={task[field] ?? ""}
                            onChange={(e) =>
                              updateTask(
                                i,
                                field,
                                e.target.value === ""
                                  ? ""
                                  : Number(e.target.value),
                              )
                            }
                          />
                        </td>
                      ))}
                      <td>
                        <button
                          className="cc-task-del"
                          onClick={() => removeTask(i)}
                        >
                          <DeleteOutlined />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>

          {/* ── Submit ── */}
          <div style={{ marginTop: 16 }}>
            <button
              className="cc-submit-btn"
              onClick={submitCalculation}
              disabled={loading}
            >
              {loading ? (
                <span className="cc-spinner" />
              ) : (
                <CalculatorOutlined />
              )}
              {loading ? "Generating…" : "Generate Cost Calculation"}
            </button>
          </div>

          {/* ── Result banner ── */}
          {result && (
            <div className="cc-result-banner" style={{ marginTop: 16 }}>
              <p className="title">
                <CheckCircleOutlined /> Calculation Saved
              </p>
              <div className="cc-result-grid">
                {resultRows.map((r) => (
                  <div key={r.label} className="cc-result-item">
                    <div className="r-label">{r.label}</div>
                    <div className={`r-value ${r.cls}`}>{r.value}</div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* ══════════════════ RIGHT SIDEBAR ══════════════════ */}
        <div className="cc-sidebar">
          {/* Live Estimate */}
          <div className="cc-card cc-card--accent">
            <div className="cc-estimate-header">
              <div className="cc-estimate-dot" />
              <span className="cc-estimate-title">Live Estimate</span>
            </div>

            {estimateRows.map((r) => (
              <div key={r.label} className="cc-estimate-row">
                <span className="label">{r.label}</span>
                <span className="value">{r.value}</span>
              </div>
            ))}

            <div className="cc-estimate-total">
              <span className="label">Total Operational Cost</span>
              <span className="value">
                ${previewData.totalOperationalCost.toFixed(2)}
              </span>
            </div>
          </div>

          {/* Bid Maximizer */}
          <div className="cc-card">
            <p className="cc-bid-title">Bid Maximizer</p>
            <p className="cc-bid-sub">Generate smart customer-facing pricing</p>

            {BID_FIELDS.map(({ key, label }) => (
              <div key={key} className="cc-bid-field">
                <label className="cc-bid-label">{label}</label>
                <input
                  type="number"
                  className="cc-task-input"
                  value={bidData[key]}
                  min={0}
                  onChange={(e) =>
                    setBidData((p) => ({ ...p, [key]: Number(e.target.value) }))
                  }
                />
              </div>
            ))}

            <button
              className="cc-bid-btn"
              onClick={submitBid}
              disabled={bidLoading}
            >
              {bidLoading ? (
                <span className="cc-spinner" />
              ) : (
                <DollarOutlined />
              )}
              {bidLoading ? "Generating Bid…" : "Generate Bid"}
            </button>

            {!calculationId && (
              <p className="cc-bid-hint">
                Generate a cost calculation first to unlock bid
              </p>
            )}

            {bidResult && (
              <div className="cc-bid-results">
                <div className="cc-bid-rec">
                  <div className="label">Recommended Bid</div>
                  <div className="value">
                    ${Number(bidResult.recommended_bid).toFixed(2)}
                  </div>
                </div>
                {[
                  {
                    label: "Minimum Bid",
                    value: `$${Number(bidResult.minimum_bid).toFixed(2)}`,
                  },
                  {
                    label: "Maximum Bid",
                    value: `$${Number(bidResult.maximum_bid).toFixed(2)}`,
                  },
                  {
                    label: "Commission",
                    value: `$${Number(bidResult.commission_amount).toFixed(2)}`,
                  },
                ].map((r) => (
                  <div key={r.label} className="cc-bid-result-row">
                    <span className="label">{r.label}</span>
                    <span className="value">{r.value}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
};

export default CostCalculator;
