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
  ImageOff,
  Pencil,
  Camera,
  Award,
  CheckCheck,
  Send,
  Clock,
  UserRound,
  ShieldCheck,
  ClipboardCheck,
  AlertTriangle,
  ChevronDown,
  ChevronsDownUp,
  RotateCcw,
} from "lucide-react";
import dayjs from "@/lib/dayjs";
import {
  GetInspectionById,
  ReviewInspectionItem,
  ReviewInspectionSection,
  UploadBDMInspectionItemImage,
  CompleteInspection,
  SendInspectionToClient,
  ReopenInspection,
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
  REOPENED: { color: "#EA580C", bg: "#FFF7ED", label: "Reopened" },
  COMPLETED: { color: "#16A34A", bg: "#F0FDF4", label: "Completed" },
  CANCELLED: { color: "#EF4444", bg: "#FEF2F2", label: "Cancelled" },
};

// Shared by item reviews and section reviews — same three states.
const REVIEW_STATUS_CONFIG = {
  PENDING: { color: "#9ca3af", bg: "#f3f4f6", label: "Pending Review" },
  APPROVED: { color: "#16A34A", bg: "#F0FDF4", label: "Approved" },
  ISSUE: { color: "#EF4444", bg: "#FEF2F2", label: "Issue Flagged" },
};

// Backend accepts item/section reviews in these states.
const REVIEWABLE_STATUSES = ["SUBMITTED", "UNDER_REVIEW", "REOPENED"];

// Backend accepts completion in these states (all sections must be reviewed).
const COMPLETABLE_STATUSES = ["SUBMITTED", "UNDER_REVIEW", "REOPENED"];

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

  // Item review modal
  const [reviewModalVisible, setReviewModalVisible] = useState(false);
  const [reviewingItem, setReviewingItem] = useState(null);
  const [reviewStatus, setReviewStatus] = useState("APPROVED");
  const [reviewRemark, setReviewRemark] = useState("");
  const [reviewFiles, setReviewFiles] = useState([]);
  const [reviewSubmitting, setReviewSubmitting] = useState(false);

  // Section review modal
  const [sectionModalVisible, setSectionModalVisible] = useState(false);
  const [reviewingSection, setReviewingSection] = useState(null);
  const [sectionStatus, setSectionStatus] = useState("APPROVED");
  const [sectionRemark, setSectionRemark] = useState("");
  const [sectionSubmitting, setSectionSubmitting] = useState(false);

  // Complete modal
  const [completeModalVisible, setCompleteModalVisible] = useState(false);
  const [completionRemark, setCompletionRemark] = useState("");
  const [completeSubmitting, setCompleteSubmitting] = useState(false);

  // Reopen modal
  const [reopenModalVisible, setReopenModalVisible] = useState(false);
  const [reopenRemark, setReopenRemark] = useState("");
  const [reopenSubmitting, setReopenSubmitting] = useState(false);

  const [sendingToClient, setSendingToClient] = useState(false);

  // Which "N attachments" groups are expanded to show thumbnails.
  const [expandedImageGroups, setExpandedImageGroups] = useState(new Set());

  // Which sections are open. Empty = all collapsed (default).
  const [expandedSections, setExpandedSections] = useState(new Set());

  const toggleImageGroup = (key) => {
    setExpandedImageGroups((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  };

  const toggleSection = (key) => {
    setExpandedSections((prev) => {
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

  const canReview = REVIEWABLE_STATUSES.includes(inspection?.status);

  /* ==========================================
   * ITEM REVIEW
   * ========================================== */

  const openReviewModal = (item) => {
    if (!canReview || !item.employee_completed) return;
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

  /* ==========================================
   * SECTION REVIEW
   * ========================================== */

  const openSectionModal = (section) => {
    if (!canReview || !section.review) return;
    setReviewingSection(section);
    setSectionStatus(section.review.status === "ISSUE" ? "ISSUE" : "APPROVED");
    setSectionRemark(section.review.remark || "");
    setSectionModalVisible(true);
  };

  const handleSubmitSectionReview = async () => {
    if (sectionStatus === "ISSUE" && !sectionRemark.trim()) {
      message.error("A remark is required when flagging a section issue.");
      return;
    }

    try {
      setSectionSubmitting(true);
      await ReviewInspectionSection(reviewingSection.review.id, {
        status: sectionStatus,
        remark: sectionRemark,
      });

      message.success("Section review saved");
      setSectionModalVisible(false);
      await fetchInspection({ silent: true });
    } catch (error) {
      console.error("Error submitting section review:", error);
      message.error(
        error?.response?.data?.message || "Failed to save section review",
      );
    } finally {
      setSectionSubmitting(false);
    }
  };

  /* ==========================================
   * COMPLETE / REOPEN / SEND
   * ========================================== */

  // Pre-fill with the existing overall remark so a re-completion
  // after a reopen doesn't silently wipe it.
  const openCompleteModal = () => {
    setCompletionRemark(inspection?.overall_remark || "");
    setCompleteModalVisible(true);
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

  const openReopenModal = () => {
    setReopenRemark("");
    setReopenModalVisible(true);
  };

  const handleReopenInspection = async () => {
    if (!reopenRemark.trim()) {
      message.error("Please add a reason for reopening.");
      return;
    }

    try {
      setReopenSubmitting(true);
      await ReopenInspection(id, { remark: reopenRemark });
      message.success("Inspection reopened");
      setReopenModalVisible(false);
      await fetchInspection();
    } catch (error) {
      console.error("Error reopening inspection:", error);
      message.error(
        error?.response?.data?.message || "Failed to reopen inspection",
      );
    } finally {
      setReopenSubmitting(false);
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

  /* ==========================================
   * DERIVED DATA
   * ========================================== */

  const items = inspection?.items || [];
  const sectionReviews = inspection?.section_reviews || [];
  const summary = inspection?.summary || {
    total_items: items.length,
    completed_items: 0,
    completion_percentage: 0,
  };

  const reviewBySectionId = sectionReviews.reduce((acc, review) => {
    acc[review.scope_section_id] = review;
    return acc;
  }, {});

  const sections = Object.values(
    items.reduce((acc, item) => {
      const key = String(item.scope_section_id ?? item.section_name);
      if (!acc[key]) {
        acc[key] = {
          key,
          scope_section_id: item.scope_section_id,
          section_name: item.section_name,
          section_order: item.section_order,
          review: reviewBySectionId[item.scope_section_id] || null,
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
      items: [...section.items].sort((a, b) => a.item_order - b.item_order),
    }));

  const allExpanded =
    sections.length > 0 && sections.every((s) => expandedSections.has(s.key));

  const toggleAllSections = () => {
    setExpandedSections(
      allExpanded ? new Set() : new Set(sections.map((s) => s.key)),
    );
  };

  const statusCfg = STATUS_CONFIG[inspection?.status] || {
    color: "#6B7280",
    bg: "#F3F4F6",
    label: inspection?.status,
  };

  const isCompleted = inspection?.status === "COMPLETED";
  const isReopened = inspection?.status === "REOPENED";
  const canComplete = COMPLETABLE_STATUSES.includes(inspection?.status);

  // Show the reopen banner for the whole reopen cycle (REOPENED →
  // SUBMITTED → UNDER_REVIEW) until it's completed again.
  const showReopenBanner = !!inspection?.reopened_at && !isCompleted;
  const employeeResubmitted =
    !!inspection?.employee_submitted_at &&
    !!inspection?.reopened_at &&
    dayjs(inspection.employee_submitted_at).isAfter(
      dayjs(inspection.reopened_at),
    );

  const reviewedItemCount = items.filter(
    (i) => i.bdm_status !== "PENDING",
  ).length;

  const totalSections = sectionReviews.length;
  const reviewedSectionCount = sectionReviews.filter(
    (s) => s.status !== "PENDING",
  ).length;
  const pendingSectionCount = totalSections - reviewedSectionCount;
  const allSectionsReviewed = totalSections > 0 && pendingSectionCount === 0;

  const suggestedScore =
    summary.total_items > 0
      ? Math.round((summary.completed_items / summary.total_items) * 10)
      : 0;

  const scoreStyle = scoreColor(isCompleted ? inspection?.score : null);

  const reviewLockedHint =
    inspection?.status === "ASSIGNED" || inspection?.status === "IN_PROGRESS"
      ? "Available once the employee submits the inspection"
      : "";

  const reviewingSectionCompleted = reviewingSection
    ? reviewingSection.items.filter((i) => i.employee_completed).length
    : 0;

  /* ==========================================
   * RENDER HELPERS
   * ========================================== */

  const renderImageGroup = (images, groupKey) => (
    <div className="timeline-entry__body">
      <button
        type="button"
        className="timeline-entry__attachment-toggle"
        onClick={() => toggleImageGroup(groupKey)}
      >
        <span className="timeline-entry__who">
          {images.length} attachment{images.length > 1 ? "s" : ""}
        </span>
        <span className="timeline-entry__time">
          <Clock size={10} />
          {dayjs(images[images.length - 1].created_at).format(DATE_FORMAT)}
        </span>
      </button>

      {expandedImageGroups.has(groupKey) && (
        <Image.PreviewGroup>
          <div className="timeline-entry__images">
            {images.map((img) => (
              <div key={img.id} className="timeline-entry__image-wrap">
                <Image
                  src={`${BASE_URL_IMAGE}${img.image}`}
                  width={56}
                  height={56}
                  style={{ objectFit: "cover", borderRadius: 8 }}
                  crossOrigin="anonymous"
                />
                <span className="timeline-entry__image-time">
                  {dayjs(img.created_at).format(DATE_FORMAT)}
                </span>
              </div>
            ))}
          </div>
        </Image.PreviewGroup>
      )}
    </div>
  );

  const modalLabelSx = {
    display: "block",
    fontSize: 13,
    fontWeight: 600,
    color: "#374151",
    mb: 1,
  };

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
              <Tooltip
                title={
                  allSectionsReviewed
                    ? ""
                    : `Review all sections first (${pendingSectionCount} pending)`
                }
              >
                <span>
                  <button
                    type="button"
                    className="complete-btn"
                    disabled={!allSectionsReviewed}
                    onClick={openCompleteModal}
                  >
                    <CheckCheck size={15} />
                    {inspection?.reopened_at
                      ? "Complete Again"
                      : "Complete Inspection"}
                  </button>
                </span>
              </Tooltip>
            )}

            {isCompleted && (
              <>
                <Tooltip title="Reopen so you and the employee can make changes">
                  <button
                    type="button"
                    className="reopen-btn"
                    onClick={openReopenModal}
                  >
                    <RotateCcw size={15} />
                    Reopen
                  </button>
                </Tooltip>

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
              </>
            )}
          </div>
        </div>

        {showReopenBanner && (
          <div className="reopen-banner">
            <RotateCcw size={15} className="reopen-banner__icon" />
            <div className="reopen-banner__body">
              <div className="reopen-banner__title">
                Reopened {dayjs(inspection.reopened_at).format(DATE_FORMAT)}
                {inspection.reopen_count > 1 &&
                  ` · reopen #${inspection.reopen_count}`}
              </div>
              {inspection.reopen_remark && (
                <div className="reopen-banner__remark">
                  {inspection.reopen_remark}
                </div>
              )}
              <div className="reopen-banner__hint">
                {employeeResubmitted
                  ? `Employee resubmitted ${dayjs(
                      inspection.employee_submitted_at,
                    ).format(DATE_FORMAT)}. `
                  : isReopened
                    ? "The employee can update items and resubmit. "
                    : ""}
                Previous reviews are kept — edit any that need changing, then
                complete again.
              </div>
            </div>
          </div>
        )}

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
                sx={{
                  fontSize: 13.5,
                  fontWeight: 600,
                  color: allSectionsReviewed ? "#059669" : "#1a1a1a",
                }}
              >
                {reviewedSectionCount}/{totalSections} sections reviewed
              </Typography>
              <Typography sx={{ fontSize: 11.5, color: "#9ca3af", mt: 0.5 }}>
                {reviewedItemCount}/{summary.total_items} items reviewed
                (optional). Every section must be reviewed before completing.
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

      {/* ================= SECTIONS TOOLBAR ================= */}
      {sections.length > 0 && (
        <div className="sections-toolbar">
          <span className="sections-toolbar__label">
            Sections ({sections.length})
          </span>
          <button
            type="button"
            className="sections-toolbar__btn"
            onClick={toggleAllSections}
          >
            <ChevronsDownUp size={14} />
            {allExpanded ? "Collapse all" : "Expand all"}
          </button>
        </div>
      )}

      {/* ================= SECTIONS ================= */}
      {sections.map((section) => {
        const sectionCompleted = section.items.filter(
          (i) => i.employee_completed,
        ).length;
        const itemIssueCount = section.items.filter(
          (i) => i.bdm_status === "ISSUE",
        ).length;
        const review = section.review;
        const sectionStatusCfg =
          REVIEW_STATUS_CONFIG[review?.status] || REVIEW_STATUS_CONFIG.PENDING;
        const isReviewed = review && review.status !== "PENDING";
        const isExpanded = expandedSections.has(section.key);

        return (
          <Paper
            key={section.key}
            variant="outlined"
            sx={{
              p: 2,
              mb: 1.5,
              borderRadius: "10px",
              borderColor:
                review?.status === "ISSUE"
                  ? "#fbdada"
                  : review?.status === "APPROVED"
                    ? "#d6f2e2"
                    : "#eef0f2",
            }}
          >
            <div className="section-card__header">
              <button
                type="button"
                className="section-card__toggle"
                onClick={() => toggleSection(section.key)}
                aria-expanded={isExpanded}
              >
                <ChevronDown
                  size={16}
                  className={`section-card__chevron${
                    isExpanded ? " section-card__chevron--open" : ""
                  }`}
                />
                <span className="section-card__title">
                  {section.section_name}
                </span>
                <span className="section-card__count">
                  {sectionCompleted}/{section.items.length} done
                </span>
                {itemIssueCount > 0 && (
                  <span className="section-card__issue-chip">
                    <AlertTriangle size={11} />
                    {itemIssueCount} item issue{itemIssueCount > 1 ? "s" : ""}
                  </span>
                )}
              </button>

              {review && (
                <div className="section-card__actions">
                  <span
                    className="status-pill status-pill--sm"
                    style={{
                      color: sectionStatusCfg.color,
                      background: sectionStatusCfg.bg,
                    }}
                  >
                    <span className="status-pill__dot" />
                    {isReviewed
                      ? `${sectionStatusCfg.label} · ${review.score}/${review.score_out_of}`
                      : sectionStatusCfg.label}
                  </span>

                  {!isCompleted && (
                    <Tooltip
                      title={
                        canReview
                          ? isReviewed
                            ? "Edit section review"
                            : "Review this section"
                          : reviewLockedHint
                      }
                    >
                      <span>
                        <button
                          type="button"
                          className="section-review-btn"
                          disabled={!canReview}
                          onClick={() => openSectionModal(section)}
                        >
                          <ClipboardCheck size={14} />
                          {isReviewed ? "Edit Review" : "Review Section"}
                        </button>
                      </span>
                    </Tooltip>
                  )}
                </div>
              )}
            </div>

            {isReviewed && (
              <div
                className={`section-review-note section-review-note--${review.status.toLowerCase()}`}
              >
                <div className="section-review-note__meta">
                  <span className="section-review-note__who">
                    {review.status === "ISSUE" ? (
                      <AlertTriangle size={12} />
                    ) : (
                      <ShieldCheck size={12} />
                    )}
                    Section review
                  </span>
                  <span className="section-review-note__score">
                    Scored {review.score}/{review.score_out_of}
                  </span>
                  {review.reviewed_at && (
                    <span className="timeline-entry__time">
                      <Clock size={10} />
                      {dayjs(review.reviewed_at).format(DATE_FORMAT)}
                    </span>
                  )}
                </div>
                <Typography
                  sx={{
                    fontSize: 12.5,
                    color: review.remark
                      ? review.status === "ISSUE"
                        ? "#b91c1c"
                        : "#374151"
                      : "#9ca3af",
                    fontStyle: review.remark ? "normal" : "italic",
                  }}
                >
                  {review.remark || "No remark"}
                </Typography>
              </div>
            )}

            {isExpanded && (
              <Stack spacing={1.25} sx={{ mt: 1.5 }}>
                {section.items.map((item) => {
                  const itemStatusCfg =
                    REVIEW_STATUS_CONFIG[item.bdm_status] ||
                    REVIEW_STATUS_CONFIG.PENDING;
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

                  const reviewDisabled = !canReview || !item.employee_completed;
                  const reviewTooltip = !canReview
                    ? reviewLockedHint
                    : !item.employee_completed
                      ? "You can give a review once the employee marks this item complete"
                      : "Review this item";

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
                            <Tooltip title={reviewTooltip}>
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
                              <Typography
                                sx={{ fontSize: 12.5, color: "#4b5563" }}
                              >
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
                            {renderImageGroup(employeeImages, `emp-${item.id}`)}
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
                                  color:
                                    item.bdm_status === "ISSUE"
                                      ? "#EF4444"
                                      : "#374151",
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
                            {renderImageGroup(bdmImages, `bdm-${item.id}`)}
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </Stack>
            )}
          </Paper>
        );
      })}

      {sections.length === 0 && !loading && (
        <Box sx={{ py: 6, textAlign: "center", color: "#9ca3af" }}>
          <ImageOff size={28} style={{ marginBottom: 8 }} />
          <div>No scope items on this inspection.</div>
        </Box>
      )}

      {/* ================= ITEM REVIEW MODAL ================= */}
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

        <Typography component="label" sx={modalLabelSx}>
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

        <Typography component="label" sx={modalLabelSx}>
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

        <Typography component="label" sx={{ ...modalLabelSx, mt: 2 }}>
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

      {/* ================= SECTION REVIEW MODAL ================= */}
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
                background: "#ecfeff",
                color: "#0891B2",
                flexShrink: 0,
              }}
            >
              <ClipboardCheck size={16} />
            </Box>
            <span style={{ fontWeight: 600 }}>Review Section</span>
          </Stack>
        }
        open={sectionModalVisible}
        onCancel={() => setSectionModalVisible(false)}
        onOk={handleSubmitSectionReview}
        confirmLoading={sectionSubmitting}
        okText="Save Section Review"
        width={480}
      >
        <div className="suggested-score-card" style={{ marginTop: 16 }}>
          <span className="suggested-score-card__label">
            {reviewingSection?.section_name}
          </span>
          <span className="suggested-score-card__value">
            {reviewingSectionCompleted}/{reviewingSection?.items.length || 0}
          </span>
          <span className="suggested-score-card__hint">
            Items completed by the employee — saved as the section score
          </span>
        </div>

        <Typography component="label" sx={{ ...modalLabelSx, mt: 2.25 }}>
          Status
        </Typography>
        <Radio.Group
          value={sectionStatus}
          onChange={(e) => setSectionStatus(e.target.value)}
          style={{ marginBottom: 18 }}
        >
          <Radio.Button value="APPROVED">Approve</Radio.Button>
          <Radio.Button value="ISSUE">Flag Issue</Radio.Button>
        </Radio.Group>

        <Typography component="label" sx={modalLabelSx}>
          Remark{sectionStatus === "ISSUE" ? " *" : ""}
        </Typography>
        <TextArea
          rows={3}
          value={sectionRemark}
          onChange={(e) => setSectionRemark(e.target.value)}
          placeholder={
            sectionStatus === "ISSUE"
              ? "Describe what's wrong with this area..."
              : "Optional note for this section..."
          }
        />
      </Modal>

      {/* ================= COMPLETE MODAL ================= */}
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
            <span style={{ fontWeight: 600 }}>
              {inspection?.reopened_at
                ? "Complete Inspection Again"
                : "Complete Inspection"}
            </span>
          </Stack>
        }
        open={completeModalVisible}
        onCancel={() => setCompleteModalVisible(false)}
        onOk={handleCompleteInspection}
        confirmLoading={completeSubmitting}
        okButtonProps={{ disabled: !allSectionsReviewed }}
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

        {!allSectionsReviewed && (
          <Typography
            sx={{
              fontSize: 12,
              color: "#b91c1c",
              background: "#fef2f2",
              border: "1px solid #fecaca",
              borderRadius: "8px",
              padding: "8px 12px",
              mt: 2,
            }}
          >
            {totalSections === 0
              ? "This inspection has no section reviews, so it can't be completed."
              : `${pendingSectionCount} section(s) still need a review before this inspection can be completed.`}
          </Typography>
        )}

        {allSectionsReviewed && reviewedItemCount < summary.total_items && (
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
            {summary.total_items - reviewedItemCount} item(s) haven't been
            individually reviewed — that's fine, item review is optional.
          </Typography>
        )}

        <Typography component="label" sx={{ ...modalLabelSx, mt: 2.25 }}>
          Overall Remark
        </Typography>
        <TextArea
          rows={4}
          value={completionRemark}
          onChange={(e) => setCompletionRemark(e.target.value)}
          placeholder="Summary for the client / employee..."
        />
      </Modal>

      {/* ================= REOPEN MODAL ================= */}
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
                background: "#fff7ed",
                color: "#EA580C",
                flexShrink: 0,
              }}
            >
              <RotateCcw size={16} />
            </Box>
            <span style={{ fontWeight: 600 }}>Reopen Inspection</span>
          </Stack>
        }
        open={reopenModalVisible}
        onCancel={() => setReopenModalVisible(false)}
        onOk={handleReopenInspection}
        confirmLoading={reopenSubmitting}
        okText="Reopen"
        okButtonProps={{ disabled: !reopenRemark.trim() }}
        width={480}
      >
        <Typography
          sx={{
            fontSize: 12.5,
            color: "#9a3412",
            background: "#fff7ed",
            border: "1px solid #fed7aa",
            borderRadius: "8px",
            padding: "10px 12px",
            mt: 2,
            lineHeight: 1.55,
          }}
        >
          The final score will be cleared and the inspection unlocked. The
          employee can update items and resubmit, and you can edit any review.
          Existing reviews are kept. Once you complete it again, you can send
          the client an updated report.
        </Typography>

        <Typography component="label" sx={{ ...modalLabelSx, mt: 2.25 }}>
          Reason *
        </Typography>
        <TextArea
          rows={3}
          value={reopenRemark}
          onChange={(e) => setReopenRemark(e.target.value)}
          placeholder="e.g. Client reported restrooms weren't restocked — please recheck and update."
        />
      </Modal>
    </Box>
  );
};

export default InspectionDetail;