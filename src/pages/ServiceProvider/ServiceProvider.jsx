import { useEffect, useState } from "react";
import { Table, Space, message, Modal, Tooltip, Select, Input } from "antd";
import Button from "@mui/material/Button";
import IconButton from "@mui/material/IconButton";
import Stack from "@mui/material/Stack";
import Paper from "@mui/material/Paper";
import Typography from "@mui/material/Typography";
import Box from "@mui/material/Box";
import "./employee.css";
import {
  DeleteUser,
  GetAllDriver,
  ResetUserCredentials,
  ToggleLogoutImageRequired,
  UpdateEmployeeType,
  ChangeEmployeeRole,
  SendTwoWeekSchedule,
} from "../../services/Api/Api";
import { useNavigate } from "react-router";
import { GoogleMap, Marker, useJsApiLoader } from "@react-google-maps/api";
import { ref as dbRef, off } from "firebase/database";
import db from "../Chat/Firebase";
import {
  Search,
  Download,
  Trash2,
  Plus,
  Eye,
  Pencil,
  Send,
  MapPin,
  KeyRound,
  Check,
  X,
} from "lucide-react";

// 🔹 Shared circular icon-button styling so every action button in the
// table stays visually consistent instead of repeating style objects.
const actionIconBtn = (color) => ({
  width: 34,
  height: 34,
  border: "1px solid",
  borderColor: color,
  color,
  "&:hover": {
    backgroundColor: `${color}14`,
    borderColor: color,
  },
});

// 🔹 Shared "pretty" address renderer: icon + street on top, muted city/state
// below, truncated with an ellipsis if too long, full text on hover.
const renderAddress = (user_address, maxWidth = 240) => {
  const address = user_address?.[0];

  if (!address) {
    return (
      <Stack direction="row" spacing={0.75} sx={{ alignItems: "center", color: "#9CA3AF" }}>
        <MapPin size={14} />
        <span style={{ fontSize: 13 }}>N/A</span>
      </Stack>
    );
  }

  const street = address?.address || "";
  const city = address?.user_city?.name || "";
  const state = address?.user_state?.name || "";
  // Older addresses predate the country field — shown as USA rather than
  // blank, consistent with how that's resolved everywhere else in the app.
  const country = address?.user_country?.name || "USA";
  const location = [city, state, country].filter(Boolean).join(", ");
  const fullAddress = [street, location].filter(Boolean).join(", ") || "N/A";

  return (
    <Tooltip title={fullAddress}>
      <Stack
        direction="row"
        spacing={0.75}
        sx={{ alignItems: "flex-start", maxWidth, cursor: "default" }}
      >
        <MapPin
          size={14}
          style={{ marginTop: 3, flexShrink: 0, color: "#9CA3AF" }}
        />
        <Box sx={{ minWidth: 0 }}>
          <Typography
            sx={{
              fontSize: "13px",
              fontWeight: 500,
              color: "#1a1a1a",
              lineHeight: 1.35,
              whiteSpace: "nowrap",
              overflow: "hidden",
              textOverflow: "ellipsis",
            }}
          >
            {street || "N/A"}
          </Typography>
          {location && (
            <Typography
              sx={{
                fontSize: "11.5px",
                color: "#9ca3af",
                lineHeight: 1.35,
                whiteSpace: "nowrap",
                overflow: "hidden",
                textOverflow: "ellipsis",
              }}
            >
              {location}
            </Typography>
          )}
        </Box>
      </Stack>
    </Tooltip>
  );
};

// 🔹 Combines role_id + sub_role_id into the single value the Role
// <Select> below uses — "7", "8", "9-10" (Cleaner), "9-11" (HouseKeeping).
const getRoleSelectValue = (role_id, sub_role_id) => {
  if (role_id === 9) {
    // Default to Cleaner if a legacy row has role_id 9 but no sub_role_id.
    return `9-${sub_role_id || 10}`;
  }

  return role_id != null ? String(role_id) : undefined;
};

const ServiceProvider = () => {
  const navigate = useNavigate();
  const [data, setData] = useState([]);
  const [userBackupData, setUserBackupData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedRowKeys, setSelectedRowKeys] = useState([]);
  const [mapVisible, setMapVisible] = useState(false);
  const [selectedEmployeeId, setSelectedEmployeeId] = useState(null);
  const [employeeLocation] = useState(null);

  // Tracks which employee row's role is mid-update so we can disable
  // just that row's Select and show a small loading state on it.
  const [updatingRoleId, setUpdatingRoleId] = useState(null);

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
    } catch {
      message.error("Failed to update employee type");
    }
  };

  // 🔹 Instant role change — mirrors updateEmployeeType above, but hits
  // the dedicated /change-employee-role/:id endpoint instead of the full
  // employee-update endpoint, since promoting/reassigning someone doesn't
  // need a hiring form or location on hand.
  const handleRoleChange = async (user_id, value) => {
    let role_id;
    let sub_role_id = null;

    if (String(value).includes("-")) {
      const [role, subRole] = String(value).split("-");

      role_id = parseInt(role, 10);
      sub_role_id = parseInt(subRole, 10);
    } else {
      role_id = parseInt(value, 10);
    }

    try {
      setUpdatingRoleId(user_id);

      const res = await ChangeEmployeeRole(user_id, {
        role_id,
        sub_role_id,
      });

      message.success(res?.data?.message || "Employee role updated");
      getData();
    } catch (error) {
      console.error("Failed to update role:", error);
      message.error(
        error?.response?.data?.message || "Failed to update employee role",
      );
    } finally {
      setUpdatingRoleId(null);
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
      width: 60,
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
      width: 150,
      render: (name) => (
        <Tooltip title={name}>
          <span
            style={{
              fontWeight: 500,
              whiteSpace: "nowrap",
              overflow: "hidden",
              textOverflow: "ellipsis",
              display: "block",
              maxWidth: 130,
            }}
          >
            {name}
          </span>
        </Tooltip>
      ),
    },
    {
      title: "Email",
      dataIndex: "email",
      width: 230,
      render: (email, record) => (
        <Space size={6} align="center">
          <Tooltip title={email}>
            <span
              style={{
                whiteSpace: "nowrap",
                overflow: "hidden",
                textOverflow: "ellipsis",
                display: "inline-block",
                maxWidth: 175,
                verticalAlign: "middle",
              }}
            >
              {email}
            </span>
          </Tooltip>
          <Tooltip title="Reset Email / Password">
            <IconButton
              size="small"
              sx={{ color: "#FF9800", flexShrink: 0 }}
              onClick={() => openEditModal(record)}
            >
              <KeyRound size={16} />
            </IconButton>
          </Tooltip>
        </Space>
      ),
    },
    {
      title: "Employee Type",
      dataIndex: "employee_type",
      width: 170,
      render: (employee_type, record) => {
        return (
          <Select
            value={employee_type || undefined}
            placeholder="Select type"
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
      // 🔹 Previously a plain read-only label. Now an instant-update Select,
      // same interaction pattern as Employee Type above — pick a new role
      // and it saves immediately via handleRoleChange, no separate save step.
      title: "Role",
      dataIndex: "role_id",
      width: 200,
      render: (role_id, record) => {
        const value = getRoleSelectValue(role_id, record.sub_role_id);

        return (
          <Select
            value={value}
            placeholder="Select role"
            style={{ width: 190 }}
            loading={updatingRoleId === record.id}
            disabled={updatingRoleId === record.id}
            onChange={(newValue) => handleRoleChange(record.id, newValue)}
          >
            <Select.Option value="7">Inspector / Supervisor</Select.Option>
            <Select.Option value="8">
              Quality Assurance Technician
            </Select.Option>
            <Select.Option value="9-10">Cleaner</Select.Option>
            <Select.Option value="9-11">HouseKeeping</Select.Option>
          </Select>
        );
      },
    },
    {
      title: "Login / Logout Image",
      width: 150,
      dataIndex: "logout_image_required",
      render: (logout_image_required, record) => (
        <Tooltip title={logout_image_required ? "Required" : "Not Required"}>
          <IconButton
            size="small"
            sx={actionIconBtn(logout_image_required ? "#2E7D32" : "#9CA3AF")}
            onClick={() => toggleLogoutImageRequirement(record.id)}
          >
            {logout_image_required ? <Check size={16} /> : <X size={16} />}
          </IconButton>
        </Tooltip>
      ),
    },
    {
      title: "Address",
      dataIndex: "user_address",
      width: 260,
      render: (user_address) => renderAddress(user_address, 230),
    },
    {
      title: "Action",
      dataIndex: "action",
      width: 220,
      render: (_, record) => (
        <Stack useFlexGap sx={{ flexWrap: "nowrap" }} direction="row" spacing={1}>
          <Tooltip title="Send 2-Week Schedule">
            <IconButton
              size="small"
              sx={actionIconBtn("#2E7D32")}
              onClick={() => handleSendSchedule(record.id)}
            >
              <Send size={16} />
            </IconButton>
          </Tooltip>
          <Tooltip title="Edit Employee">
            <IconButton
              size="small"
              sx={actionIconBtn("#2196F3")}
              onClick={() => navigateToEditUser(record.id)}
            >
              <Pencil size={16} />
            </IconButton>
          </Tooltip>
          <Tooltip title="View Location">
            <IconButton
              size="small"
              sx={actionIconBtn("#8F00FF")}
              onClick={() => openLocationModal(record.id)}
            >
              <MapPin size={16} />
            </IconButton>
          </Tooltip>
          <Tooltip title="View Employee">
            <IconButton
              size="small"
              sx={actionIconBtn("#FF9800")}
              onClick={(event) => navigateToViewUser(event, record.id)}
            >
              <Eye size={16} />
            </IconButton>
          </Tooltip>
          <Tooltip title="Delete Employee">
            <IconButton
              size="small"
              sx={actionIconBtn("#EF4444")}
              onClick={() => handleDelete([record.id])}
            >
              <Trash2 size={16} />
            </IconButton>
          </Tooltip>
        </Stack>
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
      console.error(e);
      if (e.response && e.response.status === 401) {
        navigate("/error401");
        console.error("You do not have access to this page as a sub-admin.");
      } else {
        console.error("Error loading data. Please try again later.");
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
    const searchValue = searchField?.trim().toLowerCase();

    if (!searchValue) {
      setData(userBackupData);
      return;
    }

    const searchList = userBackupData.filter((employee) => {
      const name = employee?.user_profile?.name?.toLowerCase() || "";

      const email = employee?.email?.toLowerCase() || "";

      // user_address is an ARRAY
      const addresses = employee?.user_address || [];

      const addressSearchText = addresses
        .map((userAddress) => {
          const address = userAddress?.address?.toLowerCase() || "";

          const state = userAddress?.user_state?.name?.toLowerCase() || "";

          const city = userAddress?.user_city?.name?.toLowerCase() || "";

          // Same USA fallback as renderAddress, so searching "usa" finds
          // legacy addresses that predate the country field too.
          const country =
            userAddress?.user_country?.name?.toLowerCase() || "usa";

          return `${address} ${state} ${city} ${country}`;
        })
        .join(" ");

      return (
        name.includes(searchValue) ||
        email.includes(searchValue) ||
        addressSearchText.includes(searchValue)
      );
    });

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

    return () => {
      off(locationRef); // Remove listener when component unmounts or dependency changes
    };
  }, [mapVisible, selectedEmployeeId]);

  const containerStyle = {
    width: "100%",
    height: "400px",
  };

  const MapModal = ({ position, isLoaded }) => {

    if (!isLoaded) return <p style={{ textAlign: "center" }}>Loading map...</p>;

    return (
      <GoogleMap
        mapContainerStyle={containerStyle}
        center={{ lat: position[0], lng: position[1] }}
        zoom={15}
      >
        <Marker
          position={{ lat: position[0], lng: position[1] }}
        />

      </GoogleMap>
    );
  };

  const { isLoaded } = useJsApiLoader({
    googleMapsApiKey: "AIzaSyB45G8TScEmJSSG_PIzLJV2I6Ej1qgc_4o", // ✅ your real key only here
    libraries: ["maps"],
  });

  return (
    <Box>
      <Paper
        variant="outlined"
        sx={{
          p: 2.5,
          mb: 3,
          borderRadius: "10px",
          borderColor: "#eef0f2",
        }}
      >
        <Stack
          direction="row"
          spacing={2}
          useFlexGap
          sx={{ justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", width: "100%" }}
        >
          {/* Left */}
          <Box>
            <Typography className="page-title">EMPLOYEE MANAGEMENT</Typography>
            <Typography className="page-sub-title">
              View, delete, and add Employee
            </Typography>
          </Box>

          {/* Right */}
          <Stack
            direction="row"
            spacing={1.5}
            useFlexGap
            sx={{
              ml: "auto",
              alignItems: "center",
              flexWrap: { xs: "wrap", md: "nowrap" },
            }}
          >
            <Input
              allowClear
              prefix={<Search size={18} color="#9CA3AF" />}
              placeholder="Search by name, email, address, or country..."
              style={{
                width: 260,
                height: 44,
              }}
              onChange={(e) => onSearch(e.target.value)}
            />

            <Tooltip title="Export CSV">
              <Button
                variant="contained"
                color="success"
                sx={{
                  minWidth: 46,
                  width: 46,
                  height: 46,
                  borderRadius: "8px",
                }}
                onClick={exportToCSV}
              >
                <Download size={18} />
              </Button>
            </Tooltip>

            <Tooltip title="Delete Selected">
              <span>
                <Button
                  variant="contained"
                  color="error"
                  disabled={!selectedRowKeys.length}
                  onClick={() => handleDelete(selectedRowKeys)}
                  sx={{
                    minWidth: 46,
                    width: 46,
                    height: 46,
                    borderRadius: "8px",
                  }}
                >
                  <Trash2 size={18} />
                </Button>
              </span>
            </Tooltip>

            <Tooltip title="Add Employee">
              <Button
                variant="contained"
                color="primary"
                onClick={navigateToAddUser}
                sx={{
                  minWidth: 46,
                  width: 46,
                  height: 46,
                  borderRadius: "8px",
                }}
              >
                <Plus size={18} />
              </Button>
            </Tooltip>
          </Stack>
        </Stack>
      </Paper>

      <Table
        columns={columns}
        rowKey={(record) => record.id}
        dataSource={data}
        pagination={tableParams.pagination}
        loading={loading}
        onChange={handleTableChange}
        rowSelection={rowSelection}
        bordered
        size="middle"
        scroll={{ x: 1420 }}
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
              This employee hasn't allowed location sharing or has no location
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
            style={{ width: "100%", marginTop: 10 }}
          />
        </Modal>
      )}
    </Box>
  );
};

export default ServiceProvider;