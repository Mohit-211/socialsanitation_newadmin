/** @format */

import React, { useLayoutEffect, useState } from "react";
import {
  GetAllUsers,
  GetUserByBDMId,
  AssignUser,
} from "../../services/Api/bdm";
import { useNavigate, useParams } from "react-router";
import Box from "@mui/material/Box";
import Card from "@mui/material/Card";
import {
  Select,
  Button,
  Form,
  message,
  Typography,
  Space,
  Divider,
} from "antd";
import {
  IoArrowBackOutline,
  IoPersonAddOutline,
  IoPeopleOutline,
  IoCheckmarkDoneCircleOutline,
} from "react-icons/io5";

const { Option } = Select;
const { Title, Text } = Typography;

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
            Assign Users to BDM
          </Title>
          <Text type="secondary">
            Select one or multiple users to link with this Manager
          </Text>
        </div>
        <Button
          type="text"
          icon={<IoArrowBackOutline />}
          onClick={() => navigate("/bdm-list")}
          style={{
            fontSize: "14px",
            display: "flex",
            alignItems: "center",
            gap: "8px",
          }}
        >
          Back to List
        </Button>
      </Box>

      <Card
        elevation={0}
        style={{
          borderRadius: "12px",
          border: "1px solid #f0f0f0",
          overflow: "visible",
        }}
      >
        <div style={{ padding: "30px" }}>
          <Box display="flex" alignItems="center" mb={3}>
            <div
              style={{
                backgroundColor: "#e6f7ff",
                padding: "10px",
                borderRadius: "10px",
                marginRight: "15px",
                display: "flex",
                alignItems: "center",
                color: "#1890ff",
              }}
            >
              <IoPeopleOutline size={24} />
            </div>
            <div>
              <Text strong style={{ fontSize: "16px" }}>
                Selection Menu
              </Text>
              <br />
              <Text type="secondary" style={{ fontSize: "12px" }}>
                Users currently selected: <b>{selectedUsers.length}</b>
              </Text>
            </div>
          </Box>

          <Divider />

          <Form layout="vertical" form={form} onFinish={handleAssignUsers}>
            <Form.Item
              label={<span style={{ fontWeight: 600 }}>Available Users</span>}
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
                // Custom styling for the dropdown selection
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

            <Box mt={5} display="flex" justifyContent="flex-end">
              <Space size="middle">
                <Button
                  size="large"
                  onClick={() => navigate("/bdm-list")}
                  style={{ borderRadius: "8px", width: "120px" }}
                >
                  Cancel
                </Button>
                <Button
                  type="primary"
                  htmlType="submit"
                  size="large"
                  loading={loading}
                  icon={
                    <IoCheckmarkDoneCircleOutline
                      style={{ fontSize: "18px" }}
                    />
                  }
                  style={{
                    borderRadius: "8px",
                    backgroundColor: "#1890ff",
                    display: "flex",
                    alignItems: "center",
                    gap: "8px",
                    minWidth: "180px",
                    justifyContent: "center",
                  }}
                >
                  Save Assignments
                </Button>
              </Space>
            </Box>
          </Form>
        </div>
      </Card>
    </Box>
  );
};

export default AssignBdm;
