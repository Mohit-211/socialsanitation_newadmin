/** @format */

import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { CreateAdmin } from "../../services/Api/Api";
import Box from "@mui/material/Box";
import Paper from "@mui/material/Paper";
import Button from "@mui/material/Button";
import TextField from "@mui/material/TextField";
import Typography from "@mui/material/Typography";
import Divider from "@mui/material/Divider";
import InputAdornment from "@mui/material/InputAdornment";
import { message } from "antd";
import {
  ArrowLeft,
  UserPlus,
  X,
  User as UserIcon,
  Mail,
  Phone,
  Briefcase,
} from "lucide-react";

const AddBDM = () => {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [mobile, setMobile] = useState("");
  const [loading, setLoading] = useState(false);

  const navigate = useNavigate();

  const handleSubmit = async (event) => {
    event.preventDefault();

    // Validation
    if (!name || !email || !mobile) {
      message.error("All fields are required");
      return;
    }

    setLoading(true);
    try {
      const formData = new FormData();
      formData.append("name", name);
      formData.append("email", email);
      formData.append("role_id", 5);
      formData.append("mobile", mobile);

      const response = await CreateAdmin(formData);

      if (response.status === 201) {
        message.success("BDM created successfully");
        setTimeout(() => navigate("/bdm-list"), 1000);
      }
    } catch (error) {
      if (error.response?.status === 400) {
        message.error("This email is already registered");
      } else if (error.response?.status === 401) {
        message.error("Session expired. Please login again.");
        localStorage.removeItem("adminToken");
        navigate("/Login");
      } else {
        message.error("An error occurred. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  };

  const navigateToAdmin = () => {
    navigate("/bdm-list");
  };

  const fieldSx = {
    "& .MuiOutlinedInput-root": {
      height: "45px",
      borderRadius: "6px",
    },
  };

  const labelSx = {
    fontSize: "13px",
    fontWeight: 600,
    color: "#374151",
    mb: 1,
  };

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
          }}
        >
          <Box>
            <Typography className="page-title">BDM MANAGEMENT</Typography>
            <Typography className="page-sub-title">
              Onboard a new Business Development Manager
            </Typography>
          </Box>

          <Button
            variant="contained"
            disableElevation
            startIcon={<ArrowLeft size={18} />}
            onClick={navigateToAdmin}
            sx={{
              ml: "auto",
              height: 46,
              px: 3,
              borderRadius: "8px",
              minWidth: 180,
              textTransform: "none",
              fontWeight: 600,
              backgroundColor: "#2c3345",
              "&:hover": {
                backgroundColor: "#1f2433",
              },
            }}
          >
            Return to BDM List
          </Button>
        </Box>
      </Paper>

      <Paper
        variant="outlined"
        sx={{
          borderRadius: "10px",
          borderColor: "#eef0f2",
          p: 3,
        }}
      >
        {/* Section intro with icon badge — mirrors the "Client" summary
            treatment used in the reset-password modal elsewhere */}
        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            gap: 1.5,
            background: "#eef2ff",
            border: "1px solid #e0e7ff",
            borderRadius: "10px",
            padding: "14px 18px",
            marginBottom: "28px",
          }}
        >
          <Box
            sx={{
              width: 40,
              height: 40,
              borderRadius: "10px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              background: "#4f46e5",
              color: "#fff",
              flexShrink: 0,
            }}
          >
            <Briefcase size={20} />
          </Box>
          <Box sx={{ minWidth: 0 }}>
            <Typography
              sx={{
                fontSize: "14.5px",
                fontWeight: 700,
                color: "#1e1b4b",
                lineHeight: 1.3,
              }}
            >
              Business Development Manager Details
            </Typography>
            <Typography
              sx={{
                fontSize: "12.5px",
                color: "#4338ca",
                lineHeight: 1.5,
                mt: 0.25,
              }}
            >
              This will create a new BDM account with access to assigned
              clients.
            </Typography>
          </Box>
        </Box>

        <form onSubmit={handleSubmit}>
          <Box sx={{ display: "flex", flexDirection: "column", gap: 2.5 }}>
            <Box>
              <Typography sx={labelSx}>Full Name</Typography>
              <TextField
                placeholder="e.g. John Doe"
                value={name}
                onChange={(e) => setName(e.target.value)}
                fullWidth
                size="small"
                sx={fieldSx}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <UserIcon size={16} color="#9ca3af" />
                    </InputAdornment>
                  ),
                }}
              />
            </Box>

            <Box
              sx={{
                display: "grid",
                gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr" },
                gap: 2.5,
              }}
            >
              <Box>
                <Typography sx={labelSx}>Email Address</Typography>
                <TextField
                  type="email"
                  placeholder="john@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  fullWidth
                  size="small"
                  sx={fieldSx}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <Mail size={16} color="#9ca3af" />
                      </InputAdornment>
                    ),
                  }}
                />
              </Box>

              <Box>
                <Typography sx={labelSx}>Mobile Number</Typography>
                <TextField
                  placeholder="+1 (555) 000-0000"
                  value={mobile}
                  onChange={(e) => setMobile(e.target.value)}
                  fullWidth
                  size="small"
                  sx={fieldSx}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <Phone size={16} color="#9ca3af" />
                      </InputAdornment>
                    ),
                  }}
                />
              </Box>
            </Box>
          </Box>

          <Divider sx={{ mt: 3.5, mb: 2.5 }} />

          {/* Action Buttons */}
          <Box sx={{ display: "flex", gap: 1.5 }}>
            <Button
              variant="contained"
              disableElevation
              type="submit"
              disabled={loading}
              startIcon={!loading ? <UserPlus size={18} /> : null}
              sx={{
                height: 42,
                px: 3,
                borderRadius: "6px",
                textTransform: "none",
                fontWeight: 600,
                backgroundColor: "#3b82f6",
                "&:hover": {
                  backgroundColor: "#2563eb",
                },
              }}
            >
              {loading ? "Creating..." : "Create Account"}
            </Button>

            <Button
              variant="contained"
              disableElevation
              type="button"
              startIcon={<X size={18} />}
              onClick={navigateToAdmin}
              sx={{
                height: 42,
                px: 3,
                borderRadius: "6px",
                textTransform: "none",
                fontWeight: 600,
                backgroundColor: "#6b7280",
                color: "#ffffff",
                "&:hover": {
                  backgroundColor: "#4b5563",
                },
              }}
            >
              Discard
            </Button>
          </Box>
        </form>
      </Paper>
    </Box>
  );
};

export default AddBDM;