/** @format */

import React, { useEffect, useState, useCallback } from "react";
import {
  Form,
  Input,
  Button,
  Select,
  Row,
  Col,
  message,
  Modal,
  Radio,
  InputNumber,
} from "antd";
import {
  Box,
  Paper,
  Card,
  Stack,
  IconButton,
  Tooltip,
  Divider,
  Button as MuiButton,
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

const UpdateServiceProvider = () => {
  const [form] = Form.useForm();
  const navigate = useNavigate();
  const { id } = useParams();
  const [states, setStates] = useState([]);
  const [cities, setCities] = useState([]);
  const [coordinates, setCoordinates] = useState({ lat: null, lng: null });
  const [loading, setLoading] = useState(false);
  const [userAddresses, setUserAddresses] = useState([]);

  const [addressModalVisible, setAddressModalVisible] = useState(false);
  const [editingAddress, setEditingAddress] = useState(null);
  const [addressForm] = Form.useForm();
  const [addressCoordinates, setAddressCoordinates] = useState({
    lat: null,
    lng: null,
  });

  // Employees may only ever have a single address on file.
  const hasAddress = (userAddresses?.length || 0) >= 1;

  const navigateToEmployees = () => {
    navigate("/employees");
  };

  useEffect(() => {
    StateAPI(233).then((res) => {
      setStates(res?.data?.data?.all_state || []);
    });
  }, []);

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

      form.setFieldsValue({
        name: data?.user_profile?.name,
        employee_type: data?.employee_type,

        email: data?.email,
        address: checklist?.address,
        state_id,
        city_id: checklist?.city_id,
      });

      if (state_id) fetchCities(state_id);
      if (checklist?.address) fetchCoordinates(checklist.address);
      setUserAddresses(data?.user_address || []);
    });
  }, [id, form]);

  const handleSave = async (values) => {
    setLoading(true);
    const payload = {
      name: values.name,
      employee_type: values.employee_type,

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

    try {
      await EditUserById(id, payload);
      message.success("Employee updated successfully");
      setTimeout(() => navigate("/employees"), 1000);
    } catch (err) {
      console.log(err);
      message.error("Update failed");
    } finally {
      setLoading(false);
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

  return (
    <Box>
      {/* ---- Shared header (matches UpdateCustomer / ServiceProvider / User) ---- */}
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
              EMPLOYEE MANAGEMENT
            </MuiTypography>
            <MuiTypography className="page-sub-title">
              Update Employee Details
            </MuiTypography>
          </Box>

          <MuiButton
            variant="contained"
            disableElevation
            startIcon={<ArrowBackIcon />}
            onClick={navigateToEmployees}
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
            Return to Employees
          </MuiButton>
        </Box>
      </Paper>

      <Paper
        variant="outlined"
        sx={{
          p: 3,
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
          <Row gutter={24}>
            <Col span={8}>
              <Form.Item
                name="name"
                label="Full Name"
                rules={[{ required: true }]}
              >
                <Input />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item name="email" label="Email">
                <Input disabled />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item
                name="employee_type"
                label="Employee Type"
                rules={[
                  {
                    required: true,
                    message: "Please select employee type",
                  },
                ]}
              >
                <Select placeholder="Select Employee Type">
                  <Select.Option value="W2_BI_WEEKLY">
                    W2 Bi-Weekly
                  </Select.Option>

                  <Select.Option value="1099">1099 Contractor</Select.Option>
                </Select>
              </Form.Item>
            </Col>
          </Row>

          {/* Employee Address Card */}
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
                  Employee Address
                </MuiTypography>
              </Box>

              <Tooltip
                title={
                  hasAddress
                    ? "An employee can only have one address. Delete the existing address to add a new one."
                    : ""
                }
              >
                <span>
                  <MuiButton
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
                  </MuiButton>
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
                  No address added yet. This employee can have one address.
                </MuiTypography>
              </Box>
            )}
          </Paper>

          <Form.Item style={{ marginTop: "24px" }}>
            <Button type="primary" htmlType="submit" loading={loading}>
              Save
            </Button>
            <Button
              style={{ marginLeft: 8 }}
              onClick={() => navigate("/employees")}
            >
              Cancel
            </Button>
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
                }, ${cities.find((c) => c.id === allValues.city_id)?.name || ""}`;
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

export default UpdateServiceProvider;