import { useState } from "react";
import { Box, Paper, Button, Typography as MuiTypography } from "@mui/material";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import DownloadIcon from "@mui/icons-material/Download";
import CircularProgress from "@mui/material/CircularProgress";
import { useNavigate, useParams } from "react-router-dom";
import { message } from "antd";
import UserScopeBuilder from "./UserScopeBuilder";
import { downloadScopeOfWorkPDF } from "../../../services/Api/ScopeApi";

const ClientScopeOfWork = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const [downloading, setDownloading] = useState(false);

  const handleDownloadScopePDF = async () => {
    const hideLoading = message.loading("Generating Scope of Work PDF...", 0);
    try {
      setDownloading(true);
      const res = await downloadScopeOfWorkPDF(id);

      // Same shape as generateEstimatePDFService's response — a plain JSON
      // payload wrapped by responseWrapper: { data: { data: { fileUrl } } }
      const fileUrl = res?.data?.data?.fileUrl;

      if (!fileUrl) {
        throw new Error("No file URL returned from server");
      }

      // Open the static file directly, exactly like the full Service
      // Estimate PDF does — the browser's own PDF viewer handles it, and
      // the person can save/print from there. No blob handling needed.
      window.open(fileUrl, "_blank");

      message.success("Scope of Work PDF generated");
    } catch (err) {
      console.error(err);
      message.error("Failed to generate Scope of Work PDF");
    } finally {
      hideLoading();
      setDownloading(false);
    }
  };

  return (
    <Box>
      <Paper
        variant="outlined"
        sx={{ p: 2.5, mb: 3, borderRadius: "10px", borderColor: "#eef0f2" }}
      >
        <Box
          sx={{
            display: "flex",
            justifyContent: "space-between",
            flexWrap: { xs: "wrap", md: "nowrap" },
            alignItems: "center",
            gap: 2,
          }}
        >
          <Box>
            <MuiTypography className="page-title">
              CLIENT SCOPE OF WORK
            </MuiTypography>
            <MuiTypography className="page-sub-title">
              Used to generate this client's Estimate PDF and Inspection
              Sheets
            </MuiTypography>
          </Box>

          <Box sx={{ display: "flex", gap: 1.5, flexShrink: { xs: 1, md: 0 }, flexWrap: { xs: "wrap", md: "nowrap" } }}>
            <Button
              variant="outlined"
              disableElevation
              startIcon={
                downloading ? (
                  <CircularProgress size={16} sx={{ color: "#5aa02c" }} />
                ) : (
                  <DownloadIcon />
                )
              }
              onClick={handleDownloadScopePDF}
              disabled={downloading}
              sx={{
                height: 47,
                px: 3,
                borderRadius: "8px",
                minWidth: 220,
                textTransform: "none",
                fontWeight: 600,
                borderColor: "#5aa02c",
                color: "#5aa02c",
                "&:hover": {
                  borderColor: "#4a8724",
                  backgroundColor: "#f2f8ee",
                },
              }}
            >
              {downloading ? "Generating..." : "Download Scope of Work"}
            </Button>

            <Button
              variant="contained"
              disableElevation
              startIcon={<ArrowBackIcon />}
              onClick={() => navigate(`/editUser/${id}`)}
              sx={{
                height: 47,
                px: 3,
                borderRadius: "8px",
                minWidth: 180,
                textTransform: "none",
                fontWeight: 600,
                backgroundColor: "#2c3345",
                flexShrink: 0,
                "&:hover": { backgroundColor: "#1f2433" },
              }}
            >
              Back to Client
            </Button>
          </Box>
        </Box>
      </Paper>

      <UserScopeBuilder userId={id} />
    </Box>
  );
};

export default ClientScopeOfWork;