import { useEffect, useState } from "react";
import {
  Table,
  Space,
  message,
  Modal,
  Tooltip,
  Select,
  Input,
  Button,
} from "antd";
import PageHeader from "@/components/PageHeader";
import IconAction from "@/components/IconAction";
import { GOOGLE_MAPS_API_KEY } from "@/config/env";
import "./EmployeesPage.scss";
import { DeleteUser, GetAllDriver, ResetUserCredentials, ToggleLogoutImageRequired, UpdateEmployeeType, ChangeEmployeeRole, SendTwoWeekSchedule } from "@/services/api/userApi";
import { useNavigate } from "react-router";
import { GoogleMap, Marker, useJsApiLoader } from "@react-google-maps/api";
import { ref as dbRef, off } from "firebase/database";
import db from "@/lib/firebase";
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

// 🔹 Shared "pretty" address renderer: icon + street on top, muted city/state
// below, truncated with an ellipsis if too long, full text on hover.
const renderAddress = (user_address, maxWidth = 240) => {
  const address = user_address?.[0];

  if (!address) {
    return (
      <div className="employee-list__address employee-list__address--empty">
        <MapPin size={14} />
        <span>N/A</span>
      </div>
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
      <div className="employee-list__address" style={{ maxWidth }}>
        <MapPin size={14} className="employee-list__address-icon" />
        <div className="employee-list__address-text">
          <p className="employee-list__address-street">{street || "N/A"}</p>
          {location && (
            <p className="employee-list__address-location">{location}</p>
          )}
        </div>
      </div>
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

const EmployeesPage = () => {
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

  // Email / password reset modal
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [newEmail, setNewEmail] = useState("");

  // 🔹 Open the reset email/password modal (key button in the actions column)
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
          <span className="employee-list__name">{name}</span>
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
            <span className="employee-list__email">{email}</span>
          </Tooltip>
          <Tooltip title="Reset Email / Password">
            <Button
              type="text"
              size="small"
              className="employee-list__reset"
              aria-label="Reset Email / Password"
              icon={
                <KeyRound size={16} color="var(--color-warning-strong)" />
              }
              onClick={() => openEditModal(record)}
            />
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
        <IconAction
          icon={logout_image_required ? Check : X}
          title={logout_image_required ? "Required" : "Not Required"}
          className={
            logout_image_required
              ? "employee-list__toggle employee-list__toggle--on"
              : "employee-list__toggle"
          }
          onClick={() => toggleLogoutImageRequirement(record.id)}
        />
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
        <div className="employee-list__actions">
          <IconAction
            icon={Send}
            title="Send 2-Week Schedule"
            onClick={() => handleSendSchedule(record.id)}
          />
          <IconAction
            icon={Pencil}
            title="Edit Employee"
            onClick={() => navigateToEditUser(record.id)}
          />
          <IconAction
            icon={MapPin}
            title="View Location"
            onClick={() => openLocationModal(record.id)}
          />
          <IconAction
            icon={Eye}
            title="View Employee"
            onClick={(event) => navigateToViewUser(event, record.id)}
          />
          <IconAction
            icon={Trash2}
            title="Delete Employee"
            danger
            onClick={() => handleDelete([record.id])}
          />
        </div>
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
    googleMapsApiKey: GOOGLE_MAPS_API_KEY,
    libraries: ["maps"],
  });

  return (
    <div>
      <PageHeader
        title="EMPLOYEE MANAGEMENT"
        subtitle="View, delete, and add Employee"
        actions={
          <>
            <Input
              allowClear
              size="large"
              className="employee-list__search"
              prefix={<Search size={18} color="var(--color-text-subtle)" />}
              placeholder="Search by name, email, address, or country..."
              onChange={(e) => onSearch(e.target.value)}
            />

            <Tooltip title="Export CSV">
              <Button
                size="large"
                aria-label="Export CSV"
                icon={<Download size={18} />}
                onClick={exportToCSV}
              />
            </Tooltip>

            <Tooltip title="Delete Selected">
              <span className="employee-list__tooltip-target">
                <Button
                  type="primary"
                  danger
                  size="large"
                  aria-label="Delete Selected"
                  icon={<Trash2 size={18} />}
                  disabled={!selectedRowKeys.length}
                  onClick={() => handleDelete(selectedRowKeys)}
                />
              </span>
            </Tooltip>

            <Tooltip title="Add Employee">
              <Button
                type="primary"
                size="large"
                aria-label="Add Employee"
                icon={<Plus size={18} />}
                onClick={navigateToAddUser}
              />
            </Tooltip>
          </>
        }
      />

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
    </div>
  );
};

export default EmployeesPage;