/** @format */

import React, { useState } from "react";
import Box from "@mui/material/Box";
import Paper from "@mui/material/Paper";
import Typography from "@mui/material/Typography";
import Button from "@mui/material/Button";
import TextField from "@mui/material/TextField";
import Select from "@mui/material/Select";
import MenuItem from "@mui/material/MenuItem";
import Card from "@mui/material/Card";
import { CreateAdmin } from "../../services/Api/Api";
import { useNavigate } from "react-router-dom";
import "react-toastify/dist/ReactToastify.css";
import { message, Steps } from "antd";
import { SolutionOutlined } from "@ant-design/icons";
import { ArrowLeft, Check, X, Mail } from "lucide-react";

const AddAdmin = () => {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [roleId, setRoleId] = useState("");
  const [disable, setDisable] = useState(false);

  const navigate = useNavigate();

  const handleSubmit = async (event) => {
    event.preventDefault();
    setDisable(true);

    if (!name) {
      setDisable(false);
      message.error("Please enter name");

      return;
    }
    if (!email) {
      setDisable(false);
      message.error("Please enter email");
      return;
    }
    if (!roleId) {
      setDisable(false);
      message.error("Please choose any Role");
      return;
    }
    try {
      const formData = new FormData();
      formData.append("name", name);
      formData.append("email", email);
      formData.append("role_id", parseInt(roleId, 10));

      const response = await CreateAdmin(formData);

      if (response.status === 201) {
        // NEW: confirm the credentials email was sent, and that the
        // admin can change their password anytime afterward.
        message.success({
          content: `Admin added successfully. Login credentials have been emailed to ${email}.`,
          duration: 4,
        });
      }
      setTimeout(() => {
        navigate("/adminList");
      }, 1500);
      setDisable(false);
    } catch (error) {
      if (error.response && error.response.status === 400) {
        message.error("Email already exists");
      } else if (error.response.status === 401) {
        message.error("Token expired");
        localStorage.removeItem("adminToken");
        setTimeout(() => {
          navigate("/Login");
        }, 1000);
      } else {
        message.error("Something went wrong");
      }
      setDisable(false);
    }
  };

  const navigateToAdmin = () => {
    navigate("/adminList");
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
            flexWrap: { xs: "wrap", md: "nowrap" },
          }}
        >
          <Box sx={{ minWidth: 0 }}>
            <Typography className="page-title" noWrap>
              ADMIN MANAGEMENT
            </Typography>
            <Typography
              className="page-sub-title"
              sx={{
                overflow: "hidden",
                textOverflow: "ellipsis",
                whiteSpace: "nowrap",
              }}
            >
              Create a new admin
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
            Return to Admin
          </Button>
        </Box>
      </Paper>

      <Box
        sx={{
          display: "flex",
          flexDirection: { xs: "column", md: "row" },
          gap: 2.5,
        }}
      >
        <Paper
          variant="outlined"
          sx={{
            flex: { md: "0 0 70%" },
            p: 3,
            borderRadius: "10px",
            borderColor: "#eef0f2",
          }}
        >
          {/* NEW: info banner explaining the credentials-by-email flow */}
          <Box
            sx={{
              display: "flex",
              alignItems: "flex-start",
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
              <Mail size={18} />
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
                Credentials Sent Automatically
              </Typography>
              <Typography
                sx={{
                  fontSize: "12px",
                  color: "#4338ca",
                  lineHeight: 1.4,
                  mt: 0.25,
                }}
              >
                Once you save, a system-generated password will be emailed to
                the admin's address. They can log in with it right away and
                change it anytime from the Change Password page.
              </Typography>
            </Box>
          </Box>

          <form onSubmit={handleSubmit}>
            <Box sx={{ display: "flex", flexDirection: "column", gap: 2.5 }}>
              <Box>
                <Typography sx={labelSx}>Name</Typography>
                <TextField
                  fullWidth
                  size="small"
                  placeholder="Enter name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  sx={fieldSx}
                />
              </Box>

              <Box>
                <Typography sx={labelSx}>Email</Typography>
                <TextField
                  fullWidth
                  size="small"
                  type="email"
                  placeholder="Enter email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  sx={fieldSx}
                />
              </Box>

              <Box>
                <Typography sx={labelSx}>Select Role</Typography>
                <Select
                  fullWidth
                  size="small"
                  displayEmpty
                  value={roleId}
                  onChange={(e) => setRoleId(e.target.value)}
                  sx={{
                    height: "45px",
                    borderRadius: "6px",
                  }}
                >
                  <MenuItem value="" disabled>
                    Select Role
                  </MenuItem>
                  <MenuItem value="5">BDM</MenuItem>
                  <MenuItem value="3">OPERATIONS ADMINISTRATOR</MenuItem>
                  <MenuItem value="1">SUPER ADMIN</MenuItem>
                </Select>
              </Box>

              <Box sx={{ display: "flex", gap: 1.5, mt: 1 }}>
                <Button
                  variant="contained"
                  disableElevation
                  type="submit"
                  disabled={disable}
                  startIcon={!disable ? <Check size={18} /> : null}
                  sx={{
                    height: 42,
                    px: 3,
                    borderRadius: "6px",
                    textTransform: "none",
                    fontWeight: 600,
                    backgroundColor: "#16a34a",
                    "&:hover": {
                      backgroundColor: "#15803d",
                    },
                  }}
                >
                  {disable ? "Saving..." : "Save"}
                </Button>

                <Button
                  variant="contained"
                  disableElevation
                  startIcon={<X size={18} />}
                  onClick={navigateToAdmin}
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

        <Paper
          variant="outlined"
          sx={{
            flex: { md: "0 0 30%" },
            p: 3,
            borderRadius: "10px",
            borderColor: "#eef0f2",
          }}
        >
          <Steps
            direction="vertical"
            size="small"
            items={[
              {
                title: "Super Admin",
                status: "finish",
                icon: <SolutionOutlined />,
                description:
                  "This role grants extensive access and permissions across all features and pages of the admin panel",
              },
              {
                title: "Business Development Manager",
                status: "finish",
                icon: <SolutionOutlined />,
                description:
                  "This role grants extensive access and permissions across the assigned user,employees and their asociated bookings.",
              },
              {
                title: "Operations Administrator",
                status: "finish",
                icon: <SolutionOutlined />,
                description:
                  "This role has access to day-to-day operations across the admin panel, excluding Estimates, Invoices, the Calculator, and BDM management.",
              },
            ]}
          />
        </Paper>
      </Box>
    </Box>
  );
};

export default AddAdmin;