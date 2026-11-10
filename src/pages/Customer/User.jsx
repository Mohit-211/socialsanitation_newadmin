import { useEffect, useMemo, useRef, useState } from "react";
import {
  Table,
  Space,
  message,
  Modal,
  Tooltip,
  Select,
  Input,
  Button,
  Divider,
  Flex,
} from "antd";
import {
  DeleteUser,
  GetUsers,
  SendReview,
  ChangeAssignedAdmin,
  ResetUserCredentials,
  GetClosestEmployees,
} from "../../services/Api/Api";
import { useNavigate } from "react-router";
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
  User as UserIcon,
  Navigation,
  ClipboardList,
} from "lucide-react";
import PageHeader from "../../components/PageHeader";
import IconAction from "../../components/IconAction";
import { GOOGLE_MAPS_API_KEY } from "../../config/google";
import { cssVar } from "../../theme/antdTheme";
import "./Customers.css";
import "./User.scss";

// 🔹 role_id -> readable label for the nearby-employees panel
const NEARBY_ROLE_LABELS = {
  9: "CLEANER",
  7: "INSPECTOR/SUPERVISOR",
  8: "QUALITY ASSURANCE TECHNICIAN",
};

// Google Maps needs real color values, so the tokens are resolved at runtime.
const getNearbyMarkerColors = () => ({
  client: cssVar("--color-primary-strong"),
  employee: cssVar("--color-success-strong"),
  selected: cssVar("--color-warning"),
  stroke: cssVar("--color-bg"),
  label: cssVar("--color-text-inverse"),
  selectedLabel: cssVar("--color-on-primary"),
});

// 🔹 Shared "pretty" address renderer: icon + street on top, muted city/state
// below, truncated with an ellipsis if too long, full text on hover.
const renderAddress = (user_address, maxWidth = 220) => {
  const address = user_address?.[0];

  if (!address) {
    return (
      <span className="client-list__address client-list__address--empty">
        <MapPin size={14} />
        <span>N/A</span>
      </span>
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
      <div className="client-list__address" style={{ maxWidth }}>
        <MapPin size={14} className="client-list__address-icon" />
        <div className="client-list__address-text">
          <div className="client-list__address-street">{street || "N/A"}</div>
          {location && (
            <div className="client-list__address-location">{location}</div>
          )}
        </div>
      </div>
    </Tooltip>
  );
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

  const navigateToInspections = (event, record) => {
    navigate(`/clientInspections/${record.id}`, {
      state: { clientName: record.user_profile?.name },
    });
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
    googleMapsApiKey: GOOGLE_MAPS_API_KEY,
    libraries: ["maps"],
  });

  const nearbyMapRef = useRef(null);
  const markerColors = useMemo(() => getNearbyMarkerColors(), []);

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
      width: 50,
      align: "center",
      render: (_, __, index) => (
        <span className="customer-nearby__index">{index + 1}</span>
      ),
    },
    {
      title: "Name",
      dataIndex: "name",
      width: "30%",
      render: (name) => <span className="customer-nearby__medium">{name}</span>,
    },
    {
      title: "Role",
      dataIndex: "role_id",
      width: 220,
      render: (role_id) => (
        <strong className="customer-nearby__role">
          {NEARBY_ROLE_LABELS[role_id] || "-"}
        </strong>
      ),
    },
    {
      title: "Distance",
      dataIndex: "distance",
      width: 110,
      align: "right",
      sorter: (a, b) => a.distance - b.distance,
      defaultSortOrder: "ascend",
      render: (distance) => (
        <span className="customer-nearby__medium">{distance} mi</span>
      ),
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
      width: 60,
      sorter: (a, b) => a.index - b.index,
    },
    {
      title: "Name",
      dataIndex: ["user_profile", "name"],
      sorter: (a, b) => a.user_profile.name.localeCompare(b.user_profile.name),
      width: 150,
      render: (name) => (
        <Tooltip title={name}>
          <span className="client-list__name">{name}</span>
        </Tooltip>
      ),
    },
    {
      title: "Email",
      dataIndex: "email",
      width: 220,
      render: (email, record) => (
        <Space size={6} align="center">
          <Tooltip title={email}>
            <span className="client-list__email">{email}</span>
          </Tooltip>
          <IconAction
            icon={KeyRound}
            title="Reset Email / Password"
            size="small"
            iconSize={14}
            onClick={() => openEditModal(record)}
          />
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
            allowClear
            onChange={(value) => handleChangeAssignedSelect(record.id, value)}
          >
            <Select.Option value={2}>Marco Williams</Select.Option>
            <Select.Option value={5}>Yovanna C</Select.Option>
          </Select>
        );
      },
    },
    {
      title: "Address",
      dataIndex: "user_address",
      width: 260,
      render: (user_address) => renderAddress(user_address, 230),
    },
    {
      title: "Account Created On",
      dataIndex: "created_at",
      width: 170,
      render: (date) => dayjs(date).format("MM/DD/YYYY HH:mm A"),
    },
    {
      title: "Action",
      dataIndex: "action",
      width: 300,
      render: (_, record) => (
        <Flex gap={8}>
          <IconAction
            icon={MapPin}
            title="View Nearby Employees"
            onClick={() => openNearbyEmployeesModal(record)}
          />
          <IconAction
            icon={ClipboardList}
            title="Inspections"
            onClick={(event) => navigateToInspections(event, record)}
          />
          <IconAction
            icon={Mail}
            title="Send Review Email"
            onClick={() => handleSendReview(record.id)}
          />
          <IconAction
            icon={Send}
            title="Send Quote"
            onClick={(event) => navigateToQuote(event, record.id)}
          />
          <IconAction
            icon={Pencil}
            title="Edit Client"
            onClick={(event) => navigateToEditUser(event, record.id)}
          />
          <IconAction
            icon={Eye}
            title="View Client"
            onClick={(event) => navigateToViewUser(event, record.id)}
          />
          <IconAction
            icon={Trash2}
            title="Delete Client"
            danger
            onClick={() => handleDelete([record.id])}
          />
        </Flex>
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

    const searchList = userBackupData.filter((client) => {
      const name = client?.user_profile?.name?.toLowerCase() || "";

      const email = client?.email?.toLowerCase() || "";

      const addresses = client?.user_address || [];

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
          const newSelectedRowKeys = changeableRowKeys.filter((_, index) => {
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
          const newSelectedRowKeys = changeableRowKeys.filter((_, index) => {
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
    <div>
      <PageHeader
        title="CLIENT MANAGEMENT"
        subtitle="View, delete, and add Client"
        actions={
          <>
            <Input
              allowClear
              size="large"
              prefix={<Search size={16} className="text-subtle" />}
              placeholder="Search by name, email, address, or country..."
              style={{ width: 260 }}
              onChange={(e) => onSearch(e.target.value)}
            />

            <Tooltip title="Export CSV">
              <Button
                size="large"
                icon={<Download size={18} />}
                aria-label="Export CSV"
                onClick={exportToCSV}
              />
            </Tooltip>

            <Tooltip title="Delete Selected">
              <span className="client-list__tooltip-wrap">
                <Button
                  size="large"
                  type="primary"
                  danger
                  icon={<Trash2 size={18} />}
                  aria-label="Delete Selected"
                  disabled={!selectedRowKeys.length}
                  onClick={() => handleDelete(selectedRowKeys)}
                />
              </span>
            </Tooltip>

            <Tooltip title="Add Client">
              <Button
                size="large"
                type="primary"
                icon={<Plus size={18} />}
                aria-label="Add Client"
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
        scroll={{ x: 1420 }}
        size="middle"
      />

      {/* Reset Email / Password modal                                      */}
      {editModalVisible && (
        <Modal
          title={
            <div className="customer-modal-title">
              <span className="customer-modal-title__icon customer-modal-title__icon--warning">
                <KeyRound size={17} />
              </span>
              <span className="customer-modal-title__text">
                Edit Client Email &amp; Reset Password
              </span>
            </div>
          }
          open={editModalVisible}
          onCancel={() => setEditModalVisible(false)}
          onOk={handleResetCredentials}
          okText="Generate & Send New Password"
          width={460}
        >
          <Divider className="customer-modal-divider" />

          <div className="client-list__client-card">
            <span className="client-list__client-avatar">
              <UserIcon size={18} />
            </span>
            <div className="client-list__client-info">
              <div className="client-list__client-eyebrow">Client</div>
              <div className="client-list__client-name">
                {selectedUser?.user_profile?.name || "—"}
              </div>
            </div>
          </div>

          <label
            htmlFor="client-new-email"
            className="field-label client-list__field-label"
          >
            New Email Address
          </label>
          <Input
            id="client-new-email"
            value={newEmail}
            onChange={(e) => setNewEmail(e.target.value)}
            placeholder="Enter new email"
            size="large"
            style={{ width: "100%" }}
          />
          <p className="client-list__hint">
            A new temporary password will be generated and emailed to this
            client along with their updated login email.
          </p>
        </Modal>
      )}

      {/* Nearby Employees modal (map + list) — redesigned                   */}
      {nearbyModalVisible && (
        <Modal
          title={
            <div className="customer-modal-title">
              <span className="customer-modal-title__icon customer-modal-title__icon--neutral">
                <MapPin size={17} />
              </span>
              <div>
                <div className="customer-modal-title__text">Nearby Employees</div>
                {nearbyClient?.user_profile?.name && (
                  <div className="customer-modal-title__sub">
                    For {nearbyClient.user_profile.name}
                  </div>
                )}
              </div>
            </div>
          }
          open={nearbyModalVisible}
          onCancel={() => setNearbyModalVisible(false)}
          footer={null}
          width={900}
        >
          <Divider className="customer-modal-divider" />

          {/* Map Controls Row (Aligned at top) */}
          <div className="customer-nearby__bar">
            <div className="customer-nearby__controls">
              <p className="customer-nearby__hint">
                <Navigation size={14} />
                Client & closest employees
              </p>
              <Tooltip title="Zoom back out to all nearby employees">
                <Button
                  type="link"
                  size="small"
                  className="customer-nearby__reset"
                  icon={<RefreshCw size={14} />}
                  onClick={handleResetMapView}
                >
                  Reset View
                </Button>
              </Tooltip>
            </div>

            <p className="customer-nearby__hint">
              {nearbyEmployees.length > 0
                ? `${nearbyEmployees.length} employee${
                    nearbyEmployees.length > 1 ? "s" : ""
                  } found`
                : "Closest employees"}
            </p>
          </div>

          {/* Content Grid Row */}
          <div className="customer-nearby__panels">
            {/* Map Panel */}
            <div className="customer-nearby__panel">
              {!isNearbyMapLoaded ? (
                <div className="customer-nearby__loading">Loading map...</div>
              ) : (
                <GoogleMap
                  mapContainerStyle={{ width: "100%", height: "100%" }}
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
                        fillColor: markerColors.client,
                        fillOpacity: 1,
                        strokeColor: markerColors.stroke,
                        strokeWeight: 2,
                      }}
                      label={{
                        text: "C",
                        color: markerColors.label,
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
                          fillColor: isSelected
                            ? markerColors.selected
                            : markerColors.employee,
                          fillOpacity: 1,
                          strokeColor: markerColors.stroke,
                          strokeWeight: 2,
                        }}
                        label={{
                          text: `${index + 1}`,
                          color: isSelected
                            ? markerColors.selectedLabel
                            : markerColors.label,
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
            </div>

            {/* List Panel */}
            <div className="customer-nearby__panel customer-nearby__panel--list">
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
                      record.id === selectedNearbyId
                        ? "var(--color-warning-subtle)"
                        : undefined,
                  },
                })}
              />
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};

export default User;
