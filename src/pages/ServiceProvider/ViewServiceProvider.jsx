

import dayjs from "@/lib/dayjs";
import React, { useEffect, useLayoutEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  GetUserById,
  StateAPI,
  CityAPI,
  AddNewUserAddress,
  EditAddress,
  DeleteUserAddress,
} from "../../services/Api/Api";
import { GetBookingBySPId } from "../../services/Api/BookingApi";
import { BASE_URL_IMAGE } from "../../services/Host";
import Attendance from "../Attendance/Attendance";
import "../Customer/Customers.css";

// MUI Components
import {
  Box,
  Paper,
  Typography,
  Button,
  Card,
  Stack,
  IconButton,
  Tooltip,
  Divider,
} from "@mui/material";

// Ant Design Components
import {
  Table,
  Tag,
  Image,
  Tabs,
  Modal,
  Form,
  Input,
  Select,
  message,
} from "antd";

// Icons
import {
  IoArrowForwardCircleOutline,
  IoLocationOutline,
} from "react-icons/io5";
import {
  ArrowLeft,
  Plus,
  Pencil,
  Trash2,
  MapPin,
  ClipboardList,
  Wrench,
  UserCog,
  Clock3,
} from "lucide-react";

// 🔹 Employee type value -> readable label
const EMPLOYEE_TYPE_LABELS = {
  W2_BI_WEEKLY: "W2 Bi-Weekly",
  1099: "1099 Contractor",
};

// =========================================================
// COUNTRIES
// =========================================================

const COUNTRY_IDS = {
  USA: 233,
  CANADA: 39,
};

// =========================================================
// GENERIC "COMING SOON" COMPONENT
// =========================================================

const ComingSoon = ({ icon, label }) => (
  <Card
    variant="outlined"
    sx={{
      p: 2.5,
      borderRadius: "10px",
      borderColor: "#eef0f2",
      boxShadow: "none",
    }}
  >
    <Box
      sx={{
        textAlign: "center",
        padding: "60px 20px",
        color: "#9ca3af",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        gap: 1.5,
      }}
    >
      {icon}

      <Typography
        sx={{
          fontSize: "1rem",
          fontWeight: 600,
          color: "#6b7280",
        }}
      >
        {label}
      </Typography>

      <Typography
        sx={{
          fontSize: "0.875rem",
          color: "#9ca3af",
        }}
      >
        Coming soon
      </Typography>
    </Box>
  </Card>
);

const ViewServiceProvider = () => {
  const navigate = useNavigate();
  const { id } = useParams();

  const [userData, setUserData] = useState(null);
  const [bookingData, setBookingData] = useState([]);
  const [activeTab, setActiveTab] = useState("all");
  const [mainTab, setMainTab] = useState("overview");

  /* ---------------------------------------------------------------- */
  /* Address: state                                                   */
  /* ---------------------------------------------------------------- */

  const [addressModalVisible, setAddressModalVisible] =
    useState(false);

  const [editingAddress, setEditingAddress] =
    useState(null);

  const [addressForm] = Form.useForm();

  const [states, setStates] = useState([]);
  const [cities, setCities] = useState([]);

  const [addressCoordinates, setAddressCoordinates] =
    useState({
      lat: null,
      lng: null,
    });

  // Employees may only ever have a single address on file.
  const hasAddress =
    (userData?.user_address?.length || 0) >= 1;

  /* ---------------------------------------------------------------- */
  /* Refresh user                                                     */
  /* ---------------------------------------------------------------- */

  const refreshUser = () => {
    GetUserById(id)
      .then((res) => {
        setUserData(res.data.data);
      })
      .catch((err) => {
        console.log("error", err);
      });
  };

  useLayoutEffect(() => {
    refreshUser();

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  /* ---------------------------------------------------------------- */
  /* Address: states / cities / geocoding                             */
  /* ---------------------------------------------------------------- */

  // =========================================================
  // FETCH STATES FOR SELECTED COUNTRY
  // =========================================================

  const fetchStatesForCountry = (countryId) => {
    return StateAPI(countryId)
      .then((res) => {
        const stateList =
          res?.data?.data?.all_state || [];

        setStates(stateList);

        return stateList;
      })
      .catch((err) => {
        console.log(err);
        setStates([]);
        return [];
      });
  };

  // =========================================================
  // PREFETCH USA STATES
  // =========================================================

  useEffect(() => {
    fetchStatesForCountry(COUNTRY_IDS.USA);

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // =========================================================
  // FETCH CITIES
  // =========================================================

  const fetchCities = (stateId) => {
    return CityAPI(stateId).then((res) => {
      const citiesList =
        res?.data?.data?.all_city || [];

      setCities(citiesList);

      return citiesList;
    });
  };

  // =========================================================
  // GEOCODE ADDRESS
  // =========================================================

  const fetchAddressCoordinates = async (address) => {
    if (!address) return;

    try {
      const res = await fetch(
        `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(
          address,
        )}&key=AIzaSyB45G8TScEmJSSG_PIzLJV2I6Ej1qgc_4o`,
      );

      const data = await res.json();

      if (data.status === "OK") {
        const location =
          data.results[0]?.geometry?.location;

        if (!location) return;

        setAddressCoordinates({
          lat: location.lat,
          lng: location.lng,
        });
      }
    } catch (err) {
      console.log(err);
    }
  };

  // =========================================================
  // OPEN ADD ADDRESS
  // =========================================================

  const openAddAddress = () => {
    if (hasAddress) return;

    setEditingAddress(null);

    addressForm.resetFields();

    // Default country = USA
    addressForm.setFieldsValue({
      country_id: COUNTRY_IDS.USA,
    });

    // Load USA states
    fetchStatesForCountry(COUNTRY_IDS.USA);

    setCities([]);

    setAddressCoordinates({
      lat: null,
      lng: null,
    });

    setAddressModalVisible(true);
  };

  // =========================================================
  // OPEN EDIT ADDRESS
  // =========================================================

  const openEditAddress = (addr) => {
    setEditingAddress(addr);

    setAddressModalVisible(true);

    // Existing rows created before country_id existed
    // are treated as USA.
    const addressCountryId =
      Number(addr.country_id) || COUNTRY_IDS.USA;

    setTimeout(() => {
      addressForm.resetFields();

      addressForm.setFieldsValue({
        address: addr.address,
        country_id: addressCountryId,
        state_id: addr.state_id,
      });

      setAddressCoordinates({
        lat: addr.address_lat,
        lng: addr.address_long,
      });

      // Load states for the existing country first.
      fetchStatesForCountry(addressCountryId).then(() => {
        addressForm.setFieldsValue({
          state_id: addr.state_id,
        });
      });

      // Then load cities for the existing state.
      if (addr.state_id) {
        fetchCities(addr.state_id).then(() => {
          addressForm.setFieldsValue({
            city_id: addr.city_id,
          });
        });
      } else {
        setCities([]);
      }

      if (addr.address) {
        const existingCountry =
          addressCountryId === COUNTRY_IDS.CANADA
            ? "Canada"
            : "USA";

        const existingState =
          addr.user_state?.name || "";

        const existingCity =
          addr.user_city?.name || "";

        const fullAddress = [
          addr.address,
          existingCity,
          existingState,
          existingCountry,
        ]
          .filter(Boolean)
          .join(", ");

        fetchAddressCoordinates(fullAddress);
      }
    }, 100);
  };

  // =========================================================
  // SAVE ADDRESS
  // =========================================================

  const handleSaveAddress = async () => {
    try {
      const values =
        await addressForm.validateFields();

      if (
        addressCoordinates.lat === null ||
        addressCoordinates.lng === null
      ) {
        message.error(
          "Unable to get address coordinates",
        );

        return;
      }

      const basePayload = {
        address: values.address,

        country_id: values.country_id,

        state_id: values.state_id,

        city_id: values.city_id,

        address_lat:
          addressCoordinates.lat,

        address_long:
          addressCoordinates.lng,
      };

      if (editingAddress) {
        await EditAddress({
          user_address_id: editingAddress.id,
          ...basePayload,
        });

        message.success("Address updated");
      } else {
        await AddNewUserAddress({
          user_id: id,
          ...basePayload,
        });

        message.success("Address added");
      }

      await refreshUser();

      setAddressModalVisible(false);

      setEditingAddress(null);

      addressForm.resetFields();

      setCities([]);

      setAddressCoordinates({
        lat: null,
        lng: null,
      });
    } catch (err) {
      console.error(
        "Error saving address:",
        err,
      );

      // Ant Design validation error
      if (err?.errorFields) {
        return;
      }

      message.error(
        err?.response?.data?.message ||
          "Failed to save address",
      );
    }
  };

  // =========================================================
  // DELETE ADDRESS
  // =========================================================

  const handleDeleteAddress = (addressId) => {
    Modal.confirm({
      title: "Delete Address",

      content:
        "Are you sure you want to delete this address?",

      okText: "Delete",

      okType: "danger",

      onOk: async () => {
        try {
          await DeleteUserAddress(addressId);

          message.success(
            "Address deleted successfully",
          );

          refreshUser();
        } catch (error) {
          console.error(error);

          message.error(
            "Failed to delete address",
          );
        }
      },
    });
  };

  /* ---------------------------------------------------------------- */
  /* Booking                                                           */
  /* ---------------------------------------------------------------- */

  const getData = async (booking_status) => {
    try {
      const formData = {
        id: id,
        booking_status,
      };

      let result =
        await GetBookingBySPId(formData);

      const dataWithIndex =
        result.data.data.map(
          (item, index) => ({
            ...item,
            autoIncrementId: index + 1,
          }),
        );

      setBookingData(dataWithIndex);
    } catch (e) {
      console.log(e);
    }
  };

  useEffect(() => {
    getData("all");
  }, [id]);

  const navigateToUser = () => {
    navigate("/employees");
  };

  const tabsContent = [
    {
      label: "All",
      key: "all",
    },
    {
      label: "Ongoing",
      key: "ONGOING",
    },
    {
      label: "Upcoming",
      key: "UPCOMING",
    },
    {
      label: "Completed",
      key: "COMPLETED",
    },
  ];

  const getStatusColor = (status) => {
    switch (status) {
      case "DELETED":
      case "REJECTED":
        return "red";

      case "SUCCESS":
      case "COMPLETED":
        return "green";

      case "ACCEPTED":
        return "purple";

      case "PENDING":
        return "yellow";

      default:
        return "geekblue";
    }
  };

  const columns = [
    {
      title: "ID",
      dataIndex: "autoIncrementId",
      key: "id",
    },

    {
      title: "Booking ID",
      dataIndex: [
        "employee_details_booking",
        "booking_unique_id",
      ],
      key: "booking_id",
    },

    {
      title: "Service",
      dataIndex: [
        "employee_details_booking",
        "service_booking",
        "name",
      ],
      key: "service",
    },

    {
      title: "Date",
      dataIndex: "date",
      key: "date",
      width: "10%",
      render: (date) =>
        dayjs(date).format("MM/DD/YYYY"),
    },

    {
      title: "User's Name",
      dataIndex: [
        "employee_details_booking",
        "booking_user",
        "user_profile",
        "name",
      ],
      key: "users",
    },

    {
      title: "Status",
      dataIndex: [
        "employee_details_booking",
        "booking_status",
      ],
      key: "status",

      render: (status) => {
        const color =
          getStatusColor(status);

        return (
          <Tag color={color}>
            {status === "SUCCESS"
              ? "COMPLETED"
              : status?.toUpperCase()}
          </Tag>
        );
      },
    },

    {
      title: "Service Start Time",
      dataIndex: [
        "employee_details_booking",
        "start_time",
      ],
      key: "start_time",

      render: (time) =>
        time
          ? new Date(time).toLocaleString()
          : "---",
    },

    {
      title: "Service End Time",
      dataIndex: [
        "employee_details_booking",
        "end_time",
      ],
      key: "end_time",

      render: (time) =>
        time
          ? new Date(time).toLocaleString()
          : "---",
    },

    {
      title: "",
      key: "redirect",

      render: (text, record) => (
        <IoArrowForwardCircleOutline
          style={{
            fontSize: "20px",
            cursor: "pointer",
          }}
          className="redirect_button"
          onClick={() =>
            navigate(
              `/viewBooking/${record.id}`,
            )
          }
        />
      ),
    },
  ];

  const handleTabSelect = (key) => {
    setActiveTab(key);
    getData(key);
  };

  const employeeTypeLabel =
    EMPLOYEE_TYPE_LABELS[
      userData?.employee_type
    ] ||
    userData?.employee_type ||
    "---";

  /* ---------------------------------------------------------------- */
  /* Overview tab content                                               */
  /* ---------------------------------------------------------------- */

  const overviewContent = (
    <Box
      sx={{
        display: "flex",
        flexDirection: "column",
        gap: 2.5,
      }}
    >
      {/* Employee Details Header Card */}

      <Box
        sx={{
          display: "flex",
          gap: 2.5,
          alignItems: "stretch",
        }}
      >
        {/* Optional Profile Image Preview */}

        {userData?.user_attachments?.length >
          0 &&
          userData.user_attachments[0]
            .file_type === "Image" && (
            <Card
              variant="outlined"
              sx={{
                width: "180px",
                p: 2,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                borderRadius: "10px",
                borderColor: "#eef0f2",
                boxShadow: "none",
              }}
            >
              <Image
                src={`${BASE_URL_IMAGE}${userData.user_attachments[0].file_name}`}
                alt="User Profile"
                crossOrigin="anonymous"
                preview={true}
                style={{
                  width: "130px",
                  height: "130px",
                  borderRadius: "50%",
                  objectFit: "cover",
                }}
              />
            </Card>
          )}

        {/* Info Card */}

        <Card
          variant="outlined"
          sx={{
            width: "100%",
            p: 2.5,
            borderRadius: "10px",
            borderColor: "#eef0f2",
            boxShadow: "none",
          }}
        >
          <Box
            sx={{
              display: "grid",
              gridTemplateColumns: {
                xs: "1fr",
                sm: "repeat(4, 1fr)",
              },
              gap: 3,
            }}
          >
            <Box>
              <Typography
                sx={{
                  fontWeight: 700,
                  fontSize: "0.95rem",
                  color: "#111827",
                  mb: 0.5,
                }}
              >
                Employee's Name:
              </Typography>

              <Typography
                sx={{
                  color: "#4b5563",
                  fontSize: "0.95rem",
                }}
              >
                {userData?.user_profile?.name ||
                  "---"}
              </Typography>
            </Box>

            <Box>
              <Typography
                sx={{
                  fontWeight: 700,
                  fontSize: "0.95rem",
                  color: "#111827",
                  mb: 0.5,
                }}
              >
                Email
              </Typography>

              <Typography
                sx={{
                  color: "#4b5563",
                  fontSize: "0.95rem",
                }}
              >
                {userData?.email || "---"}
              </Typography>
            </Box>

            <Box>
              <Typography
                sx={{
                  fontWeight: 700,
                  fontSize: "0.95rem",
                  color: "#111827",
                  mb: 0.5,
                }}
              >
                Mobile:
              </Typography>

              <Typography
                sx={{
                  color: "#4b5563",
                  fontSize: "0.95rem",
                }}
              >
                {userData?.user_profile?.mobile ||
                  "---"}
              </Typography>
            </Box>

            <Box>
              <Typography
                sx={{
                  fontWeight: 700,
                  fontSize: "0.95rem",
                  color: "#111827",
                  mb: 0.5,
                }}
              >
                Employee Type:
              </Typography>

              <Typography
                sx={{
                  color: "#4b5563",
                  fontSize: "0.95rem",
                }}
              >
                {employeeTypeLabel}
              </Typography>
            </Box>
          </Box>
        </Card>
      </Box>

      {/* Employee Address Card */}

      <Card
        variant="outlined"
        sx={{
          p: 2.5,
          borderRadius: "10px",
          borderColor: "#eef0f2",
          boxShadow: "none",
        }}
      >
        <Box
          sx={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            mb: 2.5,
            flexWrap: "wrap",
            gap: 1.5,
          }}
        >
          <Box
            sx={{
              display: "flex",
              alignItems: "center",
              gap: 1,
            }}
          >
            <IoLocationOutline
              style={{
                fontSize: 18,
                color: "#667eea",
              }}
            />

            <Typography
              sx={{
                fontSize: "0.8rem",
                fontWeight: 700,
                color: "#6c757d",
                letterSpacing: "0.04em",
                textTransform: "uppercase",
              }}
            >
              Employee Address
            </Typography>
          </Box>

          <Tooltip
            title={
              hasAddress
                ? "An employee can only have one address. Delete the existing address to add a new one."
                : ""
            }
          >
            <span>
              <Button
                variant="contained"
                disableElevation
                size="small"
                disabled={hasAddress}
                startIcon={<Plus size={16} />}
                onClick={openAddAddress}
                sx={{
                  borderRadius: "8px",
                  textTransform: "none",
                  fontWeight: 600,
                  height: 36,
                }}
              >
                Add Address
              </Button>
            </span>
          </Tooltip>
        </Box>

        {hasAddress ? (
          <Box
            sx={{
              display: "grid",
              gridTemplateColumns:
                "repeat(auto-fill, minmax(300px, 1fr))",
              gap: "16px",
            }}
          >
            {userData.user_address.map(
              (addr) => (
                <Box
                  key={addr.id}
                  sx={{
                    border:
                      "1px solid #eef0f2",
                    borderRadius: "12px",
                    padding: "16px",
                    background: "#fafbfc",
                    display: "flex",
                    flexDirection: "column",
                    gap: 1.25,
                  }}
                >
                  <Box
                    sx={{
                      display: "flex",
                      alignItems:
                        "flex-start",
                      gap: 1,
                    }}
                  >
                    <MapPin
                      size={16}
                      color="#667eea"
                      style={{
                        marginTop: 2,
                        flexShrink: 0,
                      }}
                    />

                    <Typography
                      sx={{
                        fontSize:
                          "13.5px",
                        color:
                          "#2c3e50",
                        fontWeight: 500,
                        lineHeight: 1.5,
                      }}
                    >
                      {addr.address},{" "}
                      {addr.user_city
                        ?.name}
                      ,{" "}
                      {addr.user_state
                        ?.name}
                      ,{" "}
                      {addr.user_country
                        ?.name}
                    </Typography>
                  </Box>

                  <Divider
                    sx={{ my: 0.5 }}
                  />

                  <Stack
                    direction="row"
                    spacing={1}
                  >
                    <Tooltip title="Edit Address">
                      <IconButton
                        size="small"
                        sx={{
                          width: 32,
                          height: 32,
                          border:
                            "1px solid #6366F1",
                          color:
                            "#6366F1",
                          "&:hover": {
                            backgroundColor:
                              "#6366F114",
                          },
                        }}
                        onClick={() =>
                          openEditAddress(
                            addr,
                          )
                        }
                      >
                        <Pencil size={14} />
                      </IconButton>
                    </Tooltip>

                    <Tooltip title="Delete Address">
                      <IconButton
                        size="small"
                        sx={{
                          width: 32,
                          height: 32,
                          border:
                            "1px solid #EF4444",
                          color:
                            "#EF4444",
                          "&:hover": {
                            backgroundColor:
                              "#EF444414",
                          },
                        }}
                        onClick={() =>
                          handleDeleteAddress(
                            addr.id,
                          )
                        }
                      >
                        <Trash2 size={14} />
                      </IconButton>
                    </Tooltip>
                  </Stack>
                </Box>
              ),
            )}
          </Box>
        ) : (
          <Box
            sx={{
              border:
                "1px dashed #e5e7eb",
              borderRadius: "12px",
              padding: "24px",
              textAlign: "center",
              background: "#fafbfc",
            }}
          >
            <MapPin
              size={20}
              color="#c4c9d4"
              style={{
                marginBottom: 8,
              }}
            />

            <Typography
              sx={{
                color: "#9ca3af",
                fontSize: "0.9rem",
              }}
            >
              No address added yet.
              This employee can have
              one address.
            </Typography>
          </Box>
        )}
      </Card>
    </Box>
  );

  /* ---------------------------------------------------------------- */
  /* Booking tab content                                              */
  /* ---------------------------------------------------------------- */

  const bookingContent = (
    <Card
      variant="outlined"
      sx={{
        p: 2.5,
        borderRadius: "10px",
        borderColor: "#eef0f2",
        boxShadow: "none",
      }}
    >
      <Typography
        sx={{
          fontSize: "1.05rem",
          fontWeight: 600,
          color: "#374151",
          mb: 2,
        }}
      >
        View all the bookings associated
        with{" "}
        {userData?.user_profile?.name ||
          ""}
      </Typography>

      <Tabs
        activeKey={activeTab}
        onChange={handleTabSelect}
        items={tabsContent.map(
          (tab) => ({
            key: tab.key,
            label: tab.label,
            children: (
              <Box sx={{ mt: 2 }}>
                <Table
                  columns={columns}
                  dataSource={
                    bookingData
                  }
                  rowKey="autoIncrementId"
                  pagination={{
                    pageSize: 10,
                  }}
                />
              </Box>
            ),
          }),
        )}
      />
    </Card>
  );

  /* ---------------------------------------------------------------- */
  /* Attendance tab content                                           */
  /* ---------------------------------------------------------------- */

  const attendanceContent = (
    <Card
      variant="outlined"
      sx={{
        p: 2.5,
        borderRadius: "10px",
        borderColor: "#eef0f2",
        boxShadow: "none",
      }}
    >
      <Attendance />
    </Card>
  );

  const mainTabItems = [
    {
      key: "overview",
      label: "Overview",
      children: overviewContent,
    },

    {
      key: "booking",
      label: "Booking",
      children: bookingContent,
    },

    {
      key: "attendance",
      label: "Attendance",
      children: attendanceContent,
    },

    {
      key: "hiringForm",
      label: "Hiring Form",
      children: (
        <ComingSoon
          icon={
            <UserCog
              size={28}
              color="#c4c9d4"
            />
          }
          label="Hiring Form"
        />
      ),
    },

    {
      key: "equipment",
      label: "Equipment",
      children: (
        <ComingSoon
          icon={
            <Wrench
              size={28}
              color="#c4c9d4"
            />
          }
          label="Equipment"
        />
      ),
    },

    {
      key: "inspection",
      label: "Inspection",
      children: (
        <ComingSoon
          icon={
            <ClipboardList
              size={28}
              color="#c4c9d4"
            />
          }
          label="Inspection"
        />
      ),
    },
  ];

  return (
    <Box>
      {/* Page Header */}

      <Paper
        variant="outlined"
        sx={{
          p: 2.5,
          mb: 3,
          borderRadius: "10px",
          borderColor: "#eef0f2",
        }}
      >
        <Box
          sx={{
            display: "flex",
            justifyContent:
              "space-between",
            alignItems: "center",
            gap: 2,
          }}
        >
          <Box>
            <Typography className="page-title">
              EMPLOYEE MANAGEMENT
            </Typography>

            <Typography className="page-sub-title">
              View Information related
              with Employee
            </Typography>
          </Box>

          <Button
            variant="contained"
            disableElevation
            startIcon={
              <ArrowLeft size={18} />
            }
            onClick={
              navigateToUser
            }
            sx={{
              ml: "auto",
              height: 46,
              px: 3,
              borderRadius: "8px",
              minWidth: 180,
              textTransform: "none",
              fontWeight: 600,
              backgroundColor:
                "#2c3345",
              "&:hover": {
                backgroundColor:
                  "#1f2433",
              },
            }}
          >
            Return to Employees
          </Button>
        </Box>
      </Paper>

      <div className="admin_details_form">
        <Tabs
          activeKey={mainTab}
          onChange={(k) =>
            setMainTab(k)
          }
          className="mb-4 client-main-tabs"
          items={mainTabItems}
        />
      </div>

      {/* ---------------------------------------------------------------- */}
      {/* Add / Edit Address modal                                        */}
      {/* ---------------------------------------------------------------- */}

      {addressModalVisible && (
        <Modal
          title={
            <Stack
              direction="row"
              alignItems="center"
              spacing={1.25}
            >
              <Box
                sx={{
                  width: 34,
                  height: 34,
                  borderRadius: "8px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent:
                    "center",
                  background: "#eef2ff",
                  color: "#667eea",
                  flexShrink: 0,
                }}
              >
                <MapPin size={17} />
              </Box>

              <span
                style={{
                  fontWeight: 600,
                }}
              >
                {editingAddress
                  ? "Edit Address"
                  : "Add New Address"}
              </span>
            </Stack>
          }
          open={addressModalVisible}
          onCancel={() => {
            setAddressModalVisible(
              false,
            );

            setEditingAddress(null);

            addressForm.resetFields();

            setStates([]);

            setCities([]);

            setAddressCoordinates({
              lat: null,
              lng: null,
            });
          }}
          onOk={handleSaveAddress}
          okText={
            editingAddress
              ? "Save Changes"
              : "Add Address"
          }
          forceRender
        >
          <Divider
            sx={{
              mt: 1,
              mb: 2,
            }}
          />

          <Form
            form={addressForm}
            layout="vertical"
            onValuesChange={(
              changedValues,
              allValues,
            ) => {
              // =================================================
              // COUNTRY CHANGED
              // =================================================

              if (
                changedValues.country_id
              ) {
                // Clear old state/city
                // because they belong to
                // the previous country.

                addressForm.setFieldsValue(
                  {
                    state_id:
                      undefined,
                    city_id:
                      undefined,
                  },
                );

                setCities([]);

                // Load states for the
                // newly selected country.

                fetchStatesForCountry(
                  changedValues.country_id,
                );

                return;
              }

              // =================================================
              // STATE CHANGED
              // =================================================

              if (
                changedValues.state_id
              ) {
                addressForm.setFieldsValue(
                  {
                    city_id:
                      undefined,
                  },
                );

                setCities([]);

                fetchCities(
                  changedValues.state_id,
                );
              }

              // =================================================
              // ADDRESS CHANGED
              // =================================================

              if (
                changedValues.address
              ) {
                const selectedState =
                  states.find(
                    (s) =>
                      s.id ===
                      allValues.state_id,
                  )?.name || "";

                const selectedCity =
                  cities.find(
                    (c) =>
                      c.id ===
                      allValues.city_id,
                  )?.name || "";

                const selectedCountry =
                  Number(
                    allValues.country_id,
                  ) ===
                  COUNTRY_IDS.CANADA
                    ? "Canada"
                    : "USA";

                const fullAddress = [
                  changedValues.address,
                  selectedCity,
                  selectedState,
                  selectedCountry,
                ]
                  .filter(Boolean)
                  .join(", ");

                fetchAddressCoordinates(
                  fullAddress,
                );
              }
            }}
          >
            {/* Address */}

            <Form.Item
              name="address"
              label="Address"
              rules={[
                {
                  required: true,
                  message:
                    "Please enter the address",
                },
              ]}
            >
              <Input placeholder="Enter address" />
            </Form.Item>

            {/* Country */}

            <Form.Item
              name="country_id"
              label="Country"
              rules={[
                {
                  required: true,
                  message:
                    "Please select a country",
                },
              ]}
            >
              <Select
                placeholder="Select Country"
              >
                <Select.Option
                  value={
                    COUNTRY_IDS.USA
                  }
                >
                  USA
                </Select.Option>

                <Select.Option
                  value={
                    COUNTRY_IDS.CANADA
                  }
                >
                  Canada
                </Select.Option>
              </Select>
            </Form.Item>

            {/* State */}

            <Form.Item
              name="state_id"
              label="State"
              rules={[
                {
                  required: true,
                  message:
                    "Please select a state",
                },
              ]}
            >
              <Select
                showSearch
                placeholder="Select State"
                optionFilterProp="children"
                disabled={
                  !addressForm.getFieldValue(
                    "country_id",
                  )
                }
                filterOption={(
                  input,
                  option,
                ) =>
                  option.children
                    .toLowerCase()
                    .includes(
                      input.toLowerCase(),
                    )
                }
              >
                {states.map(
                  (state) => (
                    <Select.Option
                      key={state.id}
                      value={state.id}
                    >
                      {state.name}
                    </Select.Option>
                  ),
                )}
              </Select>
            </Form.Item>

            {/* City */}

            <Form.Item
              name="city_id"
              label="City"
              rules={[
                {
                  required: true,
                  message:
                    "Please select a city",
                },
              ]}
            >
              <Select
                showSearch
                placeholder="Select City"
                disabled={
                  !addressForm.getFieldValue(
                    "state_id",
                  )
                }
                optionFilterProp="children"
                filterOption={(
                  input,
                  option,
                ) =>
                  option.children
                    .toLowerCase()
                    .includes(
                      input.toLowerCase(),
                    )
                }
              >
                {cities.map(
                  (city) => (
                    <Select.Option
                      key={city.id}
                      value={city.id}
                    >
                      {city.name}
                    </Select.Option>
                  ),
                )}
              </Select>
            </Form.Item>

            {/* Map */}

            <Form.Item label="Map Preview">
              <div
                style={{
                  border:
                    "1px solid #eef0f2",
                  height: 220,
                  borderRadius: 8,
                  overflow: "hidden",
                }}
              >
                {addressCoordinates.lat !==
                  null &&
                addressCoordinates.lng !==
                  null ? (
                  <iframe
                    width="100%"
                    height="100%"
                    style={{
                      border: "none",
                      borderRadius: 8,
                    }}
                    src={`https://maps.google.com/maps?q=${addressCoordinates.lat},${addressCoordinates.lng}&z=16&output=embed`}
                    allowFullScreen
                  />
                ) : (
                  <p
                    style={{
                      textAlign:
                        "center",
                      paddingTop: 80,
                      color: "#999",
                    }}
                  >
                    Enter address to
                    show map
                  </p>
                )}
              </div>
            </Form.Item>
          </Form>
        </Modal>
      )}
    </Box>
  );
};

export default ViewServiceProvider;
