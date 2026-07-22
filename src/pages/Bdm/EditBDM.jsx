/** @format */

import React, { useLayoutEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { GetAdminById, UpdateAdmin } from "../../services/Api/Api.jsx";
import { message, Typography, Row, Col, Divider, Space } from "antd";
import Button from "@mui/material/Button";
import TextField from "@mui/material/TextField";
import Box from "@mui/material/Box";
import Card from "@mui/material/Card";
import {
  IoArrowBackOutline,
  IoSaveOutline,
  IoCloseOutline,
} from "react-icons/io5";

const { Title, Text } = Typography;

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

  return (
    <Box p={3} style={{ backgroundColor: "#f8f9fa", minHeight: "100vh" }}>
      {/* Header Section */}
      <Box
        display="flex"
        justifyContent="space-between"
        alignItems="center"
        mb={3}
      >
        <div>
          <Title level={3} style={{ margin: 0, fontWeight: 700 }}>
            Edit BDM Profile
          </Title>
          <Text type="secondary">
            Modify account information and contact details
          </Text>
        </div>

        <Button
          label="Back to List"
          icon={<IoArrowBackOutline style={{ marginRight: "8px" }} />}
          className="p-button-text p-button-secondary"
          onClick={() => navigate("/bdm-list")}
        />
      </Box>

      <Card
        elevation={0}
        style={{
          borderRadius: "12px",
          padding: "30px",
          border: "1px solid #f0f0f0",
        }}
      >
        <form onSubmit={handleSubmit}>
          <Row gutter={[32, 32]}>
            {/* Basic Information Section */}
            <Col xs={24} md={12}>
              <div style={{ marginBottom: "20px" }}>
                <Text strong style={{ fontSize: "16px" }}>
                  General Information
                </Text>
                <p style={{ color: "#8c8c8c", fontSize: "12px" }}>
                  Update the primary contact name and role.
                </p>
              </div>

              <div className="p-fluid">
                <div style={{ marginBottom: "20px" }}>
                  <label
                    style={{
                      display: "block",
                      marginBottom: "8px",
                      fontWeight: 500,
                    }}
                  >
                    Full Name
                  </label>
                  <InputText
                    name="name"
                    value={data?.name || ""}
                    onChange={handleChange}
                    placeholder="Enter full name"
                    style={{ borderRadius: "8px" }}
                  />
                </div>

                <div style={{ marginBottom: "20px" }}>
                  <label
                    style={{
                      display: "block",
                      marginBottom: "8px",
                      fontWeight: 500,
                    }}
                  >
                    Mobile Number
                  </label>
                  <InputText
                    name="mobile"
                    value={data?.mobile || ""}
                    onChange={handleChange}
                    placeholder="Enter mobile number"
                    style={{ borderRadius: "8px" }}
                  />
                </div>
              </div>
            </Col>

            {/* Account Security Section (Disabled fields) */}
            <Col xs={24} md={12}>
              <div style={{ marginBottom: "20px" }}>
                <Text strong style={{ fontSize: "16px" }}>
                  Account Details
                </Text>
                <p style={{ color: "#8c8c8c", fontSize: "12px" }}>
                  Email addresses cannot be changed once assigned.
                </p>
              </div>

              <div className="p-fluid">
                <div style={{ marginBottom: "20px" }}>
                  <label
                    style={{
                      display: "block",
                      marginBottom: "8px",
                      fontWeight: 500,
                      color: "#bfbfbf",
                    }}
                  >
                    Email Address
                  </label>
                  <InputText
                    value={data?.email || ""}
                    disabled
                    style={{ borderRadius: "8px", backgroundColor: "#f5f5f5" }}
                  />
                </div>

                <div style={{ marginBottom: "20px" }}>
                  <label
                    style={{
                      display: "block",
                      marginBottom: "8px",
                      fontWeight: 500,
                      color: "#bfbfbf",
                    }}
                  >
                    Role
                  </label>
                  <InputText
                    value="Business Development Manager"
                    disabled
                    style={{ borderRadius: "8px", backgroundColor: "#f5f5f5" }}
                  />
                </div>
              </div>
            </Col>
          </Row>

          <Divider style={{ margin: "40px 0 24px 0" }} />

          {/* Action Buttons */}
          <Box display="flex" justifyContent="flex-end">
            <Space size="middle">
              <Button
                label="Cancel"
                icon={
                  <IoCloseOutline
                    style={{ marginRight: "8px", fontSize: "18px" }}
                  />
                }
                type="button"
                className="p-button-outlined p-button-secondary"
                style={{ borderRadius: "8px", padding: "10px 24px" }}
                onClick={() => navigate("/bdm-list")}
              />
              <Button
                label={loading ? "Saving..." : "Save Changes"}
                icon={
                  !loading && (
                    <IoSaveOutline
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
                  minWidth: "160px",
                }}
              />
            </Space>
          </Box>
        </form>
      </Card>
    </Box>
  );
};

export default EditBDM;
