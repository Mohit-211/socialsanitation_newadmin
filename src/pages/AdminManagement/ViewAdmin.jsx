import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { GetAdminProfile } from "../../services/Api/Api.jsx";
import Box from "@mui/material/Box";
import Paper from "@mui/material/Paper";
import Typography from "@mui/material/Typography";
import Button from "@mui/material/Button";
import { User, Mail, ShieldCheck, ArrowLeft } from "lucide-react";

const ViewAdmin = () => {
  const [idData, setIdData] = useState({});
  const navigate = useNavigate();

  const getData = async () => {
    try {
      let result = await GetAdminProfile(localStorage.getItem("adminToken"));
      setIdData(result.data.data);
    } catch (e) {
      console.log(e);
    }
  };

  useEffect(() => {
    getData();
  }, []);

  const navigateToAdmin = () => {
    navigate("/");
  };

  const fieldLabelSx = {
    fontSize: "11.5px",
    fontWeight: 700,
    color: "#6b7280",
    letterSpacing: "0.04em",
    textTransform: "uppercase",
    mb: 0.5,
  };

  const fieldValueSx = {
    fontSize: "14.5px",
    color: "#111827",
    fontWeight: 500,
  };

  const fields = [
    { label: "Name", value: idData?.name, icon: User },
    { label: "Email", value: idData?.email, icon: Mail },
    { label: "Role", value: idData?.admin_role?.name, icon: ShieldCheck },
  ];

  return (
    <Box>
      {/* Header Section */}
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
          <Box sx={{ minWidth: 0 }}>
            <Typography className="page-title" noWrap>
              ADMIN PROFILE
            </Typography>
            <Typography
              className="page-sub-title"
              sx={{
                overflow: "hidden",
                textOverflow: "ellipsis",
                whiteSpace: "nowrap",
              }}
            >
              View your admin account details
            </Typography>
          </Box>

          <Button
            variant="contained"
            disableElevation
            startIcon={<ArrowLeft size={18} />}
            onClick={navigateToAdmin}
            sx={{
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
            Return to Dashboard
          </Button>
        </Box>
      </Paper>

      <Paper
        variant="outlined"
        sx={{
          p: 3,
          borderRadius: "10px",
          borderColor: "#eef0f2",
        }}
      >
        {/* Intro banner */}
        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            gap: 1.5,
            background: "#eef2ff",
            border: "1px solid #e0e7ff",
            borderRadius: "10px",
            padding: "12px 16px",
            marginBottom: "24px",
          }}
        >
          <Box
            sx={{
              width: 44,
              height: 44,
              borderRadius: "50%",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              background: "#4f46e5",
              color: "#fff",
              flexShrink: 0,
              fontWeight: 700,
              fontSize: "18px",
            }}
          >
            {idData?.name?.charAt(0)?.toUpperCase() || "?"}
          </Box>
          <Box sx={{ minWidth: 0 }}>
            <Typography
              sx={{
                fontSize: "15px",
                fontWeight: 700,
                color: "#1e1b4b",
                lineHeight: 1.3,
              }}
            >
              {idData?.name || "—"}
            </Typography>
            <Typography
              sx={{
                fontSize: "12.5px",
                color: "#4338ca",
                lineHeight: 1.5,
                mt: 0.25,
              }}
            >
              {idData?.admin_role?.name || "Admin"}
            </Typography>
          </Box>
        </Box>

        {/* Fields */}
        <Box
          sx={{
            display: "grid",
            gridTemplateColumns: { xs: "1fr", sm: "repeat(3, 1fr)" },
            gap: 3,
          }}
        >
          {fields.map(({ label, value, icon: Icon }) => (
            <Box key={label}>
              <Typography sx={fieldLabelSx}>{label}</Typography>
              <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                <Icon size={15} color="#9ca3af" />
                <Typography sx={fieldValueSx}>{value || "--"}</Typography>
              </Box>
            </Box>
          ))}
        </Box>
      </Paper>
    </Box>
  );
};

export default ViewAdmin;