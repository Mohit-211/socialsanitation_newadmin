/** @format */

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
import { Table, Tag, Image, Tabs, Modal, Form, Input, Select, message } from "antd";

// Icons
import { IoArrowForwardCircleOutline, IoLocationOutline } from "react-icons/io5";
import { ArrowLeft, Plus, Pencil, Trash2, MapPin } from "lucide-react";

const ViewServiceProvider = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const [userData, setUserData] = useState(null);
  const [bookingData, setBookingData] = useState([]);
  const [activeTab, setActiveTab] = useState("all");

  /* ---------------------------------------------------------------- */
  /* Address: state                                                      */
  /* ---------------------------------------------------------------- */
  const [addressModalVisible, setAddressModalVisible] = useState(false);
  const [editingAddress, setEditingAddress] = useState(null);
  const [addressForm] = Form.useForm();
  const [states, setStates] = useState([]);
  const [cities, setCities] = useState([]);
  const [addressCoordinates, setAddressCoordinates] = useState({
    lat: null,
    lng: null,
  });

  // Employees may only ever have a single address on file.
  const hasAddress = (userData?.user_address?.length || 0) >= 1;

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
  /* Address: states / cities / geocoding                               */
  /* ---------------------------------------------------------------- */
  useEffect(() => {
    StateAPI(233)
      .then((res) => setStates(res?.data?.data?.all_state || []))
      .catch((err) => console.log(err));
  }, []);

  const fetchCities = (stateId) => {
    return CityAPI(stateId).then((res) => {
      const citiesList = res?.data?.data?.all_city || [];
      setCities(citiesList);
      return citiesList;
    });
  };

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
        const location = data.results[0].geometry.location;
        setAddressCoordinates({ lat: location.lat, lng: location.lng });
      }
    } catch (err) {
      console.log(err);
    }
  };

  const openAddAddress = () => {
    if (hasAddress) return; // safety guard alongside the disabled button
    setEditingAddress(null);
    addressForm.resetFields();
    setAddressCoordinates({ lat: null, lng: null });
    setAddressModalVisible(true);
  };

  const openEditAddress = (addr) => {
    setEditingAddress(addr);
    setAddressModalVisible(true);

    setTimeout(() => {
      addressForm.resetFields();
      addressForm.setFieldsValue({
        address: addr.address,
        state_id: addr.state_id,
      });
      setAddressCoordinates({
        lat: addr.address_lat,
        lng: addr.address_long,
      });
      fetchCities(addr.state_id).then(() => {
        addressForm.setFieldsValue({ city_id: addr.city_id });
      });
      if (addr.address) fetchAddressCoordinates(addr.address);
    }, 100);
  };

  const handleSaveAddress = async () => {
    const values = await addressForm.validateFields();

    const basePayload = {
      address: values.address,
      state_id: values.state_id,
      city_id: values.city_id,
      country_id: 233,
      address_lat: addressCoordinates.lat,
      address_long: addressCoordinates.lng,
    };

    try {
      if (editingAddress) {
        await EditAddress({
          user_address_id: editingAddress.id,
          ...basePayload,
        });
        message.success("Address updated");
      } else {
        await AddNewUserAddress({ user_id: id, ...basePayload });
        message.success("Address added");
      }

      refreshUser();
      setAddressModalVisible(false);
      setEditingAddress(null);
      addressForm.resetFields();
      setAddressCoordinates({ lat: null, lng: null });
    } catch (err) {
      message.error("Failed to save address");
    }
  };

  const handleDeleteAddress = (addressId) => {
    Modal.confirm({
      title: "Delete Address",
      content: "Are you sure you want to delete this address?",
      okText: "Delete",
      okType: "danger",
      onOk: async () => {
        try {
          await DeleteUserAddress(addressId);
          message.success("Address deleted successfully");
          refreshUser();
        } catch (error) {
          console.error(error);
          message.error("Failed to delete address");
        }
      },
    });
  };

  /* ---------------------------------------------------------------- */

  const getData = async (booking_status) => {
    try {
      const formData = { id: id, booking_status };
      let result = await GetBookingBySPId(formData);
      // Add an auto-increment ID to each booking
      const dataWithIndex = result.data.data.map((item, index) => ({
        ...item,
        autoIncrementId: index + 1,
      }));
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
    { label: "All", key: "all" },
    { label: "Ongoing", key: "ONGOING" },
    { label: "Upcoming", key: "UPCOMING" },
    { label: "Completed", key: "COMPLETED" },
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
      dataIndex: ["employee_details_booking", "booking_unique_id"],
      key: "booking_id",
    },
    {
      title: "Service",
      dataIndex: ["employee_details_booking", "service_booking", "name"],
      key: "service",
    },
    {
      title: "Date",
      dataIndex: "date",
      key: "date",
      width: "10%",
      render: (date) => dayjs(date).format("MM/DD/YYYY"),
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
      dataIndex: ["employee_details_booking", "booking_status"],
      key: "status",
      render: (status) => {
        const color = getStatusColor(status);
        return (
          <Tag color={color}>
            {status === "SUCCESS" ? "COMPLETED" : status?.toUpperCase()}
          </Tag>
        );
      },
    },
    {
      title: "Service Start Time",
      dataIndex: ["employee_details_booking", "start_time"],
      key: "start_time",
      render: (time) => (time ? new Date(time).toLocaleString() : "---"),
    },
    {
      title: "Service End Time",
      dataIndex: ["employee_details_booking", "end_time"],
      key: "end_time",
      render: (time) => (time ? new Date(time).toLocaleString() : "---"),
    },
    {
      title: "",
      key: "redirect",
      render: (text, record) => (
        <IoArrowForwardCircleOutline
          style={{ fontSize: "20px", cursor: "pointer" }}
          className="redirect_button"
          onClick={() => navigate(`/viewBooking/${record.id}`)}
        />
      ),
    },
  ];

  const handleTabSelect = (key) => {
    setActiveTab(key);
    getData(key);
  };

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
            justifyContent: "space-between",
            alignItems: "center",
            gap: 2,
          }}
        >
          <Box>
            <Typography className="page-title">
              EMPLOYEE MANAGEMENT
            </Typography>
            <Typography className="page-sub-title">
              View Information related with Employee
            </Typography>
          </Box>

          <Button
            variant="contained"
            disableElevation
            startIcon={<ArrowLeft size={18} />}
            onClick={navigateToUser}
            sx={{
              ml: "auto",
              height: 46,
              px: 3,
              borderRadius: "8px",
              minWidth: 180,
              textTransform: "none",
              fontWeight: 600,
              backgroundColor: "#2c3345",
              "&:hover": {
                backgroundColor: "#1f2433",
              },
            }}
          >
            Return to Employees
          </Button>
        </Box>
      </Paper>

      <Box sx={{ display: "flex", flexDirection: "column", gap: 2.5 }}>
        {/* Employee Details Header Card */}
        <Box sx={{ display: "flex", gap: 2.5, alignItems: "stretch" }}>
          {/* Optional Profile Image Preview */}
          {userData?.user_attachments?.length > 0 &&
            userData.user_attachments[0].file_type === "Image" && (
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
                gridTemplateColumns: { xs: "1fr", sm: "repeat(3, 1fr)" },
                gap: 3,
              }}
            >
              <Box>
                <Typography sx={{ fontWeight: 700, fontSize: "0.95rem", color: "#111827", mb: 0.5 }}>
                  Employee's Name:
                </Typography>
                <Typography sx={{ color: "#4b5563", fontSize: "0.95rem" }}>
                  {userData?.user_profile?.name || "---"}
                </Typography>
              </Box>

              <Box>
                <Typography sx={{ fontWeight: 700, fontSize: "0.95rem", color: "#111827", mb: 0.5 }}>
                  Email
                </Typography>
                <Typography sx={{ color: "#4b5563", fontSize: "0.95rem" }}>
                  {userData?.email || "---"}
                </Typography>
              </Box>

              <Box>
                <Typography sx={{ fontWeight: 700, fontSize: "0.95rem", color: "#111827", mb: 0.5 }}>
                  Mobile:
                </Typography>
                <Typography sx={{ color: "#4b5563", fontSize: "0.95rem" }}>
                  {userData?.user_profile?.mobile || "---"}
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
            <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
              <IoLocationOutline style={{ fontSize: 18, color: "#667eea" }} />
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
                gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))",
                gap: "16px",
              }}
            >
              {userData.user_address.map((addr) => (
                <Box
                  key={addr.id}
                  sx={{
                    border: "1px solid #eef0f2",
                    borderRadius: "12px",
                    padding: "16px",
                    background: "#fafbfc",
                    display: "flex",
                    flexDirection: "column",
                    gap: 1.25,
                  }}
                >
                  <Box sx={{ display: "flex", alignItems: "flex-start", gap: 1 }}>
                    <MapPin
                      size={16}
                      color="#667eea"
                      style={{ marginTop: 2, flexShrink: 0 }}
                    />
                    <Typography
                      sx={{
                        fontSize: "13.5px",
                        color: "#2c3e50",
                        fontWeight: 500,
                        lineHeight: 1.5,
                      }}
                    >
                      {addr.address}, {addr.user_city?.name},{" "}
                      {addr.user_state?.name}, {addr.user_country?.name}
                    </Typography>
                  </Box>

                  <Divider sx={{ my: 0.5 }} />

                  <Stack direction="row" spacing={1}>
                    <Tooltip title="Edit Address">
                      <IconButton
                        size="small"
                        sx={{
                          width: 32,
                          height: 32,
                          border: "1px solid #6366F1",
                          color: "#6366F1",
                          "&:hover": { backgroundColor: "#6366F114" },
                        }}
                        onClick={() => openEditAddress(addr)}
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
                          border: "1px solid #EF4444",
                          color: "#EF4444",
                          "&:hover": { backgroundColor: "#EF444414" },
                        }}
                        onClick={() => handleDeleteAddress(addr.id)}
                      >
                        <Trash2 size={14} />
                      </IconButton>
                    </Tooltip>
                  </Stack>
                </Box>
              ))}
            </Box>
          ) : (
            <Box
              sx={{
                border: "1px dashed #e5e7eb",
                borderRadius: "12px",
                padding: "24px",
                textAlign: "center",
                background: "#fafbfc",
              }}
            >
              <MapPin size={20} color="#c4c9d4" style={{ marginBottom: 8 }} />
              <Typography sx={{ color: "#9ca3af", fontSize: "0.9rem" }}>
                No address added yet. This employee can have one address.
              </Typography>
            </Box>
          )}
        </Card>

        {/* Bookings Table Card */}
        <Card
          variant="outlined"
          sx={{
            p: 2.5,
            borderRadius: "10px",
            borderColor: "#eef0f2",
            boxShadow: "none",
          }}
        >
          <Typography sx={{ fontSize: "1.05rem", fontWeight: 600, color: "#374151", mb: 2 }}>
            View all the bookings associated with {userData?.user_profile?.name || ""}
          </Typography>

          <Tabs
            activeKey={activeTab}
            onChange={handleTabSelect}
            items={tabsContent.map((tab) => ({
              key: tab.key,
              label: tab.label,
              children: (
                <Box sx={{ mt: 2 }}>
                  <Table
                    columns={columns}
                    dataSource={bookingData}
                    rowKey="autoIncrementId"
                    pagination={{ pageSize: 10 }}
                  />
                </Box>
              ),
            }))}
          />
        </Card>

        {/* Attendance Section Card */}
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
      </Box>

      {/* ---------------------------------------------------------------- */}
      {/* Add / Edit Address modal                                           */}
      {/* ---------------------------------------------------------------- */}
      {addressModalVisible && (
        <Modal
          title={
            <Stack direction="row" alignItems="center" spacing={1.25}>
              <Box
                sx={{
                  width: 34,
                  height: 34,
                  borderRadius: "8px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  background: "#eef2ff",
                  color: "#667eea",
                  flexShrink: 0,
                }}
              >
                <MapPin size={17} />
              </Box>
              <span style={{ fontWeight: 600 }}>
                {editingAddress ? "Edit Address" : "Add New Address"}
              </span>
            </Stack>
          }
          open={addressModalVisible}
          onCancel={() => {
            setAddressModalVisible(false);
            setEditingAddress(null);
            addressForm.resetFields();
            setCities([]);
            setAddressCoordinates({ lat: null, lng: null });
          }}
          onOk={handleSaveAddress}
          okText={editingAddress ? "Save Changes" : "Add Address"}
          forceRender
        >
          <Divider sx={{ mt: 1, mb: 2 }} />
          <Form
            form={addressForm}
            layout="vertical"
            onValuesChange={(changedValues, allValues) => {
              if (changedValues.state_id) {
                addressForm.setFieldsValue({ city_id: undefined });
                fetchCities(changedValues.state_id);
              }
              if (changedValues.address) {
                const fullAddress = `${changedValues.address}, ${
                  states.find((s) => s.id === allValues.state_id)?.name || ""
                }, ${
                  cities.find((c) => c.id === allValues.city_id)?.name || ""
                }`;
                fetchAddressCoordinates(fullAddress);
              }
            }}
          >
            <Form.Item
              name="address"
              label="Address"
              rules={[{ required: true, message: "Please enter the address" }]}
            >
              <Input placeholder="Enter address" />
            </Form.Item>

            <Form.Item
              name="state_id"
              label="State"
              rules={[{ required: true, message: "Please select a state" }]}
            >
              <Select
                showSearch
                placeholder="Select State"
                optionFilterProp="children"
                filterOption={(input, option) =>
                  option.children.toLowerCase().includes(input.toLowerCase())
                }
              >
                {states.map((s) => (
                  <Select.Option key={s.id} value={s.id}>
                    {s.name}
                  </Select.Option>
                ))}
              </Select>
            </Form.Item>

            <Form.Item
              name="city_id"
              label="City"
              rules={[{ required: true, message: "Please select a city" }]}
            >
              <Select
                showSearch
                placeholder="Select City"
                disabled={!addressForm.getFieldValue("state_id")}
                optionFilterProp="children"
                filterOption={(input, option) =>
                  option.children.toLowerCase().includes(input.toLowerCase())
                }
              >
                {cities.map((c) => (
                  <Select.Option key={c.id} value={c.id}>
                    {c.name}
                  </Select.Option>
                ))}
              </Select>
            </Form.Item>

            <Form.Item label="Map Preview">
              <div
                style={{
                  border: "1px solid #eef0f2",
                  height: 220,
                  borderRadius: 8,
                }}
              >
                {addressCoordinates.lat && addressCoordinates.lng ? (
                  <iframe
                    width="100%"
                    height="100%"
                    style={{ border: "none", borderRadius: 8 }}
                    src={`https://maps.google.com/maps?q=${addressCoordinates.lat},${addressCoordinates.lng}&z=16&output=embed`}
                    allowFullScreen
                  />
                ) : (
                  <p
                    style={{
                      textAlign: "center",
                      paddingTop: 80,
                      color: "#999",
                    }}
                  >
                    Enter address to show map
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