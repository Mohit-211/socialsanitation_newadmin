import { useLayoutEffect, useState } from "react";
import {
  GetAllUsers,
  GetUserByBDMId,
  AssignUser,
} from "@/services/api/bdmApi";
import { useNavigate, useParams } from "react-router";
import {
  Select,
  Button,
  Form,
  message,
  Flex,
  Divider,
} from "antd";
import { ArrowLeft, Users, CircleCheck } from "lucide-react";
import PageHeader from "@/components/PageHeader";
import "./BdmsPage.scss";

const AssignBdmPage = () => {
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
        .catch(() => {
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
    } catch {
      message.error("Failed to assign users.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <PageHeader
        title="BDM MANAGEMENT"
        subtitle="Select one or multiple clients to link with this manager"
        actions={
          <Button
            size="large"
            icon={<ArrowLeft size={16} />}
            onClick={() => navigate("/bdm-list")}
          >
            Return to BDM List
          </Button>
        }
      />

      <div className="surface bdm-form">
        {/* Intro banner */}
        <div className="bdm-banner">
          <span className="bdm-banner__icon">
            <Users size={18} />
          </span>
          <div className="bdm-banner__body">
            <p className="bdm-banner__title">Selection Menu</p>
            <p className="bdm-banner__text">
              Users currently selected: <strong>{selectedUsers.length}</strong>
            </p>
          </div>
        </div>

        <Form layout="vertical" form={form} onFinish={handleAssignUsers}>
          <Form.Item label="Available Users" name="user_id">
            <Select
              mode="multiple"
              placeholder="Search and select users..."
              labelInValue
              value={selectedUsers}
              onChange={handleSelectionChange}
              style={{ width: "100%" }}
              size="large"
              allowClear
              showSearch
              optionFilterProp="label"
              options={userData.map((user) => ({
                value: user.id,
                label: user.name,
              }))}
              optionRender={(option) => (
                <span className="bdm-assign__option">
                  <span className="bdm-assign__avatar">
                    {option.data.label?.charAt(0)}
                  </span>
                  {option.data.label}
                </span>
              )}
            />
          </Form.Item>

          <Divider style={{ margin: "var(--space-5) 0 var(--space-4)" }} />

          <Flex justify="flex-end" gap="middle" wrap>
            <Button size="large" onClick={() => navigate("/bdm-list")}>
              Cancel
            </Button>
            <Button
              type="primary"
              htmlType="submit"
              size="large"
              loading={loading}
              icon={<CircleCheck size={16} />}
            >
              Save Assignments
            </Button>
          </Flex>
        </Form>
      </div>
    </div>
  );
};

export default AssignBdmPage;
