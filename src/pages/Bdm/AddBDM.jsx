/** @format */

import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { CreateAdmin } from "../../services/Api/Api";
import Box from "@mui/material/Box";
import Card from "@mui/material/Card";
import Button from "@mui/material/Button";
import TextField from "@mui/material/TextField";
import { message, Typography, Row, Col, Divider, Space } from "antd";
import {
  IoArrowBackOutline,
  IoPersonAddOutline,
  IoCloseOutline,
  IoMailOutline,
  IoCallOutline,
  IoPersonOutline,
} from "react-icons/io5";

const { Title, Text } = Typography;

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

  return (
    <Box p={3} style={{ backgroundColor: "#f8f9fa", minHeight: "100vh" }}>
      {/* Header Section */}
      <Box
        display="flex"
        justifyContent="space-between"
        alignItems="center"
        mb={4}
      >
        <div>
          <Title level={3} style={{ margin: 0, fontWeight: 700 }}>
            Create New BDM
          </Title>
          <Text type="secondary">
            Onboard a new Business Development Manager to the system
          </Text>
        </div>
        <Button
          label="Back to List"
          icon={<IoArrowBackOutline style={{ marginRight: "8px" }} />}
          className="p-button-text p-button-secondary"
          onClick={navigateToAdmin}
        />
      </Box>

      <Card
        elevation={0}
        style={{
          borderRadius: "12px",
          padding: "32px",
          border: "1px solid #f0f0f0",
        }}
      >
        <form onSubmit={handleSubmit}>
          <Row gutter={[32, 24]}>
            {/* Information Description */}
            <Col xs={24} md={8}>
              <div style={{ marginBottom: "20px" }}>
                <Text strong style={{ fontSize: "16px", color: "#1a3353" }}>
                  BDM Details
                </Text>
                <p
                  style={{
                    color: "#8c8c8c",
                    fontSize: "13px",
                    marginTop: "8px",
                  }}
                >
                  Fill in the professional contact details for the new BDM. An
                  invitation or account setup link will be sent to the provided
                  email.
                </p>
              </div>
            </Col>

            {/* Input Fields */}
            <Col xs={24} md={16}>
              <div className="p-fluid">
                <Row gutter={[16, 16]}>
                  <Col span={24}>
                    <label
                      style={{
                        display: "block",
                        marginBottom: "8px",
                        fontWeight: 500,
                      }}
                    >
                      Full Name
                    </label>
                    <span className="p-input-icon-left">
                      <IoPersonOutline
                        style={{ fontSize: "18px", marginTop: "-9px" }}
                      />
                      <InputText
                        placeholder="e.g. John Doe"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        style={{ borderRadius: "8px" }}
                      />
                    </span>
                  </Col>

                  <Col span={12} xs={24} sm={12}>
                    <label
                      style={{
                        display: "block",
                        marginBottom: "8px",
                        fontWeight: 500,
                      }}
                    >
                      Email Address
                    </label>
                    <span className="p-input-icon-left">
                      <IoMailOutline
                        style={{ fontSize: "18px", marginTop: "-9px" }}
                      />
                      <InputText
                        type="email"
                        placeholder="john@example.com"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        style={{ borderRadius: "8px" }}
                      />
                    </span>
                  </Col>

                  <Col span={12} xs={24} sm={12}>
                    <label
                      style={{
                        display: "block",
                        marginBottom: "8px",
                        fontWeight: 500,
                      }}
                    >
                      Mobile Number
                    </label>
                    <span className="p-input-icon-left">
                      <IoCallOutline
                        style={{ fontSize: "18px", marginTop: "-9px" }}
                      />
                      <InputText
                        placeholder="+1 (555) 000-0000"
                        value={mobile}
                        onChange={(e) => setMobile(e.target.value)}
                        style={{ borderRadius: "8px" }}
                      />
                    </span>
                  </Col>
                </Row>
              </div>
            </Col>
          </Row>

          <Divider style={{ margin: "40px 0 24px 0" }} />

          {/* Footer Actions */}
          <Box display="flex" justifyContent="flex-end">
            <Space size="middle">
              <Button
                label="Discard"
                icon={
                  <IoCloseOutline
                    style={{ marginRight: "8px", fontSize: "18px" }}
                  />
                }
                type="button"
                className="p-button-outlined p-button-secondary"
                onClick={navigateToAdmin}
                style={{ borderRadius: "8px", padding: "10px 24px" }}
              />
              <Button
                label={loading ? "Creating..." : "Create Account"}
                icon={
                  !loading && (
                    <IoPersonAddOutline
                      style={{ marginRight: "8px", fontSize: "18px" }}
                    />
                  )
                }
                type="submit"
                loading={loading}
                className="p-button-info"
                style={{
                  borderRadius: "8px",
                  padding: "10px 24px",
                  minWidth: "180px",
                }}
              />
            </Space>
          </Box>
        </form>
      </Card>
    </Box>
  );
};

export default AddBDM;
