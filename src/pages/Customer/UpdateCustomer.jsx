/** @format */

import React, { useEffect, useState, useCallback } from "react";
import {
  Form,
  Input,
  Button as AntButton,
  Select,
  Row,
  Col,
  Typography,
  message,
  Modal,
  Radio,
  InputNumber,
} from "antd";
import {
  Box,
  Paper,
  Button,
  Card,
  Stack,
  IconButton,
  Tooltip,
  Divider,
  Typography as MuiTypography,
} from "@mui/material";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import { useNavigate, useParams } from "react-router-dom";
import { Plus, Pencil, Trash2, MapPin } from "lucide-react";
import { IoLocationOutline } from "react-icons/io5";
import {
  GetUserById,
  EditUserById,
  StateAPI,
  CityAPI,
  AddNewUserAddress,
  EditAddress,
  DeleteUserAddress,
} from "../../services/Api/Api";

const tableWrapStyle = {
  border: "1px solid #e5e7eb",
  borderRadius: "10px",
  overflow: "hidden",
};

const thStyle = {
  textAlign: "left",
  padding: "14px 16px",
  background: "#fafafa",
  borderBottom: "1px solid #e5e7eb",
  borderRight: "1px solid #e5e7eb",
  fontSize: "13px",
  fontWeight: 600,
  color: "#374151",
  verticalAlign: "top",
};

const tdStyle = {
  padding: "14px 16px",
  borderBottom: "1px solid #e5e7eb",
  borderRight: "1px solid #e5e7eb",
  verticalAlign: "middle",
  background: "#fff",
};

const UpdateCustomer = () => {
  const [form] = Form.useForm();
  const navigate = useNavigate();
  const { id } = useParams();
  const [states, setStates] = useState([]);
  const [cities, setCities] = useState([]);
  const [coordinates, setCoordinates] = useState({ lat: null, lng: null });
  const [loading, setLoading] = useState(false);
  const [userAddresses, setUserAddresses] = useState([]);
  const [clientType, setClientType] = useState("residential");
  const [totalCount, setTotalCount] = useState(0);

  const [addressModalVisible, setAddressModalVisible] = useState(false);
  const [editingAddress, setEditingAddress] = useState(null);
  const [addressForm] = Form.useForm();
  const [addressCoordinates, setAddressCoordinates] = useState({
    lat: null,
    lng: null,
  });

  const [commercialAreas, setCommercialAreas] = useState([
    { name: "Entrance / Lobby Areas", editable: false },
    { name: "Restrooms", editable: false },
    { name: "Kitchen Areas", editable: false },
    { name: "Office Areas", editable: false },
    { name: "Classrooms / Conference Rooms", editable: false },
    { name: "Group / Common Rooms", editable: false },
    { name: "All Areas / Hallways", editable: false },
  ]);

  const navigateToUser = () => {
    navigate("/users");
  };

  useEffect(() => {
    StateAPI(233).then((res) => {
      setStates(res?.data?.data?.all_state || []);
    });
  }, []);

  const carpetPercentage = Form.useWatch("carpet_percentage", form) || 0;
  const concretePercentage = Form.useWatch("concrete_percentage", form) || 0;
  const vctLvtPercentage = Form.useWatch("vct_lvt_percentage", form) || 0;
  const tilePercentage = Form.useWatch("tile_percentage", form) || 0;

  const totalFloorPercentage =
    Number(carpetPercentage) +
    Number(concretePercentage) +
    Number(vctLvtPercentage) +
    Number(tilePercentage);

  const fetchCities = (stateId) => {
    return CityAPI(stateId).then((res) => {
      const citiesList = res?.data?.data?.all_city || [];
      setCities(citiesList);
      return citiesList; // Needed for chaining
    });
  };

  const fetchCoordinates = async (address) => {
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
        setCoordinates({ lat: location.lat, lng: location.lng });
        setAddressCoordinates({ lat: location.lat, lng: location.lng });
      }
    } catch (err) {
      console.log(err);
    }
  };

  const refreshUser = () => {
    GetUserById(id).then((res) => {
      const data = res.data.data;
      setUserAddresses(data?.user_address || []);
    });
  };

  useEffect(() => {
    GetUserById(id).then((res) => {
      const data = res.data.data;
      const checklist = data?.user_client_checklist?.[0];
      const details = checklist?.user_client_checklist_details || [];
      const state_id = checklist?.state_id;
      const userTypeFromBackend = data?.client_type || "residential";
      setClientType(userTypeFromBackend);
      const serviceAreas = getServiceAreasByType(userTypeFromBackend);
      if (userTypeFromBackend === "commercial") {
        setCommercialAreas(
          details.map((detail) => ({
            name: detail.service_area,
            editable:
              detail.service_area.includes("Restrooms") &&
              detail.service_area !== "Restrooms",
          })),
        );
      }

      // Merge: ensure each default area has a row, even if empty
      const mergedChecklist = details.map((detail) => ({
        service_area: detail.service_area,

        // Residential
        num_desks_trash_cans: detail?.num_desks_trash_cans || 0,

        // Commercial
        stalls: detail?.stalls || 0,
        sinks: detail?.sinks || 0,
        restrooms: detail?.restrooms || 0,

        flooring_type: detail?.flooring_type || null,

        special_requests: detail?.special_requests || "",
      }));

      form.setFieldsValue({
        name: data?.user_profile?.name,
        client_type: data?.client_type,
        email: data?.email,
        sqft: checklist?.estimated_sqft,
        service_days: checklist?.service_days,
        walkaround_minutes: checklist?.walkaround_minutes,

        carpet_percentage: Number(checklist?.carpet_percentage || 0),
        concrete_percentage: Number(checklist?.concrete_percentage || 0),
        vct_lvt_percentage: Number(checklist?.vct_lvt_percentage || 0),
        tile_percentage: Number(checklist?.tile_percentage || 0),
        address: checklist?.address,
        state_id,
        city_id: checklist?.city_id,
        details: mergedChecklist,
      });
      // ✅ calculate total after data load
      setTimeout(() => {
        calculateTotal();
      }, 0);
      if (state_id) fetchCities(state_id);
      if (checklist?.address) fetchCoordinates(checklist.address);
      setUserAddresses(data?.user_address || []);
    });
  }, [id, form]);

  const handleSave = async (values) => {
    setLoading(true);
    const payload = {
      name: values.name,
      client_type: clientType,
      checklist: {
        estimated_sqft: values.sqft,
        walkaround_minutes: values.walkaround_minutes,
        service_days: values.service_days,

        carpet_percentage: values.carpet_percentage,
        concrete_percentage: values.concrete_percentage,
        vct_lvt_percentage: values.vct_lvt_percentage,
        tile_percentage: values.tile_percentage,

        address: values.address,
        state_id: values.state_id,
        city_id: values.city_id,
        address_lat: coordinates.lat,
        address_long: coordinates.lng,
        details: values.details || [],
      },
    };

    console.log("Submitting payload", JSON.stringify(payload, null, 2));

    const totalFloorPercentage =
      Number(values.carpet_percentage || 0) +
      Number(values.concrete_percentage || 0) +
      Number(values.vct_lvt_percentage || 0) +
      Number(values.tile_percentage || 0);

    if (totalFloorPercentage !== 100) {
      message.error("Floor composition must total 100%");
      setLoading(false);
      return;
    }

    try {
      await EditUserById(id, payload);
      message.success("User updated successfully");
      setTimeout(() => navigate("/users"), 1000);
    } catch (err) {
      console.log(err);
      message.error("Update failed");
    } finally {
      setLoading(false);
    }
  };

  const openAddAddress = () => {
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
        addressForm.setFieldsValue({
          city_id: addr.city_id,
        });
      });

      setTimeout(() => fetchCoordinates(addr.address), 200);
    }, 100); // Delay ensures modal and form are mounted
  };

  const handleSaveAddress = async () => {
    const values = await addressForm.validateFields();

    // Shared payload for both add/edit
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
        const editpayload = {
          user_address_id: editingAddress.id,
          ...basePayload,
        };
        await EditAddress(editpayload);
        message.success("Address updated");
      } else {
        const addpayload = {
          user_id: id,
          ...basePayload,
        };
        await AddNewUserAddress(addpayload);
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

  const onClientTypeChange = (type) => {
    setClientType(type);

    const areas = getServiceAreasByType(type);
    const emptyDetails = areas.map((area) => ({
      service_area: area,
      num_desks_trash_cans: 0,
      flooring_type: null,
      special_requests: "",
    }));

    form.setFieldsValue({ details: emptyDetails });
  };

  const getServiceAreasByType = (type) =>
    type === "commercial"
      ? [
          "Entrance / Lobby Areas",
          "Restrooms",
          "Kitchen Areas",
          "Office Areas",
          "Classrooms / Conference Rooms",
          "Group / Common Rooms",
          "All Areas / Hallways",
        ]
      : [
          "Entrance / Lobby Areas",
          "Bathrooms",
          "Kitchen",
          "Bedrooms",
          "Dining Room",
          "Living Room",
          "Foyer",
        ];

  const calculateTotal = () => {
    const details = form.getFieldValue("details") || [];

    const total = details.reduce((sum, item) => {
      const desks = Number(item?.num_desks_trash_cans || 0);
      const stalls = Number(item?.stalls || 0);
      const sinks = Number(item?.sinks || 0);
      const restrooms = Number(item?.restrooms || 0);

      return sum + desks + stalls + sinks + restrooms;
    }, 0);

    setTotalCount(total);
  };

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
        <Box
          sx={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            width: "100%",
            gap: 2,
          }}
        >
          <Box>
            <MuiTypography className="page-title">
              CLIENT MANAGEMENT
            </MuiTypography>
            <MuiTypography className="page-sub-title">
              Update Client Details
            </MuiTypography>
          </Box>

          <Button
            variant="contained"
            disableElevation
            startIcon={<ArrowBackIcon />}
            onClick={navigateToUser}
            sx={{
              height: 47,
              px: 3,
              borderRadius: "8px",
              minWidth: 180,
              textTransform: "none",
              fontWeight: 600,
              backgroundColor: "#2c3345",
              flexShrink: 0,
              ml: "auto",
              "&:hover": {
                backgroundColor: "#1f2433",
              },
            }}
          >
            Return to Clients
          </Button>
        </Box>
      </Paper>

      <Paper
        variant="outlined"
        sx={{
          p: 4,
          borderRadius: "10px",
          borderColor: "#eef0f2",
        }}
      >
        <Form
          layout="vertical"
          form={form}
          onFinish={handleSave}
          onValuesChange={(changed) => {
            if (changed.address) fetchCoordinates(changed.address);
            if (changed.state_id) fetchCities(changed.state_id);
          }}
        >
          <Row>
            <Col span={24}>
              <Form.Item
                name="client_type"
                label="Client Type"
                rules={[{ required: true }]}
                style={{ marginBottom: 24 }}
              >
                <Radio.Group
                  value={clientType}
                  onChange={(e) => onClientTypeChange(e.target.value)}
                >
                  <Radio value="residential">Residential</Radio>
                  <Radio value="commercial">Commercial</Radio>
                </Radio.Group>
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={[24, 24]}>
            <Col span={6}>
              <Form.Item
                name="name"
                label="Full Name"
                rules={[{ required: true }]}
              >
                <Input />
              </Form.Item>
            </Col>
            <Col span={6}>
              <Form.Item name="email" label="Email">
                <Input disabled />
              </Form.Item>
            </Col>
            <Col span={6}>
              <Form.Item name="sqft" label="Estimated Sq/Ft">
                <Input type="number" min={0} />
              </Form.Item>
            </Col>
            <Col span={6}>
              <Form.Item
                name="walkaround_minutes"
                label="Walkaround Time (Minutes)"
              >
                <Input type="number" min={0} />
              </Form.Item>
            </Col>
          </Row>

          {/* Client Addresses Card */}
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
                mb: 2.5,
                flexWrap: "wrap",
                gap: 1.5,
              }}
            >
              <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                <IoLocationOutline style={{ fontSize: 18, color: "#667eea" }} />
                <MuiTypography
                  sx={{
                    fontSize: "0.8rem",
                    fontWeight: 700,
                    color: "#6c757d",
                    letterSpacing: "0.04em",
                    textTransform: "uppercase",
                  }}
                >
                  Client Addresses
                </MuiTypography>
              </Box>

              <Button
                variant="contained"
                disableElevation
                size="small"
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
            </Box>

            {userAddresses.length > 0 ? (
              <Box
                sx={{
                  display: "grid",
                  gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))",
                  gap: "16px",
                }}
              >
                {userAddresses.map((addr) => (
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
                    <Box
                      sx={{ display: "flex", alignItems: "flex-start", gap: 1 }}
                    >
                      <MapPin
                        size={16}
                        color="#667eea"
                        style={{ marginTop: 2, flexShrink: 0 }}
                      />
                      <MuiTypography
                        sx={{
                          fontSize: "13.5px",
                          color: "#2c3e50",
                          fontWeight: 500,
                          lineHeight: 1.5,
                        }}
                      >
                        {addr.address}, {addr.user_city?.name},{" "}
                        {addr.user_state?.name}, {addr.user_country?.name}
                      </MuiTypography>
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
                <MuiTypography sx={{ color: "#9ca3af", fontSize: "0.9rem" }}>
                  No address added yet.
                </MuiTypography>
              </Box>
            )}
          </Paper>

          <div
            style={{
              border: "1px solid #e5e7eb",
              borderRadius: "8px",
              padding: "20px",
              marginBottom: "24px",
              background: "#fff",
            }}
          >
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                marginBottom: "16px",
              }}
            >
              <div>
                <div style={{ fontSize: "16px", fontWeight: 600 }}>
                  Overall Building Floor Composition
                </div>

                <div
                  style={{
                    fontSize: "13px",
                    color: "#6b7280",
                    marginTop: "4px",
                  }}
                >
                  Enter the percentage of each flooring type for the entire
                  building. Total must equal 100%.
                </div>
              </div>
              <div
                style={{
                  background:
                    totalFloorPercentage === 100 ? "#ecfdf5" : "#fef2f2",
                  color: totalFloorPercentage === 100 ? "#15803d" : "#dc2626",
                  border:
                    totalFloorPercentage === 100
                      ? "1px solid #bbf7d0"
                      : "1px solid #fecaca",
                  borderRadius: "20px",
                  padding: "6px 14px",
                  fontWeight: 600,
                }}
              >
                Total: {totalFloorPercentage}% / 100%
              </div>
            </div>

            <Row gutter={[24, 24]}>
              <Col span={6}>
                <Form.Item
                  label="Carpet (%)"
                  name="carpet_percentage"
                  initialValue={0}
                >
                  <InputNumber min={0} max={100} style={{ width: "100%" }} />
                </Form.Item>
              </Col>

              <Col span={6}>
                <Form.Item
                  label="Concrete (%)"
                  name="concrete_percentage"
                  initialValue={0}
                >
                  <InputNumber min={0} max={100} style={{ width: "100%" }} />
                </Form.Item>
              </Col>

              <Col span={6}>
                <Form.Item
                  label="VCT/LVT (%)"
                  name="vct_lvt_percentage"
                  initialValue={0}
                >
                  <InputNumber min={0} max={100} style={{ width: "100%" }} />
                </Form.Item>
              </Col>

              <Col span={6}>
                <Form.Item
                  label="Tile (%)"
                  name="tile_percentage"
                  initialValue={0}
                >
                  <InputNumber min={0} max={100} style={{ width: "100%" }} />
                </Form.Item>
              </Col>
            </Row>
          </div>

          <Form.Item>
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                marginBottom: "16px",
              }}
            >
              <label style={{ fontSize: "16px", fontWeight: 600 }}>
                Initial Client Chart
              </label>

              {clientType === "commercial" && (
                <AntButton
                  type="primary"
                  onClick={() => {
                    const restroomCount = commercialAreas.filter((area) =>
                      area.name.includes("Restrooms"),
                    ).length;

                    const restroomName = `Restrooms ${restroomCount + 1}`;

                    // Add visible row
                    setCommercialAreas((prev) => [
                      ...prev,
                      {
                        name: restroomName,
                        editable: true,
                      },
                    ]);

                    // Add form row
                    const details = form.getFieldValue("details") || [];

                    form.setFieldsValue({
                      details: [
                        ...details,
                        {
                          service_area: restroomName,
                          stalls: 0,
                          sinks: 0,
                          restrooms: 0,
                          flooring_type: null,
                          special_requests: "",
                        },
                      ],
                    });
                  }}
                >
                  + Add Rooms
                </AntButton>
              )}
            </div>

            <div style={tableWrapStyle}>
              <table style={{ width: "100%", borderCollapse: "collapse" }}>
                <thead>
                  <tr>
                    <th style={{ ...thStyle, width: "20%" }}>Service Area</th>

                    {clientType === "commercial" ? (
                      <>
                        <th style={{ ...thStyle, width: "18%" }}>
                          # of Trash Cans
                          <br />
                          <small style={{ fontWeight: 400, color: "#9ca3af" }}>
                            or Stalls
                          </small>
                        </th>
                        <th style={{ ...thStyle, width: "18%" }}>
                          # of Desks
                          <br />
                          <small style={{ fontWeight: 400, color: "#9ca3af" }}>
                            or Sinks
                          </small>
                        </th>

                        <th style={{ ...thStyle, width: "18%" }}>
                          # of Rooms
                          <br />
                          <small style={{ fontWeight: 400, color: "#9ca3af" }}>
                            or Restrooms
                          </small>
                        </th>
                      </>
                    ) : (
                      <th style={{ ...thStyle, width: "22%" }}>
                        # of Desks / Trash Cans (Big Buildings)
                        <br />
                        <strong>OR</strong>
                        <br /># of Restrooms
                      </th>
                    )}

                    <th style={{ ...thStyle, width: "26%" }}>
                      Type of Flooring
                      <br />
                      <small style={{ fontWeight: 400, color: "#9ca3af" }}>
                        (Carpet, Hard Floor, VCT)
                      </small>
                    </th>

                    <th style={{ ...thStyle, borderRight: "none" }}>
                      Special Requests / Hot Spots
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {(clientType === "commercial"
                    ? commercialAreas.map((item) => item.name)
                    : getServiceAreasByType(clientType)
                  ).map((area, index) => (
                    <tr key={index}>
                      <td style={tdStyle}>
                        {clientType === "commercial" &&
                        commercialAreas[index]?.editable ? (
                          <div
                            style={{
                              display: "flex",
                              gap: "8px",
                              alignItems: "center",
                            }}
                          >
                            <Input
                              value={commercialAreas[index]?.name}
                              onChange={(e) => {
                                const value = e.target.value;

                                // Update UI state
                                const updated = [...commercialAreas];
                                updated[index].name = value;
                                setCommercialAreas(updated);

                                // ✅ Update form details also
                                const details =
                                  form.getFieldValue("details") || [];

                                details[index] = {
                                  ...details[index],
                                  service_area: value,
                                };

                                form.setFieldsValue({
                                  details,
                                });
                              }}
                            />

                            <AntButton
                              danger
                              type="text"
                              onClick={() => {
                                const updated = commercialAreas.filter(
                                  (_, i) => i !== index,
                                );

                                setCommercialAreas(updated);

                                const details =
                                  form.getFieldValue("details") || [];

                                details.splice(index, 1);

                                form.setFieldsValue({ details });

                                calculateTotal();
                              }}
                            >
                              Delete
                            </AntButton>
                          </div>
                        ) : (
                          <strong>{area}</strong>
                        )}

                        <Form.Item
                          name={["details", index, "service_area"]}
                          initialValue={area}
                          style={{ display: "none" }}
                        >
                          <Input />
                        </Form.Item>
                      </td>

                      {clientType === "commercial" ? (
                        <>
                          {/* Stalls */}
                          <td style={tdStyle}>
                            <Form.Item
                              shouldUpdate={(prev, curr) =>
                                prev.details?.[index]?.stalls !==
                                  curr.details?.[index]?.stalls ||
                                prev.details?.[index]?.restrooms !==
                                  curr.details?.[index]?.restrooms
                              }
                              noStyle
                            >
                              {() => {
                                const stalls =
                                  Number(
                                    form.getFieldValue([
                                      "details",
                                      index,
                                      "stalls",
                                    ]),
                                  ) || 0;
                                const rooms =
                                  Number(
                                    form.getFieldValue([
                                      "details",
                                      index,
                                      "restrooms",
                                    ]),
                                  ) || 0;

                                return (
                                  <>
                                    <Form.Item
                                      name={["details", index, "stalls"]}
                                      initialValue={0}
                                      style={{ marginBottom: 0 }}
                                    >
                                      <InputNumber
                                        min={0}
                                        style={{ width: "100%" }}
                                        onChange={calculateTotal}
                                      />
                                    </Form.Item>

                                    {rooms > 0 && stalls > 0 && (
                                      <div
                                        style={{
                                          marginTop: 4,
                                          fontSize: 12,
                                          color: "#6b7280",
                                          textAlign: "center",
                                          fontWeight: 500,
                                        }}
                                      >
                                        Total: <strong>{rooms * stalls}</strong>
                                      </div>
                                    )}
                                  </>
                                );
                              }}
                            </Form.Item>
                          </td>

                          {/* Sinks */}
                          <td style={tdStyle}>
                            <Form.Item
                              shouldUpdate={(prev, curr) =>
                                prev.details?.[index]?.sinks !==
                                  curr.details?.[index]?.sinks ||
                                prev.details?.[index]?.restrooms !==
                                  curr.details?.[index]?.restrooms
                              }
                              noStyle
                            >
                              {() => {
                                const sinks =
                                  Number(
                                    form.getFieldValue([
                                      "details",
                                      index,
                                      "sinks",
                                    ]),
                                  ) || 0;
                                const rooms =
                                  Number(
                                    form.getFieldValue([
                                      "details",
                                      index,
                                      "restrooms",
                                    ]),
                                  ) || 0;

                                return (
                                  <>
                                    <Form.Item
                                      name={["details", index, "sinks"]}
                                      initialValue={0}
                                      style={{ marginBottom: 0 }}
                                    >
                                      <InputNumber
                                        min={0}
                                        style={{ width: "100%" }}
                                        onChange={calculateTotal}
                                      />
                                    </Form.Item>

                                    {rooms > 0 && sinks > 0 && (
                                      <div
                                        style={{
                                          marginTop: 4,
                                          fontSize: 12,
                                          color: "#6b7280",
                                          textAlign: "center",
                                          fontWeight: 500,
                                        }}
                                      >
                                        Total: <strong>{rooms * sinks}</strong>
                                      </div>
                                    )}
                                  </>
                                );
                              }}
                            </Form.Item>
                          </td>

                          {/* Restrooms */}
                          <td style={tdStyle}>
                            <Form.Item
                              name={["details", index, "restrooms"]}
                              initialValue={0}
                              style={{ marginBottom: 0 }}
                            >
                              <InputNumber
                                min={0}
                                style={{ width: "100%" }}
                                onChange={calculateTotal}
                              />
                            </Form.Item>
                          </td>
                        </>
                      ) : (
                        <td style={tdStyle}>
                          <Form.Item
                            name={["details", index, "num_desks_trash_cans"]}
                            initialValue={0}
                            style={{ marginBottom: 0 }}
                          >
                            <Input
                              type="number"
                              min={0}
                              onChange={calculateTotal}
                            />
                          </Form.Item>
                        </td>
                      )}

                      {/* Flooring */}
                      <td style={tdStyle}>
                        <Form.Item
                          name={["details", index, "flooring_type"]}
                          style={{ marginBottom: 0 }}
                        >
                          <Radio.Group
                            style={{ display: "flex", flexWrap: "nowrap" }}
                          >
                            <Radio value="Carpet">Carpet</Radio>
                            <Radio value="Concrete">Concrete</Radio>
                            <Radio value="VCT/LVT">VCT/LVT</Radio>
                            <Radio value="Tile">Tile</Radio>
                          </Radio.Group>
                        </Form.Item>
                      </td>

                      {/* Special Requests */}
                      <td style={{ ...tdStyle, borderRight: "none" }}>
                        <Form.Item
                          name={["details", index, "special_requests"]}
                          style={{ marginBottom: 0 }}
                        >
                          <Input.TextArea
                            rows={2}
                            placeholder="Enter any special notes"
                          />
                        </Form.Item>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div
              style={{
                marginTop: 16,
                display: "flex",
                justifyContent: "flex-end",
              }}
            >
              <div
                style={{
                  background: "#f5f7fa",
                  border: "1px solid #e5e7eb",
                  borderRadius: "8px",
                  padding: "10px 16px",
                  minWidth: "180px",
                  textAlign: "center",
                }}
              >
                <div style={{ fontSize: 12, color: "#6b7280" }}>
                  Total Count
                </div>
                <div
                  style={{ fontSize: 20, fontWeight: 600, color: "#111827" }}
                >
                  {totalCount}
                </div>
              </div>
            </div>
          </Form.Item>

          <Form.Item style={{ marginTop: "24px", marginBottom: 0 }}>
            <AntButton type="primary" htmlType="submit" loading={loading}>
              Save
            </AntButton>
            <AntButton
              style={{ marginLeft: 8 }}
              onClick={() => navigate("/users")}
            >
              Cancel
            </AntButton>
          </Form.Item>
        </Form>

        <Modal
          title={editingAddress ? "Edit Address" : "Add New Address"}
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
          <Form
            form={addressForm}
            layout="vertical"
            onValuesChange={(changedValues, allValues) => {
              if (changedValues.state_id) {
                addressForm.setFieldsValue({ city_id: undefined }); // reset city
                fetchCities(changedValues.state_id);
              }
              if (changedValues.address) {
                // Build full address string for geocoding
                const fullAddress = `${changedValues.address}, ${
                  states.find((s) => s.id === allValues.state_id)?.name || ""
                }, ${
                  cities.find((c) => c.id === allValues.city_id)?.name || ""
                }`;
                fetchCoordinates(fullAddress);
              }
            }}
          >
            {/* Address Field */}
            <Form.Item
              name="address"
              label="Address"
              rules={[{ required: true, message: "Please enter the address" }]}
            >
              <Input placeholder="Enter address" />
            </Form.Item>

            {/* State Select with Search */}
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
                filterSort={(optionA, optionB) =>
                  optionA.children
                    .toLowerCase()
                    .localeCompare(optionB.children.toLowerCase())
                }
              >
                {states.map((s) => (
                  <Select.Option key={s.id} value={s.id}>
                    {s.name}
                  </Select.Option>
                ))}
              </Select>
            </Form.Item>

            {/* City Select with Search */}
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
                filterSort={(optionA, optionB) =>
                  optionA.children
                    .toLowerCase()
                    .localeCompare(optionB.children.toLowerCase())
                }
              >
                {cities.map((c) => (
                  <Select.Option key={c.id} value={c.id}>
                    {c.name}
                  </Select.Option>
                ))}
              </Select>
            </Form.Item>

            {/* Map Preview */}
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
      </Paper>
    </Box>
  );
};

export default UpdateCustomer;