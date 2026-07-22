
import React, { useEffect, useState } from "react";
import { Table, Space, message, Modal, Input } from "antd";
import Button from "@mui/material/Button";
import Box from "@mui/material/Box";
import Card from "@mui/material/Card";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import { useNavigate } from "react-router";
import { GetAllBDMS, DeleteBDM, GetUserByBDMId } from "../../services/Api/bdm";
import {
  ArrowUpRight,
  Eye,
  UserPlus,
  Pencil,
  Trash2,
  Plus,
  Search,
} from "lucide-react";
import "./BDM.scss";

const BDM = () => {
  const navigate = useNavigate();
  const [data, setData] = useState([]);
  const [userBackupData, setUserBackupData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedRowKeys, setSelectedRowKeys] = useState([]);
  const [userdData, setUserData] = useState([]);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [tableParams, setTableParams] = useState({
    pagination: { current: 1, pageSize: 10 },
  });

  const actionButtonBase = {
    borderRadius: "6px",
    fontSize: "12px",
    fontWeight: 600,
    textTransform: "none",
    boxShadow: "none",
  };

  const columns = [
    {
      title: "S.No.",
      dataIndex: "index",
      width: 80,
      align: "center",
    },
    {
      title: "Name",
      dataIndex: "name",
      sorter: (a, b) => a.name.localeCompare(b.name),
      render: (name) => <span style={{ fontWeight: 600 }}>{name}</span>,
    },
    {
      title: "Email Address",
      dataIndex: "email",
      render: (email) => <span style={{ color: "#6b7280" }}>{email}</span>,
    },
    {
      title: "Action",
      key: "action",
      width: 460,
      render: (_, record) => (
        <Space size="small" wrap>
          <Button
            variant="outlined"
            size="small"
            startIcon={<Eye size={14} />}
            sx={{
              ...actionButtonBase,
              color: "#1677ff",
              borderColor: "#1677ff",
              "&:hover": { borderColor: "#1677ff", background: "#f0f7ff" },
            }}
            onClick={() => {
              getUserData(record.id);
              setIsModalVisible(true);
            }}
          >
            View
          </Button>
          <Button
            variant="outlined"
            size="small"
            startIcon={<UserPlus size={14} />}
            sx={{
              ...actionButtonBase,
              color: "#16a34a",
              borderColor: "#16a34a",
              "&:hover": { borderColor: "#16a34a", background: "#f0fdf4" },
            }}
            onClick={(event) => navigateToViewUser(event, record.id)}
          >
            Assign
          </Button>
          <Button
            variant="outlined"
            size="small"
            startIcon={<Pencil size={14} />}
            sx={{
              ...actionButtonBase,
              color: "#f59e0b",
              borderColor: "#f59e0b",
              "&:hover": { borderColor: "#f59e0b", background: "#fffbeb" },
            }}
            onClick={() => navigate(`/edit-bdm/${record.id}`)}
          >
            Edit
          </Button>
          <Button
            variant="contained"
            size="small"
            startIcon={<Trash2 size={14} />}
            sx={{
              ...actionButtonBase,
              background: "#ef4444",
              "&:hover": { background: "#dc2626" },
            }}
            onClick={() => handleDelete([record.id])}
          >
            Delete
          </Button>
        </Space>
      ),
    },
  ];

  const handleDelete = (userIds) => {
    Modal.confirm({
      title: "Confirm Deletion",
      content: `Are you sure you want to delete ${
        userIds.length > 1 ? "the selected BDMs" : "this BDM"
      }?`,
      okText: "Yes, Delete",
      okType: "danger",
      cancelText: "No",
      onOk: async () => {
        try {
          await DeleteBDM(userIds, localStorage.getItem("adminToken"));
          message.success("Deleted successfully");
          setSelectedRowKeys([]);
          getData();
        } catch (error) {
          message.error("Error deleting record(s)");
        }
      },
    });
  };

  const getData = async (params = {}) => {
    try {
      setLoading(true);
      let result = await GetAllBDMS(localStorage.getItem("adminToken"), params);
      const newData = result.data.data.map((item, index) => ({
        ...item,
        index: index + 1,
      }));
      setData(newData);
      setUserBackupData(newData);
    } catch (e) {
      if (e.response?.status === 401) navigate("/error401");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    getData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const onSearch = (searchField) => {
    setSearchTerm(searchField);
    const filtered = userBackupData.filter(
      (item) =>
        item?.name?.toLowerCase().includes(searchField.toLowerCase()) ||
        item?.email?.toLowerCase().includes(searchField.toLowerCase())
    );
    setData(filtered);
  };

  const navigateToViewUser = (event, id) => {
    navigate(`/assign/${id}`);
  };

  const onSelectChange = (newSelectedRowKeys) => {
    setSelectedRowKeys(newSelectedRowKeys);
  };

  const getUserData = async (id) => {
    try {
      let result = await GetUserByBDMId(id);
      const dataWithIndex = result.data.data.map((item, index) => ({
        ...item,
        autoIncrementId: index + 1,
      }));
      setUserData(dataWithIndex);
    } catch (e) {
      console.log(e);
    }
  };

  return (
    <Box className="bdm-page" p={{ xs: 1.5, sm: 3 }}>
      <Card
        elevation={0}
        className="bdm-card"
        sx={{
          p: { xs: 2, sm: 2.5 },
          borderRadius: "12px",
          border: "1px solid #f0f0f0",
        }}
      >
        <Stack
          direction="row"
          spacing={2}
          sx={{
            justifyContent: "space-between",
            alignItems: "flex-start",
            flexWrap: "wrap",
            mb: 3,
          }}
        >
          <Box>
            <Typography className="page-title">BDM MANAGEMENT</Typography>
            <Typography className="page-sub-title">
              View, delete, and add Business Development Managers
            </Typography>
          </Box>

          <Stack
            direction="row"
            spacing={1.5}
            useFlexGap
            sx={{ alignItems: "center", flexWrap: "wrap" }}
          >
            <Input
              allowClear
              prefix={<Search size={18} color="#9CA3AF" />}
              placeholder="Search name or email..."
              style={{ width: 260, height: 44, borderRadius: 8 }}
              value={searchTerm}
              onChange={(e) => onSearch(e.target.value)}
            />

            {selectedRowKeys.length > 0 && (
              <Button
                variant="contained"
                startIcon={<Trash2 size={16} />}
                sx={{
                  borderRadius: "8px",
                  height: 44,
                  textTransform: "none",
                  fontWeight: 600,
                  background: "#ef4444",
                  "&:hover": { background: "#dc2626" },
                }}
                onClick={() => handleDelete(selectedRowKeys)}
              >
                Delete Selected ({selectedRowKeys.length})
              </Button>
            )}

            <Button
              variant="contained"
              startIcon={<Plus size={18} />}
              sx={{
                borderRadius: "8px",
                height: 44,
                whiteSpace: "nowrap",
                textTransform: "none",
                fontWeight: 600,
              }}
              onClick={() => navigate("/add-bdm")}
            >
              Add New BDM
            </Button>
          </Stack>
        </Stack>

        <div style={{ overflowX: "auto" }}>
          <Table
            columns={columns}
            rowKey={(record) => record.id}
            dataSource={data}
            pagination={{ ...tableParams.pagination, showSizeChanger: true }}
            loading={loading}
            //   rowSelection={{
            //     selectedRowKeys,
            //     onChange: onSelectChange,
            //   }}
            className="custom-table"
            scroll={{ x: "max-content" }}
          />
        </div>
      </Card>

      <Modal
        centered
        width={700}
        title="Shared User Details"
        open={isModalVisible}
        onCancel={() => setIsModalVisible(false)}
        footer={null}
      >
        <Table
          columns={[
            {
              title: "User Name",
              dataIndex: ["user_bdm", "user_profile", "name"],
              key: "user_name",
            },
            {
              title: "Email",
              dataIndex: ["user_bdm", "email"],
              key: "user_email",
            },
            {
              title: "View",
              key: "redirect",
              align: "center",
              render: (text, record) => (
                <ArrowUpRight
                  size={20}
                  style={{ cursor: "pointer", color: "#2196F3" }}
                  onClick={() => navigate(`/viewUser/${record.user_id}`)}
                />
              ),
            },
          ]}
          dataSource={userdData}
          rowKey={(record) => record.id}
          pagination={false}
          scroll={{ x: "max-content" }}
        />
      </Modal>
    </Box>
  );
};

export default BDM;