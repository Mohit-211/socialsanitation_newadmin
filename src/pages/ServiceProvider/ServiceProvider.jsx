/** @format */

import React, { useEffect, useState } from "react";
import { Table, Space, message, Modal, Tooltip, Select, Input } from "antd";
import Button from "@mui/material/Button";
import "./employee.css";
import {
  DeleteUser,
  GetAllDriver,
  ResetUserCredentials,
  ToggleLogoutImageRequired,
  UpdateEmployeeType,
  SendTwoWeekSchedule,
} from "../../services/Api/Api";
import { useNavigate } from "react-router";
import TextField from "@mui/material/TextField";
import Box from "@mui/material/Box";
import { GoogleMap, Marker, useJsApiLoader } from "@react-google-maps/api";
import { ref as dbRef, off } from "firebase/database";

import db from "../Chat/Firebase";
import { SearchOutlined } from "@ant-design/icons";

const ServiceProvider = () => {
  const navigate = useNavigate();
  const [data, setData] = useState([]);
  const [userBackupData, setUserBackupData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedRowKeys, setSelectedRowKeys] = useState([]);
  const [mapVisible, setMapVisible] = useState(false);
  const [selectedEmployeeId, setSelectedEmployeeId] = useState(null);
  const [employeeLocation, setEmployeeLocation] = useState(null);

  const [tableParams, setTableParams] = useState({
    pagination: {
      current: 1,
      pageSize: 100,
    },
    sortField: null,
    sortOrder: null,
  });

  // Inside ServiceProvider component
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [newEmail, setNewEmail] = useState("");

  // 🔹 Open Edit Modal (kept in case you still need email/password reset later —
  // nothing calls this right now since the pencil button navigates instead)
  const openEditModal = (record) => {
    setSelectedUser(record);
    setNewEmail(record.email);
    setEditModalVisible(true);
  };

  // 🔹 Navigate to the Edit Employee page (pencil button, now in Email column)
  const navigateToEditUser = (id) => {
    navigate(`/editEmployee/${id}`);
  };

  // 🔹 Call API to reset credentials
  const handleResetCredentials = async () => {
    if (!selectedUser) return;

    try {
      const res = await ResetUserCredentials(
        {
          user_id: selectedUser.id,
          new_email: newEmail,
        },
        localStorage.getItem("adminToken"),
      );

      message.success(res.data.message || "New credentials sent successfully!");
      setEditModalVisible(false);
      getData();
    } catch (error) {
      console.error("Reset credentials failed:", error);
      message.error(
        error?.response?.data?.message || "Failed to reset credentials",
      );
    }
  };

  const updateEmployeeType = async (user_id, type) => {
    try {
      const res = await UpdateEmployeeType(
        {
          user_id: user_id,
          employee_type: type,
        },
        localStorage.getItem("adminToken"),
      );

      message.success(res.data.message || "Employee type updated");
      getData();
    } catch (error) {
      message.error("Failed to update employee type");
    }
  };

  const handleSendSchedule = async (employee_id) => {
    try {
      await SendTwoWeekSchedule({ employee_id });

      message.success("2-week schedule sent successfully");
    } catch (error) {
      console.error(error);
      message.error(
        error?.response?.data?.message || "Failed to send schedule",
      );
    }
  };

  const columns = [
    {
      title: "S.No.",
      width: "5%",
      sorter: (a, b) => a.serialNo - b.serialNo,
      render: (_, __, index) => {
        return (
          (tableParams.pagination.current - 1) *
            tableParams.pagination.pageSize +
          index +
          1
        );
      },
    },
    {
      title: "Name",
      dataIndex: ["user_profile", "name"],
      sorter: (a, b) => a.user_profile.name.localeCompare(b.user_profile.name),
      width: "8%",
    },
    {
      title: "Email",
      dataIndex: "email",
      width: "15%",
      render: (email, record) => (
        <Space size={6} align="center">
          <span>{email}</span>
          <Tooltip title="Reset Email / Password">
            <Button
              icon="pi pi-key"
              rounded
              text
              severity="warning"
              style={{
                width: "30px",
                height: "30px",
                padding: 0,
                color: "#FF9800",
              }}
              onClick={() => openEditModal(record)}
            />
          </Tooltip>
        </Space>
      ),
    },
    {
      title: "Employee Type",
      dataIndex: "employee_type",
      width: "10%",
      render: (employee_type, record) => {
        return (
          <Select
            value={employee_type}
            style={{ width: 150 }}
            onChange={(value) => updateEmployeeType(record.id, value)}
          >
            <Select.Option value="W2_BI_WEEKLY">W2 Bi-Weekly</Select.Option>
            <Select.Option value="1099">1099 Contractor</Select.Option>
          </Select>
        );
      },
    },
    {
      title: "Type",
      dataIndex: "role_id",
      width: "10%",
      render: (role_id, record) => {
        const { sub_role_id } = record;

        if (role_id === 9) {
          if (sub_role_id === 10) return <strong>CLEANER</strong>;
          if (sub_role_id === 11) return <strong>HOUSEKEEPING</strong>;
          return <strong>CLEANER</strong>; // default label for role_id 9
        }

        const roleMap = {
          7: "INSPECTOR/SUPERVISOR",
          8: "QUALITY ASSURANCE TECHNICIAN",
        };

        return roleMap[role_id] ? <strong>{roleMap[role_id]}</strong> : "-";
      },
    },

    {
      title: "Login / Logout Image",
      width: "10%",
      dataIndex: "logout_image_required",
      render: (logout_image_required, record) => (
        <Tooltip title={logout_image_required ? "Required" : "Not Required"}>
          <Button
            icon={logout_image_required ? "pi pi-check" : "pi pi-times"}
            severity={logout_image_required ? "success" : "secondary"}
            rounded
            text
            style={{
              borderRadius: "50%",
              width: "32px",
              height: "32px",
              padding: 0,
            }}
            onClick={() => toggleLogoutImageRequirement(record.id)}
          />
        </Tooltip>
      ),
    },

    {
      title: "Action",
      dataIndex: "action",
      render: (_, record) => (
        <Space size="middle">
          <Tooltip title="Send 2-Week Schedule">
            <Button
              icon="pi pi-send"
              rounded
              outlined
              severity="success"
              style={{
                borderRadius: "50%",
                width: "32px",
                height: "32px",
                padding: 0,
              }}
              onClick={() => handleSendSchedule(record.id)}
            />
          </Tooltip>
          <Tooltip title="Edit Employee">
            <Button
              icon="pi pi-pencil"
              rounded
              outlined
              severity="warning"
              style={{
                borderRadius: "50%",
                width: "32px",
                height: "32px",
                padding: 0,
                color: "#2196F3",
                borderColor: "#2196F3",
              }}
              onClick={() => navigateToEditUser(record.id)}
            />
          </Tooltip>
          <Tooltip title="View Location">
            <Button
              icon="pi pi-map"
              severity="info"
              rounded
              outlined
              style={{
                borderRadius: "50%",
                width: "32px",
                height: "32px",
                padding: 0,
                color: "#8F00FF",
                borderColor: "#8F00FF",
              }}
              onClick={() => openLocationModal(record.id)}
            />
          </Tooltip>
          <Tooltip title="View Employee">
            <Button
              icon="pi pi-eye"
              rounded
              outlined
              style={{
                borderRadius: "50%",
                width: "32px",
                height: "32px",
                padding: 0,
                margin: "0px",
                color: "#FF9800",
                borderColor: "#FF9800",
              }}
              onClick={(event) => navigateToViewUser(event, record.id)}
            />
          </Tooltip>
          <Tooltip title="Delete Employee">
            <Button
              icon="pi pi-trash"
              rounded
              outlined
              severity="danger"
              style={{
                borderRadius: "50%",
                width: "32px",
                height: "32px",
                padding: 0,
                color: "red",
                borderColor: "red",
              }}
              onClick={() => handleDelete([record.id])}
            />
          </Tooltip>
        </Space>
      ),
    },
  ];

  const handleDelete = (userIds) => {
    Modal.confirm({
      title: "Confirm",
      content: `Are you sure you want to delete ${
        userIds.length > 1 ? "these employee" : "this employee"
      }?`,
      onOk: async () => {
        try {
          await DeleteUser(userIds, localStorage.getItem("adminToken"));
          message.success("Employee(s) deleted successfully");
          getData();
        } catch (error) {
          console.error("Error deleting employee(s):", error);
          message.error("Error deleting employee(s)");
        }
      },
    });
  };

  // Get all users
  const getData = async (params = {}) => {
    try {
      setLoading(true);
      let result = await GetAllDriver(
        localStorage.getItem("adminToken"),
        params,
      );
      const newData = result.data.data.map((item, index) => ({
        ...item,
        index: index + 1,
      }));
      setData(newData);
      setUserBackupData(newData);
    } catch (e) {
      console.log(e);
      if (e.response && e.response.status === 401) {
        navigate("/error401");
        console.log("You do not have access to this page as a sub-admin.");
      } else {
        console.log("Error loading data. Please try again later.");
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    getData({
      page: tableParams.pagination.current,
      pageSize: tableParams.pagination.pageSize,
      sortField: tableParams.sortField,
      sortOrder: tableParams.sortOrder,
    });
  }, [tableParams]);

  const handleTableChange = (pagination, filters, sorter) => {
    setTableParams({
      pagination,
      filters,
      sortField: sorter.field,
      sortOrder: sorter.order,
    });
  };

  const onSearch = (searchField) => {
    const LIST = [...userBackupData];
    const searchList = [];

    for (let i in LIST) {
      if (
        LIST[i]?.user_profile?.name
          ?.toLowerCase()
          ?.includes(searchField?.toLowerCase()) ||
        LIST[i]?.email?.toLowerCase()?.includes(searchField?.toLowerCase())
      ) {
        searchList.push(LIST[i]);
      }
    }

    setData(searchList);
  };

  const exportToCSV = () => {
    const csvContent =
      "data:text/csv;charset=utf-8," +
      "ID,Name,Email,Mobile\n" +
      data
        .map((row) => `${row.id},${row.name},${row.email},${row.mobile}`)
        .join("\n");

    const encodedURI = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedURI);
    link.setAttribute("download", "employees.csv");
    document.body.appendChild(link);
    link.click();
  };

  const navigateToAddUser = () => {
    navigate("/addEmployee");
  };

  const navigateToViewUser = (event, id) => {
    navigate(`/viewEmployee/${id}`);
  };

  const onSelectChange = (newSelectedRowKeys) => {
    setSelectedRowKeys(newSelectedRowKeys);
  };

  const rowSelection = {
    selectedRowKeys,
    onChange: onSelectChange,
  };

  const toggleLogoutImageRequirement = async (user_id) => {
    try {
      const res = await ToggleLogoutImageRequired(
        user_id,
        localStorage.getItem("adminToken"),
      );
      message.success(res.data.message || "Updated successfully");
      getData();
    } catch (error) {
      console.error("Toggle failed:", error);
      message.error(
        error?.response?.data?.message ||
          "Failed to update logout image setting",
      );
    }
  };

  const openLocationModal = (id) => {
    setSelectedEmployeeId(id);
    setMapVisible(true);
  };
  useEffect(() => {
    if (!mapVisible || !selectedEmployeeId) return;

    const locationRef = dbRef(db, `drivers/${selectedEmployeeId}/locations`);

    const handleLocationUpdate = (snapshot) => {
      const data = snapshot.val();

      if (data && data.latitude && data.longitude) {
        setEmployeeLocation({
          lat: data.latitude,
          lng: data.longitude,
        });
      } else {
        setEmployeeLocation(null); // Employee hasn't shared location
      }
    };

    return () => {
      off(locationRef); // Remove listener when component unmounts or dependency changes
    };
  }, [mapVisible, selectedEmployeeId]);

  const containerStyle = {
    width: "100%",
    height: "400px",
  };

  const MapModal = ({ position, isLoaded }) => {
    const [isOpen, setIsOpen] = useState(false);

    if (!isLoaded) return <p style={{ textAlign: "center" }}>Loading map...</p>;

    return (
      <GoogleMap
        mapContainerStyle={containerStyle}
        center={{ lat: position[0], lng: position[1] }}
        zoom={15}
      >
        <Marker
          position={{ lat: position[0], lng: position[1] }}
          onClick={() => setIsOpen(true)}
        />

        {/* {isOpen && (
					<InfoWindow
						position={{ lat: position[0], lng: position[1] }}
						onCloseClick={() => setIsOpen(false)}
					>
						<div>
							<p>
								<strong>Current Location</strong>
							</p>
							<p>Lat: {position[0]}</p>
							<p>Lng: {position[1]}</p>
						</div>
					</InfoWindow>
				)} */}
      </GoogleMap>
    );
  };

  const { isLoaded } = useJsApiLoader({
    googleMapsApiKey: "AIzaSyB45G8TScEmJSSG_PIzLJV2I6Ej1qgc_4o", // ✅ your real key only here
    libraries: ["maps"],
  });

  return (
    <Box>
      <Box
        display="flex"
        justifyContent="space-between"
        alignItems="center"
        marginBottom="20px"
      >
        <div>
          <h3 className="page-title">EMPLOYEE MANAGEMENT</h3>
          <p className="page-sub-title">View, delete, and add Employee</p>
        </div>
        <Box display="flex" justifyContent="space-between" alignItems="center">
          <Box>
            <span className="p-input-icon-left">
              <i className="pi pi-search" />
              <Input
                allowClear
                prefix={<SearchOutlined />}
                placeholder="Search..."
                style={{
                  width: 250,
                  height: "47px",
                }}
                onChange={(e) => onSearch(e.target.value)}
              />
            </span>
            <Button
              icon="pi pi-cloud-download"
              severity="success"
              style={{
                marginLeft: "10px",
                borderRadius: "5px",
                height: "47px",
              }}
              onClick={exportToCSV}
            />
            <Button
              icon="pi pi-trash"
              severity="danger"
              style={{
                marginLeft: "10px",
                borderRadius: "5px",
                height: "47px",
                cursor: "pointer",
              }}
              onClick={() => handleDelete(selectedRowKeys)}
              disabled={!selectedRowKeys.length}
            />
            <Button
              icon="pi pi-plus"
              severity="info"
              style={{
                margin: "0px 10px",
                borderRadius: "5px",
                height: "47px",
              }}
              onClick={navigateToAddUser}
            />
          </Box>
        </Box>
      </Box>
      <Table
        columns={columns}
        rowKey={(record) => record.id}
        dataSource={data}
        pagination={tableParams.pagination}
        loading={loading}
        onChange={handleTableChange}
        rowSelection={rowSelection}
      />
      {mapVisible && (
        <Modal
          title="Real-time Employee Location"
          open={mapVisible}
          onCancel={() => setMapVisible(false)}
          footer={null}
          width={600}
        >
          {employeeLocation ? (
            <MapModal
              isLoaded={isLoaded}
              position={[employeeLocation.lat, employeeLocation.lng]}
            />
          ) : (
            <p style={{ textAlign: "center", padding: 20 }}>
              This employee hasn’t allowed location sharing or has no location
              data.
            </p>
          )}
        </Modal>
      )}

      {editModalVisible && (
        <Modal
          title="Edit Employee Email & Reset Password"
          open={editModalVisible}
          onCancel={() => setEditModalVisible(false)}
          onOk={handleResetCredentials}
          okText="Generate & Send New Password"
        >
          <p>
            <strong>Employee:</strong> {selectedUser?.user_profile?.name}
          </p>
          <Input
            value={newEmail}
            onChange={(e) => setNewEmail(e.target.value)}
            placeholder="Enter new email"
            style={{
              width: "100%",
              marginTop: 10,
            }}
          />
        </Modal>
      )}
    </Box>
  );
};

export default ServiceProvider;
