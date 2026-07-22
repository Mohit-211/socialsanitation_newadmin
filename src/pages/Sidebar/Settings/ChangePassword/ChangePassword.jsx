/** @format */

import React, { useState } from "react";
import Form from "react-bootstrap/Form";
import Button from "@mui/material/Button";
import "./ChangePassword.css";
import { Box } from "@mui/material";
import { useNavigate } from "react-router-dom";
import { ChangeAdminPassword } from "@/services/Api/Api";
import Card from "@mui/material/Card";
import { FaEye, FaEyeSlash } from "react-icons/fa";
import { message } from "antd";

const ChangePassword = () => {
  const navigate = useNavigate();
  const navigateToDashboard = () => {
    navigate("/");
  };

  const [oldPassword, setOldPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showCurrentPassword, setShowCurrentPassword] = useState(false); // For current password field

  const handleTogglePassword = () => {
    setShowPassword(!showPassword);
  };

  const handleToggleCurrentPassword = () => {
    setShowCurrentPassword(!showCurrentPassword);
  };

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

    try {
      const res = await ChangeAdminPassword(formData);
      if (res?.status === 200) {
        message.success("Password changed!");
      } else {
        message.error(res?.data?.message);
      }
    } catch (error) {
      message.error(error?.response?.data?.message);
    }
  };

  return (
    <Box m="20px">
      <Box display="flex" justifyContent="space-between" alignItems="center">
        <h3 style={{ marginTop: "5px", marginBottom: "30px" }}>
          CHANGE PASSWORD
        </h3>
      </Box>
      <Card>
        <Form>
          {/* Current Password with toggle */}
          <Form.Group className="mb-3" style={{ position: "relative" }}>
            <Form.Label>Current Password</Form.Label>
            <div
              className="current-password-toggle-icon"
              onClick={handleToggleCurrentPassword}
            >
              {showCurrentPassword ? <FaEye /> : <FaEyeSlash />}
            </div>
            <Form.Control
              required
              type={showCurrentPassword ? "text" : "password"}
              placeholder="Enter Current Password"
              onChange={(event) => {
                setOldPassword(event.target.value);
              }}
            />
          </Form.Group>

          {/* New Password with toggle */}
          <Form.Group className="mb-3" style={{ position: "relative" }}>
            <Form.Label>New Password</Form.Label>
            <div
              className="new-password-toggle-icon"
              onClick={handleTogglePassword}
            >
              {showPassword ? <FaEye /> : <FaEyeSlash />}
            </div>
            <Form.Control
              required
              type={showPassword ? "text" : "password"}
              placeholder="Enter New Password"
              onChange={(event) => {
                setNewPassword(event.target.value);
              }}
            />
          </Form.Group>

          {/* Confirm Password with toggle */}
          <Form.Group className="mb-4" style={{ position: "relative" }}>
            <Form.Label>Confirm Password</Form.Label>
            <div
              className="confirm-password-toggle-icon"
              onClick={handleTogglePassword}
            >
              {showPassword ? <FaEye /> : <FaEyeSlash />}
            </div>
            <Form.Control
              required
              type={showPassword ? "text" : "password"}
              placeholder="Enter Confirm Password"
              onChange={(event) => {
                setConfirmPassword(event.target.value);
              }}
            />
          </Form.Group>

          <Button
            icon="pi pi-check"
            severity="info"
            type="submit"
            onClick={handleChangePassword}
            style={{
              height: "45px",
              padding: "20px",
              borderRadius: "5px",
            }}
          >
            Save
          </Button>
          <Button
            icon="pi pi-times"
            severity="secondary"
            onClick={navigateToDashboard}
            style={{
              marginLeft: "10px",
              marginTop: "10px",
              height: "45px",
              padding: "20px",
              borderRadius: "5px",
            }}
          >
            Cancel
          </Button>
        </Form>
      </Card>
    </Box>
  );
};

export default ChangePassword;
