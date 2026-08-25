/** @format */

import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axios from "axios";
import dayjs from "@/lib/dayjs";
import {
  Box,
  Paper,
  Typography,
  Button,
  CircularProgress,
  Stack,
  Divider,
} from "@mui/material";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import {
  User,
  GraduationCap,
  Briefcase,
  Users,
  ShieldCheck,
  FileCheck2,
  Award,
  FileSignature,
  ScrollText,
  Landmark,
  ClipboardList,
} from "lucide-react";

// ---------------------------------------------------------------------------
// Config: section metadata (icon + friendly title) — falls back gracefully
// for any section name not explicitly listed.
// ---------------------------------------------------------------------------
const SECTION_META = {
  personalInfo: { title: "Personal Information", icon: User },
  employmentEligibility: { title: "Employment Eligibility", icon: FileCheck2 },
  education: { title: "Education", icon: GraduationCap },
  previousEmployment: { title: "Previous Employment", icon: Briefcase },
  references: { title: "References", icon: Users },
  militaryService: { title: "Military Service", icon: Award },
  backgroundCheck: { title: "Background Check", icon: ShieldCheck },
  authorization: { title: "Authorization", icon: FileSignature },
  disclaimer: { title: "Disclaimer", icon: ScrollText },
  floridaAgreement: { title: "Florida Agreement", icon: ClipboardList },
  directDeposit: { title: "Direct Deposit", icon: Landmark },
};

// A field is only ever treated as a date if BOTH:
//  1) its key name suggests a date, AND
//  2) its value actually matches a real date pattern (ISO timestamp or MM-DD-YYYY)
// This prevents things like SSNs, routing numbers, or account numbers
// (which are plain numeric strings) from being misread as dates.
const DATE_KEY_PATTERN = /date/i;
const ISO_DATETIME_PATTERN = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/;
const MDY_PATTERN = /^\d{2}-\d{2}-\d{4}$/;

const looksLikeDateValue = (value) =>
  typeof value === "string" &&
  (ISO_DATETIME_PATTERN.test(value) || MDY_PATTERN.test(value));

const formatValue = (key, value) => {
  if (DATE_KEY_PATTERN.test(key) && looksLikeDateValue(value)) {
    const parsed = dayjs(value);
    if (parsed.isValid()) return parsed.format("MM-DD-YYYY");
  }
  return value;
};

const humanizeKey = (key) =>
  key
    .replace(/_/g, " ")
    .replace(/([a-z])([A-Z])/g, "$1 $2")
    .replace(/^./, (c) => c.toUpperCase())
    .trim();

const humanizeSectionName = (name) =>
  SECTION_META[name]?.title ||
  name
    .replace(/([A-Z])/g, " $1")
    .replace(/^./, (c) => c.toUpperCase())
    .trim();

const isImageValue = (value) =>
  typeof value === "string" && value.startsWith("data:image");

const isSignatureKey = (key) => /signature/i.test(key);

// ---------------------------------------------------------------------------
// Presentational bits
// ---------------------------------------------------------------------------

const FieldValue = ({ fieldKey, value }) => {
  if (value === null || value === undefined || value === "") {
    return (
      <Typography sx={{ fontSize: 14, color: "#a3a9b3", fontStyle: "italic" }}>
        —
      </Typography>
    );
  }

  if (isImageValue(value)) {
    return (
      <Box
        sx={{
          mt: 0.5,
          p: 1,
          border: "1px solid #eef0f2",
          borderRadius: "8px",
          backgroundColor: "#fafbfc",
          display: "inline-block",
        }}
      >
        <img
          src={value}
          alt={fieldKey}
          style={{
            maxHeight: 90,
            maxWidth: 220,
            display: "block",
          }}
        />
      </Box>
    );
  }

  if (Array.isArray(value)) {
    if (value.length === 0) {
      return (
        <Typography sx={{ fontSize: 14, color: "#a3a9b3", fontStyle: "italic" }}>
          —
        </Typography>
      );
    }
    if (value.every((item) => typeof item !== "object" || item === null)) {
      return (
        <Stack direction="row" flexWrap="wrap" gap={0.75} sx={{ mt: 0.5 }}>
          {value.map((item, i) => (
            <Box
              key={i}
              sx={{
                px: 1.25,
                py: 0.5,
                borderRadius: "6px",
                backgroundColor: "#eef2ff",
                color: "#3949ab",
                fontSize: 13,
                fontWeight: 600,
              }}
            >
              {String(formatValue(fieldKey, item))}
            </Box>
          ))}
        </Stack>
      );
    }
    // array of objects -> nested cards
    return (
      <Stack spacing={1.25} sx={{ mt: 0.5 }}>
        {value.map((obj, i) => (
          <Paper
            key={i}
            variant="outlined"
            sx={{ p: 1.5, borderRadius: "8px", borderColor: "#eef0f2" }}
          >
            <Box
              sx={{
                display: "grid",
                gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr" },
                gap: 1.25,
              }}
            >
              {Object.entries(obj).map(([k, v]) => (
                <Box key={k}>
                  <Typography
                    sx={{
                      fontSize: 12,
                      fontWeight: 600,
                      color: "#6b7280",
                      textTransform: "uppercase",
                      letterSpacing: "0.02em",
                      mb: 0.25,
                    }}
                  >
                    {humanizeKey(k)}
                  </Typography>
                  <FieldValue fieldKey={k} value={v} />
                </Box>
              ))}
            </Box>
          </Paper>
        ))}
      </Stack>
    );
  }

  if (typeof value === "object") {
    if (Object.keys(value).length === 0) {
      return (
        <Typography sx={{ fontSize: 14, color: "#a3a9b3", fontStyle: "italic" }}>
          —
        </Typography>
      );
    }
    return (
      <Box
        sx={{
          mt: 0.5,
          display: "grid",
          gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr" },
          gap: 1,
        }}
      >
        {Object.entries(value).map(([k, v]) => (
          <Box key={k}>
            <Typography
              sx={{
                fontSize: 12,
                fontWeight: 600,
                color: "#6b7280",
                textTransform: "uppercase",
                letterSpacing: "0.02em",
                mb: 0.25,
              }}
            >
              {humanizeKey(k)}
            </Typography>
            <FieldValue fieldKey={k} value={v} />
          </Box>
        ))}
      </Box>
    );
  }

  return (
    <Typography sx={{ fontSize: 14.5, color: "#1f2433", fontWeight: 500 }}>
      {String(formatValue(fieldKey, value))}
    </Typography>
  );
};

const Field = ({ fieldKey, value, spanFull }) => (
  <Box sx={{ gridColumn: spanFull ? "1 / -1" : "auto" }}>
    <Typography
      sx={{
        fontSize: 13,
        fontWeight: 600,
        color: "#6b7280",
        mb: 0.5,
      }}
    >
      {humanizeKey(fieldKey)}
    </Typography>
    <FieldValue fieldKey={fieldKey} value={value} />
  </Box>
);

const SectionCard = ({ sectionName, data }) => {
  const meta = SECTION_META[sectionName];
  const Icon = meta?.icon || ClipboardList;
  const title = humanizeSectionName(sectionName);

  // References-style: top-level array of objects
  if (Array.isArray(data)) {
    return (
      <Paper
        variant="outlined"
        sx={{ borderRadius: "10px", borderColor: "#eef0f2", overflow: "hidden", mb: 2.5 }}
      >
        <SectionHeader Icon={Icon} title={title} />
        <Box sx={{ p: 2.5 }}>
          {data.length === 0 ? (
            <Typography sx={{ fontSize: 14, color: "#a3a9b3", fontStyle: "italic" }}>
              No entries
            </Typography>
          ) : (
            <Stack spacing={2}>
              {data.map((item, i) => (
                <Paper
                  key={i}
                  variant="outlined"
                  sx={{ p: 2, borderRadius: "8px", borderColor: "#eef0f2" }}
                >
                  <Box
                    sx={{
                      display: "grid",
                      gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr" },
                      gap: 2,
                    }}
                  >
                    {Object.entries(item).map(([k, v]) => (
                      <Field
                        key={k}
                        fieldKey={k}
                        value={v}
                        spanFull={isImageValue(v)}
                      />
                    ))}
                  </Box>
                </Paper>
              ))}
            </Stack>
          )}
        </Box>
      </Paper>
    );
  }

  // Empty object section
  if (typeof data === "object" && data !== null && Object.keys(data).length === 0) {
    return (
      <Paper
        variant="outlined"
        sx={{ borderRadius: "10px", borderColor: "#eef0f2", overflow: "hidden", mb: 2.5 }}
      >
        <SectionHeader Icon={Icon} title={title} />
        <Box sx={{ p: 2.5 }}>
          <Typography sx={{ fontSize: 14, color: "#a3a9b3", fontStyle: "italic" }}>
            No data submitted
          </Typography>
        </Box>
      </Paper>
    );
  }

  // Plain string section (unusual, but handle gracefully)
  if (typeof data === "string") {
    return (
      <Paper
        variant="outlined"
        sx={{ borderRadius: "10px", borderColor: "#eef0f2", overflow: "hidden", mb: 2.5 }}
      >
        <SectionHeader Icon={Icon} title={title} />
        <Box sx={{ p: 2.5 }}>
          <Field fieldKey="language" value={data} />
        </Box>
      </Paper>
    );
  }

  // Standard key/value object section
  const entries = Object.entries(data).filter(([key, value]) => {
    // Skip the empty / default employmentEligibility placeholder nested inside personalInfo
    if (
      sectionName === "personalInfo" &&
      key === "employmentEligibility" &&
      (value === null ||
        (typeof value === "object" && Object.keys(value).length === 0) ||
        JSON.stringify(value) ===
          JSON.stringify({
            legallyEligible: "yes",
            workedBefore: "yes",
            convictedFelony: "yes",
            employmentDates: [
              "2025-05-13T18:30:00.000Z",
              "2025-06-18T18:30:00.000Z",
            ],
            felonyExplanation: "Test description",
          }))
    ) {
      return false;
    }
    return true;
  });

  return (
    <Paper
      variant="outlined"
      sx={{ borderRadius: "10px", borderColor: "#eef0f2", overflow: "hidden", mb: 2.5 }}
    >
      <SectionHeader Icon={Icon} title={title} />
      <Box sx={{ p: 2.5 }}>
        {entries.length === 0 ? (
          <Typography sx={{ fontSize: 14, color: "#a3a9b3", fontStyle: "italic" }}>
            No data submitted
          </Typography>
        ) : (
          <Box
            sx={{
              display: "grid",
              gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr" },
              gap: 2.25,
            }}
          >
            {entries.map(([key, value]) => (
              <Field
                key={key}
                fieldKey={key}
                value={value}
                spanFull={
                  isImageValue(value) ||
                  isSignatureKey(key) ||
                  (typeof value === "object" && value !== null && !Array.isArray(value)) ||
                  (Array.isArray(value) && value.some((v) => typeof v === "object"))
                }
              />
            ))}
          </Box>
        )}
      </Box>
    </Paper>
  );
};

const SectionHeader = ({ Icon, title }) => (
  <Box
    sx={{
      px: 2.5,
      py: 1.5,
      backgroundColor: "#eef2ff",
      display: "flex",
      alignItems: "center",
      gap: 1.25,
    }}
  >
    <Box
      sx={{
        width: 32,
        height: 32,
        borderRadius: "8px",
        backgroundColor: "#fff",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        flexShrink: 0,
      }}
    >
      <Icon size={17} color="#3949ab" />
    </Box>
    <Typography
      sx={{
        fontSize: 15.5,
        fontWeight: 600,
        color: "#2c3345",
        letterSpacing: "-0.01em",
      }}
    >
      {title}
    </Typography>
  </Box>
);

// ---------------------------------------------------------------------------
// Main component
// ---------------------------------------------------------------------------

const ViewForm = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [sections, setSections] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const navigateToHiringForms = () => navigate("/hiring-form");

  useEffect(() => {
    const fetchFormData = async () => {
      try {
        setLoading(true);
        setError(null);
        const res = await axios.get(
          `https://node.socialsanitation.com/api/v1/form/getFormById/${id}`
        );
        const submissions = res.data?.data?.details_form_submission || [];
        const parsed = submissions.map((item) => ({
          sectionName: item.section_name,
          data: JSON.parse(item.data),
        }));
        setSections(parsed);
      } catch (err) {
        console.error("Failed to fetch form data:", err);
        setError("Failed to load this hiring form. Please try again.");
      } finally {
        setLoading(false);
      }
    };

    fetchFormData();
  }, [id]);

  return (
    <Box sx={{ p: 3, backgroundColor: "#f7f8fa", minHeight: "100vh" }}>
      <Paper
        variant="outlined"
        sx={{
          p: 2.5,
          mb: 3,
          borderRadius: "10px",
          borderColor: "#eef0f2",
        }}
      >
        <Box
          sx={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            gap: 2,
            flexWrap: { xs: "wrap", md: "nowrap" },
          }}
        >
          <Box>
            <Typography
              sx={{
                fontSize: 24,
                fontWeight: 600,
                letterSpacing: "-0.01em",
                color: "#1f2433",
              }}
            >
              EMPLOYEE HIRING FORM MANAGEMENT
            </Typography>
            <Typography sx={{ fontSize: 14, color: "#6b7280", mt: 0.5 }}>
              View Employee Hiring Form
            </Typography>
          </Box>

          <Button
            variant="contained"
            disableElevation
            startIcon={<ArrowBackIcon />}
            onClick={navigateToHiringForms}
            sx={{
              ml: "auto",
              height: 46,
              px: 3,
              borderRadius: "8px",
              minWidth: 180,
              textTransform: "none",
              fontWeight: 600,
              backgroundColor: "#2c3345",
              flexShrink: 0,
              "&:hover": {
                backgroundColor: "#1f2433",
              },
            }}
          >
            Return to Hiring Forms
          </Button>
        </Box>
      </Paper>

      {loading && (
        <Box sx={{ display: "flex", justifyContent: "center", py: 8 }}>
          <CircularProgress size={32} sx={{ color: "#2c3345" }} />
        </Box>
      )}

      {!loading && error && (
        <Paper
          variant="outlined"
          sx={{
            p: 3,
            borderRadius: "10px",
            borderColor: "#fecaca",
            backgroundColor: "#fef2f2",
            color: "#b91c1c",
            fontSize: 14,
          }}
        >
          {error}
        </Paper>
      )}

      {!loading && !error && sections.length === 0 && (
        <Paper
          variant="outlined"
          sx={{ p: 3, borderRadius: "10px", borderColor: "#eef0f2" }}
        >
          <Typography sx={{ fontSize: 14, color: "#a3a9b3", fontStyle: "italic" }}>
            No submission data found for this form.
          </Typography>
        </Paper>
      )}

      {!loading &&
        !error &&
        sections.map((section, idx) => (
          <SectionCard
            key={idx}
            sectionName={section.sectionName}
            data={section.data}
          />
        ))}
    </Box>
  );
};

export default ViewForm;