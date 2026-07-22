import React, { useEffect, useMemo, useState, useCallback } from "react";
import { DeleteOutlined, EyeOutlined, HistoryOutlined } from "@ant-design/icons";
import dayjs from "@/lib/dayjs";
import {
  DeleteCostCalculation,
  GetAllCostCalculations,
} from "../../services/Api/CalculatorApi";

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

// ─── VIEW MODAL ───────────────────────────────────────────────────────────────
const ViewModal = ({ record, onClose }) => {
  const customTasks = record.custom_tasks || [];

  const customTaskMinutes = customTasks.reduce(
    (sum, task) => sum + Number(task.estimated_minutes || 0),
    0
  );

  const customTaskEquipment = customTasks.reduce(
    (sum, task) => sum + Number(task.equipment_cost || 0),
    0
  );

  const customTaskChemical = customTasks.reduce(
    (sum, task) => sum + Number(task.chemical_cost || 0),
    0
  );

  return (
    <div className="cc-modal-overlay" onClick={onClose}>
      <div
        className="cc-modal cc-modal--wide"
        style={{ maxWidth: "1100px" }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="cc-modal-header">
          <h3>📋 {record.property_name}</h3>
          <button className="cc-modal-close" onClick={onClose}>
            ✕
          </button>
        </div>

        <div className="cc-modal-body">

          {/* PROPERTY OVERVIEW */}
          <h4 style={{ marginBottom: 16 }}>Property Overview</h4>

          <div className="ch-detail-grid">
            <div className="ch-detail-item">
              <div className="d-label">SQUARE FOOTAGE</div>
              <div className="d-value">
                {Number(record.estimated_sqft || 0).toLocaleString()} sqft
              </div>
            </div>

            <div className="ch-detail-item">
              <div className="d-label">ROOMS</div>
              <div className="d-value">
                {record.room_count || 0}
              </div>
            </div>

            <div className="ch-detail-item">
              <div className="d-label">RESTROOMS</div>
              <div className="d-value">
                {record.restroom_count || 0}
              </div>
            </div>

            <div className="ch-detail-item">
              <div className="d-label">STALLS</div>
              <div className="d-value">
                {record.stall_count || 0}
              </div>
            </div>

            <div className="ch-detail-item">
              <div className="d-label">KITCHENS</div>
              <div className="d-value">
                {record.kitchen_count || 0}
              </div>
            </div>

            <div className="ch-detail-item">
              <div className="d-label">EMPLOYEES</div>
              <div className="d-value">
                {record.employee_count || 0}
              </div>
            </div>

            <div className="ch-detail-item">
              <div className="d-label">HOURLY WAGE</div>
              <div className="d-value">
                ${Number(record.hourly_wage || 0).toFixed(2)}
              </div>
            </div>

            <div className="ch-detail-item">
              <div className="d-label">CREATED</div>
              <div className="d-value">
                {dayjs(record.created_at).format("MMM DD, YYYY")}
              </div>
            </div>
          </div>

          {/* COST BREAKDOWN */}
          <h4 style={{ marginTop: 30, marginBottom: 16 }}>
            Cost Breakdown
          </h4>

          <div className="ch-detail-grid">
            <div className="ch-detail-item">
              <div className="d-label">ESTIMATED HOURS</div>
              <div className="d-value">
                {Number(record.estimated_hours || 0).toFixed(2)} hrs
              </div>
            </div>

            <div className="ch-detail-item">
              <div className="d-label">HOURS / EMPLOYEE</div>
              <div className="d-value">
                {Number(record.hours_per_employee || 0).toFixed(2)} hrs
              </div>
            </div>

            <div className="ch-detail-item">
              <div className="d-label">LABOR COST</div>
              <div className="d-value">
                ${Number(record.labor_cost || 0).toFixed(2)}
              </div>
            </div>

            <div className="ch-detail-item">
              <div className="d-label">EQUIPMENT COST</div>
              <div className="d-value">
                ${Number(record.equipment_cost || 0).toFixed(2)}
              </div>
            </div>

            <div className="ch-detail-item">
              <div className="d-label">CHEMICAL COST</div>
              <div className="d-value">
                ${Number(record.chemical_cost || 0).toFixed(2)}
              </div>
            </div>

            <div className="ch-detail-item">
              <div className="d-label">TOTAL OPERATIONAL COST</div>
              <div
                className="d-value green"
                style={{ fontSize: 30, fontWeight: 700 }}
              >
                ${Number(record.total_operational_cost || 0).toFixed(2)}
              </div>
            </div>
          </div>

          {/* CUSTOM TASKS */}
          {customTasks.length > 0 && (
            <>
              <h4 style={{ marginTop: 30, marginBottom: 16 }}>
                Custom Tasks
              </h4>

              <div className="ch-table-wrap">
                <table className="ch-table">
                  <thead>
                    <tr>
                      <th>Task</th>
                      <th>Minutes</th>
                      <th>Equipment Cost</th>
                      <th>Chemical Cost</th>
                      <th>Notes</th>
                    </tr>
                  </thead>

                  <tbody>
                    {customTasks.map((task) => (
                      <tr key={task.id}>
                        <td>{task.service_name}</td>
                        <td>{task.estimated_minutes}</td>
                        <td>
                          $
                          {Number(
                            task.equipment_cost || 0
                          ).toFixed(2)}
                        </td>
                        <td>
                          $
                          {Number(
                            task.chemical_cost || 0
                          ).toFixed(2)}
                        </td>
                        <td>{task.notes || "—"}</td>
                      </tr>
                    ))}

                    <tr
                      style={{
                        background: "#f8fafc",
                        fontWeight: 700,
                      }}
                    >
                      <td>Total</td>
                      <td>{customTaskMinutes}</td>
                      <td>${customTaskEquipment.toFixed(2)}</td>
                      <td>${customTaskChemical.toFixed(2)}</td>
                      <td>—</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

// ─── CONFIRM MODAL ─────────────────────────────────────────────────────────────
const ConfirmModal = ({ onConfirm, onCancel }) => (
  <div className="cc-modal-overlay" onClick={onCancel}>
    <div className="cc-modal" style={{ maxWidth: 400 }} onClick={(e) => e.stopPropagation()}>
      <div className="cc-modal-header">
        <h3>Delete Calculation</h3>
        <button className="cc-modal-close" onClick={onCancel}>✕</button>
      </div>
      <div className="cc-modal-body">
        <p className="cc-confirm-msg">
          Are you sure you want to delete this calculation? This action cannot be undone.
        </p>
        <div className="cc-confirm-actions">
          <button className="btn-cancel" onClick={onCancel}>Cancel</button>
          <button className="btn-del" onClick={onConfirm}>Delete</button>
        </div>
      </div>
    </div>
  </div>
);

// ─── MAIN COMPONENT ───────────────────────────────────────────────────────────
const CalculationHistory = () => {
  const { show, ToastContainer } = useToast();

  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchText, setSearchText] = useState("");
  const [selectedRecord, setSelectedRecord] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);

  const fetchCalculations = async () => {
    try {
      setLoading(true);
      const res = await GetAllCostCalculations();
      setData(res.data.data.data || []);
    } catch {
      show("Failed to fetch calculations", "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCalculations();
  }, []);

  const filteredData = useMemo(() => {
    if (!searchText) return data;
    return data.filter((item) =>
      (item.property_name?.toLowerCase() || "").includes(searchText.toLowerCase())
    );
  }, [searchText, data]);

  const handleDelete = async () => {
    try {
      await DeleteCostCalculation(deleteTarget);
      show("Calculation deleted");
      setDeleteTarget(null);
      fetchCalculations();
    } catch {
      show("Failed to delete calculation", "error");
    }
  };

  return (
    <>
      {ToastContainer}

      {selectedRecord && (
        <ViewModal record={selectedRecord} onClose={() => setSelectedRecord(null)} />
      )}

      {deleteTarget && (
        <ConfirmModal
          onConfirm={handleDelete}
          onCancel={() => setDeleteTarget(null)}
        />
      )}

      <div className="ch-page">
        <div className="ch-header">
          <div>
            <h1 className="ch-title">Calculation History</h1>
            <p className="ch-sub">View and manage all saved operational calculations</p>
          </div>
          <input
            className="ch-search"
            placeholder="🔍  Search by property…"
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
          />
        </div>

        <div className="ch-table-wrap">
          {loading ? (
            <div className="ch-empty">
              <div className="icon">⏳</div>
              <div className="msg">Loading calculations…</div>
            </div>
          ) : filteredData.length === 0 ? (
            <div className="ch-empty">
              <div className="icon"><HistoryOutlined /></div>
              <div className="msg">
                {searchText ? "No calculations match your search" : "No calculations saved yet"}
              </div>
            </div>
          ) : (
            <table className="ch-table">
              <thead>
                <tr>
                  <th>Property</th>
                  <th>Sq. Ft.</th>
                  <th>Employees</th>
                  <th>Est. Hours</th>
                  <th>Operational Cost</th>
                  <th>Created</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredData.map((item) => (
                  <tr key={item.id}>
                    <td style={{ fontWeight: 600 }}>{item.property_name}</td>
                    <td style={{ color: "#8892a4" }}>{item.estimated_sqft?.toLocaleString() || "—"}</td>
                    <td style={{ color: "#8892a4" }}>{item.employee_count}</td>
                    <td style={{ color: "#8892a4" }}>{Number(item.estimated_hours).toFixed(2)} hrs</td>
                    <td>
                      <span className="ch-tag">
                        ${Number(item.total_operational_cost).toFixed(2)}
                      </span>
                    </td>
                    <td>
                      <span className="ch-date">
                        {dayjs(item.created_at).format("MMM DD, YYYY")}
                      </span>
                    </td>
                    <td>
                      <div className="ch-actions">
                        <button
                          className="ch-btn ch-btn--view"
                          onClick={() => setSelectedRecord(item)}
                        >
                          <EyeOutlined />
                          View
                        </button>
                        <button
                          className="ch-btn ch-btn--del"
                          onClick={() => setDeleteTarget(item.id)}
                        >
                          <DeleteOutlined />
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        <div style={{ marginTop: 12, fontSize: 12, color: "#525c6e" }}>
          {filteredData.length} calculation{filteredData.length !== 1 ? "s" : ""} found
        </div>
      </div>
    </>
  );
};

export default CalculationHistory;