/** @format */

import React, { useEffect, useRef, useState } from "react";
import { Table, Space, message, Modal, Tooltip, Select, Input } from "antd";
import Button from "@mui/material/Button";
import {
  DeleteUser,
  GetUsers,
  SendReview,
  ChangeAssignedAdmin,
  ResetUserCredentials,
  GetClosestEmployees,
} from "../../services/Api/Api";
import { useNavigate } from "react-router";
import TextField from "@mui/material/TextField";
import Box from "@mui/material/Box";
import dayjs from "@/lib/dayjs";
import {
  GoogleMap,
  Marker,
  InfoWindow,
  useJsApiLoader,
} from "@react-google-maps/api";
import {
  Search,
  Download,
  Trash2,
  Plus,
  Eye,
  Pencil,
  Send,
  Mail,
  MapPin,
  KeyRound,
  RefreshCw,
} from "lucide-react";
import "./User.scss";

// 🔹 role_id -> readable label for the nearby-employees panel
const NEARBY_ROLE_LABELS = {
  9: "CLEANER",
  7: "INSPECTOR/SUPERVISOR",
  8: "QUALITY ASSURANCE TECHNICIAN",
};

const nearbyMapContainerStyle = {
  width: "100%",
  height: "420px",
};

const User = () => {
  const navigate = useNavigate();
  const [data, setData] = useState([]);
  const [userBackupData, setUserBackupData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedRowKeys, setSelectedRowKeys] = useState([]);
  const [tableParams, setTableParams] = useState({
    pagination: {
      current: 1,
      pageSize: 100,
    },
    sortField: null,
    sortOrder: null,
  });

  // 🔹 Same email/password reset modal as ServiceProvider
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [newEmail, setNewEmail] = useState("");

  const openEditModal = (record) => {
    setSelectedUser(record);
    setNewEmail(record.email);
    setEditModalVisible(true);
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

  // 🔹 Nearby employees modal (map + list)
  const [nearbyModalVisible, setNearbyModalVisible] = useState(false);
  const [nearbyLoading, setNearbyLoading] = useState(false);
  const [nearbyEmployees, setNearbyEmployees] = useState([]);
  const [nearbyClientLocation, setNearbyClientLocation] = useState(null);
  const [nearbyClient, setNearbyClient] = useState(null);
  const [selectedNearbyId, setSelectedNearbyId] = useState(null);

  const { isLoaded: isNearbyMapLoaded } = useJsApiLoader({
    googleMapsApiKey: "AIzaSyB45G8TScEmJSSG_PIzLJV2I6Ej1qgc_4o", // ✅ your real key only here
    libraries: ["maps"],
  });

  const nearbyMapRef = useRef(null);

  // Employees this far outside the client's area would force the whole map
  // to zoom out just to fit them — keep them out of the *default* view so
  // the close-by cluster stays legible. Selecting one from the list still
  // zooms straight to it (see focusOnEmployee below).
  const NEARBY_CLUSTER_THRESHOLD_MI = 2;

  const capZoom = (max) => {
    window.google.maps.event.addListenerOnce(
      nearbyMapRef.current,
      "idle",
      () => {
        if (nearbyMapRef.current.getZoom() > max) {
          nearbyMapRef.current.setZoom(max);
        }
      },
    );
  };

  // Default view: client + whichever employees are actually close by.
  const fitDefaultView = () => {
    if (!nearbyMapRef.current || !nearbyClientLocation) return;

    const closeEmployees = nearbyEmployees.filter(
      (emp) => emp.distance <= NEARBY_CLUSTER_THRESHOLD_MI,
    );
    // If literally everyone is far away, at least show the closest one
    // rather than an empty map.
    const employeesToShow =
      closeEmployees.length > 0 ? closeEmployees : nearbyEmployees.slice(0, 1);

    const bounds = new window.google.maps.LatLngBounds();
    bounds.extend({
      lat: nearbyClientLocation.address_lat,
      lng: nearbyClientLocation.address_long,
    });
    employeesToShow.forEach((emp) => {
      bounds.extend({ lat: emp.address_lat, lng: emp.address_long });
    });

    nearbyMapRef.current.fitBounds(bounds, 60);
    capZoom(18);
  };

  // Focused view: just the client + one selected employee, zoomed in tight
  // enough to clearly see both pins and judge the distance between them.
  const focusOnEmployee = (emp) => {
    if (!nearbyMapRef.current || !nearbyClientLocation || !emp) return;

    const bounds = new window.google.maps.LatLngBounds();
    bounds.extend({
      lat: nearbyClientLocation.address_lat,
      lng: nearbyClientLocation.address_long,
    });
    bounds.extend({ lat: emp.address_lat, lng: emp.address_long });

    nearbyMapRef.current.fitBounds(bounds, 80);
    capZoom(18);
  };

  const handleSelectNearbyEmployee = (emp) => {
    setSelectedNearbyId(emp.id);
    focusOnEmployee(emp);
  };

  const handleResetMapView = () => {
    setSelectedNearbyId(null);
    fitDefaultView();
  };

  // Run the default fit once the map is loaded and data has arrived.
  useEffect(() => {
    if (!isNearbyMapLoaded || !nearbyClientLocation) return;
    fitDefaultView();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isNearbyMapLoaded, nearbyClientLocation, nearbyEmployees]);

  const openNearbyEmployeesModal = async (record) => {
    setNearbyClient(record);
    setNearbyModalVisible(true);
    setNearbyLoading(true);
    setSelectedNearbyId(null);
    try {
      const res = await GetClosestEmployees(record.id);
      // Expected shape: { client: { lat, long }, employees: [{ id, name, role_id, employee_type, address, lat, long, distance }] }
      const payload = res.data.data || {};
      setNearbyClientLocation(payload.client || null);
      setNearbyEmployees(payload.employees || []);
    } catch (error) {
      console.error("Error fetching nearby employees:", error);
      message.error("Failed to fetch nearby employees");
    } finally {
      setNearbyLoading(false);
    }
  };

  const selectedNearbyEmployee = nearbyEmployees.find(
    (emp) => emp.id === selectedNearbyId,
  );

  const nearbyEmployeesColumns = [
    {
      title: "#",
      width: "8%",
      render: (_, __, index) => index + 1,
    },
    {
      title: "Name",
      dataIndex: "name",
      width: "27%",
    },
    {
      title: "Role",
      dataIndex: "role_id",
      width: "30%",
      render: (role_id) => (
        <strong>{NEARBY_ROLE_LABELS[role_id] || "-"}</strong>
      ),
    },
    {
      title: "Distance",
      dataIndex: "distance",
      width: "20%",
      sorter: (a, b) => a.distance - b.distance,
      defaultSortOrder: "ascend",
      render: (distance) => `${distance} mi`,
    },
  ];

  const handleSendReview = async (userId) => {
    try {
      const formData = new FormData();
      formData.append("user_id", userId);

      // Call your API
      const response = await SendReview(formData);

      if (response.status === 200) {
        message.success("Review email sent successfully");
      }
    } catch (error) {
      console.error("Error sending review email:", error);
      message.error("Error sending review email");
    }
  };

  const handleChangeAssignedSelect = async (userId, assigned_to) => {
    try {
      await ChangeAssignedAdmin({
        user_id: userId,
        assigned_to,
      });

      message.success("Assigned admin updated");
      getData();
    } catch (error) {
      console.error(error);
      message.error("Failed to update assigned admin");
    }
  };

  const columns = [
    {
      title: "S.No.",
      dataIndex: "index",
      width: 20,
      sorter: (a, b) => a.index - b.index,
    },
    {
      title: "Name",
      dataIndex: ["user_profile", "name"],
      sorter: (a, b) => a.user_profile.name.localeCompare(b.user_profile.name),
      width: 100,
    },
    {
      title: "Email",
      dataIndex: "email",
      width: 190,
      render: (email, record) => (
        <Space size={6} align="center">
          <span>{email}</span>
          <Tooltip title="Reset Email / Password">
            <Button
              sx={{
                minWidth: 32,
                width: 32,
                height: 32,
                color: "#FF9800",
              }}
              onClick={() => openEditModal(record)}
            >
              <KeyRound size={18} />
            </Button>
          </Tooltip>
        </Space>
      ),
    },

    {
      title: "Assigned To",
      dataIndex: "assigned_to",
      width: 160,
      render: (assigned_to, record) => {
        return (
          <Select
            value={assigned_to || undefined}
            placeholder="Assign Admin"
            style={{ width: 150 }}
            onChange={(value) => handleChangeAssignedSelect(record.id, value)}
          >
            <Select.Option value={2}>Marco Williams</Select.Option>
            <Select.Option value={5}>Yovanna C</Select.Option>
          </Select>
        );
      },
    },
    {
      title: "Account Created On",
      dataIndex: "created_at",
      width: 140,
      render: (date) => dayjs(date).format("MM/DD/YYYY HH:mm A"),
    },
    {
      title: "Action",
      dataIndex: "action",
      width: 450,
      render: (_, record) => (
        <Space size={8}>
          <Tooltip title="View Nearby Employees">
            <Button
              variant="outlined"
              sx={{
                width: 40,
                minWidth: 40,
                height: 40,
                borderRadius: "50%",
                color: "#6B7280",
                borderColor: "#6B7280",
              }}
              onClick={() => openNearbyEmployeesModal(record)}
            >
              <MapPin size={22} strokeWidth={2} />
            </Button>
          </Tooltip>

          <Tooltip title="Send Review Email">
            <Button
              variant="outlined"
              sx={{
                width: 40,
                minWidth: 40,
                height: 40,
                borderRadius: "50%",
                color: "#2563EB",
                borderColor: "#2563EB",
              }}
              onClick={() => handleSendReview(record.id)}
            >
              <Mail size={18} />
            </Button>
          </Tooltip>

          <Tooltip title="Send Quote">
            <Button
              variant="outlined"
              sx={{
                width: 40,
                minWidth: 40,
                height: 40,
                borderRadius: "50%",
                color: "#A855F7",
                borderColor: "#A855F7",
              }}
              onClick={(event) => navigateToQuote(event, record.id)}
            >
              <Send size={18} />
            </Button>
          </Tooltip>

          <Tooltip title="Edit Client">
            <Button
              variant="outlined"
              sx={{
                width: 40,
                minWidth: 40,
                height: 40,
                borderRadius: "50%",
                color: "#6366F1",
                borderColor: "#6366F1",
              }}
              onClick={(event) => navigateToEditUser(event, record.id)}
            >
              <Pencil size={18} />
            </Button>
          </Tooltip>

          <Tooltip title="View Client">
            <Button
              variant="outlined"
              sx={{
                width: 40,
                minWidth: 40,
                height: 40,
                borderRadius: "50%",
                color: "#F59E0B",
                borderColor: "#F59E0B",
              }}
              onClick={(event) => navigateToViewUser(event, record.id)}
            >
              <Eye size={18} />
            </Button>
          </Tooltip>

          <Tooltip title="Delete Client">
            <Button
              variant="outlined"
              sx={{
                width: 40,
                minWidth: 40,
                height: 40,
                borderRadius: "50%",
                color: "#EF4444",
                borderColor: "#EF4444",
              }}
              onClick={() => handleDelete([record.id])}
            >
              <Trash2 size={18} />
            </Button>
          </Tooltip>
        </Space>
      ),
    },
  ];

  const handleDelete = (userIds) => {
    Modal.confirm({
      title: "Confirm",
      content: `Are you sure you want to delete ${
        userIds.length > 1 ? "these clients" : "this client"
      }?`,
      onOk: async () => {
        try {
          await DeleteUser(userIds, localStorage.getItem("adminToken"));
          message.success("Client(s) deleted successfully");
          getData();
        } catch (error) {
          console.error("Error deleting client(s):", error);
          message.error("Error deleting client(s)");
        }
      },
    });
  };

  // Get all users
  const getData = async (params = {}) => {
    try {
      setLoading(true);
      let result = await GetUsers(localStorage.getItem("adminToken"), params);
      // Adding index for serial number
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
        .map(
          (row) =>
            `${row.id},${row.user_profile?.name},${row.email},${row.mobile}`,
        )
        .join("\n");

    const encodedURI = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedURI);
    link.setAttribute("download", "customers.csv");
    document.body.appendChild(link);
    link.click();
  };

  const navigateToAddUser = () => {
    navigate("/addUser");
  };

  const navigateToViewUser = (event, id) => {
    navigate(`/viewUser/${id}`);
  };

  const navigateToEditUser = (event, id) => {
    navigate(`/editUser/${id}`);
  };

  const navigateToQuote = (event, id) => {
    navigate(`/service-quote/${id}`);
  };

  const onSelectChange = (newSelectedRowKeys) => {
    console.log("selectedRowKeys changed: ", newSelectedRowKeys);
    setSelectedRowKeys(newSelectedRowKeys);
  };

  const rowSelection = {
    selectedRowKeys,
    onChange: onSelectChange,
    selections: [
      Table.SELECTION_ALL,
      Table.SELECTION_INVERT,
      Table.SELECTION_NONE,
      {
        key: "odd",
        text: "Select Odd Row",
        onSelect: (changeableRowKeys) => {
          let newSelectedRowKeys = [];
          newSelectedRowKeys = changeableRowKeys.filter((_, index) => {
            if (index % 2 !== 0) {
              return false;
            }
            return true;
          });
          setSelectedRowKeys(newSelectedRowKeys);
        },
      },
      {
        key: "even",
        text: "Select Even Row",
        onSelect: (changeableRowKeys) => {
          let newSelectedRowKeys = [];
          newSelectedRowKeys = changeableRowKeys.filter((_, index) => {
            if (index % 2 !== 0) {
              return true;
            }
            return false;
          });
          setSelectedRowKeys(newSelectedRowKeys);
        },
      },
    ],
  };

  return (
    <Box>
      <Box
        display="flex"
        justifyContent="space-between"
        alignItems="center"
        marginBottom="20px"
      >
        <Box>
          <h3 className="page-title">CLIENT MANAGEMENT</h3>
          <p className="page-sub-title">View, delete, and add Client</p>
        </Box>
        <Box
          display="flex"
          justifyContent="flex-end"
          alignItems="center"
          flex={1}
        >
          <Box display="flex" alignItems="center" gap={1}>
            <Input
              allowClear
              prefix={<Search size={18} />}
              placeholder="Search..."
              style={{
                width: 220,
                height: 47,
              }}
              onChange={(e) => onSearch(e.target.value)}
            />

            <Button
              variant="contained"
              color="success"
              sx={{
                minWidth: 50,
                width: 50,
                height: 50,
                ml: 1,
                borderRadius: "6px",
              }}
              onClick={exportToCSV}
            >
              <Download size={18} />
            </Button>
            <Button
              variant="contained"
              color="error"
              sx={{
                minWidth: 50,
                width: 50,
                height: 50,
                ml: 1,
                borderRadius: "6px",
              }}
              onClick={() => handleDelete(selectedRowKeys)}
              disabled={!selectedRowKeys.length}
            >
              <Trash2 size={18} />
            </Button>

            <Button
              variant="contained"
              color="primary"
              sx={{
                minWidth: 50,
                width: 50,
                height: 50,
                ml: 1,
                borderRadius: "6px",
              }}
              onClick={navigateToAddUser}
            >
              <Plus size={18} />
            </Button>
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
        scroll={{ x: 1450 }}
      />

      {editModalVisible && (
        <Modal
          title="Edit Client Email & Reset Password"
          open={editModalVisible}
          onCancel={() => setEditModalVisible(false)}
          onOk={handleResetCredentials}
          okText="Generate & Send New Password"
        >
          <p>
            <strong>Client:</strong> {selectedUser?.user_profile?.name}
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

      {nearbyModalVisible && (
        <Modal
          title={`Nearby Employees${
            nearbyClient?.user_profile?.name
              ? ` — ${nearbyClient.user_profile.name}`
              : ""
          }`}
          open={nearbyModalVisible}
          onCancel={() => setNearbyModalVisible(false)}
          footer={null}
          width={900}
        >
          <Box display="flex" style={{ gap: 16 }}>
            {/* Map panel */}
            <Box style={{ width: "48%" }}>
              <Box display="flex" justifyContent="flex-end" marginBottom="6px">
                <Tooltip title="Zoom back out to all nearby employees">
                  <Button
                    startIcon={<RefreshCw size={16} />}
                    size="small"
                    onClick={handleResetMapView}
                  >
                    Reset View
                  </Button>
                </Tooltip>
              </Box>
              {!isNearbyMapLoaded ? (
                <p style={{ textAlign: "center" }}>Loading map...</p>
              ) : (
                <GoogleMap
                  mapContainerStyle={nearbyMapContainerStyle}
                  center={
                    nearbyClientLocation
                      ? {
                          lat: nearbyClientLocation.address_lat,
                          lng: nearbyClientLocation.address_long,
                        }
                      : { lat: 0, lng: 0 }
                  }
                  zoom={nearbyClientLocation ? 15 : 2}
                  onLoad={(map) => {
                    nearbyMapRef.current = map;
                    fitDefaultView();
                  }}
                >
                  {nearbyClientLocation && (
                    <Marker
                      position={{
                        lat: nearbyClientLocation.address_lat,
                        lng: nearbyClientLocation.address_long,
                      }}
                      icon={{
                        path: window.google.maps.SymbolPath.CIRCLE,
                        scale: 12,
                        fillColor: "#1976D2",
                        fillOpacity: 1,
                        strokeColor: "#ffffff",
                        strokeWeight: 2,
                      }}
                      label={{
                        text: "C",
                        color: "#ffffff",
                        fontSize: "12px",
                        fontWeight: "bold",
                      }}
                      title={`Client — ${nearbyClientLocation.address || ""}`}
                      onClick={() => setSelectedNearbyId(null)}
                      zIndex={999}
                    />
                  )}

                  {nearbyEmployees.map((emp, index) => {
                    const isSelected = emp.id === selectedNearbyId;
                    return (
                      <Marker
                        key={emp.id}
                        position={{
                          lat: emp.address_lat,
                          lng: emp.address_long,
                        }}
                        icon={{
                          path: window.google.maps.SymbolPath.CIRCLE,
                          scale: isSelected ? 14 : 11,
                          fillColor: isSelected ? "#FB8C00" : "#2E7D32",
                          fillOpacity: 1,
                          strokeColor: "#ffffff",
                          strokeWeight: 2,
                        }}
                        label={{
                          text: `${index + 1}`,
                          color: "#ffffff",
                          fontSize: "12px",
                          fontWeight: "bold",
                        }}
                        title={`${emp.name} — ${emp.distance} mi from client`}
                        zIndex={isSelected ? 1000 : index}
                        onClick={() => handleSelectNearbyEmployee(emp)}
                      />
                    );
                  })}

                  {selectedNearbyEmployee && (
                    <InfoWindow
                      position={{
                        lat: selectedNearbyEmployee.address_lat,
                        lng: selectedNearbyEmployee.address_long,
                      }}
                      onCloseClick={() => setSelectedNearbyId(null)}
                    >
                      <div>
                        <p>
                          <strong>{selectedNearbyEmployee.name}</strong>
                        </p>
                        <p>
                          {NEARBY_ROLE_LABELS[selectedNearbyEmployee.role_id] ||
                            "-"}
                        </p>
                        <p>{selectedNearbyEmployee.address}</p>
                        <p>
                          <strong>{selectedNearbyEmployee.distance} mi</strong>{" "}
                          from client
                        </p>
                      </div>
                    </InfoWindow>
                  )}
                </GoogleMap>
              )}
            </Box>

            {/* List panel */}
            <Box style={{ width: "52%" }}>
              <Table
                columns={nearbyEmployeesColumns}
                rowKey={(record) => record.id}
                dataSource={nearbyEmployees}
                loading={nearbyLoading}
                pagination={false}
                size="small"
                locale={{ emptyText: "No nearby employees found." }}
                onRow={(record) => ({
                  onClick: () => handleSelectNearbyEmployee(record),
                  style: {
                    cursor: "pointer",
                    background:
                      record.id === selectedNearbyId ? "#fff7e6" : undefined,
                  },
                })}
              />
            </Box>
          </Box>
        </Modal>
      )}
    </Box>
  );
};

export default User;
