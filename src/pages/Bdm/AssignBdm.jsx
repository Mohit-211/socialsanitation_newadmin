/** @format */

import React, { useLayoutEffect, useState } from "react";
import {
  GetAllUsers,
  GetUserByBDMId,
  AssignUser,
} from "../../services/Api/bdm";
import { useNavigate, useParams } from "react-router";
import Box from "@mui/material/Box";
import Paper from "@mui/material/Paper";
import MuiButton from "@mui/material/Button";
import Typography from "@mui/material/Typography";
import {
  Select,
  Button,
  Form,
  message,
  Space,
  Divider,
} from "antd";
import { ArrowLeft, Users, CheckCircle2 } from "lucide-react";

const { Option } = Select;

const AssignBdm = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [userData, setUserData] = useState([]);
  const [selectedUsers, setSelectedUsers] = useState([]);
  const [assignedUsers, setAssignedUsers] = useState([]);
  const [removeUserIds, setRemoveUserIds] = useState([]);
  const [loading, setLoading] = useState(false);
  const [form] = Form.useForm();

  useLayoutEffect(() => {
    if (id) {
      GetUserByBDMId(id)
        .then((res) => {
          const data = res.data.data;
          const assignedUsersList = data.map((user) => ({
            value: user.user_id,
            label: user.user_bdm.user_profile.name,
          }));
          setAssignedUsers(assignedUsersList);
          setSelectedUsers(assignedUsersList);
          form.setFieldsValue({ user_id: assignedUsersList });
        })
        .catch((err) => {
          message.error("Error loading assigned users.");
        });
    }
  }, [id, form]);

  useLayoutEffect(() => {
    GetAllUsers()
      .then((res) => {
        setUserData(res.data.data);
      })
      .catch((err) => console.error(err));
  }, []);

  const handleSelectionChange = (value) => {
    const selectedIds = value.map((user) => user.value);
    const assignedIds = assignedUsers.map((user) => user.value);
    const removedUsers = assignedIds.filter((id) => !selectedIds.includes(id));

    setSelectedUsers(value);
    setRemoveUserIds(removedUsers);
  };

  const handleAssignUsers = async () => {
    setLoading(true);
    try {
      const selectedUserIds = selectedUsers.map((user) => user.value);
      const payload = {
        bdm_id: id,
        user_id: selectedUserIds,
        remove_user_id: removeUserIds,
      };

      const response = await AssignUser(payload);
      message.success(response.data.message || "Users assigned successfully!");
      navigate("/bdm-list");
    } catch (error) {
      message.error("Failed to assign users.");
    } finally {
      setLoading(false);
    }
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
              Select one or multiple clients to link with this manager
            </Typography>
          </Box>

          <MuiButton
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
          </MuiButton>
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
            <Users size={18} />
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
              Selection Menu
            </Typography>
            <Typography
              sx={{
                fontSize: "12px",
                color: "#4338ca",
                lineHeight: 1.4,
                mt: 0.25,
              }}
            >
              Users currently selected: <strong>{selectedUsers.length}</strong>
            </Typography>
          </Box>
        </Box>

        <Form layout="vertical" form={form} onFinish={handleAssignUsers}>
          <Form.Item
            label={
              <span style={{ fontSize: "13px", fontWeight: 600, color: "#374151" }}>
                Available Users
              </span>
            }
            name="user_id"
          >
            <Select
              mode="multiple"
              placeholder="Search and select users..."
              labelInValue
              value={selectedUsers}
              onChange={handleSelectionChange}
              style={{ width: "100%" }}
              size="large"
              allowClear
              dropdownStyle={{ borderRadius: "8px" }}
            >
              {userData.map((user) => (
                <Option key={user.id} value={user.id}>
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "8px",
                    }}
                  >
                    <div
                      style={{
                        width: "24px",
                        height: "24px",
                        borderRadius: "50%",
                        backgroundColor: "#f0f2f5",
                        textAlign: "center",
                        fontSize: "11px",
                        lineHeight: "24px",
                      }}
                    >
                      {user.name.charAt(0)}
                    </div>
                    {user.name}
                  </div>
                </Option>
              ))}
            </Select>
          </Form.Item>

          <Divider sx={{ mt: 2.5, mb: 2 }} />

          <Box display="flex" justifyContent="flex-end">
            <Space size="middle">
              <Button
                size="large"
                onClick={() => navigate("/bdm-list")}
                style={{
                  borderRadius: "8px",
                  width: "120px",
                  backgroundColor: "#6b7280",
                  color: "#ffffff",
                  border: "none",
                  fontWeight: 600,
                }}
              >
                Cancel
              </Button>
              <Button
                type="primary"
                htmlType="submit"
                size="large"
                loading={loading}
                icon={<CheckCircle2 size={16} style={{ marginBottom: -2 }} />}
                style={{
                  borderRadius: "8px",
                  backgroundColor: "#3b82f6",
                  display: "flex",
                  alignItems: "center",
                  gap: "8px",
                  minWidth: "180px",
                  justifyContent: "center",
                  fontWeight: 600,
                }}
              >
                Save Assignments
              </Button>
            </Space>
          </Box>
        </Form>
      </Paper>
    </Box>
  );
};

export default AssignBdm;