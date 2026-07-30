/** @format */

import React, { useState } from "react";
import Box from "@mui/material/Box";
import Paper from "@mui/material/Paper";
import Typography from "@mui/material/Typography";
import Button from "@mui/material/Button";
import TextField from "@mui/material/TextField";
import InputAdornment from "@mui/material/InputAdornment";
import IconButton from "@mui/material/IconButton";
import { useNavigate } from "react-router-dom";
import { ChangeAdminPassword } from "@/services/Api/Api";
import { message } from "antd";
import { Eye, EyeOff, Check, X, KeyRound } from "lucide-react";

const ChangePassword = () => {
  const navigate = useNavigate();
  const navigateToDashboard = () => {
    navigate("/");
  };

  const [oldPassword, setOldPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [saving, setSaving] = useState(false);

  const handleChangePassword = async (e) => {
    e.preventDefault();

    if (
      oldPassword?.length === 0 ||
      newPassword?.length === 0 ||
      confirmPassword?.length === 0
    ) {
      message.error("Please enter valid input");
      return;
    }

    if (newPassword !== confirmPassword) {
      message.error("New Password and Confirm Password do not match");
      return;
    }

    const formData = new FormData();
    formData.append("old_password", oldPassword);
    formData.append("new_password", newPassword);
    formData.append("confirm_password", confirmPassword);

    setSaving(true);
    try {
      const res = await ChangeAdminPassword(formData);
      if (res?.status === 200) {
        message.success("Password changed!");
      } else {
        message.error(res?.data?.message);
      }
    } catch (error) {
      message.error(error?.response?.data?.message);
    } finally {
      setSaving(false);
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
        <Box>
          <Typography className="page-title">CHANGE PASSWORD</Typography>
          <Typography className="page-sub-title">
            Update your account password
          </Typography>
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
            <KeyRound size={18} />
          </Box>
          <Box>
            <Typography
              sx={{
                fontSize: "14px",
                fontWeight: 700,
                color: "#1e1b4b",
                lineHeight: 1.3,
              }}
            >
              Update Your Password
            </Typography>
            <Typography
              sx={{
                fontSize: "12px",
                color: "#4338ca",
                lineHeight: 1.4,
                mt: 0.25,
              }}
            >
              Choose a strong password you haven't used before.
            </Typography>
          </Box>
        </Box>

        <form onSubmit={handleChangePassword}>
          <Box sx={{ display: "flex", flexDirection: "column", gap: 2.5 }}>
            <Box>
              <Typography sx={labelSx}>Current Password</Typography>
              <TextField
                fullWidth
                size="small"
                required
                type={showCurrentPassword ? "text" : "password"}
                placeholder="Enter current password"
                value={oldPassword}
                onChange={(e) => setOldPassword(e.target.value)}
                sx={fieldSx}
                InputProps={{
                  endAdornment: (
                    <InputAdornment position="end">
                      <IconButton
                        size="small"
                        onClick={() =>
                          setShowCurrentPassword((prev) => !prev)
                        }
                        edge="end"
                      >
                        {showCurrentPassword ? (
                          <EyeOff size={17} />
                        ) : (
                          <Eye size={17} />
                        )}
                      </IconButton>
                    </InputAdornment>
                  ),
                }}
              />
            </Box>

            <Box>
              <Typography sx={labelSx}>New Password</Typography>
              <TextField
                fullWidth
                size="small"
                required
                type={showNewPassword ? "text" : "password"}
                placeholder="Enter new password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                sx={fieldSx}
                InputProps={{
                  endAdornment: (
                    <InputAdornment position="end">
                      <IconButton
                        size="small"
                        onClick={() => setShowNewPassword((prev) => !prev)}
                        edge="end"
                      >
                        {showNewPassword ? (
                          <EyeOff size={17} />
                        ) : (
                          <Eye size={17} />
                        )}
                      </IconButton>
                    </InputAdornment>
                  ),
                }}
              />
            </Box>

            <Box>
              <Typography sx={labelSx}>Confirm Password</Typography>
              <TextField
                fullWidth
                size="small"
                required
                type={showConfirmPassword ? "text" : "password"}
                placeholder="Re-enter new password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                sx={fieldSx}
                InputProps={{
                  endAdornment: (
                    <InputAdornment position="end">
                      <IconButton
                        size="small"
                        onClick={() =>
                          setShowConfirmPassword((prev) => !prev)
                        }
                        edge="end"
                      >
                        {showConfirmPassword ? (
                          <EyeOff size={17} />
                        ) : (
                          <Eye size={17} />
                        )}
                      </IconButton>
                    </InputAdornment>
                  ),
                }}
              />
            </Box>

            <Box sx={{ display: "flex", gap: 1.5, mt: 1 }}>
              <Button
                variant="contained"
                disableElevation
                type="submit"
                disabled={saving}
                startIcon={!saving ? <Check size={18} /> : null}
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
                {saving ? "Saving..." : "Save"}
              </Button>

              <Button
                variant="contained"
                disableElevation
                startIcon={<X size={18} />}
                onClick={navigateToDashboard}
                sx={{
                  height: 42,
                  px: 3,
                  borderRadius: "6px",
                  textTransform: "none",
                  fontWeight: 600,
                  backgroundColor: "#6b7280",
                  "&:hover": {
                    backgroundColor: "#4b5563",
                  },
                }}
              >
                Cancel
              </Button>
            </Box>
          </Box>
        </form>
      </Paper>
    </Box>
  );
};

export default ChangePassword;