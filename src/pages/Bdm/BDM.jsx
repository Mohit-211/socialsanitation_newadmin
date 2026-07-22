/** @format */

import React, { useEffect, useState } from "react";
import { Table, Space, message, Modal, Tooltip, Typography } from "antd";
import Button from "@mui/material/Button";
import { useNavigate } from "react-router";
import TextField from "@mui/material/TextField";
import Box from "@mui/material/Box";
import Card from "@mui/material/Card";
import { GetAllBDMS, DeleteBDM, GetUserByBDMId } from "../../services/Api/bdm";
import {
  IoArrowForwardCircleOutline,
  IoEyeOutline,
  IoPersonAddOutline,
  IoPencilOutline,
  IoTrashOutline,
  IoAddOutline,
} from "react-icons/io5";

const { Text, Title } = Typography;

const BDM = () => {
  const navigate = useNavigate();
  const [data, setData] = useState([]);
  const [userBackupData, setUserBackupData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedRowKeys, setSelectedRowKeys] = useState([]);
  const [userdData, setUserData] = useState([]);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [tableParams, setTableParams] = useState({
    pagination: { current: 1, pageSize: 10 },
  });

  const columns = [
    {
      title: "S.No.",
      dataIndex: "index",
      width: "80px",
      align: "center",
      render: (text) => <Text strong>{text}</Text>,
    },
    {
      title: "Name",
      dataIndex: "name",
      sorter: (a, b) => a.name.localeCompare(b.name),
      render: (name) => <Text style={{ fontWeight: 600 }}>{name}</Text>,
    },
    {
      title: "Email Address",
      dataIndex: "email",
      render: (email) => <Text type="secondary">{email}</Text>,
    },
    {
      title: "Action",
      key: "action",
      width: "450px",
      render: (_, record) => (
        <Space size="small">
          <Button
            label="View"
            icon={<IoEyeOutline style={{ marginRight: "5px" }} />}
            className="p-button-sm p-button-outlined"
            style={{ borderRadius: "6px", fontSize: "12px" }}
            onClick={() => {
              getUserData(record.id);
              setIsModalVisible(true);
            }}
          />
          <Button
            label="Assign"
            icon={<IoPersonAddOutline style={{ marginRight: "5px" }} />}
            className="p-button-sm p-button-success p-button-outlined"
            style={{ borderRadius: "6px", fontSize: "12px" }}
            onClick={(event) => navigateToViewUser(event, record.id)}
          />
          <Button
            label="Edit"
            icon={<IoPencilOutline style={{ marginRight: "5px" }} />}
            className="p-button-sm p-button-warning p-button-outlined"
            style={{ borderRadius: "6px", fontSize: "12px" }}
            onClick={() => navigate(`/edit-bdm/${record.id}`)}
          />
          <Button
            label="Delete"
            icon={<IoTrashOutline style={{ marginRight: "5px" }} />}
            className="p-button-sm p-button-danger p-button-outlined"
            style={{ borderRadius: "6px", fontSize: "12px" }}
            onClick={() => handleDelete([record.id])}
          />
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
  }, []);

  const onSearch = (searchField) => {
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
    <Box p={3}>
      <Card
        elevation={0}
        style={{
          padding: "20px",
          borderRadius: "12px",
          border: "1px solid #f0f0f0",
        }}
      >
        <Box
          display="flex"
          justifyContent="space-between"
          alignItems="center"
          mb={3}
        >
          <div>
            <Title level={3} style={{ margin: 0 }}>
              BDM MANAGEMENT
            </Title>
            <Text type="secondary">
              View, delete, and add Business Development Managers
            </Text>
          </div>

          <Space size="middle">
            <span className="p-input-icon-left">
              <i className="pi pi-search" />
              <InputText
                type="search"
                onChange={(e) => onSearch(e.target.value)}
                placeholder="Search name or email..."
                style={{ borderRadius: "8px", width: "250px" }}
              />
            </span>

            {/* Multi-Delete Button: Appears only when rows are selected */}
            <Button
              label={`Delete Selected (${selectedRowKeys.length})`}
              icon={<IoTrashOutline style={{ marginRight: "8px" }} />}
              severity="danger"
              style={{
                borderRadius: "8px",
                display: selectedRowKeys.length > 0 ? "inline-flex" : "none",
              }}
              onClick={() => handleDelete(selectedRowKeys)}
            />

            <Button
              label="Add New BDM"
              icon={<IoAddOutline style={{ marginRight: "8px" }} />}
              severity="info"
              style={{ borderRadius: "8px" }}
              onClick={() => navigate("/add-bdm")}
            />
          </Space>
        </Box>

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
        />
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
                <IoArrowForwardCircleOutline
                  style={{
                    fontSize: "24px",
                    cursor: "pointer",
                    color: "#2196F3",
                  }}
                  onClick={() => navigate(`/viewUser/${record.user_id}`)}
                />
              ),
            },
          ]}
          dataSource={userdData}
          rowKey={(record) => record.id}
          pagination={false}
        />
      </Modal>
    </Box>
  );
};

export default BDM;
