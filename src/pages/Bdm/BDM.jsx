import { useEffect, useState } from "react";
import { Button, Table, Space, message, Modal, Input } from "antd";
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
import PageHeader from "../../components/PageHeader";
import IconAction from "../../components/IconAction";
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
  const [tableParams] = useState({
    pagination: { current: 1, pageSize: 10 },
  });

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
      render: (name) => (
        <span style={{ fontWeight: "var(--font-weight-semibold)" }}>{name}</span>
      ),
    },
    {
      title: "Email Address",
      dataIndex: "email",
      render: (email) => <span className="text-muted">{email}</span>,
    },
    {
      title: "Action",
      key: "action",
      width: 460,
      render: (_, record) => (
        <Space size="small" wrap>
          <Button
            size="small"
            className="bdm-action bdm-action--view"
            icon={<Eye size={14} />}
            onClick={() => {
              getUserData(record.id);
              setIsModalVisible(true);
            }}
          >
            View
          </Button>
          <Button
            size="small"
            className="bdm-action bdm-action--assign"
            icon={<UserPlus size={14} />}
            onClick={(event) => navigateToViewUser(event, record.id)}
          >
            Assign
          </Button>
          <Button
            size="small"
            className="bdm-action bdm-action--edit"
            icon={<Pencil size={14} />}
            onClick={() => navigate(`/edit-bdm/${record.id}`)}
          >
            Edit
          </Button>
          <Button
            type="primary"
            danger
            size="small"
            className="bdm-action"
            icon={<Trash2 size={14} />}
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
        } catch {
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

  const getUserData = async (id) => {
    try {
      let result = await GetUserByBDMId(id);
      const dataWithIndex = result.data.data.map((item, index) => ({
        ...item,
        autoIncrementId: index + 1,
      }));
      setUserData(dataWithIndex);
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <div className="bdm-page">
      <PageHeader
        className="bdm-page__header"
        title="BDM MANAGEMENT"
        subtitle="View, delete, and add Business Development Managers"
        actions={
          <>
            <Input
              allowClear
              size="large"
              className="bdm-page__search"
              prefix={<Search size={16} className="text-subtle" />}
              placeholder="Search name or email..."
              value={searchTerm}
              onChange={(e) => onSearch(e.target.value)}
            />

            {selectedRowKeys.length > 0 && (
              <Button
                type="primary"
                danger
                size="large"
                icon={<Trash2 size={16} />}
                onClick={() => handleDelete(selectedRowKeys)}
              >
                Delete Selected ({selectedRowKeys.length})
              </Button>
            )}

            <Button
              type="primary"
              size="large"
              icon={<Plus size={16} />}
              onClick={() => navigate("/add-bdm")}
            >
              Add New BDM
            </Button>
          </>
        }
      />

      <div style={{ overflowX: "auto" }}>
        <Table
          columns={columns}
          rowKey={(record) => record.id}
          dataSource={data}
          pagination={{ ...tableParams.pagination, showSizeChanger: true }}
          loading={loading}
          className="custom-table"
          bordered
          size="middle"
          scroll={{ x: "max-content" }}
        />
      </div>

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
                <IconAction
                  icon={ArrowUpRight}
                  title="View User"
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
    </div>
  );
};

export default BDM;
