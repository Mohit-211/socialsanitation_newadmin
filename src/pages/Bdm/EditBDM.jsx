/** @format */

import React, { useLayoutEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { GetAdminById, UpdateAdmin } from "../../services/Api/Api.jsx";
import { message } from "antd";
import Button from "@mui/material/Button";
import TextField from "@mui/material/TextField";
import Box from "@mui/material/Box";
import Paper from "@mui/material/Paper";
import Typography from "@mui/material/Typography";
import Divider from "@mui/material/Divider";
import InputAdornment from "@mui/material/InputAdornment";
import {
  ArrowLeft,
  Save,
  X,
  User as UserIcon,
  Phone,
  Mail,
  ShieldCheck,
  UserCog,
} from "lucide-react";

const EditBDM = () => {
  const { id } = useParams();
  const [data, setData] = useState({});
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  // Fetch BDM Data
  useLayoutEffect(() => {
    GetAdminById(id)
      .then((res) => {
        setData(res.data.data);
      })
      .catch((err) => {
        console.error(err);
        message.error("Failed to load BDM details");
      });
  }, [id]);

  const handleChange = (e) => {
    setData({ ...data, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    // if (!data.name || !data.mobile) {
    //   return message.warning("Please fill in all required fields");
    // }

    setLoading(true);
    try {
      const formData = new FormData();
      formData.append("admin_id", id);
      formData.append("name", data.name || "");
      formData.append("mobile", data.mobile || "");
      formData.append("role_id", "5");

      const res = await UpdateAdmin(formData);

      if (res.status === 200) {
        message.success("BDM details updated successfully");
        navigate("/bdm-list");
      }
    } catch (err) {
      message.error("Something went wrong while saving");
    } finally {
      setLoading(false);
    }
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

  const disabledLabelSx = {
    ...labelSx,
    color: "#9ca3af",
  };

  const sectionLabelSx = {
    fontSize: "11.5px",
    fontWeight: 700,
    color: "#6b7280",
    letterSpacing: "0.04em",
    textTransform: "uppercase",
    mb: 1.5,
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
              Modify account information and contact details
            </Typography>
          </Box>

          <Button
            variant="contained"
            disableElevation
            startIcon={<ArrowLeft size={18} />}
            onClick={() => navigate("/bdm-list")}
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
            marginBottom: "20px",
          }}
        >
          <Box
            sx={{
              width: 36,
              height: 36,
              borderRadius: "10px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              background: "#4f46e5",
              color: "#fff",
              flexShrink: 0,
            }}
          >
            <UserCog size={18} />
          </Box>
          <Box sx={{ minWidth: 0 }}>
            <Typography
              sx={{
                fontSize: "14px",
                fontWeight: 700,
                color: "#1e1b4b",
                lineHeight: 1.3,
              }}
            >
              Editing: {data?.name || "BDM Profile"}
            </Typography>
            <Typography
              sx={{
                fontSize: "12px",
                color: "#4338ca",
                lineHeight: 1.4,
                mt: 0.25,
              }}
            >
              Name and mobile number can be updated below. Email and role are
              locked.
            </Typography>
          </Box>
        </Box>

        <form onSubmit={handleSubmit}>
          <Box
            sx={{
              display: "grid",
              gridTemplateColumns: { xs: "1fr", md: "1fr 1fr" },
              gap: 3,
            }}
          >
            {/* Editable fields */}
            <Box>
              <Typography sx={sectionLabelSx}>General Information</Typography>

              <Box sx={{ mb: 2 }}>
                <Typography sx={labelSx}>Full Name</Typography>
                <TextField
                  name="name"
                  value={data?.name || ""}
                  onChange={handleChange}
                  placeholder="Enter full name"
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

              <Box>
                <Typography sx={labelSx}>Mobile Number</Typography>
                <TextField
                  name="mobile"
                  value={data?.mobile || ""}
                  onChange={handleChange}
                  placeholder="Enter mobile number"
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

            {/* Locked fields */}
            <Box>
              <Typography sx={sectionLabelSx}>Account Details</Typography>

              <Box sx={{ mb: 2 }}>
                <Typography sx={disabledLabelSx}>Email Address</Typography>
                <TextField
                  value={data?.email || ""}
                  disabled
                  fullWidth
                  size="small"
                  sx={{
                    ...fieldSx,
                    "& .MuiOutlinedInput-root": {
                      ...fieldSx["& .MuiOutlinedInput-root"],
                      backgroundColor: "#f5f5f5",
                    },
                  }}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <Mail size={16} color="#bfbfbf" />
                      </InputAdornment>
                    ),
                  }}
                />
              </Box>

              <Box>
                <Typography sx={disabledLabelSx}>Role</Typography>
                <TextField
                  value="Business Development Manager"
                  disabled
                  fullWidth
                  size="small"
                  sx={{
                    ...fieldSx,
                    "& .MuiOutlinedInput-root": {
                      ...fieldSx["& .MuiOutlinedInput-root"],
                      backgroundColor: "#f5f5f5",
                    },
                  }}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <ShieldCheck size={16} color="#bfbfbf" />
                      </InputAdornment>
                    ),
                  }}
                />
              </Box>
            </Box>
          </Box>

          <Divider sx={{ mt: 2.5, mb: 2 }} />

          {/* Action Buttons */}
          <Box sx={{ display: "flex", justifyContent: "flex-end", gap: 1.5 }}>
            <Button
              variant="contained"
              disableElevation
              type="button"
              startIcon={<X size={18} />}
              onClick={() => navigate("/bdm-list")}
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
              Cancel
            </Button>

            <Button
              variant="contained"
              disableElevation
              type="submit"
              disabled={loading}
              startIcon={!loading ? <Save size={18} /> : null}
              sx={{
                height: 42,
                px: 3,
                borderRadius: "6px",
                textTransform: "none",
                fontWeight: 600,
                minWidth: "160px",
                backgroundColor: "#3b82f6",
                "&:hover": {
                  backgroundColor: "#2563eb",
                },
              }}
            >
              {loading ? "Saving..." : "Save Changes"}
            </Button>
          </Box>
        </form>
      </Paper>
    </Box>
  );
};

export default EditBDM;