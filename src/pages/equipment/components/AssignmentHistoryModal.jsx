import { useState } from "react";
import { Modal, Spin, Empty } from "antd";
import {
  History,
  CheckCircle2,
  Clock,
  PackageCheck,
  RotateCcw,
  User,
  Wrench,
  X,
} from "lucide-react";
import "./AssignmentHistoryModal.scss";
import { getAssignmentHistory } from "@/services/api/equipmentApi";
import { dataOf } from "@/services/apiResult";
import { useApiQuery } from "@/hooks/useApiQuery";
import { formatDateTime } from "@/utils/datetime";

const STATUS_META = {
  ASSIGNED: { color: "var(--color-primary-strong)", bg: "var(--color-primary-soft)", label: "Assigned" },
  RETURNED: { color: "var(--color-success-strong)", bg: "var(--color-success-subtle)", label: "Returned" },
  PARTIALLY_RETURNED: { color: "var(--color-warning-strong)", bg: "var(--color-warning-subtle)", label: "Partially Returned" },
  OVERDUE: { color: "var(--color-error-strong)", bg: "var(--color-error-subtle)", label: "Overdue" },
};

const ACTION_META = {
  ASSIGNED: {
    icon: PackageCheck,
    color: "var(--color-primary-strong)",
    bg: "var(--color-primary-soft)",
    label: "Assigned",
    describe: (sig) => `Assigned ${sig.quantity ?? "—"} unit(s) to the employee.`,
  },
  RETURNED: {
    icon: CheckCircle2,
    color: "var(--color-success-strong)",
    bg: "var(--color-success-subtle)",
    label: "Returned",
    describe: (sig) =>
      `Returned ${sig.quantity ?? "—"} unit(s). ${
        sig.remaining_quantity === 0 ? "All units accounted for." : ""
      }`,
  },
  PARTIAL_RETURN: {
    icon: RotateCcw,
    color: "var(--color-warning-strong)",
    bg: "var(--color-warning-subtle)",
    label: "Partial Return",
    describe: (sig) =>
      `Returned ${sig.quantity ?? "—"} unit(s) — ${sig.remaining_quantity ?? "—"} still with employee.`,
  },
  PARTIALLY_RETURNED: {
    icon: RotateCcw,
    color: "var(--color-warning-strong)",
    bg: "var(--color-warning-subtle)",
    label: "Partial Return",
    describe: (sig) =>
      `Returned ${sig.quantity ?? "—"} unit(s) — ${sig.remaining_quantity ?? "—"} still with employee.`,
  },
  OVERDUE: {
    icon: Clock,
    color: "var(--color-error-strong)",
    bg: "var(--color-error-subtle)",
    label: "Overdue",
    describe: () => "This assignment passed its expected return date.",
  },
};

const getStatusMeta = (status) =>
  STATUS_META[status] || { color: "var(--color-text-secondary)", bg: "var(--color-bg-muted)", label: status || "—" };

const getActionMeta = (action) =>
  ACTION_META[action] || {
    icon: History,
    color: "var(--color-text-secondary)",
    bg: "var(--color-bg-muted)",
    label: action || "Update",
    describe: () => "Assignment updated.",
  };

const AssignmentHistoryModal = ({ open, onClose, assignmentId, equipmentName }) => {
  const [previewImg, setPreviewImg] = useState(null);

  // The open assignment's history; a different assignment loads afresh.
  const { data: loaded, loading } = useApiQuery(() => getAssignmentHistory(assignmentId).then(dataOf), [assignmentId], {
    skip: !open || !assignmentId,
    errorText: "Couldn't load the assignment's history",
  });
  const data = loaded?.assignment?.id === assignmentId ? loaded : null;

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
        onCancel={() => {
          setPreviewImg(null);
          onClose();
        }}
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
            aria-label="Close"
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