/** @format */

import React, { useEffect, useState } from "react";
import { Modal, Spin, Empty, message } from "antd";
import {
  History,
  CheckCircle2,
  Clock,
  PackageCheck,
  RotateCcw,
  Hash,
  User,
  Wrench,
  X,
} from "lucide-react";
import "./AssignmentHistoryModal.scss";
import { GetAssignmentHistory } from "../../../../services/Api/equipmentApi";

const STATUS_META = {
  ASSIGNED: { color: "#4338ca", bg: "#eef2ff", label: "Assigned" },
  RETURNED: { color: "#059669", bg: "#ecfdf5", label: "Returned" },
  PARTIALLY_RETURNED: { color: "#b45309", bg: "#fef3c7", label: "Partially Returned" },
  OVERDUE: { color: "#dc2626", bg: "#fee2e2", label: "Overdue" },
};

const ACTION_META = {
  ASSIGNED: {
    icon: PackageCheck,
    color: "#4338ca",
    bg: "#eef2ff",
    label: "Assigned",
    describe: (sig) => `Assigned ${sig.quantity ?? "—"} unit(s) to the employee.`,
  },
  RETURNED: {
    icon: CheckCircle2,
    color: "#059669",
    bg: "#ecfdf5",
    label: "Returned",
    describe: (sig) =>
      `Returned ${sig.quantity ?? "—"} unit(s). ${
        sig.remaining_quantity === 0 ? "All units accounted for." : ""
      }`,
  },
  PARTIAL_RETURN: {
    icon: RotateCcw,
    color: "#b45309",
    bg: "#fef3c7",
    label: "Partial Return",
    describe: (sig) =>
      `Returned ${sig.quantity ?? "—"} unit(s) — ${sig.remaining_quantity ?? "—"} still with employee.`,
  },
  PARTIALLY_RETURNED: {
    icon: RotateCcw,
    color: "#b45309",
    bg: "#fef3c7",
    label: "Partial Return",
    describe: (sig) =>
      `Returned ${sig.quantity ?? "—"} unit(s) — ${sig.remaining_quantity ?? "—"} still with employee.`,
  },
  OVERDUE: {
    icon: Clock,
    color: "#dc2626",
    bg: "#fee2e2",
    label: "Overdue",
    describe: () => "This assignment passed its expected return date.",
  },
};

const getStatusMeta = (status) =>
  STATUS_META[status] || { color: "#4b5f58", bg: "#f1f4f2", label: status || "—" };

const getActionMeta = (action) =>
  ACTION_META[action] || {
    icon: History,
    color: "#4b5f58",
    bg: "#f1f4f2",
    label: action || "Update",
    describe: () => "Assignment updated.",
  };

const formatDateTime = (dateStr) => {
  if (!dateStr) return "—";
  return new Date(dateStr).toLocaleString("en-US", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
};

const AssignmentHistoryModal = ({ open, onClose, assignmentId, equipmentName }) => {
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState(null);
  const [previewImg, setPreviewImg] = useState(null);

  useEffect(() => {
    if (open && assignmentId) {
      fetchHistory();
    } else if (!open) {
      setData(null);
      setPreviewImg(null);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, assignmentId]);

  const fetchHistory = async () => {
    setLoading(true);
    try {
      const res = await GetAssignmentHistory(assignmentId);
      setData(res?.data?.data || null);
    } catch (error) {
      message.error(
        error?.response?.data?.message || "Failed to fetch assignment history."
      );
    } finally {
      setLoading(false);
    }
  };

  const assignment = data?.assignment || {};
  const signatures = data?.history || [];
  const currentVersion = assignment?.signature?.current_version;
  const currentSignedVersion = assignment?.signature?.signed_version;
  const signatureRequired = assignment?.signature?.required;
  const statusMeta = getStatusMeta(assignment?.status);

  const sortedSignatures = signatures
    .slice()
    .sort((a, b) => b.signature_version - a.signature_version);

  return (
    <>
      <Modal
        title={
          <div className="assignment-history__modal-title">
            <History size={18} />
            <span>Assignment History{equipmentName ? ` · ${equipmentName}` : ""}</span>
          </div>
        }
        open={open}
        onCancel={onClose}
        footer={null}
        className="assignment-history__modal"
        width={560}
      >
        {loading ? (
          <div className="assignment-history__loading">
            <Spin size="large" />
          </div>
        ) : sortedSignatures.length === 0 ? (
          <Empty description="No history recorded for this assignment yet." />
        ) : (
          <>
            {/* Summary card — who, what, current state, at a glance */}
            <div className="assignment-history__summary-card">
              <div className="assignment-history__summary-top">
                <div className="assignment-history__summary-icon">
                  <Wrench size={18} />
                </div>
                <div className="assignment-history__summary-main">
                  <div className="assignment-history__summary-name">
                    {equipmentName || assignment?.equipment?.name || "Equipment"}
                  </div>
                  {assignment?.employee?.name && (
                    <div className="assignment-history__summary-employee">
                      <User size={12} />
                      {assignment.employee.name}
                    </div>
                  )}
                </div>
                <span
                  className="assignment-history__status-badge"
                  style={{ background: statusMeta.bg, color: statusMeta.color }}
                >
                  {statusMeta.label}
                </span>
              </div>

              <div className="assignment-history__summary-stats">
                <div className="assignment-history__stat">
                  <span className="assignment-history__stat-value">
                    {assignment?.assigned_quantity ?? "—"}
                  </span>
                  <span className="assignment-history__stat-label">Assigned</span>
                </div>
                <div className="assignment-history__stat">
                  <span className="assignment-history__stat-value">
                    {assignment?.returned_quantity ?? "—"}
                  </span>
                  <span className="assignment-history__stat-label">Returned</span>
                </div>
                <div className="assignment-history__stat">
                  <span className="assignment-history__stat-value">
                    {assignment?.pending_quantity ?? "—"}
                  </span>
                  <span className="assignment-history__stat-label">Pending</span>
                </div>
              </div>
            </div>

            {signatureRequired && currentVersion > currentSignedVersion && (
              <div className="assignment-history__pending-banner">
                A newer update is waiting on the employee's signature.
              </div>
            )}

            {/* Timeline — newest first, plain-language description per event */}
            <div className="assignment-history__timeline-label">Activity Timeline</div>

            <div className="assignment-history__timeline">
              {sortedSignatures.map((sig) => {
                const meta = getActionMeta(sig.action || sig.status);
                const Icon = meta.icon;
                const isCurrent = sig.signature_version === currentSignedVersion;

                return (
                  <div key={sig.id} className="assignment-history__entry">
                    <div
                      className="assignment-history__entry-marker"
                      style={{ background: meta.bg, color: meta.color }}
                    >
                      <Icon size={15} />
                    </div>

                    <div className="assignment-history__entry-content">
                      <div className="assignment-history__entry-top">
                        <span className="assignment-history__version">
                          {meta.label}
                          <span className="assignment-history__version-tag">
                            v{sig.signature_version}
                          </span>
                          {isCurrent && (
                            <span className="assignment-history__current-badge">Current</span>
                          )}
                        </span>
                        <span className="assignment-history__time">
                          <Clock size={11} />
                          {formatDateTime(sig.signed_at)}
                        </span>
                      </div>

                      <p className="assignment-history__description">
                        {meta.describe(sig)}
                      </p>

                      {sig.signature && (
                        <button
                          type="button"
                          className="assignment-history__signature-thumb"
                          onClick={() => setPreviewImg(sig.signature)}
                        >
                          <img src={sig.signature} alt={`Signature v${sig.signature_version}`} />
                          <span>View signature</span>
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </>
        )}
      </Modal>

      {/* Full-size signature preview */}
      {previewImg && (
        <div className="assignment-history__lightbox" onClick={() => setPreviewImg(null)}>
          <button
            type="button"
            className="assignment-history__lightbox-close"
            onClick={() => setPreviewImg(null)}
          >
            <X size={18} />
          </button>
          <img src={previewImg} alt="Signature" onClick={(e) => e.stopPropagation()} />
        </div>
      )}
    </>
  );
};

export default AssignmentHistoryModal;