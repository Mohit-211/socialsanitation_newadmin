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
  Upload,
  InputNumber,
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
} from "lucide-react";
import dayjs from "@/lib/dayjs";
import { GetInspectionById } from "../../services/Api/InspectionApi";
import { BASE_URL_IMAGE } from "../../services/Host";
import "./InspectionDetail.scss";

const { TextArea } = AntInput;

const STATUS_CONFIG = {
  ASSIGNED: { color: "#2563EB", bg: "#EFF6FF", label: "Assigned" },
  IN_PROGRESS: { color: "#D97706", bg: "#FFFBEB", label: "In Progress" },
  EMPLOYEE_SUBMITTED: { color: "#7C3AED", bg: "#F5F3FF", label: "Submitted" },
  BDM_REVIEWING: { color: "#0891B2", bg: "#ECFEFF", label: "Under Review" },
  COMPLETED: { color: "#16A34A", bg: "#F0FDF4", label: "Completed" },
};

const BDM_ITEM_STATUS_CONFIG = {
  PENDING: { color: "#9ca3af", bg: "#f3f4f6", label: "Pending Review" },
  APPROVED: { color: "#16A34A", bg: "#F0FDF4", label: "Approved" },
  ISSUE: { color: "#EF4444", bg: "#FEF2F2", label: "Issue Flagged" },
};

// Small D / W / M frequency pill — filled + colored when true for this
// item, quiet outline otherwise. Mirrors the Scope of Work page's pills.
const FreqBadge = ({ label, active, variant }) => (
  <span
    className={`freq-badge freq-badge--${variant}${active ? " freq-badge--active" : ""}`}
  >
    {label}
  </span>
);

const InspectionDetail = () => {
  const navigate = useNavigate();
  const { id } = useParams();

  const [loading, setLoading] = useState(false);
  const [inspection, setInspection] = useState(null);

  // --- Per-item review modal (Approve / Flag Issue, remark, images) ---
  // UI + local state only for now — wiring to
  // POST /inspection/reviewInspectionItem/:itemId and
  // POST /inspection/reviewItem/:itemId/image comes later.
  const [reviewModalVisible, setReviewModalVisible] = useState(false);
  const [reviewingItem, setReviewingItem] = useState(null);
  const [reviewStatus, setReviewStatus] = useState("APPROVED");
  const [reviewRemark, setReviewRemark] = useState("");
  const [reviewFileList, setReviewFileList] = useState([]);
  const [reviewSubmitting, setReviewSubmitting] = useState(false);

  // --- Complete Inspection modal (score + overall remark) ---
  // UI + local state only for now — wiring to
  // POST /inspection/completeInspection/:inspectionId comes later.
  const [completeModalVisible, setCompleteModalVisible] = useState(false);
  const [completionScore, setCompletionScore] = useState(null);
  const [completionRemark, setCompletionRemark] = useState("");
  const [completeSubmitting, setCompleteSubmitting] = useState(false);

  const fetchInspection = async () => {
    try {
      setLoading(true);
      const res = await GetInspectionById(id);
      const raw = res?.data?.data?.data ?? res?.data?.data;
      const record = Array.isArray(raw) ? raw[0] : raw;
      setInspection(record || null);
    } catch (error) {
      console.error("Error fetching inspection:", error);
      message.error("Failed to fetch inspection");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInspection();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const openReviewModal = (item) => {
    setReviewingItem(item);
    setReviewStatus(item.bdm_status === "ISSUE" ? "ISSUE" : "APPROVED");
    setReviewRemark(item.bdm_remark || "");
    setReviewFileList([]);
    setReviewModalVisible(true);
  };

  const handleSubmitReview = async () => {
    try {
      setReviewSubmitting(true);
      // TODO: wire up once ready —
      // await ReviewInspectionItem(reviewingItem.id, { bdm_status: reviewStatus, bdm_remark: reviewRemark });
      // if (reviewFileList.length) await UploadInspectionItemImages(reviewingItem.id, reviewFileList);
      console.log("Review payload (not yet sent to API):", {
        itemId: reviewingItem?.id,
        bdm_status: reviewStatus,
        bdm_remark: reviewRemark,
        images: reviewFileList.map((f) => f.name),
      });
      message.success("Review captured — API wiring pending");
      setReviewModalVisible(false);
    } finally {
      setReviewSubmitting(false);
    }
  };

  const handleCompleteInspection = async () => {
    if (completionScore === null || completionScore === undefined) {
      message.error("Please give a score out of 10");
      return;
    }
    try {
      setCompleteSubmitting(true);
      // TODO: wire up once ready —
      // await CompleteInspection(id, { score: completionScore, overall_remark: completionRemark });
      console.log("Complete inspection payload (not yet sent to API):", {
        inspectionId: id,
        score: completionScore,
        overall_remark: completionRemark,
      });
      message.success("Completion captured — API wiring pending");
      setCompleteModalVisible(false);
    } finally {
      setCompleteSubmitting(false);
    }
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
    color: "default",
    label: inspection?.status,
  };

  const isCompleted = inspection?.status === "COMPLETED";

  return (
    <Box className="inspection-detail">
      <Paper
        variant="outlined"
        sx={{ p: 2.5, mb: 3, borderRadius: "10px", borderColor: "#eef0f2" }}
      >
        <div className="detail-header-row">
          <div className="detail-header-row__left">
            <Tooltip title="Back">
              <button type="button" className="back-btn" onClick={() => navigate(-1)}>
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
              style={
                inspection?.score != null
                  ? { color: "#059669", background: "#ecfdf5", borderColor: "#a7f3d0" }
                  : { color: "#9ca3af", background: "#f8f9fa", borderColor: "#eef0f2" }
              }
            >
              <Award size={14} />
              {inspection?.score != null ? `${inspection.score}/10` : "Not rated"}
            </span>

            {!isCompleted && (
              <button
                type="button"
                className="complete-btn"
                onClick={() => setCompleteModalVisible(true)}
              >
                <CheckCheck size={15} />
                Complete Inspection
              </button>
            )}
          </div>
        </div>

        <Divider sx={{ my: 2 }} />

        <Stack direction="row" spacing={4} alignItems="center" flexWrap="wrap" useFlexGap>
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
        </Stack>
      </Paper>

      {sections.map((section) => {
        const sectionCompleted = section.items.filter((i) => i.employee_completed).length;
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
                            <FreqBadge label="D" variant="daily" active={item.is_daily} />
                            <FreqBadge label="W" variant="weekly" active={item.is_weekly} />
                            <FreqBadge label="M" variant="monthly" active={item.is_monthly} />
                          </div>
                        </Box>
                      </div>

                      <div className="item-row__right">
                        <span
                          className="status-pill"
                          style={{ color: itemStatusCfg.color, background: itemStatusCfg.bg }}
                        >
                          {itemStatusCfg.label}
                        </span>
                        <Tooltip title="Add remark / image">
                          <button
                            type="button"
                            className="review-btn"
                            onClick={() => openReviewModal(item)}
                          >
                            <Pencil size={14} />
                          </button>
                        </Tooltip>
                      </div>
                    </div>

                    {item.employee_note && (
                      <div className="item-row__note-block">
                        <StickyNote size={14} color="#9ca3af" style={{ marginTop: 2 }} />
                        <Typography sx={{ fontSize: 12.5, color: "#6b7280" }}>
                          {item.employee_note}
                        </Typography>
                      </div>
                    )}

                    {item.bdm_remark && (
                      <div className="item-row__note-block">
                        <StickyNote size={14} color="#EF4444" style={{ marginTop: 2 }} />
                        <Typography sx={{ fontSize: 12.5, color: "#EF4444", fontWeight: 500 }}>
                          {item.bdm_remark}
                        </Typography>
                      </div>
                    )}

                    {item.images && item.images.length > 0 && (
                      <div className="item-row__images">
                        {item.images.map((img, idx) => (
                          <img
                            key={idx}
                            className="item-row__image-thumb"
                            src={`${BASE_URL_IMAGE}${img.file_uri}/${img.file_name}`}
                            alt=""
                          />
                        ))}
                      </div>
                    )}
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

      {/* Per-item review modal */}
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
          sx={{ display: "block", fontSize: 13, fontWeight: 600, color: "#374151", mb: 1 }}
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
          sx={{ display: "block", fontSize: 13, fontWeight: 600, color: "#374151", mb: 1 }}
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
          sx={{ display: "block", fontSize: 13, fontWeight: 600, color: "#374151", mt: 2, mb: 1 }}
        >
          Photos
        </Typography>
        <Upload
          listType="picture-card"
          fileList={reviewFileList}
          beforeUpload={() => false}
          onChange={({ fileList }) => setReviewFileList(fileList)}
        >
          {reviewFileList.length >= 6 ? null : (
            <div>
              <Camera size={16} />
              <div style={{ marginTop: 4, fontSize: 12 }}>Add</div>
            </div>
          )}
        </Upload>
      </Modal>

      {/* Complete Inspection modal */}
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
        <Typography
          component="label"
          sx={{ display: "block", fontSize: 13, fontWeight: 600, color: "#374151", mt: 2, mb: 1 }}
        >
          Score (out of 10)
        </Typography>
        <InputNumber
          min={0}
          max={10}
          value={completionScore}
          onChange={(value) => setCompletionScore(value)}
          style={{ width: "100%", height: 45 }}
          placeholder="e.g. 8"
        />

        <Typography
          component="label"
          sx={{ display: "block", fontSize: 13, fontWeight: 600, color: "#374151", mt: 2.25, mb: 1 }}
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