/** @format */

import React, { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router";
import {
  message,
  Progress,
  Empty,
  Modal,
  Radio,
  Input as AntInput,
  Image,
} from "antd";
import Box from "@mui/material/Box";
import Paper from "@mui/material/Paper";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import Divider from "@mui/material/Divider";
import Tooltip from "@mui/material/Tooltip";
import {
  ArrowLeft,
  CheckCircle2,
  Circle,
  StickyNote,
  ImageOff,
  Pencil,
  Camera,
  Award,
  CheckCheck,
  Send,
  Clock,
  UserRound,
  ShieldCheck,
} from "lucide-react";
import dayjs from "@/lib/dayjs";
import {
  GetInspectionById,
  ReviewInspectionItem,
  UploadBDMInspectionItemImage,
  CompleteInspection,
  SendInspectionToClient,
} from "../../services/Api/InspectionApi";
import { BASE_URL_IMAGE } from "../../services/Host";
import "./InspectionDetail.scss";

const { TextArea } = AntInput;

const DATE_FORMAT = "MM/DD/YYYY hh:mm A";

const STATUS_CONFIG = {
  ASSIGNED: { color: "#2563EB", bg: "#EFF6FF", label: "Assigned" },
  IN_PROGRESS: { color: "#D97706", bg: "#FFFBEB", label: "In Progress" },
  SUBMITTED: { color: "#7C3AED", bg: "#F5F3FF", label: "Submitted" },
  UNDER_REVIEW: { color: "#0891B2", bg: "#ECFEFF", label: "Under Review" },
  COMPLETED: { color: "#16A34A", bg: "#F0FDF4", label: "Completed" },
  CANCELLED: { color: "#EF4444", bg: "#FEF2F2", label: "Cancelled" },
};

const BDM_ITEM_STATUS_CONFIG = {
  PENDING: { color: "#9ca3af", bg: "#f3f4f6", label: "Pending Review" },
  APPROVED: { color: "#16A34A", bg: "#F0FDF4", label: "Approved" },
  ISSUE: { color: "#EF4444", bg: "#FEF2F2", label: "Issue Flagged" },
};

const FreqBadge = ({ label, active, variant }) => (
  <span
    className={`freq-badge freq-badge--${variant}${active ? " freq-badge--active" : ""}`}
  >
    {label}
  </span>
);

const scoreColor = (score) => {
  if (score === null || score === undefined)
    return { color: "#9ca3af", bg: "#f8f9fa", border: "#eef0f2" };
  if (score >= 8) return { color: "#059669", bg: "#ecfdf5", border: "#a7f3d0" };
  if (score >= 5) return { color: "#b45309", bg: "#fef3c7", border: "#fde68a" };
  return { color: "#dc2626", bg: "#fee2e2", border: "#fecaca" };
};

const InspectionDetail = () => {
  const navigate = useNavigate();
  const { id } = useParams();

  const [loading, setLoading] = useState(false);
  const [inspection, setInspection] = useState(null);

  const [reviewModalVisible, setReviewModalVisible] = useState(false);
  const [reviewingItem, setReviewingItem] = useState(null);
  const [reviewStatus, setReviewStatus] = useState("APPROVED");
  const [reviewRemark, setReviewRemark] = useState("");
  const [reviewFiles, setReviewFiles] = useState([]);
  const [reviewSubmitting, setReviewSubmitting] = useState(false);

  const [completeModalVisible, setCompleteModalVisible] = useState(false);
  const [completionRemark, setCompletionRemark] = useState("");
  const [completeSubmitting, setCompleteSubmitting] = useState(false);

  const [sendingToClient, setSendingToClient] = useState(false);

  // Which "N attachments" groups are expanded to show thumbnails.
  // Keyed as `emp-${itemId}` / `bdm-${itemId}`.
  const [expandedImageGroups, setExpandedImageGroups] = useState(new Set());

  const toggleImageGroup = (key) => {
    setExpandedImageGroups((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  };

  const fetchInspection = async ({ silent } = {}) => {
    try {
      if (!silent) setLoading(true);
      const res = await GetInspectionById(id);
      const raw = res?.data?.data?.data ?? res?.data?.data;
      const record = Array.isArray(raw) ? raw[0] : raw;
      setInspection(record || null);
    } catch (error) {
      console.error("Error fetching inspection:", error);
      message.error("Failed to fetch inspection");
    } finally {
      if (!silent) setLoading(false);
    }
  };

  useEffect(() => {
    fetchInspection();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const openReviewModal = (item) => {
    if (!item.employee_completed) return;
    setReviewingItem(item);
    setReviewStatus(item.bdm_status === "ISSUE" ? "ISSUE" : "APPROVED");
    setReviewRemark(item.bdm_remark || "");
    setReviewFiles([]);
    setReviewModalVisible(true);
  };

  const handleSubmitReview = async () => {
    if (reviewStatus === "ISSUE" && !reviewRemark.trim()) {
      message.error("A remark is required when flagging an issue.");
      return;
    }

    try {
      setReviewSubmitting(true);
      await ReviewInspectionItem(reviewingItem.id, {
        bdm_status: reviewStatus,
        bdm_remark: reviewRemark,
      });

      if (reviewFiles.length > 0) {
        await UploadBDMInspectionItemImage(reviewingItem.id, reviewFiles);
      }

      message.success("Review saved");
      setReviewModalVisible(false);
      await fetchInspection({ silent: true });
    } catch (error) {
      console.error("Error submitting review:", error);
      message.error(error?.response?.data?.message || "Failed to save review");
    } finally {
      setReviewSubmitting(false);
    }
  };

  const handleCompleteInspection = async () => {
    try {
      setCompleteSubmitting(true);
      await CompleteInspection(id, { overall_remark: completionRemark });
      message.success("Inspection completed");
      setCompleteModalVisible(false);
      await fetchInspection();
    } catch (error) {
      console.error("Error completing inspection:", error);
      message.error(
        error?.response?.data?.message || "Failed to complete inspection",
      );
    } finally {
      setCompleteSubmitting(false);
    }
  };

  const handleSendToClient = () => {
    Modal.confirm({
      title: "Send report to client?",
      content: `This will email the inspection report to ${
        inspection?.client?.email || "the client"
      }.`,
      okText: "Send",
      onOk: async () => {
        try {
          setSendingToClient(true);
          await SendInspectionToClient(id);
          message.success("Report sent to client");
          await fetchInspection({ silent: true });
        } catch (error) {
          console.error("Error sending to client:", error);
          message.error(
            error?.response?.data?.message || "Failed to send report",
          );
        } finally {
          setSendingToClient(false);
        }
      },
    });
  };

  if (!loading && !inspection) {
    return (
      <Box sx={{ py: 8 }}>
        <Empty description="Inspection not found" />
      </Box>
    );
  }

  const items = inspection?.items || [];
  const summary = inspection?.summary || {
    total_items: items.length,
    completed_items: 0,
    completion_percentage: 0,
  };

  const sections = Object.values(
    items.reduce((acc, item) => {
      const key = item.section_name;
      if (!acc[key]) {
        acc[key] = {
          section_name: key,
          section_order: item.section_order,
          items: [],
        };
      }
      acc[key].items.push(item);
      return acc;
    }, {}),
  )
    .sort((a, b) => a.section_order - b.section_order)
    .map((section) => ({
      ...section,
      items: section.items.sort((a, b) => a.item_order - b.item_order),
    }));

  const statusCfg = STATUS_CONFIG[inspection?.status] || {
    color: "#6B7280",
    bg: "#F3F4F6",
    label: inspection?.status,
  };

  const isCompleted = inspection?.status === "COMPLETED";
  const canComplete = inspection?.status === "UNDER_REVIEW";
  const reviewedCount = items.filter((i) => i.bdm_status !== "PENDING").length;

  const suggestedScore =
    summary.total_items > 0
      ? Math.round((summary.completed_items / summary.total_items) * 10)
      : 0;

  const scoreStyle = scoreColor(isCompleted ? inspection?.score : null);

  return (
    <Box className="inspection-detail">
      <Paper
        variant="outlined"
        sx={{ p: 2.5, mb: 3, borderRadius: "10px", borderColor: "#eef0f2" }}
      >
        <div className="detail-header-row">
          <div className="detail-header-row__left">
            <Tooltip title="Back">
              <button
                type="button"
                className="back-btn"
                onClick={() => navigate(-1)}
              >
                <ArrowLeft size={17} />
              </button>
            </Tooltip>
            <Box>
              <Typography className="page-title">
                {inspection?.name || "Inspection"}
              </Typography>
              <Typography className="page-sub-title">
                {inspection?.inspection_date
                  ? dayjs(inspection.inspection_date).format("MM/DD/YYYY")
                  : ""}
                {inspection?.employee?.name && ` · ${inspection.employee.name}`}
              </Typography>
            </Box>
          </div>

          <div className="detail-header-row__right">
            <span
              className="status-pill"
              style={{ color: statusCfg.color, background: statusCfg.bg }}
            >
              <span className="status-pill__dot" />
              {statusCfg.label}
            </span>

            <span
              className="score-pill"
              style={{
                color: scoreStyle.color,
                background: scoreStyle.bg,
                borderColor: scoreStyle.border,
              }}
            >
              <Award size={14} />
              {isCompleted
                ? `${inspection.score}/10`
                : `Suggested: ${suggestedScore}/10`}
            </span>

            {canComplete && (
              <button
                type="button"
                className="complete-btn"
                onClick={() => setCompleteModalVisible(true)}
              >
                <CheckCheck size={15} />
                Complete Inspection
              </button>
            )}

            {isCompleted && (
              <button
                type="button"
                className="send-client-btn"
                disabled={sendingToClient}
                onClick={handleSendToClient}
              >
                <Send size={15} />
                {inspection?.client_email_sent
                  ? "Resend to Client"
                  : "Send to Client"}
              </button>
            )}
          </div>
        </div>

        <Divider sx={{ my: 2 }} />

        <Stack
          direction="row"
          spacing={4}
          alignItems="center"
          flexWrap="wrap"
          useFlexGap
        >
          <Box sx={{ minWidth: 260, flex: 1 }}>
            <Typography sx={{ fontSize: 12.5, color: "#9ca3af", mb: 0.5 }}>
              Completion — {summary.completed_items}/{summary.total_items} items
            </Typography>
            <Progress
              percent={summary.completion_percentage}
              size="small"
              strokeColor="#6366F1"
            />
          </Box>

          {!isCompleted && (
            <Box sx={{ minWidth: 220 }}>
              <Typography sx={{ fontSize: 12.5, color: "#9ca3af", mb: 0.5 }}>
                Review progress
              </Typography>
              <Typography
                sx={{ fontSize: 13.5, fontWeight: 600, color: "#1a1a1a" }}
              >
                {reviewedCount}/{summary.total_items} items reviewed
              </Typography>
              <Typography sx={{ fontSize: 11.5, color: "#9ca3af", mt: 0.5 }}>
                Reviewing items is optional — you can complete anytime once
                under review.
              </Typography>
            </Box>
          )}

          {inspection?.overall_remark && (
            <Box sx={{ flex: 1, minWidth: 260 }}>
              <Typography sx={{ fontSize: 12.5, color: "#9ca3af", mb: 0.5 }}>
                Overall Remark
              </Typography>
              <Typography sx={{ fontSize: 13.5, color: "#374151" }}>
                {inspection.overall_remark}
              </Typography>
            </Box>
          )}

          {isCompleted && (
            <Box sx={{ minWidth: 200 }}>
              <Typography sx={{ fontSize: 12.5, color: "#9ca3af", mb: 0.5 }}>
                Client report
              </Typography>
              <Typography
                sx={{
                  fontSize: 13.5,
                  fontWeight: 600,
                  color: inspection?.client_email_sent ? "#059669" : "#9ca3af",
                }}
              >
                {inspection?.client_email_sent
                  ? `Sent ${dayjs(inspection.client_email_sent_at).format(DATE_FORMAT)}`
                  : "Not sent yet"}
              </Typography>
            </Box>
          )}
        </Stack>
      </Paper>

      {sections.map((section) => {
        const sectionCompleted = section.items.filter(
          (i) => i.employee_completed,
        ).length;
        return (
          <Paper
            key={section.section_name}
            variant="outlined"
            sx={{ p: 2.5, mb: 2, borderRadius: "10px", borderColor: "#eef0f2" }}
          >
            <div className="section-card__header">
              <div className="section-card__title-row">
                <Typography
                  sx={{
                    fontSize: 14,
                    fontWeight: 700,
                    letterSpacing: "0.02em",
                    color: "#2c3345",
                  }}
                >
                  {section.section_name}
                </Typography>
                <span className="section-card__count">
                  {sectionCompleted}/{section.items.length} done
                </span>
              </div>
            </div>

            <Stack spacing={1.25} sx={{ mt: 1.5 }}>
              {section.items.map((item) => {
                const itemStatusCfg =
                  BDM_ITEM_STATUS_CONFIG[item.bdm_status] ||
                  BDM_ITEM_STATUS_CONFIG.PENDING;
                const rowClass =
                  item.bdm_status === "ISSUE"
                    ? "item-row item-row--issue"
                    : item.bdm_status === "APPROVED"
                      ? "item-row item-row--approved"
                      : "item-row";

                const employeeImages = (item.images || []).filter(
                  (img) => img.uploaded_by_role === "EMPLOYEE",
                );
                const bdmImages = (item.images || []).filter(
                  (img) => img.uploaded_by_role === "BDM",
                );

                const empKey = `emp-${item.id}`;
                const bdmKey = `bdm-${item.id}`;
                const reviewDisabled = !item.employee_completed;

                return (
                  <div key={item.id} className={rowClass}>
                    <div className="item-row__top">
                      <div className="item-row__left">
                        {item.employee_completed ? (
                          <CheckCircle2
                            size={18}
                            color="#22c55e"
                            style={{ marginTop: 2, flexShrink: 0 }}
                          />
                        ) : (
                          <Circle
                            size={18}
                            color="#d1d5db"
                            style={{ marginTop: 2, flexShrink: 0 }}
                          />
                        )}
                        <Box>
                          <Typography className="item-row__name">
                            {item.item_name}
                          </Typography>
                          <div className="item-row__freqs">
                            <FreqBadge
                              label="D"
                              variant="daily"
                              active={item.is_daily}
                            />
                            <FreqBadge
                              label="W"
                              variant="weekly"
                              active={item.is_weekly}
                            />
                            <FreqBadge
                              label="M"
                              variant="monthly"
                              active={item.is_monthly}
                            />
                          </div>
                        </Box>
                      </div>

                      <div className="item-row__right">
                        <span
                          className="status-pill"
                          style={{
                            color: itemStatusCfg.color,
                            background: itemStatusCfg.bg,
                          }}
                        >
                          {itemStatusCfg.label}
                        </span>
                        {!isCompleted && (
                          <Tooltip
                            title={
                              reviewDisabled
                                ? "You can give a review once the employee marks this item complete"
                                : "Review this item"
                            }
                          >
                            <span>
                              <button
                                type="button"
                                className="review-btn"
                                disabled={reviewDisabled}
                                onClick={() => openReviewModal(item)}
                              >
                                <Pencil size={14} />
                              </button>
                            </span>
                          </Tooltip>
                        )}
                      </div>
                    </div>

                    <div className="item-row__timeline">
                      {item.employee_note && (
                        <div className="timeline-entry">
                          <div className="timeline-entry__icon timeline-entry__icon--employee">
                            <UserRound size={12} />
                          </div>
                          <div className="timeline-entry__body">
                            <div className="timeline-entry__meta">
                              <span className="timeline-entry__who">
                                Employee note
                              </span>
                              <span className="timeline-entry__time">
                                <Clock size={10} />
                                {dayjs(item.updated_at).format(DATE_FORMAT)}
                              </span>
                            </div>
                            <Typography sx={{ fontSize: 12.5, color: "#4b5563" }}>
                              {item.employee_note}
                            </Typography>
                          </div>
                        </div>
                      )}

                      {employeeImages.length > 0 && (
                        <div className="timeline-entry">
                          <div className="timeline-entry__icon timeline-entry__icon--employee">
                            <Camera size={12} />
                          </div>
                          <div className="timeline-entry__body">
                            <button
                              type="button"
                              className="timeline-entry__attachment-toggle"
                              onClick={() => toggleImageGroup(empKey)}
                            >
                              <span className="timeline-entry__who">
                                {employeeImages.length} attachment
                                {employeeImages.length > 1 ? "s" : ""}
                              </span>
                              <span className="timeline-entry__time">
                                <Clock size={10} />
                                {dayjs(
                                  employeeImages[employeeImages.length - 1]
                                    .created_at,
                                ).format(DATE_FORMAT)}
                              </span>
                            </button>

                            {expandedImageGroups.has(empKey) && (
                              <Image.PreviewGroup>
                                <div className="timeline-entry__images">
                                  {employeeImages.map((img) => (
                                    <div
                                      key={img.id}
                                      className="timeline-entry__image-wrap"
                                    >
                                      <Image
                                        src={`${BASE_URL_IMAGE}${img.image}`}
                                        width={56}
                                        height={56}
                                        style={{
                                          objectFit: "cover",
                                          borderRadius: 8,
                                        }}
                                         crossOrigin="anonymous"
                                      />
                                      <span className="timeline-entry__image-time">
                                        {dayjs(img.created_at).format(
                                          DATE_FORMAT,
                                        )}
                                      </span>
                                    </div>
                                  ))}
                                </div>
                              </Image.PreviewGroup>
                            )}
                          </div>
                        </div>
                      )}

                      {item.bdm_remark && (
                        <div className="timeline-entry">
                          <div className="timeline-entry__icon timeline-entry__icon--bdm">
                            <ShieldCheck size={12} />
                          </div>
                          <div className="timeline-entry__body">
                            <div className="timeline-entry__meta">
                              <span className="timeline-entry__who">
                                BDM review
                              </span>
                              <span className="timeline-entry__time">
                                <Clock size={10} />
                                {item.bdm_reviewed_at
                                  ? dayjs(item.bdm_reviewed_at).format(
                                      DATE_FORMAT,
                                    )
                                  : ""}
                              </span>
                            </div>
                            <Typography
                              sx={{
                                fontSize: 12.5,
                                color: "#EF4444",
                                fontWeight: 500,
                              }}
                            >
                              {item.bdm_remark}
                            </Typography>
                          </div>
                        </div>
                      )}

                      {bdmImages.length > 0 && (
                        <div className="timeline-entry">
                          <div className="timeline-entry__icon timeline-entry__icon--bdm">
                            <Camera size={12} />
                          </div>
                          <div className="timeline-entry__body">
                            <button
                              type="button"
                              className="timeline-entry__attachment-toggle"
                              onClick={() => toggleImageGroup(bdmKey)}
                            >
                              <span className="timeline-entry__who">
                                {bdmImages.length} attachment
                                {bdmImages.length > 1 ? "s" : ""}
                              </span>
                              <span className="timeline-entry__time">
                                <Clock size={10} />
                                {dayjs(
                                  bdmImages[bdmImages.length - 1].created_at,
                                ).format(DATE_FORMAT)}
                              </span>
                            </button>

                            {expandedImageGroups.has(bdmKey) && (
                              <Image.PreviewGroup>
                                <div className="timeline-entry__images">
                                  {bdmImages.map((img) => (
                                    <div
                                      key={img.id}
                                      className="timeline-entry__image-wrap"
                                    >
                                      <Image
                                        src={`${BASE_URL_IMAGE}${img.image}`}
                                        width={56}
                                        height={56}
                                        style={{
                                          objectFit: "cover",
                                          borderRadius: 8,
                                        }}
                                        crossOrigin="anonymous"
                                      />
                                      <span className="timeline-entry__image-time">
                                        {dayjs(img.created_at).format(
                                          DATE_FORMAT,
                                        )}
                                      </span>
                                    </div>
                                  ))}
                                </div>
                              </Image.PreviewGroup>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </Stack>
          </Paper>
        );
      })}

      {sections.length === 0 && !loading && (
        <Box sx={{ py: 6, textAlign: "center", color: "#9ca3af" }}>
          <ImageOff size={28} style={{ marginBottom: 8 }} />
          <div>No scope items on this inspection.</div>
        </Box>
      )}

      <Modal
        title={
          <Stack direction="row" alignItems="center" spacing={1.25}>
            <Box
              sx={{
                width: 34,
                height: 34,
                borderRadius: "8px",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                background: "#eef2ff",
                color: "#6366F1",
                flexShrink: 0,
              }}
            >
              <Pencil size={16} />
            </Box>
            <span style={{ fontWeight: 600 }}>Review Item</span>
          </Stack>
        }
        open={reviewModalVisible}
        onCancel={() => setReviewModalVisible(false)}
        onOk={handleSubmitReview}
        confirmLoading={reviewSubmitting}
        okText="Save Review"
        width={480}
      >
        <Typography sx={{ fontSize: 13.5, color: "#374151", mt: 2, mb: 2 }}>
          {reviewingItem?.item_name}
        </Typography>

        <Typography
          component="label"
          sx={{
            display: "block",
            fontSize: 13,
            fontWeight: 600,
            color: "#374151",
            mb: 1,
          }}
        >
          Status
        </Typography>
        <Radio.Group
          value={reviewStatus}
          onChange={(e) => setReviewStatus(e.target.value)}
          style={{ marginBottom: 18 }}
        >
          <Radio.Button value="APPROVED">Approve</Radio.Button>
          <Radio.Button value="ISSUE">Flag Issue</Radio.Button>
        </Radio.Group>

        <Typography
          component="label"
          sx={{
            display: "block",
            fontSize: 13,
            fontWeight: 600,
            color: "#374151",
            mb: 1,
          }}
        >
          Remark
        </Typography>
        <TextArea
          rows={3}
          value={reviewRemark}
          onChange={(e) => setReviewRemark(e.target.value)}
          placeholder={
            reviewStatus === "ISSUE"
              ? "Describe what wasn't done properly..."
              : "Optional note for this item..."
          }
        />

        <Typography
          component="label"
          sx={{
            display: "block",
            fontSize: 13,
            fontWeight: 600,
            color: "#374151",
            mt: 2,
            mb: 1,
          }}
        >
          Photos (optional)
        </Typography>
        <input
          type="file"
          accept="image/*"
          multiple
          onChange={(e) => setReviewFiles(Array.from(e.target.files || []))}
        />
        {reviewFiles.length > 0 && (
          <Typography sx={{ fontSize: 12, color: "#9ca3af", mt: 0.5 }}>
            {reviewFiles.length} file(s) selected
          </Typography>
        )}
      </Modal>

      <Modal
        title={
          <Stack direction="row" alignItems="center" spacing={1.25}>
            <Box
              sx={{
                width: 34,
                height: 34,
                borderRadius: "8px",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                background: "#f0fdf4",
                color: "#16A34A",
                flexShrink: 0,
              }}
            >
              <Award size={17} />
            </Box>
            <span style={{ fontWeight: 600 }}>Complete Inspection</span>
          </Stack>
        }
        open={completeModalVisible}
        onCancel={() => setCompleteModalVisible(false)}
        onOk={handleCompleteInspection}
        confirmLoading={completeSubmitting}
        okText="Mark Completed"
        width={460}
      >
        <div className="suggested-score-card">
          <span className="suggested-score-card__label">
            Score (auto-calculated)
          </span>
          <span className="suggested-score-card__value">
            {suggestedScore}/10
          </span>
          <span className="suggested-score-card__hint">
            Based on {summary.completed_items} of {summary.total_items} items
            completed by the employee
          </span>
        </div>

        {reviewedCount < summary.total_items && (
          <Typography
            sx={{
              fontSize: 12,
              color: "#b45309",
              background: "#fffbeb",
              border: "1px solid #fde68a",
              borderRadius: "8px",
              padding: "8px 12px",
              mt: 2,
            }}
          >
            {summary.total_items - reviewedCount} item(s) haven't been
            reviewed yet — that's fine, review is optional and won't block
            completion.
          </Typography>
        )}

        <Typography
          component="label"
          sx={{
            display: "block",
            fontSize: 13,
            fontWeight: 600,
            color: "#374151",
            mt: 2.25,
            mb: 1,
          }}
        >
          Overall Remark
        </Typography>
        <TextArea
          rows={4}
          value={completionRemark}
          onChange={(e) => setCompletionRemark(e.target.value)}
          placeholder="Summary for the client / employee..."
        />
      </Modal>
    </Box>
  );
};

export default InspectionDetail;